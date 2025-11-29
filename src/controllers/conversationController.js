// src/controllers/conversationController.js
const Conversation = require('../models/Conversation');
const moment = require('moment-timezone');

// ==========================================
// 1. CREAR CONVERSACIÓN
// ==========================================
const createConversation = async (req, res) => {
  try {
    const tipo_medio = req.body.tipo_medio; 
    
    const mensajesPorDefecto = {
      'audio': { usuario: '[Audio recibido]', ia: 'Audio procesado correctamente' },
      'imagen': { usuario: '[Imagen recibida]', ia: 'Imagen recibida correctamente' },
      'video': { usuario: '[Video recibido]', ia: 'Video recibido correctamente' },
      'texto': { usuario: 'Mensaje de texto vacío', ia: '' }
    };

    const defaults = mensajesPorDefecto[tipo_medio] || mensajesPorDefecto['texto'];

    let mensajeUsuario = req.body.mensaje_usuario;
    if (!mensajeUsuario || typeof mensajeUsuario !== 'string' || mensajeUsuario.trim() === '') {
      mensajeUsuario = defaults.usuario;
    }

    let mensajeIA = req.body.mensaje_IA;
    if (!mensajeIA || typeof mensajeIA !== 'string' || mensajeIA.trim() === '') {
      mensajeIA = defaults.ia;
    }

    const ahora = moment().tz("America/La_Paz");
    const conversationData = {
      usuario_numero: req.body.usuario_numero ? req.body.usuario_numero.toString().trim() : 'Desconocido',
      mensaje_usuario: mensajeUsuario,
      mensaje_IA: mensajeIA,
      tipo_medio: tipo_medio,
      fecha: req.body.fecha || ahora.format('YYYY-MM-DD HH:mm:ss')
    };

    console.log('📥 Guardando conversación:', JSON.stringify(conversationData, null, 2));
    console.log('🕐 Timestamp actual (La Paz):', ahora.format('YYYY-MM-DD HH:mm:ss'));

    const conversation = new Conversation(conversationData);
    await conversation.save();

    console.log('✅ Conversación guardada con ID:', conversation._id);
    console.log('📅 Fecha almacenada:', conversation.fecha);

    res.status(201).json({
      success: true,
      message: 'Conversación guardada exitosamente',
      data: conversation,
      timestamp: ahora.format('YYYY-MM-DD HH:mm:ss')
    });

  } catch (error) {
    console.error('❌ Error CRÍTICO al guardar:', error);

    if (error.code === 121) {
      return res.status(400).json({
        success: false,
        message: 'Rechazado por base de datos (Schema Validation).',
        detail: 'Verifica que el campo tipo_medio sea exactamente: texto, audio, imagen o video.',
        error: error.message
      });
    }
    
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

// ==========================================
// 2. OBTENER HISTORIAL DE UN USUARIO (CORREGIDO)
// ==========================================
const getUserHistory = async (req, res) => {
  try {
    const { usuario_numero } = req.params;
    
    console.log(`📞 Consultando historial para usuario: ${usuario_numero}`);
    
    const { 
      startDate, 
      endDate, 
      tipo_medio, 
      sortOrder = 'desc',
      limit = 100,
      page = 1
    } = req.query;

    const filter = { usuario_numero };

    if (startDate || endDate) {
      filter.fecha = {};
      if (startDate) filter.fecha.$gte = startDate;
      if (endDate) filter.fecha.$lte = endDate;
    }

    if (tipo_medio) {
      filter.tipo_medio = tipo_medio.toLowerCase();
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    console.log('🔍 Filtros aplicados:', JSON.stringify(filter, null, 2));
    console.log(`📄 Paginación: página ${page}, límite ${limit}, saltar ${skip}`);
    console.log(`📊 Orden: ${sortOrder === 'asc' ? 'Ascendente' : 'Descendente'} por _id`);

    // CRÍTICO: Ordenar por _id (más confiable que fecha string)
    const conversations = await Conversation.find(filter)
      .sort({ _id: sortOrder === 'asc' ? 1 : -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Conversation.countDocuments(filter);
    
    console.log(`✅ Encontradas ${conversations.length} conversaciones de un total de ${total}`);
    
    if (conversations.length > 0) {
      console.log('📋 Últimas 3 conversaciones:');
      conversations.slice(0, 3).forEach((conv, idx) => {
        console.log(`  ${idx + 1}. ${conv.fecha} | ${conv.tipo_medio} | ${conv.mensaje_usuario.substring(0, 50)}...`);
      });
    }

    res.status(200).json({
      success: true,
      data: conversations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      debug: {
        timestamp: moment().tz("America/La_Paz").format('YYYY-MM-DD HH:mm:ss'),
        timezone: 'America/La_Paz',
        sortedBy: '_id',
        sortOrder: sortOrder
      }
    });
    
  } catch (error) {
    console.error('❌ Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el historial',
      error: error.message,
      timestamp: moment().tz("America/La_Paz").format('YYYY-MM-DD HH:mm:ss')
    });
  }
};

// ==========================================
// 3. OBTENER TODAS LAS CONVERSACIONES
// ==========================================
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

    if (startDate || endDate) {
      filter.fecha = {};
      if (startDate) filter.fecha.$gte = startDate;
      if (endDate) filter.fecha.$lte = endDate;
    }

    if (tipo_medio) {
      filter.tipo_medio = tipo_medio.toLowerCase();
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const conversations = await Conversation.find(filter)
      .sort({ _id: sortOrder === 'asc' ? 1 : -1 })
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

// ==========================================
// 4. OBTENER ESTADÍSTICAS
// ==========================================
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

    const lastConversation = await Conversation.findOne(filter)
      .sort({ _id: -1 })
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

// ==========================================
// EXPORTACIÓN DE MÓDULOS
// ==========================================
module.exports = {
  createConversation,
  getUserHistory,
  getAllConversations,
  getStats
};