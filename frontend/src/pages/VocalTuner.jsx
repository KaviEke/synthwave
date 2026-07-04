import React, { useEffect, useState, useContext, useRef } from 'react';
import { SocketContext } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Constants ───────────────────────────────────────────────────────────────
const KEYS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

const SCALE_MAPS = {
  chromatic:  [0,1,2,3,4,5,6,7,8,9,10,11],
  major:      [0,2,4,5,7,9,11],
  minor:      [0,2,3,5,7,8,10],
  blues:      [0,3,5,6,7,10],
  pentatonic: [0,2,4,7,9]
};

const SCALES = [
  { id: 'chromatic',  name: 'Chromatic',  desc: 'All 12 notes – minimal correction.' },
  { id: 'major',      name: 'Major',      desc: 'Bright, happy, classic sound.' },
  { id: 'minor',      name: 'Minor',      desc: 'Sad, dark, emotional.' },
  { id: 'blues',      name: 'Blues',      desc: 'Soulful, expressive, raw.' },
  { id: 'pentatonic', name: 'Pentatonic', desc: 'Folk, rock, and pop standard.' }
];

// ─── Pitch Detection (fast autocorrelation – Tartini / McLeod) ───────────────
function detectPitch(buffer, sampleRate) {
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.01) return -1; // silence

  // YIN-lite: find first peak in autocorrelation above threshold
  const SIZE = buffer.length;
  let bestPeriod = -1;
  let maxVal = 0;

  for (let lag = 30; lag < SIZE / 2; lag++) {
    let corr = 0;
    for (let i = 0; i < SIZE / 2; i++) {
      corr += buffer[i] * buffer[i + lag];
    }
    if (corr > maxVal) {
      maxVal = corr;
      bestPeriod = lag;
    }
  }

  if (bestPeriod < 1) return -1;
  const freq = sampleRate / bestPeriod;
  return (freq > 60 && freq < 1100) ? freq : -1;
}

// ─── Note name from frequency ─────────────────────────────────────────────────
function freqToNoteName(freq, scale, key) {
  if (freq <= 0) return { name: null, targetFreq: null };
  const midiRaw   = Math.round(12 * Math.log2(freq / 440.0) + 69);
  const rootVal   = KEYS.indexOf(key);
  const intervals = SCALE_MAPS[scale] || SCALE_MAPS.major;
  const octave    = Math.floor(midiRaw / 12);
  const semitone  = ((midiRaw % 12) + 12) % 12;
  const relative  = ((semitone - rootVal) + 12) % 12;
  const best      = intervals.reduce((a, b) =>
    Math.abs(b - relative) < Math.abs(a - relative) ? b : a
  );
  const tuned = octave * 12 + rootVal + best;
  const targetFreq = 440.0 * Math.pow(2, (tuned - 69) / 12);
  return { 
    name: `${KEYS[((tuned % 12) + 12) % 12]}${Math.floor(tuned / 12) - 1}`,
    targetFreq
  };
}

// ─── Reverb Impulse ───────────────────────────────────────────────────────────
function buildImpulse(ctx, duration = 2.0, decay = 2.0) {
  const len     = Math.floor(ctx.sampleRate * duration);
  const impulse = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < len; i++)
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return impulse;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function VocalTuner() {
  const { socket, deviceStatus } = useContext(SocketContext);

  // UI state
  const [scale,      setScale]      = useState('major');
  const [key,        setKey]        = useState('C');
  const [reverb,     setReverb]     = useState(35);
  const [gain,       setGain]       = useState(1.5);
  const [bpm,        setBpm]        = useState(120);
  const [quantize,   setQuantize]   = useState('Off');
  const [pitchSnap,  setPitchSnap]  = useState(80);
  const [smoothing,  setSmoothing]  = useState(50);
  const [wetDry,     setWetDry]     = useState(20);
  const [grainSize,  setGrainSize]  = useState(100);
  const [feedback,   setFeedback]   = useState(30);

  const [monitoring, setMonitoring] = useState(false);
  const [isActive,   setIsActive]   = useState(false);
  const [note,       setNote]       = useState(null);
  const [vu,         setVu]         = useState(0);
  const [error,      setError]      = useState(null);
  
  // Recording state
  const [isRecording,  setIsRecording]  = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef= useRef([]);

  // Refs that the audio loop reads – avoids stale closure entirely
  const scaleRef      = useRef(scale);
  const keyRef        = useRef(key);
  const monitoringRef = useRef(monitoring);
  const bpmRef        = useRef(bpm);
  const quantizeRef   = useRef(quantize);
  const pitchSnapRef  = useRef(pitchSnap);
  const smoothingRef  = useRef(smoothing);
  const wetDryRef     = useRef(wetDry);

  // Audio node refs
  const ctxRef      = useRef(null);
  const streamRef   = useRef(null);
  const analyserRef = useRef(null);
  const gainRef     = useRef(null);
  const currentOscRef = useRef(null); 
  const oscGainRef    = useRef(null); 
  const humanizeOscRef = useRef(null);
  const stutterOscRef = useRef(null);
  const wetRef      = useRef(null);
  const dryRef      = useRef(null);
  const delayRef    = useRef(null);
  const feedbackRef = useRef(null);
  const wetDryMixGainRef = useRef({ mic: null, fx: null });
  const processorRef= useRef(null);
  const rafRef      = useRef(null);
  const emitRef     = useRef(0);

  // Keep refs in sync with state
  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { keyRef.current   = key;   }, [key]);
  useEffect(() => { monitoringRef.current = monitoring; }, [monitoring]);
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { quantizeRef.current = quantize; }, [quantize]);
  useEffect(() => { pitchSnapRef.current = pitchSnap; }, [pitchSnap]);
  useEffect(() => { smoothingRef.current = smoothing; }, [smoothing]);
  useEffect(() => { wetDryRef.current = wetDry; }, [wetDry]);

  // Emit config to hub on change
  useEffect(() => {
    if (socket) socket.emit('autotune_config', { scale, key, reverb, grainSize, feedback, gain, monitor: monitoring, quantize, pitchSnap });
  }, [scale, key, reverb, grainSize, feedback, gain, monitoring, socket, quantize, pitchSnap]);

  // Listen for remote stutter changes from physical controllers
  useEffect(() => {
    if (!socket) return;
    const handleStutter = (data) => {
      if (data && data.quantize && ['Off', '1/4', '1/8', '1/16', '1/32'].includes(data.quantize)) {
        setQuantize(data.quantize);
      }
    };
    socket.on('set_stutter', handleStutter);
    return () => socket.off('set_stutter', handleStutter);
  }, [socket]);

  // Live-update gain
  useEffect(() => { if (gainRef.current) gainRef.current.gain.value = gain; }, [gain]);

  // Live-update reverb wet/dry
  useEffect(() => {
    if (wetRef.current) wetRef.current.gain.value = reverb / 100;
    if (dryRef.current) dryRef.current.gain.value = 1 - reverb / 100;
  }, [reverb]);

  // Live-update granular looper
  useEffect(() => {
    if (delayRef.current) delayRef.current.delayTime.value = grainSize / 1000;
    if (feedbackRef.current) feedbackRef.current.gain.value = feedback / 100;
  }, [grainSize, feedback]);

  // Live-update humanize detune amount
  useEffect(() => {
    if (humanizeOscRef.current) humanizeOscRef.current.mod.gain.value = (smoothing / 100) * 50;
  }, [smoothing]);

  // Live-update Wet/Dry Mix
  useEffect(() => {
    if (wetDryMixGainRef.current.mic && wetDryMixGainRef.current.fx) {
       wetDryMixGainRef.current.mic.gain.value = 1.0 - (wetDry / 100);
       wetDryMixGainRef.current.fx.gain.value = wetDry / 100;
    }
  }, [wetDry]);

  // ── Start ─────────────────────────────────────────────────────────────────
  async function startAudio() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,    // Enable browser AEC
          noiseSuppression: true,    // Enable browser Noise Cancellation
          autoGainControl: true,     // Let the browser normalize raw mic volume
          channelCount: 1            // Mono input is best for vocals
        }, 
        video: false 
      });
      streamRef.current = stream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext({ sampleRate: 44100 });
      ctxRef.current   = ctx;

      const src        = ctx.createMediaStreamSource(stream);
      const analyser   = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      // Microphone volume (a little lower so the synth shines through)
      const micGain = ctx.createGain();
      micGain.gain.value = 0.5;
      
      // -- Vocal EQ Refinement --
      // High-pass filter to remove rumble and low-end noise
      const hpf = ctx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = 100;
      
      // Presence boost (Peaking filter) to make vocals cut through and sound "pro"
      const presenceScale = ctx.createBiquadFilter();
      presenceScale.type = 'peaking';
      presenceScale.frequency.value = 3500;
      presenceScale.Q.value = 1.0;
      presenceScale.gain.value = 4.0; // Boost 4dB presence
      
      src.connect(hpf);
      hpf.connect(presenceScale);
      
      // Analyze the clean filtered mic BEFORE the noise gate mutes it
      presenceScale.connect(analyser);
      
      presenceScale.connect(micGain);
      
      // Noise Gate & Compression
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -30; // Catch more dynamics
      comp.ratio.value     = 6;   // Harder compression for consistent volume
      comp.attack.value    = 0.005;
      comp.release.value   = 0.1;
      
      micGain.connect(comp);

      // Reverb
      const conv    = ctx.createConvolver();
      conv.buffer   = buildImpulse(ctx);
      const wetGain = ctx.createGain();
      const dryGain = ctx.createGain();
      wetGain.gain.value = reverb / 100;
      dryGain.gain.value = 1 - reverb / 100;
      wetRef.current = wetGain;
      dryRef.current = dryGain;

      // Granular Looper (Delay block)
      const delay    = ctx.createDelay(2.0);
      const fback    = ctx.createGain();
      delay.delayTime.value = grainSize / 1000;
      fback.gain.value   = feedback / 100;
      delay.connect(fback);
      fback.connect(delay);
      delayRef.current = delay;
      feedbackRef.current = fback;

      // Mix for Wet/Dry processing
      const micToMixGain = ctx.createGain();
      const fxToMixGain = ctx.createGain();
      micToMixGain.gain.value = 1.0 - (wetDry / 100);
      fxToMixGain.gain.value = wetDry / 100;
      wetDryMixGainRef.current = { mic: micToMixGain, fx: fxToMixGain };

      // Pure Synth Autotune Signal Path
      const oscGain = ctx.createGain();
      oscGain.gain.value = 0; 
      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 800;
      
      oscGain.connect(lpf);
      lpf.connect(dryGain);
      lpf.connect(conv);
      lpf.connect(delay);
      oscGainRef.current = oscGain;

      // Cleaned mic routing to effects and to dry mix
      comp.connect(dryGain);
      comp.connect(conv);
      comp.connect(delay);
      comp.connect(micToMixGain); // Base raw vocal directly to mixer

      // Combine all fx lines
      conv.connect(wetGain);
      
      const fxSum = ctx.createGain();
      delay.connect(fxSum);
      dryGain.connect(fxSum);
      wetGain.connect(fxSum);
      fxSum.connect(fxToMixGain); // Summed fx directly to mixer

      // Rhythmic Quantization (Stutter) setup
      const stutterGain = ctx.createGain();
      stutterGain.gain.value = 1.0; 
      
      const sOsc = ctx.createOscillator();
      sOsc.type = 'square';
      const sMod = ctx.createGain();
      sMod.gain.value = 0; // Off by default (0 amplitude for LFO)
      sOsc.connect(sMod);
      sMod.connect(stutterGain.gain);
      sOsc.start();
      stutterOscRef.current = { osc: sOsc, mod: sMod, gainNode: stutterGain };

      // Route through stutter block
      micToMixGain.connect(stutterGain);
      fxToMixGain.connect(stutterGain);

      // Auto-Tune Humanize LFO setup
      const humanizeOsc = ctx.createOscillator();
      humanizeOsc.type = 'sine';
      humanizeOsc.frequency.value = 5.0; // 5Hz vibrato
      const humanizeMod = ctx.createGain();
      humanizeMod.gain.value = (smoothing / 100) * 50; 
      humanizeOsc.connect(humanizeMod);
      humanizeOsc.start();
      humanizeOscRef.current = { osc: humanizeOsc, mod: humanizeMod };

      // Output gain
      const outGain = ctx.createGain();
      outGain.gain.value = gain;
      gainRef.current = outGain;
      
      stutterGain.connect(outGain);

      // We explicitly hook outGain up to destination here if monitoring is ON.
      if (monitoringRef.current) {
         outGain.connect(ctx.destination);
      }

      // --- Recording Setup ---
      // We route the final output to a MediaStreamDestination to record it natively
      const destNode = ctx.createMediaStreamDestination();
      outGain.connect(destNode);
      const mediaRecorder = new MediaRecorder(destNode.stream);
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        recordedChunksRef.current = [];
      };
      
      mediaRecorderRef.current = mediaRecorder;

      // --- Stream Audio to Pi Backend ---
      // 4096 gives ~92ms chunks at 44100Hz. A good balance between latency and packet count.
      const bufferSize = 4096;
      const processor = ctx.createScriptProcessor(bufferSize, 1, 1);
      outGain.connect(processor);
      processor.connect(ctx.destination); // Required for script processor to actually run in Chrome
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!socket) return;
        const inputBuffer = e.inputBuffer.getChannelData(0);
        // Copy to a new Float32Array to safely emit via WebSocket without detached array buffer errors
        const pcmData = new Float32Array(inputBuffer);
        socket.emit('audio_stream', pcmData.buffer); // Send as ArrayBuffer
      };

      // Ensure context is running (fixes silent audio in some browsers)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      setIsActive(true);

      // ── Analysis loop ──
      const buf = new Float32Array(2048);
      let lastNote = null;
      
      let osc = ctx.createOscillator();
      osc.type = 'triangle'; // Smooth, vocal-like harmonic structure (less harsh than sawtooth)
      osc.connect(oscGain);
      
      if (humanizeOscRef.current) {
         humanizeOscRef.current.mod.connect(osc.detune);
      }
      
      osc.start();
      currentOscRef.current = osc;

      const loop = () => {
        rafRef.current = requestAnimationFrame(loop);
        analyser.getFloatTimeDomainData(buf);

        // VU
        let s = 0;
        for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
        const currentVu = Math.min(Math.sqrt(s / buf.length) * 6, 1);
        setVu(currentVu);

        // Dynamic Noise Gate on Mic Gain 
        // Completely mute the raw microphone if the user is not actively singing (vu < 0.03)
        if (currentVu < 0.03) {
          micGain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
        } else {
          micGain.gain.setTargetAtTime(0.6, ctx.currentTime, 0.05);
        }

        // Pitch – uses refs so always fresh
        const freq = detectPitch(buf, ctx.sampleRate);
        if (freq > 0 && currentVu > 0.08) { // Higher threshold to ensure clear note tracking and ignore noise
          const { name: n, targetFreq } = freqToNoteName(freq, scaleRef.current, keyRef.current);
          if (n !== lastNote) { lastNote = n; setNote(n); }
          
          // Smoothly track frequency and open filter if louder
          if (currentOscRef.current && targetFreq) {
             const retuneTime = 0.20 - ((pitchSnapRef.current / 100) * 0.19); // Scales 100% -> 0.01s, 0% -> 0.20s
             currentOscRef.current.frequency.setTargetAtTime(targetFreq, ctx.currentTime, retuneTime);
             
             // Dynamic wah/filter using Triangle wave. Open up to 1200Hz max for softness.
             lpf.frequency.setTargetAtTime(400 + (currentVu * 800), ctx.currentTime, retuneTime);
          }
          
          // -- Stutter / Quantize Update --
          if (quantizeRef.current && quantizeRef.current !== 'Off') {
             const p_val = { '1/4': 1, '1/8': 0.5, '1/16': 0.25, '1/32': 0.125 }[quantizeRef.current] || 1;
             const sFreq = (bpmRef.current / 60) / p_val;
             if (stutterOscRef.current) {
                stutterOscRef.current.osc.frequency.setTargetAtTime(sFreq, ctx.currentTime, 0.02);
                stutterOscRef.current.mod.gain.setTargetAtTime(0.5, ctx.currentTime, 0.02); 
                stutterOscRef.current.gainNode.gain.cancelScheduledValues(ctx.currentTime);
                stutterOscRef.current.gainNode.gain.setTargetAtTime(0.5, ctx.currentTime, 0.02); // Let square wave swing between 0 and 1
             }
          } else {
             if (stutterOscRef.current) {
                stutterOscRef.current.mod.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
                stutterOscRef.current.gainNode.gain.cancelScheduledValues(ctx.currentTime);
                stutterOscRef.current.gainNode.gain.setTargetAtTime(1.0, ctx.currentTime, 0.02);
             }
          }
           if (oscGainRef.current) {
             // To prevent zero-value sticking in Web Audio, we cancel and set a new target
             oscGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
             
             // Soften the maximum synth volume to 0.4 max so it's a supportive backing vocal without alien artifacts
             oscGainRef.current.gain.setTargetAtTime(Math.min(currentVu * 0.8, 0.4), ctx.currentTime, 0.05);
           }

          const now = Date.now();
          if (n && now - emitRef.current > 150 && socket) {
            socket.emit('note_played', { instrument: 'vocal', note: n });
            emitRef.current = now;
          }
        } else {
          // decay: keep note shown for a moment
          if (lastNote) setTimeout(() => { lastNote = null; setNote(null); }, 400);
          lastNote = null;
          // Mute when silent
          if (oscGainRef.current) {
            oscGainRef.current.gain.cancelScheduledValues(ctx.currentTime);
            oscGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
          }
        }
      };
      loop();

    } catch (err) {
      console.error(err);
      setError('Could not access microphone. Make sure your browser has permission.');
    }
  }

  // ── Stop ──────────────────────────────────────────────────────────────────
  function stopAudio() {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (currentOscRef.current) {
      currentOscRef.current.stop();
      currentOscRef.current.disconnect();
      currentOscRef.current = null;
    }
    if (humanizeOscRef.current) {
      humanizeOscRef.current.osc.stop();
      humanizeOscRef.current.osc.disconnect();
      humanizeOscRef.current.mod.disconnect();
      humanizeOscRef.current = null;
    }
    if (stutterOscRef.current) {
      stutterOscRef.current.osc.stop();
      stutterOscRef.current.osc.disconnect();
      stutterOscRef.current.mod.disconnect();
      stutterOscRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    ctxRef.current?.close();
    ctxRef.current = null;
    gainRef.current = null;
    wetRef.current  = null;
    dryRef.current  = null;
    delayRef.current = null;
    setIsActive(false);
    setNote(null);
    setVu(0);
  }

  // Toggle Recording manually
  function toggleRecording() {
    if (!mediaRecorderRef.current) return;
    if (isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      setRecordedBlob(null);
      recordedChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  }

  // Toggle monitoring live
  function toggleMonitor() {
    const next = !monitoring;
    setMonitoring(next);
    if (gainRef.current && ctxRef.current) {
      if (next) gainRef.current.connect(ctxRef.current.destination);
      else try { gainRef.current.disconnect(ctxRef.current.destination); } catch (_) {}
    }
  }

  useEffect(() => () => stopAudio(), []); // cleanup on unmount

  // ── Slider ────────────────────────────────────────────────────────────────
  const Slider = ({ label, value, set, min = 0, max = 100, step = 1, unit = '%' }) => (
    <div style={{ marginBottom: '1.2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
        <span>{label}</span><span style={{ color: '#e879f9' }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => set(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#c026d3', cursor: 'pointer' }} />
    </div>
  );

  const hubOnline = deviceStatus?.active;

  return (
    <div className="responsive-flex-row-to-col" style={{ flex: 1, gap: '2rem', padding: 'var(--panel-padding-medium)', minHeight: 0 }}>

      {/* LEFT PANEL */}
      <motion.div style={{ width: 'var(--sidebar-width, 300px)', display: 'flex', flexDirection: 'column', gap: '1.2rem', overflowY: 'var(--sidebar-overflow, auto)' }}
        initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>

        {/* Scale & Key */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: '#c026d3', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.2rem' }}>Scale & Key</h3>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Key</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '4px', marginBottom: '1.2rem' }}>
            {KEYS.map(k => (
              <button key={k} onClick={() => setKey(k)} style={{
                padding: '0.45rem 0', fontSize: '0.76rem', borderRadius: '7px', cursor: 'pointer',
                background: key === k ? '#c026d3' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${key === k ? '#c026d3' : 'rgba(255,255,255,0.08)'}`,
                color: 'white', transition: 'all 0.12s'
              }}>{k}</button>
            ))}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Scale</div>
          <select value={scale} onChange={e => setScale(e.target.value)} style={{
            width: '100%', padding: '0.7rem', background: 'rgba(0,0,0,0.5)', color: 'white',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', marginBottom: '0.6rem'
          }}>
            {SCALES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <p style={{ fontSize: '0.76rem', color: '#a855f7', margin: 0 }}>
            {SCALES.find(s => s.id === scale)?.desc}
          </p>
        </div>

        {/* Pitch & Rhythm FX */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: '#c026d3', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.2rem' }}>Autotune Pro</h3>
          
          <Slider label="BPM" value={bpm} set={setBpm} min={60} max={200} step={1} unit=" bpm" />
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1.2rem', marginTop: '-0.8rem' }}>Sets the tempo for the stutter effect.</div>
          <div style={{ marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              <span>Quantize (Stutter)</span><span style={{ color: '#10b981' }}>Hardware Gyro Sync ✨</span>
            </div>
            <div style={{
              width: '100%', padding: '0.5rem 1rem', background: 'rgba(50,205,50,0.1)', color: '#10b981', 
              border: '1px solid rgba(50,205,50,0.3)', borderRadius: '8px', cursor: 'not-allowed', 
              display: 'flex', justifyContent: 'space-between', fontWeight: 'bold'
            }}>
              <span>Controller Tilt:</span> <span>{quantize}</span>
            </div>
          </div>

          <Slider label="Pitch Snap" value={pitchSnap} set={setPitchSnap} />
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1.2rem', marginTop: '-0.8rem' }}>How fast the tuning corrects to the nearest note. Higher = more robotic.</div>
          <Slider label="Humanize" value={smoothing} set={setSmoothing} />
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1.2rem', marginTop: '-0.8rem' }}>Adds a subtle vibrato/detune effect to make the synth sound more natural.</div>
          <Slider label="Wet/Dry Mix" value={wetDry} set={setWetDry} />
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1.2rem', marginTop: '-0.8rem' }}>Balances your raw mic (Dry) with the pure tuned synth (Wet).</div>
        </div>

        {/* Spatial Effects */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: '#c026d3', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.2rem' }}>Spatial & Output</h3>
          <Slider label="Reverb" value={reverb} set={setReverb} />
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1.2rem', marginTop: '-0.8rem' }}>Amount of space/echo added to the voice.</div>
          <Slider label="Grain Size" value={grainSize} set={setGrainSize} min={10} max={1000} step={1} unit="ms" />
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1.2rem', marginTop: '-0.8rem' }}>The length of the delay slices. Shorter creates robotic chorus, longer creates distinct echoes.</div>
          <Slider label="Feedback/Decay" value={feedback} set={setFeedback} />
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1.2rem', marginTop: '-0.8rem' }}>How many times the echo repeats before fading out.</div>
          <Slider label="Master Gain" value={gain} set={setGain} min={0} max={3} step={0.1} unit="x" />
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1.2rem', marginTop: '-0.8rem' }}>Final output volume multiplier.</div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Monitor 🎧</span>
            <button onClick={toggleMonitor} style={{
              background: monitoring ? '#10b981' : 'rgba(255,255,255,0.06)',
              border: 'none', padding: '0.35rem 1rem', borderRadius: '20px',
              color: 'white', cursor: 'pointer', fontSize: '0.8rem'
            }}>{monitoring ? 'ON' : 'OFF'}</button>
          </div>
        </div>
      </motion.div>

      {/* MAIN STAGE */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.8rem' }}>

        {/* Status */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          {[
            { label: hubOnline ? 'Hub Connected' : 'Hub Offline', color: hubOnline ? '#10b981' : '#6b7280' },
            { label: isActive  ? 'Mic Live'      : 'Mic Off',     color: isActive  ? '#c026d3' : '#6b7280' }
          ].map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.4)', padding: '0.4rem 1rem', borderRadius: '50px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* VU Meter */}
        <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '70px' }}>
          {Array.from({ length: 24 }, (_, i) => {
            const threshold = (i + 1) / 24;
            const lit = vu >= threshold;
            const color = i > 20 ? '#ef4444' : i > 17 ? '#f59e0b' : '#c026d3';
            return <div key={i} style={{ width: 9, height: `${16 + i * 2.2}px`, borderRadius: '3px', background: lit ? color : 'rgba(255,255,255,0.05)', boxShadow: lit ? `0 0 5px ${color}55` : 'none', transition: 'background 0.05s' }} />;
          })}
        </div>

        {/* Note Orb */}
        <div style={{ position: 'relative', width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {[1,2,3].map(i => (
            <motion.div key={i} style={{ position: 'absolute', width: '100%', height: '100%', border: `1px solid rgba(192,38,211,${0.25/i})`, borderRadius: '50%' }}
              animate={isActive && vu > 0.04 ? { scale: [1, 1 + i*0.04, 1], opacity: [0.4, 0.7, 0.4] } : {}}
              transition={{ duration: 0.9 + i * 0.1, repeat: Infinity }} />
          ))}
          <div style={{ textAlign: 'center', zIndex: 2 }}>
            <AnimatePresence mode="wait">
              {note ? (
                <motion.div key={note} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.3, opacity: 0 }} transition={{ duration: 0.12 }}>
                  <div style={{ fontSize: '4.5rem', fontWeight: 900, color: '#c026d3', textShadow: '0 0 40px #c026d3aa', lineHeight: 1 }}>{note}</div>
                  <div style={{ fontSize: '0.72rem', color: '#a855f7', marginTop: '0.5rem', letterSpacing: '3px', textTransform: 'uppercase' }}>Detected</div>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div style={{ fontSize: '2.5rem' }}>🎤</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{isActive ? 'Listening…' : 'Press Start'}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444', borderRadius: '10px', padding: '0.7rem 1.5rem', color: '#ef4444', fontSize: '0.83rem', maxWidth: '380px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <motion.button onClick={isActive ? stopAudio : startAudio}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            style={{
              padding: '0.9rem 3rem', fontSize: '1rem', fontWeight: 700, borderRadius: '50px',
              background: isActive ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg,#c026d3,#7c3aed)',
              border: isActive ? '1px solid #ef4444' : 'none',
              color: 'white', cursor: 'pointer',
              boxShadow: isActive ? 'none' : '0 0 30px #c026d355', letterSpacing: '1px'
            }}>
            {isActive ? '⏹ Stop Session' : '🎤 Start Singing'}
          </motion.button>
          
          {isActive && (
            <motion.button onClick={toggleRecording}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{
                padding: '0.9rem 2rem', fontSize: '0.95rem', fontWeight: 700, borderRadius: '50px',
                background: isRecording ? '#ef4444' : 'rgba(255,255,255,0.08)',
                border: isRecording ? 'none' : '1px solid rgba(255,255,255,0.2)',
                color: 'white', cursor: 'pointer',
                boxShadow: isRecording ? '0 0 20px #ef444488' : 'none'
              }}>
              {isRecording ? '⏹ Stop Recording' : '🔴 REC'}
            </motion.button>
          )}
        </div>

        {/* Playback/Download recorded audio */}
        {recordedBlob && !isActive && (
           <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.4)', padding: '1rem 2rem', borderRadius: '15px' }}>
              <p style={{ color: '#10b981', fontSize: '0.85rem', margin: 0 }}>✅ Session Recorded!</p>
              <audio controls src={URL.createObjectURL(recordedBlob)} style={{ height: '35px', borderRadius: '30px', margin: '0.5rem 0' }}/>
              <a href={URL.createObjectURL(recordedBlob)} download="Syntronics-Vocal-Session.webm" style={{ color: '#c026d3', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 'bold' }}>
                ⬇ Download Audio File
              </a>
           </div>
        )}

        <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '360px', lineHeight: 1.7 }}>
          {monitoring
            ? '⚠️ Use headphones to prevent feedback echo.'
            : 'Click Start → allow mic → sing! Turn Monitor ON to hear effects through your speakers.'}
        </p>
      </div>
    </div>
  );
}
