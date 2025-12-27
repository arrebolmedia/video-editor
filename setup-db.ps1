# Script mejorado para configurar PostgreSQL
Write-Host "Configurando PostgreSQL para Wedding Video Planner..." -ForegroundColor Green
Write-Host ""

# Solicitar contraseña de postgres
$postgresPassword = Read-Host "Ingresa la contraseña del usuario 'postgres'"

$psqlPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe"

# Crear archivo temporal con comandos SQL
$sqlCommands = @"
CREATE DATABASE wedding_planner;
CREATE USER "anthony@arrebolweddings.com" WITH PASSWORD 'Lalo9513.-';
GRANT ALL PRIVILEGES ON DATABASE wedding_planner TO "anthony@arrebolweddings.com";
\c wedding_planner
GRANT ALL ON SCHEMA public TO "anthony@arrebolweddings.com";
"@

$tempSqlFile = "$env:TEMP\setup_wedding_db.sql"
$sqlCommands | Out-File -FilePath $tempSqlFile -Encoding UTF8

Write-Host "Ejecutando configuración de base de datos..." -ForegroundColor Cyan

# Ejecutar con la contraseña
$env:PGPASSWORD = $postgresPassword
& $psqlPath -U postgres -f $tempSqlFile
& $psqlPath -U postgres -d wedding_planner -f "server\db\schema.sql"
$env:PGPASSWORD = $null

# Limpiar archivo temporal
Remove-Item $tempSqlFile -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✓ ¡Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "Credenciales configuradas:" -ForegroundColor Yellow
Write-Host "  Usuario: anthony@arrebolweddings.com"
Write-Host "  Contraseña: Lalo9513.-"
Write-Host "  Base de datos: wedding_planner"
Write-Host ""
Write-Host "Inicia la aplicación con: npm run dev" -ForegroundColor Cyan
