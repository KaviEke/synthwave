import os
import socketio
import time
from dotenv import load_dotenv

load_dotenv()

# Initialize Socket.IO client
sio = socketio.Client()

SOCKET_URL = os.getenv('SOCKET_URL', 'http://localhost:5000')
PI_DEVICE_TOKEN = os.getenv('PI_DEVICE_TOKEN', 'test-pi-token-123')

@sio.event
def connect():
    print(f"Connected to SynthWave Motion Cloud at {SOCKET_URL}")
    
    # Send initial connection status
    sio.emit('device_status', {
        'deviceId': 'raspberry-pi-4b',
        'active': True
    })
    
    # Also simulate controller status based on ESP32 presence (Mocked here)
    sio.emit('device_status', {
        'deviceId': 'controller-1',
        'active': True,
        'battery': 95
    })

@sio.event
def disconnect():
    print("Disconnected from Cloud")

@sio.on('hardware_command')
def on_hardware_command(data):
    print(f"[Command Received from Web] {data}")
    # Here you would typically relay this to the ESP32s via ESP-NOW or Serial
    
    # Acknowledge the command
    sio.emit('command_result', {
        'command': data.get('command'),
        'status': 'success'
    })

def main():
    print("Starting SynthWave Motion Raspberry Pi Bridge...")
    try:
        sio.connect(SOCKET_URL, auth={'token': PI_DEVICE_TOKEN})
        print("Waiting for events... Press Ctrl+C to exit")
        sio.wait()
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == '__main__':
    main()
