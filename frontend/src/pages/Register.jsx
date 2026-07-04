import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ParallaxBackground from '../components/ParallaxBackground';

function Register() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    
    const res = await register(username.trim(), email.trim(), password);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
      <ParallaxBackground imageSrc="/images/pop2.png" opacity={0.2} blendMode="screen" />
      
      {/* Background Glowing Orbs */}
      <div style={{ position: 'absolute', top: '10%', left: '25%', width: '400px', height: '400px', background: '#ec4899', borderRadius: '50%', filter: 'blur(150px)', opacity: 0.2, zIndex: 0, pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '25%', width: '400px', height: '400px', background: '#10b981', borderRadius: '50%', filter: 'blur(150px)', opacity: 0.15, zIndex: 0, pointerEvents: 'none' }}></div>

      <motion.div 
        style={{ padding: '3rem 2.5rem', width: '100%', maxWidth: '450px', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', zIndex: 1, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <h2 style={{ fontSize: '2.2rem', marginBottom: '2rem', color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Begin Journey</h2>
        {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column'}}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            required 
            minLength="3"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px' }}
          />
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px' }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            minLength="6"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px' }}
          />
          <button type="submit" className="btn-primary" style={{marginTop: '1.5rem', background: '#8b5cf6', padding: '16px', borderRadius: '12px', border: 'none', fontSize: '1.1rem'}}>
            Register Hardware
          </button>
        </form>
        <p style={{textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)'}}>
          Already geared up? <Link to="/login" style={{color: '#c084fc', textDecoration: 'none', fontWeight: 'bold'}}>Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Register;
