/**
 * 🧹 SCRIPT DE LIMPIEZA - LA HUERTA DEL HUSKY
 * Elimina archivos y carpetas innecesarias
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 ═══════════════════════════════════════════════════════════');
console.log('🐺 LIMPIEZA DEL SISTEMA - LA HUERTA DEL HUSKY');
console.log('🧹 ═══════════════════════════════════════════════════════════\n');

// Función para eliminar archivos/carpetas
function safeDelete(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                fs.rmSync(filePath, { recursive: true, force: true });
                console.log(`📁 Eliminada carpeta: ${filePath}`);
            } else {
                fs.unlinkSync(filePath);
                console.log(`📄 Eliminado archivo: ${filePath}`);
            }
            return true;
        }
        return false;
    } catch (error) {
        console.log(`⚠️ No se pudo eliminar: ${filePath} (${error.message})`);
        return false;
    }
}

// Archivos y carpetas a eliminar
const toDelete = [
    // Archivos de prueba
    'test-plantid.js',
    'test-schedule.js', 
    'test-complete.js',
    
    // Archivos obsoletos de la carpeta raíz
    'whatsapp-bot-maximo.js',
    'SISTEMA-COMPLETO.md',
    'README-FINAL.md',
    
    // Carpeta src obsoleta (ya movida a backend)
    'src',
    
    // Node modules de desarrolloarchivos de logs si existen
    'npm-debug.log',
    'yarn-error.log',
    '.nyc_output',
    'coverage',
    
    // Archivos temporales
    '.tmp',
    'temp',
    
    // Archivos de configuración obsoletos
    'tsconfig.json',
    'babel.config.js',
    'webpack.config.js'
];

console.log('🗑️ Eliminando archivos innecesarios...\n');

let deleted = 0;
let notFound = 0;

toDelete.forEach(item => {
    if (safeDelete(item)) {
        deleted++;
    } else {
        notFound++;
    }
});

// Limpiar archivos .wwebjs_auth si existen y causan problemas
if (fs.existsSync('.wwebjs_auth')) {
    console.log('\n🔄 Limpiando cache de WhatsApp Web...');
    try {
        fs.rmSync('.wwebjs_auth', { recursive: true, force: true });
        console.log('✅ Cache de WhatsApp limpiado');
    } catch (error) {
        console.log('⚠️ No se pudo limpiar cache de WhatsApp');
    }
}

console.log('\n🧹 ═══════════════════════════════════════════════════════════');
console.log(`✅ Limpieza completada:`);
console.log(`   📁 ${deleted} elementos eliminados`);
console.log(`   ⏭️ ${notFound} elementos no encontrados (OK)`);
console.log('🧹 ═══════════════════════════════════════════════════════════');

// Mostrar estructura final
console.log('\n📂 Estructura final del proyecto:');
console.log('📦 BotWsp/');
console.log('├── 📁 backend/          # API y modelos');
console.log('├── 📁 bot/              # Bot WhatsApp');
console.log('├── 📁 frontend/         # Dashboard web');
console.log('├── 📁 scripts/          # Scripts de utilidad');
console.log('├── 📁 storage/          # Datos y archivos');
console.log('├── 📄 app.js            # Servidor principal');
console.log('├── 📄 package.json      # Dependencias');
console.log('└── 📄 .env              # Configuración');

console.log('\n🚀 ¡Sistema limpio y listo para usar!');