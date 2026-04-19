param(
  [string]$SettingsPath = "local.setting.json"
)

$ErrorActionPreference = "Stop"

function Read-SettingValue {
  param(
    [Parameter(Mandatory = $true)] $Settings,
    [Parameter(Mandatory = $true)] [string[]] $Names
  )

  foreach ($name in $Names) {
    if ($Settings.PSObject.Properties.Name -contains $name) {
      $value = $Settings.$name
      if ($value) {
        return [string]$value
      }
    }

    if ($Settings.Values -and $Settings.Values.PSObject.Properties.Name -contains $name) {
      $value = $Settings.Values.$name
      if ($value) {
        return [string]$value
      }
    }
  }

  return ""
}

function Invoke-Api {
  param(
    [Parameter(Mandatory = $true)] [string]$Method,
    [Parameter(Mandatory = $true)] [string]$Path,
    $Body = $null
  )

  $headers = @{ Authorization = "Bearer $token" }
  $uri = "$apiBase$Path"

  if ($null -eq $Body) {
    return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
  }

  return Invoke-RestMethod `
    -Method $Method `
    -Uri $uri `
    -Headers $headers `
    -ContentType "application/json" `
    -Body ($Body | ConvertTo-Json -Depth 8)
}

$candidatePaths = @(
  $SettingsPath,
  "local.settings.json",
  ".env.local.json"
) | Select-Object -Unique

$settingsFile = $candidatePaths | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

if (-not $settingsFile) {
  throw "No local setting file found. Create local.setting.json with Values.JPI_ADMIN_TOKEN."
}

$settings = Get-Content -LiteralPath $settingsFile -Raw | ConvertFrom-Json
$token = Read-SettingValue $settings @(
  "JPI_ADMIN_TOKEN",
  "JUSTPROVEIT_ADMIN_TOKEN",
  "ADMIN_ACCESS_TOKEN",
  "ACCESS_TOKEN"
)
$apiBase = Read-SettingValue $settings @(
  "NEXT_PUBLIC_API_BASE_URL",
  "VITE_API_BASE_URL",
  "API_BASE_URL"
)

if (-not $apiBase) {
  $apiBase = "https://launchingstack-func-dev.azurewebsites.net/api"
}

$apiBase = $apiBase.TrimEnd("/")

if (-not $token) {
  throw "No admin token found in $settingsFile. Add Values.JPI_ADMIN_TOKEN."
}

$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$repliedThreadKey = "thread:codex-payload-check-replied-$stamp"
$skippedThreadKey = "thread:codex-payload-check-skipped-$stamp"

Write-Host "Using settings: $settingsFile"
Write-Host "API base: $apiBase"
Write-Host "Checking admin profile..."
$admin = Invoke-Api "GET" "/justproveit/admin/me"
Write-Host "Admin OK: $($admin.user.email)"

Write-Host "Checking existing thread-state endpoints..."
$null = Invoke-Api "GET" "/justproveit/admin/generic-reports/thread-state/replied"
$null = Invoke-Api "GET" "/justproveit/admin/generic-reports/thread-state/skipped"
Write-Host "Thread-state GET OK."

Write-Host "Posting replied payload..."
$replied = Invoke-Api "POST" "/justproveit/admin/generic-reports/thread-state/replied" @{
  threadKey = $repliedThreadKey
  recipientEmail = "codex-payload-check@example.com"
  subject = "Codex payload check replied $stamp"
}

Write-Host "Posting skipped payload..."
$skipped = Invoke-Api "POST" "/justproveit/admin/generic-reports/thread-state/skipped" @{
  threadKey = $skippedThreadKey
  senderEmail = "codex-payload-check@example.com"
  subject = "Codex payload check skipped $stamp"
}

$repliedKeys = @($replied.threadKeys)
$skippedKeys = @($skipped.threadKeys)

Write-Host "POST replied OK: $($repliedKeys -contains $repliedThreadKey)"
Write-Host "POST skipped OK: $($skippedKeys -contains $skippedThreadKey)"

if (($repliedKeys -notcontains $repliedThreadKey) -or ($skippedKeys -notcontains $skippedThreadKey)) {
  throw "Thread-state response did not echo one or both synthetic keys."
}

Write-Host "GenericReports thread-state payload check passed."
