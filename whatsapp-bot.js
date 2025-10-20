// Cargar variables de entorno PRIMERO
require('dotenv').config();

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const HuskyPersonality = require('./src/personality/HuskyPersonality');
const InventoryManager = require('./src/InventoryManager');
const ProductRecognizer = require('./src/ProductRecognizer');
const ConversationManager = require('./src/ConversationManager');
const MotivationalCoach = require('./backend/models/MotivationalCoach');
const ReminderSystem = require('./backend/models/ReminderSystem');
const ImageAnalyzer = require('./backend/models/ImageAnalyzer');

console.log('🤖 Bot WhatsApp - Iniciando...');
console.log('🐺 Personalidad Husky activada');
console.log('📦 Sistema de inventario con IA iniciado');
console.log('📸 Reconocedor de productos activado');
console.log('💬 Sistema de conversaciones y encargos activado');
console.log('💪 Sistema motivacional iniciado');
console.log('⏰ Sistema de recordatorios iniciado');
console.log('🌿 Sistema Unificado de Identificación de Plantas activado');

// Inicializar sistemas
const huskyPersonality = new HuskyPersonality();
const inventory = new InventoryManager();
const productRecognizer = new ProductRecognizer();
const conversationManager = new ConversationManager();
const motivationalCoach = new MotivationalCoach();
const reminderSystem = new ReminderSystem();
const imageAnalyzer = new ImageAnalyzer();

// Crear cliente con autenticación local
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false, // Volver a mostrar navegador para debugging
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Generar código QR
client.on('qr', (qr) => {
    console.log('📱 Escanea este código QR con tu WhatsApp:');
    qrcode.generate(qr, {small: true});
});

// Eventos de debugging
client.on('authenticated', () => {
    console.log('🔐 Cliente autenticado correctamente');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Error de autenticación:', msg);
});

client.on('disconnected', (reason) => {
    console.log('🔌 Cliente desconectado:', reason);
});

// Cliente listo
client.on('ready', async () => {
    console.log('✅ Bot conectado exitosamente!');
    console.log('🎯 Bot listo para responder mensajes');
    console.log('📤 Bot puede enviar mensajes proactivos');
    console.log('🌿 Sistema Unificado de Identificación operativo');
    
    // Inicializar sistemas especiales
    try {
        // Configurar sistemas con cliente de WhatsApp
        motivationalCoach.setWhatsAppClient(client);
        reminderSystem.setWhatsAppClient(client);
        
        // Inicializar sistema motivacional automático
        motivationalCoach.startScheduledMessages();
        console.log('💪 Sistema motivacional iniciado');
        
        // Reactivar recordatorios pendientes
        await reminderSystem.reactivatePendingReminders();
        console.log('⏰ Recordatorios reactivados');
        
        // Mostrar estadísticas de APIs
        const stats = await imageAnalyzer.plantIdentifier.getFullStats();
        console.log(`🔬 Sistema Unificado: ${stats.unified_system.apis_count} APIs activas`);
        
    } catch (error) {
        console.error('❌ Error inicializando sistemas especiales:', error);
    }
});

// Función para delay aleatorio (más humano)
function getRandomDelay() {
    return Math.floor(Math.random() * 3000) + 1000; // Entre 1-4 segundos
}

// Función para simular escritura
async function simulateTyping(message, delay) {
    const chat = await message.getChat();
    await chat.sendStateTyping();
    await new Promise(resolve => setTimeout(resolve, delay));
    await chat.clearState();
}

// Manejo de mensajes
client.on('message', async (message) => {
    // FILTRAR mensajes no deseados MEJORADO
    if (message.from === 'status@broadcast') {
        console.log('🚫 Ignorando status broadcast');
        return;
    }
    
    if (message.isStatus) {
        console.log('🚫 Ignorando mensaje de estado');
        return;
    }
    
    if (message.fromMe) {
        console.log('🚫 Ignorando mi propio mensaje');
        return;
    }

    // FILTRAR notificaciones spam
    if (message.type === 'e2e_notification' || message.type === 'notification_template') {
        console.log('🚫 Ignorando notificación spam');
        return;
    }

    // FILTRAR mensajes vacíos
    if (!message.body || message.body.trim() === '') {
        console.log('🚫 Ignorando mensaje vacío');
        return;
    }
    
    console.log(`📩 Mensaje recibido: ${message.body}`);
    console.log(`👤 De: ${message.from}`);
    console.log(`📱 Tipo: ${message.type}`);

    // GUARDAR MENSAJE EN HISTORIAL AUTOMÁTICAMENTE
    const userPhoneId = message.from;
    const userName = message.notifyName || message.pushname || 'Cliente';
    conversationManager.logMessage(userPhoneId, userName, message.body, true);
    
    // SISTEMA DE RESPUESTA RÁPIDA PARA CONVERSACIONES ACTIVAS
    const activeUsers = new Map();
    const currentUserId = message.from;
    const now = Date.now();
    
    // Verificar si el usuario estuvo activo recientemente (últimos 2 minutos)
    const lastActivity = activeUsers.get(currentUserId) || 0;
    const isActiveConversation = (now - lastActivity) < 120000; // 2 minutos
    
    // Actualizar actividad del usuario
    activeUsers.set(currentUserId, now);
    
    // Delay inteligente: rápido en conversación activa, normal para nuevos mensajes
    const delay = isActiveConversation ? Math.floor(Math.random() * 1000) + 500 : getRandomDelay(); // 0.5-1.5s vs 1-4s
    console.log(`⏳ ${isActiveConversation ? '🔥 CONVERSACIÓN ACTIVA' : '💬 NUEVO MENSAJE'} - Esperando ${delay}ms...`);
    
    // VERIFICAR SI ES DUEÑO PARA SISTEMA MOTIVACIONAL Y RECORDATORIOS
    const isOwner = message.from.includes('5214777244259');
    
    // SISTEMA MOTIVACIONAL (solo para el dueño)
    if (isOwner) {
        await motivationalCoach.detectAndRespond(message.body, message);
    }
    
    // SISTEMA DE RECORDATORIOS (solo para el dueño)
    if (isOwner && message.body.startsWith('!recordatorio ')) {
        const reminderText = message.body.substring(14).trim();
        await simulateTyping(message, delay);
        
        try {
            const result = await reminderSystem.createReminder(reminderText);
            await message.reply(result.message);
        } catch (error) {
            await message.reply(`❌ Error creando recordatorio: ${error.message}`);
        }
        return;
    }
    
    // PROCESAMIENTO DE IMÁGENES DE PLANTAS 🌿
    if (message.hasMedia) {
        const media = await message.downloadMedia();
        
        if (media.mimetype.startsWith('image/')) {
            console.log('🖼️ Imagen detectada - Iniciando análisis de planta...');
            await simulateTyping(message, 2000);
            await message.reply('🔬 Analizando tu planta con múltiples APIs especializadas...\n⏳ Esto puede tomar unos segundos...');
            
            try {
                // Convertir media a buffer
                const imageBuffer = Buffer.from(media.data, 'base64');
                
                // Analizar con sistema unificado
                const analysisResult = await imageAnalyzer.analyzeImage(imageBuffer, media.filename || 'imagen_whatsapp.jpg');
                
                if (analysisResult.success && analysisResult.plantFound) {
                    let responseMessage = analysisResult.message;
                    
                    // Agregar información de inventario si tenemos la planta
                    if (analysisResult.plantInfo && analysisResult.plantInfo.found) {
                        responseMessage += `\n\n🏪 **DISPONIBLE EN INVENTARIO:**\n`;
                        responseMessage += `💰 Precio: $${analysisResult.plantInfo.precio}\n`;
                        responseMessage += `📦 Stock: ${analysisResult.plantInfo.stock} unidades\n`;
                        responseMessage += `📝 ${analysisResult.plantInfo.descripcion}`;
                    } else {
                        responseMessage += `\n\n❓ **No tenemos esta planta en inventario actualmente.**\n`;
                        responseMessage += `💬 ¡Pero puedo conseguirla! Pregúntame por disponibilidad.`;
                    }
                    
                    await message.reply(responseMessage);
                } else {
                    await message.reply(analysisResult.message || '❌ No pude identificar esta imagen como una planta. \n\n🌿 Intenta con una foto más clara de la planta o pregúntame directamente qué plantas necesitas.');
                }
                
            } catch (error) {
                console.error('❌ Error analizando imagen:', error);
                await message.reply('❌ Hubo un error analizando tu imagen. \n\n💬 Puedes describirme la planta que buscas y te ayudo a encontrarla.');
            }
            return;
        }
    }
    
    // COMANDO PARA VER ESTADO DE LAS APIs
    if (message.body === '!apis') {
        await simulateTyping(message, delay);
        
        try {
            const stats = await imageAnalyzer.plantIdentifier.getFullStats();
            
            let apiStatus = `🔬 **ESTADO DEL SISTEMA UNIFICADO**\n\n`;
            apiStatus += `📊 **${stats.unified_system.name}**\n`;
            apiStatus += `🔢 Versión: ${stats.unified_system.version}\n`;
            apiStatus += `⚡ APIs activas: ${stats.unified_system.apis_count}\n\n`;
            
            Object.keys(stats.apis).forEach(apiName => {
                const api = stats.apis[apiName];
                apiStatus += `${api.enabled ? '✅' : '❌'} **${apiName}**\n`;
                apiStatus += `💰 Costo: ${api.cost}\n`;
                apiStatus += `📈 Peso: ${(api.weight * 100)}%\n`;
                if (api.limits) apiStatus += `⚠️ Límites: ${api.limits}\n`;
                apiStatus += `\n`;
            });
            
            await message.reply(apiStatus);
        } catch (error) {
            await message.reply('❌ Error obteniendo estado de APIs');
        }
        return;
    }
    
    // COMANDO PARA VER INSTRUCCIONES DE CONFIGURACIÓN
    if (message.body === '!config' || message.body === '!setup') {
        await simulateTyping(message, delay);
        
        const setupMessage = `🔧 **CONFIGURACIÓN DE APIs DISPONIBLES**\n\n`;
        setupMessage += `🤖 **GOOGLE VISION** (RECOMENDADO)\n`;
        setupMessage += `💰 $300 USD gratis al registrarte\n`;
        setupMessage += `🎯 Precisión: 95%+\n`;
        setupMessage += `📋 Setup: console.cloud.google.com\n\n`;
        
        setupMessage += `🌿 **PLANTNET OFFICIAL** (GRATIS)\n`;
        setupMessage += `🆓 500 requests/día gratis\n`;
        setupMessage += `📋 Setup: my.plantnet.org\n\n`;
        
        setupMessage += `🔍 **iNATURALIST** (GRATIS)\n`;
        setupMessage += `🆓 Sin límites, completamente gratis\n`;
        setupMessage += `📋 Setup: inaturalist.org/oauth/applications\n\n`;
        
        setupMessage += `📖 **GUÍA COMPLETA:**\n`;
        setupMessage += `Revisa: docs/API_SETUP_GUIDE.md\n\n`;
        
        setupMessage += `💡 **CON $300 de Google tienes meses de identificaciones perfectas**`;
        
        await message.reply(setupMessage);
        return;
    }
    
    // RECONOCIMIENTO DE PRODUCTOS POR IMAGEN/DESCRIPCIÓN
    if (message.body.startsWith('!reconocer ')) {
        const description = message.body.substring(11);
        await simulateTyping(message, delay);
        
        const recognition = productRecognizer.recognizeProduct(description);
        await message.reply(recognition.message);
        return;
    }

    if (message.body.startsWith('!precio ')) {
        const parts = message.body.split(' ');
        if (parts.length >= 3) {
            const productName = parts[1];
            const newPrice = parts[2];
            const reason = parts.slice(3).join(' ');
            
            // Buscar producto por nombre aproximado
            const products = Object.entries(productRecognizer.products.recognized_products);
            const found = products.find(([id, product]) => 
                product.name.toLowerCase().includes(productName.toLowerCase())
            );
            
            if (found) {
                const result = productRecognizer.updatePrice(found[0], parseFloat(newPrice), reason);
                await message.reply(result.message);
            } else {
                await message.reply('❌ Producto no encontrado. Usa !productos para ver la lista.');
            }
        } else {
            await message.reply('❌ Uso: !precio [producto] [nuevo_precio] [razón_opcional]');
        }
        return;
    }

    if (message.body === '!productos') {
        await simulateTyping(message, delay);
        const productsList = productRecognizer.getProductsList();
        await message.reply(productsList);
        return;
    }

    if (message.body.startsWith('!buscar_precio ')) {
        const params = message.body.substring(15).split(' ');
        if (params.length >= 2) {
            const minPrice = parseFloat(params[0]);
            const maxPrice = parseFloat(params[1]);
            
            await simulateTyping(message, delay);
            const results = productRecognizer.searchByPrice(minPrice, maxPrice);
            await message.reply(results);
        } else {
            await message.reply('❌ Uso: !buscar_precio [precio_min] [precio_max]');
        }
        return;
    }

    // COMANDOS DE INVENTARIO CON IA
    if (message.body.startsWith('!agregar ')) {
        const parts = message.body.split(' ');
        if (parts.length >= 5) {
            const [cmd, name, category, price, stock, ...desc] = parts;
            const description = desc.join(' ');
            
            await simulateTyping(message, delay);
            await message.reply('🎨 Generando producto con imagen de IA...');
            
            const result = await inventory.addProduct(name, category, price, stock, description);
            await message.reply(result.message);
            
            if (result.success) {
                await message.reply(inventory.formatProductForWhatsApp(result.product));
            }
        } else {
            await message.reply('❌ Uso: !agregar [nombre] [categoría] [precio] [stock] [descripción]');
        }
        return;
    }

    if (message.body.startsWith('!catalogo')) {
        const parts = message.body.split(' ');
        const category = parts[1] || null;
        
        await simulateTyping(message, delay);
        const catalog = inventory.formatCatalogForWhatsApp(category);
        await message.reply(catalog);
        return;
    }

    if (message.body.startsWith('!producto ')) {
        const productName = message.body.substring(10);
        const products = inventory.searchProducts(productName);
        
        await simulateTyping(message, delay);
        if (products.length > 0) {
            await message.reply(inventory.formatProductForWhatsApp(products[0]));
        } else {
            await message.reply('❌ Producto no encontrado. Escribe !catalogo para ver todos los productos.');
        }
        return;
    }

    if (message.body === '!reporte') {
        await simulateTyping(message, delay);
        const report = inventory.getInventoryReport();
        
        let reportText = `📊 *REPORTE DE INVENTARIO* 🐺\n`;
        reportText += `━━━━━━━━━━━━━━━━━━━━━━\n`;
        reportText += `📦 Total productos: ${report.totalProducts}\n`;
        reportText += `💰 Valor total: $${report.totalValue.toFixed(2)}\n`;
        reportText += `⚠️ Stock bajo: ${report.lowStock.length} productos\n\n`;
        
        reportText += `🏆 *TOP VENDEDORES:*\n`;
        report.topSellers.forEach((p, i) => {
            reportText += `${i+1}. ${p.name} (${p.sales} ventas)\n`;
        });
        
        await message.reply(reportText);
        return;
    }

    if (message.body === '!imagenes') {
        await simulateTyping(message, delay);
        await message.reply('🎨 Generando catálogo visual con IA...');
        
        const catalogImages = await inventory.generateCatalogImages();
        
        for (const categoryData of catalogImages) {
            await message.reply(`🖼️ *${categoryData.category.toUpperCase()}*\n${categoryData.imageUrl}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        return;
    }

    // COMANDOS DE CONVERSACIONES Y ENCARGOS
    if (message.body.startsWith('!historial')) {
        const parts = message.body.split(' ');
        const targetUserId = parts[1] || userPhoneId;
        
        await simulateTyping(message, delay);
        const history = conversationManager.formatUserHistoryForWhatsApp(targetUserId);
        await message.reply(history);
        return;
    }

    if (message.body.startsWith('!nota ')) {
        const noteText = message.body.substring(6);
        
        await simulateTyping(message, delay);
        const success = conversationManager.addNote(userPhoneId, noteText);
        
        if (success) {
            await message.reply('📝 Nota guardada correctamente en tu perfil');
        } else {
            await message.reply('❌ Error guardando la nota');
        }
        return;
    }

    if (message.body.startsWith('!pedido ')) {
        const orderDetails = message.body.substring(8);
        
        await simulateTyping(message, delay);
        
        // Parsear detalles básicos del pedido
        const orderData = {
            items: [{ name: orderDetails, quantity: 1, price: 0 }],
            totalAmount: 0,
            notes: `Pedido creado desde WhatsApp: ${orderDetails}`
        };
        
        const newOrder = conversationManager.createOrder(userPhoneId, orderData);
        
        const orderConfirmation = `📦 *PEDIDO CREADO* 🐺
        
🆔 *Número:* ${newOrder.orderId}
👤 *Cliente:* ${newOrder.customerName}
📝 *Detalles:* ${orderDetails}
⏰ *Fecha:* ${new Date().toLocaleDateString()}
📋 *Estado:* ${newOrder.status}

¡Te contactaré pronto para confirmar detalles y precio! 🌱`;
        
        await message.reply(orderConfirmation);
        return;
    }

    if (message.body === '!stats') {
        await simulateTyping(message, delay);
        
        const stats = conversationManager.getGeneralStats();
        
        let statsReport = `📊 *ESTADÍSTICAS LA HUERTA DEL HUSKY* 🐺\n`;
        statsReport += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        statsReport += `👥 *Total clientes:* ${stats.totalCustomers}\n`;
        statsReport += `💬 *Total mensajes:* ${stats.totalMessages}\n`;
        statsReport += `📦 *Total pedidos:* ${stats.totalOrders}\n`;
        statsReport += `💰 *Revenue total:* $${stats.totalRevenue}\n`;
        statsReport += `🔥 *Clientes activos (7 días):* ${stats.activeCustomers}\n`;
        statsReport += `⏳ *Pedidos pendientes:* ${stats.pendingOrders}\n\n`;
        
        if (stats.topInterests.length > 0) {
            statsReport += `🎯 *Top intereses:*\n`;
            stats.topInterests.forEach(([interest, count]) => {
                statsReport += `• ${interest}: ${count} clientes\n`;
            });
        }
        
        await message.reply(statsReport);
        return;
    }

    if (message.body.startsWith('!buscar ')) {
        const searchTerm = message.body.substring(8);
        
        await simulateTyping(message, delay);
        
        const results = conversationManager.searchCustomers({ 
            name: searchTerm 
        });
        
        if (results.length === 0) {
            await message.reply('❌ No se encontraron clientes con ese criterio');
            return;
        }
        
        let searchResults = `🔍 *RESULTADOS DE BÚSQUEDA* 🐺\n`;
        searchResults += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        results.slice(0, 5).forEach(customer => {
            searchResults += `👤 *${customer.name}*\n`;
            searchResults += `📱 ${customer.phone}\n`;
            searchResults += `📞 Último contacto: ${new Date(customer.lastContact).toLocaleDateString()}\n`;
            searchResults += `🛒 Pedidos: ${customer.totalOrders} | 💰 Gastado: $${customer.totalSpent}\n\n`;
        });
        
        await message.reply(searchResults);
        return;
    }

    // RESPUESTAS INTELIGENTES A PREGUNTAS ESPECÍFICAS
    const messageText = message.body.toLowerCase();

    // Responder a preguntas sobre plantas específicas
    if (messageText.includes('ruda') || messageText.includes('plantas') || messageText.includes('tienes')) {
        await simulateTyping(message, delay);
        
        const plantResponses = [
            '🌿 ¡Claro que tengo ruda! Es una de mis favoritas, súper aromática y perfecta para el jardín',
            '🌱 ¡Sí tenemos ruda! También tengo albahaca, romero, hierbabuena... ¿cuál te interesa más?',
            '🐺 ¡WOOF! Tengo ruda fresca, la cuido como mis cachorros. ¿Para qué la necesitas?',
            '🌿 ¡Por supuesto! Ruda, cilantro, perejil... mi huerta está llena de tesoros verdes'
        ];
        
        const randomPlant = plantResponses[Math.floor(Math.random() * plantResponses.length)];
        await message.reply(randomPlant);
        console.log('✅ Respuesta sobre plantas enviada');
        return;
    }

    // Responder a "quien eres" o similar
    if (messageText.includes('quien eres') || messageText.includes('que eres') || messageText.includes('como te llamas')) {
        await simulateTyping(message, delay);
        
        const huskyNames = ['Koda', 'Alaska', 'Storm', 'Luna', 'Balto', 'Nova', 'Arctic', 'Blaze'];
        const randomName = huskyNames[Math.floor(Math.random() * huskyNames.length)];
        
        const introResponses = [
            `🐺 ¡Auuuú! Soy ${randomName}, el husky guardián de La Huerta del Husky! 🌱 Cuido las mejores plantas orgánicas`,
            `🐕‍🦺 ¡Hola! Me llamo ${randomName} y soy el protector más leal de esta huerta 🌿 ¿Buscas algo especial?`,
            `⚡ ¡Soy ${randomName}! El husky más enérgico cuidando las plantas más frescas 🌱 ¿En qué te ayudo?`,
            `🔥 ¡${randomName} a tu servicio! Husky trabajador de La Huerta del Husky 🌿 ¿Qué necesitas?`
        ];
        
        const randomIntro = introResponses[Math.floor(Math.random() * introResponses.length)];
        await message.reply(randomIntro);
        console.log('✅ Presentación enviada');
        return;
    }

    // Responder a saludos con personalidad IA (si funciona) o fallback
    if (messageText.includes('hola') || messageText.includes('hey') || messageText.includes('buenas')) {
        await simulateTyping(message, delay);
        
        const huskyNames = ['Koda', 'Alaska', 'Storm', 'Luna', 'Balto', 'Nova', 'Arctic', 'Blaze'];
        const randomName = huskyNames[Math.floor(Math.random() * huskyNames.length)];
        
        const greetingResponses = [
            `🐺 ¡Hola ${message.notifyName || 'amigo'}! Soy ${randomName} del vivero 🌱 ¿Qué plantas buscas?`,
            `� ¡Órale! Soy ${randomName}, dueño de La Huerta del Husky 🐕 ¿En qué te ayudo?`,
            `⚡ ¡Qué tal! ${randomName} aquí, con las mejores plantas del vivero 🌱 ¿Te interesa algo?`,
            `🔥 ¡Hola! Soy ${randomName}, manejo este vivero 🌿 ¿Qué necesitas?`
        ];
        
        const greetingResponse = greetingResponses[Math.floor(Math.random() * greetingResponses.length)];
        await message.reply(greetingResponse);
        
        // Guardar respuesta
        conversationManager.logMessage(userPhoneId, 'La Huerta del Husky', greetingResponse, false);
        console.log('✅ Saludo enviado');
        return;
    }
    
    // RESPUESTA A TODO TIPO DE MENSAJE GENERAL
    if (messageText) {
        await simulateTyping(message, delay);
        
        // Respuestas específicas por contenido
        if (messageText.includes('precio') || messageText.includes('costo') || messageText.includes('cuanto')) {
            const priceResponses = [
                '💰 Precios directos del vivero: Ruda $35, Albahaca $40, macetas desde $50 🌱 ¿Qué te interesa?',
                '🐺 Lista de precios: Hierbas $25-45, Suculentas $30-60, Macetas $50-250 ¿Cuál necesitas?',
                '⚡ Precios frescos como mis plantas: Cilantro $30, Perejil $35, Macetas chicas $50 🌿',
                '💚 Precios del día: Plantas aromáticas desde $25, decorativas desde $40 ¿Te mando lista completa?'
            ];
            
            const randomPrice = priceResponses[Math.floor(Math.random() * priceResponses.length)];
            await message.reply(randomPrice);
        }
        else if (messageText.includes('mamada') || messageText.includes('mames') || messageText.includes('meriyein')) {
            const funnyResponses = [
                '🐺 Jajaja ¡ya sé que sueno muy emocionado! Es que me encanta mi vivero 🌱 ¿Qué plantas buscas en serio?',
                '😅 ¡Está bien, está bien! Sin tanto rollo husky 🐕 ¿En qué te puedo ayudar con plantas?',
                '🤣 Ok ok, menos ladridos y más plantas 🌿 ¿Qué necesitas del vivero?',
                '🐺 ¡Tienes razón! Me emociono mucho 😂 Mejor dime ¿qué plantas te interesan?'
            ];
            
            const randomFunny = funnyResponses[Math.floor(Math.random() * funnyResponses.length)];
            await message.reply(randomFunny);
        }
        else if (messageText.includes('plantas') || messageText.includes('tienes')) {
            const plantResponses = [
                '🌿 Tengo un buen de plantas: Ruda, albahaca, romero, cilantro, perejil, hierbabuena ¿Cuál buscas?',
                '🌱 En el vivero manejo: Aromáticas, decorativas, suculentas, cactus ¿Qué tipo te late?',
                '🐺 ¡Claro! Ruda $35, Albahaca $40, Romero $45, Cilantro $30 ¿Cuáles quieres?',
                '🌿 Sí tengo plantas frescas: hierbas aromáticas, plantas decorativas, suculentas ¿Te interesa alguna?'
            ];
            
            const randomPlant = plantResponses[Math.floor(Math.random() * plantResponses.length)];
            await message.reply(randomPlant);
        }
        else {
            // Respuesta general más normal
            const generalResponses = [
                '� ¡Hola! Soy del vivero La Huerta del Husky 🌱 ¿En qué te puedo ayudar?',
                '🌿 ¡Órale! ¿Qué necesitas del vivero? ¿Plantas, macetas, precios?',
                '⚡ ¡Qué onda! Aquí ando para ayudarte con plantas 🌱 ¿Qué buscas?',
                '🐕 ¡Hey! ¿Cómo te puedo ayudar con plantas hoy? 🌿'
            ];
            
            const randomGeneral = generalResponses[Math.floor(Math.random() * generalResponses.length)];
            await message.reply(randomGeneral);
        }
        
        // Guardar nuestra respuesta
        conversationManager.logMessage(userPhoneId, 'La Huerta del Husky', 'Respuesta automática', false);
        console.log('✅ Respuesta enviada y guardada');
        return;
    }

    // Responder a cupones/descuentos
    if (messageText.includes('cupón') || messageText.includes('cupon') || messageText.includes('descuento') || messageText.includes('oferta')) {
        await simulateTyping(message, delay);
        
        const discountResponses = [
            '🎟️ ¡Perfecto! Tengo descuentos especiales: 2x1 en hierbas aromáticas 🌿 ¿Te interesa?',
            '🐺 ¡AUUUÚ! Descuento husky: 15% en compras mayores a $200 ⚡ ¡Solo por ser mi amigo!',
            '🔥 ¡Oferta caliente! Lleva 3 plantas y la 4ta va GRATIS 🌱 ¿Cuáles te gustan?',
            '⭐ ¡Cupón especial! $20 de descuento en tu primera compra mayor a $150 💚'
        ];
        
        const randomDiscount = discountResponses[Math.floor(Math.random() * discountResponses.length)];
        await message.reply(randomDiscount);
        console.log('✅ Respuesta de descuento enviada');
        return;
    }

    // Responder a preguntas vagas como "alo"
    if (messageText.includes('alo') || messageText.includes('oye') || messageText.includes('estas ahi')) {
        await simulateTyping(message, delay);
        
        const attentionResponses = [
            '🐺 ¡Aquí estoy! ¡Siempre alerta como buen husky! ¿En qué te puedo ayudar? 🌱',
            '⚡ ¡Presente! ¿Necesitas plantas? ¿Precios? ¿Consejos de jardinería? ¡Dispara! 🌿',
            '🔥 ¡Listo para ayudarte! Soy tu husky de confianza para todo lo verde 🌱',
            '🐕‍🦺 ¡Aquí ando! ¿Buscas algo específico de la huerta? ¡Pregúntame lo que sea! 🌿'
        ];
        
        const randomAttention = attentionResponses[Math.floor(Math.random() * attentionResponses.length)];
        await message.reply(randomAttention);
        console.log('✅ Respuesta de atención enviada');
        return;
    }
    
    // Comando para enviar a número específico
    if (message.body.startsWith('!enviar ')) {
        const parts = message.body.split(' ');
        if (parts.length >= 3) {
            const numero = parts[1];
            const texto = parts.slice(2).join(' ');
            
            try {
                await client.sendMessage(`${numero}@c.us`, texto);
                await message.reply(`✅ Mensaje enviado a ${numero}`);
                console.log(`📤 Mensaje enviado a ${numero}: ${texto}`);
            } catch (error) {
                await message.reply(`❌ Error enviando mensaje: ${error.message}`);
            }
        }
    }
    
    // Comando para broadcast (enviar a todos)
    if (message.body.startsWith('!broadcast ')) {
        const texto = message.body.replace('!broadcast ', '');
        
        const chats = await client.getChats();
        let enviados = 0;
        
        for (let chat of chats) {
            if (!chat.isGroup) { // Solo chats privados
                try {
                    await chat.sendMessage(`📢 MENSAJE MASIVO:\n\n${texto}`);
                    enviados++;
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
                } catch (error) {
                    console.log(`❌ Error enviando a ${chat.name}: ${error.message}`);
                }
            }
        }
        
        await message.reply(`✅ Mensaje enviado a ${enviados} contactos`);
        console.log(`📤 Broadcast enviado a ${enviados} contactos`);
    }
    
    // Comando de ayuda
    if (message.body === '!help') {
        const isOwner = message.from.includes('5214777244259');
        
        let helpMessage = `🤖 **BOT LA HUERTA DEL HUSKY** 🌿\n\n`;
        
        helpMessage += `🌱 **IDENTIFICACIÓN DE PLANTAS:**\n`;
        helpMessage += `• Envía una foto → Identificación automática\n`;
        helpMessage += `• !apis → Estado del sistema de identificación\n\n`;
        
        helpMessage += `📦 **INVENTARIO Y PRODUCTOS:**\n`;
        helpMessage += `• !reconocer [descripción] → Reconocer productos\n`;
        helpMessage += `• !productos → Lista de productos\n`;
        helpMessage += `• !precio [producto] [precio] → Actualizar precio\n`;
        helpMessage += `• !buscar_precio [min] [max] → Buscar por rango\n`;
        helpMessage += `• !reporte → Reporte de inventario\n`;
        helpMessage += `• !imagenes → Catálogo visual\n\n`;
        
        helpMessage += `💬 **CONVERSACIONES:**\n`;
        helpMessage += `• !historial → Ver historial de conversación\n`;
        helpMessage += `• !nota [texto] → Agregar nota personal\n`;
        helpMessage += `• !buscar_cliente [término] → Buscar clientes\n\n`;
        
        helpMessage += `📢 **COMUNICACIÓN:**\n`;
        helpMessage += `• !enviar [número] [mensaje] → Enviar mensaje\n`;
        helpMessage += `• !broadcast [mensaje] → Mensaje masivo\n\n`;
        
        helpMessage += `🌿 **RESPUESTAS AUTOMÁTICAS:**\n`;
        helpMessage += `• "hola" → Saludo personalizado\n`;
        helpMessage += `• "cupón/descuento" → Ofertas especiales\n`;
        helpMessage += `• "plantas" → Lista de plantas disponibles\n\n`;
        
        if (isOwner) {
            helpMessage += `👑 **COMANDOS DE DUEÑO:**\n`;
            helpMessage += `• !recordatorio [texto] → Crear recordatorio\n`;
            helpMessage += `• Sistema motivacional automático activo\n`;
            helpMessage += `• Detección de palabras clave motivacionales\n\n`;
        }
        
        helpMessage += `🔬 **SISTEMA UNIFICADO:**\n`;
        helpMessage += `• iNaturalist API (GRATIS - 500K+ especies)\n`;
        helpMessage += `• PlantNet Official (GRATIS - 30K+ especies)\n`;
        helpMessage += `• Consenso automático entre APIs\n`;
        helpMessage += `• Fallback inteligente siempre disponible\n\n`;
        
        helpMessage += `📱 **Ejemplos:**\n`;
        helpMessage += `• Envía foto de planta → Identificación instantánea\n`;
        helpMessage += `• !enviar 5219876543210 Hola\n`;
        helpMessage += `• !recordatorio Llamar al proveedor mañana`;
        
        await message.reply(helpMessage);
        console.log('✅ Menú de ayuda completo enviado');
    }
});

// Manejo de errores
client.on('disconnected', (reason) => {
    console.log('❌ Cliente desconectado:', reason);
});

// Inicializar cliente
console.log('🔄 Inicializando cliente...');
client.initialize();