$ErrorActionPreference = 'Stop'
$BackendRoot = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $BackendRoot '.env'
if (-not (Test-Path $EnvFile)) { throw 'Crea backend/.env desde backend/.env.example antes de inicializar la base de datos.' }
$PgTools = @('psql', 'createdb')
foreach ($Tool in $PgTools) {
  if (-not (Get-Command $Tool -ErrorAction SilentlyContinue)) { throw "No se encuentra $Tool en PATH. Instala PostgreSQL y vuelve a abrir PowerShell." }
}
foreach ($Line in Get-Content $EnvFile) {
  if ($Line -match '^\s*([^#=]+)=(.*)$') {
    [Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim(), 'Process')
  }
}
if (-not $env:DB_NAME -or -not $env:DB_USER -or -not $env:DB_HOST -or -not $env:DB_PASSWORD) { throw 'Completa DB_NAME, DB_USER, DB_HOST y DB_PASSWORD en backend/.env.' }
$env:PGPASSWORD = $env:DB_PASSWORD
$DbNameLiteral = $env:DB_NAME.Replace("'", "''")
$Existing = & psql -h $env:DB_HOST -p $env:DB_PORT -U $env:DB_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$DbNameLiteral'"
if ($LASTEXITCODE -ne 0) { throw 'No se pudo conectar a PostgreSQL. Revisa el servicio y las variables DB_*.' }
if ($Existing.Trim() -ne '1') { & createdb -h $env:DB_HOST -p $env:DB_PORT -U $env:DB_USER $env:DB_NAME; if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear la base indicada en DB_NAME.' } }
$SqlFiles = @((Join-Path $BackendRoot 'src/db/init.sql'), (Join-Path $BackendRoot 'src/db/seed.sql'))
foreach ($SqlFile in $SqlFiles) {
  & psql -v ON_ERROR_STOP=1 -h $env:DB_HOST -p $env:DB_PORT -U $env:DB_USER -d $env:DB_NAME -f $SqlFile
  if ($LASTEXITCODE -ne 0) { throw "Falló el script $SqlFile" }
}
Remove-Item Env:PGPASSWORD
Write-Host "Base de datos '$env:DB_NAME' inicializada con esquema y seed."
