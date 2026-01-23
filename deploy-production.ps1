# Script de deployment para suite.arrebolweddings.com
$ErrorActionPreference = "Stop"

Write-Host "🚀 Desplegando Wedding Video Planner a suite.arrebolweddings.com..." -ForegroundColor Green

$sshKey = "$env:USERPROFILE\.ssh\id_ed25519_arrebol"
$remoteHost = "data.arrebolweddings.com"
$remoteUser = "root"
$remoteDir = "/var/www/wedding-editor"

# 1. Construir la aplicación
Write-Host "`n[1/5] Construyendo aplicación..." -ForegroundColor Cyan
npm run build

# 2. Crear directorio en el servidor
Write-Host "`n[2/5] Creando directorio en servidor..." -ForegroundColor Cyan
ssh -i $sshKey $remoteUser@$remoteHost "mkdir -p $remoteDir"

# 3. Copiar archivos al servidor
Write-Host "`n[3/5] Copiando archivos al servidor..." -ForegroundColor Cyan

# Copiar dist
scp -i $sshKey -r dist/* ${remoteUser}@${remoteHost}:${remoteDir}/dist/

# Copiar servidor
scp -i $sshKey -r server ${remoteUser}@${remoteHost}:${remoteDir}/

# Copiar archivos de configuración
scp -i $sshKey package.json ${remoteUser}@${remoteHost}:${remoteDir}/
scp -i $sshKey package-lock.json ${remoteUser}@${remoteHost}:${remoteDir}/
scp -i $sshKey tsconfig.json ${remoteUser}@${remoteHost}:${remoteDir}/
scp -i $sshKey tsconfig.server.json ${remoteUser}@${remoteHost}:${remoteDir}/
scp -i $sshKey nginx.conf ${remoteUser}@${remoteHost}:${remoteDir}/
scp -i $sshKey docker-compose-production.yml ${remoteUser}@${remoteHost}:${remoteDir}/docker-compose.yml

# Copiar .env.production si existe
if (Test-Path .env.production) {
    scp -i $sshKey .env.production ${remoteUser}@${remoteHost}:${remoteDir}/.env
}

# 4. Instalar dependencias y configurar
Write-Host "`n[4/5] Instalando dependencias en servidor..." -ForegroundColor Cyan
ssh -i $sshKey $remoteUser@$remoteHost @"
cd $remoteDir
npm install --production
"@

# 5. Levantar servicios con Docker Compose
Write-Host "`n[5/5] Levantando servicios con Docker Compose..." -ForegroundColor Cyan
ssh -i $sshKey $remoteUser@$remoteHost @"
cd $remoteDir
docker compose down
docker compose up -d
docker compose ps
"@

Write-Host "`n✅ Deployment completado!" -ForegroundColor Green
Write-Host "🌐 Aplicación disponible en: https://suite.arrebolweddings.com" -ForegroundColor Cyan
Write-Host "🔌 API disponible en: https://suite.arrebolweddings.com/api" -ForegroundColor Cyan
