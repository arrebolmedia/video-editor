#!/bin/bash

echo "🚀 Desplegando Wedding Video Planner..."

# Crear directorio si no existe
mkdir -p /var/www/wedding-editor

# Copiar archivos
echo "📦 Copiando archivos..."
cp -r dist/* /var/www/wedding-editor/
cp -r server /var/www/wedding-editor/
cp package.json /var/www/wedding-editor/
cp .env.production /var/www/wedding-editor/
cp tsconfig.json /var/www/wedding-editor/ 2>/dev/null || true

# Instalar dependencias
echo "📥 Instalando dependencias..."
cd /var/www/wedding-editor
npm install --production

# Configurar servicio systemd
echo "⚙️ Configurando servicio..."
cp wedding-editor.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable wedding-editor
systemctl restart wedding-editor

# Actualizar Nginx
echo "🌐 Configurando Nginx..."
cat > /etc/nginx/sites-available/wedding-editor <<'EOF'
location /editor/ {
    alias /var/www/wedding-editor/dist/;
    try_files $uri $uri/ /editor/index.html;
    index index.html;
}

location /api/ {
    proxy_pass http://localhost:3002/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
EOF

# Incluir en configuración principal
if ! grep -q "wedding-editor" /etc/nginx/sites-enabled/arrebolweddings; then
    sed -i '/location \/ {/i\    include /etc/nginx/sites-available/wedding-editor;' /etc/nginx/sites-enabled/arrebolweddings
fi

# Recargar Nginx
nginx -t && systemctl reload nginx

echo "✅ Despliegue completado!"
echo "📍 Accesible en: https://arrebolweddings.com/editor"
