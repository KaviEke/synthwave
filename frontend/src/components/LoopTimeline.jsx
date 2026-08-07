import React from 'react';

const LoopTimeline = ({ loopState, loopPosition }) => {
  if (!loopState) return null;

  const { bars, beatsPerBar } = loopState;
  
  // Use high-frequency loopPosition if available and playing/recording, fallback to loopState
  const activeState = (loopState.playing || loopState.recording) && loopPosition ? loopPosition : loopState;
  
  const currentPosMs = activeState.currentPositionMs || 0;
  const loopLengthMs = activeState.loopLengthMs || 1;
  const progressPercent = (currentPosMs / loopLengthMs) * 100;
  
  const currentBar = activeState.currentBar || 1;
  const currentBeat = activeState.currentBeat || 1;

  const totalBeats = bars * beatsPerBar;
  
  return (
    <div className="loop-timeline glass-panel">
      <div className="timeline-header">
        <div className="timeline-status">
          Bar {currentBar} / {bars} - Beat {currentBeat}
        </div>
        <div className="timeline-progress-text">
          {Math.floor(progressPercent)}%
        </div>
      </div>
      
      <div className="timeline-track-container">
        {/* Playhead */}
        <div 
          className="playhead" 
          style={{ left: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
        
        {/* Grid markers */}
        <div className="timeline-grid">
          {Array.from({ length: totalBeats }).map((_, i) => {
            const isBarStart = i % beatsPerBar === 0;
            const leftPercent = (i / totalBeats) * 100;
            return (
              <div 
                key={i} 
                className={`grid-line ${isBarStart ? 'bar-line' : 'beat-line'}`}
                style={{ left: `${leftPercent}%` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LoopTimeline;
