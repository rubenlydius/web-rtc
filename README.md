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

2. Sender.html (The Phone)
Automated Peer Identification: Removed the manual <select> dropdown. Replaced it with URLSearchParams to automatically grab the receiverId from the URL scanned via the QR code.

Instant Initiation: Added logic to trigger callPeer() as soon as the camera stream is ready and the socket connects, removing the need for user interaction.

Camera Optimization: Updated constraints to facingMode: "environment", ensuring the phone defaults to the back camera for a better scanning experience.

Role Shift: The phone was set as the Initiator (initiator: true), meaning it creates the "offer" that the laptop then answers.


## Added ASCII Filter
> WIP