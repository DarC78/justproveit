param([switch]$Send)

$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$payloadPath = Join-Path $repositoryRoot 'artifacts/email/bani-uk-ai-01-resend.json'
$payloadText = [System.IO.File]::ReadAllText($payloadPath)
$payload = $payloadText | ConvertFrom-Json
if (@($payload.to).Count -ne 1 -or $payload.to[0] -ne 'adrian@proveitweb.co.uk') {
    throw 'This script only sends the owner-requested test to adrian@proveitweb.co.uk.'
}
if (-not $payload.subject.StartsWith('[TEST] ') -or $payload.html -match 'PREVIZUALIZARE|\{\{') {
    throw 'A rendered test without placeholders is required.'
}
$images = [regex]::Matches($payload.html, '<img[^>]+src="([^"]+)"')
if ($images.Count -ne 5) { throw 'Expected opening image, two postscript images, Trustpilot image and portrait.' }
foreach ($match in $images) {
    $imageUrl = [System.Net.WebUtility]::HtmlDecode($match.Groups[1].Value)
    if (-not $imageUrl.StartsWith('https://www.justproveit.co.uk/email-assets/bani-uk-ai/')) {
        throw 'Unexpected image host or directory.'
    }
    $imageResponse = Invoke-WebRequest -Uri $imageUrl -Method Head -UseBasicParsing
    if ($imageResponse.StatusCode -ne 200 -or $imageResponse.Headers['Content-Type'] -notmatch '^image/') {
        throw 'An email image is not yet publicly available.'
    }
}
if ([regex]::Matches($payload.html, 'data-role="primary-cta"').Count -ne 1) {
    throw 'Exactly one main campaign button is required.'
}
if (-not $Send) {
    Write-Output 'Test validated: one recipient, one main CTA and five publicly available images. No email sent.'
    exit 0
}

# Reuse the existing application's Resend integration. Keep credentials in memory;
# never write them to files, environment variables, CLI arguments or logs.
$resendSettings = & az functionapp config appsettings list --name launchingstack-func-dev --resource-group launchingstack-dev-rg --query "[?name=='ResendApiKey' || name=='RESEND_FROM_EMAIL']" --output json | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { throw 'Could not read the existing Resend configuration.' }
$resendSecret = ($resendSettings | Where-Object { $_.name -eq 'ResendApiKey' }).value
$resendSender = ($resendSettings | Where-Object { $_.name -eq 'RESEND_FROM_EMAIL' }).value
if (-not $resendSecret -or -not $resendSecret.StartsWith('re_')) { throw 'Existing Resend credential is unavailable.' }
if ($resendSender -ne 'adrian@mail.justproveit.co.uk' -or $payload.from -ne "Adrian Defta <$resendSender>") {
    throw 'The test sender does not match the existing Resend sender.'
}
$sha = [System.Security.Cryptography.SHA256]::Create()
try { $fingerprint = ([System.BitConverter]::ToString($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($payloadText)))).Replace('-', '').ToLowerInvariant() }
finally { $sha.Dispose() }
$headers = @{ Authorization = "Bearer $resendSecret"; 'Idempotency-Key' = "proveit-email01-owner-test-$fingerprint" }
try {
    $result = Invoke-RestMethod -Uri 'https://api.resend.com/emails' -Method Post -Headers $headers -ContentType 'application/json; charset=utf-8' -Body ([System.Text.Encoding]::UTF8.GetBytes($payloadText))
    if (-not $result.id) { throw 'Resend returned no message ID.' }
    $receipt = [ordered]@{ id = $result.id; recipient = $payload.to[0]; subject = $payload.subject; acceptedAt = [DateTime]::UtcNow.ToString('o'); status = 'accepted' }
    $receiptPath = Join-Path $repositoryRoot 'artifacts/email/bani-uk-ai-01-send-receipt.json'
    [System.IO.File]::WriteAllText($receiptPath, ($receipt | ConvertTo-Json), [System.Text.UTF8Encoding]::new($false))
    Write-Output ($receipt | ConvertTo-Json -Compress)
} catch {
    throw ('Resend test send failed: ' + $_.Exception.Message)
} finally {
    $headers.Clear()
    $resendSecret = $null
    $resendSettings = $null
}
