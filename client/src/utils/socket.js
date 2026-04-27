import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;

const socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket']
});

export default socket;
