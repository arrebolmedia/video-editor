# Script completo de configuración automática
# EJECUTAR COMO ADMINISTRADOR

Write-Host "=== CONFIGURACIÓN AUTOMÁTICA DE POSTGRESQL ===" -ForegroundColor Green
Write-Host ""

$pgDataDir = "C:\Program Files\PostgreSQL\16\data"
$pgHbaFile = "$pgDataDir\pg_hba.conf"
$backupFile = "$pgDataDir\pg_hba.conf.backup"
$psqlPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
$nuevaPassword = "postgres123"  # Contraseña temporal

# Verificar admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host "Click derecho en PowerShell → 'Ejecutar como administrador'" -ForegroundColor Yellow
    pause
    exit 1
}

try {
    Write-Host "[1/7] Haciendo backup de configuración..." -ForegroundColor Cyan
    Copy-Item $pgHbaFile $backupFile -Force -ErrorAction Stop
    
    Write-Host "[2/7] Configurando acceso temporal sin contraseña..." -ForegroundColor Cyan
    $content = Get-Content $pgHbaFile
    $newContent = $content -replace 'scram-sha-256', 'trust' -replace 'md5', 'trust'
    $newContent | Set-Content $pgHbaFile
    
    Write-Host "[3/7] Reiniciando PostgreSQL..." -ForegroundColor Cyan
    Restart-Service -Name "postgresql-x64-16" -Force
    Start-Sleep -Seconds 5
    
    Write-Host "[4/7] Estableciendo contraseña del usuario postgres..." -ForegroundColor Cyan
    & $psqlPath -U postgres -c "ALTER USER postgres WITH PASSWORD '$nuevaPassword';"
    
    Write-Host "[5/7] Creando base de datos y usuario de la aplicación..." -ForegroundColor Cyan
    & $psqlPath -U postgres -c "DROP DATABASE IF EXISTS wedding_planner;"
    & $psqlPath -U postgres -c "CREATE DATABASE wedding_planner;"
    & $psqlPath -U postgres -c "DROP USER IF EXISTS \`"anthony@arrebolweddings.com\`";"
    & $psqlPath -U postgres -c "CREATE USER \`"anthony@arrebolweddings.com\`" WITH PASSWORD 'Lalo9513.-';"
    & $psqlPath -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE wedding_planner TO \`"anthony@arrebolweddings.com\`";"
    & $psqlPath -U postgres -d wedding_planner -c "GRANT ALL ON SCHEMA public TO \`"anthony@arrebolweddings.com\`";"
    
    Write-Host "[6/7] Ejecutando schema de la base de datos..." -ForegroundColor Cyan
    & $psqlPath -U postgres -d wedding_planner -f "server\db\schema.sql"
    
    Write-Host "[7/7] Restaurando seguridad..." -ForegroundColor Cyan
    Copy-Item $backupFile $pgHbaFile -Force
    Restart-Service -Name "postgresql-x64-16" -Force
    Start-Sleep -Seconds 5
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ ¡CONFIGURACIÓN COMPLETADA!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Credenciales PostgreSQL:" -ForegroundColor Yellow
    Write-Host "  Usuario admin: postgres" -ForegroundColor White
    Write-Host "  Contraseña admin: $nuevaPassword" -ForegroundColor White
    Write-Host ""
    Write-Host "Credenciales de la aplicación (ya configuradas en .env):" -ForegroundColor Yellow
    Write-Host "  Usuario: anthony@arrebolweddings.com" -ForegroundColor White
    Write-Host "  Contraseña: Lalo9513.-" -ForegroundColor White
    Write-Host "  Base de datos: wedding_planner" -ForegroundColor White
    Write-Host ""
    Write-Host "Ahora puedes ejecutar: npm run dev" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "ERROR: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Restaurando configuración..." -ForegroundColor Yellow
    if (Test-Path $backupFile) {
        Copy-Item $backupFile $pgHbaFile -Force
        Restart-Service -Name "postgresql-x64-16" -Force
    }
    exit 1
}

pause
