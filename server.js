require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 3000;

// Conectar a la base de datos
connectDB();

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   🚀 Servidor Servineo API activo     ║
  ║   📡 Puerto: ${PORT}                      ║
  ║   🌍 Entorno: ${process.env.NODE_ENV || 'development'}        ║
  ║   📝 Local: http://localhost:${PORT}       ║
  ║   🌐 Red: http://0.0.0.0:${PORT}           ║
  ╚════════════════════════════════════════╝
  `);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM recibido. Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Error no manejado:', err);
  server.close(() => process.exit(1));
});