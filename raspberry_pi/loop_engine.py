import time
import threading
import uuid
from typing import List, Callable, Dict, Any, Optional

class LoopEvent:
    def __init__(self, type: str, instrument: str, relativeTimeMs: float, payload: Any, source: str):
        self.id = str(uuid.uuid4())
        self.type = type
        self.instrument = instrument
        self.relativeTimeMs = relativeTimeMs
        self.payload = payload
        self.source = source
        self.createdAt = time.time()
        
    def __repr__(self):
        return f"<LoopEvent {self.type} {self.instrument} @ {self.relativeTimeMs}ms>"

class LoopTrack:
    def __init__(self, id: str, name: str, instrument: str):
        self.id = id
        self.name = name
        self.instrument = instrument
        self.events: List[LoopEvent] = []
        self.armed = False
        self.recording = False
        self.muted = False
        self.solo = False
        self.volume = 100
        # For undo: we can track "takes" by grouping events by some time window or simply track the last added events.
        # But a simpler undo_last_take implementation might just track recording sessions. 
        # Let's keep a list of lists of events (takes) or just use the created_at timestamp.
        # For simplicity, we'll maintain a list of 'takes', each is a list of events.
        self._takes: List[List[LoopEvent]] = []
        self._current_take: List[LoopEvent] = []
        
    def add_event(self, event: LoopEvent):
        self.events.append(event)
        self.events.sort(key=lambda e: e.relativeTimeMs)
        self._current_take.append(event)
        
    def end_take(self):
        if self._current_take:
            self._takes.append(list(self._current_take))
            self._current_take.clear()
            
    def clear(self):
        self.events.clear()
        self._takes.clear()
        self._current_take.clear()
        
    def undo_last_take(self):
        if self._current_take:
            # Revert ongoing take
            for e in self._current_take:
                if e in self.events:
                    self.events.remove(e)
            self._current_take.clear()
        elif self._takes:
            # Revert last completed take
            last_take = self._takes.pop()
            for e in last_take:
                if e in self.events:
                    self.events.remove(e)
                    
    def set_muted(self, muted: bool):
        self.muted = muted
        
    def set_solo(self, solo: bool):
        self.solo = solo
        
    def set_volume(self, volume: int):
        self.volume = max(0, min(100, volume))
        
    def get_state(self) -> Dict[str, Any]:
        return {
            "trackId": self.id,
            "instrument": self.instrument,
            "armed": self.armed,
            "recording": self.recording,
            "muted": self.muted,
            "solo": self.solo,
            "volume": self.volume,
            "eventCount": len(self.events),
            "hasRecording": len(self.events) > 0 or len(self._takes) > 0
        }

class LoopEngine:
    def __init__(self, playback_callback: Callable[[LoopEvent], None]):
        self.bpm = 120
        self.beatsPerBar = 4
        self.bars = 4
        self.countInBars = 1
        self.quantize = False
        
        self.playing = False
        self.recording = False
        self.overdubbing = False
        self.currentPositionMs = 0.0
        
        # Calculate loopLengthMs based on bpm, beatsPerBar, bars
        # 1 beat = 60000 / bpm ms
        self.loopLengthMs = (60000.0 / self.bpm) * self.beatsPerBar * self.bars
        
        self.playback_callback = playback_callback
        
        self.tracks = {
            "drum-track": LoopTrack("drum-track", "Drum", "drum"),
            "piano-track": LoopTrack("piano-track", "Piano", "piano"),
            "violin-track": LoopTrack("violin-track", "Violin", "violin")
        }
        
        self._thread: Optional[threading.Thread] = None
        self._stop_event = threading.Event()
        self._lock = threading.RLock()
        
        self._start_time_ns = 0
        self._last_cycle_time_ms = 0.0
        # To avoid firing same event twice in one cycle, we track index or time.
        # A simpler way is to keep track of the last processed relative time.
        self._last_processed_pos_ms = -1.0
        
    def _emit_system_event(self, event_type: str, payload: Any = None):
        try:
            self.playback_callback(LoopEvent(event_type, "system", 0.0, payload, "system"))
        except Exception as e:
            print(f"Error in playback callback (system event): {e}")

    def start(self):
        with self._lock:
            if self._thread is not None and self._thread.is_alive():
                return
            self._stop_event.clear()
            self._thread = threading.Thread(target=self._scheduler_loop, daemon=True)
            self._thread.start()
            
    def shutdown(self):
        self._stop_event.set()
        if self._thread is not None:
            self._thread.join(timeout=2.0)
            
    def play(self):
        with self._lock:
            if not self.playing:
                self.playing = True
                self._start_time_ns = time.monotonic_ns() - int(self.currentPositionMs * 1_000_000)
                self._last_processed_pos_ms = self.currentPositionMs - 0.001
                
    def pause(self):
        with self._lock:
            self.playing = False
            self.recording = False
            self.overdubbing = False
            for track in self.tracks.values():
                track.end_take()
        self._emit_system_event("loop_pause")
            
    def stop(self):
        with self._lock:
            self.playing = False
            self.recording = False
            self.overdubbing = False
            self.currentPositionMs = 0.0
            self._last_processed_pos_ms = -1.0
            for track in self.tracks.values():
                track.end_take()
        self._emit_system_event("loop_stop")
            
    def arm_track(self, track_id: str):
        with self._lock:
            for t_id, track in self.tracks.items():
                track.armed = (t_id == track_id)
                
    def start_recording(self):
        with self._lock:
            self.recording = True
            if not self.playing:
                self.play()
                
    def stop_recording(self):
        with self._lock:
            self.recording = False
            self.overdubbing = False
            for track in self.tracks.values():
                track.end_take()
                
    def record_event(self, event_type: str, instrument: str, payload: Any, source: str):
        with self._lock:
            if source != "hardware":
                return False
            if source == "loop":
                return False
            if not self.recording and not self.overdubbing:
                return False
                
            # Find armed track matching instrument
            target_track = None
            for track in self.tracks.values():
                if track.armed and track.instrument == instrument:
                    target_track = track
                    break
                    
            if not target_track:
                return False
                
            relative_time = self.currentPositionMs
            new_event = LoopEvent(event_type, instrument, relative_time, payload, source)
            target_track.add_event(new_event)
            return True
            
    def mute_track(self, track_id: str, muted: bool):
        with self._lock:
            if track_id in self.tracks:
                self.tracks[track_id].set_muted(muted)
        if muted:
            self._emit_system_event("loop_mute", {"track": track_id})
                
    def solo_track(self, track_id: str, solo: bool):
        with self._lock:
            if track_id in self.tracks:
                self.tracks[track_id].set_solo(solo)
                
    def clear_track(self, track_id: str):
        with self._lock:
            if track_id in self.tracks:
                self.tracks[track_id].clear()
        self._emit_system_event("loop_clear", {"track": track_id})
                
    def undo_track(self, track_id: str):
        with self._lock:
            if track_id in self.tracks:
                self.tracks[track_id].undo_last_take()
                
    def clear_all(self):
        with self._lock:
            for track in self.tracks.values():
                track.clear()
        self._emit_system_event("loop_clear_all")
        
    def set_bpm(self, bpm: int):
        with self._lock:
            if not self.playing and not self.recording:
                self.bpm = max(40, min(220, bpm))
                self.loopLengthMs = (60000.0 / self.bpm) * self.beatsPerBar * self.bars
                
    def set_bars(self, bars: int):
        with self._lock:
            if not self.playing and not self.recording:
                self.bars = bars
                self.loopLengthMs = (60000.0 / self.bpm) * self.beatsPerBar * self.bars
                
    def set_count_in(self, count_in: int):
        with self._lock:
            if not self.playing and not self.recording:
                self.countInBars = count_in
                
    def set_quantize(self, quantize: str):
        with self._lock:
            if not self.playing and not self.recording:
                self.quantize = quantize
                
    def set_track_volume(self, track_id: str, volume: int):
        with self._lock:
            if track_id in self.tracks:
                self.tracks[track_id].set_volume(volume)
                
    def get_track_state(self, track_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            if track_id in self.tracks:
                return self.tracks[track_id].get_state()
            return None
                
    def get_state(self) -> Dict[str, Any]:
        with self._lock:
            ms_per_beat = 60000.0 / self.bpm
            total_beats = self.currentPositionMs / ms_per_beat
            
            # Use 1-based indexing for beats and bars for UI
            current_beat = int(total_beats % self.beatsPerBar) + 1
            current_bar = int(total_beats / self.beatsPerBar) + 1
            
            # Find the armed track
            armed_track_id = next((t_id for t_id, t in self.tracks.items() if t.armed), None)
            
            return {
                "playing": self.playing,
                "recording": self.recording,
                "overdubbing": self.overdubbing,
                "armedTrackId": armed_track_id,
                "bpm": self.bpm,
                "beatsPerBar": self.beatsPerBar,
                "bars": self.bars,
                "countInBars": self.countInBars,
                "quantize": self.quantize,
                "currentBeat": current_beat,
                "currentBar": current_bar,
                "currentPositionMs": self.currentPositionMs,
                "loopLengthMs": self.loopLengthMs,
                "timestamp": int(time.time() * 1000)
            }
            
    def _scheduler_loop(self):
        while not self._stop_event.is_set():
            if not self.playing:
                time.sleep(0.005)
                continue
                
            with self._lock:
                now_ns = time.monotonic_ns()
                elapsed_ms = (now_ns - self._start_time_ns) / 1_000_000.0
                
                events_to_fire = []
                
                # Wrap at loop boundary
                if elapsed_ms >= self.loopLengthMs:
                    # Loop wrapped
                    wrap_amount = elapsed_ms % self.loopLengthMs
                    self._start_time_ns = now_ns - int(wrap_amount * 1_000_000)
                    elapsed_ms = wrap_amount
                    self._last_processed_pos_ms = -1.0
                    
                    # End take if recording
                    if self.recording:
                        self.overdubbing = True
                        for track in self.tracks.values():
                            track.end_take()
                            
                    events_to_fire.append(LoopEvent("loop_wrap", "system", 0.0, None, "system"))
                
                self.currentPositionMs = elapsed_ms
                
                # Determine which events to fire
                # We fire events that fall between _last_processed_pos_ms and currentPositionMs
                
                # Check for solo tracks
                any_solo = any(t.solo for t in self.tracks.values())
                for track in self.tracks.values():
                    if track.muted and not track.solo:
                        continue
                    if any_solo and not track.solo:
                        continue
                        
                    for event in track.events:
                        if self._last_processed_pos_ms < event.relativeTimeMs <= self.currentPositionMs:
                            events_to_fire.append(event)
                            
                self._last_processed_pos_ms = self.currentPositionMs
                
            # Fire events outside the lock to prevent deadlocks with callback
            for event in events_to_fire:
                # Callback receives a modified event with source="loop"
                # so we can track it or protect against re-recording.
                loop_event = LoopEvent(
                    event.type, event.instrument, event.relativeTimeMs, event.payload, "loop"
                )
                try:
                    self.playback_callback(loop_event)
                except Exception as e:
                    print(f"Error in playback callback: {e}")
                    
            time.sleep(0.002)
