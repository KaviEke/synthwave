import React, { useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { SOCKET_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';

export default function DiagnosticCard() {
  const { tr } = useLanguage();
  const { socket, hardwareState, lastEvent } = useContext(SocketContext);
  const { token } = useContext(AuthContext);

  const deviceStatus = hardwareState.deviceStatus;
  const piOnline = deviceStatus['raspberry-pi-4b']?.active || deviceStatus['raspberry-pi-simulator']?.active || false;
  const c1Online = deviceStatus['controller-1']?.active || false;
  const c2Online = deviceStatus['controller-2']?.active || false;

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.8)',
      border: '1px solid #0ea5e9',
      borderRadius: '8px',
      padding: '1rem',
      color: 'white',
      fontFamily: 'monospace',
      fontSize: '0.85rem',
      margin: '1rem 0',
      boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
      maxWidth: '400px',
      zIndex: 100
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#0ea5e9', textTransform: 'uppercase' }}>{tr("🔧 Auth & Socket Diagnostics")}</h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '4px' }}>
        <span style={{ color: '#94a3b8' }}>{tr("Connected:")}</span>
        <strong style={{ color: socket?.connected ? '#10b981' : '#ef4444' }}>{socket?.connected ? tr("Yes") : tr("No")}</strong>
        
        <span style={{ color: '#94a3b8' }}>{tr("Socket ID:")}</span>
        <strong>{socket?.id || '--'}</strong>
        
        <span style={{ color: '#94a3b8' }}>{tr("Socket URL:")}</span>
        <strong style={{ wordBreak: 'break-all' }}>{SOCKET_URL}</strong>
        
        <span style={{ color: '#94a3b8' }}>{tr("JWT Present:")}</span>
        <strong style={{ color: token ? '#10b981' : '#ef4444' }}>{token ? tr("Yes") : tr("No")}</strong>
        
        <span style={{ color: '#94a3b8' }}>{tr("Last Event:")}</span>
        <strong style={{ color: '#8b5cf6' }}>{lastEvent.name === 'None' ? tr('None') : lastEvent.name}</strong>
        
        <span style={{ color: '#94a3b8' }}>{tr("Event Time:")}</span>
        <strong>{lastEvent.time}</strong>
        
        <span style={{ color: '#94a3b8', marginTop: '10px' }}>{tr("Pi Status:")}</span>
        <strong style={{ marginTop: '10px', color: piOnline ? '#10b981' : '#ef4444' }}>{piOnline ? tr("Online") : tr("Offline")}</strong>
        
        <span style={{ color: '#94a3b8' }}>{tr("Controller 1:")}</span>
        <strong style={{ color: c1Online ? '#10b981' : '#ef4444' }}>{c1Online ? tr("Online") : tr("Offline")}</strong>
        
        <span style={{ color: '#94a3b8' }}>{tr("Controller 2:")}</span>
        <strong style={{ color: c2Online ? '#10b981' : '#ef4444' }}>{c2Online ? tr("Online") : tr("Offline")}</strong>
      </div>
    </div>
  );
}
