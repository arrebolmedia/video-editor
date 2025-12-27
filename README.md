# Wedding Video Planner 🎥

Aplicación web para planificar la edición de videos de bodas con gestión de versiones.

## 🌐 Acceso en Producción

**URL:** https://arrebolweddings.com/editor

## 💾 Base de Datos

- **Servidor:** data.arrebolweddings.com (PostgreSQL en Docker)
- **Base de datos:** `wedding_planner`
- **Puerto:** 5433

## 🚀 Desarrollo Local

### Iniciar con todo configurado:
```bash
.\start.ps1
```

O manualmente:
```bash
# 1. Túnel SSH (en ventana separada)
.\ssh-tunnel.ps1

# 2. Iniciar app (en otra ventana)
npm run dev
```

**URLs locales:**
- Frontend: http://localhost:5173/
- Backend: http://localhost:3000/

## 📦 Despliegue

```bash
npm run build
scp -i ~/.ssh/id_ed25519_arrebol -r dist/* root@data.arrebolweddings.com:/var/www/wedding-editor/dist/
ssh root@data.arrebolweddings.com "systemctl restart wedding-editor"
```

## 🎬 Características

- ✅ 60 escenas de bodas organizadas por momentos
- ✅ 3 versiones: Teaser, Highlights, Full
- ✅ Drag & drop para reordenar escenas
- ✅ Auto-guardado persistente
- ✅ Interfaz minimalista

---
**Arrebol Weddings**
