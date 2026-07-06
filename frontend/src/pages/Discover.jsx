import { motion } from 'framer-motion';
import ScatteredNotes from '../components/ScatteredNotes';

function Discover() {
  return (
    <div style={{ flex: 1, padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
      <ScatteredNotes />
      
      <motion.div 
        style={{ width: '100%', maxWidth: '900px', padding: '3rem 4rem', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', zIndex: 1, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 style={{ fontSize: '3rem', marginBottom: '2rem', color: 'var(--primary)', textAlign: 'center', fontWeight: '900' }}>
          Discover Our Project
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'rgba(255,255,255,0.85)', fontSize: '1.1rem', lineHeight: 1.8 }}>
          <p>
            Welcome to our hardware project, an interactive motion-based music system designed to turn physical movement into sound. This project combines smart sensors, embedded systems, and software integration to create a unique musical experience where users can control instruments through gestures and motion. By blending hardware and creativity, we aim to show how modern technology can make music more immersive, expressive, and engaging.
          </p>
          <p>
            Our system focuses on transforming natural hand movements into real-time musical output. Using motion sensors and a connected host system, the project can detect actions such as hits, drags, and directional movements, then convert them into different instrument sounds. This allows users to experience a new way of playing music beyond traditional instruments.
          </p>
          <p>
            This project was developed not only as a technical solution, but also as an exploration of innovation in interactive entertainment and digital music. It highlights the power of combining electronics, programming, and design to build something practical, creative, and enjoyable.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Discover;
