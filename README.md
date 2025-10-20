# 🐺 La Huerta del Husky - Sistema Completo

Sistema integral de WhatsApp Bot + API + Dashboard para gestión de vivero con inteligencia artificial.

## ⚡ Instalación Rápida

```bash
# 1. Clonar repositorio
git clone [tu-repo]
cd BotWsp

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu API key de Groq

# 4. Iniciar sistema
npm run dev    # Servidor API (puerto 3000)
npm run bot    # Bot de WhatsApp (ventana separada)
```

## 📁 Estructura del Proyecto

```
📂 La-Huerta-del-Husky/
├── 🚀 app.js                 # Servidor API principal
├── 📦 package.json           # Dependencias limpias
├── 🔧 .env                   # Variables de entorno
├── 🤖 bot/
│   └── whatsapp-bot.js       # Bot de WhatsApp
├── 🔧 backend/               # API REST
│   ├── controllers/          # Lógica de negocio
│   ├── models/              # Modelos de datos
│   └── routes/              # Rutas de API
├── 🎨 frontend/             # Dashboard web
├── 💾 storage/              # Almacenamiento
│   ├── images/              # Fotos recibidas/productos
│   ├── data/               # Base de datos JSON
│   └── conversations/       # Historial de chats
└── 📚 docs/                # Documentación
```

## 🎯 Funcionalidades

### 🤖 Bot de WhatsApp
- ✅ **Personalidad IA** con Groq (Llama 3.1)
- ✅ **Reconocimiento de imágenes** de plantas
- ✅ **Anti-spam inteligente** 
- ✅ **Comandos de dueño** (stock, inventario, alertas)
- ✅ **Conversaciones naturales** en español mexicano

### 📊 API REST
- ✅ **Gestión de inventario** (plantas/macetas)
- ✅ **Subida de imágenes** con análisis automático
- ✅ **Historial de conversaciones**
- ✅ **Estadísticas en tiempo real**
- ✅ **Autenticación simple**

### 🎨 Dashboard Web
- 🔄 **Interface visual** para inventario
- 🔄 **Galería de imágenes** recibidas
- 🔄 **Estadísticas y gráficos**
- 🔄 **Gestión de conversaciones**

## 🔧 Configuración

### Variables de Entorno (.env)
```env
# API de Groq para IA
GROQ_API_KEY=tu_api_key_aqui

# Puerto del servidor API
PORT=3000

# Password para dashboard
ADMIN_PASSWORD=husky2024

# Configuración de bot
BOT_OWNER_PHONE=5214777244259
```

## 📡 API Endpoints

### 📦 Inventario
```http
GET    /api/inventory              # Todo el inventario
GET    /api/inventory/stats        # Estadísticas
GET    /api/inventory/low-stock    # Alertas de stock bajo
POST   /api/inventory/plants       # Crear planta
PUT    /api/inventory/plants/:id   # Actualizar planta
PATCH  /api/inventory/stock        # Solo cambiar cantidades
```

### 📸 Imágenes
```http
GET    /api/images                 # Todas las imágenes
POST   /api/images/upload          # Subir imagen
POST   /api/images/analyze         # Analizar imagen
GET    /api/images/received        # Fotos de clientes
```

### 💬 Conversaciones
```http
GET    /api/conversations          # Historial completo
GET    /api/conversations/stats    # Estadísticas de chats
GET    /api/conversations/:phone   # Chat específico
```

## 🚀 Scripts Disponibles

```bash
npm start          # Producción: servidor API
npm run dev        # Desarrollo: servidor con nodemon
npm run bot        # Iniciar bot de WhatsApp
npm run setup      # Configuración inicial
```

## 🐺 Comandos del Bot

### 👥 Para Clientes
- **Enviar foto** → Identificación automática de plantas
- **"¿Tienes malva?"** → Precio y disponibilidad
- **"horarios"** → Información de atención
- **"!help"** → Ayuda completa

### 👑 Para Dueño (4777244259)
- **"stock"** → Inventario completo
- **"stock bajo"** → Alertas críticas
- **"!help"** → Comandos de administración
- **"actualizar malva 20"** → Cambiar stock

## 🔒 Seguridad

- ✅ **Solo dueño** puede usar comandos administrativos
- ✅ **Filtros anti-spam** automáticos
- ✅ **Validación de imágenes** (solo formatos válidos)
- ✅ **Autenticación** para dashboard

## 📱 Acceso al Sistema

- **🌐 Dashboard:** http://localhost:3000
- **📡 API:** http://localhost:3000/api
- **🤖 Bot:** WhatsApp Web (ventana automática)

## 🛠️ Mantenimiento

### Backup de Datos
```bash
# Respaldar conversaciones e inventario
cp -r storage/data/ backup/$(date +%Y%m%d)/
```

### Limpiar Imágenes Viejas
```bash
# Eliminar imágenes de más de 30 días
find storage/images/received -type f -mtime +30 -delete
```

### Ver Logs
```bash
# Logs del bot
npm run bot

# Logs del servidor
npm run dev
```

## 🆘 Solución de Problemas

### Bot no responde
1. Verificar .env tiene GROQ_API_KEY
2. Escanear QR de WhatsApp Web
3. Verificar número de dueño en configuración

### API no funciona
1. `npm install` para dependencias
2. Verificar puerto 3000 libre
3. Revisar permisos de carpeta storage/

### Imágenes no se analizan
1. Verificar Sharp instalado: `npm install sharp`
2. Comprobar espacio en storage/images/
3. Validar formato de imagen (jpg, png)

## 📞 Soporte

Para problemas o mejoras, contactar al desarrollador o revisar logs en la terminal.

---

**🐺 ¡Sistema completo funcionando para La Huerta del Husky! 🌱**