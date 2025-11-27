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
    required: [true, 'El mensaje del usuario es obligatorio']
  },
  mensaje_IA: {
    type: String,
    required: [true, 'La respuesta del asistente es obligatoria']
  },
  tipo_medio: {
    type: String,
    required: [true, 'El tipo de medio es obligatorio'],
    enum: ['texto', 'audio', 'imagen', 'video']
  },
  // CAMBIO CLAVE: Guardamos la fecha directamente como Texto (String)
  // con la hora de Bolivia ya calculada.
  fecha: {
    type: String,
    default: () => moment().tz("America/La_Paz").format('YYYY-MM-DD HH:mm:ss')
  }
}, {
  collection: 'historial_conversaciones',
  timestamps: false,
  versionKey: false, // Quitamos __v directamente aquí
  toJSON: {
    transform: (document, returnedObject) => {
      // Solo arreglamos el ID, la fecha ya vendrá bien
      returnedObject.id = returnedObject._id.toString();
      delete returnedObject._id;
      delete returnedObject.__v;
    }
  }
});

// Índices
conversationSchema.index({ usuario_numero: 1, fecha: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);