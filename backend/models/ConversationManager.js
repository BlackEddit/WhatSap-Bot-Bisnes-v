const fs = require('fs');
const path = require('path');

class ConversationManager {
    constructor() {
        this.conversationsFile = path.join(__dirname, 'data/conversations.json');
        this.ordersFile = path.join(__dirname, 'data/orders.json');
        this.conversations = this.loadConversations();
        this.orders = this.loadOrders();
    }

    loadConversations() {
        try {
            if (fs.existsSync(this.conversationsFile)) {
                const data = fs.readFileSync(this.conversationsFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('❌ Error cargando conversaciones:', error);
        }
        
        return {
            users: {},
            lastUpdated: new Date().toISOString()
        };
    }

    loadOrders() {
        try {
            if (fs.existsSync(this.ordersFile)) {
                const data = fs.readFileSync(this.ordersFile, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('❌ Error cargando pedidos:', error);
        }
        
        return {
            orders: {},
            orderCounter: 0,
            lastUpdated: new Date().toISOString()
        };
    }

    saveConversations() {
        try {
            const dataDir = path.dirname(this.conversationsFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            this.conversations.lastUpdated = new Date().toISOString();
            fs.writeFileSync(this.conversationsFile, JSON.stringify(this.conversations, null, 2));
            return true;
        } catch (error) {
            console.error('❌ Error guardando conversaciones:', error);
            return false;
        }
    }

    saveOrders() {
        try {
            const dataDir = path.dirname(this.ordersFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            this.orders.lastUpdated = new Date().toISOString();
            fs.writeFileSync(this.ordersFile, JSON.stringify(this.orders, null, 2));
            return true;
        } catch (error) {
            console.error('❌ Error guardando pedidos:', error);
            return false;
        }
    }

    // Guardar cada mensaje de la conversación
    logMessage(userId, userName, messageBody, isFromUser = true) {
        const timestamp = new Date().toISOString();
        
        if (!this.conversations.users[userId]) {
            this.conversations.users[userId] = {
                name: userName || 'Cliente',
                phone: userId,
                firstContact: timestamp,
                lastContact: timestamp,
                totalMessages: 0,
                messages: [],
                interests: [],
                orders: [],
                notes: []
            };
        }

        const user = this.conversations.users[userId];
        
        // Agregar mensaje al historial
        user.messages.push({
            timestamp: timestamp,
            isFromUser: isFromUser,
            message: messageBody,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString()
        });

        user.lastContact = timestamp;
        user.totalMessages += 1;
        user.name = userName || user.name;

        // Detectar intereses automáticamente
        this.detectInterests(userId, messageBody);

        this.saveConversations();
        
        console.log(`💬 Mensaje guardado: ${userName || userId} - "${messageBody.substring(0, 30)}..."`);
    }

    // Detectar automáticamente qué le interesa al cliente
    detectInterests(userId, message) {
        const user = this.conversations.users[userId];
        
        // Verificar que el mensaje existe y no es undefined
        if (!message || typeof message !== 'string') {
            console.log('⚠️ Mensaje inválido para detectar intereses');
            return;
        }
        
        const messageLower = message.toLowerCase();
        
        const interests = {
            'plantas': ['planta', 'ruda', 'albahaca', 'romero', 'cilantro', 'perejil', 'hierbas'],
            'macetas': ['maceta', 'recipiente', 'contenedor'],
            'precios': ['precio', 'costo', 'cuanto', 'vale'],
            'descuentos': ['descuento', 'oferta', 'cupón', 'promoción'],
            'semillas': ['semilla', 'sembrar', 'plantar'],
            'decorativas': ['decorativa', 'adorno', 'bonita']
        };

        for (const [category, keywords] of Object.entries(interests)) {
            if (keywords.some(keyword => messageLower.includes(keyword))) {
                if (!user.interests.includes(category)) {
                    user.interests.push(category);
                    console.log(`🎯 Interés detectado para ${user.name}: ${category}`);
                }
            }
        }
    }

    // Crear un nuevo encargo/pedido
    createOrder(userId, orderDetails) {
        this.orders.orderCounter += 1;
        const orderId = `ORD-${String(this.orders.orderCounter).padStart(4, '0')}`;
        
        const order = {
            orderId: orderId,
            userId: userId,
            customerName: this.conversations.users[userId]?.name || 'Cliente',
            items: orderDetails.items || [],
            totalAmount: orderDetails.totalAmount || 0,
            status: 'pendiente', // pendiente, confirmado, en_proceso, entregado, cancelado
            notes: orderDetails.notes || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deliveryDate: orderDetails.deliveryDate || null,
            paymentMethod: orderDetails.paymentMethod || null,
            paymentStatus: 'pendiente' // pendiente, pagado, parcial
        };

        this.orders.orders[orderId] = order;

        // Agregar referencia del pedido al usuario
        if (this.conversations.users[userId]) {
            this.conversations.users[userId].orders.push(orderId);
        }

        this.saveOrders();
        this.saveConversations();

        console.log(`📦 Nuevo pedido creado: ${orderId} para ${order.customerName}`);
        return order;
    }

    // Agregar nota al cliente
    addNote(userId, note) {
        if (this.conversations.users[userId]) {
            this.conversations.users[userId].notes.push({
                note: note,
                timestamp: new Date().toISOString(),
                date: new Date().toLocaleDateString()
            });
            this.saveConversations();
            return true;
        }
        return false;
    }

    // Obtener historial completo de un cliente
    getUserHistory(userId) {
        const user = this.conversations.users[userId];
        if (!user) {
            return null;
        }

        const userOrders = user.orders.map(orderId => this.orders.orders[orderId]).filter(Boolean);
        
        return {
            ...user,
            orderHistory: userOrders,
            totalSpent: userOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
            favoriteProducts: this.getFavoriteProducts(userId)
        };
    }

    // Obtener productos favoritos basado en conversaciones
    getFavoriteProducts(userId) {
        const user = this.conversations.users[userId];
        if (!user) return [];

        const productMentions = {};
        const products = ['ruda', 'albahaca', 'romero', 'cilantro', 'maceta', 'suculenta'];

        user.messages.forEach(msg => {
            if (msg.isFromUser) {
                products.forEach(product => {
                    if (msg.message.toLowerCase().includes(product)) {
                        productMentions[product] = (productMentions[product] || 0) + 1;
                    }
                });
            }
        });

        return Object.entries(productMentions)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([product, count]) => ({ product, mentions: count }));
    }

    // Buscar clientes por criterios
    searchCustomers(criteria) {
        const results = [];
        
        for (const [userId, user] of Object.entries(this.conversations.users)) {
            let matches = false;
            
            if (criteria.name && user.name.toLowerCase().includes(criteria.name.toLowerCase())) {
                matches = true;
            }
            
            if (criteria.interest && user.interests.includes(criteria.interest)) {
                matches = true;
            }
            
            if (criteria.hasOrders && user.orders.length > 0) {
                matches = true;
            }
            
            if (matches) {
                results.push({
                    userId: userId,
                    ...user,
                    totalOrders: user.orders.length,
                    totalSpent: user.orders.reduce((sum, orderId) => {
                        const order = this.orders.orders[orderId];
                        return sum + (order?.totalAmount || 0);
                    }, 0)
                });
            }
        }
        
        return results.sort((a, b) => new Date(b.lastContact) - new Date(a.lastContact));
    }

    // Formato para WhatsApp - Historial del cliente
    formatUserHistoryForWhatsApp(userId) {
        const history = this.getUserHistory(userId);
        if (!history) {
            return "❌ Cliente no encontrado en el historial.";
        }

        let report = `👤 *HISTORIAL DEL CLIENTE* 🐺\n`;
        report += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        report += `📝 *Nombre:* ${history.name}\n`;
        report += `📱 *Teléfono:* ${history.phone}\n`;
        report += `📅 *Primer contacto:* ${new Date(history.firstContact).toLocaleDateString()}\n`;
        report += `📞 *Último contacto:* ${new Date(history.lastContact).toLocaleDateString()}\n`;
        report += `💬 *Total mensajes:* ${history.totalMessages}\n`;
        report += `🛒 *Total pedidos:* ${history.orders.length}\n`;
        report += `💰 *Total gastado:* $${history.totalSpent}\n\n`;

        if (history.interests.length > 0) {
            report += `🎯 *Intereses detectados:*\n`;
            history.interests.forEach(interest => {
                report += `• ${interest}\n`;
            });
            report += `\n`;
        }

        if (history.favoriteProducts.length > 0) {
            report += `❤️ *Productos favoritos:*\n`;
            history.favoriteProducts.forEach(fav => {
                report += `• ${fav.product} (mencionado ${fav.mentions} veces)\n`;
            });
            report += `\n`;
        }

        if (history.notes.length > 0) {
            report += `📋 *Notas importantes:*\n`;
            history.notes.slice(-3).forEach(note => {
                report += `• ${note.note} (${note.date})\n`;
            });
            report += `\n`;
        }

        if (history.orderHistory.length > 0) {
            report += `📦 *Últimos pedidos:*\n`;
            history.orderHistory.slice(-3).forEach(order => {
                report += `• ${order.orderId} - $${order.totalAmount} (${order.status})\n`;
            });
        }

        return report;
    }

    // Obtener estadísticas generales
    getGeneralStats() {
        const users = Object.values(this.conversations.users);
        const orders = Object.values(this.orders.orders);
        
        return {
            totalCustomers: users.length,
            totalMessages: users.reduce((sum, user) => sum + user.totalMessages, 0),
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
            activeCustomers: users.filter(user => {
                const daysSinceContact = (Date.now() - new Date(user.lastContact)) / (1000 * 60 * 60 * 24);
                return daysSinceContact <= 7;
            }).length,
            topInterests: this.getTopInterests(),
            pendingOrders: orders.filter(order => order.status === 'pendiente').length
        };
    }

    getTopInterests() {
        const interestCount = {};
        Object.values(this.conversations.users).forEach(user => {
            user.interests.forEach(interest => {
                interestCount[interest] = (interestCount[interest] || 0) + 1;
            });
        });
        
        return Object.entries(interestCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
    }

    // **MÉTODO FALTANTE PARA CONTEXTO**
    getConversationHistory(userId) {
        if (!this.conversations.users[userId]) {
            return [];
        }
        
        return this.conversations.users[userId].messages.map(msg => ({
            timestamp: msg.timestamp,
            text: msg.text,
            sender: msg.isFromUser ? 'user' : 'bot'
        }));
    }

    // Método para obtener todas las conversaciones (para API)
    getAllConversations() {
        return this.conversations.users || {};
    }

    // Método para obtener estadísticas generales
    getStats() {
        const users = this.conversations.users || {};
        const totalUsers = Object.keys(users).length;
        let totalMessages = 0;
        let activeToday = 0;
        
        const today = new Date().toDateString();
        
        Object.values(users).forEach(user => {
            totalMessages += user.messages.length;
            
            const hasActivityToday = user.messages.some(msg => 
                new Date(msg.timestamp).toDateString() === today
            );
            
            if (hasActivityToday) {
                activeToday++;
            }
        });
        
        return {
            totalUsers,
            totalMessages,
            activeToday,
            lastActivity: this.conversations.lastUpdated
        };
    }
}

module.exports = ConversationManager;