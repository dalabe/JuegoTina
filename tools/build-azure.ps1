# Genera dist/azure-deploy.zip para publicar en Azure App Service (Windows) con Zip Deploy.
# Solo incluye los archivos del juego (no las fotos personales de /Bella y /Tina).
#   powershell -ExecutionPolicy Bypass -File tools/build-azure.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$stage = Join-Path $env:TEMP 'juegotina-azure'
$out = Join-Path $root 'dist\azure-deploy.zip'

if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Force "$stage\maps", (Split-Path $out) | Out-Null

Copy-Item "$root\index.html", "$root\web.config" $stage
Copy-Item "$root\css", "$root\js" $stage -Recurse
# Solo los planos que usa js/data/floors.js
Select-String -Path "$root\js\data\floors.js" -Pattern "plan:\s*'(maps/[^']+)'" -AllMatches |
  ForEach-Object { $_.Matches } | ForEach-Object { Copy-Item (Join-Path $root $_.Groups[1].Value) "$stage\maps" }

if (Test-Path $out) { Remove-Item $out -Force }
# tar genera rutas con "/" (Compress-Archive usa "\" y Kudu puede fallar)
tar -a -c -f $out -C $stage index.html web.config css js maps
Remove-Item $stage -Recurse -Force
Write-Host ("Listo: dist\azure-deploy.zip ({0:N2} MB)" -f ((Get-Item $out).Length / 1MB))
