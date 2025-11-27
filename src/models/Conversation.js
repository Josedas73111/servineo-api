// src/models/Conversation.js
const mongoose = require('mongoose');
// 1. Importamos moment-timezone para manejar la hora de Bolivia
const moment = require('moment-timezone');

const conversationSchema = new mongoose.Schema({
  usuario_numero: {
    type: String,
    required: [true, 'El número de usuario es obligatorio'],
    trim: true,
    index: true
  },
  mensaje_usuario: {
    type: String,
    required: [true, 'El mensaje del usuario es obligatorio']
  },
  mensaje_IA: {
    type: String,
    required: [true, 'La respuesta del asistente es obligatoria']
  },
  tipo_medio: {
    type: String,
    required: [true, 'El tipo de medio es obligatorio'],
    enum: {
      values: ['texto', 'audio', 'imagen', 'video'],
      message: '{VALUE} no es un tipo de medio válido'
    }
  },
  fecha: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  collection: 'historial_conversaciones', 
  timestamps: false, 
  versionKey: '__v',
  // 2. AQUÍ ESTÁ LA MAGIA: Transformamos los datos antes de enviarlos a la API
  toJSON: {
    transform: (document, returnedObject) => {
      // A. Arreglar el ID (quita el $oid)
      returnedObject.id = returnedObject._id.toString();
      delete returnedObject._id;
      
      // B. Eliminar la versión (__v)
      delete returnedObject.__v;

      // C. Formatear la fecha a hora de Bolivia (quita el $date)
      if (returnedObject.fecha) {
        returnedObject.fecha = moment(returnedObject.fecha)
          .tz('America/La_Paz')
          .format('YYYY-MM-DD HH:mm:ss');
      }
    }
  }
});

// Índices compuestos para búsquedas eficientes
conversationSchema.index({ usuario_numero: 1, fecha: -1 });
conversationSchema.index({ tipo_medio: 1, fecha: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);