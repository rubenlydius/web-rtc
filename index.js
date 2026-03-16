require('dotenv').config();
const isDevelopment = (process.env.NODE_ENV === 'development');
const express = require('express');
const app = express();
const fs = require('fs');
const os = require('os');

let options = {};
if (isDevelopment) {
  options = {
    key: fs.readFileSync('./localhost.key'),
    cert: fs.readFileSync('./localhost.crt')
  };
}

const server = require(isDevelopment ? 'https' : 'http').Server(options, app);
const port = process.env.PORT || 443;

app.use(express.static('public'));

server.listen(port, () => {
  const ip = Object.values(os.networkInterfaces()).flat().find(i => i.family === 'IPv4' && !i.internal)?.address || 'localhost';
  console.log(`Click here to open: https://${ip}:${port}/receiver.html`);
});

const { Server } = require("socket.io");
const io = new Server(server);

const clients = {};
io.on('connection', socket => {
  clients[socket.id] = { id: socket.id };

  socket.on('disconnect', () => {
    delete clients[socket.id];
    io.emit('clients', clients);
  });

  socket.on('signal', (peerId, signal) => {
    console.log(`Received signal from ${socket.id} to ${peerId}`);
    io.to(peerId).emit('signal', peerId, signal, socket.id);
  });

  io.emit('clients', clients);

});