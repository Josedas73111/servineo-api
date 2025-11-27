// src/controllers/conversationController.js
const Conversation = require('../models/Conversation');

// Crear nueva conversación (guardar historial)
const createConversation = async (req, res) => {
  try {
    const conversationData = {
      usuario_numero: req.body.usuario_numero.trim(),
      mensaje_usuario: req.body.mensaje_usuario.trim(),
      mensaje_IA: req.body.mensaje_IA.trim(),
      tipo_medio: req.body.tipo_medio.toLowerCase(),
      fecha: req.body.fecha || new Date()
    };

    const conversation = new Conversation(conversationData);
    await conversation.save();

    res.status(201).json({
      success: true,
      message: 'Conversación guardada exitosamente',
      data: conversation
    });
  } catch (error) {
    console.error('Error al guardar conversación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar la conversación',
      error: error.message
    });
  }
};

// Obtener historial de un usuario específico
const getUserHistory = async (req, res) => {
  try {
    const { usuario_numero } = req.params;
    const { 
      startDate, 
      endDate, 
      tipo_medio, 
      sortOrder = 'desc',
      limit = 100,
      page = 1
    } = req.query;

    // Construir filtros
    const filter = { usuario_numero };

    // Filtro por fechas
    if (startDate || endDate) {
      filter.fecha = {};
      if (startDate) filter.fecha.$gte = new Date(startDate);
      if (endDate) filter.fecha.$lte = new Date(endDate);
    }

    // Filtro por tipo de medio
    if (tipo_medio) {
      filter.tipo_medio = tipo_medio.toLowerCase();
    }

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener conversaciones
    const conversations = await Conversation.find(filter)
      .sort({ fecha: sortOrder === 'asc' ? 1 : -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Contar total de registros
    const total = await Conversation.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: conversations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el historial',
      error: error.message
    });
  }
};

// Obtener todas las conversaciones con filtros
const getAllConversations = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      tipo_medio, 
      sortOrder = 'desc',
      limit = 100,
      page = 1
    } = req.query;

    const filter = {};

    // Filtros
    if (startDate || endDate) {
      filter.fecha = {};
      if (startDate) filter.fecha.$gte = new Date(startDate);
      if (endDate) filter.fecha.$lte = new Date(endDate);
    }

    if (tipo_medio) {
      filter.tipo_medio = tipo_medio.toLowerCase();
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const conversations = await Conversation.find(filter)
      .sort({ fecha: sortOrder === 'asc' ? 1 : -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Conversation.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: conversations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las conversaciones',
      error: error.message
    });
  }
};

// Obtener estadísticas
const getStats = async (req, res) => {
  try {
    const { usuario_numero } = req.params;
    
    const filter = usuario_numero ? { usuario_numero } : {};

    const stats = await Conversation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$tipo_medio',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Conversation.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        total,
        byMediaType: stats
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

module.exports = {
  createConversation,
  getUserHistory,
  getAllConversations,
  getStats
};