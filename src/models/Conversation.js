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
    default: function() {
      // Mensaje automático según el tipo de medio si está vacío
      const tipoTextos = {
        'audio': '[Audio recibido]',
        'imagen': '[Imagen recibida]',
        'video': '[Video recibido]',
        'texto': ''
      };
      return tipoTextos[this.tipo_medio] || '';
    }
  },
  mensaje_IA: {
    type: String,
    required: false, // No es obligatorio según las rules
    default: function() {
      // Respuesta automática según el tipo de medio si está vacío
      const tipoRespuestas = {
        'audio': 'Audio procesado correctamente',
        'imagen': 'Imagen recibida correctamente',
        'video': 'Video recibido correctamente',
        'texto': ''
      };
      return tipoRespuestas[this.tipo_medio] || '';
    }
  },
  tipo_medio: {
    type: String,
    required: [true, 'El tipo de medio es obligatorio'],
    enum: {
      values: ['texto', 'audio', 'imagen', 'video'],
      message: 'El tipo de medio debe ser exactamente: texto, audio, imagen o video'
    },
    lowercase: true // Convierte automáticamente a minúsculas
  },
  fecha: {
    type: String,
    required: [true, 'La fecha es obligatoria'],
    default: () => moment().tz("America/La_Paz").format('YYYY-MM-DD HH:mm:ss')
  }
}, {
  collection: 'conversaciones_historial',
  timestamps: false,
  versionKey: false,
  strict: true, // Solo permite campos definidos en el schema
  toJSON: {
    transform: (document, returnedObject) => {
      returnedObject.id = returnedObject._id.toString();
      delete returnedObject._id;
      delete returnedObject.__v;
    }
  }
});

// Índices para mejor rendimiento
conversationSchema.index({ usuario_numero: 1, fecha: -1 });
conversationSchema.index({ fecha: -1 });
conversationSchema.index({ tipo_medio: 1 });

// Hook pre-save para logging y validación
conversationSchema.pre('save', function(next) {
  const dbName = mongoose.connection.name;
  const expectedDB = 'Servineo_Database';
  
  // Asegurar que tipo_medio esté en minúsculas
  if (this.tipo_medio) {
    this.tipo_medio = this.tipo_medio.toLowerCase();
  }
  
  // Validar que tipo_medio sea uno de los valores permitidos
  const validTypes = ['texto', 'audio', 'imagen', 'video'];
  if (!validTypes.includes(this.tipo_medio)) {
    return next(new Error(`Tipo de medio inválido: ${this.tipo_medio}. Debe ser: texto, audio, imagen o video`));
  }
  
  if (dbName !== expectedDB) {
    console.warn(`⚠️ Guardando en BD "${dbName}" (se esperaba "${expectedDB}")`);
  }
  
  console.log(`💾 Guardando en: ${dbName}.conversaciones_historial`);
  console.log(`📝 Datos: ${this.usuario_numero} | ${this.tipo_medio} | ${this.fecha}`);
  
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema);