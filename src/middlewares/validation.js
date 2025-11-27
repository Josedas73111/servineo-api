// src/middlewares/validation.js

// Validar datos de conversación antes de guardar
const validateConversationData = (req, res, next) => {
  const { usuario_numero, mensaje_usuario, mensaje_IA, tipo_medio } = req.body;
  const errors = [];

  // Verificar campos obligatorios
  if (!usuario_numero || usuario_numero.trim() === '') {
    errors.push('El número de usuario es obligatorio');
  }

  if (!mensaje_usuario || mensaje_usuario.trim() === '') {
    errors.push('El mensaje del usuario es obligatorio');
  }

  if (!mensaje_IA || mensaje_IA.trim() === '') {
    errors.push('La respuesta del asistente es obligatoria');
  }

  if (!tipo_medio || tipo_medio.trim() === '') {
    errors.push('El tipo de medio es obligatorio');
  }

  // Validar tipo de medio
  const validMediaTypes = ['texto', 'audio', 'imagen', 'video'];
  if (tipo_medio && !validMediaTypes.includes(tipo_medio.toLowerCase())) {
    errors.push(`El tipo de medio debe ser uno de: ${validMediaTypes.join(', ')}`);
  }

  // Si hay errores, retornar respuesta de error
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: errors
    });
  }

  next();
};

// Validar parámetros de consulta
const validateQueryParams = (req, res, next) => {
  const { usuario_numero, startDate, endDate, tipo_medio, sortOrder } = req.query;

  // Validar formato de fechas si se proporcionan
  if (startDate && isNaN(Date.parse(startDate))) {
    return res.status(400).json({
      success: false,
      message: 'Formato de fecha inicial inválido'
    });
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    return res.status(400).json({
      success: false,
      message: 'Formato de fecha final inválido'
    });
  }

  // Validar tipo de medio si se proporciona
  const validMediaTypes = ['texto', 'audio', 'imagen', 'video'];
  if (tipo_medio && !validMediaTypes.includes(tipo_medio.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: `El tipo de medio debe ser uno de: ${validMediaTypes.join(', ')}`
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