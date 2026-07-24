let io = null;

const initializeSocket = (httpServer) => {
  const socketIo = require('socket.io')(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  const users = {};

  socketIo.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
      users[userId] = socket.id;
      console.log(`User ${userId} joined notification room`);
    });

    socket.on('disconnect', () => {
      for (let userId in users) {
        if (users[userId] === socket.id) {
          delete users[userId];
          console.log(`User ${userId} disconnected`);
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