$ErrorActionPreference = 'Stop'
$BackendRoot = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $BackendRoot '.env'
if (-not (Test-Path $EnvFile)) { throw 'Crea backend/.env desde backend/.env.example antes de inicializar la base de datos.' }
if (-not (Get-Command 'psql' -ErrorAction SilentlyContinue)) {
  $PostgresRoot = Join-Path $env:ProgramFiles 'PostgreSQL'
  $PostgresBin = Get-ChildItem $PostgresRoot -Directory -ErrorAction SilentlyContinue |
    Sort-Object { try { [version]$_.Name } catch { [version]'0.0' } } -Descending |
    ForEach-Object { Join-Path $_.FullName 'bin' } |
    Where-Object { Test-Path (Join-Path $_ 'psql.exe') } |
    Select-Object -First 1
  if ($PostgresBin) { $env:Path = "$PostgresBin;$env:Path" }
}
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
if (-not $env:DB_PORT) { $env:DB_PORT = '5432' }
if ($env:DB_PORT -notmatch '^\d+$') { throw 'DB_PORT debe ser un número, normalmente 5432.' }
$PreviousPgPassword = $env:PGPASSWORD
$PreviousPgClientEncoding = $env:PGCLIENTENCODING
try {
  $env:PGPASSWORD = $env:DB_PASSWORD
  # Los archivos .sql están guardados en UTF-8. Fijar la codificación del
  # cliente evita errores de conversión en Windows (por ejemplo, WIN1252).
  $env:PGCLIENTENCODING = 'UTF8'
  $DbNameLiteral = $env:DB_NAME.Replace("'", "''")
  $Existing = & psql -h $env:DB_HOST -p $env:DB_PORT -U $env:DB_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$DbNameLiteral'"
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo conectar a PostgreSQL. Revisa el servicio y las variables DB_*.' }
  $ExistingValue = @($Existing) -join ''
  if ($ExistingValue.Trim() -ne '1') { & createdb -h $env:DB_HOST -p $env:DB_PORT -U $env:DB_USER $env:DB_NAME; if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear la base indicada en DB_NAME. Verifica que el usuario tenga permiso para crear bases de datos.' } }
  $SqlFiles = @((Join-Path $BackendRoot 'src/db/init.sql'), (Join-Path $BackendRoot 'src/db/seed.sql'))
  foreach ($SqlFile in $SqlFiles) {
    & psql -v ON_ERROR_STOP=1 -h $env:DB_HOST -p $env:DB_PORT -U $env:DB_USER -d $env:DB_NAME -f $SqlFile
    if ($LASTEXITCODE -ne 0) { throw "Falló el script $SqlFile" }
  }
  Write-Host "Base de datos '$env:DB_NAME' inicializada con esquema y seed."
}
finally {
  if ($null -eq $PreviousPgPassword) { Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue } else { $env:PGPASSWORD = $PreviousPgPassword }
  if ($null -eq $PreviousPgClientEncoding) { Remove-Item Env:PGCLIENTENCODING -ErrorAction SilentlyContinue } else { $env:PGCLIENTENCODING = $PreviousPgClientEncoding }
}
