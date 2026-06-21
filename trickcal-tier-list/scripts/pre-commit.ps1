$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + `
  [System.Environment]::GetEnvironmentVariable('Path', 'User')
$env:SAM_CLI_TELEMETRY = '0'

npm run precommit:check
