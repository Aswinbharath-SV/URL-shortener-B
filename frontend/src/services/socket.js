import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
let socket = null;

export const initiateSocket = (userId, shortCode) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(socketUrl, {
    transports: ['websocket'],
    credentials: true,
  });

  socket.on('connect', () => {
    console.log('📡 Real-time Socket.IO connection active');
    if (userId) {
      socket.emit('join-user-room', userId);
    }
    if (shortCode) {
      socket.emit('join-url-room', shortCode);
    }
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('📡 Real-time Socket.IO disconnected');
  }
};

export const getSocket = () => {
  return socket;
};
