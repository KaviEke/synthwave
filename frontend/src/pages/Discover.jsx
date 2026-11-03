import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ParticleCursor from '../components/ParticleCursor';
import { useLanguage } from '../context/LanguageContext';

function Discover() {
  const { t, lang } = useLanguage();
  return (
    <div style={{ flex: 1, padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
      <ParticleCursor />
      
      <motion.div 
        style={{ width: '100%', maxWidth: '900px', padding: '3rem 4rem', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', zIndex: 1, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 style={{ fontSize: '3rem', marginBottom: '2rem', color: 'var(--primary)', textAlign: 'center', fontWeight: '900', lineHeight: lang === 'si' ? 1.5 : undefined }}>
          {t('discover.title')}
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: 'rgba(255,255,255,0.85)', fontSize: '1.1rem', lineHeight: lang === 'si' ? 1.9 : 1.8 }}>
          {t('discover.paragraphs').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default Discover;
