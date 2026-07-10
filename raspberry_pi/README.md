# SynthWave Motion - Raspberry Pi Bridge

This directory contains the Python scripts required to run the Socket.IO bridge on a Raspberry Pi. The bridge connects the physical SynthWave Motion hardware controllers (ESP32) to the deployed web application in real-time.

## Architecture
- **Web App**: React frontend deployed on Vercel.
- **Cloud Backend**: Node.js/Express server with Socket.IO, authenticated via JWT for users and a secret token for hardware devices.
- **Hardware Bridge**: Raspberry Pi running Python. Connects to the cloud backend as a `hardware-device`.
- **Controllers**: ESP32 microcontrollers connected to the Pi (via Serial or ESP-NOW).

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configuration**:
   Copy `.env.example` to `.env` and fill in your actual production `SOCKET_URL` and `PI_DEVICE_TOKEN`.
   ```bash
   cp .env.example .env
   ```

3. **Running the Bridge**:
   ```bash
   python cloud_bridge.py
   ```

## Simulator

For local testing without the physical hardware, run the simulator script instead:
```bash
python hardware_simulator.py
```
This script will mock the presence of a Raspberry Pi and a controller, and send random piano note events to the backend.

## Production Deployment (Systemd)

To run the bridge automatically on boot, use the provided systemd service example:
1. Edit `syntronics.service.example` with the correct paths.
2. Copy it to `/etc/systemd/system/syntronics.service`.
3. Enable and start the service:
   ```bash
   sudo systemctl enable syntronics.service
   sudo systemctl start syntronics.service
   ```
