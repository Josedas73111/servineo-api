// src/controllers/conversationController.js
const Conversation = require('../models/Conversation');
const moment = require('moment-timezone');

// Crear nueva conversación (guardar historial)
const createConversation = async (req, res) => {
  try {
    const tipo_medio = (req.body.tipo_medio || 'texto').toLowerCase();
    
    // Mensajes por defecto según tipo de medio cuando vienen vacíos
    const mensajesPorDefecto = {
      'audio': {
        usuario: '[Audio recibido]',
        ia: 'Audio procesado correctamente'
      },
      'imagen': {
        usuario: '[Imagen recibida]',
        ia: 'Imagen recibida correctamente'
      },
      'video': {
        usuario: '[Video recibido]',
        ia: 'Video recibido correctamente'
      },
      'texto': {
        usuario: '',
        ia: ''
      }
    };

    // Obtener mensajes por defecto según el tipo
    const defaults = mensajesPorDefecto[tipo_medio] || mensajesPorDefecto['texto'];

    // Preparar datos - usar valores por defecto si vienen vacíos
    const mensaje_usuario_raw = req.body.mensaje_usuario || '';
    const mensaje_IA_raw = req.body.mensaje_IA || '';

    const conversationData = {
      usuario_numero: req.body.usuario_numero.trim(),
      mensaje_usuario: mensaje_usuario_raw.trim() || defaults.usuario,
      mensaje_IA: mensaje_IA_raw.trim() || defaults.ia,
      tipo_medio: tipo_medio,
      fecha: req.body.fecha || moment().tz("America/La_Paz").format('YYYY-MM-DD HH:mm:ss')
    };

    console.log('📥 Intentando guardar conversación:', {
      usuario: conversationData.usuario_numero,
      tipo: conversationData.tipo_medio,
      tiene_texto_usuario: !!mensaje_usuario_raw.trim(),
      tiene_texto_ia: !!mensaje_IA_raw.trim(),
      fecha: conversationData.fecha
    });

    const conversation = new Conversation(conversationData);
    await conversation.save();

    console.log('✅ Conversación guardada exitosamente');

    res.status(201).json({
      success: true,
      message: 'Conversación guardada exitosamente',
      data: conversation
    });
  } catch (error) {
    console.error('❌ Error al guardar conversación:', error);
    
    // Manejar errores de validación de MongoDB
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors
      });
    }

    // Manejar errores de MongoDB (duplicados, etc)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Registro duplicado',
        error: error.message
      });
    }

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