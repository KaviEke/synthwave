import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ScatteredNotes from '../components/ScatteredNotes';

function SupportUs() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate successful backend API submission
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
    setEmail('');
    setMessage('');
  };

  return (
    <div style={{ flex: 1, padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
      <ScatteredNotes />
      
      <motion.div 
        style={{ width: '100%', maxWidth: '600px', padding: '3rem', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', zIndex: 1, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--primary)', textAlign: 'center', fontWeight: 'bold' }}>
          Support Us
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          We would love to hear your feedback on the SYNTRONICS hardware experience! Send us a message below.
        </p>

        {submitted && (
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            Thank you! Your feedback has been successfully submitted to our team.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)' }}>Your Email</label>
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', width: '100%', color: 'white', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)' }}>Feedback Message</label>
            <textarea 
              placeholder="What do you think about the project?" 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              required 
              rows="5"
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', width: '100%', color: 'white', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
          <button type="submit" className="btn-primary" style={{marginTop: '1rem', padding: '16px', borderRadius: '12px', border: 'none', fontSize: '1.1rem', fontWeight: 'bold'}}>
            Send Feedback
          </button>
        </form>

      </motion.div>
    </div>
  );
}

export default SupportUs;
