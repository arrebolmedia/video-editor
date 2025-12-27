# Script para conectar a PostgreSQL mediante túnel SSH
Write-Host "Estableciendo túnel SSH a data.arrebolweddings.com..." -ForegroundColor Green
Write-Host ""

$sshKey = "$env:USERPROFILE\.ssh\id_ed25519_arrebol"
$remoteHost = "data.arrebolweddings.com"
$remoteUser = "root"
$localPort = 5433
$remotePort = 5433  # PostgreSQL está en Docker en el puerto 5433 del servidor

Write-Host "Verificando conexión SSH..." -ForegroundColor Cyan
$testConnection = ssh -i $sshKey -o ConnectTimeout=5 -o StrictHostKeyChecking=no $remoteUser@$remoteHost "echo 'OK'" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Conexión SSH exitosa" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verificando PostgreSQL en el servidor..." -ForegroundColor Cyan
    ssh -i $sshKey $remoteUser@$remoteHost "docker ps | grep postgres"
    Write-Host ""
    Write-Host "Creando túnel SSH..." -ForegroundColor Cyan
    Write-Host "  Local:  localhost:$localPort → Tu aplicación se conecta aquí" -ForegroundColor White
    Write-Host "  Remoto: $remoteHost:$remotePort → PostgreSQL en Docker" -ForegroundColor White
    Write-Host ""
    Write-Host "✓ Túnel activo. Mantén esta ventana abierta." -ForegroundColor Green
    Write-Host "  Presiona Ctrl+C para cerrar el túnel." -ForegroundColor Yellow
    Write-Host ""
    
    # Crear el túnel
    ssh -i $sshKey -N -L ${localPort}:localhost:${remotePort} $remoteUser@$remoteHost
} else {
    Write-Host "✗ Error al conectar via SSH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Verifica:" -ForegroundColor Yellow
    Write-Host "  1. Que el servidor esté accesible" -ForegroundColor White
    Write-Host "  2. Que la clave SSH sea correcta" -ForegroundColor White
    Write-Host "  3. Que PostgreSQL esté corriendo en el servidor" -ForegroundColor White
    Write-Host ""
    Write-Host "Error: $testConnection" -ForegroundColor Red
}
