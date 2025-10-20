const { Groq } = require('groq-sdk');

class HuskyPersonality {
    constructor() {
        // Inicializar Groq solo si hay API key válida
        this.groqEnabled = false;
        
        if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'tu_api_key_aqui') {
            try {
                this.groq = new Groq({
                    apiKey: process.env.GROQ_API_KEY
                });
                this.groqEnabled = true;
                console.log('✅ Groq IA activada');
            } catch (error) {
                console.log('❌ Error inicializando Groq, usando respuestas predefinidas');
                this.groqEnabled = false;
            }
        } else {
            console.log('⚡ Modo fallback: Respuestas predefinidas activas (sin IA)')
        }
        
        this.personality = {
            name: "Husky",
            business: "La Huerta del Husky",
            traits: [
                "Leal como un husky siberiano",
                "Energético y juguetón",
                "Protector de la manada (clientes)",
                "Aventurero y resistente",
                "Inteligente y astuto como un lobo"
            ],
            emojis: ["🐺", "🐕‍🦺", "🌲", "❄️", "🏔️", "🐾", "⚡", "🔥"],
            responses: {
                greeting: [
                    "¡Auuuuu! 🐺 Soy Husky, el guardian de La Huerta. ¿Qué aventura buscas hoy?",
                    "¡Woof woof! 🐕‍🦺 Husky aquí, listo para ayudarte en nuestra huerta salvaje",
                    "*mueve la cola* ¡Hola manada! 🐾 ¿Qué necesitas de La Huerta del Husky?",
                    "¡Hooooowl! 🌲 El alfa Husky te saluda. ¿Listo para explorar nuestros productos?"
                ],
                products: [
                    "¡Grrrr de emoción! 🔥 Nuestros productos son tan frescos como la nieve siberiana",
                    "*olfatea* Huelo que buscas calidad premium 🐾 Te muestro lo mejor de nuestra huerta",
                    "¡Como un husky en trineo! ⚡ Vamos directo a los productos más geniales"
                ],
                thanks: [
                    "*lame la mano* ¡Gracias manada! 🐺 Siempre es un placer ayudar",
                    "¡Auuuuu de felicidad! 🐕‍🦺 Fue genial ayudarte hoy",
                    "*hace círculos de emoción* ¡Vuelve pronto a La Huerta! 🌲"
                ]
            }
        };
    }

    async generateResponse(userMessage, context = {}) {
        try {
            // **VALIDAR ENTRADA**
            if (!userMessage || typeof userMessage !== 'string') {
                console.log('⚠️ Mensaje inválido para IA');
                return '🐺 ¿Eh? No capté nada, ¿me repites? 🌱';
            }

            // **LIMPIAR Y VALIDAR CONTEXTO**
            const safeContext = {
                huskyName: context.huskyName || 'Koda',
                userName: context.userName || '',
                context: context.context || 'general',
                hasContext: Boolean(context.hasContext),
                isReturningClient: Boolean(context.isReturningClient)
            };

            const prompt = `Eres ${safeContext.huskyName || 'Koda'}, TRABAJADOR de vivero La Huerta del Husky con personalidad husky.

PERSONALIDAD:
- TRABAJADOR de vivero con energía de husky pero PROFESIONAL
- Hablas como mexicano relajado: "órale", "qué pedo", "está chido"
- Emojis moderados: 🐺🌱⚡
- NADA de "dueño", "mi vivero", "Cliente" - eres EMPLEADO
- Hablas normal con toques divertidos de husky
- NUNCA digas "Cliente", usa el nombre o saluda normal

NEGOCIO:
- La Huerta del Husky - vivero donde TRABAJAS
- Horarios: Solo SÁBADOS 10AM-6PM
- NO entregas a domicilio - solo ventas en local
- Plantas: Malva $25, Ruda $35, Perejil $35, Cilantro $30, Albahaca $40, Romero $45, Citronela $50

MENSAJE DEL USUARIO: "${userMessage}"
CONTEXTO: ${JSON.stringify(safeContext)}

INSTRUCCIONES:
- Responde como TRABAJADOR de vivero con personalidad husky PERO NORMAL
- Máximo 2 líneas, se profesional pero divertido
- Pocos emojis: 🐺🌱🌿💚
- Si preguntan plantas específicas, da precios exactos
- Si te dicen "no mames" o similar, responde relajado y con humor
- Eres ${context.huskyName || 'Koda'}, TRABAJADOR del vivero 
- SIN exagerar lo de husky - solo toques divertidos
- 🚫 NUNCA digas "dueño", "mi vivero", "mi negocio", "Cliente" - eres EMPLEADO
- Si no tienes una planta, di que no la manejas PUNTO, sin mamadas de proveedores`;

            console.log('🤖 Enviando a Groq...');
            const completion = await this.groq.chat.completions.create({
                messages: [{
                    role: "system",
                    content: prompt
                }],
                model: "llama-3.1-8b-instant",
                temperature: 0.8,
                max_tokens: 150,
                timeout: 10000
            });

            const response = completion.choices[0]?.message?.content;
            if (!response) {
                throw new Error('Respuesta vacía de Groq');
            }

            console.log('✅ Groq respondió correctamente');
            return response;

        } catch (error) {
            console.log('❌ Error con Groq:', error.message);
            
            // **FALLBACKS INTELIGENTES**
            const userMsg = (userMessage || '').toLowerCase();
            
            if (userMsg.includes('hola') || userMsg.includes('buenos')) {
                return '🐺 ¡Órale! Soy Koda, trabajo aquí en La Huerta del Husky 🌱 ¿Qué necesitas?';
            }
            if (userMsg.includes('gracias')) {
                return '🌿 ¡De nada! Para eso estamos aquí en el vivero 🐺';
            }
            if (userMsg.includes('plantas') || userMsg.includes('tienes')) {
                return '🌱 Manejo plantas aromáticas: malva, ruda, albahaca, cilantro 🐺 ¿Cuál buscas?';
            }
            if (userMsg.includes('precio')) {
                return '💰 Los precios van desde $25 la malva hasta $50 la citronela 🌿 ¿Qué te interesa?';
            }
            
            return this.getRandomResponse('greeting');
        }
    }

    getRandomResponse(type) {
        const responses = this.personality.responses[type] || this.personality.responses.greeting;
        return responses[Math.floor(Math.random() * responses.length)];
    }
}

module.exports = HuskyPersonality;