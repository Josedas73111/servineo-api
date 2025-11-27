// src/routes/conversations.js
const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const { validateConversationData, validateQueryParams } = require('../middlewares/validation');

// Ruta para crear nueva conversación
// POST /api/conversations
// Body: { usuario_numero, mensaje_usuario, mensaje_IA, tipo_medio }
router.post('/', validateConversationData, conversationController.createConversation);

// Ruta para obtener todas las conversaciones
// GET /api/conversations?startDate=2024-01-01&endDate=2024-12-31&tipo_medio=texto&sortOrder=desc
router.get('/', validateQueryParams, conversationController.getAllConversations);

// Ruta para obtener historial de un usuario específico
// GET /api/conversations/user/:usuario_numero
router.get('/user/:usuario_numero', validateQueryParams, conversationController.getUserHistory);

// Ruta para obtener estadísticas generales
// GET /api/conversations/stats
router.get('/stats', conversationController.getStats);

// Ruta para obtener estadísticas de un usuario
// GET /api/conversations/stats/:usuario_numero
router.get('/stats/:usuario_numero', conversationController.getStats);

module.exports = router;