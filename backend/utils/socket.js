import { Server } from 'socket.io';

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Live Analytics: Client connected [ID: ${socket.id}]`);

    // Let clients join rooms based on their User ID or URL shortcode for scoped updates
    socket.on('join-user-room', (userId) => {
      socket.join(String(userId));
      console.log(`👤 Client joined room for User: ${userId}`);
    });

    socket.on('join-url-room', (shortCode) => {
      socket.join(String(shortCode));
      console.log(`🔗 Client joined room for URL shortCode: ${shortCode}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected [ID: ${socket.id}]`);
    });
  });

  return io;
};

export const getIO = () => {
  return io;
};
