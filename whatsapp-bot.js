const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log('🤖 Bot WhatsApp - Iniciando...');

// Crear cliente con autenticación local
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false, // Para ver el navegador
        args: ['--no-sandbox']
    }
});

// Generar código QR
client.on('qr', (qr) => {
    console.log('📱 Escanea este código QR con tu WhatsApp:');
    qrcode.generate(qr, {small: true});
});

// Cliente listo
client.on('ready', () => {
    console.log('✅ Bot conectado exitosamente!');
    console.log('🎯 Bot listo para responder mensajes');
    console.log('📤 Bot puede enviar mensajes proactivos');
    
    // EJEMPLO: Enviar mensaje proactivo después de 10 segundos
    setTimeout(async () => {
        console.log('🚀 Enviando mensaje de prueba proactivo...');
        
        // Obtener todos los chats
        const chats = await client.getChats();
        console.log(`📋 Encontré ${chats.length} chats`);
        
        // Enviar a los primeros 3 chats (para prueba)
        for (let i = 0; i < Math.min(3, chats.length); i++) {
            const chat = chats[i];
            
            // Solo enviar a chats privados (no grupos)
            if (!chat.isGroup) {
                console.log(`📤 Enviando mensaje proactivo a: ${chat.name}`);
                await chat.sendMessage('🤖 ¡Hola! Este es un mensaje proactivo de prueba. ¿Todo bien?');
                
                // Esperar entre mensajes
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }, 10000); // Después de 10 segundos
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
    // FILTRAR mensajes no deseados
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
    
    console.log(`📩 Mensaje recibido: ${message.body}`);
    console.log(`👤 De: ${message.from}`);
    console.log(`📱 Tipo: ${message.type}`);
    
    // Delay aleatorio para parecer humano
    const delay = getRandomDelay();
    console.log(`⏳ Esperando ${delay}ms antes de responder...`);
    
    // Responder a "hola"
    if (message.body.toLowerCase().includes('hola')) {
        await simulateTyping(message, delay);
        
        // Respuestas variadas (más humano)
        const responses = [
            '¡Hola! 👋 ¿Cómo estás? ¿En qué puedo ayudarte?',
            '¡Hey! 😊 ¿Qué tal? ¿Necesitas algo?', 
            '¡Hola! 🌟 Me da mucho gusto saludarte. ¿Cómo te puedo ayudar?',
            '¡Qué tal! 👋 ¿Todo bien? ¿En qué te puedo apoyar?'
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        await message.reply(randomResponse);
        console.log('✅ Respuesta enviada');
    }
    
    // Responder a "cupón"
    if (message.body.toLowerCase().includes('cupón') || message.body.toLowerCase().includes('cupon')) {
        const delay2 = getRandomDelay();
        await simulateTyping(message, delay2);
        
        const cuponResponses = [
            '🎟️ ¡Perfecto! Tenemos cupones increíbles disponibles. Te mando la info por mensaje privado.',
            '🎫 ¡Qué bueno que preguntes! Sí manejamos cupones de descuento. ¿Te interesa algún producto en particular?',
            '🏷️ ¡Claro que sí! Tenemos cupones activos. Déjame ver cuáles aplican para ti...',
            '🎟️ ¡Excelente timing! Justo tenemos nuevos cupones. ¿Qué tipo de producto buscas?'
        ];
        
        const randomCupon = cuponResponses[Math.floor(Math.random() * cuponResponses.length)];
        await message.reply(randomCupon);
        console.log('✅ Respuesta de cupón enviada');
    }
    
    // Responder a "descuento"
    if (message.body.toLowerCase().includes('descuento')) {
        const delay3 = getRandomDelay();
        await simulateTyping(message, delay3);
        
        const descuentoResponses = [
            '💰 ¡Genial! Tenemos descuentos hasta del 30% en productos seleccionados. ¿Te mando el catálogo?',
            '🔥 ¡Qué buena pregunta! Sí tenemos ofertas activas. Déjame enviarte los detalles...',
            '💸 ¡Perfecto timing! Tenemos promociones especiales corriendo. ¿En qué estás interesado?',
            '🎉 ¡Me encanta que preguntes! Tenemos descuentos increíbles. Te comparto la info.'
        ];
        
        const randomDescuento = descuentoResponses[Math.floor(Math.random() * descuentoResponses.length)];
        await message.reply(randomDescuento);
        console.log('✅ Respuesta de descuento enviada');
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
        await message.reply(`
🤖 *Bot de WhatsApp - Comandos*

*RESPUESTAS AUTOMÁTICAS:*
• "hola" → Saludo personalizado
• "cupón" → Info de cupones  
• "descuento" → Ofertas especiales

*COMANDOS AVANZADOS:*
• !help → Ver este menú
• !enviar [número] [mensaje] → Enviar a número específico
• !broadcast [mensaje] → Enviar a todos los contactos

*Ejemplo:*
!enviar 5219876543210 Hola, ¿cómo estás?

¡Ahora puedo enviar mensajes proactivos! �
        `);
        console.log('✅ Menú de ayuda enviado');
    }
});

// Manejo de errores
client.on('disconnected', (reason) => {
    console.log('❌ Cliente desconectado:', reason);
});

// Inicializar cliente
console.log('🔄 Inicializando cliente...');
client.initialize();