import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ParticleCursor from '../components/ParticleCursor';
import ProductShowcase3D from '../components/ProductShowcase3D';
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
      <section style={{ position: 'relative', zIndex: 1, padding: 'var(--section-padding)', minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
        <div className="hero-content" style={{ maxWidth: '600px' }}>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ fontSize: 'var(--hero-font-size)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', textTransform: 'uppercase', color: 'var(--text-main)' }}
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
                <button className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', textTransform: 'uppercase' }}>
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
                  style={{ width: '120px', padding: '15px 10px', textAlign: 'center', cursor: 'pointer', background: 'transparent', border: '1px solid var(--primary)' }}
                >
                  <p style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{inst}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3D Product Showcase Section */}
      <ProductShowcase3D />

      {/* Developer Team Section */}
      <section style={{ padding: 'var(--section-padding-large)', position: 'relative', zIndex: 1, marginTop: '-60px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'var(--h2-font-size)', fontWeight: 800, textAlign: 'center', marginBottom: '4rem', color: 'var(--primary)', textTransform: 'uppercase' }}>Behind The Build</h2>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', justifyContent: 'center' }}>
            
            {/* Developer 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '300px' }}>
              <motion.div whileHover={{ scale: 1.05 }} style={{ width: '180px', height: '180px', borderRadius: '50%', overflow: 'hidden', marginBottom: '1.5rem', border: '4px solid white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                <img src="/images/kavindu2.jpg" onError={(e)=>{e.target.src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400&auto=format&fit=crop"}} alt="Kavindu Ekanayaka" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </motion.div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>Kavindu Ekanayaka</h3>
              <p style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem', textAlign: 'center' }}>Lead Software Architect<br/>Web Developer & AI Engineer</p>
            </div>

            {/* Developer 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '300px' }}>
              <motion.div whileHover={{ scale: 1.05 }} style={{ width: '180px', height: '180px', borderRadius: '50%', overflow: 'hidden', marginBottom: '1.5rem', border: '4px solid white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                <img src="/images/chamoth.jpg" onError={(e)=>{e.target.src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=400&auto=format&fit=crop"}} alt="Chamoth Liyanaarachchi" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </motion.div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>Chamoth Liyanaarachchi</h3>
              <p style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem', textAlign: 'center' }}>Lead Hardware Engineer<br/>PCB Design & AI Engineer</p>
            </div>

            {/* Developer 3 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '300px' }}>
              <motion.div whileHover={{ scale: 1.05 }} style={{ width: '180px', height: '180px', borderRadius: '50%', overflow: 'hidden', marginBottom: '1.5rem', border: '4px solid white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                <img src="/images/idumini.jpg" onError={(e)=>{e.target.src="https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&auto=format&fit=crop"}} alt="Idumini Wathsala" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </motion.div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>Idumini Wathsala</h3>
              <p style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem', textAlign: 'center' }}>Associate Software, Hardware<br/>& AI Engineer</p>
            </div>

            {/* Developer 4 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '300px' }}>
              <motion.div whileHover={{ scale: 1.05 }} style={{ width: '180px', height: '180px', borderRadius: '50%', overflow: 'hidden', marginBottom: '1.5rem', border: '4px solid white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                <img src="/images/michael.jpg" onError={(e)=>{e.target.src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop"}} alt="Michael Sharon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </motion.div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>Michael Sharon</h3>
              <p style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem', textAlign: 'center' }}>Associate Software<br/>& Firmware Engineer</p>
            </div>

            {/* Developer 5 */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '300px' }}>
              <motion.div whileHover={{ scale: 1.05 }} style={{ width: '180px', height: '180px', borderRadius: '50%', overflow: 'hidden', marginBottom: '1.5rem', border: '4px solid white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                <img src="/images/shrinitha.jpg" onError={(e)=>{e.target.src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop"}} alt="Shrinitha" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </motion.div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>Shrinitha</h3>
              <p style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem', textAlign: 'center' }}>Associate Software<br/>& Firmware Engineer</p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;
