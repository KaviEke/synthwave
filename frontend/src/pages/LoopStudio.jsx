import React, { useContext, useEffect, useState } from 'react';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import LoopTransport from '../components/LoopTransport';
import LoopTrack from '../components/LoopTrack';
import LoopTimeline from '../components/LoopTimeline';
import { v4 as uuidv4 } from 'uuid';
import './LoopStudio.css';

const LoopStudio = () => {
  const { 
    socket,
    loopState, 
    loopTracks, 
    loopPosition, 
    loopError,
    lastLoopCommandResult,
    sendLoopCommand,
    deviceStatus
  } = useContext(SocketContext);

  const { token } = useContext(AuthContext);
  
  const [pendingCommands, setPendingCommands] = useState({});
  const [errorMsg, setErrorMsg] = useState(null);

  // Re-sync state when component mounts or reconnects
  useEffect(() => {
    if (socket && socket.connected) {
      sendLoopCommand(uuidv4(), 'loop_get_state');
    }
  }, [socket, sendLoopCommand]);

  // Handle command results
  useEffect(() => {
    if (lastLoopCommandResult) {
      const { commandId, success, message } = lastLoopCommandResult;
      
      setPendingCommands(prev => {
        const next = { ...prev };
        delete next[commandId];
        return next;
      });

      if (!success) {
        setErrorMsg(message || 'Command failed');
        setTimeout(() => setErrorMsg(null), 3000);
      }
    }
  }, [lastLoopCommandResult]);

  // Handle errors from the engine
  useEffect(() => {
    if (loopError) {
      setErrorMsg(loopError.message || 'Loop Engine Error');
      setTimeout(() => setErrorMsg(null), 3000);
    }
  }, [loopError]);

  const handleCommand = (type, payload = {}) => {
    const isPiOnline = deviceStatus['raspberry-pi-4b']?.active;
    if (!isPiOnline) {
      setErrorMsg('Raspberry Pi is offline');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    const commandId = uuidv4();
    setPendingCommands(prev => ({ ...prev, [commandId]: true }));
    sendLoopCommand(commandId, type, payload);
    
    // Auto-clear pending after 3s to prevent getting stuck
    setTimeout(() => {
      setPendingCommands(prev => {
        if (prev[commandId]) {
          const next = { ...prev };
          delete next[commandId];
          return next;
        }
        return prev;
      });
    }, 3000);
  };

  const isPiOnline = deviceStatus['raspberry-pi-4b']?.active;
  const isSocketConnected = socket && socket.connected;
  
  // Default tracks if none received yet
  const tracks = ['drum-track', 'piano-track', 'violin-track'].map(id => {
    return loopTracks[id] || {
      trackId: id,
      instrument: id.replace('-track', ''),
      armed: false,
      recording: false,
      muted: false,
      solo: false,
      volume: 100,
      eventCount: 0,
      hasRecording: false
    };
  });

  // Calculate status text
  let statusText = 'Ready';
  if (loopState?.recording) {
    if (loopState.armedTrackId) {
      statusText = `Recording ${loopState.armedTrackId.replace('-track', '')}`;
    } else {
      statusText = 'Recording';
    }
  } else if (loopState?.playing) {
    statusText = 'Playing';
  } else if (loopState && !loopState.playing && loopState.currentPositionMs > 0) {
    statusText = 'Paused';
  } else if (loopState && !loopState.playing && loopState.currentPositionMs === 0) {
    statusText = 'Stopped';
  }

  return (
    <div className="loop-studio-container">
      <div className="loop-studio-header">
        <h1>Loop Studio</h1>
        <div className="status-badges">
          <span className={`badge ${isSocketConnected ? 'online' : 'offline'}`}>
            Browser: {isSocketConnected ? 'Connected' : 'Disconnected'}
          </span>
          <span className={`badge ${isPiOnline ? 'online' : 'offline'}`}>
            RPi: {isPiOnline ? 'Online' : 'Offline'}
          </span>
          <span className={`badge ${loopState?.recording ? 'recording' : 'online'}`}>
            Status: {statusText}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="glass-panel" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <LoopTransport 
        loopState={loopState} 
        onCommand={handleCommand}
      />

      <LoopTimeline 
        loopState={loopState} 
        loopPosition={loopPosition} 
      />

      <div className="tracks-container">
        {tracks.map(track => (
          <LoopTrack 
            key={track.trackId}
            track={track}
            onCommand={handleCommand}
          />
        ))}
      </div>
    </div>
  );
};

export default LoopStudio;
