# Deployment Guide - Wedding Video Planner

## Producción: suite.arrebolweddings.com

### Configuración de Secrets

El archivo `.env.production` contiene las credenciales y NO debe subirse a GitHub.
Debe crearse manualmente en el servidor.

**Usuario Único en Producción:**
- Email: anthony@arrebolweddings.com
- Nombre: Anthony Cazares
- Role: admin

### Variables de Entorno Requeridas

```env
# Database
DB_HOST=localhost
DB_PORT=5433
DB_NAME=wedding_planner
DB_USER=wedding_rsvp_user
DB_PASSWORD=<secret>

# Server
PORT=3002
NODE_ENV=production

# Admin Credentials
ADMIN_EMAIL=anthony@arrebolweddings.com
ADMIN_PASSWORD=<secret>
ADMIN_NAME=Anthony Cazares
```

### Pasos para Deployment

1. **Construir la aplicación localmente:**
   ```powershell
   npm run build
   ```

2. **Ejecutar el script de deployment:**
   ```powershell
   .\deploy-production.ps1
   ```

   Este script:
   - Copia los archivos al servidor
   - Instala dependencias
   - Levanta los servicios con Docker Compose

3. **Crear .env.production en el servidor:**
   ```bash
   ssh root@data.arrebolweddings.com
   cd /var/www/wedding-editor
   nano .env.production
   ```
   
   Pegar las variables de entorno con los valores correctos.

4. **Reiniciar servicios:**
   ```bash
   docker compose restart
   ```

### URLs de Producción

- Frontend: https://suite.arrebolweddings.com
- API: https://suite.arrebolweddings.com/api
- Health Check: https://suite.arrebolweddings.com/api/health

### Verificación Post-Deployment

1. Verificar que los contenedores estén corriendo:
   ```bash
   docker compose ps
   ```

2. Ver logs:
   ```bash
   docker compose logs -f wedding-editor
   ```

3. Probar login:
   ```bash
   curl -X POST https://suite.arrebolweddings.com/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"anthony@arrebolweddings.com","password":"<password>"}'
   ```

### Rollback

Si hay problemas, hacer rollback:
```bash
docker compose down
# Restaurar versión anterior
docker compose up -d
```

### Base de Datos

La base de datos se ejecuta en el contenedor `wedding-db`.
Los datos persisten en el volumen Docker `wedding-db-data`.

**Backup:**
```bash
docker exec wedding-db pg_dump -U wedding_user wedding_planner > backup.sql
```

**Restore:**
```bash
cat backup.sql | docker exec -i wedding-db psql -U wedding_user wedding_planner
```

## Seguridad

- ❌ **NO** commitear `.env.production` a Git
- ✅ Las credenciales se almacenan solo en el servidor
- ✅ Solo un usuario admin en producción
- ✅ HTTPS habilitado vía Traefik
- ✅ Base de datos en red interna (no expuesta)

## Troubleshooting

### Contenedores no inician
```bash
docker compose logs wedding-editor
docker compose logs wedding-db
```

### Error de conexión a base de datos
Verificar que el contenedor de DB esté healthy:
```bash
docker compose ps wedding-db
```

### 502 Bad Gateway
Verificar que el contenedor de backend esté corriendo en el puerto correcto:
```bash
docker compose logs wedding-editor | grep "Server running"
```
