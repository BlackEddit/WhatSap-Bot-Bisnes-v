/**
 * 🚀 SERVIDOR API - LA HUERTA DEL HUSKY
 * Sistema completo de gestión con API REST
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use('/storage', express.static(path.join(__dirname, 'storage')));
app.use('/', express.static(path.join(__dirname, 'frontend')));

// Crear directorios necesarios
const dirs = [
    './storage/images/received',
    './storage/images/products', 
    './storage/conversations',
    './storage/data'
];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Directorio creado: ${dir}`);
    }
});

// Rutas de API
app.use('/api/inventory', require('./backend/routes/inventory'));
app.use('/api/images', require('./backend/routes/images'));
// app.use('/api/conversations', require('./backend/routes/conversations')); // Temporalmente deshabilitado
app.use('/api/auth', require('./backend/routes/auth'));

// Ruta principal - Dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dashboard.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// Ruta 404
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Ruta no encontrada' 
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('🚀 ════════════════════════════════════');
    console.log('🐺    LA HUERTA DEL HUSKY - API    ');
    console.log('🚀 ════════════════════════════════════');
    console.log(`📡 Servidor corriendo en: http://localhost:${PORT}`);
    console.log(`📊 Dashboard disponible en: http://localhost:${PORT}`);
    console.log(`📸 API de imágenes: http://localhost:${PORT}/api/images`);
    console.log(`📦 API de inventario: http://localhost:${PORT}/api/inventory`);
    console.log('🚀 ════════════════════════════════════');
});

module.exports = app;