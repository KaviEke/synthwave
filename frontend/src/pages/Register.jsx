import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ParticleCursor from '../components/ParticleCursor';
import { useLanguage } from '../context/LanguageContext';

function Register() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // error: { key } for local validation (re-translates on language switch) or { text } from the API
  const [error, setError] = useState(null);
  const { t } = useLanguage();

  React.useEffect(() => {
    document.title = t('register.pageTitle');
    return () => { document.title = t('common.siteTitle'); };
  }, [t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!username.trim() || username.trim().length < 3) {
      setError({ key: 'register.errors.usernameMin' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError({ key: 'register.errors.emailInvalid' });
      return;
    }
    if (!password || password.length < 6) {
      setError({ key: 'register.errors.passwordMin' });
      return;
    }
    
    const res = await register(username.trim(), email.trim(), password);
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
        style={{ padding: '3rem 2.5rem', width: '100%', maxWidth: '450px', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(24px)', border: '2px solid var(--primary)', borderRadius: '24px', zIndex: 1, boxShadow: '0 25px 50px rgba(14, 165, 233, 0.15)' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <h2 style={{ fontSize: '2.2rem', marginBottom: '2rem', color: 'white', textAlign: 'center', fontWeight: 'bold' }}>{t('register.heading')}</h2>
        {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>{error.key ? t(error.key) : error.text}</div>}
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column'}}>
          <input 
            type="text" 
            placeholder={t('register.username')} 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            required 
            minLength="3"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px' }}
          />
          <input 
            type="email" 
            placeholder={t('register.email')} 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px' }}
          />
          <input 
            type="password" 
            placeholder={t('register.password')} 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            minLength="6"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px' }}
          />
          <button type="submit" className="btn-primary" style={{marginTop: '1.5rem', background: 'var(--primary)', padding: '16px', borderRadius: '12px', border: 'none', fontSize: '1.1rem'}}>
            {t('register.submit')}
          </button>
        </form>
        <p style={{textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)'}}>
          {t('register.alreadyGeared')} <Link to="/login" style={{color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold'}}>{t('register.signIn')}</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Register;
