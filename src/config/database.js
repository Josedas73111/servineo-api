const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Agregar el nombre de la base de datos en las opciones
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'Servineo_Database' // Nombre explícito de la base de datos
    });

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    console.log(`📂 Base de datos activa: ${conn.connection.name}`);
    console.log(`📑 Colección: conversaciones_historial`);
    
  } catch (error) {
    console.error(`❌ Error de conexión a MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Evento para confirmar la conexión
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose conectado a MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Error de conexión Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose desconectado de MongoDB');
});

module.exports = connectDB;