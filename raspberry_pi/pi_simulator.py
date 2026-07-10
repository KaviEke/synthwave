import os
import socketio
import time
import sys
from dotenv import load_dotenv

load_dotenv()

sio = socketio.Client()
SOCKET_URL = os.getenv('SOCKET_URL', 'http://localhost:5000')
PI_DEVICE_TOKEN = os.getenv('PI_DEVICE_TOKEN', 'test-pi-token-123')

@sio.event
def connect():
    print(f"Connected to {SOCKET_URL}")
    
    # Emitting online statuses
    sio.emit('device_status', {'deviceId': 'raspberry-pi-4b', 'active': True})
    sio.emit('device_status', {'deviceId': 'controller-1', 'active': True, 'battery': 100})
    sio.emit('device_status', {'deviceId': 'controller-2', 'active': True, 'battery': 100})
    
    print("Online statuses sent")

@sio.event
def connect_error(err):
    print(f"Connection failed: {err}")
    sys.exit(1)

@sio.event
def disconnect():
    print("Disconnected from Cloud")

@sio.on('hardware_command')
def on_hardware_command(data):
    print(f"[Command Received from Web] {data}")
    sio.emit('command_result', {
        'command': data.get('command'),
        'status': 'success'
    })

def run_tests():
    print("Sending Piano note_on and note_off...")
    sio.emit('performance_event', {'type': 'note_on', 'instrument': 'piano', 'note': 'C'})
    time.sleep(0.1)
    sio.emit('performance_event', {'type': 'note_off', 'instrument': 'piano', 'note': 'C'})
    
    print("Sending Violin events...")
    sio.emit('performance_event', {'type': 'note_on', 'instrument': 'violin', 'note': 'C'})
    sio.emit('performance_event', {'type': 'bow_action', 'instrument': 'violin', 'action': 'left'})
    sio.emit('performance_event', {'type': 'bow_action', 'instrument': 'violin', 'action': 'right'})
    sio.emit('performance_event', {'type': 'bow_action', 'instrument': 'violin', 'action': 'idle'})
    sio.emit('performance_event', {'type': 'meend', 'instrument': 'violin', 'value': 0.5})

    print("Sending Drum hit...")
    sio.emit('performance_event', {'type': 'note_on', 'instrument': 'drum', 'note': 'kick'})
    
    print("Sending Octaves...")
    sio.emit('performance_event', {'type': 'octave_change', 'instrument': 'piano', 'octave': 'mandra'})
    sio.emit('performance_event', {'type': 'octave_change', 'instrument': 'piano', 'octave': 'madhya'})
    sio.emit('performance_event', {'type': 'octave_change', 'instrument': 'piano', 'octave': 'uchcha'})
    
    print("Sending battery updates...")
    sio.emit('device_status', {'deviceId': 'controller-1', 'active': True, 'battery': 80})

    print("Sending mode change...")
    sio.emit('performance_event', {'type': 'mode_change', 'mode': 'violin'})
    print("Done sending tests!")

def main():
    if len(sys.argv) > 1 and sys.argv[1] == '--bad-token':
        token = "invalid-token"
    else:
        token = PI_DEVICE_TOKEN

    try:
        sio.connect(SOCKET_URL, auth={'token': token})
        time.sleep(1)
        run_tests()
        time.sleep(1)
        sio.disconnect()
    except Exception as e:
        print(f"Exception during connect: {e}")

if __name__ == '__main__':
    main()
