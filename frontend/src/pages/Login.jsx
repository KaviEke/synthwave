import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ParticleCursor from '../components/ParticleCursor';

function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim()) {
      setError('Please enter your username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    
    const res = await login(username.trim(), password);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
      <ParticleCursor />
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ display: 'flex', flexWrap: 'wrap', maxWidth: '900px', width: '100%', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(14, 165, 233, 0.2)', border: '2px solid var(--primary)', backgroundColor: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', zIndex: 1 }}
      >
        {/* Left Branding Pane */}
        <div style={{ flex: '1 1 350px', background: 'transparent', padding: '4rem 3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '2px' }}>SYNTRONICS</h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6 }}>Access your digital instrument control center and dive back into the music.</p>
        </div>

        {/* Right Form Pane */}
        <div style={{ flex: '1 1 350px', padding: '4rem 3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: 'white', fontWeight: 600 }}>Sign In</h2>
          {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>{error}</div>}
          <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column'}}>
            <input 
              type="text" 
              placeholder="Username" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <button type="submit" className="btn-secondary" style={{marginTop: '1.5rem', padding: '14px', border: '1px solid var(--primary)', color: 'var(--primary)'}}>
              Enter Dashboard
            </button>
          </form>
          <p style={{textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)'}}>
            New artist? <Link to="/register" style={{color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold'}}>Create Account</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
