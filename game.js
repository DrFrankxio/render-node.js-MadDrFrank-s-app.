const mongoose = require('mongoose');
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Conectar a MongoDB
const uri = "mongodb+srv://franchuten9000:RK5gDHzozC3KUcPV@cluster0.gd0y0aj.mongodb.net/mydatabase?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Conectado a MongoDB');
}).catch(err => {
  console.error('❌ Error al conectar a MongoDB:', err);
});

// Esquema y modelo para mensajes
const mensajeSchema = new mongoose.Schema({
  username: String,  // usuario que envía (puedes cambiar o quitar)
  text: String,      // texto del mensaje
  timestamp: { type: Date, default: Date.now }
});
const Mensaje = mongoose.model('Mensaje', mensajeSchema);

// Servir contenido estático desde 'docs'
app.use(express.static(path.join(__dirname, 'docs')));

// Ruta principal: sirve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'index.html'));
});

// Socket.io conexión y eventos
io.on('connection', async (socket) => {
  console.log('🟢 Usuario conectado:', socket.id);

  // Enviar al nuevo cliente los mensajes almacenados (historial)
  const mensajesPrevios = await Mensaje.find().sort({ timestamp: 1 }).limit(100).lean();
  socket.emit('mensajesPrevios', mensajesPrevios);

  // Recibir mensaje nuevo desde un cliente
  socket.on('mensaje', async (msg) => {
    console.log('📨 Mensaje recibido:', msg);

    // Guardar mensaje en BD
    const nuevoMensaje = new Mensaje({
      username: 'Anon',
      text: msg.text
    });
    await nuevoMensaje.save();

    // Emitir el mensaje a todos los clientes para que lo vean en tiempo real
    io.emit('mensaje', nuevoMensaje);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Usuario desconectado:', socket.id);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
