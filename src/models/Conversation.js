// src/models/Conversation.js
const mongoose = require('mongoose');

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
  collection: 'historial_conversaciones', // Nombre exacto de tu colección
  timestamps: false, // No usar createdAt/updatedAt porque usas "fecha"
  versionKey: '__v' // Mantener __v que ya tienes
});

// Índices compuestos para búsquedas eficientes
conversationSchema.index({ usuario_numero: 1, fecha: -1 });
conversationSchema.index({ tipo_medio: 1, fecha: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);