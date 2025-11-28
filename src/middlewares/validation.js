// src/middlewares/validation.js

const validateConversationData = (req, res, next) => {
  let { usuario_numero, tipo_medio, fecha } = req.body;
  const errors = [];

  // 1. Normalización y Mapeo de Tipos (Inglés/Variaciones -> Español Estricto)
  // Esto soluciona el problema si n8n envía 'image' en lugar de 'imagen'
  if (tipo_medio) {
    const rawType = tipo_medio.toLowerCase().trim();
    
    const typeMapping = {
      'image': 'imagen',
      'photo': 'imagen',
      'foto': 'imagen',
      'text': 'texto',
      'voice': 'audio',
      'ptt': 'audio',
      'sticker': 'imagen', // Guardamos stickers como imágenes
      'document': 'texto'  // Guardamos docs como referencia de texto
    };

    // Si existe en el mapa, lo reemplazamos por el valor correcto
    if (typeMapping[rawType]) {
      req.body.tipo_medio = typeMapping[rawType];
      tipo_medio = req.body.tipo_medio; // Actualizamos variable local
    } else {
      // Si no está en el mapa, solo aseguramos minúsculas
      req.body.tipo_medio = rawType;
      tipo_medio = rawType;
    }
  }

  // 2. Validaciones Obligatorias
  if (!usuario_numero || usuario_numero.toString().trim() === '') {
    errors.push('El número de usuario es obligatorio');
  }

  if (!tipo_medio || tipo_medio.trim() === '') {
    errors.push('El tipo de medio es obligatorio');
  }

  // 3. Validación Estricta final (contra los valores permitidos por Mongo)
  const validMediaTypes = ['texto', 'audio', 'imagen', 'video'];
  if (tipo_medio && !validMediaTypes.includes(tipo_medio)) {
    errors.push(`El tipo de medio '${tipo_medio}' no es válido. Debe ser: ${validMediaTypes.join(', ')}`);
  }

  // Si hay errores, detener y responder
  if (errors.length > 0) {
    console.error('❌ Error de validación en request:', errors, req.body);
    return res.status(400).json({
      success: false,
      message: 'Error de validación de datos',
      errors: errors
    });
  }

  next();
};

const validateQueryParams = (req, res, next) => {
  const { startDate, endDate, tipo_medio, sortOrder } = req.query;

  if (startDate && isNaN(Date.parse(startDate))) {
    return res.status(400).json({ success: false, message: 'Formato de fecha inicial inválido (YYYY-MM-DD)' });
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    return res.status(400).json({ success: false, message: 'Formato de fecha final inválido (YYYY-MM-DD)' });
  }

  if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) {
    return res.status(400).json({ success: false, message: 'El orden debe ser "asc" o "desc"' });
  }

  next();
};

module.exports = {
  validateConversationData,
  validateQueryParams
};