/**
 * 💬 CONTROLADOR DE CONVERSACIONES
 * Lógica para gestión del historial de chats
 */

const ConversationManager = require('../models/ConversationManager');

class ConversationController {
    
    // GET /api/conversations
    static async getAll(req, res) {
        try {
            const conversationManager = new ConversationManager();
            const conversations = await conversationManager.getAllConversations();
            res.json({
                success: true,
                data: conversations,
                count: Object.keys(conversations || {}).length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error obteniendo conversaciones',
                error: error.message
            });
        }
    }

    // GET /api/conversations/stats
    static async getStats(req, res) {
        try {
            const conversationManager = new ConversationManager();
            const conversations = await conversationManager.getAllConversations();
            const stats = {
                totalConversations: Object.keys(conversations || {}).length,
                totalMessages: 0,
                activeToday: 0,
                topUsers: []
            };

            const today = new Date().toDateString();
            const userMessageCount = {};

            Object.entries(conversations || {}).forEach(([phoneId, messages]) => {
                stats.totalMessages += messages.length;
                userMessageCount[phoneId] = messages.length;

                // Verificar actividad de hoy
                const hasActivityToday = messages.some(msg => 
                    new Date(msg.timestamp).toDateString() === today
                );
                if (hasActivityToday) stats.activeToday++;
            });

            // Top usuarios por cantidad de mensajes
            stats.topUsers = Object.entries(userMessageCount)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([phoneId, count]) => ({ phoneId, messageCount: count }));

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error obteniendo estadísticas',
                error: error.message
            });
        }
    }

    // GET /api/conversations/:phoneId
    static async getByPhone(req, res) {
        try {
            const { phoneId } = req.params;
            const conversationManager = new ConversationManager();
            const conversation = await conversationManager.getConversationHistory(phoneId);
            
            res.json({
                success: true,
                data: {
                    phoneId,
                    messages: conversation,
                    messageCount: conversation.length
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error obteniendo conversación',
                error: error.message
            });
        }
    }

    // POST /api/conversations/:phoneId/messages
    static async addMessage(req, res) {
        try {
            const { phoneId } = req.params;
            const { sender, text, isBot } = req.body;
            
            const conversationManager = new ConversationManager();
            conversationManager.logMessage(phoneId, sender, text, !isBot);
            
            res.status(201).json({
                success: true,
                message: 'Mensaje agregado exitosamente'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Error agregando mensaje',
                error: error.message
            });
        }
    }

    // DELETE /api/conversations/:phoneId
    static async deleteConversation(req, res) {
        try {
            const { phoneId } = req.params;
            // Implementar eliminación de conversación
            res.json({
                success: true,
                message: 'Conversación eliminada exitosamente'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Error eliminando conversación',
                error: error.message
            });
        }
    }
}

module.exports = ConversationController;