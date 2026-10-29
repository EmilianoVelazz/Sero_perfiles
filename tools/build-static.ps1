$projectRoot = Split-Path -Parent $PSScriptRoot
$esbuild = Join-Path $projectRoot 'node_modules\@esbuild\win32-x64\esbuild.exe'
$assets = Join-Path $projectRoot 'dist\assets'
$entry = Join-Path $projectRoot 'src\main.jsx'

if (-not (Test-Path -LiteralPath $esbuild)) {
  throw 'No se encontró esbuild. Ejecuta npm install antes de compilar.'
}

New-Item -ItemType Directory -Force -Path $assets | Out-Null

# Ejecutamos esbuild directamente desde PowerShell. Evita el bloqueo de
# procesos secundarios de Node que impide usar Vite en este equipo.
& $esbuild $entry '--bundle' '--format=esm' '--target=es2020' '--splitting' "--outdir=$assets" '--entry-names=app' '--chunk-names=chunks/[name]-[hash]' '--asset-names=assets/[name]-[hash]'
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$html = @'
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#087c5d" />
    <title>Registro de Seroperfiles</title>
    <link rel="stylesheet" href="/assets/app.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/app.js"></script>
  </body>
</html>
'@

Set-Content -LiteralPath (Join-Path $projectRoot 'dist\index.html') -Value $html -Encoding utf8
Write-Host 'Aplicación compilada en dist.'
