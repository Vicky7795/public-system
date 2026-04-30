import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    // If running locally, connect to the local backend port 5000
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('172.')) {
        return `http://${window.location.hostname}:5000`;
    }
    // In production (Render), the backend runs on the same domain without a custom port
    return window.location.origin;
  }
  return 'http://localhost:5000';
};
const SOCKET_URL = getSocketUrl();

const socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket']
});

export default socket;
