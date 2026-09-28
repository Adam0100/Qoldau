param([ValidateSet('start','stop','status')][string]$Action='start')
$ErrorActionPreference = 'Stop'
$runtime = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\.runtime'))
New-Item -ItemType Directory -Force $runtime | Out-Null
# initdb on Windows can fail with UTF-8 databases when its paths contain Cyrillic.
$runtime = (New-Object -ComObject Scripting.FileSystemObject).GetFolder($runtime).ShortPath
$bin = Join-Path $runtime 'pgsql\bin'
$data = Join-Path $runtime 'pgdata'
if ($Action -eq 'stop') { & "$bin\pg_ctl.exe" -D $data stop -m fast; exit $LASTEXITCODE }
if ($Action -eq 'status') { & "$bin\pg_ctl.exe" -D $data status; exit $LASTEXITCODE }
New-Item -ItemType Directory -Force $runtime | Out-Null
if (!(Test-Path "$bin\pg_ctl.exe")) {
 $zip = Join-Path $runtime 'postgresql.zip'
 if (!(Test-Path $zip)) {
  Invoke-WebRequest 'https://get.enterprisedb.com/postgresql/postgresql-16.9-1-windows-x64-binaries.zip' -OutFile $zip
 }
 Expand-Archive $zip -DestinationPath $runtime -Force
}
$credentialPath = Join-Path $runtime 'database-password.xml'
if (!(Test-Path "$data\PG_VERSION")) {
 $storedSecret = if (Test-Path $credentialPath) { Import-Clixml $credentialPath } else { $null }
 if (!$storedSecret -or $storedSecret.Length -eq 0) {
  $bytes = New-Object byte[] 32
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $rng.GetBytes($bytes)
  $rng.Dispose()
  $secret = ConvertTo-SecureString ([Convert]::ToBase64String($bytes)) -AsPlainText -Force
  $secret | Export-Clixml $credentialPath
 }
 $secret = Import-Clixml $credentialPath
 $password = [System.Net.NetworkCredential]::new('', $secret).Password
 $passwordFile = Join-Path $runtime 'init-password.tmp'
 try {
  [IO.File]::WriteAllText($passwordFile,$password)
  & "$bin\initdb.exe" -D $data -U qoldau --auth=scram-sha-256 "--pwfile=$passwordFile" --encoding=UTF8 --locale=C
  if ($LASTEXITCODE -ne 0) { throw 'initdb failed' }
 } finally { if (Test-Path $passwordFile) { Remove-Item -LiteralPath $passwordFile } }
 Add-Content "$data\postgresql.conf" "`nlisten_addresses = 'localhost'`nport = 5433"
}
& "$bin\pg_ctl.exe" -D $data status *> $null
if ($LASTEXITCODE -ne 0) {
 & "$bin\pg_ctl.exe" -D $data -l (Join-Path $runtime 'postgres.log') -w start
 if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL start failed' }
}
$secret = Import-Clixml $credentialPath
$env:PGPASSWORD = [System.Net.NetworkCredential]::new('', $secret).Password
try {
 $exists = & "$bin\psql.exe" -h localhost -p 5433 -U qoldau -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='qoldau'"
 if ($LASTEXITCODE -ne 0) { throw 'Database connection failed' }
 if ($exists -ne '1') {
  & "$bin\createdb.exe" -h localhost -p 5433 -U qoldau qoldau
  if ($LASTEXITCODE -ne 0) { throw 'createdb failed' }
 }
} finally { Remove-Item Env:\PGPASSWORD }
Write-Host 'PostgreSQL 16 ready: localhost:5433/qoldau. Password is stored with Windows DPAPI in ignored .runtime.'

