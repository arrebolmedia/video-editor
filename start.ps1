# Script para iniciar la aplicación con túnel SSH
Write-Host "=== WEDDING VIDEO PLANNER - INICIO COMPLETO ===" -ForegroundColor Green
Write-Host ""

$sshKey = "$env:USERPROFILE\.ssh\id_ed25519_arrebol"
$remoteHost = "data.arrebolweddings.com"
$remoteUser = "root"
$localPort = 5433
$remotePort = 5433

# Verificar si ya existe un túnel
$existingTunnel = Get-Process | Where-Object { $_.ProcessName -eq "ssh" -and $_.CommandLine -like "*$localPort*" }

if ($existingTunnel) {
    Write-Host "✓ Túnel SSH ya está activo" -ForegroundColor Green
} else {
    Write-Host "[1/3] Estableciendo túnel SSH..." -ForegroundColor Cyan
    
    # Iniciar túnel en segundo plano
    Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\ssh-tunnel.ps1" -WindowStyle Minimized
    
    Write-Host "  Esperando conexión..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    Write-Host "✓ Túnel SSH establecido" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2/3] Verificando base de datos remota..." -ForegroundColor Cyan
$dbCheck = ssh -i $sshKey $remoteUser@$remoteHost "docker exec rsvp-db-1 psql -U wedding_rsvp_user -d wedding_rsvp -c '\dt' 2>&1"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ PostgreSQL accesible" -ForegroundColor Green
    Write-Host "  Tablas disponibles:" -ForegroundColor White
    Write-Host $dbCheck -ForegroundColor Gray
} else {
    Write-Host "⚠ Base de datos no accesible, usando memoria local" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3/3] Iniciando aplicación..." -ForegroundColor Cyan
Write-Host ""
Write-Host "  Frontend: http://localhost:5173/" -ForegroundColor White
Write-Host "  Backend:  http://localhost:3000/" -ForegroundColor White
Write-Host ""

npm run dev
