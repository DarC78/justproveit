param([string]$RepositoryRoot)
$ErrorActionPreference = 'Stop'
if (-not $RepositoryRoot) { $RepositoryRoot = Split-Path -Parent $PSScriptRoot }
$receipt = [System.IO.File]::ReadAllText((Join-Path $RepositoryRoot 'artifacts/email/bani-uk-ai-01-send-receipt.json')) | ConvertFrom-Json
$messageId = [Guid]::Parse($receipt.id).ToString()
$startDate = ([DateTimeOffset]::Parse($receipt.acceptedAt)).UtcDateTime.ToString('yyyy-MM-dd')
$metricsSecret = & az functionapp config appsettings list --name launchingstack-func-dev --resource-group launchingstack-dev-rg --query "[?name=='ResendApiKey'].value | [0]" --output tsv
if ($LASTEXITCODE -ne 0 -or -not $metricsSecret.StartsWith('re_')) { throw 'Existing Resend configuration is unavailable.' }
try {
    $report = Invoke-RestMethod -Uri "https://api.resend.com/emails/metrics?start_date=$startDate&email_id=$messageId&metrics=sent,delivered,unique_opened,unique_clicked,open_rate,click_rate" -Headers @{Authorization="Bearer $metricsSecret"}
    $measured = $receipt.trackingAtSend -eq $true
    $summary = [ordered]@{ emailId=$messageId; sent=$report.totals.sent; delivered=$report.totals.delivered; trackingAvailable=$measured; uniqueOpened=$null; uniqueClicked=$null; openRate=$null; clickThroughRate=$null }
    if ($measured) {
        $summary.uniqueOpened=$report.totals.unique_opened
        $summary.uniqueClicked=$report.totals.unique_clicked
        $summary.openRate=$report.totals.open_rate
        $summary.clickThroughRate=$report.totals.click_rate
    }
    [System.IO.File]::WriteAllText((Join-Path $RepositoryRoot 'artifacts/email/bani-uk-ai-01-metrics.json'), ($summary | ConvertTo-Json -Depth 10), [System.Text.UTF8Encoding]::new($false))
    $summary | ConvertTo-Json
} finally { $metricsSecret=$null }
