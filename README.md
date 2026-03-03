# Development Diary - ex1

## Project Overview

WebRTC sender-receiver connection between laptop and phone. The laptop acts as the server and displays a QR code that the phone scans to connect and receive the video stream.

---

## Session 1 - March 2, 2026

### User Prompt

> I would like to have a sender - receiver connection between my phone and laptop. adjust the files in the public (ex1) folder to make this work. laptop will act as the server, I will scan a qr code with my phone, the qr code is displayed on the laptop. take a look at the other folders for simple peer connection and also qr code folder to connect the 2.

### Changes Made

#### 1. Fixed `package.json`

- Added `start` script: `"start": "node index.js"`
- Added missing dependencies: `dotenv`, `socket.io`

#### 2. Fixed QR Code not displaying (`sender.html`)

- **Problem**: QR code wasn't appearing because `getUserMedia` was blocking socket initialization
- **Solution**: Moved `initSocket()` to run first, then camera permission request runs in parallel
- Changed QR code `typeNumber` from `4` to `0` (auto-detect) to handle longer URLs

#### 3. Fixed video stream not being received (`receiver.html`)

- **Problem**: Video stream stuck on "Requesting video stream..."
- **Solution**: Added wait loop in sender to ensure camera stream is ready before adding tracks to peer connection

#### 4. Fixed ICE candidate race condition (both files)

- **Problem**: ICE candidates could arrive before `setRemoteDescription` completed
- **Solution**: Added `pendingCandidates` array to queue candidates, then process them after remote description is set

#### 5. Improved NAT traversal

- Added additional STUN servers for better connectivity:
  - `stun:stun.l.google.com:19302`
  - `stun:stun1.l.google.com:19302`
  - `stun:stun2.l.google.com:19302`

---

## Session 2 - March 3, 2026

### User Prompt

> When scanning the QR code, there is an issue when connecting the phone camera to the laptop server. Video stream not showing on receiver.

### Problem Analysis

The original implementation used raw WebRTC APIs which had several issues:

- Complex offer/answer negotiation prone to race conditions
- Track negotiation order issues
- Mobile browsers blocking autoplay without user interaction
- Socket ID becoming stale if sender page was refreshed after QR generation

### Changes Made

#### 1. Switched to SimplePeer library (both files)

- **Replaced** raw RTCPeerConnection with SimplePeer for simpler, more reliable WebRTC handling
- SimplePeer handles ICE candidates, offer/answer, and track negotiation internally
- Matches the working `p04-simple-peer` implementation pattern

#### 2. Changed connection flow

- **Before**: Receiver created offer → Sender answered
- **After**: Receiver notifies sender via `receiverReady` event → Sender (initiator) creates offer
- This matches the standard WebRTC pattern where the stream provider initiates

#### 3. Added "Start" button on receiver (`receiver.html`)

- Mobile browsers require user interaction before allowing media playback
- User must tap "Start Receiving Video" button to initiate connection
- Satisfies autoplay policy requirements

#### 4. Added visible Socket ID display (`sender.html`)

- Shows current Socket ID below QR code
- Helps verify QR code hasn't become stale
- Shows "DISCONNECTED" warning if socket drops

#### 5. Added debug log panel (`receiver.html`)

- Visible debug log on phone to see connection status without console
- Shows: socket connection, signals sent/received, stream events, errors
- Helps diagnose connection issues on mobile devices

#### 6. Updated server signaling (`index.js`)

- Added `receiverReady` event handler to notify sender when receiver connects
- Unified `signal` event for all SimplePeer signaling (offers, answers, ICE candidates)

### Key Files Modified

- `public/sender.html` - SimplePeer initiator with QR code
- `public/receiver.html` - SimplePeer receiver with Start button and debug log
- `index.js` - Added `receiverReady` and `signal` socket events

---

## How to Run

1. Install dependencies:

   ```bash
   cd ex1
   npm install
   ```

2. Start the server:

   ```bash
   npm start
   ```

3. Open sender page using your **local IP address** (not localhost):
   - The server will print available URLs on startup
   - Example: `http://192.168.x.x:443/sender.html`

4. Verify the Socket ID is displayed below the QR code

5. Scan the QR code with your phone (must be on same WiFi network)

6. Tap "Start Receiving Video" button on your phone

7. The video stream should appear on your phone

### Troubleshooting

- **QR code not working**: Make sure the Socket ID on the sender page matches the ID in the QR code URL
- **No signal received**: The sender page may have been refreshed - generate a new QR code
- **Connection failed**: Ensure both devices are on the same WiFi network
- **Video not playing**: Tap the video element on the phone to trigger playback

Used this toturial as reference for filter of video feed: https://medium.com/@mariotacke/building-a-real-time-ascii-camera-filter-in-plain-javascript-5b6e1f2f95f9
