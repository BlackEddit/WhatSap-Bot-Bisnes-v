/**
 * 🚀 LAUNCHER COMPLETO - LA HUERTA DEL HUSKY
 * Inicia API + Bot WhatsApp en un solo comando
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 ═══════════════════════════════════════════════════════════');
console.log('🐺 INICIANDO SISTEMA COMPLETO - LA HUERTA DEL HUSKY');
console.log('🚀 ═══════════════════════════════════════════════════════════\n');

// Función para manejar la salida de procesos
function setupProcess(proc, name, color) {
    proc.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(line => line.trim());
        lines.forEach(line => {
            console.log(`${color}[${name}]${'\x1b[0m'} ${line}`);
        });
    });

    proc.stderr.on('data', (data) => {
        const lines = data.toString().split('\n').filter(line => line.trim());
        lines.forEach(line => {
            console.log(`${color}[${name}]${'\x1b[0m'} ❌ ${line}`);
        });
    });

    proc.on('close', (code) => {
        console.log(`${color}[${name}]${'\x1b[0m'} Proceso terminado con código ${code}`);
    });
}

// 1. Iniciar servidor API
console.log('1️⃣ Iniciando servidor API...');
const apiProcess = spawn('node', ['app.js'], {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe']
});

setupProcess(apiProcess, 'API', '\x1b[36m'); // Cyan

// Esperar un poco antes de iniciar el bot
setTimeout(() => {
    console.log('\n2️⃣ Iniciando bot WhatsApp...');
    
    const botProcess = spawn('node', ['bot/whatsapp-bot.js'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
    });

    setupProcess(botProcess, 'BOT', '\x1b[32m'); // Green

    // Manejar cierre del script principal
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Cerrando sistema...');
        apiProcess.kill('SIGINT');
        botProcess.kill('SIGINT');
        process.exit(0);
    });

}, 3000); // 3 segundos de espera

console.log('\n✅ Procesos iniciándose...');
console.log('📊 Dashboard: http://localhost:3000');
console.log('🤖 Bot WhatsApp conectándose...');
console.log('\n💡 Presiona Ctrl+C para cerrar todo\n');