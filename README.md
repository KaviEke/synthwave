# Music Motion Web Application

This is the central web dashboard for your university Hardware-software integration project (ESP32/Raspberry Pi motion sensors triggering midis).

## How to Run the App Easily on Windows:

1. Double click the **`start.bat`** file located in this folder.
2. It will open two console windows and start installing any required packages and run the servers.
3. Open your browser and go to: **[http://localhost:5174](http://localhost:5174)**

## Project Structure
- **`/backend`**: The Node.js, Express, Socket.io, and MongoDB server handling user authentication and real-time hardware events.
- **`/frontend`**: The React + Vite application with dynamic glassmorphism styling and Framer Motion animations.
- **`hardware_integration_guide.md`**: Contains the C++ (Arduino) and Python examples on how to connect your ESP32 and Raspberry Pi to this dashboard so that sensor hits map to the UI.

## Features Built:
1. User Registration & Login (JSON Web Tokens)
2. Realtime Device Status Tracking (`Active` / `Offline`)
3. Realtime Note Visualization (Dynamic pulsing UI mapped to Instrument + Note)
4. Session tracking (Starts and records practice time, instrument preferences, and notes played)
5. User Dashboard (Displays historical session statistics)
