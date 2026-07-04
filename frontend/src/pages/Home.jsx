import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ParticleCursor from '../components/ParticleCursor';
import { AuthContext } from '../context/AuthContext';

function Home() {
  const { user } = useContext(AuthContext);

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: 'transparent',
      position: 'relative',
      color: 'var(--text-main)'
    }}>
      <ParticleCursor />
      
      {/* Hero Section */}
      <section style={{ position: 'relative', zIndex: 1, padding: '4rem 6rem', minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '600px' }}>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', textTransform: 'uppercase', color: 'var(--text-main)' }}
          >
            Live Your Day <br/> <span style={{ color: 'var(--primary)' }}>With Music</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '480px', lineHeight: 1.6 }}
          >
            Make your day more lively with a variety of premium music instruments. Connect your IoT devices and experience interactive sound synthesis.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{ display: 'flex', gap: '1.5rem', marginBottom: '4rem' }}
          >
            <Link to="/live" style={{ textDecoration: 'none' }}>
              <button className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', textTransform: 'uppercase' }}>
                Live Music
              </button>
            </Link>
            {!user && (
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <button className="btn-secondary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', textTransform: 'uppercase' }}>
                  Sign In
                </button>
              </Link>
            )}
          </motion.div>
          
          {/* Instrument Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Supported Instruments</h3>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              {['Violin', 'Piano', 'Drum Kit'].map((inst, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -5, scale: 1.05 }} 
                  className="glass-panel"
                  style={{ width: '120px', padding: '15px 10px', textAlign: 'center', cursor: 'pointer', background: 'white' }}
                >
                  <p style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{inst}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final Products Section */}
      <section style={{ padding: '6rem', backgroundColor: 'rgba(255,255,255,0.4)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, textAlign: 'center', marginBottom: '3rem', color: 'var(--text-main)' }}>Our Products</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
            
            {/* Product 1 */}
            <motion.div whileHover={{ y: -10 }} className="glass-panel" style={{ overflow: 'hidden', background: 'white' }}>
              <img src="https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=600&auto=format&fit=crop" alt="Piano Controller" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Smart Piano Controller</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>A highly responsive IoT-enabled piano interface offering tactile feedback and real-time midi synthesis.</p>
              </div>
            </motion.div>

            {/* Product 2 */}
            <motion.div whileHover={{ y: -10 }} className="glass-panel" style={{ overflow: 'hidden', background: 'white' }}>
              <img src="https://images.unsplash.com/photo-1460036521480-c1b783b9c623?q=80&w=600&auto=format&fit=crop" alt="Violin Bow" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Gyro Bow Sensor</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>Attach this gyro sensor to any traditional violin bow to track meend, vibrato, and velocity flawlessly.</p>
              </div>
            </motion.div>

            {/* Product 3 */}
            <motion.div whileHover={{ y: -10 }} className="glass-panel" style={{ overflow: 'hidden', background: 'white' }}>
              <img src="https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?q=80&w=600&auto=format&fit=crop" alt="Drum Pads" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>USB Kick & Pads</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>High-speed, zero-latency percussion pads with dynamic velocity sensing for the perfect beat.</p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Developer Team Section */}
      <section style={{ padding: '6rem', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, textAlign: 'center', marginBottom: '4rem', color: 'var(--text-main)' }}>Meet The Developers</h2>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4rem', justifyContent: 'center' }}>
            
            {/* Developer 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '350px' }}>
              <motion.div whileHover={{ scale: 1.05 }} style={{ width: '200px', height: '200px', borderRadius: '50%', overflow: 'hidden', marginBottom: '1.5rem', border: '4px solid white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400&auto=format&fit=crop" alt="Kavindu Ekanayaka" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </motion.div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Kavindu Ekanayaka</h3>
              <p style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Lead Hardware Engineer</p>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Specializes in IoT integration, embedded systems, and translating physical gestures into pristine digital midi signals.
              </p>
            </div>

            {/* Developer 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '350px' }}>
              <motion.div whileHover={{ scale: 1.05 }} style={{ width: '200px', height: '200px', borderRadius: '50%', overflow: 'hidden', marginBottom: '1.5rem', border: '4px solid white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=400&auto=format&fit=crop" alt="Chamoth Liyanaarachchi" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </motion.div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Chamoth Liyanaarachchi</h3>
              <p style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Lead Software Developer</p>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Expert in React, Node.js, and real-time socket communication. Focuses on delivering smooth, low-latency web experiences.
              </p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;
