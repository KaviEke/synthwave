import React from 'react';

const LoopTrack = ({ track, onCommand }) => {
  if (!track) return null;

  const {
    trackId,
    instrument,
    armed,
    recording,
    muted,
    solo,
    volume,
    eventCount,
    hasRecording
  } = track;

  const handleVolumeChange = (e) => {
    onCommand('loop_set_track_volume', { trackId, volume: parseInt(e.target.value) });
  };

  return (
    <div className={`loop-track glass-panel ${armed ? 'armed' : ''} ${recording ? 'recording' : ''}`}>
      <div className="track-info">
        <div className="track-icon">
          {instrument === 'drum' && '🥁'}
          {instrument === 'piano' && '🎹'}
          {instrument === 'violin' && '🎻'}
        </div>
        <div className="track-name-group">
          <div className="track-name">{instrument.toUpperCase()}</div>
          <div className="track-badges">
            {hasRecording ? (
              <span className="badge recorded">Recorded ({eventCount})</span>
            ) : (
              <span className="badge empty">Empty</span>
            )}
            {recording && <span className="badge rec-active">REC</span>}
          </div>
        </div>
      </div>

      <div className="track-controls">
        <button 
          className={`track-btn arm-btn ${armed ? 'active' : ''}`}
          onClick={() => onCommand('loop_arm_track', { trackId: armed ? null : trackId })}
        >
          {armed ? 'Armed' : 'Arm'}
        </button>

        <button 
          className={`track-btn mute-btn ${muted ? 'active' : ''}`}
          onClick={() => onCommand('loop_mute_track', { trackId, muted: !muted })}
        >
          Mute
        </button>

        <button 
          className={`track-btn solo-btn ${solo ? 'active' : ''}`}
          onClick={() => onCommand('loop_solo_track', { trackId, solo: !solo })}
        >
          Solo
        </button>

        <button 
          className="track-btn undo-btn"
          onClick={() => onCommand('loop_undo_track', { trackId })}
          disabled={!hasRecording}
        >
          Undo
        </button>

        <button 
          className="track-btn clear-btn"
          onClick={() => onCommand('loop_clear_track', { trackId })}
          disabled={!hasRecording}
        >
          Clear
        </button>

        <div className="volume-control">
          <label>Vol</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={volume}
            onChange={handleVolumeChange}
          />
        </div>
      </div>
    </div>
  );
};

export default LoopTrack;
