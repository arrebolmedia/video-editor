# PostgreSQL Setup Instructions

## Windows Installation

1. **Descarga PostgreSQL:**
   - Visita: https://www.postgresql.org/download/windows/
   - Descarga el instalador para Windows (PostgreSQL 16 recomendado)

2. **Ejecuta el instalador:**
   - Usuario por defecto: `postgres`
   - Contraseña: Elige una contraseña para el usuario postgres
   - Puerto: 5432 (por defecto)
   - Locale: Spanish, Mexico o tu preferencia

3. **Crea la base de datos:**
   Abre pgAdmin o usa psql en la terminal:
   ```sql
   CREATE DATABASE wedding_planner;
   ```

4. **Crea el usuario de la aplicación:**
   ```sql
   CREATE USER "anthony@arrebolweddings.com" WITH PASSWORD 'Lalo9513.-';
   GRANT ALL PRIVILEGES ON DATABASE wedding_planner TO "anthony@arrebolweddings.com";
   ```

5. **Ejecuta el schema:**
   ```bash
   psql -U postgres -d wedding_planner -f server/db/schema.sql
   ```

## Configuración Rápida (si ya tienes PostgreSQL)

1. Crea la base de datos y usuario con el script:
   ```bash
   npm run db:setup
   ```

2. Edita el archivo `.env` con tus credenciales si son diferentes

3. Inicia la aplicación:
   ```bash
   npm run dev
   ```

## Variables de Entorno

El archivo `.env` contiene:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wedding_planner
DB_USER=anthony@arrebolweddings.com
DB_PASSWORD=Lalo9513.-
```

**Nota:** Ya están configuradas tus credenciales. Si necesitas cambiarlas, edita el archivo `.env`
