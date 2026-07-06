import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';

// --- Light Theme Colors (matching site CSS variables) ---
const colors = {
  bg: '#f8fafc',
  panelBg: 'rgba(0, 0, 0, 0.8)',
  border: 'rgba(14, 165, 233, 0.2)',
  borderGlow: '0 8px 32px rgba(14, 165, 233, 0.08)',
  cyan: '#0ea5e9',
  purple: '#8b5cf6',
  pink: '#ec4899',
  textMain: '#0f172a',
  textMuted: '#475569',
  success: '#10b981',
  danger: '#ef4444',
  cardBg: 'white',
};

const panelStyle = {
  background: colors.cardBg,
  border: `1px solid ${colors.border}`,
  borderRadius: '20px',
  padding: '1.5rem',
  boxShadow: colors.borderGlow,
  color: colors.textMain,
};

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const { emitModeChange, deviceStatus, currentNote } = useContext(SocketContext);

  // --- State ---
  const [activeMode, setActiveMode] = useState('piano');
  const [volumes, setVolumes] = useState({ master: 80, piano: 100, violin: 100, drum: 100 });
  const [activityLog, setActivityLog] = useState([
    { id: 1, time: new Date().toLocaleTimeString(), type: 'system', msg: 'System initialized.' }
  ]);
  const logContainerRef = useRef(null);

  const isOnline = deviceStatus?.active || false;

  // --- Helpers ---
  const addLog = (type, msg) => {
    setActivityLog(prev => [...prev, { id: Date.now(), time: new Date().toLocaleTimeString(), type, msg }]);
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
    // SOCKET EMIT PLACEHOLDER: socket.emit("set_mode", { mode });
    if (emitModeChange) {
      const modeMap = { piano: 0, violin: 1, drum: 2, vocal: 3 };
      emitModeChange(modeMap[mode]);
    }
  };

  const handleVolumeChange = (channel, value) => {
    setVolumes(prev => ({ ...prev, [channel]: value }));
    // SOCKET EMIT PLACEHOLDER: socket.emit("set_volume", { channel, value });
  };

  const handleMuteAll = () => {
    setVolumes({ master: 0, piano: 0, violin: 0, drum: 0 });
    addLog('audio', 'All channels muted.');
    // SOCKET EMIT PLACEHOLDER: socket.emit("mute_all");
  };

  const handleStopAllSounds = () => {
    addLog('danger', 'EMERGENCY: All sounds stopped.');
    // SOCKET EMIT PLACEHOLDER: socket.emit("stop_all_sounds");
  };

  const handleDrumTest = (sound) => {
    addLog('action', `Drum pad triggered: ${sound}`);
    // SOCKET EMIT PLACEHOLDER: socket.emit("play_drum", { sound });
  };

  const handleReconnect = () => {
    addLog('system', 'Attempting device reconnection...');
    // SOCKET EMIT PLACEHOLDER: socket.emit("reconnect_devices");
  };

  const handleReset = () => {
    addLog('danger', 'Resetting controllers...');
    // SOCKET EMIT PLACEHOLDER: socket.emit("reset_controllers");
  };

  const clearLog = () => setActivityLog([]);

  // --- Mode config ---
  const modes = [
    { id: 'piano', label: 'Piano', icon: '🎹', color: colors.cyan },
    { id: 'violin', label: 'Violin', icon: '🎻', color: colors.purple },
    { id: 'drum', label: 'Drum', icon: '🥁', color: colors.pink },
    { id: 'vocal', label: 'Vocal', icon: '🎤', color: '#f59e0b' },
  ];

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--panel-padding-medium)', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* 1. HEADER */}
        <div className="responsive-header" style={{ borderBottom: `1px solid ${colors.border}`, paddingBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, color: colors.textMain }}>
              Performance Dashboard
            </h1>
            <p style={{ color: colors.textMuted, margin: '0.5rem 0 0 0', fontSize: '1.1rem' }}>
              Control and monitor your Synthwave performance in real time.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.08)', padding: '0.6rem 1.2rem', borderRadius: '50px', border: `1px solid ${isOnline ? colors.success : colors.danger}` }}>
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ width: '12px', height: '12px', borderRadius: '50%', background: isOnline ? colors.success : colors.danger, boxShadow: `0 0 8px ${isOnline ? colors.success : colors.danger}` }}
            />
            <span style={{ color: isOnline ? colors.success : colors.danger, fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.85rem' }}>
              {isOnline ? 'System Online' : 'System Offline'}
            </span>
          </div>
        </div>

        {/* 2. INSTRUMENT MODE SELECTOR */}
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
                    border: `2px solid ${isActive ? m.color : 'rgba(0,0,0,0.06)'}`,
                    boxShadow: isActive ? `0 8px 25px ${m.color}33` : '0 4px 15px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    background: isActive ? `linear-gradient(180deg, white 0%, ${m.color}10 100%)` : 'white',
                    padding: '2rem 1.5rem',
                  }}
                >
                  <span style={{ fontSize: '3.5rem', marginBottom: '1rem', filter: isActive ? `drop-shadow(0 0 8px ${m.color})` : 'none' }}>{m.icon}</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: isActive ? m.color : colors.textMuted }}>{m.label}</span>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      style={{ position: 'absolute', top: '10px', right: '10px', background: m.color, color: 'white', fontSize: '0.7rem', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', letterSpacing: '1px' }}
                    >
                      ACTIVE
                    </motion.div>
                  )}
                  {isActive && <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: m.color }}></div>}
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* 3. CONTROLLER STATUS CARDS */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {/* Controller 1 */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.5rem', color: colors.textMain }}>Controller 1</h3>
                <span style={{ color: colors.textMuted, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Main Controller</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isOnline ? colors.success : colors.textMuted, background: isOnline ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.04)', padding: '4px 12px', borderRadius: '20px' }}>
                <span style={{ fontSize: '1rem' }}>{isOnline ? '✓' : '✗'}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{isOnline ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: colors.textMuted }}>Role:</span> <strong style={{ color: colors.cyan }}>Piano Notes • Violin Bow • Drum Motion</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: colors.textMuted }}>Last Heartbeat:</span> <strong>{isOnline ? '12ms ago' : '--'}</strong></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.9rem' }}>
              {['MPU9250 IMU', 'HMC5883L Mag', 'Joystick', 'BMP180 Barometer'].map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: isOnline ? colors.success : colors.textMuted }}>{isOnline ? '✓' : '○'}</span> {s}
                </div>
              ))}
            </div>
          </div>

          {/* Controller 2 */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.5rem', color: colors.textMain }}>Controller 2</h3>
                <span style={{ color: colors.textMuted, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Secondary Controller</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isOnline ? colors.success : colors.textMuted, background: isOnline ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.04)', padding: '4px 12px', borderRadius: '20px' }}>
                <span style={{ fontSize: '1rem' }}>{isOnline ? '✓' : '✗'}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{isOnline ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: colors.textMuted }}>Role:</span> <strong style={{ color: colors.purple }}>Additional Notes • Modifiers</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: colors.textMuted }}>Last Heartbeat:</span> <strong>{isOnline ? '15ms ago' : '--'}</strong></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', fontSize: '0.9rem' }}>
              {['Button Inputs', 'Wi-Fi Connection'].map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: isOnline ? colors.success : colors.textMuted }}>{isOnline ? '✓' : '○'}</span> {s}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4 & 5. LIVE MONITOR & VISUALIZER */}
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
                {activeMode === 'piano' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.5rem' }}><span style={{ color: colors.textMuted }}>Current Swara:</span> <strong style={{ fontSize: '1.2rem' }}>{currentNote?.instrument === 'piano' ? currentNote.note : '--'}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.5rem' }}><span style={{ color: colors.textMuted }}>MIDI Note:</span> <strong>{currentNote?.instrument === 'piano' ? 'Active' : '--'}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.5rem' }}><span style={{ color: colors.textMuted }}>Pitch Range:</span> <strong style={{ color: colors.cyan }}>Madhya</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.5rem' }}><span style={{ color: colors.textMuted }}>Controller:</span> <strong>Controller 1</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: colors.textMuted }}>Button:</span> <strong>GPIO 13</strong></div>
                  </>
                )}
                {activeMode === 'violin' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.5rem' }}><span style={{ color: colors.textMuted }}>Current Note:</span> <strong style={{ fontSize: '1.2rem' }}>{currentNote?.instrument === 'violin' ? currentNote.note : '--'}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.5rem' }}><span style={{ color: colors.textMuted }}>Selected String:</span> <strong>{currentNote?.instrument === 'violin' ? 'Active String' : '--'}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.5rem' }}><span style={{ color: colors.textMuted }}>Bow Status:</span> <strong style={{ color: colors.purple }}>Bow Drag</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.5rem' }}><span style={{ color: colors.textMuted }}>Meend Direction:</span> <strong>Neutral</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: colors.textMuted }}>Modifier:</span> <strong>None</strong></div>
                  </>
                )}
                {activeMode === 'drum' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.5rem' }}><span style={{ color: colors.textMuted }}>Last Hit:</span> <strong style={{ fontSize: '1.2rem' }}>{currentNote?.instrument === 'drum' ? currentNote.note : '--'}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.5rem' }}><span style={{ color: colors.textMuted }}>Velocity:</span> <strong>118</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.5rem' }}><span style={{ color: colors.textMuted }}>Controller:</span> <strong>Controller 1</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.5rem' }}><span style={{ color: colors.textMuted }}>Button:</span> <strong>GPIO 13</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: colors.textMuted }}>Motion State:</span> <strong style={{ color: colors.pink }}>Hit Detected</strong></div>
                  </>
                )}
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

          {/* VISUALIZER */}
          <div style={{ ...panelStyle, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.4rem', color: colors.textMain }}>Dynamic Visualizer</h3>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,165,233,0.03)', borderRadius: '12px', padding: '1rem', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.04)', minHeight: '280px' }}>
              <AnimatePresence mode="wait">
                <motion.div key={activeMode} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ width: '100%', height: '100%' }}>

                  {activeMode === 'piano' && (
                    <div style={{ display: 'flex', height: '100%', width: '100%', gap: '4px', padding: '10px 0', minHeight: '240px' }}>
                      {['Sa', 'K.Ri', 'Ri', 'K.Ga', 'Ga', 'Ma', 'T.Ma', 'Pa', 'K.Dh', 'Dha', 'K.Ni', 'Ni'].map((note, idx) => {
                        const isBlack = [1, 3, 6, 8, 10].includes(idx);
                        const isActive = currentNote?.instrument === 'piano' && currentNote?.note === note;
                        return (
                          <div key={idx} style={{
                            flex: 1, background: isActive ? colors.cyan : (isBlack ? '#334155' : '#f1f5f9'),
                            borderRadius: '0 0 6px 6px', position: 'relative',
                            height: isBlack ? '65%' : '100%',
                            boxShadow: isActive ? `0 0 15px ${colors.cyan}` : '0 2px 4px rgba(0,0,0,0.1)',
                            zIndex: isBlack ? 1 : 0,
                            marginLeft: isBlack ? '-4%' : '0', marginRight: isBlack ? '-4%' : '0',
                            display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '10px',
                            border: isActive ? 'none' : '1px solid rgba(0,0,0,0.08)',
                          }}>
                            <span style={{ writingMode: 'vertical-rl', color: isActive ? 'white' : (isBlack ? '#94a3b8' : '#64748b'), fontSize: '0.7rem', fontWeight: 'bold' }}>{note}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {activeMode === 'violin' && (
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', height: '100%', padding: '1rem 2rem', minHeight: '240px' }}>
                      {['String 1 – Pa', 'String 2 – Sa', 'String 3 – Pa', 'String 4 – Sa'].map((str, idx) => {
                        const strLabel = str.split(' – ')[0];
                        const isActive = currentNote?.instrument === 'violin' && currentNote?.note === strLabel;
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <span style={{ width: '100px', fontSize: '0.9rem', color: isActive ? colors.purple : colors.textMuted, fontWeight: isActive ? 'bold' : 'normal' }}>{str}</span>
                            <div style={{ flex: 1, height: isActive ? '6px' : '2px', background: isActive ? colors.purple : 'rgba(0,0,0,0.1)', borderRadius: '3px', boxShadow: isActive ? `0 0 10px ${colors.purple}` : 'none', position: 'relative' }}>
                              {isActive && (
                                <motion.div
                                  animate={{ x: [0, 150, 0] }}
                                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                  style={{ position: 'absolute', top: '-5px', left: '20%', width: '16px', height: '16px', borderRadius: '50%', background: colors.purple, boxShadow: `0 0 8px ${colors.purple}` }}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {activeMode === 'drum' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center', height: '100%', alignContent: 'center', minHeight: '240px' }}>
                      {['Snare', 'Hi-Hat', 'Tom 1', 'Tom 2', 'Tom 3', 'Cymbal', 'Crash'].map((pad, idx) => {
                        const isActive = currentNote?.instrument === 'drum' && currentNote?.note === pad;
                        return (
                          <motion.button
                            key={idx}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.9, backgroundColor: colors.pink }}
                            onClick={() => handleDrumTest(pad)}
                            style={{
                              width: '85px', height: '85px', borderRadius: '50%',
                              background: isActive ? colors.pink : 'rgba(236, 72, 153, 0.05)',
                              border: `2px solid ${colors.pink}`,
                              color: isActive ? 'white' : colors.pink, fontWeight: 'bold', cursor: 'pointer',
                              boxShadow: isActive ? `0 0 20px ${colors.pink}` : `0 2px 8px rgba(236, 72, 153, 0.1)`,
                              transition: 'all 0.2s', fontSize: '0.85rem',
                            }}
                          >
                            {pad}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {activeMode === 'vocal' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '2rem', minHeight: '240px' }}>
                      <motion.div animate={{ y: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 3 }}>
                        <span style={{ fontSize: '5rem' }}>🎤</span>
                      </motion.div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', height: '50px' }}>
                        {[...Array(15)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: ['20%', '100%', '20%'] }}
                            transition={{ repeat: Infinity, duration: 0.4 + Math.random() * 0.6, delay: i * 0.05 }}
                            style={{ width: '6px', background: '#f59e0b', borderRadius: '3px' }}
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

        {/* 6 & 7. AUDIO & GESTURE */}
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
                    style={{ flex: 1, height: '6px', WebkitAppearance: 'none', background: 'rgba(14,165,233,0.15)', borderRadius: '3px', outline: 'none', margin: 0, padding: 0, border: 'none', boxShadow: 'none' }}
                  />
                  <span style={{ width: '45px', textAlign: 'right', color: colors.cyan, fontWeight: 'bold' }}>{val}%</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleMuteAll} style={{ flex: 1, padding: '0.8rem', background: 'rgba(0,0,0,0.03)', border: `1px solid rgba(0,0,0,0.1)`, color: colors.textMain, borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                Mute All
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleStopAllSounds} style={{ flex: 1, padding: '0.8rem', background: 'rgba(239, 68, 68, 0.08)', border: `1px solid ${colors.danger}`, color: colors.danger, borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                Stop Sounds
              </motion.button>
            </div>
          </div>

          {/* GESTURE DETECTION */}
          <div style={panelStyle}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.4rem', color: colors.textMain }}>Gesture Detection</h3>
            {activeMode === 'drum' || activeMode === 'violin' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '1rem' }}>
                  <span style={{ color: colors.textMuted }}>Current Model:</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: colors.textMain }}>
                    {activeMode === 'drum' ? 'Drum Hit Detection' : 'Bow Gesture Detection'}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: colors.textMuted }}>Detected State:</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', color: activeMode === 'drum' ? colors.pink : colors.purple }}>
                    {activeMode === 'drum' ? 'Hit' : 'Bow Drag'}
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                    <span style={{ color: colors.textMuted }}>Confidence:</span>
                    <strong style={{ fontSize: '1.2rem', color: colors.textMain }}>{activeMode === 'drum' ? '92%' : '88%'}</strong>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.06)', borderRadius: '5px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: activeMode === 'drum' ? '92%' : '88%' }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      style={{ height: '100%', background: activeMode === 'drum' ? colors.pink : colors.purple, borderRadius: '5px' }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textMuted, textAlign: 'center', border: '1px dashed rgba(0,0,0,0.1)', borderRadius: '12px', padding: '2rem' }}>
                Gesture detection is not currently active for {activeMode} mode.
              </div>
            )}
          </div>
        </section>

        {/* 8. RECENT ACTIVITY LOG */}
        <section style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.4rem', color: colors.textMain }}>Recent Activity</h3>
            <button onClick={clearLog} style={{ background: 'transparent', border: 'none', color: colors.cyan, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>
              CLEAR LOG
            </button>
          </div>
          <div ref={logContainerRef} style={{ background: 'rgba(14,165,233,0.03)', borderRadius: '12px', height: '250px', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', fontFamily: 'monospace', border: '1px solid rgba(0,0,0,0.05)', fontSize: '0.9rem' }}>
            {activityLog.length === 0 && <div style={{ color: colors.textMuted, textAlign: 'center', marginTop: '2rem' }}>No activity to show.</div>}
            {activityLog.map(log => {
              let iconColor = colors.textMuted;
              if (log.type === 'system') iconColor = colors.success;
              if (log.type === 'danger') iconColor = colors.danger;
              if (log.type === 'mode') iconColor = colors.cyan;
              if (log.type === 'action') iconColor = colors.pink;
              if (log.type === 'audio') iconColor = '#f59e0b';
              return (
                <div key={log.id} style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(0,0,0,0.03)', paddingBottom: '0.6rem', alignItems: 'flex-start' }}>
                  <span style={{ color: colors.textMuted, minWidth: '85px' }}>[{log.time}]</span>
                  <span style={{ color: iconColor }}>●</span>
                  <span style={{ color: colors.textMain, lineHeight: 1.4 }}>{log.msg}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 9. EMERGENCY ACTION BAR */}
        <section style={{ ...panelStyle, display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', background: 'white' }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleStopAllSounds} style={{ flex: '1 1 200px', padding: '1.2rem', background: colors.danger, border: 'none', color: 'white', borderRadius: '12px', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', boxShadow: `0 6px 15px rgba(239, 68, 68, 0.25)` }}>
            STOP ALL SOUNDS
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleReconnect} style={{ flex: '1 1 200px', padding: '1.2rem', background: 'rgba(14, 165, 233, 0.08)', border: `1px solid ${colors.cyan}`, color: colors.cyan, borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
            Reconnect Devices
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleReset} style={{ flex: '1 1 200px', padding: '1.2rem', background: 'rgba(139, 92, 246, 0.08)', border: `1px solid ${colors.purple}`, color: colors.purple, borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
            Reset Controllers
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={clearLog} style={{ flex: '1 1 200px', padding: '1.2rem', background: 'rgba(0,0,0,0.03)', border: `1px solid rgba(0,0,0,0.1)`, color: colors.textMuted, borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
            Clear Log
          </motion.button>
        </section>

      </div>
    </div>
  );
}
