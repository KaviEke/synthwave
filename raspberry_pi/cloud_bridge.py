import os
import socketio
import sys
import threading
import time
from pathlib import Path
from dotenv import load_dotenv

class CloudBridge:
    def __init__(self, command_queue):
        self.command_queue = command_queue
        
        # Load .env relative to this file
        load_dotenv(Path(__file__).resolve().parent / ".env", override=True)
        
        self.cloud_socket_url = os.getenv('CLOUD_SOCKET_URL', os.getenv('SOCKET_URL', 'http://localhost:5000')).strip()
        self.pi_device_token = os.getenv('PI_DEVICE_TOKEN', '').strip()
        self.pi_device_id = 'raspberry-pi-4b'
        
        if not self.pi_device_token:
            print("ERROR: PI_DEVICE_TOKEN is missing or empty in .env. Cloud integration disabled.")
        
        # Initialize Socket.IO client
        self.sio = socketio.Client(reconnection=True, reconnection_attempts=0, reconnection_delay=2, reconnection_delay_max=5)
        self.connected = False
        
        # Rate limiting trackers
        self.last_meend_time = 0.0
        self.last_sensor_time = 0.0
        self.last_heartbeats = {}
        self.last_battery = {}
        
        self._register_handlers()

    def _register_handlers(self):
        @self.sio.event
        def connect():
            self.connected = True
            print(f"[CloudBridge] Connected to {self.cloud_socket_url}")
            # Send initial connection status for Pi
            self.emit_device_status(self.pi_device_id, True)

        @self.sio.event
        def disconnect():
            self.connected = False
            print("[CloudBridge] Disconnected from Cloud")

        @self.sio.on('hardware_command')
        def on_hardware_command(data):
            # Put command safely into thread-safe queue for main thread to process
            self.command_queue.put(data)

    def start(self):
        if not self.pi_device_token:
            return
            
        def run_sio():
            try:
                auth_payload = {
                    'role': 'raspberry_pi',
                    'token': self.pi_device_token,
                    'deviceId': self.pi_device_id
                }
                self.sio.connect(self.cloud_socket_url, auth=auth_payload)
                self.sio.wait()
            except Exception as e:
                print(f"[CloudBridge] Connection failed: {e}")

        # Start Socket.IO wait in a background daemon thread
        t = threading.Thread(target=run_sio, daemon=True)
        t.start()

    def stop(self):
        if self.connected:
            self.sio.disconnect()
            
    def emit_performance_event(self, event_type, data):
        if not self.connected:
            return
            
        now = time.time()
        
        # Rate limiting logic
        if event_type == 'meend_state':
            if now - self.last_meend_time < 0.05: # max 20 events per second
                return
            self.last_meend_time = now
            
        if event_type == 'sensor_frame':
            if now - self.last_sensor_time < 0.066: # max 15 events per second
                return
            self.last_sensor_time = now

        try:
            self.sio.emit('performance_event', {
                'type': event_type,
                'data': data,
                'timestamp': int(now * 1000)
            })
        except Exception:
            pass

    def emit_device_status(self, device_id, active, battery=None):
        if not self.connected:
            return
            
        now = time.time()
        
        # Rate limit heartbeat updates to roughly every 3 seconds per device unless state changed
        last_time = self.last_heartbeats.get(device_id, 0)
        
        # Only check battery limit if battery is present and active
        if active and battery is not None:
            last_batt_time = self.last_battery.get(device_id, 0)
            if now - last_batt_time >= 15:
                self.last_battery[device_id] = now
            else:
                battery = None # Don't send battery if rate limited
                
        # Send active if time elapsed > 3s, or if device went offline
        if not active or (now - last_time >= 3.0):
            try:
                payload = {
                    'deviceId': device_id,
                    'active': active
                }
                if battery is not None:
                    payload['battery'] = battery
                    
                self.sio.emit('device_status', payload)
                self.last_heartbeats[device_id] = now
            except Exception:
                pass

    def emit_command_result(self, command_id, success, cmd_type, message):
        if not self.connected or not command_id:
            return
        
        try:
            self.sio.emit('command_result', {
                'commandId': command_id,
                'success': success,
                'type': cmd_type,
                'message': message,
                'timestamp': int(time.time() * 1000)
            })
        except Exception:
            pass

if __name__ == '__main__':
    # Simple test without main.py
    import queue
    q = queue.Queue()
    bridge = CloudBridge(q)
    bridge.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        bridge.stop()
