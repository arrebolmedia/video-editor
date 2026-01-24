# Script para configurar .env.production en el servidor
$ErrorActionPreference = "Stop"

Write-Host "`n🔧 Configurando .env.production en el servidor..." -ForegroundColor Cyan

$sshKey = "$env:USERPROFILE\.ssh\id_ed25519_arrebol"
$remoteHost = "data.arrebolweddings.com"
$remoteUser = "root"
$remoteDir = "/var/www/wedding-editor"

# Credenciales de producción
$envContent = @"
# Production Environment Variables
DB_HOST=wedding-db
DB_PORT=5432
DB_NAME=wedding_planner
DB_USER=wedding_user
DB_PASSWORD=wedding_pass
PORT=3002
NODE_ENV=production

# Admin Credentials (PRODUCTION)
ADMIN_EMAIL=anthony@arrebolweddings.com
ADMIN_PASSWORD=Lalo9513.-
ADMIN_NAME=Anthony Cazares
"@

Write-Host "`n[1/3] Creando archivo .env.production..." -ForegroundColor Yellow

# Crear archivo temporal local
$tempFile = [System.IO.Path]::GetTempFileName()
$envContent | Out-File -FilePath $tempFile -Encoding UTF8 -NoNewline

Write-Host "[2/3] Copiando al servidor..." -ForegroundColor Yellow

# Copiar al servidor
scp -i $sshKey $tempFile ${remoteUser}@${remoteHost}:${remoteDir}/.env.production

# Eliminar archivo temporal
Remove-Item $tempFile

Write-Host "[3/3] Reiniciando servicios..." -ForegroundColor Yellow

# Reiniciar servicios Docker
ssh -i $sshKey $remoteUser@$remoteHost @"
cd $remoteDir
docker compose restart wedding-editor
docker compose ps
"@

Write-Host "`n✅ Configuración completada!" -ForegroundColor Green
Write-Host "🌐 Prueba hacer login en: https://suite.arrebolweddings.com" -ForegroundColor Cyan
Write-Host "`n📋 Credenciales:" -ForegroundColor Yellow
Write-Host "   Email: anthony@arrebolweddings.com" -ForegroundColor White
Write-Host "   Password: Lalo9513.-" -ForegroundColor White
