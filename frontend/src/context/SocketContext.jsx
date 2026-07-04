import React, { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState({ active: false, deviceId: null });
  const [currentNote, setCurrentNote] = useState(null); // { instrument: 'violin', note: 'A4' }

  useEffect(() => {
    const SOCKET_URL = 'http://localhost:5000';
    // Force websocket-only connection to eliminate 500ms polling handshake delay
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      upgrade: false
    });
    setSocket(newSocket);

    // Listeners
    newSocket.on('update_status', (data) => {
      setDeviceStatus(data);
    });

    newSocket.on('play_note', (data) => {
      // Eliminate React batching delays by immediately setting state.
      // Removed the 500ms timeout so the note and image persist as long as the user holds the sound on the hardware.
      setCurrentNote(data);
    });

    return () => newSocket.close();
  }, []);

  // Pass it directly from socket state if needed, but since emitModeChange was defined inside useEffect,
  // we actually need to define it outside or use socket reference.
  const emitModeChange = (modeValue) => {
    if (socket) {
      socket.emit('set_mode', { mode: modeValue });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, deviceStatus, currentNote, emitModeChange }}>
      {children}
    </SocketContext.Provider>
  );
};
