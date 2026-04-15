const express = require('express');
const http = require('http');
const { Server } = require('socket.io');  // ← ESTA LÍNEA DEBE ESTAR ASÍ
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configuración CORS - Permitir Vercel y desarrollo local
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://192.168.1.7:3000",
  "https://sca-agrocuentas.vercel.app",
  "https://sca-agrocuentas-git-main-tuusuario.vercel.app"
];

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Middleware CORS para Express
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Conexión MongoDB Atlas (nube)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Atlas Conectado'))
  .catch(err => console.error('❌ Error MongoDB:', err));

// Middleware para pasar io a las rutas
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/proyectos', require('./routes/proyectos'));
app.use('/api/transacciones', require('./routes/Transaccion'));

// Socket.IO - Sistema PUB/SUB
io.on('connection', (socket) => {
  console.log(`🟢 Cliente conectado: ${socket.id}`);
  
  socket.on('registrar_usuario', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 Usuario ${userId} suscrito a canal user_${userId}`);
    socket.emit('registro_exitoso', { mensaje: 'Sistema de alertas activo' });
  });

  socket.on('disconnect', () => {
    console.log(`🔴 Cliente desconectado: ${socket.id}`);
  });
});

// Escuchar en 0.0.0.0 para permitir conexiones desde el celular
const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor SCA corriendo en:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Red:     http://192.168.1.7:${PORT}`);
  console.log(`📡 WebSocket PUB/SUB activo`);
});

module.exports = { app, io, server };