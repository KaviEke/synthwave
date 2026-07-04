import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { songs } from '../data/songs';

const instruments = [
  { key: 'piano', label: 'Piano', icon: '🎹', accent: '#0ea5e9', route: 'piano' },
  { key: 'violin', label: 'Violin', icon: '🎻', accent: '#a855f7', route: 'violin' },
  { key: 'drum', label: 'Drums', icon: '🥁', accent: '#ec4899', route: 'drum' },
];

const TutorialSelect = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filteredSongs = songs.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0f1c',
      padding: '2rem 1.5rem 4rem',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          textAlign: 'center',
          fontSize: '2.4rem',
          fontWeight: 800,
          color: '#f3f4f6',
          marginBottom: '0.5rem',
          letterSpacing: '1px',
        }}
      >
        Interactive Tutorials
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        style={{
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '1rem',
          marginBottom: '2rem',
        }}
      >
        Choose an instrument and a song to start learning
      </motion.p>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{
          maxWidth: 520,
          margin: '0 auto 2.5rem',
        }}
      >
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '1.1rem',
            color: '#9ca3af',
            pointerEvents: 'none',
          }}>🔍</span>
          <input
            type="text"
            placeholder="Search songs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.85rem 1rem 0.85rem 2.8rem',
              borderRadius: 12,
              border: '1px solid rgba(14, 165, 233, 0.3)',
              background: 'rgba(17, 24, 39, 0.7)',
              backdropFilter: 'blur(10px)',
              color: '#f3f4f6',
              fontSize: '1rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </motion.div>

      {/* Instrument Sections */}
      <div style={{
        display: 'flex',
        gap: '1.5rem',
        maxWidth: 1200,
        margin: '0 auto',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {instruments.map((inst, idx) => {
          const availableSongs = filteredSongs.filter(
            (s) => s.parts && s.parts[inst.key]
          );

          return (
            <motion.div
              key={inst.key}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.15, duration: 0.5 }}
              style={{
                flex: '1 1 320px',
                maxWidth: 380,
                minWidth: 280,
              }}
            >
              {/* Section Card */}
              <div style={{
                background: 'rgba(17, 24, 39, 0.7)',
                border: `1px solid ${inst.accent}44`,
                borderRadius: 16,
                backdropFilter: 'blur(10px)',
                padding: '1.5rem',
                minHeight: 320,
              }}>
                {/* Section Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1.2rem',
                  paddingBottom: '1rem',
                  borderBottom: `1px solid ${inst.accent}33`,
                }}>
                  <span style={{
                    fontSize: '2rem',
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${inst.accent}18`,
                    borderRadius: 12,
                  }}>{inst.icon}</span>
                  <div>
                    <h2 style={{
                      fontSize: '1.3rem',
                      fontWeight: 700,
                      color: inst.accent,
                      margin: 0,
                    }}>{inst.label}</h2>
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#9ca3af',
                      margin: 0,
                    }}>{availableSongs.length} song{availableSongs.length !== 1 ? 's' : ''} available</p>
                  </div>
                </div>

                {/* Song List */}
                {availableSongs.length === 0 ? (
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', textAlign: 'center', marginTop: '2rem' }}>
                    No songs found
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {availableSongs.map((song) => (
                      <motion.div
                        key={song.id}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(`/tutorial/${inst.route}/${song.id}`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem',
                          borderRadius: 10,
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid transparent`,
                          cursor: 'pointer',
                          transition: 'border-color 0.2s, background 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = `${inst.accent}55`;
                          e.currentTarget.style.background = `${inst.accent}0d`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'transparent';
                          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        }}
                      >
                        <img
                          src={song.cover}
                          alt={song.title}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 8,
                            objectFit: 'cover',
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            color: '#f3f4f6',
                            fontSize: '0.92rem',
                            fontWeight: 600,
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>{song.title}</p>
                          <p style={{
                            color: '#9ca3af',
                            fontSize: '0.78rem',
                            margin: 0,
                          }}>{song.artist} · {song.parts[inst.key].notes.length} notes</p>
                        </div>
                        <span style={{
                          color: inst.accent,
                          fontSize: '1.1rem',
                        }}>▶</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TutorialSelect;
