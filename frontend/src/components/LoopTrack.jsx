import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LoopTrack = ({ track, onCommand }) => {
  const { tr } = useLanguage();
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
          <div className="track-name">{tr(instrument).toUpperCase()}</div>
          <div className="track-badges">
            {hasRecording ? (
              <span className="badge recorded">{tr("Recorded ({n})", { n: eventCount })}</span>
            ) : (
              <span className="badge empty">{tr("Empty")}</span>
            )}
            {recording && <span className="badge rec-active">{tr("REC")}</span>}
          </div>
        </div>
      </div>

      <div className="track-controls">
        <button 
          className={`track-btn arm-btn ${armed ? 'active' : ''}`}
          onClick={() => onCommand('loop_arm_track', { trackId: armed ? null : trackId })}
        >
          {armed ? tr("Armed") : tr("Arm")}
        </button>

        <button 
          className={`track-btn mute-btn ${muted ? 'active' : ''}`}
          onClick={() => onCommand('loop_mute_track', { trackId, muted: !muted })}
        >
          {tr("Mute")}
        </button>

        <button 
          className={`track-btn solo-btn ${solo ? 'active' : ''}`}
          onClick={() => onCommand('loop_solo_track', { trackId, solo: !solo })}
        >
          {tr("Solo")}
        </button>

        <button 
          className="track-btn undo-btn"
          onClick={() => onCommand('loop_undo_track', { trackId })}
          disabled={!hasRecording}
        >
          {tr("Undo")}
        </button>

        <button 
          className="track-btn clear-btn"
          onClick={() => onCommand('loop_clear_track', { trackId })}
          disabled={!hasRecording}
        >
          {tr("Clear")}
        </button>

        <div className="volume-control">
          <label>{tr("Vol")}</label>
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
