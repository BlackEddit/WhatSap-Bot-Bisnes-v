/**
 * 💬 API ROUTES - CONVERSACIONES
 * Gestión del historial de conversaciones
 */

const express = require('express');
const router = express.Router();
const ConversationController = require('../controllers/ConversationController');

// GET /api/conversations - Obtener todas las conversaciones
router.get('/', ConversationController.getAll);

// GET /api/conversations/stats - Estadísticas de conversaciones
router.get('/stats', ConversationController.getStats);

// GET /api/conversations/:phoneId - Conversación específica
router.get('/:phoneId', ConversationController.getByPhone);

// POST /api/conversations/:phoneId/messages - Agregar mensaje
router.post('/:phoneId/messages', ConversationController.addMessage);

// DELETE /api/conversations/:phoneId - Eliminar conversación
router.delete('/:phoneId', ConversationController.deleteConversation);

module.exports = router;