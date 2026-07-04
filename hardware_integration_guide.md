# Hardware Integration Guide: Music Motion

This guide explains how to connect your ESP32 and Raspberry Pi to the Node.js backend using WebSockets. When your motion sensors trigger a sound, you can send that event to the server, and the web application will visually display it instantly.

## 1. WebSocket Event Structure

Your hardware devices must act as **Socket.io Clients** connecting to `http://<YOUR_SERVER_IP>:5000`.

### Event: `device_status`
Send this event right after connecting so the web app knows the hardware is active.
```json
// Payload
{
  "active": true,
  "deviceId": "ESP32_Violin_Sensor"
}
```

### Event: `note_played`
Send this event whenever a motion sensor triggers a MIDI sound.
```json
// Payload
{
  "instrument": "violin", // (or "drum", "piano")
  "note": "A4"            // (or "C5", "Kick", etc.)
}
```

---

## 2. Raspberry Pi (Python Example)

If you are running Python on your Raspberry Pi to manage the MIDI mapping, you can use the `python-socketio` package.

**Install Dependencies:**
```bash
pip install python-socketio requests
```

**Python Script (`pi_client.py`):**
```python
import socketio
import time

# Create a Socket.IO client
sio = socketio.Client()

@sio.event
def connect():
    print("Connected to Node.js server!")
    # Notify dashboard that device is active
    sio.emit('device_status', {'active': True, 'deviceId': 'Raspberry_Pi_4B'})

@sio.event
def disconnect():
    print("Disconnected from server")

# Connect to the server (Replace localhost with your PC's local IP if testing over Wi-Fi)
sio.connect('http://localhost:5000')

# Simulate motion sensor triggering a note
try:
    print("Simulating sensor strikes...")
    
    time.sleep(2)
    sio.emit('note_played', {'instrument': 'drum', 'note': 'Kick'})
    print("Played: Kick Drum")
    
    time.sleep(1.5)
    sio.emit('note_played', {'instrument': 'piano', 'note': 'C4'})
    print("Played: Piano C4")
    
    time.sleep(2)
    sio.emit('note_played', {'instrument': 'violin', 'note': 'G4'})
    print("Played: Violin G4")
    
    sio.wait()
except KeyboardInterrupt:
    sio.disconnect()
```

---

## 3. ESP32 (C++ / Arduino IDE Example)

For the ESP32 connecting over Wi-Fi, the easiest way is using the `WebSocketsClient` library or a specific Socket.io client library for ESP32.

**Arduino Libraries Required:**
- `WiFi.h` (Built-in for ESP32)
- `SocketIoClient` (Search for "Socket.io" in Arduino Library Manager)

**ESP32 Sketch:**
```cpp
#include <WiFi.h>
#include <SocketIoClient.h>

const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* host     = "192.168.1.XXX"; // Your laptop's IP address running the Node.js server
const int port       = 5000;

SocketIoClient webSocket;

void initializeDevice(const char * payload, size_t length) {
  // When connected, tell the server ESP32 is active
  webSocket.emit("device_status", "{\"active\":true, \"deviceId\":\"ESP32_Sensor\"}");
}

void setup() {
  Serial.begin(115200);
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected.");

  // Attach event handler for connection
  webSocket.on("connect", initializeDevice);
  
  // Connect to the Socket.io server
  webSocket.begin(host, port);
}

void loop() {
  webSocket.loop();
  
  // Example: Read a motion sensor pin
  // int sensorValue = digitalRead(SENSOR_PIN);
  // if (sensorValue == HIGH) {
  //   webSocket.emit("note_played", "{\"instrument\":\"violin\", \"note\":\"A4\"}");
  //   delay(500); // Debounce
  // }
}
```

### Summary
1. Start your Node server (`npm start` or `node server.js`).
2. Start your React web app (`npm run dev`).
3. Run the Python script or flash the ESP32 code.
4. Watch the Dashboard light up instantly as notes are played!
