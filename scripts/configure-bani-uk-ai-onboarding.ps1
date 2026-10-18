param([switch]$Activate)
$ErrorActionPreference = 'Stop'
# Configuration only: application code must still deploy through GitHub.
# Secrets remain in memory and encrypted Azure app settings, never files/argv.
$sourceSettings = & az functionapp config appsettings list --name launchingstack-func-dev --resource-group launchingstack-dev-rg --query "[?name=='PROVEIT_STRIPE_SECRET_KEY' || name=='ResendApiKey' || name=='AzureWebJobsStorage']" --output json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { throw 'Cannot read existing integrations.' }
$stripeSecret = ($sourceSettings | Where-Object name -eq 'PROVEIT_STRIPE_SECRET_KEY').value
$resendSecret = ($sourceSettings | Where-Object name -eq 'ResendApiKey').value
$storageSecret = ($sourceSettings | Where-Object name -eq 'AzureWebJobsStorage').value
if (-not $stripeSecret -or -not $resendSecret -or -not $storageSecret) { throw 'Missing existing integration configuration.' }
$resourceId = & az staticwebapp show --name justproveit --resource-group justproveit-rg --query id --output tsv
$accessToken = & az account get-access-token --resource https://management.azure.com/ --query accessToken --output tsv
$settings = & az staticwebapp appsettings list --name justproveit --resource-group justproveit-rg --output json | ConvertFrom-Json
$properties = @{}
$settings.properties.PSObject.Properties | ForEach-Object { $properties[$_.Name] = $_.Value }
$properties['BANI_UK_AI_STRIPE_SECRET_KEY'] = $stripeSecret
$properties['BANI_UK_AI_RESEND_API_KEY'] = $resendSecret
$properties['BANI_UK_AI_STORAGE_CONNECTION'] = $storageSecret
$stripeHeaders = @{Authorization=('Bearer '+$stripeSecret)}
try {
    if ($Activate) {
        $health = Invoke-RestMethod 'https://www.justproveit.co.uk/api/bani-uk-ai/capacity'
        if ($health.capacity -ne 100) { throw 'Deploy and verify the course API before activation.' }
        $endpointUrl = 'https://www.justproveit.co.uk/api/bani-uk-ai/webhook'
        $endpoints = Invoke-RestMethod 'https://api.stripe.com/v1/webhook_endpoints?limit=100' -Headers $stripeHeaders
        $existing = $endpoints.data | Where-Object { $_.url -eq $endpointUrl } | Select-Object -First 1
        if (-not $existing) {
            $endpoint = Invoke-RestMethod 'https://api.stripe.com/v1/webhook_endpoints' -Method Post -Headers $stripeHeaders -Body @{url=$endpointUrl; 'enabled_events[0]'='checkout.session.completed'; 'enabled_events[1]'='checkout.session.async_payment_succeeded'; description='JustProveIt Bani UK AI paid onboarding'}
            $properties['BANI_UK_AI_WEBHOOK_SECRET'] = $endpoint.secret
            $properties['BANI_UK_AI_WEBHOOK_ENDPOINT_ID'] = $endpoint.id
        } elseif (-not $properties['BANI_UK_AI_WEBHOOK_SECRET']) { throw 'An existing endpoint needs its original signing secret; do not create a duplicate.' }
    }
    $body = @{properties=$properties} | ConvertTo-Json -Depth 8 -Compress
    $null = Invoke-RestMethod -Method Put -Uri ('https://management.azure.com'+$resourceId+'/config/appsettings?api-version=2023-12-01') -Headers @{Authorization=('Bearer '+$accessToken)} -ContentType 'application/json' -Body ([Text.Encoding]::UTF8.GetBytes($body))
    if ($Activate) {
        $update = @{ 'after_completion[type]'='redirect'; 'after_completion[redirect][url]'='https://www.justproveit.co.uk/bani-uk-multumim/?session_id={CHECKOUT_SESSION_ID}'; 'restrictions[completed_sessions][limit]'='100'; 'custom_text[submit][message]'='Poți anula înscrierea în 14 zile de la cumpărare, fără motiv. Trimite cererea la adriandefta@proveitweb.co.uk. Detalii: https://www.justproveit.co.uk/bani-uk-multumim/' }
        $link = Invoke-RestMethod 'https://api.stripe.com/v1/payment_links/plink_1URr5mCtvr7Xjh2glmk6zJmm' -Method Post -Headers $stripeHeaders -Body $update
        Write-Output (@{redirectConfigured=($link.after_completion.type -eq 'redirect'); capacityLimit=$link.restrictions.completed_sessions.limit; webhookConfigured=$true; receiptsSetting='Verify Successful payments in Stripe Dashboard; not changed by this script'} | ConvertTo-Json -Compress)
    } else { Write-Output 'Course API configuration saved. Deploy through GitHub, then run with -Activate.' }
} finally {
    $stripeHeaders.Clear(); $properties.Clear(); $stripeSecret=$null; $resendSecret=$null; $storageSecret=$null; $accessToken=$null; $sourceSettings=$null; $settings=$null; $body=$null
}
