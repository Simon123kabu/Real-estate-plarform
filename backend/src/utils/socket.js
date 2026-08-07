let io = null;

const initializeSocket = (httpServer) => {
  const socketIo = require('socket.io')(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  const isDev = process.env.NODE_ENV !== 'production';
  const users = {};

  socketIo.on('connection', (socket) => {
    if (isDev) console.log('User connected:', socket.id);

    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
      users[userId] = socket.id;
      if (isDev) console.log(`User ${userId} joined notification room`);
    });

    socket.on('disconnect', () => {
      for (let userId in users) {
        if (users[userId] === socket.id) {
          delete users[userId];
          if (isDev) console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });
  });

  io = socketIo;
  return socketIo;
};

const getIO = () => io;

module.exports = { initializeSocket, getIO };