import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import DiagnosticCard from '../components/DiagnosticCard';

// --- Dark Theme Colors (matching site-wide black + blue palette) ---
const colors = {
  bg: '#000000',
  panelBg: 'rgba(0, 0, 0, 0.6)',
  border: 'rgba(14, 165, 233, 0.2)',
  borderGlow: '0 8px 32px rgba(14, 165, 233, 0.1)',
  cyan: '#0ea5e9',
  cyanGlow: '#38bdf8',
  purple: '#8b5cf6',
  pink: '#ec4899',
  amber: '#f59e0b',
  textMain: '#f1f5f9',
  textMuted: '#94a3b8',
  textDim: '#64748b',
  success: '#10b981',
  danger: '#ef4444',
  cardBg: 'rgba(15, 23, 42, 0.7)',
  surfaceDark: 'rgba(0, 0, 0, 0.4)',
  divider: 'rgba(255, 255, 255, 0.06)',
};

const panelStyle = {
  background: colors.cardBg,
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: `1px solid ${colors.border}`,
  borderRadius: '20px',
  padding: '1.5rem',
  boxShadow: colors.borderGlow,
  color: colors.textMain,
};

// ======================================================
//     TWELVE-KEY SWARA LABELS FOR THE PIANO VISUALIZER
// ======================================================
const SWARA_LABELS = ['Sa', 'K.Ri', 'Ri', 'K.Ga', 'Ga', 'Ma', 'T.Ma', 'Pa', 'K.Dh', 'Dha', 'K.Ni', 'Ni'];
const BLACK_KEY_INDICES = [1, 3, 6, 8, 10];

function midiToPitchClass(midi) {
  if (midi === null || midi === undefined) return -1;
  return ((Number(midi) % 12) + 12) % 12;
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const {
    sendHardwareCommand, hardwareState, currentNote,
    lastPerformanceEvent, activeNotes, currentMode: socketMode,
    currentRegister, bowState, meendState,
  } = useContext(SocketContext);
  const { deviceStatus } = hardwareState;

  // --- State ---
  const [activeMode, setActiveMode] = useState('piano');
  const [volumes, setVolumes] = useState({ master: 80, piano: 100, violin: 100, drum: 100 });
  const [activityLog, setActivityLog] = useState([
    { id: 1, time: new Date().toLocaleTimeString(), type: 'system', msg: 'System initialized.' }
  ]);
  const logContainerRef = useRef(null);

  const piOnline = deviceStatus['raspberry-pi-4b']?.active || deviceStatus['raspberry-pi-simulator']?.active || false;
  const c1Online = deviceStatus['controller-1']?.active || false;
  const c2Online = deviceStatus['controller-2']?.active || false;

  // Sync mode from socket
  useEffect(() => {
    if (socketMode) setActiveMode(socketMode);
  }, [socketMode]);

  // Auto-log performance events
  useEffect(() => {
    if (!lastPerformanceEvent) return;
    const e = lastPerformanceEvent;
    if (e.type === 'note_on') {
      addLog('action', `${e.instrument?.toUpperCase()} NOTE ON: ${e.swara || '--'} (${e.noteName || e.midiNote}) — Controller ${e.controllerId || '?'} GPIO ${e.gpio ?? '?'}`);
    } else if (e.type === 'drum_hit') {
      addLog('action', `DRUM HIT: ${e.drum || '--'} — Controller ${e.controllerId || '?'} GPIO ${e.gpio ?? '?'}`);
    }
  }, [lastPerformanceEvent]);

  // --- Helpers ---
  const addLog = (type, msg) => {
    setActivityLog(prev => [...prev.slice(-99), { id: Date.now(), time: new Date().toLocaleTimeString(), type, msg }]);
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [activityLog]);

  // --- Handlers ---
  const handleModeChange = (mode) => {
    setActiveMode(mode);
    addLog('mode', `Mode changed to ${mode.charAt(0).toUpperCase() + mode.slice(1)}`);
    if (sendHardwareCommand) {
      sendHardwareCommand('set_mode', { mode });
    }
  };

  const handleVolumeChange = (channel, value) => {
    setVolumes(prev => ({ ...prev, [channel]: value }));
    if (sendHardwareCommand) sendHardwareCommand('set_volume', { channel, value });
  };

  const handleMuteAll = () => {
    setVolumes({ master: 0, piano: 0, violin: 0, drum: 0 });
    addLog('audio', 'All channels muted.');
    if (sendHardwareCommand) sendHardwareCommand('mute_all', {});
  };

  const handleStopAllSounds = () => {
    addLog('danger', 'EMERGENCY: All sounds stopped.');
    if (sendHardwareCommand) sendHardwareCommand('stop_all_sounds', {});
  };

  const handleDrumTest = (sound) => {
    addLog('action', `Drum pad triggered: ${sound}`);
    if (sendHardwareCommand) sendHardwareCommand('play_drum', { sound });
  };

  const handleReconnect = () => {
    addLog('system', 'Attempting device reconnection...');
    if (sendHardwareCommand) sendHardwareCommand('reconnect_devices', {});
  };

  const handleReset = () => {
    addLog('danger', 'Resetting controllers...');
    if (sendHardwareCommand) sendHardwareCommand('reset_controllers', {});
  };

  const clearLog = () => setActivityLog([]);

  // --- Mode config ---
  const modes = [
    { id: 'piano', label: 'Piano', icon: '🎹', color: colors.cyan },
    { id: 'violin', label: 'Violin', icon: '🎻', color: colors.purple },
    { id: 'drum', label: 'Drum', icon: '🥁', color: colors.pink },
    { id: 'vocal', label: 'Vocal', icon: '🎤', color: colors.amber },
  ];

  // --- Derive display values from last event ---
  const perf = lastPerformanceEvent;
  const isReleased = perf?._released;
  const perfInstrument = perf?.instrument;

  // Get active pitch classes for piano visualizer
  const activePitchClasses = new Set();
  const activeNoteEntries = Object.values(activeNotes || {});
  activeNoteEntries.forEach(n => {
    if (n.instrument === 'piano' && n.midiNote != null) {
      activePitchClasses.add(midiToPitchClass(n.midiNote));
    }
  });
  if (perf?.type === 'note_on' && perf?.instrument === 'piano' && perf?.midiNote != null) {
    activePitchClasses.add(midiToPitchClass(perf.midiNote));
  }

  // Active drum name
  const activeDrum = (perf?.type === 'drum_hit' && !isReleased) ? perf.drum?.toUpperCase() : null;

  // Active violin string
  const activeViolinString = (perf?.instrument === 'violin' && perf?.type === 'note_on' && !isReleased)
    ? perf.stringIndex : null;

  // Drum pad mappings that match real hardware
  const DRUM_PADS = [
    { name: 'SNARE', label: 'Snare', icon: '🥁' },
    { name: 'HIHAT', label: 'Hi-Hat', icon: '🔔' },
    { name: 'TOM1', label: 'Tom 1', icon: '🪘' },
    { name: 'TOM2', label: 'Tom 2', icon: '🪘' },
    { name: 'CYMBAL', label: 'Cymbal', icon: '✨' },
    { name: 'CRASH', label: 'Crash', icon: '💥' },
    { name: 'METALSNARE', label: 'Metal Snare', icon: '🥁' },
    { name: 'KICK', label: 'Kick', icon: '🦶' },
  ];

  // --- Row divider line style ---
  const rowDivider = { borderBottom: `1px solid ${colors.divider}`, paddingBottom: '0.5rem' };

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--panel-padding-medium)', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* ============== 1. HEADER ============== */}
        <div className="responsive-header" style={{ borderBottom: `1px solid ${colors.border}`, paddingBottom: '1.5rem' }}>
          <div>
            <h1 style={{
              fontSize: '2.8rem', fontWeight: 900, margin: 0,
              background: 'linear-gradient(135deg, #0ea5e9, #3b82f6, #8b5cf6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', color: 'transparent',
            }}>
              Synthwave Control Center
            </h1>
            <p style={{ color: colors.textMuted, margin: '0.5rem 0 0 0', fontSize: '1.1rem' }}>
              Monitor hardware, shape sound, and command your performance — all in one place.
            </p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.8rem',
            background: piOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.08)',
            padding: '0.6rem 1.2rem', borderRadius: '50px',
            border: `1px solid ${piOnline ? colors.success : colors.danger}`,
          }}>
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ width: '12px', height: '12px', borderRadius: '50%', background: piOnline ? colors.success : colors.danger, boxShadow: `0 0 8px ${piOnline ? colors.success : colors.danger}` }}
            />
            <span style={{ color: piOnline ? colors.success : colors.danger, fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.85rem' }}>
              {piOnline ? 'System Online' : 'System Offline'}
            </span>
          </div>
        </div>

        {/* DIAGNOSTIC CARD */}
        <DiagnosticCard />

        {/* ============== 2. INSTRUMENT MODE SELECTOR ============== */}
        <section>
          <h2 style={{ fontSize: '1.5rem', color: colors.textMain, margin: '0 0 1rem 0' }}>Select Instrument Mode</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {modes.map(m => {
              const isActive = activeMode === m.id;
              return (
                <motion.div
                  key={m.id}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleModeChange(m.id)}
                  style={{
                    ...panelStyle,
                    cursor: 'pointer',
                    border: `2px solid ${isActive ? m.color : colors.border}`,
                    boxShadow: isActive ? `0 8px 30px ${m.color}33, inset 0 1px 0 ${m.color}22` : colors.borderGlow,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    position: 'relative', overflow: 'hidden',
                    background: isActive
                      ? `linear-gradient(180deg, ${colors.cardBg} 0%, ${m.color}15 100%)`
                      : colors.cardBg,
                    padding: '2rem 1.5rem',
                  }}
                >
                  <span style={{ fontSize: '3.5rem', marginBottom: '1rem', filter: isActive ? `drop-shadow(0 0 12px ${m.color})` : 'none' }}>{m.icon}</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: isActive ? m.color : colors.textMuted }}>{m.label}</span>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      style={{ position: 'absolute', top: '10px', right: '10px', background: m.color, color: 'white', fontSize: '0.7rem', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', letterSpacing: '1px' }}
                    >
                      ACTIVE
                    </motion.div>
                  )}
                  {isActive && <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: m.color, boxShadow: `0 0 12px ${m.color}` }}></div>}
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ============== 3. CONTROLLER STATUS CARDS ============== */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {/* Controller 1 */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.5rem', color: colors.textMain }}>Controller 1</h3>
                <span style={{ color: colors.textDim, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Main Controller</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: c1Online ? colors.success : colors.textDim, background: c1Online ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)', padding: '4px 12px', borderRadius: '20px', border: `1px solid ${c1Online ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                <span style={{ fontSize: '1rem' }}>{c1Online ? '✓' : '✗'}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{c1Online ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: colors.textMuted }}>Role:</span> <strong style={{ color: colors.cyan }}>Piano Notes • Violin Bow • Drum Motion</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: colors.textMuted }}>Battery:</span> <strong style={{ color: colors.textMain }}>{deviceStatus['controller-1']?.battery ? `${deviceStatus['controller-1'].battery}%` : '--'}</strong></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.9rem' }}>
              {['MPU9250 IMU', 'HMC5883L Mag', 'Joystick', 'BMP180 Barometer'].map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.textMuted }}>
                  <span style={{ color: c1Online ? colors.success : colors.textDim }}>{c1Online ? '✓' : '○'}</span> {s}
                </div>
              ))}
            </div>
          </div>

          {/* Controller 2 */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.5rem', color: colors.textMain }}>Controller 2</h3>
                <span style={{ color: colors.textDim, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Secondary Controller</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: c2Online ? colors.success : colors.textDim, background: c2Online ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)', padding: '4px 12px', borderRadius: '20px', border: `1px solid ${c2Online ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                <span style={{ fontSize: '1rem' }}>{c2Online ? '✓' : '✗'}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{c2Online ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: colors.textMuted }}>Role:</span> <strong style={{ color: colors.purple }}>Additional Notes • Modifiers</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: colors.textMuted }}>Battery:</span> <strong style={{ color: colors.textMain }}>{deviceStatus['controller-2']?.battery ? `${deviceStatus['controller-2'].battery}%` : '--'}</strong></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.9rem' }}>
              {['Button Inputs', 'Wi-Fi Connection'].map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.textMuted }}>
                  <span style={{ color: c2Online ? colors.success : colors.textDim }}>{c2Online ? '✓' : '○'}</span> {s}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============== 4 & 5. LIVE MONITOR & 3D VISUALIZER ============== */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>

          {/* LIVE MONITOR */}
          <div style={{ ...panelStyle, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.4rem', color: colors.textMain }}>Live Performance</h3>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMode}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}
              >
                {activeMode === 'piano' && (() => {
                  const e = (perfInstrument === 'piano' && perf) ? perf : null;
                  return (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', ...rowDivider }}>
                        <span style={{ color: colors.textMuted }}>Current Swara:</span>
                        <strong style={{ fontSize: '1.2rem', color: isReleased ? colors.textDim : colors.cyan }}>
                          {e?.swara || '--'}{isReleased ? ' (Released)' : ''}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', ...rowDivider }}>
                        <span style={{ color: colors.textMuted }}>MIDI Note:</span>
                        <strong style={{ color: colors.textMain }}>{e?.midiNote != null ? `${e.midiNote} (${e.noteName || ''})` : '--'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', ...rowDivider }}>
                        <span style={{ color: colors.textMuted }}>Pitch Range:</span>
                        <strong style={{ color: colors.cyan }}>{currentRegister || 'Madhya'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', ...rowDivider }}>
                        <span style={{ color: colors.textMuted }}>Controller:</span>
                        <strong style={{ color: colors.textMain }}>{e?.controllerId ? `Controller ${e.controllerId}` : '--'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', ...rowDivider }}>
                        <span style={{ color: colors.textMuted }}>Button:</span>
                        <strong style={{ color: colors.textMain }}>{e?.gpio != null ? `GPIO ${e.gpio}` : '--'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: colors.textMuted }}>Velocity:</span>
                        <strong style={{ color: colors.textMain }}>{e?.velocity != null ? e.velocity : '--'}</strong>
                      </div>
                    </>
                  );
                })()}
                {activeMode === 'violin' && (() => {
                  const e = (perfInstrument === 'violin' && perf) ? perf : null;
                  return (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', ...rowDivider }}>
                        <span style={{ color: colors.textMuted }}>Current Note:</span>
                        <strong style={{ fontSize: '1.2rem', color: colors.purple }}>{e?.swara || '--'}{e?.noteName ? ` (${e.noteName})` : ''}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', ...rowDivider }}>
                        <span style={{ color: colors.textMuted }}>Selected String:</span>
                        <strong style={{ color: colors.textMain }}>{e?.stringIndex != null ? `String ${e.stringIndex + 1}` : (bowState.stringIndex != null ? `String ${bowState.stringIndex + 1}` : '--')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', ...rowDivider }}>
                        <span style={{ color: colors.textMuted }}>Bow Status:</span>
                        <strong style={{ color: bowState.active ? colors.purple : colors.textDim }}>{bowState.active ? 'Active' : 'Idle'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', ...rowDivider }}>
                        <span style={{ color: colors.textMuted }}>Finger:</span>
                        <strong style={{ color: colors.textMain }}>{e?.fingerIndex != null ? `Finger ${e.fingerIndex}` : '--'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: colors.textMuted }}>Meend:</span>
                        <strong style={{ color: colors.textMain }}>{meendState !== 0 ? meendState : 'Neutral'}</strong>
                      </div>
                    </>
                  );
                })()}
                {activeMode === 'drum' && (() => {
                  const e = (perfInstrument === 'drum' && perf) ? perf : null;
                  return (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', ...rowDivider }}>
                        <span style={{ color: colors.textMuted }}>Last Hit:</span>
                        <strong style={{ fontSize: '1.2rem', color: colors.pink }}>{e?.drum || '--'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', ...rowDivider }}>
                        <span style={{ color: colors.textMuted }}>Velocity:</span>
                        <strong style={{ color: colors.textMain }}>{e?.velocity != null ? e.velocity : '--'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', ...rowDivider }}>
                        <span style={{ color: colors.textMuted }}>Controller:</span>
                        <strong style={{ color: colors.textMain }}>{e?.controllerId ? `Controller ${e.controllerId}` : '--'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', ...rowDivider }}>
                        <span style={{ color: colors.textMuted }}>Button:</span>
                        <strong style={{ color: colors.textMain }}>{e?.gpio != null ? `GPIO ${e.gpio}` : '--'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: colors.textMuted }}>Motion State:</span>
                        <strong style={{ color: colors.pink }}>{e ? 'Hit Detected' : 'Idle'}</strong>
                      </div>
                    </>
                  );
                })()}
                {activeMode === 'vocal' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: colors.textMuted }}>Status:</span> <strong style={{ color: colors.success }}>Vocal mode ready</strong></div>
                    <div style={{ padding: '1rem', background: 'rgba(14,165,233,0.05)', border: '1px dashed rgba(14,165,233,0.2)', borderRadius: '8px', marginTop: '1rem', color: colors.textMuted, textAlign: 'center' }}>
                      Microphone and voice features can be connected here.
                    </div>
                  </>
                )}
                <motion.div
                  animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  style={{ position: 'absolute', bottom: '10px', right: '10px', width: '25px', height: '25px', borderRadius: '50%', background: `radial-gradient(circle, ${modes.find(m => m.id === activeMode).color} 0%, transparent 70%)` }}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ============== 3D VISUALIZER ============== */}
          <div style={{ ...panelStyle, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.4rem', color: colors.textMain }}>Dynamic Visualizer</h3>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'radial-gradient(ellipse at center, rgba(14,165,233,0.06) 0%, rgba(0,0,0,0.3) 100%)',
              borderRadius: '16px', padding: '1.5rem', overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.04)', minHeight: '320px',
            }}>
              <AnimatePresence mode="wait">
                <motion.div key={activeMode} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ width: '100%', height: '100%' }}>

                  {/* ===== 3D PIANO KEYS ===== */}
                  {activeMode === 'piano' && (
                    <div style={{
                      display: 'flex', height: '100%', width: '100%', gap: '3px', padding: '20px 10px 10px',
                      minHeight: '280px', perspective: '800px',
                    }}>
                      {SWARA_LABELS.map((note, idx) => {
                        const isBlack = BLACK_KEY_INDICES.includes(idx);
                        const isActive = activePitchClasses.has(idx);
                        const activeEvent = isActive && perf;
                        return (
                          <motion.div
                            key={idx}
                            animate={isActive ? { rotateX: -4, y: 6 } : { rotateX: 0, y: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            style={{
                              flex: isBlack ? 0.7 : 1,
                              position: 'relative',
                              height: isBlack ? '62%' : '100%',
                              zIndex: isBlack ? 2 : 1,
                              marginLeft: isBlack ? '-3%' : '0',
                              marginRight: isBlack ? '-3%' : '0',
                              transformStyle: 'preserve-3d',
                              transformOrigin: 'top center',
                            }}
                          >
                            {/* Key top face */}
                            <div style={{
                              width: '100%', height: '100%',
                              borderRadius: '0 0 8px 8px',
                              background: isActive
                                ? `linear-gradient(180deg, ${colors.cyan}, ${colors.cyan}cc)`
                                : isBlack
                                  ? 'linear-gradient(180deg, #1e293b, #0f172a)'
                                  : 'linear-gradient(180deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))',
                              boxShadow: isActive
                                ? `0 0 25px ${colors.cyan}88, 0 8px 20px rgba(0,0,0,0.5), inset 0 -3px 6px ${colors.cyan}44`
                                : isBlack
                                  ? '0 6px 12px rgba(0,0,0,0.6), inset 0 -2px 4px rgba(0,0,0,0.3)'
                                  : '0 8px 16px rgba(0,0,0,0.4), inset 0 -3px 6px rgba(0,0,0,0.15)',
                              border: isActive
                                ? `1px solid ${colors.cyan}`
                                : `1px solid ${isBlack ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)'}`,
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                              paddingBottom: '12px',
                              transition: 'background 0.12s, box-shadow 0.12s',
                            }}>
                              <span style={{
                                writingMode: 'vertical-rl',
                                color: isActive ? 'white' : (isBlack ? '#475569' : '#64748b'),
                                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px',
                              }}>{note}</span>
                            </div>
                            {/* 3D depth edge (bottom face) */}
                            <div style={{
                              position: 'absolute', bottom: '-8px', left: '2px', right: '2px', height: '10px',
                              borderRadius: '0 0 6px 6px',
                              background: isActive
                                ? `linear-gradient(180deg, ${colors.cyan}99, ${colors.cyan}44)`
                                : isBlack
                                  ? 'linear-gradient(180deg, #0f172a, #020617)'
                                  : 'linear-gradient(180deg, rgba(15,23,42,0.8), rgba(2,6,23,0.9))',
                              transform: 'rotateX(80deg)',
                              transformOrigin: 'top',
                            }} />
                            {/* Note tooltip */}
                            {isActive && activeEvent && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                  position: 'absolute', top: '-56px', left: '50%', transform: 'translateX(-50%)',
                                  background: 'rgba(0,0,0,0.9)', color: 'white',
                                  padding: '5px 10px', borderRadius: '8px', fontSize: '0.6rem',
                                  whiteSpace: 'nowrap', textAlign: 'center', lineHeight: '1.4',
                                  border: `1px solid ${colors.cyan}`,
                                  boxShadow: `0 4px 12px rgba(0,0,0,0.5), 0 0 8px ${colors.cyan}44`,
                                }}
                              >
                                <div style={{ fontWeight: 700 }}>{activeEvent.swara || note} · {activeEvent.noteName || ''}</div>
                                <div style={{ color: '#94a3b8' }}>C{activeEvent.controllerId || '?'} · GPIO {activeEvent.gpio ?? '?'}</div>
                              </motion.div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* ===== 3D VIOLIN STRINGS ===== */}
                  {activeMode === 'violin' && (
                    <div style={{
                      display: 'flex', flexDirection: 'column', justifyContent: 'center',
                      height: '100%', padding: '1.5rem 2rem', minHeight: '280px',
                      perspective: '600px',
                    }}>
                      {/* Violin body background */}
                      <div style={{
                        position: 'relative', padding: '2rem',
                        background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.08), transparent 70%)',
                        borderRadius: '50%/30%',
                      }}>
                        {['String 1 – Pa', 'String 2 – Sa', 'String 3 – Pa', 'String 4 – Sa'].map((str, idx) => {
                          const isActive = activeViolinString === idx;
                          return (
                            <motion.div
                              key={idx}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '1.5rem',
                                marginBottom: idx < 3 ? '1.5rem' : 0,
                                transformStyle: 'preserve-3d',
                              }}
                            >
                              <span style={{
                                width: '110px', fontSize: '0.9rem',
                                color: isActive ? colors.purple : colors.textDim,
                                fontWeight: isActive ? 'bold' : 'normal',
                                textShadow: isActive ? `0 0 8px ${colors.purple}66` : 'none',
                              }}>{str}</span>
                              <div style={{
                                flex: 1, position: 'relative',
                                height: isActive ? '4px' : '2px',
                                perspective: '400px',
                              }}>
                                {/* String shadow (3D depth illusion) */}
                                <div style={{
                                  position: 'absolute', top: '6px', left: '5%', right: '5%',
                                  height: '2px', borderRadius: '2px',
                                  background: isActive ? `${colors.purple}22` : 'transparent',
                                  filter: 'blur(3px)',
                                }} />
                                {/* Main string */}
                                <motion.div
                                  animate={isActive ? {
                                    scaleY: [1, 2, 0.8, 1.5, 1],
                                    opacity: [0.9, 1, 0.85, 1, 0.9],
                                  } : {}}
                                  transition={isActive ? { duration: 0.3, repeat: Infinity, repeatDelay: 0.1 } : {}}
                                  style={{
                                    width: '100%', height: '100%', borderRadius: '2px',
                                    background: isActive
                                      ? `linear-gradient(90deg, ${colors.purple}88, ${colors.purple}, ${colors.purple}88)`
                                      : 'linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.12), rgba(255,255,255,0.06))',
                                    boxShadow: isActive
                                      ? `0 0 12px ${colors.purple}88, 0 0 24px ${colors.purple}44, 0 2px 4px rgba(0,0,0,0.3)`
                                      : '0 1px 2px rgba(0,0,0,0.2)',
                                  }}
                                />
                                {/* Bow contact point */}
                                {isActive && (
                                  <motion.div
                                    animate={{ x: [0, 120, 0] }}
                                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                                    style={{
                                      position: 'absolute', top: '-8px', left: '15%',
                                      width: '20px', height: '20px', borderRadius: '50%',
                                      background: `radial-gradient(circle, ${colors.purple}, transparent 60%)`,
                                      boxShadow: `0 0 12px ${colors.purple}`,
                                    }}
                                  />
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ===== 3D DRUM PADS ===== */}
                  {activeMode === 'drum' && (
                    <div style={{
                      display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center',
                      height: '100%', alignContent: 'center', minHeight: '280px',
                      perspective: '800px',
                    }}>
                      {DRUM_PADS.map((pad, idx) => {
                        const isActive = activeDrum === pad.name;
                        return (
                          <motion.button
                            key={idx}
                            whileHover={{ scale: 1.06, rotateX: -5 }}
                            whileTap={{ scale: 0.88, rotateX: 8 }}
                            animate={isActive ? { scale: [1, 0.92, 1.05, 1], rotateX: [0, 8, -3, 0] } : {}}
                            transition={isActive ? { duration: 0.3 } : { type: 'spring', stiffness: 300, damping: 15 }}
                            onClick={() => handleDrumTest(pad.name)}
                            style={{
                              width: '90px', height: '90px', borderRadius: '50%',
                              transformStyle: 'preserve-3d',
                              background: isActive
                                ? `radial-gradient(circle at 35% 35%, ${colors.pink}ee, ${colors.pink}88 60%, ${colors.pink}44 100%)`
                                : `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.08), rgba(255,255,255,0.02) 60%, rgba(0,0,0,0.2) 100%)`,
                              border: `2px solid ${isActive ? colors.pink : 'rgba(255,255,255,0.1)'}`,
                              color: isActive ? 'white' : colors.textDim,
                              fontWeight: 'bold', cursor: 'pointer',
                              boxShadow: isActive
                                ? `0 0 30px ${colors.pink}66, 0 8px 20px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.15)`
                                : '0 6px 16px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.05)',
                              transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
                              fontSize: '0.72rem',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                            }}
                          >
                            <span style={{ fontSize: '1.2rem' }}>{pad.icon}</span>
                            <span>{pad.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {activeMode === 'vocal' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '2rem', minHeight: '280px' }}>
                      <motion.div animate={{ y: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 3 }}>
                        <span style={{ fontSize: '5rem' }}>🎤</span>
                      </motion.div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', height: '50px' }}>
                        {[...Array(15)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: ['20%', '100%', '20%'] }}
                            transition={{ repeat: Infinity, duration: 0.4 + Math.random() * 0.6, delay: i * 0.05 }}
                            style={{ width: '6px', background: colors.amber, borderRadius: '3px' }}
                          />
                        ))}
                      </div>
                      <p style={{ color: colors.textMuted, fontSize: '0.95rem' }}>Voice controls and effects can be displayed here.</p>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* ============== 6 & 7. AUDIO & GESTURE ============== */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>

          {/* AUDIO CONTROL */}
          <div style={panelStyle}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.4rem', color: colors.textMain }}>Audio Control</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {Object.entries(volumes).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ width: '80px', textTransform: 'capitalize', color: key === 'master' ? colors.textMain : colors.textMuted, fontWeight: key === 'master' ? 'bold' : 'normal' }}>{key}</span>
                  <input
                    type="range" min="0" max="100" value={val}
                    onChange={(e) => handleVolumeChange(key, parseInt(e.target.value))}
                    style={{ flex: 1, height: '6px', WebkitAppearance: 'none', background: 'rgba(14,165,233,0.2)', borderRadius: '3px', outline: 'none', margin: 0, padding: 0, border: 'none', boxShadow: 'none' }}
                  />
                  <span style={{ width: '45px', textAlign: 'right', color: colors.cyan, fontWeight: 'bold' }}>{val}%</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleMuteAll} style={{ flex: 1, padding: '0.8rem', background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.1)`, color: colors.textMain, borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                Mute All
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleStopAllSounds} style={{ flex: 1, padding: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', border: `1px solid ${colors.danger}`, color: colors.danger, borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                Stop Sounds
              </motion.button>
            </div>
          </div>

          {/* GESTURE DETECTION */}
          <div style={panelStyle}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.4rem', color: colors.textMain }}>Gesture Detection</h3>
            {activeMode === 'drum' || activeMode === 'violin' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...rowDivider, paddingBottom: '1rem' }}>
                  <span style={{ color: colors.textMuted }}>Current Model:</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: colors.textMain }}>
                    {activeMode === 'drum' ? 'Drum Hit Detection' : 'Bow Gesture Detection'}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: colors.textMuted }}>Detected State:</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: activeMode === 'drum' ? colors.pink : colors.purple }}>
                    {activeMode === 'drum' ? (activeDrum ? 'Hit' : 'Idle') : (bowState.active ? 'Bow Active' : 'Idle')}
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                    <span style={{ color: colors.textMuted }}>Status:</span>
                    <strong style={{ fontSize: '1.2rem', color: colors.textMain }}>
                      {activeMode === 'drum' ? (activeDrum ? `${activeDrum}` : 'Waiting...') : (bowState.active ? 'Sustain ON' : 'Waiting...')}
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textDim, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '12px', padding: '2rem' }}>
                Gesture detection is not currently active for {activeMode} mode.
              </div>
            )}
          </div>
        </section>

        {/* ============== 8. RECENT ACTIVITY LOG ============== */}
        <section style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.4rem', color: colors.textMain }}>Recent Activity</h3>
            <button onClick={clearLog} style={{ background: 'transparent', border: 'none', color: colors.cyan, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>
              CLEAR LOG
            </button>
          </div>
          <div ref={logContainerRef} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', height: '250px', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', fontFamily: 'monospace', border: '1px solid rgba(255,255,255,0.04)', fontSize: '0.9rem' }}>
            {activityLog.length === 0 && <div style={{ color: colors.textDim, textAlign: 'center', marginTop: '2rem' }}>No activity to show.</div>}
            {activityLog.map(log => {
              let iconColor = colors.textDim;
              if (log.type === 'system') iconColor = colors.success;
              if (log.type === 'danger') iconColor = colors.danger;
              if (log.type === 'mode') iconColor = colors.cyan;
              if (log.type === 'action') iconColor = colors.pink;
              if (log.type === 'audio') iconColor = colors.amber;
              return (
                <div key={log.id} style={{ display: 'flex', gap: '1rem', borderBottom: `1px solid ${colors.divider}`, paddingBottom: '0.6rem', alignItems: 'flex-start' }}>
                  <span style={{ color: colors.textDim, minWidth: '85px' }}>[{log.time}]</span>
                  <span style={{ color: iconColor }}>●</span>
                  <span style={{ color: colors.textMuted, lineHeight: 1.4 }}>{log.msg}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============== 9. EMERGENCY ACTION BAR ============== */}
        <section style={{ ...panelStyle, display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleStopAllSounds} style={{ flex: '1 1 200px', padding: '1.2rem', background: colors.danger, border: 'none', color: 'white', borderRadius: '12px', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', boxShadow: `0 6px 20px rgba(239, 68, 68, 0.3)` }}>
            STOP ALL SOUNDS
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleReconnect} style={{ flex: '1 1 200px', padding: '1.2rem', background: 'rgba(14, 165, 233, 0.1)', border: `1px solid ${colors.cyan}`, color: colors.cyan, borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
            Reconnect Devices
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleReset} style={{ flex: '1 1 200px', padding: '1.2rem', background: 'rgba(139, 92, 246, 0.1)', border: `1px solid ${colors.purple}`, color: colors.purple, borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
            Reset Controllers
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={clearLog} style={{ flex: '1 1 200px', padding: '1.2rem', background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.1)`, color: colors.textMuted, borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
            Clear Log
          </motion.button>
        </section>

      </div>
    </div>
  );
}
