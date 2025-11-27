
const express = require('express');
const cors = require('cors');
const conversationRoutes = require('./routes/conversations');

const app = express();

// Middlewares globales
app.use(cors()); // Permitir peticiones desde n8n
app.use(express.json()); // Parsear JSON
app.use(express.urlencoded({ extended: true })); // Parsear URL-encoded

// Middleware para logging de peticiones
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Ruta de salud (health check)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Servineo funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Rutas de la API
app.use('/api/conversations', conversationRoutes);

// Ruta para manejar 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

module.exports = app;