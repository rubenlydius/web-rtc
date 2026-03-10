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