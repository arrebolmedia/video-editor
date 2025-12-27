@echo off
echo Configurando PostgreSQL...
echo.
echo Por favor ingresa la contraseña del usuario 'postgres' cuando se solicite
echo.

set PGPASSWORD=

REM Crear la base de datos
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE wedding_planner;"

REM Crear el usuario
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE USER \"anthony@arrebolweddings.com\" WITH PASSWORD 'Lalo9513.-';"

REM Dar permisos
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE wedding_planner TO \"anthony@arrebolweddings.com\";"
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d wedding_planner -c "GRANT ALL ON SCHEMA public TO \"anthony@arrebolweddings.com\";"

REM Ejecutar el schema
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d wedding_planner -f server\db\schema.sql

echo.
echo ¡Base de datos configurada correctamente!
pause
