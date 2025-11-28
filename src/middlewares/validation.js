// src/middlewares/validation.js

// Validar datos de conversación antes de guardar
const validateConversationData = (req, res, next) => {
  const { usuario_numero, mensaje_usuario, mensaje_IA, tipo_medio, fecha } = req.body;
  const errors = [];

  // Campos OBLIGATORIOS según las rules de MongoDB
  if (!usuario_numero || usuario_numero.trim() === '') {
    errors.push('El número de usuario es obligatorio');
  }

  if (!tipo_medio || tipo_medio.trim() === '') {
    errors.push('El tipo de medio es obligatorio');
  }

  // fecha es obligatoria pero tiene default, así que solo validamos si viene
  if (fecha && fecha.trim() === '') {
    errors.push('La fecha no puede estar vacía');
  }

  // Validar tipo de medio (debe ser EXACTAMENTE uno de estos valores)
  const validMediaTypes = ['texto', 'audio', 'imagen', 'video'];
  if (tipo_medio && !validMediaTypes.includes(tipo_medio.toLowerCase())) {
    errors.push(`El tipo de medio debe ser exactamente uno de: ${validMediaTypes.join(', ')}`);
  }

  // Validar formato de número de teléfono (opcional pero recomendado)
  if (usuario_numero && !/^\+?\d{10,15}$/.test(usuario_numero.replace(/\s/g, ''))) {
    console.warn(`⚠️ Formato de número sospechoso: ${usuario_numero}`);
  }

  // Si hay errores, retornar respuesta de error
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: errors
    });
  }

  // Normalizar tipo_medio a minúsculas
  if (tipo_medio) {
    req.body.tipo_medio = tipo_medio.toLowerCase();
  }

  next();
};

// Validar parámetros de consulta
const validateQueryParams = (req, res, next) => {
  const { startDate, endDate, tipo_medio, sortOrder } = req.query;

  // Validar formato de fechas si se proporcionan
  if (startDate && isNaN(Date.parse(startDate))) {
    return res.status(400).json({
      success: false,
      message: 'Formato de fecha inicial inválido. Use formato: YYYY-MM-DD'
    });
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    return res.status(400).json({
      success: false,
      message: 'Formato de fecha final inválido. Use formato: YYYY-MM-DD'
    });
  }

  // Validar tipo de medio si se proporciona
  const validMediaTypes = ['texto', 'audio', 'imagen', 'video'];
  if (tipo_medio && !validMediaTypes.includes(tipo_medio.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: `El tipo de medio debe ser exactamente uno de: ${validMediaTypes.join(', ')}`
    });
  }

  // Validar orden de clasificación
  if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: 'El orden debe ser "asc" o "desc"'
    });
  }

  next();
};

module.exports = {
  validateConversationData,
  validateQueryParams
};