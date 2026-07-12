import time
import subprocess
import fluidsynth
import threading
import socket
import serial
import queue
import uuid
from datetime import datetime, timezone
from cloud_bridge import CloudBridge

# ======================================================
#             WEB DASHBOARD CONNECTION
# ======================================================
command_queue = queue.Queue()
bridge = CloudBridge(command_queue)

# ======================================================
#          GLOBAL TUNING & EFFECTS CONFIGURATION
# ======================================================
tuning_config = {
    "scale": "major",
    "key": "C",
    "intensity": 80,
    "reverb": 40,
    "echo": 20,
    "gain": 1.0,
    "monitor": True
}

NOTES_LIST = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

# ======================================================
#          HARDWARE MAPPING TABLES
# ======================================================
# Maps base MIDI note -> GPIO pin for each controller
CONTROLLER_1_PIANO_GPIO = {60: 13, 61: 14, 62: 16, 63: 17, 64: 18, 65: 19, 66: 23}
CONTROLLER_2_PIANO_GPIO = {67: 13, 68: 14, 69: 16, 70: 17, 71: 18}

# Maps drum sound name -> GPIO pin for each controller
CONTROLLER_1_DRUM_GPIO = {'TOM1': 13, 'CYMBAL': 14, 'METALSNARE': 16}
CONTROLLER_2_DRUM_GPIO = {'TOM2': 13, 'SNARE': 14, 'CRASH': 16, 'HIHAT': 17}

# Violin string GPIO mapping for Controller 1
VIOLIN_STRING_GPIO = {0: 13, 1: 14, 2: 16, 3: 17}
# Violin finger GPIO mapping for Controller 2
VIOLIN_FINGER_GPIO = {0: None, 1: 13, 2: 14, 3: 16}

# MIDI pitch class -> Hindustani swara
MIDI_TO_SWARA = {
    0: 'Sa', 1: 'Komal Ri', 2: 'Ri', 3: 'Komal Ga', 4: 'Ga', 5: 'Ma',
    6: 'Tivra Ma', 7: 'Pa', 8: 'Komal Dha', 9: 'Dha', 10: 'Komal Ni', 11: 'Ni'
}

# Piano base note -> button index (position in the btnPins array)
CONTROLLER_1_PIANO_BTNIDX = {60: 0, 61: 1, 62: 2, 63: 3, 64: 4, 65: 5, 66: 6}
CONTROLLER_2_PIANO_BTNIDX = {67: 0, 68: 1, 69: 2, 70: 3, 71: 4}

# ======================================================
#                  UDP NETWORK SETTINGS
# ======================================================
PI_IP = "10.217.184.226"
PI_PORT = 5005
ESP_PORT = 5006

controllers = {}
last_seen = {}
controller_ports = {}
CONTROLLER_TIMEOUT_S = 8.0

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
sock.bind((PI_IP, PI_PORT))
sock.settimeout(0.05)

# ======================================================
#                 USB KICK SERIAL SETTINGS
# ======================================================
# Change this if your Arduino appears on another port
USB_KICK_PORT = "/dev/ttyUSB0"
USB_KICK_BAUD = 115200
USB_KICK_ENABLED = True

kick_serial = None
kick_serial_lock = threading.Lock()
kick_connected = False

# ======================================================
#                        MODES
# ======================================================
MODE_NAMES = {0: "PIANO", 1: "VIOLIN", 2: "DRUM", 3: "VOCAL"}
current_mode = 0
mode_lock = threading.Lock()

# ======================================================
#                    DRUM WAV FILES
# ======================================================
SOUNDS = {
    "TOM1":       "/home/sy/tom1.wav",
    "TOM2":       "/home/sy/tom2.wav",
    "SNARE":      "/home/sy/snare.wav",
    "METALSNARE": "/home/sy/metalsnare.wav",
    "CRASH":      "/home/sy/crash.wav",
    "HIHAT":      "/home/sy/hihat.wav",
    "CYMBAL":     "/home/sy/cymbal.wav",
    "KICK":       "/home/sy/kick.wav",
}

cooldown_ms = {
    "TOM1": 25,
    "TOM2": 25,
    "SNARE": 25,
    "METALSNARE": 25,
    "CRASH": 35,
    "HIHAT": 18,
    "CYMBAL": 35,
    "KICK": 30,
}

last_play = {k: 0 for k in SOUNDS}
GLOBAL_COOLDOWN_MS = 0
last_any = 0
cooldown_lock = threading.Lock()

# ======================================================
#                  FLUIDSYNTH SETUP
# ======================================================
SF2_PATH = "/usr/share/sounds/sf2/FluidR3_GM.sf2"

fs = fluidsynth.Synth()
fs.start(driver="alsa")
sfid = fs.sfload(SF2_PATH)

CH_PIANO = 0
CH_VIOLIN = 1

fs.program_select(CH_PIANO, sfid, 0, 0)
fs.program_select(CH_VIOLIN, sfid, 0, 40)

active_notes_piano = set()
active_notes_violin = set()
notes_lock = threading.RLock()

# ======================================================
#        GLOBAL PIANO REGISTER FROM CONTROLLER 1
# ======================================================
# Controller 1 sends: PIANO_REGISTER,1,-12/0/12
# This register is applied on the Raspberry Pi to piano
# notes from BOTH controllers. Violin/drum logic stays
# exactly on the original V1/V2/MEEND/HIT paths.
piano_register_offset = 0

# Tracks held piano keys as (device_id, base_note) -> {actual_note, velocity}
# so NOTE_OFF still works after octave/register changes.
active_piano_keys = {}

# ======================================================
#              HINDUSTANI VIOLIN STATE
# ======================================================
VIOLIN_STRING_NOTES = {
    0: [55, 57, 59, 60],
    1: [60, 62, 64, 65],
    2: [67, 69, 71, 72],
    3: [72, 74, 76, 77],
}

VIOLIN_SARGAM_LABELS = {
    0: ["Pa", "Dha", "Ni", "Sa"],
    1: ["Sa", "Ri", "Ga", "Ma"],
    2: ["Pa", "Dha", "Ni", "Sa"],
    3: ["Sa", "Ri", "Ga", "Ma"],
}

violin_state = {
    "bow_active": False,
    "string_index": -1,
    "finger_index": 0,
    "last_bow_update": 0.0,
    "last_finger_update": 0.0,
    "active_note": None,
    "last_emit_name": None,

    # Joystick meend position received from Device 2.
    # -1000 = fully downward, 0 = centered, +1000 = fully upward.
    "meend_position": 0,
    "last_meend_update": 0.0,
    "last_pitch_bend": 8192,
}

VIOLIN_BOW_TIMEOUT_S = 0.35
VIOLIN_FINGER_TIMEOUT_S = 0.60

# ======================================================
#                 VIOLIN MEEND SETTINGS
# ======================================================
# MIDI pitch bend uses 8192 as the center value.
# The FluidSynth violin channel is configured for a
# two-semitone pitch-wheel range.
VIOLIN_PITCH_BEND_CENTER = 8192
VIOLIN_PITCH_BEND_MAX = 16383
VIOLIN_PITCH_BEND_RANGE_SEMITONES = 2.0

# If joystick UDP packets stop arriving, return to the
# normal unbent pitch automatically.
VIOLIN_MEEND_TIMEOUT_S = 0.30

# ======================================================
#                WEB COMMAND PROCESSING
# ======================================================
def process_commands():
    while not command_queue.empty():
        try:
            cmd_data = command_queue.get_nowait()
            cmd_name = cmd_data.get('command')
            cmd_id = cmd_data.get('commandId')
            
            if cmd_name == 'set_mode':
                requested_mode = int(cmd_data.get("mode", 0))
                if requested_mode in MODE_NAMES:
                    with mode_lock:
                        global current_mode
                        current_mode = requested_mode
                    stop_all_notes()
                    reset_violin_state()
                    print(f"Ã°Å¸Å’ Mode changed from website: {MODE_NAMES[requested_mode]}")
                    bridge.emit_performance_event('mode_state', {'mode': MODE_NAMES[requested_mode]})
                    broadcast_mode(requested_mode)
                    bridge.emit_command_result(cmd_id, True, 'set_mode', f'Mode changed to {MODE_NAMES[requested_mode]}')
                else:
                    bridge.emit_command_result(cmd_id, False, 'set_mode', 'Invalid mode')
                    
            elif cmd_name == 'set_volume':
                vol = cmd_data.get('volume', 100)
                # Apply volume logic if it exists, else just ack
                bridge.emit_performance_event('volume_state', {'volume': vol})
                bridge.emit_command_result(cmd_id, True, 'set_volume', f'Volume set to {vol}')
                
            elif cmd_name == 'mute_all' or cmd_name == 'stop_all_sounds':
                stop_all_notes()
                bridge.emit_command_result(cmd_id, True, cmd_name, 'All sounds stopped')
                
            elif cmd_name == 'play_drum':
                sound = cmd_data.get('sound', 'KICK')
                try_play_drum(sound)
                bridge.emit_command_result(cmd_id, True, 'play_drum', f'Played {sound}')
                
            elif cmd_name == 'reset_controllers':
                stop_all_notes()
                reset_violin_state()
                bridge.emit_command_result(cmd_id, True, 'reset_controllers', 'Controllers reset')
                
            else:
                bridge.emit_command_result(cmd_id, False, 'unknown', f'Unknown command {cmd_name}')
        except queue.Empty:
            break
        except Exception as e:
            print(f"Command error: {e}")

def emit_controller_status(device_id, active=True):
    try:
        bridge.emit_device_status(f'controller-{device_id}', active)
    except Exception:
        pass

def emit_usb_kick_status(active=True):
    try:
        bridge.emit_device_status('USB_KICK', active)
    except Exception:
        pass

# ======================================================
#        CANONICAL EVENT HELPER FUNCTIONS
# ======================================================
def get_swara(midi_note):
    """Return Hindustani swara name from MIDI note number."""
    if midi_note is None or midi_note < 0:
        return None
    return MIDI_TO_SWARA.get(midi_note % 12, None)

def get_register_name(offset):
    """Return register name from piano register offset."""
    if offset == 12:
        return 'Uchcha'
    if offset == -12:
        return 'Mandra'
    return 'Madhya'

def get_piano_gpio(device_id, base_note):
    """Derive GPIO pin from controller ID and base MIDI note."""
    if device_id == 1:
        return CONTROLLER_1_PIANO_GPIO.get(base_note, None)
    elif device_id == 2:
        return CONTROLLER_2_PIANO_GPIO.get(base_note, None)
    return None

def get_piano_button_index(device_id, base_note):
    """Derive button index from controller ID and base MIDI note."""
    if device_id == 1:
        return CONTROLLER_1_PIANO_BTNIDX.get(base_note, None)
    elif device_id == 2:
        return CONTROLLER_2_PIANO_BTNIDX.get(base_note, None)
    return None

def get_drum_gpio(device_id, drum_name):
    """Derive GPIO pin from controller ID and drum sound name."""
    if device_id == 1:
        return CONTROLLER_1_DRUM_GPIO.get(drum_name, None)
    elif device_id == 2:
        return CONTROLLER_2_DRUM_GPIO.get(drum_name, None)
    return None

def make_event(event_type, **kwargs):
    """Build a canonical performance event with schemaVersion, eventId, timestamp."""
    event = {
        'schemaVersion': 1,
        'eventId': str(uuid.uuid4()),
        'type': event_type,
        'timestamp': datetime.now(timezone.utc).isoformat(),
    }
    # Set defaults for all canonical fields
    defaults = {
        'instrument': None, 'deviceId': None, 'controllerId': None,
        'gpio': None, 'buttonIndex': None, 'active': None,
        'midiNote': None, 'baseMidiNote': None, 'noteName': None,
        'swara': None, 'register': None, 'velocity': None,
        'drum': None, 'stringIndex': None, 'fingerIndex': None,
        'bowActive': None, 'meend': None, 'mode': None,
    }
    defaults.update(kwargs)
    # Remove None values — send null-equivalent fields as JSON null
    for k, v in defaults.items():
        event[k] = v
    return event

def play_wav(path: str):
    subprocess.Popen(
        ["aplay", "-q", path],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

def try_play_drum(sound: str):
    global last_any
    now = int(time.time() * 1000)
    sound = sound.upper()

    with cooldown_lock:
        if sound not in SOUNDS:
            print(f"[DRUM] Unknown sound: {sound}")
            return

        if now - last_any < GLOBAL_COOLDOWN_MS:
            return

        if now - last_play.get(sound, 0) >= cooldown_ms.get(sound, 25):
            play_wav(SOUNDS[sound])
            last_play[sound] = now
            last_any = now
            bridge.emit_performance_event('drum_hit', make_event(
                'drum_hit',
                instrument='drum',
                active=True,
                drum=sound,
                velocity=120,
            ))

def get_note_name(midi_val):
    if midi_val < 0:
        return "..."
    return f"{NOTES_LIST[midi_val % 12]}{(midi_val // 12) - 1}"

def clamp_midi_note(note):
    return max(0, min(127, int(note)))

def piano_register_name(offset):
    if offset == 12:
        return "UCHCHA (+12)"
    if offset == -12:
        return "MANDRA (-12)"
    return "MADHYA / NORMAL (0)"

def piano_actual_note(base_note):
    return clamp_midi_note(int(base_note) + piano_register_offset)

def set_piano_register_offset(new_offset):
    global piano_register_offset

    try:
        new_offset = int(new_offset)
    except Exception:
        return

    if new_offset not in (-12, 0, 12):
        return

    with notes_lock:
        if new_offset == piano_register_offset:
            return

        held = list(active_piano_keys.items())

        # Stop old registered piano notes first. This touches only CH_PIANO.
        for _source_key, info in held:
            old_note = info.get("actual_note")
            if old_note is not None:
                fs.noteoff(CH_PIANO, old_note)
                active_notes_piano.discard(old_note)

        piano_register_offset = new_offset
        active_piano_keys.clear()
        bridge.emit_performance_event('octave_state', make_event(
            'octave_state',
            instrument='piano',
            register=get_register_name(new_offset),
            mode=0,
        ))

        # Restart held physical piano keys in the new register.
        for source_key, info in held:
            base_note = int(info["base_note"])
            velocity = int(info.get("velocity", 120))
            new_note = piano_actual_note(base_note)
            fs.noteon(CH_PIANO, new_note, velocity)
            active_notes_piano.add(new_note)
            active_piano_keys[source_key] = {
                "base_note": base_note,
                "actual_note": new_note,
                "velocity": velocity,
            }

    print(f"[PIANO] Global register -> {piano_register_name(piano_register_offset)}")

def get_violin_label(string_index, finger_index):
    try:
        sargam = VIOLIN_SARGAM_LABELS[string_index][finger_index]
        midi_val = VIOLIN_STRING_NOTES[string_index][finger_index]
        western = get_note_name(midi_val)
        return f"{sargam} ({western})"
    except Exception:
        return "Violin"

def configure_violin_pitch_bend():
    """Configure the violin MIDI channel for a +/- 2 semitone bend range."""
    try:
        fs.pitch_wheel_sens(CH_VIOLIN, int(VIOLIN_PITCH_BEND_RANGE_SEMITONES))
        print("[VIOLIN] Pitch bend range configured using pitch_wheel_sens")
    except Exception:
        # MIDI RPN 0,0 = Pitch Bend Sensitivity.
        # This fallback works when the Python binding does not expose
        # pitch_wheel_sens directly.
        fs.cc(CH_VIOLIN, 101, 0)
        fs.cc(CH_VIOLIN, 100, 0)
        fs.cc(CH_VIOLIN, 6, int(VIOLIN_PITCH_BEND_RANGE_SEMITONES))
        fs.cc(CH_VIOLIN, 38, 0)
        fs.cc(CH_VIOLIN, 101, 127)
        fs.cc(CH_VIOLIN, 100, 127)
        print("[VIOLIN] Pitch bend range configured using MIDI RPN fallback")

    fs.pitch_bend(CH_VIOLIN, VIOLIN_PITCH_BEND_CENTER)


def calculate_violin_pitch_bend():
    """Map joystick position to a glide toward the adjacent Hindustani note."""
    now = time.time()

    if now - violin_state["last_meend_update"] > VIOLIN_MEEND_TIMEOUT_S:
        position = 0
    else:
        position = int(violin_state["meend_position"])

    position = max(-1000, min(1000, position))

    string_index = violin_state["string_index"]
    finger_index = max(0, min(3, int(violin_state["finger_index"])))

    if string_index not in VIOLIN_STRING_NOTES:
        return VIOLIN_PITCH_BEND_CENTER

    notes = VIOLIN_STRING_NOTES[string_index]
    semitone_offset = 0.0

    if position > 0 and finger_index < 3:
        step_up = notes[finger_index + 1] - notes[finger_index]
        semitone_offset = step_up * (position / 1000.0)

    elif position < 0 and finger_index > 0:
        step_down = notes[finger_index] - notes[finger_index - 1]
        semitone_offset = step_down * (position / 1000.0)

    normalized = semitone_offset / VIOLIN_PITCH_BEND_RANGE_SEMITONES
    bend_value = int(round(VIOLIN_PITCH_BEND_CENTER + normalized * 8191.0))

    return max(0, min(VIOLIN_PITCH_BEND_MAX, bend_value))


def apply_violin_meend(force=False):
    bend_value = calculate_violin_pitch_bend()

    with notes_lock:
        if force or bend_value != violin_state["last_pitch_bend"]:
            fs.pitch_bend(CH_VIOLIN, bend_value)
            violin_state["last_pitch_bend"] = bend_value


def refresh_violin_meend_timeout():
    if violin_state["meend_position"] == 0:
        return

    if time.time() - violin_state["last_meend_update"] > VIOLIN_MEEND_TIMEOUT_S:
        violin_state["meend_position"] = 0
        apply_violin_meend(force=True)


def stop_all_notes():
    with notes_lock:
        for n in list(active_notes_piano):
            fs.noteoff(CH_PIANO, n)
            active_notes_piano.discard(n)

        active_piano_keys.clear()

        for n in list(active_notes_violin):
            fs.noteoff(CH_VIOLIN, n)
            active_notes_violin.discard(n)

    violin_state["active_note"] = None
    violin_state["last_emit_name"] = None
    violin_state["meend_position"] = 0
    violin_state["last_meend_update"] = 0.0
    apply_violin_meend(force=True)

def reset_violin_state():
    violin_state["bow_active"] = False
    violin_state["string_index"] = -1
    violin_state["finger_index"] = 0
    violin_state["last_bow_update"] = 0.0
    violin_state["last_finger_update"] = 0.0
    violin_state["active_note"] = None
    violin_state["last_emit_name"] = None
    violin_state["meend_position"] = 0
    violin_state["last_meend_update"] = 0.0
    apply_violin_meend(force=True)

def set_violin_note(note, label_text=None):
    with notes_lock:
        current = violin_state["active_note"]

        if current == note:
            apply_violin_meend()
            return

        if current is not None:
            fs.noteoff(CH_VIOLIN, current)
            active_notes_violin.discard(current)
            bridge.emit_performance_event('note_off', make_event(
                'note_off',
                instrument='violin',
                active=False,
                midiNote=current,
                noteName=get_note_name(current),
                swara=get_swara(current),
                stringIndex=violin_state.get('string_index'),
                fingerIndex=violin_state.get('finger_index'),
                bowActive=False,
                deviceId='controller-1',
                controllerId=1,
                gpio=VIOLIN_STRING_GPIO.get(violin_state.get('string_index')),
            ))

        violin_state["active_note"] = None

        if note is not None:
            fs.noteon(CH_VIOLIN, note, 120)
            active_notes_violin.add(note)
            violin_state["active_note"] = note
            print(f"[VIOLIN] NOTE ON {note} {label_text if label_text else ''}")
            if label_text:
                bridge.emit_performance_event('note_on', make_event(
                    'note_on',
                    instrument='violin',
                    active=True,
                    midiNote=note,
                    noteName=get_note_name(note),
                    swara=get_swara(note),
                    stringIndex=violin_state.get('string_index'),
                    fingerIndex=violin_state.get('finger_index'),
                    bowActive=True,
                    deviceId='controller-1',
                    controllerId=1,
                    gpio=VIOLIN_STRING_GPIO.get(violin_state.get('string_index')),
                    velocity=120,
                ))
                violin_state["last_emit_name"] = label_text

        apply_violin_meend(force=True)

def compute_target_violin_note():
    now = time.time()

    bow_fresh = (now - violin_state["last_bow_update"]) <= VIOLIN_BOW_TIMEOUT_S
    finger_fresh = (now - violin_state["last_finger_update"]) <= VIOLIN_FINGER_TIMEOUT_S

    if not bow_fresh:
        return None, None

    if not violin_state["bow_active"]:
        return None, None

    string_index = violin_state["string_index"]
    if string_index not in VIOLIN_STRING_NOTES:
        return None, None

    finger_index = violin_state["finger_index"] if finger_fresh else 0
    if finger_index < 0:
        finger_index = 0
    if finger_index > 3:
        finger_index = 3

    note = VIOLIN_STRING_NOTES[string_index][finger_index]
    label = get_violin_label(string_index, finger_index)
    return note, label

def refresh_violin_output():
    with mode_lock:
        m = current_mode

    if m != 1:
        if violin_state["active_note"] is not None:
            set_violin_note(None)
        return

    note, label = compute_target_violin_note()

    if note is None:
        if violin_state["active_note"] is not None:
            print("[VIOLIN] NOTE OFF")
            set_violin_note(None)
        return

    set_violin_note(note, label)

def broadcast_mode(mode_value: int):
    msg = f"MODE_SET,{mode_value}".encode()
    dead = []

    for device_id, ip_addr in list(controllers.items()):
        port = controller_ports.get(device_id, ESP_PORT)
        try:
            sock.sendto(msg, (ip_addr, port))
        except Exception as e:
            print(f"Failed to sync mode to controller {device_id}: {e}")
            dead.append(device_id)

    for d in dead:
        controllers.pop(d, None)
        last_seen.pop(d, None)
        controller_ports.pop(d, None)
        emit_controller_status(d, False)

def register_controller(device_id, ip_addr, source_port):
    controllers[device_id] = ip_addr
    last_seen[device_id] = time.time()
    controller_ports[device_id] = source_port
    print(f"Controller {device_id} connected from {ip_addr}:{source_port}")
    bridge.emit_device_status(f'controller-{device_id}', True)

    with mode_lock:
        m = current_mode

    try:
        sock.sendto(f"MODE_SET,{m}".encode(), (ip_addr, source_port))
    except Exception as e:
        print(f"Initial mode sync failed for controller {device_id}: {e}")

# ======================================================
#         VOCAL MODE PLACEHOLDER (WEB HANDLES AUDIO)
# ======================================================
def vocal_engine_thread():
    print("Ã°Å¸Å½Â¤ Vocal mode is handled by the website/browser.")
    while True:
        time.sleep(1)

# ======================================================
#             USB KICK SERIAL HANDLER
# ======================================================
def open_kick_serial():
    global kick_serial, kick_connected

    if not USB_KICK_ENABLED:
        return False

    try:
        ser = serial.Serial(USB_KICK_PORT, USB_KICK_BAUD, timeout=0.05)
        with kick_serial_lock:
            kick_serial = ser
        kick_connected = True
        print(f"[USB KICK] Connected on {USB_KICK_PORT}")
        bridge.emit_device_status('USB_KICK', True)
        return True
    except Exception as e:
        kick_connected = False
        bridge.emit_device_status('USB_KICK', False)
        print(f"[USB KICK] Not connected on {USB_KICK_PORT}: {e}")
        return False

def close_kick_serial():
    global kick_serial, kick_connected
    with kick_serial_lock:
        if kick_serial is not None:
            try:
                kick_serial.close()
            except Exception:
                pass
            kick_serial = None
    if kick_connected:
        bridge.emit_device_status('USB_KICK', False)
    kick_connected = False

def handle_usb_kick_line(line: str):
    line = line.strip()
    if not line:
        return

    if line.lower() == "kick_ready":
        print("[USB KICK] kick_ready")
        return

    parts = line.split(",")
    if len(parts) != 2:
        return

    cmd = parts[0].strip().upper()
    if cmd != "KICK":
        return

    try:
        vel = int(parts[1].strip())
    except Exception:
        vel = 120

    if vel < 1:
        vel = 1
    if vel > 127:
        vel = 127

    with mode_lock:
        m = current_mode

    if m == 2:
        try_play_drum("KICK")
        print(f"[USB KICK] DRUM KICK vel={vel}")

def usb_kick_thread():
    global kick_connected

    while True:
        if not kick_connected:
            opened = open_kick_serial()
            if not opened:
                time.sleep(2.0)
                continue

        try:
            with kick_serial_lock:
                ser = kick_serial

            if ser is None:
                kick_connected = False
                time.sleep(1.0)
                continue

            line = ser.readline().decode(errors="ignore").strip()
            if line:
                handle_usb_kick_line(line)

        except Exception as e:
            print(f"[USB KICK] Serial error: {e}")
            close_kick_serial()
            time.sleep(1.5)

# ======================================================
#                 UDP PACKET HANDLER
# ======================================================
def handle_packet(message: str, addr):
    global current_mode

    parts = message.strip().split(",")
    if not parts:
        return

    cmd = parts[0].upper()

    if cmd == "HELLO" and len(parts) == 2:
        try:
            device_id = int(parts[1])
            register_controller(device_id, addr[0], addr[1])
        except Exception as e:
            print("HELLO parse error:", e)
        return

    if cmd == "HEARTBEAT" and len(parts) == 2:
        try:
            device_id = int(parts[1])
            if device_id not in controllers or controllers[device_id] != addr[0]:
                register_controller(device_id, addr[0], addr[1])
            else:
                last_seen[device_id] = time.time()
                controller_ports[device_id] = addr[1]
                bridge.emit_device_status(f'controller-{device_id}', True)
        except Exception as e:
            print("HEARTBEAT parse error:", e)
        return

    if cmd == "MODE" and len(parts) == 3:
        try:
            device_id = int(parts[1])
            m = int(parts[2])

            if device_id not in controllers or controllers[device_id] != addr[0]:
                register_controller(device_id, addr[0], addr[1])
            else:
                last_seen[device_id] = time.time()
                controller_ports[device_id] = addr[1]
                bridge.emit_device_status(f'controller-{device_id}', True)

            if m in MODE_NAMES:
                with mode_lock:
                    current_mode = m

                stop_all_notes()
                reset_violin_state()
                print(f"Mode changed by controller {device_id}: {MODE_NAMES[m]}")
                bridge.emit_performance_event('mode_state', make_event(
                    'mode_state', mode=m, instrument=MODE_NAMES[m].lower(),
                    deviceId=f'controller-{device_id}', controllerId=device_id
                ))
                broadcast_mode(m)
        except Exception as e:
            print("MODE parse error:", e)
        return

    if cmd == "V1" and len(parts) == 4:
        try:
            device_id = int(parts[1])
            bow_active = int(parts[2]) == 1
            string_index = int(parts[3])

            last_seen[device_id] = time.time()
            controller_ports[device_id] = addr[1]

            with mode_lock:
                actual_mode = current_mode

            if actual_mode != 1:
                return

            violin_state["bow_active"] = bow_active
            violin_state["string_index"] = string_index
            violin_state["last_bow_update"] = time.time()

            bridge.emit_performance_event('bow_state', make_event(
                'bow_state',
                instrument='violin',
                bowActive=bow_active,
                stringIndex=string_index,
                deviceId=f'controller-{device_id}',
                controllerId=device_id,
                active=bow_active,
                gpio=VIOLIN_STRING_GPIO.get(string_index),
            ))
            refresh_violin_output()
        except Exception as e:
            print("V1 parse error:", e)
        return

    if cmd == "V2" and len(parts) == 3:
        try:
            device_id = int(parts[1])
            finger_index = int(parts[2])

            last_seen[device_id] = time.time()
            controller_ports[device_id] = addr[1]

            with mode_lock:
                actual_mode = current_mode

            if actual_mode != 1:
                return

            if finger_index < 0:
                finger_index = 0
            if finger_index > 3:
                finger_index = 3

            violin_state["finger_index"] = finger_index
            violin_state["last_finger_update"] = time.time()

            refresh_violin_output()
        except Exception as e:
            print("V2 parse error:", e)
        return

    # --------------------------------------------------
    # Device 2 joystick meend:
    # MEEND,<device_id>,<position -1000..1000>
    # --------------------------------------------------
    if cmd == "MEEND" and len(parts) == 3:
        try:
            device_id = int(parts[1])
            position = int(parts[2])

            last_seen[device_id] = time.time()
            controller_ports[device_id] = addr[1]

            with mode_lock:
                actual_mode = current_mode

            if actual_mode != 1:
                return

            violin_state["meend_position"] = max(-1000, min(1000, position))
            violin_state["last_meend_update"] = time.time()

            bridge.emit_performance_event('meend_state', make_event(
                'meend_state',
                instrument='violin',
                meend=position,
                deviceId=f'controller-{device_id}',
                controllerId=device_id,
            ))
            apply_violin_meend()
        except Exception as e:
            print("MEEND parse error:", e)
        return

    # --------------------------------------------------
    # Global piano register / octave from Controller 1:
    # PIANO_REGISTER,<device_id>,-12/0/12
    # --------------------------------------------------
    if cmd == "PIANO_REGISTER" and len(parts) == 3:
        try:
            device_id = int(parts[1])
            offset = int(parts[2])

            last_seen[device_id] = time.time()
            controller_ports[device_id] = addr[1]

            # Only Controller 1 owns the magnetometer in your design.
            if device_id == 1:
                set_piano_register_offset(offset)
        except Exception as e:
            print("PIANO_REGISTER parse error:", e)
        return

    if cmd == "NOTE_ON" and len(parts) == 5:
        try:
            device_id = int(parts[1])
            sent_mode = int(parts[2])
            note = int(parts[3])
            vel = int(parts[4])

            last_seen[device_id] = time.time()
            controller_ports[device_id] = addr[1]

            with mode_lock:
                actual_mode = current_mode

            if sent_mode != actual_mode:
                return

            with notes_lock:
                if actual_mode == 0:
                    source_key = (device_id, note)

                    previous = active_piano_keys.get(source_key)
                    if previous is not None:
                        old_note = previous.get("actual_note")
                        fs.noteoff(CH_PIANO, old_note)
                        active_notes_piano.discard(old_note)

                    actual_note = piano_actual_note(note)
                    fs.noteon(CH_PIANO, actual_note, vel)
                    active_notes_piano.add(actual_note)
                    active_piano_keys[source_key] = {
                        "base_note": note,
                        "actual_note": actual_note,
                        "velocity": vel,
                    }
                    print(
                        f"[CTRL {device_id}] PIANO NOTE ON "
                        f"base={note} actual={actual_note} "
                        f"register={piano_register_name(piano_register_offset)}"
                    )
                    bridge.emit_performance_event('note_on', make_event(
                        'note_on',
                        instrument='piano',
                        active=True,
                        midiNote=actual_note,
                        baseMidiNote=note,
                        noteName=get_note_name(actual_note),
                        swara=get_swara(note),
                        register=get_register_name(piano_register_offset),
                        velocity=vel,
                        controllerId=device_id,
                        deviceId=f'controller-{device_id}',
                        gpio=get_piano_gpio(device_id, note),
                        buttonIndex=get_piano_button_index(device_id, note),
                    ))

                elif actual_mode == 1:
                    fs.noteon(CH_VIOLIN, note, vel)
                    active_notes_violin.add(note)
                    print(f"[CTRL {device_id}] VIOLIN NOTE ON {note}")
                    bridge.emit_performance_event('note_on', make_event(
                        'note_on',
                        instrument='violin',
                        active=True,
                        midiNote=note,
                        noteName=get_note_name(note),
                        swara=get_swara(note),
                        velocity=vel,
                        controllerId=device_id,
                        deviceId=f'controller-{device_id}',
                        stringIndex=violin_state.get('string_index'),
                        fingerIndex=violin_state.get('finger_index'),
                        bowActive=violin_state.get('bow_active'),
                        gpio=VIOLIN_STRING_GPIO.get(violin_state.get('string_index')),
                    ))
        except Exception as e:
            print("NOTE_ON parse error:", e)
        return

    if cmd == "NOTE_OFF" and len(parts) == 4:
        try:
            device_id = int(parts[1])
            sent_mode = int(parts[2])
            note = int(parts[3])

            last_seen[device_id] = time.time()
            controller_ports[device_id] = addr[1]

            with mode_lock:
                actual_mode = current_mode

            if sent_mode != actual_mode:
                return

            with notes_lock:
                if actual_mode == 0:
                    source_key = (device_id, note)
                    previous = active_piano_keys.pop(source_key, None)

                    if previous is not None:
                        actual_note = previous.get("actual_note")
                    else:
                        actual_note = piano_actual_note(note)

                    fs.noteoff(CH_PIANO, actual_note)
                    active_notes_piano.discard(actual_note)
                    bridge.emit_performance_event('note_off', make_event(
                        'note_off',
                        instrument='piano',
                        active=False,
                        midiNote=actual_note,
                        baseMidiNote=note,
                        noteName=get_note_name(actual_note),
                        swara=get_swara(note),
                        register=get_register_name(piano_register_offset),
                        controllerId=device_id,
                        deviceId=f'controller-{device_id}',
                        gpio=get_piano_gpio(device_id, note),
                        buttonIndex=get_piano_button_index(device_id, note),
                    ))
                elif actual_mode == 1:
                    fs.noteoff(CH_VIOLIN, note)
                    active_notes_violin.discard(note)
                    bridge.emit_performance_event('note_off', make_event(
                        'note_off',
                        instrument='violin',
                        active=False,
                        midiNote=note,
                        noteName=get_note_name(note),
                        swara=get_swara(note),
                        controllerId=device_id,
                        deviceId=f'controller-{device_id}',
                        stringIndex=violin_state.get('string_index'),
                        fingerIndex=violin_state.get('finger_index'),
                        bowActive=False,
                        gpio=VIOLIN_STRING_GPIO.get(violin_state.get('string_index')),
                    ))
        except Exception as e:
            print("NOTE_OFF parse error:", e)
        return

    if cmd == "HIT" and len(parts) == 4:
        try:
            device_id = int(parts[1])
            sound = parts[2].upper()
            hit_vel = 120
            if len(parts) >= 5:
                try:
                    hit_vel = int(parts[4])
                except Exception:
                    pass

            last_seen[device_id] = time.time()
            controller_ports[device_id] = addr[1]

            with mode_lock:
                m = current_mode

            if m == 2:
                try_play_drum(sound)
                print(f"[CTRL {device_id}] DRUM {sound}")
                bridge.emit_performance_event('drum_hit', make_event(
                    'drum_hit',
                    instrument='drum',
                    active=True,
                    drum=sound,
                    velocity=hit_vel,
                    controllerId=device_id,
                    deviceId=f'controller-{device_id}',
                    gpio=get_drum_gpio(device_id, sound),
                ))
        except Exception as e:
            print("HIT parse error:", e)
        return

def monitor_controllers():
    while True:
        now = time.time()
        for device_id in list(last_seen.keys()):
            if now - last_seen[device_id] > CONTROLLER_TIMEOUT_S:
                if device_id in controllers:
                    print(f"Controller {device_id} timed out")
                    bridge.emit_device_status(f'controller-{device_id}', False)
                    controllers.pop(device_id, None)
                last_seen.pop(device_id, None)
                controller_ports.pop(device_id, None)

                if device_id == 1:
                    violin_state["bow_active"] = False
                    violin_state["string_index"] = -1
                    violin_state["last_bow_update"] = 0.0
                    refresh_violin_output()
                elif device_id == 2:
                    violin_state["finger_index"] = 0
                    violin_state["last_finger_update"] = 0.0
                    violin_state["meend_position"] = 0
                    violin_state["last_meend_update"] = 0.0
                    refresh_violin_output()
                    apply_violin_meend(force=True)

        time.sleep(1)

# ======================================================
#                       MAIN
# ======================================================
def main():
    configure_violin_pitch_bend()
    bridge.start()
    print("Instrument server ready on UDP port", PI_PORT)
    print(f"USB kick enabled: {USB_KICK_ENABLED} on {USB_KICK_PORT}")

    print("Violin mapping:")
    print("  String 1 (Mandra Pa): Pa Dha Ni Sa -> G3 A3 B3 C4")
    print("  String 2 (Sa):        Sa Ri Ga Ma -> C4 D4 E4 F4")
    print("  String 3 (Pa):        Pa Dha Ni Sa -> G4 A4 B4 C5")
    print("  String 4 (Tara Sa):   Sa Ri Ga Ma -> C5 D5 E5 F5")

    threading.Thread(target=vocal_engine_thread, daemon=True).start()
    threading.Thread(target=monitor_controllers, daemon=True).start()
    threading.Thread(target=usb_kick_thread, daemon=True).start()

    try:
        while True:
            process_commands()
            try:
                data, addr = sock.recvfrom(1024)
                message = data.decode(errors="ignore").strip()
                if message:
                    handle_packet(message, addr)
            except socket.timeout:
                refresh_violin_output()
                refresh_violin_meend_timeout()
                continue
            except Exception as e:
                print("Socket error:", e)

            refresh_violin_output()
            refresh_violin_meend_timeout()

    except KeyboardInterrupt:
        pass
    finally:
        close_kick_serial()
        stop_all_notes()
        fs.delete()
        sock.close()

        if bridge.connected:
            try:
                bridge.emit_device_status('raspberry-pi-4b', False)
                bridge.emit_device_status('USB_KICK', False)
                bridge.stop()
            except Exception:
                pass

        print("Stopped.")

if __name__ == "__main__":
    main()