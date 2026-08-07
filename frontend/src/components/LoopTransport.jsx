import React from 'react';

const LoopTransport = ({ loopState, onCommand }) => {
  const isPlaying = loopState?.playing || false;
  const isRecording = loopState?.recording || false;

  const handleBpmChange = (e) => {
    let bpm = parseInt(e.target.value);
    if (!isNaN(bpm)) {
      onCommand('loop_set_bpm', { bpm });
    }
  };

  const handleBarsChange = (e) => {
    onCommand('loop_set_bars', { bars: parseInt(e.target.value) });
  };

  const handleCountInChange = (e) => {
    onCommand('loop_set_count_in', { countInBars: parseInt(e.target.value) });
  };

  const handleQuantizeChange = (e) => {
    onCommand('loop_set_quantize', { quantize: e.target.value });
  };

  return (
    <div className="loop-transport glass-panel">
      <div className="transport-controls">
        <div className="control-group">
          <label>BPM</label>
          <input 
            type="number" 
            min="40" 
            max="220" 
            value={loopState?.bpm || 100}
            onChange={handleBpmChange}
            disabled={isPlaying || isRecording}
          />
        </div>
        <div className="control-group">
          <label>Bars</label>
          <select 
            value={loopState?.bars || 4} 
            onChange={handleBarsChange}
            disabled={isPlaying || isRecording}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="8">8</option>
          </select>
        </div>
        <div className="control-group">
          <label>Count In</label>
          <select 
            value={loopState?.countInBars || 1} 
            onChange={handleCountInChange}
            disabled={isPlaying || isRecording}
          >
            <option value="0">Off</option>
            <option value="1">1 Bar</option>
            <option value="2">2 Bars</option>
          </select>
        </div>
        <div className="control-group">
          <label>Quantize</label>
          <select 
            value={loopState?.quantize || 'off'} 
            onChange={handleQuantizeChange}
            disabled={isPlaying || isRecording}
          >
            <option value="off">Off</option>
            <option value="1/4">1/4</option>
            <option value="1/8">1/8</option>
            <option value="1/16">1/16</option>
          </select>
        </div>
      </div>
      
      <div className="playback-controls">
        <button 
          className={`transport-btn record-btn ${isRecording ? 'active' : ''}`}
          onClick={() => onCommand(isRecording ? 'loop_stop_recording' : 'loop_start_recording')}
        >
          {isRecording ? '■ Stop Rec' : '● Record'}
        </button>
        <button 
          className={`transport-btn play-btn ${isPlaying && !isRecording ? 'active' : ''}`}
          onClick={() => onCommand('loop_play')}
        >
          ▶ Play
        </button>
        <button 
          className="transport-btn pause-btn"
          onClick={() => onCommand('loop_pause')}
        >
          ⏸ Pause
        </button>
        <button 
          className="transport-btn stop-btn"
          onClick={() => onCommand('loop_stop')}
        >
          ■ Stop
        </button>
        <button 
          className="transport-btn clear-all-btn"
          onClick={() => {
            if(window.confirm('Clear all tracks?')) onCommand('loop_clear_all');
          }}
        >
          ✕ Clear All
        </button>
      </div>
    </div>
  );
};

export default LoopTransport;
