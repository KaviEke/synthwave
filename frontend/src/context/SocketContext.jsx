import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

const DEBUG = import.meta.env.VITE_REALTIME_DEBUG === 'true';

// ======================================================
//              EVENT NORMALIZER
// ======================================================
function normalizeEvent(raw) {
  if (!raw || typeof raw !== 'object') return null;

  // Support both flat canonical events and legacy wrapped { type, data:{...} }
  let event;
  if (raw.data && typeof raw.data === 'object' && !raw.schemaVersion) {
    // Legacy wrapped format — flatten
    event = { ...raw, ...raw.data };
    delete event.data;
  } else {
    event = { ...raw };
  }

  // Coerce types for safety
  if (event.midiNote !== null && event.midiNote !== undefined) {
    event.midiNote = Number(event.midiNote);
    if (!Number.isFinite(event.midiNote)) event.midiNote = null;
  }
  if (event.controllerId !== null && event.controllerId !== undefined) {
    event.controllerId = Number(event.controllerId);
  }
  if (event.gpio !== null && event.gpio !== undefined) {
    event.gpio = Number(event.gpio);
    if (!Number.isFinite(event.gpio)) event.gpio = null;
  }
  if (event.velocity !== null && event.velocity !== undefined) {
    event.velocity = Number(event.velocity);
  }

  // Ensure type exists
  if (!event.type) return null;

  return event;
}

// Map offset number to register name
function offsetToRegister(offset) {
  if (offset === 12 || offset === '12') return 'Uchcha';
  if (offset === -12 || offset === '-12') return 'Mandra';
  return 'Madhya';
}

// ======================================================
//              SOCKET PROVIDER
// ======================================================
export const SocketProvider = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [lastEvent, setLastEvent] = useState({ name: 'None', time: '--' });

  // Device connection statuses
  const [deviceStatuses, setDeviceStatuses] = useState({
    'raspberry-pi-4b': { active: false, battery: null },
    'controller-1': { active: false, battery: null },
    'controller-2': { active: false, battery: null },
  });

  // Performance state
  const [lastPerformanceEvent, setLastPerformanceEvent] = useState(null);
  const [activeNotes, setActiveNotes] = useState({}); // key: `${deviceId}-${midiNote}`, value: event
  const [performanceHistory, setPerformanceHistory] = useState([]);
  const [currentMode, setCurrentMode] = useState('piano');
  const [currentRegister, setCurrentRegister] = useState('Madhya');
  const [bowState, setBowState] = useState({ active: false, stringIndex: null });
  const [meendState, setMeendState] = useState(0);
  const [lastEventName, setLastEventName] = useState(null);
  const [lastEventTime, setLastEventTime] = useState(null);

  // Release timer ref — keeps the last note_off visible for ~1.5s
  const releaseTimerRef = useRef(null);

  // Track current note for backward compatibility
  const [currentNote, setCurrentNote] = useState(null);

  // Assemble hardwareState for backward compatibility with Dashboard/LiveSession
  const hardwareState = {
    deviceStatus: deviceStatuses,
    activeNotes: Object.values(activeNotes),
    bowState,
    meendAmount: meendState,
    octave: currentRegister?.toLowerCase() || 'madhya',
    mode: currentMode,
    volume: { master: 80, piano: 100, violin: 100, drum: 100 },
    drumHits: [],
  };

  // Handle performance events
  const handlePerformanceEvent = useCallback((rawEvent) => {
    const event = normalizeEvent(rawEvent);
    if (!event) return;

    if (DEBUG) {
      console.log('[PERF EVENT]', event.type, event);
    }

    const eventType = event.type;

    switch (eventType) {
      case 'note_on': {
        const noteKey = `${event.deviceId || 'unknown'}-${event.midiNote}`;

        setActiveNotes(prev => ({
          ...prev,
          [noteKey]: event,
        }));

        setLastPerformanceEvent({ ...event, _released: false });
        setCurrentNote({
          instrument: event.instrument,
          note: event.midiNote,
          swara: event.swara,
          noteName: event.noteName,
          ...event,
        });

        // Clear any release timer
        if (releaseTimerRef.current) {
          clearTimeout(releaseTimerRef.current);
          releaseTimerRef.current = null;
        }

        // Add to history (cap at 200)
        setPerformanceHistory(prev => {
          const next = [...prev, event];
          return next.length > 200 ? next.slice(-200) : next;
        });
        break;
      }

      case 'note_off': {
        const noteKey = `${event.deviceId || 'unknown'}-${event.midiNote}`;

        setActiveNotes(prev => {
          const next = { ...prev };
          delete next[noteKey];
          return next;
        });

        // Show released state for 1.5s
        setLastPerformanceEvent({ ...event, _released: true });
        setCurrentNote(prev => {
          // If the released note matches the current display, mark as released
          if (prev && prev.midiNote === event.midiNote) {
            return { ...prev, ...event, _released: true };
          }
          return prev;
        });

        if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current);
        releaseTimerRef.current = setTimeout(() => {
          setLastPerformanceEvent(prev => {
            if (prev && prev.midiNote === event.midiNote && prev._released) {
              return null;
            }
            return prev;
          });
          setCurrentNote(prev => {
            if (prev && prev._released) return null;
            return prev;
          });
        }, 1500);

        setPerformanceHistory(prev => {
          const next = [...prev, event];
          return next.length > 200 ? next.slice(-200) : next;
        });
        break;
      }

      case 'drum_hit': {
        setLastPerformanceEvent({ ...event, _released: false });
        setCurrentNote({
          instrument: 'drum',
          note: event.drum,
          drum: event.drum,
          ...event,
        });

        // Auto-clear drum display after 1s
        if (releaseTimerRef.current) clearTimeout(releaseTimerRef.current);
        releaseTimerRef.current = setTimeout(() => {
          setLastPerformanceEvent(prev => {
            if (prev && prev.type === 'drum_hit') return null;
            return prev;
          });
          setCurrentNote(prev => {
            if (prev && prev.instrument === 'drum') return null;
            return prev;
          });
        }, 1000);

        setPerformanceHistory(prev => {
          const next = [...prev, event];
          return next.length > 200 ? next.slice(-200) : next;
        });
        break;
      }

      case 'bow_state': {
        setBowState({
          active: event.bowActive ?? event.active ?? false,
          stringIndex: event.stringIndex ?? null,
        });

        // If bow goes idle, clear violin active notes
        if (!event.bowActive && !event.active) {
          setActiveNotes(prev => {
            const next = {};
            for (const [k, v] of Object.entries(prev)) {
              if (v.instrument !== 'violin') next[k] = v;
            }
            return next;
          });
        }
        break;
      }

      case 'meend_state': {
        setMeendState(event.meend ?? event.position ?? 0);
        break;
      }

      case 'octave_state': {
        const reg = event.register || offsetToRegister(event.offset);
        setCurrentRegister(reg);
        break;
      }

      case 'mode_state': {
        const modeMap = { 0: 'piano', 1: 'violin', 2: 'drum', 3: 'vocal' };
        const modeVal = event.mode;
        if (typeof modeVal === 'number') {
          setCurrentMode(modeMap[modeVal] || 'piano');
        } else if (typeof modeVal === 'string') {
          setCurrentMode(modeVal.toLowerCase());
        }
        break;
      }

      case 'volume_state': {
        // Volume is not critical for the current fix, pass through
        break;
      }

      default:
        if (DEBUG) {
          console.log('[PERF EVENT] Unknown type:', eventType);
        }
        break;
    }
  }, []);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.close();
        setSocket(null);
      }
      return;
    }

    if (DEBUG) console.log('[SOCKET] creating connection', SOCKET_URL);

    const newSocket = io(SOCKET_URL, {
      auth: { role: 'browser', token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    setSocket(newSocket);

    const onConnect = () => {
      if (DEBUG) console.log('[SOCKET] connected', newSocket.id);
    };
    const onConnectError = (error) => {
      console.error('[SOCKET] connection error', error.message);
    };
    const onDisconnect = (reason) => {
      if (DEBUG) console.log('[SOCKET] disconnected', reason);
    };
    const onAny = (eventName) => {
      setLastEvent({ name: eventName, time: new Date().toLocaleTimeString() });
    };
    const onDeviceStatus = (data) => {
      if (!data || !data.deviceId) return;
      setDeviceStatuses(prev => ({
        ...prev,
        [data.deviceId]: {
          active: data.active,
          battery: data.battery || prev[data.deviceId]?.battery || null,
        },
      }));
    };
    const onPerformanceEvent = (event) => {
      handlePerformanceEvent(event);
    };

    newSocket.on('connect', onConnect);
    newSocket.on('connect_error', onConnectError);
    newSocket.on('disconnect', onDisconnect);
    newSocket.onAny(onAny);
    newSocket.on('device_status', onDeviceStatus);
    newSocket.on('performance_event', onPerformanceEvent);

    // Keep these listeners for forward compatibility
    newSocket.on('device_snapshot', () => {});
    newSocket.on('sensor_frame', () => {});
    newSocket.on('session_status', () => {});
    newSocket.on('command_result', () => {});

    return () => {
      newSocket.off('connect', onConnect);
      newSocket.off('connect_error', onConnectError);
      newSocket.off('disconnect', onDisconnect);
      newSocket.offAny(onAny);
      newSocket.off('device_status', onDeviceStatus);
      newSocket.off('performance_event', onPerformanceEvent);
      newSocket.off('device_snapshot');
      newSocket.off('sensor_frame');
      newSocket.off('session_status');
      newSocket.off('command_result');
      newSocket.disconnect();
    };
  }, [token, handlePerformanceEvent]);

  // Command helpers
  const sendHardwareCommand = useCallback((command, data) => {
    if (socket) {
      socket.emit('hardware_command', { command, ...data });
    }
  }, [socket]);

  const emitModeChange = useCallback((modeValue) => {
    sendHardwareCommand('set_mode', { mode: modeValue });
  }, [sendHardwareCommand]);

  return (
    <SocketContext.Provider value={{
      socket,
      hardwareState,
      currentNote,
      lastPerformanceEvent,
      activeNotes,
      performanceHistory,
      currentMode,
      currentRegister,
      bowState,
      meendState,
      deviceStatus: deviceStatuses,
      sendHardwareCommand,
      emitModeChange,
      lastEvent,
    }}>
      {children}
    </SocketContext.Provider>
  );
};
