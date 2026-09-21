import { io } from 'socket.io-client';
import { getBaseUrl } from './api';

const SOCKET_SERVER_URL = getBaseUrl();

export const socket = io(SOCKET_SERVER_URL, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  timeout: 10000
});

socket.on('connect', () => {
  console.log('⚡ Connected to Socket.io server at:', SOCKET_SERVER_URL, 'ID:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected from Socket.io server:', reason);
});

socket.on('connect_error', (error) => {
  console.warn('⚠️ Socket.io connection error:', error.message);
});

export default socket;
