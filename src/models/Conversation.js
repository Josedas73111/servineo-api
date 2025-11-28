const mongoose = require('mongoose');
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
    required: false, // No es obligatorio según las rules
    default: ''
  },
  mensaje_IA: {
    type: String,
    required: false, // No es obligatorio según las rules
    default: ''
  },
  tipo_medio: {
    type: String,
    required: [true, 'El tipo de medio es obligatorio'],
    enum: {
      values: ['texto', 'audio', 'imagen', 'video'],
      message: '{VALUE} no es un tipo de medio válido'
    }
  },
  // CAMBIO CLAVE: Guardamos la fecha directamente como Texto (String)
  // con la hora de Bolivia ya calculada.
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
      delete returnedObject.__v;
    }
  }
});

// Índices compuestos para búsquedas eficientes
conversationSchema.index({ usuario_numero: 1, fecha: -1 });
conversationSchema.index({ tipo_medio: 1, fecha: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);