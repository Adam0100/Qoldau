$ErrorActionPreference = 'Stop'
$credentialPath = Join-Path $PSScriptRoot '..\.runtime\database-password.xml'
if (!$env:DB_PASSWORD -and (Test-Path $credentialPath)) {
 $secret = Import-Clixml $credentialPath
 $env:DB_PASSWORD = [System.Net.NetworkCredential]::new('', $secret).Password
}
if (!$env:DB_PASSWORD) { throw 'Set DB_PASSWORD or run backend\database.ps1 first.' }
& "$PSScriptRoot\mvnw.cmd" -B -ntp spring-boot:run

