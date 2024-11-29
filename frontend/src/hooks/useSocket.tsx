import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL: string = import.meta.env.VITE_BACKEND_URL;; 
export const socket: Socket = io(SOCKET_URL);

export const useSocket = (event: string, handler: (...args: any[]) => void) => {
    useEffect(() => {
        socket.on(event, handler);
        return () => {
            socket.off(event, handler);
        };
    }, [event, handler]);
};
