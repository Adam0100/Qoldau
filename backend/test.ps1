$ErrorActionPreference = 'Stop'
$secret = Import-Clixml (Join-Path $PSScriptRoot '..\.runtime\database-password.xml')
$env:DB_PASSWORD = [System.Net.NetworkCredential]::new('', $secret).Password
$env:PGPASSWORD = $env:DB_PASSWORD
$bin = Join-Path $PSScriptRoot '..\.runtime\pgsql\bin'
try {
 $exists = & "$bin\psql.exe" -h localhost -p 5433 -U qoldau -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='qoldau_test'"
 if ($LASTEXITCODE -ne 0) { throw 'Start PostgreSQL with database.ps1 first' }
 if ($exists -ne '1') { & "$bin\createdb.exe" -h localhost -p 5433 -U qoldau qoldau_test }
} finally { Remove-Item Env:\PGPASSWORD }
& "$PSScriptRoot\mvnw.cmd" -B -ntp test
exit $LASTEXITCODE

