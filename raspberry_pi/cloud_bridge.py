import os
import socketio
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load .env relative to this file
load_dotenv(Path(__file__).resolve().parent / ".env", override=True)

# Initialize Socket.IO client
sio = socketio.Client()

CLOUD_SOCKET_URL = os.getenv('CLOUD_SOCKET_URL', os.getenv('SOCKET_URL', 'http://localhost:5000')).strip()
PI_DEVICE_TOKEN = os.getenv('PI_DEVICE_TOKEN', '').strip()
PI_DEVICE_ID = 'raspberry-pi-4b'

if not PI_DEVICE_TOKEN:
    print("ERROR: PI_DEVICE_TOKEN is missing or empty in .env")
    sys.exit(1)

@sio.event
def connect():
    print(f"Connected to SynthWave Motion Cloud at {CLOUD_SOCKET_URL}")
    
    # Send initial connection status
    sio.emit('device_status', {
        'deviceId': PI_DEVICE_ID,
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
        # Use exact authentication contract
        auth_payload = {
            'role': 'raspberry_pi',
            'token': PI_DEVICE_TOKEN,
            'deviceId': PI_DEVICE_ID
        }
        sio.connect(CLOUD_SOCKET_URL, auth=auth_payload)
        print("Waiting for events... Press Ctrl+C to exit")
        sio.wait()
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == '__main__':
    main()
