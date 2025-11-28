// src/controllers/conversationController.js
const Conversation = require('../models/Conversation');
const moment = require('moment-timezone');

// Crear nueva conversación (guardar historial) - VERSIÓN CORREGIDA
const createConversation = async (req, res) => {
  try {
    // Nota: El middleware ya normalizó 'tipo_medio' a 'texto', 'imagen', etc.
    const tipo_medio = req.body.tipo_medio; 
    
    // Mensajes por defecto
    const mensajesPorDefecto = {
      'audio': { usuario: '[Audio recibido]', ia: 'Audio procesado correctamente' },
      'imagen': { usuario: '[Imagen recibida]', ia: 'Imagen recibida correctamente' },
      'video': { usuario: '[Video recibido]', ia: 'Video recibido correctamente' },
      'texto': { usuario: 'Mensaje de texto vacío', ia: '' }
    };

    const defaults = mensajesPorDefecto[tipo_medio] || mensajesPorDefecto['texto'];

    // Asegurar que mensaje_usuario no sea undefined ni null
    let mensajeUsuario = req.body.mensaje_usuario;
    if (!mensajeUsuario || typeof mensajeUsuario !== 'string' || mensajeUsuario.trim() === '') {
      mensajeUsuario = defaults.usuario;
    }

    let mensajeIA = req.body.mensaje_IA;
    if (!mensajeIA || typeof mensajeIA !== 'string' || mensajeIA.trim() === '') {
      mensajeIA = defaults.ia;
    }

    const conversationData = {
      usuario_numero: req.body.usuario_numero.toString().trim(), // Convertir a string por si acaso
      mensaje_usuario: mensajeUsuario,
      mensaje_IA: mensajeIA,
      tipo_medio: tipo_medio,
      fecha: req.body.fecha || moment().tz("America/La_Paz").format('YYYY-MM-DD HH:mm:ss')
    };

    console.log('📥 Guardando:', JSON.stringify(conversationData, null, 2));

    const conversation = new Conversation(conversationData);
    await conversation.save();

    console.log('✅ Conversación guardada ID:', conversation._id);

    res.status(201).json({
      success: true,
      message: 'Conversación guardada exitosamente',
      data: conversation
    });

  } catch (error) {
    console.error('❌ Error CRÍTICO al guardar:', error);

    // Error de Validación de Documento Mongo (Schema Validation en Atlas)
    if (error.code === 121) {
      return res.status(400).json({
        success: false,
        message: 'El documento no cumple con las reglas de validación de la base de datos (Schema Validation).',
        detail: 'Verifique que tipo_medio sea exactamente: texto, audio, imagen o video.',
        error: error.message
      });
    }
    
    // Error de validación de Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación Mongoose',
        errors: errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno al guardar la conversación',
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

    // Filtro por fechas (comparación de strings)
    if (startDate || endDate) {
      filter.fecha = {};
      if (startDate) filter.fecha.$gte = startDate;
      if (endDate) filter.fecha.$lte = endDate;
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
      .skip(skip)
      .lean(); // Mejor rendimiento

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
    console.error('❌ Error al obtener historial:', error);
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

    // Filtros por fecha
    if (startDate || endDate) {
      filter.fecha = {};
      if (startDate) filter.fecha.$gte = startDate;
      if (endDate) filter.fecha.$lte = endDate;
    }

    // Filtro por tipo de medio
    if (tipo_medio) {
      filter.tipo_medio = tipo_medio.toLowerCase();
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const conversations = await Conversation.find(filter)
      .sort({ fecha: sortOrder === 'asc' ? 1 : -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

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
    console.error('❌ Error al obtener conversaciones:', error);
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

    // Obtener conversación más reciente
    const lastConversation = await Conversation.findOne(filter)
      .sort({ fecha: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        total,
        byMediaType: stats,
        lastConversation: lastConversation ? lastConversation.fecha : null
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
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