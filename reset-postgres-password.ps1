# Script para resetear la contraseña de PostgreSQL
Write-Host "Reseteando contraseña de PostgreSQL..." -ForegroundColor Green
Write-Host ""

$pgDataDir = "C:\Program Files\PostgreSQL\16\data"
$pgHbaFile = "$pgDataDir\pg_hba.conf"
$backupFile = "$pgDataDir\pg_hba.conf.backup"

# Verificar permisos de administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "Este script necesita ejecutarse como Administrador" -ForegroundColor Red
    Write-Host "Click derecho en PowerShell y selecciona 'Ejecutar como administrador'" -ForegroundColor Yellow
    pause
    exit
}

Write-Host "1. Haciendo backup de pg_hba.conf..." -ForegroundColor Cyan
Copy-Item $pgHbaFile $backupFile -Force

Write-Host "2. Configurando autenticación temporal sin contraseña..." -ForegroundColor Cyan
$content = Get-Content $pgHbaFile
$newContent = $content -replace 'scram-sha-256', 'trust' -replace 'md5', 'trust'
$newContent | Set-Content $pgHbaFile

Write-Host "3. Reiniciando servicio PostgreSQL..." -ForegroundColor Cyan
Restart-Service -Name "postgresql-x64-16" -Force
Start-Sleep -Seconds 3

Write-Host "4. Estableciendo nueva contraseña..." -ForegroundColor Cyan
$newPassword = Read-Host "Ingresa la nueva contraseña para el usuario 'postgres'"
$psqlPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
& $psqlPath -U postgres -c "ALTER USER postgres WITH PASSWORD '$newPassword';"

Write-Host "5. Restaurando configuración de seguridad..." -ForegroundColor Cyan
Copy-Item $backupFile $pgHbaFile -Force

Write-Host "6. Reiniciando servicio PostgreSQL nuevamente..." -ForegroundColor Cyan
Restart-Service -Name "postgresql-x64-16" -Force
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✓ ¡Contraseña restablecida exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora ejecuta: .\setup-db.ps1" -ForegroundColor Yellow
Write-Host "Y usa la contraseña que acabas de establecer." -ForegroundColor Yellow
