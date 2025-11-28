// src/controllers/conversationController.js
const Conversation = require('../models/Conversation');
const moment = require('moment-timezone');

// Crear nueva conversación (guardar historial)
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

// ... (MANTENER EL RESTO DE FUNCIONES getUserHistory, getAllConversations, etc. IGUAL QUE ANTES) ...

module.exports = {
  createConversation,
  // ... exportar las otras funciones también
  getUserHistory,
  getAllConversations,
  getStats
};