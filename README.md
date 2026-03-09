# Development Diary - WebRTC Assignment

## ASCII Filter

> I followed this tutorial to implement a real-time ASCII filter on the video feed: https://medium.com/@mariotacke/building-a-real-time-ascii-camera-filter-in-plain-javascript-5b6e1f2f95f9

Github link to tutorial code: https://github.com/mariotacke/blog-real-time-ascii-camera-filter


## Connection Setup

> Used the `p04-simple-peer` example as a reference for setting up the WebRTC connection between the sender and receiver. The sender (laptop) initializes the peer connection and generates the QR code, while the receiver (phone) connects to the sender using the QR code and receives the video stream.

## Trouble

> The connection was being established, but the video stream was not showing on the receiver. Tried fixing this issue with the use of AI, but I did not keep correct track of my versions with git. Then I made a few mistakes trying to recover the working version, and I could not find latest version anymore. On consult Wouter helped me to reset my github repository so I could start fresh and keep better track of my changes with git. I will now try to implement the connection again, but this time I will make sure to commit more often and keep better track of my changes.


