# Development Diary - WebRTC Assignment

## ASCII Filter

> I followed this tutorial to implement a real-time ASCII filter on the video feed: https://medium.com/@mariotacke/building-a-real-time-ascii-camera-filter-in-plain-javascript-5b6e1f2f95f9

Github link to tutorial code: https://github.com/mariotacke/blog-real-time-ascii-camera-filter


## Connection Setup

> Used the `p04-simple-peer` example as a reference for setting up the WebRTC connection between the sender and receiver. The sender (laptop) initializes the peer connection and generates the QR code, while the receiver (phone) connects to the sender using the QR code and receives the video stream.

## Trouble

> The connection was being established, but the video stream was not showing on the receiver. Tried fixing this issue with the use of AI, but I did not keep correct track of my versions with git. Then I made a few mistakes trying to recover the working version, and I could not find latest version anymore. On consult Wouter helped me to reset my github repository so I could start fresh and keep better track of my changes with git. I will now try to implement the connection again, but this time I will make sure to commit more often and keep better track of my changes.


## Phone to Laptop 
> Successfully implemented the connection to send phone camera feed to laptop. Asked AI for help to go from the simple peer version to the version with QR code.
> Did the following steps:
1. Receiver.html (The Laptop)
Integrated QR Library: Added the Kazuhiko Arase qrcode-generator script.

Dynamic URL Generation: Instead of just waiting for a connection, the laptop now identifies its own socket.id and bakes it into a URL: https://[IP]/sender.html?receiverId=[socket.id].

QR Rendering: Added logic to convert that URL into a scannable QR code on the screen.

Role Shift: The laptop was changed from a general peer to a dedicated Answerer. It waits for an "offer" from the phone before creating the Peer object.

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebRTC - Receiver</title>
  <style>
    body { font-family: sans-serif; text-align: center; }
    video { max-width: 100%; height: auto; background: #000; }
    #qrcode { margin: 20px auto; padding: 10px; display: inline-block; background: white; }
  </style>
</head>
<body>
  <h1>Laptop Display (Receiver)</h1>
  <p>Scan this QR code with your phone:</p>
  <div id="qrcode"></div>
  <br>
  <video id="otherCamera" playsinline autoplay muted></video>

  <script src="/socket.io/socket.io.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/simple-peer/9.11.1/simplepeer.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>

  <script type="module">
    const $otherCamera = document.getElementById('otherCamera');
    const $qrContainer = document.getElementById('qrcode');

    let socket;
    let peer;

    const init = async () => {
      initSocket();
    };

    const initSocket = () => {
      socket = io.connect(`/`);
      socket.on(`connect`, () => {
        console.log("My Socket ID:", socket.id);
        
        // Generate the URL for the phone, including this laptop's socket.id
        const senderUrl = `${window.location.origin}/sender.html?receiverId=${socket.id}`;
        
        // Create and render the QR Code
        const qr = qrcode(0, 'L');
        qr.addData(senderUrl);
        qr.make();
        $qrContainer.innerHTML = qr.createImgTag(6);
      });

      socket.on('signal', async (myId, signal, peerId) => {
        console.log(`Received signal from ${peerId}`);
        if (signal.type === 'offer') {
          // Hide QR code once connection starts
          $qrContainer.style.display = 'none'; 
          answerPeerOffer(myId, signal, peerId);
        } else if (peer) {
          peer.signal(signal);
        }
      });
    };

    const answerPeerOffer = async (myId, offer, peerId) => {
      // The laptop is not the initiator, it just answers
      peer = new SimplePeer({ initiator: false });
      
      peer.on('signal', data => {
        socket.emit('signal', peerId, data);
      });
      
      peer.on('stream', stream => {
        $otherCamera.srcObject = stream;
      });

      // Pass the initial offer to the peer
      peer.signal(offer);
    };

    init();
  </script>
</body>
</html>

2. Sender.html (The Phone)
Automated Peer Identification: Removed the manual <select> dropdown. Replaced it with URLSearchParams to automatically grab the receiverId from the URL scanned via the QR code.

Instant Initiation: Added logic to trigger callPeer() as soon as the camera stream is ready and the socket connects, removing the need for user interaction.

Camera Optimization: Updated constraints to facingMode: "environment", ensuring the phone defaults to the back camera for a better scanning experience.

Role Shift: The phone was set as the Initiator (initiator: true), meaning it creates the "offer" that the laptop then answers.

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WebRTC - Sender</title>
  <style>
    body { font-family: sans-serif; text-align: center; background: #222; color: white; }
    video { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  <h1>Phone Camera (Sender)</h1>
  <video id="myCamera" playsinline autoplay muted></video>

  <script src="/socket.io/socket.io.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/simple-peer/9.11.1/simplepeer.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script type="module">

    const $myCamera = document.getElementById('myCamera');

    let socket;
    let myStream;
    let peer;

    // Get the target laptop ID from the URL scanned via QR
    const urlParams = new URLSearchParams(window.location.search);
    const receiverId = urlParams.get('receiverId');

    const init = async () => {
      if (!receiverId) {
        alert("No receiver ID found. Please scan the QR code from the laptop.");
        return;
      }

      // Grab the phone's back camera
      const constraints = { audio: false, video: { facingMode: "environment", width: 1280, height: 720 } };
      try {
        myStream = await navigator.mediaDevices.getUserMedia(constraints);
        $myCamera.srcObject = myStream;
        $myCamera.onloadedmetadata = () => $myCamera.play();
        
        // Once camera is ready, connect to socket
        initSocket();
      } catch (err) {
        console.error("Camera access denied or unavailable", err);
        alert("Camera access is required.");
      }
    };

    const initSocket = () => {
      socket = io.connect('/');
      
      socket.on('connect', () => {
        console.log("Connected to server, initiating call to:", receiverId);
        callPeer(receiverId);
      });

      socket.on('signal', async (myId, signal, peerId) => {
        console.log(`Received signal from ${peerId}`);
        peer.signal(signal);
      });
    };

    const callPeer = async (peerId) => {
      // The phone is the initiator
      peer = new SimplePeer({ initiator: true, stream: myStream });
      
      peer.on('signal', data => {
        socket.emit('signal', peerId, data);
      });
    };

    init();

  </script>
</body>
</html>

## Added ASCII Filter
> Asked AI for help to add the ASCII filter to the video stream. I chose to keep the filter in a seperate file (ascii.js) and import it in the sender.html file. The filter is applied to the video stream before it is displayed on the laptop.

- ascii.js

export const drawASCII = (video, hiddenCtx, outputCtx, fontHeight = 12) => {
  const { videoWidth: width, videoHeight: height } = video;
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&()/\\+<>';

  if (width && height) {
    if (hiddenCtx.canvas.width !== width) {
      hiddenCtx.canvas.width = outputCtx.canvas.width = width;
      hiddenCtx.canvas.height = outputCtx.canvas.height = height;
    }

    hiddenCtx.drawImage(video, 0, 0, width, height);
    outputCtx.textBaseline = 'top';
    outputCtx.font = `${fontHeight}px Consolas`;

    const fontWidth = Math.ceil(outputCtx.measureText('@').width);
    outputCtx.clearRect(0, 0, width, height);

    for (let y = 0; y < height; y += fontHeight) {
      for (let x = 0; x < width; x += fontWidth) {
        const frameSection = hiddenCtx.getImageData(x, y, fontWidth, fontHeight);
        
        // Inline Average RGB calculation
        const data = frameSection.data;
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]; g += data[i+1]; b += data[i+2];
        }
        const count = data.length / 4;
        const char = charset[Math.floor(Math.random() * charset.length)];

        outputCtx.fillStyle = `rgb(${r/count},${g/count},${b/count})`;
        outputCtx.fillText(char, x, y);
      }
    }
  }
};

- sender.html (updated)

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebRTC - Receiver</title>
    <style>
        body { font-family: sans-serif; text-align: center; background: #000; color: white; margin: 0; }
        /* Keep video hidden so we only see the ASCII */
        #otherCamera, #hiddenCanvas { display: none; }
        #outputCanvas { width: 100vw; height: auto; display: block; }
        #qrcode { margin: 20px auto; padding: 10px; display: inline-block; background: white; }
    </style>
</head>
<body>
    <div id="ui-layer">
        <h1>Laptop Display (Receiver)</h1>
        <p>Scan this QR code with your phone:</p>
        <div id="qrcode"></div>
    </div>

    <video id="otherCamera" playsinline autoplay muted></video>
    <canvas id="hiddenCanvas"></canvas>
    <canvas id="outputCanvas"></canvas>

    <script src="/socket.io/socket.io.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/simple-peer/9.11.1/simplepeer.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>

    <script type="module">
        import { drawASCII } from './ascii-filter.js';

        const $otherCamera = document.getElementById('otherCamera');
        const $qrContainer = document.getElementById('qrcode');
        const hiddenCtx = document.getElementById('hiddenCanvas').getContext('2d', { willReadFrequently: true });
        const outputCtx = document.getElementById('outputCanvas').getContext('2d');

        let socket;
        let peer;

        const startFilterLoop = () => {
            drawASCII($otherCamera, hiddenCtx, outputCtx);
            requestAnimationFrame(startFilterLoop);
        };

        const init = async () => {
            initSocket();
            // Start the loop immediately; it will just draw nothing until the video starts
            startFilterLoop();
        };

        const initSocket = () => {
            socket = io.connect(`/`);
            socket.on(`connect`, () => {
                const senderUrl = `${window.location.origin}/sender.html?receiverId=${socket.id}`;
                const qr = qrcode(0, 'L');
                qr.addData(senderUrl);
                qr.make();
                $qrContainer.innerHTML = qr.createImgTag(6);
            });

            socket.on('signal', async (myId, signal, peerId) => {
                if (signal.type === 'offer') {
                    // Hide the UI text and QR once stream begins
                    document.getElementById('ui-layer').style.display = 'none';
                    answerPeerOffer(myId, signal, peerId);
                } else if (peer) {
                    peer.signal(signal);
                }
            });
        };

        const answerPeerOffer = async (myId, offer, peerId) => {
            peer = new SimplePeer({ initiator: false });
            peer.on('signal', data => {
                socket.emit('signal', peerId, data);
            });
            peer.on('stream', stream => {
                $otherCamera.srcObject = stream;
                $otherCamera.play();
            });
            peer.signal(offer);
        };

        init();
    </script>
</body>
</html>




## Terminal link
> Asked AI for help to add IP adress link into the terminal making it easier to access the project. 

const os = require('os');

server.listen(port, () => {
  const ip = Object.values(os.networkInterfaces()).flat().find(i => i.family === 'IPv4' && !i.internal)?.address || 'localhost';
  console.log(`Click here to open: https://${ip}:${port}/receiver.html`);
});




##color picker 

> make colors picker for filter, user selects color from phone and this is applied to the filter on the laptop. 

<style>
    body { background: #111; display: flex; align-items: center; min-height: 100vh; margin: 0; }
    #myCamera { display: none; }
    
    .slider-container { width: 100%; padding: 0 30px; }

    #hueSlider {
        -webkit-appearance: none;
        width: 100%;
        height: 25px;
        border-radius: 15px;
        /* The color spectrum background */
        background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);
        outline: none;
    }

    /* Removes the blue 'fill' on the left side in Chrome/Safari/mobile */
    #hueSlider::-webkit-slider-runnable-track { background: transparent; }

    #hueSlider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 40px;
        height: 40px;
        background: white;
        border-radius: 50%;
        border: 3px solid #111;
        cursor: pointer;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
    }
</style>


<body>
    <video id="myCamera" playsinline autoplay muted></video>

    <div class="slider-container">
        <input type="range" id="hueSlider" min="0" max="360" value="0">
    </div>

</body>


socket.on('connect', () => {
    // ... your callPeer logic ...
    
    const slider = document.getElementById('hueSlider');
    slider.addEventListener('input', () => {
        // Send the hue value to the specific receiverId
        socket.emit('update_color', receiverId, slider.value);
    });
});


socket.on('update_color', (to, hue) => {
    // Send the color value to the specific laptop
    socket.to(to).emit('update_color', hue);
});


let currentHue = 0; // Global variable

socket.on('update_color', (hue) => {
    currentHue = hue; // Update the color when the phone moves the slider
});

const startFilterLoop = () => {
    if ($otherCamera.videoWidth > 0) {
        // Ensure drawASCII is receiving currentHue
        drawASCII($otherCamera, hiddenCtx, outputCtx, currentHue);
    }
    requestAnimationFrame(startFilterLoop);
};


const $myCamera = document.getElementById('myCamera');
const $hueSlider = document.getElementById('hueSlider'); // Add this reference



const initSocket = () => {
    // ... (existing code, insert inside the connect callback) ...
    socket = io.connect('/');
    socket.on('connect', () => {
        console.log("Connected to server, initiating call to:", receiverId);

        // Add listener once connected
        $hueSlider.addEventListener('input', () => {
            // Emit new event 'update_color' with the Hue value
            socket.emit('update_color', receiverId, $hueSlider.value);
        });

        callPeer(receiverId);
    });
    // ... (rest of initSocket) ...
};


// Replacement drawASCII function for 'ascii-filter.js'
export const drawASCII = (video, hiddenCtx, outputCtx, baseHue = 0, fontHeight = 12) => {
  const { videoWidth: width, videoHeight: height } = video;
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&()/\\+<>';

  if (width && height) {
    if (hiddenCtx.canvas.width !== width) {
      hiddenCtx.canvas.width = outputCtx.canvas.width = width;
      hiddenCtx.canvas.height = outputCtx.canvas.height = height;
    }

    hiddenCtx.drawImage(video, 0, 0, width, height);
    outputCtx.textBaseline = 'top';
    outputCtx.font = `${fontHeight}px Consolas`;

    const fontWidth = Math.ceil(outputCtx.measureText('@').width);
    outputCtx.clearRect(0, 0, width, height);

    for (let y = 0; y < height; y += fontHeight) {
      for (let x = 0; x < width; x += fontWidth) {
        const frameSection = hiddenCtx.getImageData(x, y, fontWidth, fontHeight);
        
        // Calculate luminosity (grayscale)
        const data = frameSection.data;
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]; g += data[i+1]; b += data[i+2];
        }
        const count = data.length / 4;
        
        // Grayscale formula:
        const luminosity = (0.2126 * (r/count) + 0.7152 * (g/count) + 0.0722 * (b/count)) / 255; // Normalize 0-1

        const char = charset[Math.floor(Math.random() * charset.length)];

        // Map grayscale to Lightness (0% to 100%)
        const lightness = luminosity * 100;
        
        // Output HSL color: Incoming Hue, Max Saturation, Contrasting Lightness
        outputCtx.fillStyle = `hsl(${baseHue}, 100%, ${lightness}%)`;
        outputCtx.fillText(char, x, y);
      }
    }
  }
};



import { drawASCII } from './ascii-filter.js';
// ... existing references ...
let currentHue = 0; // Stored hue, defaults to Red

// Update the loop call to include the hue
const startFilterLoop = () => {
    if ($otherCamera.videoWidth > 0) {
        drawASCII($otherCamera, hiddenCtx, outputCtx, currentHue); // Add hue parameter
    }
    requestAnimationFrame(startFilterLoop);
};





const initSocket = () => {
    // ... (existing QR code and connect logic) ...
    socket.on(`connect`, () => { ... });

    // Listen for the color update event from the phone
    socket.on('update_color', (hue) => {
        console.log(`Received color: Hue=${hue}`);
        currentHue = hue; // Update local state
    });

    // ... rest of initSocket ...
};



## reset to qr code on disconnect 


const answerPeerOffer = async (myId, offer, peerId) => {
    peer = new SimplePeer({ initiator: false });

    // ... (keep your existing peer.on('signal') and peer.on('stream') lines) ...

    // ADD THESE LINES HERE:
    peer.on('close', () => {
        console.log("Peer disconnected, resetting...");
        location.reload(); 
    });

    peer.on('error', (err) => {
        console.error("Peer error:", err);
        location.reload();
    });

    peer.signal(offer);
};




socket.on('disconnect', () => {
    // Broadcast to everyone that this specific ID has left
    io.emit('peer_disconnected', socket.id);
});


socket.on('peer_disconnected', (disconnectedId) => {
    // If the QR code is currently hidden, it means we were in a session.
    // We reload to get back to the start state immediately.
    if ($qrContainer.style.display === 'none') {
        console.log("Peer left the building. Resetting now.");
        location.reload();
    }
});






## crop ratio to fit laptop screen better



    #outputCanvas {
        width: 75vw;         /* 75% of the screen width */
        aspect-ratio: 16 / 9; /* Standard widescreen ratio */
        background: #111;
        display: block;
        
        /* The Magic: This zooms into the vertical feed and crops 
           the top/bottom to fill the 16:9 box */
        object-fit: cover; 
        
        border: 2px solid #333;
    }




const startFilterLoop = () => {
    if ($otherCamera.videoWidth > 0) {
        // Lower fontHeight = smaller characters / more detail to compensate for zoom
        drawASCII($otherCamera, hiddenCtx, outputCtx, currentHue, 7); 
    }
    requestAnimationFrame(startFilterLoop);
};
