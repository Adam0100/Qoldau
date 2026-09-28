$ErrorActionPreference = 'Stop'
$runtime = Join-Path $PSScriptRoot '..\.runtime'
$maven = Join-Path $runtime 'apache-maven-3.9.9\bin\mvn.cmd'
if (!(Test-Path $maven)) {
 New-Item -ItemType Directory -Force $runtime | Out-Null
 $url = 'https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.9/apache-maven-3.9.9-bin.zip'
 $zip = Join-Path $runtime 'maven.zip'
 Invoke-WebRequest $url -OutFile $zip
 $expected = (Invoke-WebRequest "$url.sha512" -UseBasicParsing).Content.Trim().Split(' ')[0]
 if ((Get-FileHash $zip -Algorithm SHA512).Hash -ne $expected) { throw 'Maven checksum mismatch' }
 Expand-Archive $zip -DestinationPath $runtime -Force
}
Push-Location $PSScriptRoot
try { & $maven @args; exit $LASTEXITCODE } finally { Pop-Location }

