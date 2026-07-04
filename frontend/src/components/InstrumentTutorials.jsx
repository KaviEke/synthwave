import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SocketContext } from '../context/SocketContext';

const commonContainerStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  padding: '2rem',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  marginTop: '1.5rem',
  minHeight: '250px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  position: 'relative',
  overflow: 'hidden'
};

const titleStyle = {
  fontSize: '1.5rem',
  marginBottom: '1rem',
  color: 'var(--text-main)'
};

const instructionStyle = {
  fontSize: '1.2rem',
  color: 'var(--text-muted)',
  marginBottom: '2rem',
  textAlign: 'center',
  maxWidth: '80%'
};

export const TutorialPiano = () => {
  const { currentNote } = useContext(SocketContext);
  const [step, setStep] = useState(0);
  const [successStatus, setSuccessStatus] = useState(false);

  // Focus on basic notes as prompted
  const pianoSteps = [
    { target: 'C', instructions: 'Press the first button on your controller to play a C note.' },
    { target: 'D', instructions: 'Great! Now press the second button to play a D note.' },
    { target: 'E', instructions: 'Awesome! Press the third button for an E note.' },
    { target: 'F', instructions: 'Almost there! Press the fourth button for an F note.' },
    { target: 'DONE', instructions: 'Tutorial Complete! You are ready for the Piano Game.' }
  ];

  useEffect(() => {
    if (step >= pianoSteps.length - 1) return;
    
    // Check if the current note matches the target (ignoring octave for tutorial simplicity)
    if (currentNote && currentNote.instrument === 'piano' && currentNote.note.includes(pianoSteps[step].target)) {
      setSuccessStatus(true);
      setTimeout(() => {
        setSuccessStatus(false);
        setStep(s => s + 1);
      }, 1500);
    }
  }, [currentNote, step]);

  return (
    <div style={commonContainerStyle}>
      <h3 style={titleStyle}>Piano Tutorial</h3>
      <p style={instructionStyle}>{pianoSteps[step].instructions}</p>
      
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <AnimatePresence>
          {successStatus && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              style={{ color: '#10b981', fontSize: '2rem', fontWeight: 'bold' }}
            >
              Correct! 🎵
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {step === pianoSteps.length - 1 && (
        <button className="btn-primary" onClick={() => setStep(0)} style={{ marginTop: '1rem' }}>Restart Tutorial</button>
      )}
    </div>
  );
};

export const TutorialViolin = () => {
  const { currentNote } = useContext(SocketContext);
  const [step, setStep] = useState(0);
  const [successStatus, setSuccessStatus] = useState(false);

  // The violin uses the Hindustani mapping
  // We'll guide them through: Mandra Pa (String 1), Sa (String 2), Pa (String 3), Tara Sa (String 4)
  const violinSteps = [
    { target: 'G', instructions: 'Select String 1 (Btn 1) and continuous drag the Bow module.' },
    { target: 'C', instructions: 'Good! Now select String 2 (Btn 2) and drag the Bow.' },
    { target: 'D', instructions: 'Nice! Now hold Finger 1 (Dev 2, Btn 1) while bowing String 2.' },
    { target: 'G', instructions: 'Excellent! Switch back to String 3 (Btn 3) Open Bow.' },
    { target: 'DONE', instructions: 'Tutorial Complete! You have mastered the Violin mapping.' }
  ];

  useEffect(() => {
    if (step >= violinSteps.length - 1) return;
    
    if (currentNote && currentNote.instrument === 'violin' && currentNote.note.includes(violinSteps[step].target)) {
      setSuccessStatus(true);
      setTimeout(() => {
        setSuccessStatus(false);
        setStep(s => s + 1);
      }, 1500);
    }
  }, [currentNote, step]);

  return (
    <div style={commonContainerStyle}>
      <h3 style={titleStyle}>Violin Tutorial</h3>
      <p style={instructionStyle}>{violinSteps[step].instructions}</p>
      
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <AnimatePresence>
          {successStatus && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              style={{ color: '#10b981', fontSize: '2rem', fontWeight: 'bold' }}
            >
              Perfect Bowing! 🎻
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {step === violinSteps.length - 1 && (
        <button className="btn-primary" onClick={() => setStep(0)} style={{ marginTop: '1rem' }}>Restart Tutorial</button>
      )}
    </div>
  );
};

export const TutorialDrum = () => {
  const { currentNote } = useContext(SocketContext);
  const [step, setStep] = useState(0);
  const [successStatus, setSuccessStatus] = useState(false);

  const drumSteps = [
    { target: 'TOM', instructions: 'Flick the controller downwards heavily to play a TOM.' },
    { target: 'CYMBAL', instructions: 'Great! Flick the controller upwards sharply to play a CYMBAL.' },
    { target: 'TOM', instructions: 'Nice rhythm! Play one more TOM (downward flick).' },
    { target: 'DONE', instructions: 'Tutorial Complete! You are ready for the Drum section.' }
  ];

  useEffect(() => {
    if (step >= drumSteps.length - 1) return;
    
    if (currentNote && currentNote.instrument === 'drum' && currentNote.note === drumSteps[step].target) {
      setSuccessStatus(true);
      setTimeout(() => {
        setSuccessStatus(false);
        setStep(s => s + 1);
      }, 1500);
    }
  }, [currentNote, step]);

  return (
    <div style={commonContainerStyle}>
      <h3 style={titleStyle}>Drum Tutorial</h3>
      <p style={instructionStyle}>{drumSteps[step].instructions}</p>
      
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <AnimatePresence>
          {successStatus && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              style={{ color: '#3b82f6', fontSize: '2rem', fontWeight: 'bold' }}
            >
              SMASH! 🥁
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {step === drumSteps.length - 1 && (
        <button className="btn-primary" onClick={() => setStep(0)} style={{ marginTop: '1rem' }}>Restart Tutorial</button>
      )}
    </div>
  );
};

export const TutorialFlute = () => {
  const { currentNote } = useContext(SocketContext);
  const [step, setStep] = useState(0);
  const [successStatus, setSuccessStatus] = useState(false);

  const fluteSteps = [
    { target: 'ANY', instructions: 'The Flute mode uses pitch detection. Play a clean prolonged note into the microphone!' },
    { target: 'DONE', instructions: 'Tutorial Complete! You are ready to play.' }
  ];

  useEffect(() => {
    if (step >= fluteSteps.length - 1) return;
    
    // Auto complete for demo
    const timer = setTimeout(() => {
      setSuccessStatus(true);
      setTimeout(() => {
        setSuccessStatus(false);
        setStep(s => s + 1);
      }, 1500);
    }, 4000);

    return () => clearTimeout(timer);
  }, [step]);

  return (
    <div style={commonContainerStyle}>
      <h3 style={titleStyle}>Flute Tutorial</h3>
      <p style={instructionStyle}>{fluteSteps[step].instructions}</p>
      
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <AnimatePresence>
          {successStatus && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              style={{ color: '#0ea5e9', fontSize: '2rem', fontWeight: 'bold' }}
            >
              Pitch Detected! 🪈
            </motion.div>
          )}
        </AnimatePresence>
        
        {step < fluteSteps.length - 1 && !successStatus && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#0ea5e9', opacity: 0.5 }}
          />
        )}
      </div>

      {step === fluteSteps.length - 1 && (
        <button className="btn-primary" onClick={() => setStep(0)} style={{ marginTop: '1rem' }}>Restart Tutorial</button>
      )}
    </div>
  );
};

export const TutorialVocal = () => {
  const { currentNote } = useContext(SocketContext);
  const [step, setStep] = useState(0);
  const [successStatus, setSuccessStatus] = useState(false);

  const vocalSteps = [
    { target: 'ANY', instructions: 'The Vocal mode uses your microphone. Sing a steady note!' },
    { target: 'DONE', instructions: 'Tutorial Complete! You are ready to Autotune your voice.' }
  ];

  useEffect(() => {
    if (step >= vocalSteps.length - 1) return;
    
    // Auto complete for demo
    const timer = setTimeout(() => {
      setSuccessStatus(true);
      setTimeout(() => {
        setSuccessStatus(false);
        setStep(s => s + 1);
      }, 1500);
    }, 4000);

    return () => clearTimeout(timer);
  }, [step]);

  return (
    <div style={commonContainerStyle}>
      <h3 style={titleStyle}>Vocal Tutorial</h3>
      <p style={instructionStyle}>{vocalSteps[step].instructions}</p>
      
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <AnimatePresence>
          {successStatus && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              style={{ color: '#c026d3', fontSize: '2rem', fontWeight: 'bold' }}
            >
              Pitch Detected! 🎤
            </motion.div>
          )}
        </AnimatePresence>
        
        {step < vocalSteps.length - 1 && !successStatus && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#c026d3', opacity: 0.5 }}
          />
        )}
      </div>

      {step === vocalSteps.length - 1 && (
        <button className="btn-primary" onClick={() => setStep(0)} style={{ marginTop: '1rem' }}>Restart Tutorial</button>
      )}
    </div>
  );
};
