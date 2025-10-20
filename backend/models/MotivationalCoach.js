// Sistema Motivacional RUDO para el Dueño
// Envía mensajes duros para cumplir metas

class MotivationalCoach {
    constructor() {
        this.ownerPhone = '5214777244259@c.us';
        this.isActive = true;
        this.lastMessageTime = null;
        
        // Mensajes RUDOS motivacionales
        this.messages = {
            facebook: [
                "🔥 OYE CABRÓN! ¿Facebook otra vez? ¡Deja de perder el tiempo y ponte a trabajar!",
                "💀 PINCHE FACEBOOK ES UNA MIERDA! ¡Cierra esa mamada y haz algo productivo!",
                "⚡ ¡Facebook no te va a dar dinero! ¡Deja de scrollear como pendejo!",
                "🚫 ¡FACEBOOK = FRACASO! ¡Ponte las pilas y trabaja en tus metas!",
                "💥 ¡Otra vez en Facebook! ¿Qué chingados haces ahí? ¡TRABAJA!"
            ],
            
            limpieza: [
                "🧹 ¡EL DESORDEN ES LA RUINA! ¡Levanta tu trasero y limpia esa porquería!",
                "💢 ¡Tu casa está hecha un cochinero! ¡LÍMPIA YA O SEGUIRÁS SIENDO UN FRACASADO!",
                "🗑️ ¡HACE FALTA LIMPIAR ESE DESMADRE! ¡No seas huevón y organízate!",
                "⚡ ¡CASA SUCIA = MENTE SUCIA! ¡Deja de ser un cerdo y limpia!",
                "🔥 ¡El desorden mata la productividad! ¡LIMPIA ESE CAOS AHORA MISMO!"
            ],
            
            metas: [
                "🎯 ¡ESTÁS JODIDO SI NO CUMPLES TUS METAS! ¡Deja de ser un fracasado!",
                "💀 ¡Otra vez sin cumplir! ¿Qué vergas esperas? ¡LOS SUEÑOS NO SE CUMPLEN SOLOS!",
                "⚡ ¡BASTA DE EXCUSAS DE MIERDA! ¡Ponte a trabajar en lo que importa!",
                "🔥 ¡EL TIEMPO SE ACABA CABRÓN! ¡Haz algo o seguirás siendo mediocre!",
                "💥 ¡STOP! ¡Deja de procrastinar como pendejo y ACTÚA!"
            ],
            
            general: [
                "🚫 ¡PONTE LAS PILAS DE UNA VEZ! ¡No seas un huevón toda la vida!",
                "⚡ ¡QUÉ VERGAS HACES AHÍ SENTADO! ¡Levántate y trabaja!",
                "💢 ¡BASTA DE SER UN MEDIOCRE! ¡Haz algo grande hoy!",
                "🔥 ¡EL ÉXITO NO LLEGA SOLO! ¡Deja de ser flojo y trabaja!",
                "💀 ¡OTRO DÍA PERDIDO! ¿Cuándo vas a cambiar de verdad?"
            ],
            
            productividad: [
                "📈 ¡PRODUCTIVIDAD AL MÁXIMO O ERES UN FRACASO! ¡Dale que se puede!",
                "⏰ ¡EL TIEMPO ES ORO Y TÚ LO DESPERDICIAS! ¡Ponte a trabajar YA!",
                "🎯 ¡ENFÓCATE EN LO IMPORTANTE! ¡Deja las pendejadas para después!",
                "💪 ¡NO SEAS DÉBIL! ¡Los ganadores trabajan cuando no tienen ganas!",
                "🚀 ¡A LA CHINGADA CON LA PEREZA! ¡Hoy es el día de brillar!"
            ],
            
            disciplina: [
                "⚔️ ¡LA DISCIPLINA ES TU ARMA! ¡Úsala o seguirás siendo un perdedor!",
                "🏆 ¡LOS CAMPEONES SE FORJAN CON DISCIPLINA! ¡Tú puedes ser uno!",
                "💎 ¡LA CONSISTENCIA TE HARÁ RICO! ¡Deja de ser inconsistente!",
                "🔥 ¡CADA MINUTO CUENTA! ¡No desperdicies ni uno más!",
                "⚡ ¡AUTODISCIPLINA = LIBERTAD! ¡Deja de ser esclavo de tus impulsos!"
            ]
        };
        
        // Horarios de envío (más frecuente en horas productivas)
        this.schedules = [
            { hour: 8, minute: 30, message: 'metas' },
            { hour: 10, minute: 15, message: 'productividad' },
            { hour: 12, minute: 0, message: 'facebook' },
            { hour: 14, minute: 30, message: 'disciplina' },
            { hour: 16, minute: 45, message: 'limpieza' },
            { hour: 18, minute: 20, message: 'general' },
            { hour: 20, minute: 0, message: 'metas' }
        ];
    }

    // Obtener mensaje aleatorio por categoría
    getRandomMessage(category = 'general') {
        const messages = this.messages[category] || this.messages.general;
        return messages[Math.floor(Math.random() * messages.length)];
    }

    // Enviar mensaje motivacional al dueño
    async sendMotivationalMessage(whatsappClient, category = 'general', customMessage = null) {
        if (!this.isActive) return false;

        try {
            const message = customMessage || this.getRandomMessage(category);
            const fullMessage = `🤖 **COACH MOTIVACIONAL RUDO**

${message}

💪 ¡RECUERDA TUS METAS CABRÓN!
⏰ ${new Date().toLocaleTimeString('es-MX')}

_Comando: !coach stop - para pausar_`;

            await whatsappClient.sendMessage(this.ownerPhone, fullMessage);
            this.lastMessageTime = Date.now();
            
            console.log(`🔥 MENSAJE MOTIVACIONAL ENVIADO: ${category.toUpperCase()}`);
            return true;
            
        } catch (error) {
            console.error('❌ Error enviando mensaje motivacional:', error);
            return false;
        }
    }

    // Iniciar sistema de mensajes programados
    startScheduledMessages(whatsappClient) {
        console.log('🔥 COACH MOTIVACIONAL ACTIVADO - Preparando mensajes rudos...');
        
        // Verificar cada minuto si hay que enviar mensaje
        setInterval(() => {
            if (!this.isActive) return;
            
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            
            // Buscar si hay mensaje programado para esta hora
            const scheduled = this.schedules.find(s => 
                s.hour === currentHour && s.minute === currentMinute
            );
            
            if (scheduled) {
                this.sendMotivationalMessage(whatsappClient, scheduled.message);
            }
            
            // Mensajes aleatorios ocasionales (10% probabilidad cada hora)
            if (currentMinute === 0 && Math.random() < 0.1) {
                const categories = Object.keys(this.messages);
                const randomCategory = categories[Math.floor(Math.random() * categories.length)];
                
                setTimeout(() => {
                    this.sendMotivationalMessage(whatsappClient, randomCategory);
                }, Math.random() * 30000); // Esperar hasta 30 segundos
            }
            
        }, 60000); // Cada minuto
    }

    // Enviar mensaje inmediato
    async sendImmediateKick(whatsappClient, type = 'general') {
        const message = this.getRandomMessage(type);
        return await this.sendMotivationalMessage(whatsappClient, type, message);
    }

    // Controles del coach
    toggleCoach() {
        this.isActive = !this.isActive;
        return this.isActive;
    }

    getStatus() {
        return {
            active: this.isActive,
            lastMessage: this.lastMessageTime,
            totalSchedules: this.schedules.length,
            categories: Object.keys(this.messages).length
        };
    }

    // Mensaje personalizado
    async sendCustomMessage(whatsappClient, message) {
        const rudeMessage = `🔥 ${message.toUpperCase()} 💀`;
        return await this.sendMotivationalMessage(whatsappClient, 'general', rudeMessage);
    }

    // Detectar palabras clave y enviar mensaje apropiado
    detectAndRespond(whatsappClient, userMessage) {
        if (!this.isActive) return;
        
        const message = userMessage.toLowerCase();
        
        if (message.includes('facebook') || message.includes('fb')) {
            setTimeout(() => {
                this.sendMotivationalMessage(whatsappClient, 'facebook');
            }, 2000);
        }
        
        if (message.includes('limpi') || message.includes('desorden') || message.includes('sucio')) {
            setTimeout(() => {
                this.sendMotivationalMessage(whatsappClient, 'limpieza');
            }, 3000);
        }
        
        if (message.includes('meta') || message.includes('objetivo') || message.includes('fracas')) {
            setTimeout(() => {
                this.sendMotivationalMessage(whatsappClient, 'metas');
            }, 2500);
        }
    }
}

module.exports = MotivationalCoach;