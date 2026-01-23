# Script para ejecutar la migración de sugerencias
$psqlPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Migración: Agregar Sugerencias" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Esta migración agregará las siguientes columnas a la tabla 'versions':" -ForegroundColor Yellow
Write-Host "  - suggested_songs (JSONB)" -ForegroundColor White
Write-Host "  - suggested_opening_scenes (JSONB)" -ForegroundColor White
Write-Host "  - suggested_closing_scenes (JSONB)" -ForegroundColor White
Write-Host ""

# Solicitar contraseña del usuario postgres
$postgresPassword = Read-Host "Ingresa la contraseña del usuario 'postgres'" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($postgresPassword)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Configurar variable de entorno temporal
$env:PGPASSWORD = $plainPassword

try {
    Write-Host ""
    Write-Host "Ejecutando migración..." -ForegroundColor Cyan
    & $psqlPath -U postgres -d wedding_planner -f "server\db\migrations\add_suggestions.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ ¡Migración completada exitosamente!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Las columnas de sugerencias han sido agregadas." -ForegroundColor Green
        Write-Host "Los usuarios ahora podrán ver las sugerencias de escenas y canciones." -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "✗ Error al ejecutar la migración" -ForegroundColor Red
        Write-Host "Código de salida: $LASTEXITCODE" -ForegroundColor Red
    }
} finally {
    # Limpiar la contraseña de la variable de entorno
    $env:PGPASSWORD = $null
}

Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
