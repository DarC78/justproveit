param([switch]$Enable, [string]$RepositoryRoot)
$ErrorActionPreference = 'Stop'
if (-not $RepositoryRoot) { $RepositoryRoot = Split-Path -Parent $PSScriptRoot }
$domainId = '4c211916-31cb-4f5f-8ec6-cded4a614906'
$domainName = 'mail.justproveit.co.uk'
$trackingName = 'links.mail.justproveit.co.uk'
$trackingTarget = 'links2.resend-dns.com'
$trackingSecret = & az functionapp config appsettings list --name launchingstack-func-dev --resource-group launchingstack-dev-rg --query "[?name=='ResendApiKey'].value | [0]" --output tsv
if ($LASTEXITCODE -ne 0 -or -not $trackingSecret.StartsWith('re_')) { throw 'Existing Resend configuration is unavailable.' }
$trackingHeaders = @{ Authorization = "Bearer $trackingSecret" }
try {
    $domain = Invoke-RestMethod -Uri "https://api.resend.com/domains/$domainId" -Headers $trackingHeaders
    if ($domain.name -ne $domainName) { throw 'Unexpected Resend sending domain.' }
    if ($Enable) {
        $cname = Resolve-DnsName -Name $trackingName -Type CNAME -ErrorAction SilentlyContinue
        if (-not ($cname | Where-Object { $_.NameHost.TrimEnd('.') -eq $trackingTarget })) {
            throw 'Cloudflare CNAME is not published: links.mail -> links2.resend-dns.com, DNS only, TTL Auto.'
        }
        $record = $domain.records | Where-Object { $_.record -eq 'Tracking' }
        if (-not $record -or $record.status -ne 'verified') {
            $null = Invoke-RestMethod -Uri "https://api.resend.com/domains/$domainId/verify" -Method Post -Headers $trackingHeaders
            $domain = Invoke-RestMethod -Uri "https://api.resend.com/domains/$domainId" -Headers $trackingHeaders
            $record = $domain.records | Where-Object { $_.record -eq 'Tracking' }
        }
        if (-not $record -or $record.status -ne 'verified') { throw 'Resend tracking DNS verification is still pending. Retry after verification completes.' }
        $null = Invoke-RestMethod -Uri "https://api.resend.com/domains/$domainId" -Method Patch -Headers $trackingHeaders -ContentType 'application/json' -Body '{"open_tracking":true,"click_tracking":true}'
        $domain = Invoke-RestMethod -Uri "https://api.resend.com/domains/$domainId" -Headers $trackingHeaders
        if (-not $domain.open_tracking -or -not $domain.click_tracking) { throw 'Tracking settings were not enabled.' }
    }
    $state = [ordered]@{ domain=$domain.name; domainId=$domainId; openTracking=$domain.open_tracking; clickTracking=$domain.click_tracking; trackingSubdomain=$domain.tracking_subdomain; trackingRecords=@($domain.records | Where-Object {$_.record -eq 'Tracking'} | Select-Object record,name,type,value,status); checkedAt=[DateTime]::UtcNow.ToString('o') }
    [System.IO.File]::WriteAllText((Join-Path $RepositoryRoot 'artifacts/email/bani-uk-ai-tracking-status.json'), ($state | ConvertTo-Json -Depth 5), [System.Text.UTF8Encoding]::new($false))
    $state | ConvertTo-Json -Depth 5
} finally {
    $trackingHeaders.Clear()
    $trackingSecret = $null
}
