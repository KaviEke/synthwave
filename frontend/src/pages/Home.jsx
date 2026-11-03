import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ParticleCursor from '../components/ParticleCursor';
import ProductShowcase3D from '../components/ProductShowcase3D';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

// Team roster: image + fallback stay here; names/roles come from translations (team.members.<id>).
const TEAM = [
  { id: 'kavindu', img: '/images/kavindu2.jpg', fallback: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400&auto=format&fit=crop', badge: 'founder' },
  { id: 'chamoth', img: '/images/chamoth.jpg', fallback: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=400&auto=format&fit=crop', badge: 'coFounder' },
  { id: 'indumini', img: '/images/idumini.jpg', fallback: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&auto=format&fit=crop', badge: 'coFounder' },
  { id: 'michael', img: '/images/michael.jpg', fallback: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop' },
  { id: 'shrinitha', img: '/images/shrinitha.jpg', fallback: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop' },
];

function Home() {
  const { user } = useContext(AuthContext);
  const { t, lang } = useLanguage();
  const isSi = lang === 'si';

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
            style={{ fontSize: isSi ? 'calc(var(--hero-font-size) * 0.8)' : 'var(--hero-font-size)', fontWeight: 900, lineHeight: isSi ? 1.45 : 1.1, marginBottom: '1.5rem', textTransform: 'uppercase', color: 'var(--text-main)' }}
          >
            {t('hero.titleLine1')} <br/> <span style={{ color: 'var(--primary)' }}>{t('hero.titleLine2')}</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '480px', lineHeight: isSi ? 1.8 : 1.6 }}
          >
            {t('hero.subtitle')}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{ display: 'flex', flexWrap: isSi ? 'wrap' : undefined, gap: isSi ? '1rem' : '1.5rem', marginBottom: '4rem' }}
          >
            <Link to="/live" style={{ textDecoration: 'none' }}>
              <button className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', textTransform: 'uppercase' }}>
                {t('hero.liveMusic')}
              </button>
            </Link>
            {!user && (
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <button className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', textTransform: 'uppercase' }}>
                  {t('hero.signIn')}
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
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>{t('hero.supportedInstruments')}</h3>
            <div style={{ display: 'flex', flexWrap: isSi ? 'wrap' : undefined, gap: isSi ? '1rem' : '1.5rem' }}>
              {t('hero.instruments').map((inst, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -5, scale: 1.05 }} 
                  className="glass-panel"
                  style={{ [isSi ? 'minWidth' : 'width']: '120px', padding: '15px 10px', textAlign: 'center', cursor: 'pointer', background: 'transparent', border: '1px solid var(--primary)' }}
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
          <h2 style={{ fontSize: 'var(--h2-font-size)', fontWeight: 800, textAlign: 'center', marginBottom: '4rem', color: 'var(--primary)', textTransform: 'uppercase' }}>{t('team.title')}</h2>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', justifyContent: 'center' }}>
            
            {TEAM.map((member) => {
              const name = t(`team.members.${member.id}.name`);
              const [roleLine1, roleLine2] = t(`team.members.${member.id}.role`);
              return (
                <div key={member.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '300px' }}>
                  <motion.div whileHover={{ scale: 1.05 }} style={{ width: '180px', height: '180px', borderRadius: '50%', overflow: 'hidden', marginBottom: '1.5rem', border: '4px solid white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                    <img src={member.img} onError={(e)=>{e.target.src=member.fallback}} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </motion.div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center', lineHeight: isSi ? 1.6 : undefined }}>{name}</h3>
                  {member.badge && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white', background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.4)', borderRadius: '999px', padding: isSi ? '0.15rem 0.8rem' : '0.2rem 0.8rem', marginBottom: '0.75rem', lineHeight: isSi ? 1.6 : 1.4, letterSpacing: isSi ? 'normal' : '1px', textTransform: 'uppercase' }}>
                      {t(`team.${member.badge}`)}
                    </span>
                  )}
                  <p style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: isSi ? 'normal' : '1px', fontSize: '0.8rem', textAlign: 'center', lineHeight: isSi ? 1.7 : undefined }}>{roleLine1}<br/>{roleLine2}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;
