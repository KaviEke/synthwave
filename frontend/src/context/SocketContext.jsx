import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [lastEvent, setLastEvent] = useState({ name: 'None', time: '--' });

  // Hardware State
  const [hardwareState, setHardwareState] = useState({
    deviceStatus: {
      'raspberry-pi-4b': { active: false, battery: null },
      'controller-1': { active: false, battery: null },
      'controller-2': { active: false, battery: null }
    },
    activeNotes: [],
    bowState: { direction: 'idle', active: false },
    meendAmount: 0,
    octave: 'madhya',
    mode: 'piano',
    volume: { master: 80, piano: 100, violin: 100, drum: 100 },
    drumHits: [] // Store short-lived visual events
  });

  // currentNote mapped for backward compatibility where needed
  const [currentNote, setCurrentNote] = useState(null);

  // Expose legacy deviceStatus for minimal breakage while migrating
  const [legacyDeviceStatus, setLegacyDeviceStatus] = useState({ active: false, deviceId: null });

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.close();
        setSocket(null);
      }
      return;
    }

    console.log("[SOCKET] creating connection", SOCKET_URL);
    const newSocket = io(SOCKET_URL, {
      auth: {
        role: "browser",
        token
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log("[SOCKET] connected", newSocket.id);
    });

    newSocket.on('connect_error', (error) => {
      console.error("[SOCKET] connection error", error.message);
    });

    newSocket.on('disconnect', (reason) => {
      console.log("[SOCKET] disconnected", reason);
    });

    newSocket.onAny((eventName, ...args) => {
      console.log("[SOCKET EVENT]", eventName, args);
      setLastEvent({ name: eventName, time: new Date().toLocaleTimeString() });
    });

    newSocket.on('device_snapshot', (data) => {
       // Currently unhandled by hardwareState logic but listening as requested
    });

    newSocket.on('sensor_frame', (data) => {
       // Currently unhandled but listening as requested
    });

    newSocket.on('session_status', (data) => {
       // Currently unhandled but listening as requested
    });

    newSocket.on('command_result', (data) => {
       // Currently unhandled but listening as requested
    });

    // Hardware status
    newSocket.on('device_status', (data) => {
      setHardwareState(prev => ({
        ...prev,
        deviceStatus: {
          ...prev.deviceStatus,
          [data.deviceId]: { active: data.active, battery: data.battery || prev.deviceStatus[data.deviceId]?.battery }
        }
      }));
      setLegacyDeviceStatus({ active: data.active, deviceId: data.deviceId });
    });

    // Performance events
    newSocket.on('performance_event', (event) => {
      setHardwareState(prev => {
        const newState = { ...prev };
        
        switch (event.type) {
          case 'note_on':
            if (!newState.activeNotes.find(n => n.note === event.note && n.instrument === event.instrument)) {
              newState.activeNotes = [...newState.activeNotes, { note: event.note, instrument: event.instrument }];
            }
            setCurrentNote({ instrument: event.instrument, note: event.note });
            break;
          case 'note_off':
            newState.activeNotes = newState.activeNotes.filter(n => !(n.note === event.note && n.instrument === event.instrument));
            if (newState.activeNotes.length > 0) {
              const lastNote = newState.activeNotes[newState.activeNotes.length - 1];
              setCurrentNote({ instrument: lastNote.instrument, note: lastNote.note });
            } else {
              setCurrentNote(null);
            }
            break;
          case 'drum_hit':
            newState.drumHits = [...newState.drumHits, { note: event.note, velocity: event.velocity, time: Date.now() }];
            setCurrentNote({ instrument: 'drum', note: event.note });
            break;
          case 'bow_state':
            newState.bowState = { direction: event.direction, active: event.direction !== 'idle' };
            if (event.direction === 'idle') {
               newState.activeNotes = newState.activeNotes.filter(n => n.instrument !== 'violin');
               setCurrentNote(null);
            }
            break;
          case 'meend_state':
            newState.meendAmount = event.amount;
            break;
          case 'octave_state':
            newState.octave = event.octave; 
            break;
          case 'mode_state':
            newState.mode = event.mode;
            break;
          case 'volume_state':
             newState.volume = { ...newState.volume, ...event.volumeData };
             break;
          default:
            break;
        }
        return newState;
      });
    });

    return () => {
      newSocket.off('connect');
      newSocket.off('connect_error');
      newSocket.off('disconnect');
      newSocket.offAny();
      newSocket.off('device_snapshot');
      newSocket.off('sensor_frame');
      newSocket.off('session_status');
      newSocket.off('command_result');
      newSocket.off('device_status');
      newSocket.off('performance_event');
      newSocket.disconnect();
    };
  }, [token]);

  // Command helper
  const sendHardwareCommand = (command, data) => {
    if (socket) {
      socket.emit('hardware_command', { command, ...data });
    }
  };

  const emitModeChange = (modeValue) => {
    sendHardwareCommand('set_mode', { mode: modeValue });
  };

  return (
    <SocketContext.Provider value={{ socket, hardwareState, currentNote, deviceStatus: legacyDeviceStatus, sendHardwareCommand, emitModeChange, lastEvent }}>
      {children}
    </SocketContext.Provider>
  );
};
