import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ParticleCursor from '../components/ParticleCursor';
import { useLanguage } from '../context/LanguageContext';

function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // error: { key } for local validation (re-translates on language switch) or { text } from the API
  const [error, setError] = useState(null);
  const { t } = useLanguage();

  React.useEffect(() => {
    document.title = t('login.pageTitle');
    return () => { document.title = t('common.siteTitle'); };
  }, [t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!username.trim()) {
      setError({ key: 'login.errors.usernameRequired' });
      return;
    }
    if (!password) {
      setError({ key: 'login.errors.passwordRequired' });
      return;
    }
    
    const res = await login(username.trim(), password);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError({ text: res.message });
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
          <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6 }}>{t('login.tagline')}</p>
        </div>

        {/* Right Form Pane */}
        <div style={{ flex: '1 1 350px', padding: '4rem 3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: 'white', fontWeight: 600 }}>{t('login.heading')}</h2>
          {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>{error.key ? t(error.key) : error.text}</div>}
          <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column'}}>
            <input 
              type="text" 
              placeholder={t('login.username')} 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <input 
              type="password" 
              placeholder={t('login.password')} 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <button type="submit" className="btn-secondary" style={{marginTop: '1.5rem', padding: '14px', border: '1px solid var(--primary)', color: 'var(--primary)'}}>
              {t('login.submit')}
            </button>
          </form>
          <p style={{textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)'}}>
            {t('login.newArtist')} <Link to="/register" style={{color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold'}}>{t('login.createAccount')}</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
