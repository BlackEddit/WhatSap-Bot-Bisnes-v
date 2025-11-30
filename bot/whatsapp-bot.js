// Cargar variables de entorno PRIMERO
require('dotenv').config();

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const HuskyPersonality = require('../backend/models/HuskyPersonality');
const ConversationManager = require('../backend/models/ConversationManager');
const InventoryManager = require('../backend/models/InventoryManager');
const ImageAnalyzer = require('../backend/models/ImageAnalyzer'); // Ya usa UnifiedPlantIdentifier
const MotivationalCoach = require('../backend/models/MotivationalCoach');
const ReminderSystem = require('../backend/models/ReminderSystem');

console.log('🤖 Bot WhatsApp INTELIGENTE - Iniciando...');
console.log('🐺 Personalidad Husky MÁXIMO PODER activada');
console.log('💬 Sistema de conversaciones activado');
console.log('🌿 Sistema Unificado de Identificación de Plantas activado');

// Inicializar sistemas
const huskyPersonality = new HuskyPersonality();
const conversationManager = new ConversationManager();
const inventoryManager = new InventoryManager();
const imageAnalyzer = new ImageAnalyzer();
const motivationalCoach = new MotivationalCoach();
const reminderSystem = new ReminderSystem();

console.log('🔥 Coach Motivacional RUDO inicializado');
console.log('⏰ Sistema de Recordatorios inicializado');

// Estado global del cliente
let isClientReady = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 10000; // 10 segundos

// Crear cliente con autenticación local
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'husky-bot',
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: { 
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-features=VizDisplayCompositor',
            '--single-process',
            '--disable-extensions'
        ],
        timeout: 60000
    },
    qrMaxRetries: 5,
    restartOnAuthFail: true
});

/**
 * 🔄 Función para reintentar conexión
 */
async function attemptReconnect() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('❌ Se alcanzó el máximo de intentos de reconexión. Reinicia el bot manualmente.');
        return;
    }
    
    reconnectAttempts++;
    console.log(`🔄 Intento de reconexión ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`);
    
    setTimeout(async () => {
        try {
            await client.initialize();
        } catch (error) {
            console.error('❌ Error en reconexión:', error.message);
            attemptReconnect();
        }
    }, RECONNECT_DELAY);
}

/**
 * 🔒 Verificar si el cliente está listo para enviar mensajes
 */
function isClientConnected() {
    return isClientReady && client.info;
}

// Generar código QR
client.on('qr', (qr) => {
    console.log('📱 Escanea este código QR con tu WhatsApp:');
    qrcode.generate(qr, {small: true});
});

// Eventos de debugging
client.on('authenticated', () => {
    console.log('🔐 Cliente autenticado correctamente');
    reconnectAttempts = 0; // Resetear intentos al autenticar
});

client.on('auth_failure', (msg) => {
    console.error('❌ Error de autenticación:', msg);
    isClientReady = false;
    console.log('🔄 Intentando reconectar...');
    attemptReconnect();
});

client.on('disconnected', (reason) => {
    console.log('🔌 Cliente desconectado:', reason);
    isClientReady = false;
    
    // Solo reconectar si no fue logout manual
    if (reason !== 'LOGOUT') {
        console.log('🔄 Desconexión inesperada. Intentando reconectar...');
        attemptReconnect();
    } else {
        console.log('👋 Sesión cerrada manualmente. Reinicia el bot para volver a conectar.');
    }
});

// Cliente listo
client.on('ready', () => {
    isClientReady = true;
    reconnectAttempts = 0; // Resetear intentos al estar listo
    
    console.log('✅ Bot INTELIGENTE conectado exitosamente!');
    console.log('🎯 Bot listo para responder CUALQUIER mensaje');
    console.log('📸 Responde a imágenes, texto, stickers, TODO');
    
    // 🔥 ACTIVAR COACH MOTIVACIONAL RUDO
    motivationalCoach.startScheduledMessages(client);
    console.log('🔥 COACH MOTIVACIONAL RUDO ACTIVADO - Te voy a chingar para que cumplas tus metas!');
    
    // ⏰ ACTIVAR SISTEMA DE RECORDATORIOS
    reminderSystem.initializeWithClient(client);
    console.log('⏰ SISTEMA DE RECORDATORIOS ACTIVADO - Nunca se te olvidará nada!');
    
    // Enviar mensaje inicial al dueño
    setTimeout(async () => {
        try {
            if (isClientConnected()) {
                await motivationalCoach.sendMotivationalMessage(client, 'general', 
                    '🔥 ¡EL COACH MOTIVACIONAL YA ESTÁ AQUÍ CABRÓN! ¡Prepárate para que te cague a mensajes hasta que cumplas tus metas! 💀');
            }
        } catch (error) {
            console.error('❌ Error enviando mensaje inicial:', error.message);
        }
    }, 5000);
});

// Función para simular escritura - con manejo de errores
async function simulateTyping(message, delay) {
    if (!isClientConnected()) {
        console.log('⚠️ Cliente no conectado, saltando simulación de escritura');
        return;
    }
    
    try {
        const chat = await message.getChat();
        await chat.sendStateTyping();
        await new Promise(resolve => setTimeout(resolve, delay));
        await chat.clearState();
    } catch (error) {
        console.log('⚠️ Error simulando escritura (ignorando):', error.message);
        // No lanzar error, solo esperar el delay
        await new Promise(resolve => setTimeout(resolve, delay));
    }
}

/**
 * 🔒 Función segura para enviar respuesta
 */
async function safeReply(message, response) {
    if (!isClientConnected()) {
        console.error('❌ No se puede enviar mensaje: cliente desconectado');
        return false;
    }
    
    try {
        await message.reply(response);
        return true;
    } catch (error) {
        console.error('❌ Error enviando respuesta:', error.message);
        
        // Si es error de evaluación, el cliente probablemente se desconectó
        if (error.message.includes('Evaluation failed') || error.message.includes('Protocol error')) {
            isClientReady = false;
            console.log('🔄 Conexión perdida. Intentando reconectar...');
        }
        
        return false;
    }
}

// Variables para respuesta rápida
const activeUsers = new Map();

/**
 * 💡 Generar mensaje de ayuda para clientes
 */
function generateClientHelpMessage() {
    return `🌱 **¡HOLA! SOY EL BOT DE LA HUERTA DEL HUSKY**

🐺 **¿CÓMO PUEDO AYUDARTE?**

📸 **ENVÍA FOTOS:**
• Manda foto de plantas para identificarlas
• Te doy precio y disponibilidad al instante

🌿 **PREGUNTA POR PLANTAS:**
• "¿Tienes malva?" - Te digo precio y stock
• "¿Cuánto cuesta la ruda?" - Te doy info completa
• "Necesito plantas aromáticas" - Te muestro opciones

⏰ **HORARIOS:**
• Solo SÁBADOS 10:00 AM - 6:00 PM
• No hacemos entregas a domicilio

💬 **COMANDOS ÚTILES:**
• \`!help\` - Ver esta ayuda
• "horarios" - Ver cuándo abrimos
• "plantas" - Ver qué tenemos disponible

🐺 **¡Pregúntame lo que necesites!**
`;
}

/**
 * 🔍 Verificar si una planta está en nuestro inventario
 */
async function checkPlantInInventory(commonName, scientificName) {
    try {
        const InventoryModel = require('../backend/models/InventoryModel');
        const allPlants = await InventoryModel.getAll();
        
        // Buscar por nombre común o científico
        const found = allPlants.plants.some(plant => {
            const plantName = plant.name.toLowerCase();
            const plantDisplayName = plant.displayName.toLowerCase();
            const searchCommon = commonName ? commonName.toLowerCase() : '';
            const searchScientific = scientificName ? scientificName.toLowerCase() : '';
            
            return plantName.includes(searchCommon) || 
                   plantDisplayName.includes(searchCommon) ||
                   (searchScientific && (plantName.includes(searchScientific) || plantDisplayName.includes(searchScientific)));
        });
        
        return found;
    } catch (error) {
        console.error('Error verificando planta en inventario:', error);
        return false;
    }
}

/**
 * 📢 Enviar mensaje al dueño
 */
async function sendMessageToOwner(message) {
    try {
        const ownerPhone = process.env.OWNER_PHONE || '5214777244259';
        const ownerChatId = `${ownerPhone}@c.us`;
        
        await client.sendMessage(ownerChatId, message);
        console.log(`📢 Mensaje enviado al dueño: ${ownerPhone}`);
        return true;
    } catch (error) {
        console.error('❌ Error enviando mensaje al dueño:', error);
        return false;
    }
}

/**
Soy tu asistente personal para plantas 🌱`;
}

/**
 * 📋 Generar mensaje de ayuda para el dueño
 */
function generateOwnerHelpMessage() {
    return `🐺 **COMANDOS DE DUEÑO - LA HUERTA DEL HUSKY**

📊 **CONSULTAS DE STOCK:**
• \`stock\` - Ver inventario completo
• \`stock bajo\` - Ver alertas de stock bajo
• \`stock [planta]\` - Ver producto específico

📦 **GESTIÓN DE INVENTARIO:**
• \`agregar [planta] [precio] [stock]\` - Agregar nueva planta
• \`actualizar [planta] [cantidad]\` - Cambiar stock
• \`precio [planta] [nuevo precio]\` - Modificar precio

🌱 **PARA PLANTAS NUEVAS:**
• Manda foto y di: "agregar [nombre] [precio] [stock]"
• Ejemplo: "agregar suculenta 45 20"

🔧 **COMANDOS DEL SISTEMA:**
• \`!help\` - Ver este menú de comandos
• \`alertas\` - Ver notificaciones importantes
• \`reporte\` - Generar reporte del día

📱 **ACCESO EXTERNO:**
• Dashboard: http://localhost:3000
• API: http://localhost:3000/api/inventory

💡 **EJEMPLOS:**
• \`stock malva\` → Ver stock de malva
• \`agregar lavanda 35 15\` → Agregar lavanda nueva
• \`precio malva 30\` → Cambiar precio de malva
• \`actualizar malva 20\` → Cambiar stock a 20
• \`precio malva 30\` → Cambiar precio a $30

🎯 Solo tú puedes usar estos comandos
🐺 ¡Tu bot está funcionando perfecto, jefe!`;
}

/**
 * �📊 Generar reporte completo de stock
 */
async function generateStockReport() {
    const plantDatabase = imageAnalyzer.plantDatabase;
    const macetasDatabase = imageAnalyzer.macetasDatabase;
    
    let report = '📊 **STOCK COMPLETO - LA HUERTA DEL HUSKY**\n\n';
    
    // Plantas
    report += '🌱 **PLANTAS:**\n';
    let totalPlantas = 0;
    let valorPlantas = 0;
    
    for (const [nombre, info] of Object.entries(plantDatabase)) {
        const stockEmoji = info.stock < 10 ? '⚠️' : info.stock < 20 ? '🟡' : '🟢';
        report += `${stockEmoji} ${info.descripcion}\n`;
        report += `   💰 $${info.precio} | 📦 ${info.stock} unidades\n\n`;
        
        totalPlantas += info.stock;
        valorPlantas += (info.precio * info.stock);
    }
    
    // Macetas
    report += '🪴 **MACETAS:**\n';
    let totalMacetas = 0;
    let valorMacetas = 0;
    
    for (const [tamaño, info] of Object.entries(macetasDatabase)) {
        const stockEmoji = info.stock < 15 ? '⚠️' : info.stock < 25 ? '🟡' : '🟢';
        report += `${stockEmoji} ${info.descripcion}\n`;
        report += `   💰 $${info.precio} | 📦 ${info.stock} unidades\n\n`;
        
        totalMacetas += info.stock;
        valorMacetas += (info.precio * info.stock);
    }
    
    // Resumen
    report += '📈 **RESUMEN:**\n';
    report += `🌱 Total plantas: ${totalPlantas}\n`;
    report += `🪴 Total macetas: ${totalMacetas}\n`;
    report += `💰 Valor total: $${(valorPlantas + valorMacetas).toLocaleString()}\n\n`;
    
    report += '🐺 *Comandos disponibles:*\n';
    report += '• "stock bajo" - Ver alertas\n';
    report += '• "stock [planta]" - Ver específico\n';
    report += '• "actualizar [planta] [cantidad]" - Modificar';
    
    return report;
}

/**
 * ⚠️ Generar alerta de stock bajo
 */
function generateLowStockAlert() {
    const lowStockItems = imageAnalyzer.getLowStockItems();
    
    if (lowStockItems.length === 0) {
        return '✅ **TODO EL STOCK ESTÁ BIEN**\n\n🐺 No hay productos con stock bajo en este momento.';
    }
    
    let alert = '🚨 **ALERTA: STOCK BAJO**\n\n';
    
    lowStockItems.forEach(item => {
        alert += `⚠️ ${item.type.toUpperCase()}: **${item.name}**\n`;
        alert += `   📦 Solo quedan ${item.stock} unidades\n\n`;
    });
    
    alert += '🐺 *¡Considera reabastecer pronto!*';
    
    return alert;
}

// Manejo de mensajes INTELIGENTE
client.on('message', async (message) => {
    // Verificar que el cliente está conectado antes de procesar
    if (!isClientConnected()) {
        console.log('⚠️ Mensaje recibido pero cliente no está listo');
        return;
    }
    
    // FILTRAR mensajes no deseados
    if (message.from === 'status@broadcast' || message.isStatus || message.fromMe) {
        return;
    }

    // FILTRAR notificaciones spam
    if (message.type === 'e2e_notification' || message.type === 'notification_template') {
        return;
    }

    // FILTRAR grupos
    if (message.isGroupMsg) {
        console.log(`🚫 Mensaje de grupo ignorado`);
        return;
    }

    // FILTRAR stickers y audios
    if (message.type === 'sticker' || message.type === 'audio' || message.type === 'video') {
        console.log(`🚫 Sticker/Audio/Video ignorado`);
        return;
    }

    // FILTRO ANTI-SPAM - Solo responder a mensajes con contenido relevante
    const messageText = message.body ? message.body.toLowerCase() : '';
    const isRelevantMessage = 
        messageText.includes('planta') || messageText.includes('maceta') || 
        messageText.includes('tienes') || messageText.includes('precio') ||
        messageText.includes('hola') || messageText.includes('buenos') || 
        messageText.includes('que onda') || messageText.includes('horario') ||
        messageText.includes('abren') || messageText.includes('abierto') ||
        messageText.includes('cierran') || messageText.includes('hoy') ||
        messageText.includes('vivero') || messageText.includes('huerta') ||
        messageText.includes('malva') || messageText.includes('ruda') ||
        messageText.includes('albahaca') || messageText.includes('cilantro') ||
        messageText.includes('romero') || messageText.includes('citronela') ||
        messageText.includes('palo de brasil') || messageText.includes('help') ||
        // COMANDOS DE DUEÑO
        messageText.includes('stock') || messageText.includes('inventario') ||
        messageText.includes('actualizar') || messageText.includes('alertas') ||
        messageText.includes('comandos') || messageText.includes('ayuda') ||
        messageText.startsWith('!') || // Cualquier comando que empiece con !
        messageText.length < 4; // Mensajes cortos como "ok", "si", "no"
    
    // **BYPASS PARA DUEÑO - SIEMPRE RESPONDE**
    const isDueñoBypass = inventoryManager.isOwner(message.from);
    
    if (!isRelevantMessage && message.type !== 'image' && !isDueñoBypass) {
        console.log(`🚫 Mensaje ignorado (no relevante): "${messageText}"`);
        return; // NO RESPONDER
    }
    
    if (isDueñoBypass && !isRelevantMessage) {
        console.log(`👑 BYPASS DE DUEÑO: Procesando "${messageText}" aunque no sea relevante`);
    }

    console.log(`📩 Mensaje recibido: ${message.body || '[IMAGEN/MEDIA]'}`);
    console.log(`👤 De: ${message.from}`);
    console.log(`📱 Tipo: ${message.type}`);

    // GUARDAR MENSAJE EN HISTORIAL
    const userPhoneId = message.from;
    const userName = message.notifyName || message.pushname || 'Cliente';
    
    // **DEBUG PARA VERIFICAR SI ES DUEÑO**
    console.log(`🔍 Verificando si ${userPhoneId} es dueño...`);
    const isDueño = inventoryManager.isOwner(userPhoneId);
    console.log(`👑 Resultado: ${isDueño ? 'ES DUEÑO' : 'NO ES DUEÑO'}`);
    
    // **OBTENER HISTORIAL ANTES DE GUARDARLO**
    const conversationHistory = await conversationManager.getConversationHistory(userPhoneId);
    
    conversationManager.logMessage(userPhoneId, userName, message.body || '[IMAGEN]', true);

    // SISTEMA DE RESPUESTA MÁS NATURAL
    const now = Date.now();
    const lastActivity = activeUsers.get(userPhoneId) || 0;
    const isActiveConversation = (now - lastActivity) < 120000; // 2 minutos
    const isFirstMessage = conversationHistory.length === 0;
    activeUsers.set(userPhoneId, now);

    // Delays más naturales
    let delay;
    if (isFirstMessage) {
        // Primer mensaje: 3-8 segundos para parecer humano
        delay = Math.floor(Math.random() * 5000) + 3000;
    } else if (isActiveConversation) {
        // Conversación activa: 1-3 segundos
        delay = Math.floor(Math.random() * 2000) + 1000;
    } else {
        // Mensaje después de inactividad: 2-5 segundos
        delay = Math.floor(Math.random() * 3000) + 2000;
    }

    console.log(`⏳ ${isFirstMessage ? '🆕 PRIMER MENSAJE' : isActiveConversation ? '🔥 CONVERSACIÓN ACTIVA' : '💬 REACTIVANDO'} - Esperando ${delay}ms...`);

    await simulateTyping(message, delay);

    let response = '';
    // messageText ya está definido arriba

    // **ANÁLISIS DE CONTEXTO MEJORADO**
    const conversationContext = conversationHistory.slice(-3).map(msg => msg.text).join(' ').toLowerCase();
    const recentMessages = conversationHistory.slice(-2);
    
    // **CONTINUIDAD DE CONVERSACIÓN**
    if (recentMessages.length > 0) {
        const lastBotMessage = recentMessages.find(msg => msg.sender === 'bot');
        
        // Si acabo de preguntar algo específico y me responde
        if (lastBotMessage && lastBotMessage.text && (lastBotMessage.text.includes('¿Cuántas') || lastBotMessage.text.includes('¿Te la aparto') || lastBotMessage.text.includes('¿Te interesa'))) {
            if (messageText.match(/\d+/) && (messageText.includes('si') || messageText.includes('sí') || messageText.includes('quiero'))) {
                const cantidad = messageText.match(/\d+/)[0];
                response = `🌱 ¡Perfecto! ${cantidad} plantas anotadas 🐺 ¿Necesitas algo más o ya cerramos el pedido?`;
            }
            else if (messageText.includes('si') || messageText.includes('sí') || messageText.includes('quiero') || messageText.includes('ok') || messageText.includes('sale')) {
                response = '🌿 ¡Excelente! Lo tengo apartado 🐺 ¿Cuándo pasas por tu planta?';
            }
        }
        
        // Si preguntó por una planta específica antes y ahora pregunta precio/cantidad
        if (conversationContext.includes('malva') && (messageText.includes('precio') || messageText.includes('cuanto') || messageText.includes('cuesta'))) {
            response = '🌿 La malva está en $25 cada planta 🐺 ¡Bien fresquecita! ¿Cuántas quieres?';
        }
        else if (conversationContext.includes('citronela') && (messageText.includes('precio') || messageText.includes('cuanto') || messageText.includes('cuesta'))) {
            response = '🌿 La citronela está en $50 cada planta 🐺 ¡Excelente repelente natural! ¿Cuántas necesitas?';
        }
    }
    
    // Si ya tengo respuesta por contexto, salir
    if (response) {
        conversationManager.logMessage(userPhoneId, 'La Huerta del Husky', response, false);
        await safeReply(message, response);
        return;
    }

    // **COMANDOS DE INVENTARIO (SOLO DUEÑO)**
    if (inventoryManager.isOwner(userPhoneId)) {
        // Comando de ayuda para el dueño
        if (messageText === '!help' || messageText === 'help' || messageText === 'comandos') {
            const helpMessage = generateOwnerHelpMessage();
            conversationManager.logMessage(userPhoneId, 'La Huerta del Husky', helpMessage, false);
            await safeReply(message, helpMessage);
            console.log('📋 Comandos de dueño enviados');
            return;
        }
        
        // Comando para ver stock completo
        if (messageText.includes('stock completo') || messageText === 'stock' || messageText === 'inventario completo') {
            const stockInfo = await generateStockReport();
            conversationManager.logMessage(userPhoneId, 'La Huerta del Husky', stockInfo, false);
            await safeReply(message, stockInfo);
            console.log('📊 Stock completo enviado');
            return;
        }
        
        // Comando para agregar plantas nuevas al inventario
        if (messageText.startsWith('agregar ')) {
            const parts = messageText.split(' ');
            if (parts.length >= 4) {
                const plantName = parts[1];
                const price = parseInt(parts[2]);
                const stock = parseInt(parts[3]);
                
                if (!isNaN(price) && !isNaN(stock)) {
                    try {
                        // Agregar la planta al inventario usando InventoryModel
                        const InventoryModel = require('../backend/models/InventoryModel');
                        const newPlant = await InventoryModel.addPlant({
                            name: plantName.toLowerCase(),
                            displayName: plantName.charAt(0).toUpperCase() + plantName.slice(1),
                            category: 'nuevas',
                            price: price,
                            stock: stock,
                            description: `${plantName.charAt(0).toUpperCase() + plantName.slice(1)} - Agregada por el dueño`,
                            care: 'Cuidados por definir'
                        });
                        
                        const successMsg = `✅ **PLANTA AGREGADA AL INVENTARIO**\n\n🌱 **${newPlant.displayName}**\n💰 Precio: $${price}\n📦 Stock: ${stock} unidades\n\n¡Listo para vender! 🐺`;
                        
                        conversationManager.logMessage(userPhoneId, 'La Huerta del Husky', successMsg, false);
                        await safeReply(message, successMsg);
                        console.log(`✅ Nueva planta agregada: ${plantName}`);
                        return;
                    } catch (error) {
                        const errorMsg = `❌ No pude agregar la planta "${plantName}". Error: ${error.message}`;
                        await safeReply(message, errorMsg);
                        console.error('Error agregando planta:', error);
                        return;
                    }
                } else {
                    await safeReply(message, '❌ Precio y stock deben ser números.\n\n💡 Uso: `agregar [planta] [precio] [stock]`\n📝 Ejemplo: `agregar lavanda 35 15`');
                    return;
                }
            } else {
                await safeReply(message, '❌ Formato incorrecto.\n\n💡 Uso: `agregar [planta] [precio] [stock]`\n📝 Ejemplo: `agregar lavanda 35 15`');
                return;
            }
        }
        
        // Comando para stock bajo
        if (messageText.includes('stock bajo') || messageText.includes('alertas')) {
            const lowStockInfo = generateLowStockAlert();
            conversationManager.logMessage(userPhoneId, 'La Huerta del Husky', lowStockInfo, false);
            await safeReply(message, lowStockInfo);
            console.log('⚠️ Alertas de stock bajo enviadas');
            return;
        }
        
        const inventoryResponse = inventoryManager.processInventoryCommand(messageText, userPhoneId);
        if (inventoryResponse) {
            conversationManager.logMessage(userPhoneId, 'La Huerta del Husky', inventoryResponse, false);
            await safeReply(message, inventoryResponse);
            console.log('📦 Comando de inventario procesado');
            return;
        }
    }

    // === MANEJO INTELIGENTE DE IMÁGENES ===
    if (message.type === 'image') {
        console.log('📸 Imagen recibida, procesando...');
        await simulateTyping(message, 2000);
        
        try {
            // Verificar si tiene medios adjuntos
            if (message.hasMedia) {
                console.log('🔍 Descargando imagen para análisis...');
                await simulateTyping(message, 1500);
                
                const media = await message.downloadMedia();
                const imageBuffer = Buffer.from(media.data, 'base64');
                const filename = `planta_${Date.now()}.${media.mimetype.split('/')[1]}`;
                
                console.log(`🌿 Analizando imagen: ${filename}`);
                const analysisResult = await imageAnalyzer.analyzeImage(imageBuffer, filename);
                
                // El nuevo método devuelve un array de plantas directamente
                if (analysisResult && analysisResult.length > 0) {
                    const firstPlant = analysisResult[0];
                    
                    // Verificar si es el mensaje de error
                    if (firstPlant.name === 'No identificado' || firstPlant.name === 'Error de análisis') {
                        response = `🔍 ${firstPlant.message || firstPlant.common_name}`;
                        console.log('⚠️ No se pudo identificar planta en imagen');
                    } else {
                        // Planta identificada exitosamente
                        response = `🌿 **PLANTA IDENTIFICADA** 🎯

🔬 **${firstPlant.name}**
📝 ${firstPlant.common_name}
🎯 Confianza: ${firstPlant.confidence}%
🔍 Fuente: ${firstPlant.source}

${firstPlant.features ? `🧬 Características: ${firstPlant.features.join(', ')}` : ''}

💰 ¿Te interesa? ¡Checa nuestros precios! 🌱`;
                        
                        console.log('✅ Análisis exitoso de imagen');
                        
                        // **NOTIFICAR AL DUEÑO SI LA PLANTA NO ESTÁ EN INVENTARIO**
                        if (firstPlant.source !== 'Análisis Local') {
                            // Verificar si la planta identificada está en nuestro inventario  
                            const isInInventory = await checkPlantInInventory(firstPlant.name, firstPlant.scientific_name);
                            
                            if (!isInInventory && !inventoryManager.isOwner(userPhoneId)) {
                                // Enviar notificación al dueño
                                const ownerNotification = `🚨 **NUEVA PLANTA IDENTIFICADA**
                                
🤖 ${firstPlant.source} identificó una planta que NO tenemos en inventario:

🔬 **${firstPlant.scientific_name || firstPlant.name}**
🏷️ Nombre común: ${firstPlant.common_name}
🎯 Confianza: ${firstPlant.confidence}%

👤 **Cliente que preguntó:** ${userPhoneId}
📱 **Para agregar al inventario:**
\`agregar ${firstPlant.common_name.toLowerCase()} [precio] [stock]\`

💡 **Ejemplo:** \`agregar ${firstPlant.common_name.toLowerCase()} 45 20\`

¿Quieres que la agreguemos al inventario? 🌱`;

                                // Enviar notificación al dueño
                                await sendMessageToOwner(ownerNotification);
                                console.log(`📢 Notificación enviada al dueño sobre: ${firstPlant.name}`);
                            }
                        }
                    }
                } else {
                    response = '🔍 No detecté plantas por ningún método. ¿Podrías enviar otra foto más clara? 🌱';
                    console.log('⚠️ No se detectaron plantas en la imagen');
                }
            } else {
                // Imagen sin datos media (caso raro)
                const caption = message.body || '';
                if (caption.toLowerCase().includes('planta') || caption.toLowerCase().includes('identifica')) {
                    response = '🤔 No pude descargar tu imagen correctamente. ¿Puedes enviarla de nuevo? Me gusta ayudar identificando plantas 🌿';
                } else {
                    response = '� Vi que mandaste una imagen pero no la pude procesar bien � ¿Puedes mandarla otra vez?';
                }
            }
        } catch (error) {
            console.error('❌ Error procesando imagen:', error);
            response = '😅 Ups, tuve un problema con tu imagen. ¿Puedes intentar enviarla de nuevo? 🌱';
        }
    }
    
    // === COMANDO DE AYUDA PARA CLIENTES ===
    else if (messageText === '!help' || messageText === 'help' || messageText === 'comandos' || messageText === 'ayuda') {
        const clientHelpMessage = generateClientHelpMessage();
        response = clientHelpMessage;
    }
    
    // === RESPUESTAS ESPECÍFICAS INTELIGENTES ===
    else if (messageText.includes('que onda') || messageText.includes('qué onda')) {
        const ondaResponses = [
            '🐺 ¡Qué pedo! Aquí en el vivero, cuidando plantas 🌱 ¿Qué necesitas?',
            '🌿 ¡Órale! Todo bien por acá, trabajando con las plantas ¿Y tú qué tal?',
            '⚡ ¡Ey! Aquí ando, fresquecito como mis plantas 🌱 ¿En qué te ayudo?'
        ];
        response = ondaResponses[Math.floor(Math.random() * ondaResponses.length)];
    }
    
    else if (messageText.includes('que día') || messageText.includes('qué día') || messageText.includes('fecha') || messageText.includes('hoy')) {
        const today = new Date();
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        response = `🐺 Hoy es ${today.toLocaleDateString('es-MX', options)} 📅 ¡Buen día para comprar plantas! 🌱`;
    }

    else if (messageText.includes('horario') || messageText.includes('abren') || messageText.includes('cierran') || 
             messageText.includes('hora') || messageText.includes('abierto') || messageText.includes('abrieron')) {
        
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Domingo, 6 = Sábado
        const currentHour = today.getHours();
        
        // Si preguntan específicamente sobre "hoy"
        if (messageText.includes('hoy') || messageText.includes('abrieron') || messageText.includes('abren hoy')) {
            if (dayOfWeek === 6) { // Es sábado
                if (currentHour >= 10 && currentHour < 18) {
                    response = '🟢 ¡SÍ! Estamos ABIERTOS ahora mismo 🐺 Horario: 10AM-6PM los sábados 🌱 ¡Ven cuando gustes!';
                } else if (currentHour < 10) {
                    response = '🟡 Hoy SÍ abrimos pero hasta las 10AM 🐺 Aún no abrimos, pero en un ratito 🌱';
                } else {
                    response = '🔴 Ya cerramos hoy 😅 Abrimos solo sábados 10AM-6PM 🐺 ¡Te esperamos el próximo sábado! 🌱';
                }
            } else {
                const daysToSaturday = (6 - dayOfWeek) % 7 || 7;
                response = `🔴 NO, hoy no abrimos 🐺 Solo atendemos SÁBADOS 10AM-6PM 📅 Te esperamos en ${daysToSaturday} día${daysToSaturday > 1 ? 's' : ''} 🌱`;
            }
        } else {
            // Respuesta general sobre horarios
            const horariosResponses = [
                '⏰ Horarios: Solo SÁBADOS de 10:00 AM - 6:00 PM 🐺 ¡Ven el fin de semana!',
                '📅 Abrimos únicamente los SÁBADOS de 10AM a 6PM 🌱 ¿Te conviene el sábado?',
                '🕐 Solo atendemos SÁBADOS 10AM-6PM 🐺 ¡Te esperamos el fin de semana!',
                '🌱 Horario fijo: SÁBADOS 10:00 AM a 6:00 PM 🐺 ¡Perfecto para el weekend!'
            ];
            response = horariosResponses[Math.floor(Math.random() * horariosResponses.length)];
        }
    }

    else if (messageText.includes('domicilio') || messageText.includes('entregan') || messageText.includes('llevan')) {
        const domicilioResponses = [
            '� No hacemos entregas a domicilio, solo ventas en el vivero 🐺 ¡Pero vale la pena venir!',
            '🌱 Solo ventas aquí en el local, no llevamos plantas 🐺 Pero puedes venir los sábados',
            '⚡ No entregamos, tienes que venir por tus plantas 🌿 ¡Los sábados te esperamos!'
        ];
        response = domicilioResponses[Math.floor(Math.random() * domicilioResponses.length)];
    }
    
    else if (messageText.includes('que pedo') || messageText.includes('qué pedo')) {
        const pedoResponses = [
            '🐺 ¡Nada, aquí chingándole al vivero! ¿Y tú qué tal? ¿Buscas plantas? 🌱',
            '🌿 ¡Todo tranqui! Regando plantas y atendiendo clientes ¿Qué necesitas?',
            '⚡ ¡Pues nada, viviendo la vida husky! 🐕 ¿Te ayudo con algo del vivero?'
        ];
        response = pedoResponses[Math.floor(Math.random() * pedoResponses.length)];
    }
    
    else if (messageText.includes('precio') || messageText.includes('costo') || messageText.includes('cuanto')) {
        const priceResponses = [
            '💰 Te paso precios frescos: Ruda $35, Albahaca $40, Cilantro $30, Macetas desde $50 🌱',
            '🐺 Lista de precios: Aromáticas $25-45, Decorativas $40-80, Macetas $50-250 ¿Cuál te interesa?',
            '⚡ Precios del día: Plantas chicas $25-35, Medianas $40-60, Macetas $50+ 🌿'
        ];
        response = priceResponses[Math.floor(Math.random() * priceResponses.length)];
    }
    
    // BÚSQUEDA DE PLANTAS ESPECÍFICAS
    else if (messageText.includes('tienes') && (messageText.includes('ruda') || messageText.includes('albahaca') || messageText.includes('romero') || messageText.includes('cilantro') || messageText.includes('perejil') || messageText.includes('malva') || messageText.includes('hierbabuena') || messageText.includes('citronela'))) {
        // Detectar qué planta específica pregunta
        let plantaEspecifica = '';
        let precio = '';
        
        if (messageText.includes('ruda')) { plantaEspecifica = 'ruda'; precio = '$35'; }
        else if (messageText.includes('albahaca')) { plantaEspecifica = 'albahaca'; precio = '$40'; }
        else if (messageText.includes('romero')) { plantaEspecifica = 'romero'; precio = '$45'; }
        else if (messageText.includes('cilantro')) { plantaEspecifica = 'cilantro'; precio = '$30'; }
        else if (messageText.includes('perejil')) { plantaEspecifica = 'perejil'; precio = '$35'; }
        else if (messageText.includes('malva')) { plantaEspecifica = 'malva'; precio = '$25'; }
        else if (messageText.includes('hierbabuena')) { plantaEspecifica = 'hierbabuena'; precio = '$30'; }
        else if (messageText.includes('citronela')) { plantaEspecifica = 'citronela'; precio = '$50'; }
        
        const specificResponses = [
            `🌿 ¡Sí tengo ${plantaEspecifica}! Fresquita y de calidad, cuesta ${precio} 🐺 ¿Cuántas quieres?`,
            `🌱 ¡Claro! ${plantaEspecifica.charAt(0).toUpperCase() + plantaEspecifica.slice(1)} en ${precio} 💚 ¿Te la aparto?`,
            `🐺 ¡Por supuesto! Tengo ${plantaEspecifica} bien bonita en ${precio} ¿Te interesa?`,
            `⚡ ¡Órale sí! ${plantaEspecifica.charAt(0).toUpperCase() + plantaEspecifica.slice(1)} fresquecita ${precio} 🌿 ¿Cuántas plantas necesitas?`
        ];
        
        response = specificResponses[Math.floor(Math.random() * specificResponses.length)];
    }
    
    // PLANTAS ESPECÍFICAS SIN "TIENES"
    else if (messageText === 'malva' || messageText === 'ruda' || messageText === 'albahaca' || messageText === 'romero' || messageText === 'cilantro' || messageText === 'perejil' || messageText === 'citronela') {
        let plantaEspecifica = messageText;
        let precio = '';
        
        if (plantaEspecifica === 'ruda') precio = '$35';
        else if (plantaEspecifica === 'albahaca') precio = '$40';
        else if (plantaEspecifica === 'romero') precio = '$45';
        else if (plantaEspecifica === 'cilantro') precio = '$30';
        else if (plantaEspecifica === 'perejil') precio = '$35';
        else if (plantaEspecifica === 'malva') precio = '$25';
        else if (plantaEspecifica === 'citronela') precio = '$50';

        const soloPlantaResponses = [
            `🌿 ¿${plantaEspecifica.charAt(0).toUpperCase() + plantaEspecifica.slice(1)}? ¡Claro que sí! La tengo en ${precio} 🐺 ¿Te interesa?`,
            `🌱 ¡${plantaEspecifica.charAt(0).toUpperCase() + plantaEspecifica.slice(1)}! Sí manejo esa, ${precio} fresquecita 💚 ¿Cuántas quieres?`,
            `🐺 ¡Ah, ${plantaEspecifica}! Tengo de calidad en ${precio} ¿Te la aparto?`,
            `⚡ ¡${plantaEspecifica.charAt(0).toUpperCase() + plantaEspecifica.slice(1)} disponible! ${precio} cada una 🌿 ¿Cuántas necesitas?`
        ];
        
        response = soloPlantaResponses[Math.floor(Math.random() * soloPlantaResponses.length)];
    }
    
    // **PLANTAS QUE NO TENEMOS - DIRECTO Y CLARO**
    else if (messageText.includes('palo de brasil') || messageText.includes('palo brasil')) {
        const noTenemoResponse = [
            '🌿 Palo de Brasil no lo manejo 🐺 ¿Te interesa alguna de las que sí tengo?',
            '🌱 Esa no la tengo, pero manejo otras plantas chidas � ¿Te mando la lista?',
            '🐺 No tengo palo de brasil, pero tengo malva, ruda, albahaca ¿Te late alguna?'
        ];
        response = noTenemoResponse[Math.floor(Math.random() * noTenemoResponse.length)];
    }    // **MACETAS ESPECÍFICAS**
    else if (messageText.includes('macetas') || messageText.includes('maceta')) {
        const macetaResponses = [
            '🏺 ¡Macetas! Tengo de barro, plástico, cerámica 🐺 Desde $15 las chiquitas hasta $80 las grandes ¿Qué tamaño buscas?',
            '🌿 Macetas sí manejo: Chicas $15-25, Medianas $30-45, Grandes $50-80 🐺 ¿Para qué planta es?',
            '🏺 ¡Órale! Macetas de todos tamaños: Mini $15, Normal $25-35, Grandes $45-60, Jumbo $70-80 🌱 ¿Cuál te late?'
        ];
        response = macetaResponses[Math.floor(Math.random() * macetaResponses.length)];
    }
    
    else if (messageText.includes('plantas') || messageText.includes('tienes') || messageText.includes('stock')) {
        const stockResponses = [
            '🌱 Stock actual: Ruda $35, Albahaca $40, Romero $45, Cilantro $30, Perejil $35, Malva $25, Citronela $50 🐺 ¿Cuál buscas?',
            '🌿 Tengo bien surtido: Aromáticas, decorativas, suculentas, cactus ¿Qué tipo te late?',
            '🐺 ¡Claro! Manejo hierbas aromáticas, plantas decorativas y macetas ¿Te mando lista completa?'
        ];
        response = stockResponses[Math.floor(Math.random() * stockResponses.length)];
    }
    
    else if (messageText.includes('mamada') || messageText.includes('mames') || messageText.includes('menso') || messageText.includes('pendejo')) {
        const faceResponses = [
            '🐺 Jajaja ¡ya sé! A veces me emociono mucho con las plantas 😅 ¿En qué sí te ayudo?',
            '😂 Está bien, está bien ¡menos rollo husky! ¿Qué necesitas en serio del vivero?',
            '🤣 Tienes razón wey ¡ya me calmo! Dime qué plantas buscas 🌱',
            '😅 ¡Órale! Ya entendí el mensaje 🐕 ¿En qué te puedo ayudar de verdad?'
        ];
        response = faceResponses[Math.floor(Math.random() * faceResponses.length)];
    }
    
    else if (messageText.includes('hola') || messageText.includes('buenas') || messageText.includes('hey')) {
        const huskyNames = ['Koda', 'Alaska', 'Storm', 'Luna', 'Balto', 'Nova', 'Arctic', 'Blaze'];
        const randomName = huskyNames[Math.floor(Math.random() * huskyNames.length)];
        const greetings = [
            `🐺 ¡Hola ${userName}! Soy ${randomName} del vivero 🌱 ¿Qué plantas buscas?`,
            `🌿 ¡Órale! Soy ${randomName}, asistente de La Huerta del Husky 🐕 ¿En qué te ayudo?`,
            `⚡ ¡Qué tal! ${randomName} aquí, con las mejores plantas 🌱 ¿Te interesa algo?`
        ];
        response = greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    // COMANDOS ESPECIALES
    else if (messageText.startsWith('!historial')) {
        const history = conversationManager.formatUserHistoryForWhatsApp(userPhoneId);
        response = history;
    }
    
    else if (messageText.startsWith('!pedido ')) {
        const orderDetails = message.body.substring(8);
        const orderData = {
            items: [{ name: orderDetails, quantity: 1, price: 0 }],
            totalAmount: 0,
            notes: `Pedido desde WhatsApp: ${orderDetails}`
        };
        
        const newOrder = conversationManager.createOrder(userPhoneId, orderData);
        response = `📦 *PEDIDO CREADO* 🐺\n🆔 *Número:* ${newOrder.orderId}\n👤 *Cliente:* ${newOrder.customerName}\n📝 *Detalles:* ${orderDetails}\n📋 *Estado:* ${newOrder.status}\n\n¡Te contacto pronto para confirmar! 🌱`;
    }
    
    else if (messageText === '!stats') {
        const stats = conversationManager.getGeneralStats();
        response = `📊 *ESTADÍSTICAS HUSKY* 🐺\n👥 Clientes: ${stats.totalCustomers}\n💬 Mensajes: ${stats.totalMessages}\n📦 Pedidos: ${stats.totalOrders}\n💰 Revenue: $${stats.totalRevenue}`;
    }
    
    // 🔥 COMANDOS DEL COACH MOTIVACIONAL (SOLO DUEÑO)
    else if (inventoryManager.isOwner(userPhoneId) && messageText.startsWith('!coach')) {
        const coachCommand = messageText.split(' ')[1];
        
        if (coachCommand === 'stop') {
            motivationalCoach.toggleCoach();
            response = '🛑 Coach motivacional PAUSADO. Ya no te voy a chingar... por ahora 😈';
        }
        else if (coachCommand === 'start') {
            motivationalCoach.toggleCoach();
            response = '🔥 ¡COACH MOTIVACIONAL ACTIVADO! ¡Prepárate para que te rompa la madre con mensajes motivacionales! 💀';
        }
        else if (coachCommand === 'kick') {
            await motivationalCoach.sendImmediateKick(client, 'general');
            response = '💥 ¡PATADA MOTIVACIONAL ENVIADA! ¡A trabajar cabrón! 🦶';
        }
        else if (coachCommand === 'facebook') {
            await motivationalCoach.sendImmediateKick(client, 'facebook');
            response = '📱 ¡MENSAJE ANTI-FACEBOOK ENVIADO! ¡Deja esa mierda y ponte a trabajar! 🚫';
        }
        else if (coachCommand === 'limpieza') {
            await motivationalCoach.sendImmediateKick(client, 'limpieza');
            response = '🧹 ¡MENSAJE DE LIMPIEZA ENVIADO! ¡El desorden es la ruina! 💢';
        }
        else if (coachCommand === 'status') {
            const status = motivationalCoach.getStatus();
            response = `📊 **STATUS COACH MOTIVACIONAL**\n🔥 Activo: ${status.active ? 'SÍ' : 'NO'}\n⏰ Último mensaje: ${status.lastMessage ? new Date(status.lastMessage).toLocaleString('es-MX') : 'Ninguno'}\n📋 Horarios: ${status.totalSchedules}\n🎯 Categorías: ${status.categories}`;
        }
        else {
            response = `🔥 **COMANDOS DEL COACH MOTIVACIONAL**

!coach start - Activar coach
!coach stop - Pausar coach  
!coach kick - Mensaje inmediato
!coach facebook - Anti-Facebook
!coach limpieza - Motivar a limpiar
!coach status - Ver estado

💀 ¡EL COACH TE VA A CHINGAR HASTA QUE CUMPLAS! 🔥`;
        }
    }
    
    // ⏰ COMANDOS DE RECORDATORIOS (SOLO DUEÑO)
    else if (inventoryManager.isOwner(userPhoneId) && messageText.startsWith('!recordatorio')) {
        response = await reminderSystem.processCommand(messageText, client);
    }
    
    // === RESPUESTA GENERAL INTELIGENTE ===
    else {
        try {
            const huskyNames = ['Koda', 'Alaska', 'Storm', 'Luna', 'Balto', 'Nova', 'Arctic', 'Blaze'];
            const randomName = huskyNames[Math.floor(Math.random() * huskyNames.length)];
            
            // Crear contexto mejorado para la IA
            const isReturningClient = conversationHistory.length > 1;
            const lastBotName = isReturningClient ? 
                conversationHistory.slice(-5).find(msg => msg.sender === 'bot' && msg.text.includes('Soy '))?.text.match(/Soy (\w+)/)?.[1] 
                : null;
            
            const finalHuskyName = lastBotName || randomName;
            
            const contextForAI = conversationHistory.length > 0 
                ? `IMPORTANTE: Ya hablaste antes con este cliente. ${isReturningClient ? `Eres ${finalHuskyName}, NO te presentes de nuevo.` : ''}\nConversación reciente: ${conversationHistory.slice(-3).map(msg => `${msg.sender}: ${msg.text}`).join(' | ')}\nNuevo mensaje: ${message.body}`
                : message.body;
                
            const aiResponse = await huskyPersonality.generateResponse(contextForAI, {
                userName: userName,
                context: isReturningClient ? 'returning_client' : 'new_client',
                huskyName: finalHuskyName,
                hasContext: conversationHistory.length > 0,
                isReturningClient: isReturningClient
            });
            
            response = aiResponse;
            console.log('✅ Respuesta IA generada');
            
        } catch (error) {
            console.log('❌ Error IA, usando fallback inteligente:', error.message);
            
            // FALLBACKS INTELIGENTES SIN GROQ
            if (messageText.includes('hola') || messageText.includes('buenos')) {
                const saludoFallbacks = [
                    '🐺 ¡Órale! Soy Koda, trabajo aquí en La Huerta del Husky 🌱 ¿Qué necesitas?',
                    '🌿 ¡Hey! Koda aquí, empleado del vivero ¿En qué te ayudo? 🐺',
                    '⚡ ¡Qué tal! Soy Koda, trabajo en este vivero 🌱 ¿Buscas plantas?'
                ];
                response = saludoFallbacks[Math.floor(Math.random() * saludoFallbacks.length)];
            }
            else if (messageText.includes('gracias') || messageText.includes('thank')) {
                const graciasFallbacks = [
                    '🐺 ¡De nada! Para eso estamos aquí en el vivero 🌱',
                    '🌿 ¡Al contrario! Cualquier cosa me dices 🐺',
                    '⚡ ¡Claro! Siempre es un gusto ayudar con las plantas 🌱'
                ];
                response = graciasFallbacks[Math.floor(Math.random() * graciasFallbacks.length)];
            }
            else {
                const smartFallbacks = [
                    '🐺 ¡Hey! No te entendí muy bien ¿Me puedes decir qué necesitas del vivero? 🌱',
                    '🌿 ¿Cómo dices? Explícame mejor para ayudarte 🐺',
                    '⚡ No capté bien, ¿qué plantas buscas o en qué te ayudo?',
                    '🌱 ¿Eh? Dime otra vez qué necesitas del vivero 🐺'
                ];
                response = smartFallbacks[Math.floor(Math.random() * smartFallbacks.length)];
            }
        }
    }

    // ENVIAR RESPUESTA Y GUARDAR
    const sent = await safeReply(message, response);
    if (sent) {
        conversationManager.logMessage(userPhoneId, 'La Huerta del Husky', response, false);
        console.log('✅ Respuesta INTELIGENTE enviada y guardada');
        
        // 🔥 DETECCIÓN AUTOMÁTICA DEL COACH MOTIVACIONAL (SOLO PARA EL DUEÑO)
        if (inventoryManager.isOwner(userPhoneId)) {
            try {
                motivationalCoach.detectAndRespond(client, message.body);
            } catch (coachError) {
                console.error('⚠️ Error en coach motivacional:', coachError.message);
            }
        }
    } else {
        console.log('⚠️ No se pudo enviar respuesta - cliente posiblemente desconectado');
    }
});

// Manejar errores globales del proceso
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada sin manejar:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error);
    // No cerrar el proceso, intentar continuar
});

// Inicializar cliente
console.log('🔄 Inicializando cliente...');
client.initialize().catch(error => {
    console.error('❌ Error inicializando cliente:', error);
    attemptReconnect();
});

console.log('🚀 Bot MÁXIMO PODER iniciado - Responde a TODO!');