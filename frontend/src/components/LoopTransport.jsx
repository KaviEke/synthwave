import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LoopTransport = ({ loopState, onCommand }) => {
  const { tr } = useLanguage();
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
          <label>{tr("BPM")}</label>
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
          <label>{tr("Bars")}</label>
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
          <label>{tr("Count In")}</label>
          <select 
            value={loopState?.countInBars || 1} 
            onChange={handleCountInChange}
            disabled={isPlaying || isRecording}
          >
            <option value="0">{tr("Off")}</option>
            <option value="1">{tr("1 Bar")}</option>
            <option value="2">{tr("2 Bars")}</option>
          </select>
        </div>
        <div className="control-group">
          <label>{tr("Quantize")}</label>
          <select 
            value={loopState?.quantize || 'off'} 
            onChange={handleQuantizeChange}
            disabled={isPlaying || isRecording}
          >
            <option value="off">{tr("Off")}</option>
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
          {isRecording ? tr("■ Stop Rec") : tr("● Record")}
        </button>
        <button 
          className={`transport-btn play-btn ${isPlaying && !isRecording ? 'active' : ''}`}
          onClick={() => onCommand('loop_play')}
        >
          {tr("▶ Play")}
        </button>
        <button 
          className="transport-btn pause-btn"
          onClick={() => onCommand('loop_pause')}
        >
          {tr("⏸ Pause")}
        </button>
        <button 
          className="transport-btn stop-btn"
          onClick={() => onCommand('loop_stop')}
        >
          {tr("■ Stop")}
        </button>
        <button 
          className="transport-btn clear-all-btn"
          onClick={() => {
            if(window.confirm(tr('Clear all tracks?'))) onCommand('loop_clear_all');
          }}
        >
          {tr("✕ Clear All")}
        </button>
      </div>
    </div>
  );
};

export default LoopTransport;
