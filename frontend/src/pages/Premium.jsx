import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ParallaxBackground from '../components/ParallaxBackground';

function Premium() {
  return (
    <div style={{ flex: 1, padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
      <ParallaxBackground imageSrc="/images/pop2.png" opacity={0.25} blendMode="screen" />
      
      <motion.div 
        style={{ width: '100%', maxWidth: '1000px' }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', textAlign: 'center', background: 'linear-gradient(45deg, #f59e0b, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '900' }}>
          Unlock Premium Instruments
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '4rem' }}>
          Expand your interactive setup.
        </p>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          
          {/* Free Tier */}
          <motion.div style={{ flex: '1 1 300px', maxWidth: '400px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '3rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }} whileHover={{ y: -10 }}>
            <h2 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '0.5rem' }}>Free Mode</h2>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#10b981', marginBottom: '2rem' }}>$0</div>
            <ul style={{ listStyle: 'none', padding: 0, color: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
              <li>✓ Basic hardware synchronization</li>
              <li>✓ Session Dashboard Analytics</li>
              <li style={{ color: 'white', fontWeight: 'bold' }}>✓ 1 Instrument Included: Violin</li>
              <li style={{ opacity: 0.3 }}>✕ Piano Integration</li>
              <li style={{ opacity: 0.3 }}>✕ Drum Kit Expansion</li>
            </ul>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'block', background: 'rgba(255,255,255,0.1)', color: 'white', padding: '1rem', borderRadius: '12px', fontWeight: 'bold', transition: 'background 0.3s' }}>
                Current Plan
              </div>
            </Link>
          </motion.div>

          {/* Premium Tier */}
          <motion.div style={{ flex: '1 1 300px', maxWidth: '400px', background: 'linear-gradient(180deg, rgba(236,72,153,0.15) 0%, rgba(139,92,246,0.15) 100%)', border: '1px solid #ec4899', borderRadius: '24px', padding: '3rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(236,72,153,0.2)' }} whileHover={{ y: -10 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: '#ec4899', color: 'white', fontSize: '0.8rem', fontWeight: 'bold', padding: '0.5rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Most Popular</div>
            <h2 style={{ fontSize: '1.5rem', color: 'white', marginTop: '1rem', marginBottom: '0.5rem' }}>Full Kit Access</h2>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#f472b6', marginBottom: '2rem' }}>$49<span style={{fontSize: '1rem', color: 'rgba(255,255,255,0.5)'}}>.99</span></div>
            <ul style={{ listStyle: 'none', padding: 0, color: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
              <li>✓ Advanced hardware low-latency</li>
              <li>✓ Pro Session Analytics</li>
              <li style={{ color: 'white', fontWeight: 'bold' }}>✓ Violin</li>
              <li style={{ color: 'white', fontWeight: 'bold' }}>✓ Grand Piano Extension</li>
              <li style={{ color: 'white', fontWeight: 'bold' }}>✓ Drum Kit Hero Extension</li>
            </ul>
            <div style={{ display: 'block', background: 'linear-gradient(90deg, #ec4899, #8b5cf6)', color: 'white', padding: '1rem', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 20px rgba(236,72,153,0.4)', transition: 'transform 0.3s' }}>
              Purchase Expansion
            </div>
          </motion.div>

        </div>

      </motion.div>
    </div>
  );
}

export default Premium;
