# Deployment Checklist: Realtime Hardware Integration

Before merging this branch and deploying to production, follow these steps to ensure safety and stability.

## 1. Backend Verification
- [ ] Ensure `.env` is NOT checked into source control.
- [ ] Add `PI_DEVICE_TOKEN` to your Vercel (or Render/Heroku) environment variables.
- [ ] Add `FRONTEND_URL` to your backend environment variables to properly configure CORS.
- [ ] Verify that `server.js` listens correctly on the configured port.
- [ ] Run backend unit/integration tests.

## 2. Frontend Verification
- [ ] Ensure `.env` is NOT checked into source control.
- [ ] Add `VITE_SOCKET_URL` to Vercel environment variables pointing to the live backend.
- [ ] Verify that Dashboard and Live Session use `hardwareState` properly.
- [ ] Ensure legacy API features (tutorials/games) still work using backwards-compatible `currentNote`.

## 3. Raspberry Pi Verification
- [ ] Copy `raspberry_pi/` scripts to the Pi.
- [ ] Install dependencies with `pip install -r requirements.txt`.
- [ ] Create a `.env` file on the Pi with the LIVE `SOCKET_URL` and `PI_DEVICE_TOKEN`.
- [ ] Install the `syntronics.service` systemd file and ensure it runs on boot.
- [ ] Restart Pi and ensure it connects to the cloud automatically.

## 4. End-to-End Testing
- [ ] Open the deployed frontend on a phone or laptop.
- [ ] Log in with a valid user account.
- [ ] Check Dashboard for "System Online (Pi)".
- [ ] Play a note on the hardware controller and verify it appears on the screen in less than 50ms.
