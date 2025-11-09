import { playSound } from "./soundutils.js";

export class SamplerGUI {
  constructor(engine, containerId) {
    this.engine = engine;
    this.container = document.getElementById(containerId);
    this.padElements = [];
    this.playheadRequest = null;
  }

  renderPads() {
    this.container.innerHTML = "";
    this.padElements = [];

    this.engine.getSlots().forEach((slot) => {
      const padWrapper = document.createElement("div");
      padWrapper.classList.add("pad-wrapper");

      const button = document.createElement("button");
      button.textContent = slot.name;
      button.classList.add("pad");

      const trimBar = document.createElement("div");
      trimBar.classList.add("trim-bar");
      trimBar.style.display = "none";

      button.onclick = () => this.playSlot(slot, trimBar);

      padWrapper.appendChild(button);
      padWrapper.appendChild(trimBar);
      this.container.appendChild(padWrapper);

      this.padElements.push({ button, trimBar });
    });
  }

  playSlot(slot, trimBar) {
    trimBar.style.display = "block";
    const padWidth = trimBar.parentElement.clientWidth;

    const trim = slot.trim || { start: 0, end: 1 };
    const barStart = trim.start * padWidth;
    const barWidth = (trim.end - trim.start) * padWidth;

    trimBar.style.left = barStart + "px";
    trimBar.style.width = "0px";
    trimBar.style.transition = `width ${slot.buffer.duration}s linear`;
    requestAnimationFrame(() => {
      trimBar.style.width = barWidth + "px";
    });

    playSound(this.engine.audioCtx, slot.buffer, 0, slot.buffer.duration);

    const canvas = document.getElementById("waveformCanvas");
    if (canvas) {
      this.drawWaveform(slot.buffer, canvas);
      this.animatePlayhead(slot.buffer, canvas);
    }

    setTimeout(() => {
      trimBar.style.display = "none";
      trimBar.style.transition = "none";
      trimBar.style.width = "0px";
    }, slot.buffer.duration * 1000);
  }

  drawWaveform(buffer, canvas) {
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.fillStyle = "#ff3b3b";

    for (let i = 0; i < width; i++) {
      let min = 1.0, max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }
  }

  animatePlayhead(buffer, canvas) {
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const duration = buffer.duration;
    const startTime = this.engine.audioCtx.currentTime;

    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    const drawFrame = () => {
      const elapsed = this.engine.audioCtx.currentTime - startTime;
      const progress = elapsed / duration;
      if (progress >= 1) return;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#ff3b3b";
      for (let i = 0; i < width; i++) {
        let min = 1.0, max = -1.0;
        for (let j = 0; j < step; j++) {
          const datum = data[i * step + j];
          if (datum < min) min = datum;
          if (datum > max) max = datum;
        }
        ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
      }

      const playheadX = progress * width;
      ctx.strokeStyle = "white";
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      this.playheadRequest = requestAnimationFrame(drawFrame);
    };

    cancelAnimationFrame(this.playheadRequest);
    this.playheadRequest = requestAnimationFrame(drawFrame);
  }
}