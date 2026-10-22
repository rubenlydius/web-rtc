# WebRTC ASCII Camera

Stream your phone's camera to your laptop over WebRTC and render it as a live ASCII filter. The phone acts as a remote control for color, font size, camera flip and taking a picture.

Runs locally only: laptop and phone must be on the same Wi-Fi network.

## Getting started

1. On the laptop, install dependencies and start the server:

   ```
   npm i
   npm run dev
   ```

   You need a `.env` file with `NODE_ENV=development` and a `localhost.key` / `localhost.crt` pair in the project root. These are not in the repo, and the server needs them to run over HTTPS, which browsers require for camera access.

2. Open the link printed in the terminal (`https://<your-ip>:443/receiver.html`) on the laptop. The browser will warn about the self-signed certificate: accept it and continue.
3. Scan the QR code on the laptop screen with your phone. Accept the certificate warning on the phone too, and allow camera access.
4. The phone's camera feed appears on the laptop as ASCII. Use the controls on the phone to change the color and font size, flip between the front and rear cameras, or save a picture.

## How it works

- **Server (`index.js`)**: An Express + Socket.io server over HTTPS. It serves the `public` folder and relays WebRTC signaling messages and control events (color, size, photo) between the two devices.
- **Receiver (`receiver.html`, laptop)**: Connects to the server, puts its socket id into a URL, and shows that URL as a QR code. When the stream arrives, it hides the QR code and draws each video frame as ASCII characters on a canvas. If the phone disconnects, the QR code comes back.
- **Sender (`sender.html`, phone)**: Reads the receiver id from the scanned URL, opens the camera, and sets up a peer-to-peer connection with [simple-peer](https://github.com/feross/simple-peer). The video goes directly from phone to laptop; only the signaling and control messages go through the server.

## References

- ASCII filter tutorial: [Building a real-time ASCII camera filter in plain JavaScript](https://medium.com/@mariotacke/building-a-real-time-ascii-camera-filter-in-plain-javascript-5b6e1f2f95f9) ([code](https://github.com/mariotacke/blog-real-time-ascii-camera-filter))
- Connection setup based on the `p04-simple-peer` course example
- QR codes generated with [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator)
