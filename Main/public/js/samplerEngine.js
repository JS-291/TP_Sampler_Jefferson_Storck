import { loadAndDecodeSound } from "./soundutils.js";

export class SamplerEngine {
  constructor(audioCtx) {
    this.audioCtx = audioCtx;
    this.slots = [];
  }

  async loadPreset(preset) {
    if (!preset || !preset.samples) return;

    const soundURLs = preset.samples.map(sample =>
      `http://localhost:3000/presets/${sample.url.replace(/^\.\//, "")}`
    );

    const decodedBuffers = await Promise.all(
      soundURLs.map(url => loadAndDecodeSound(url, this.audioCtx))
    );

    this.slots = decodedBuffers.map((buffer, i) => ({
      name: preset.samples[i].name || `Sound ${i + 1}`,
      buffer
    }));
  }

  play(index) {
    const slot = this.slots[index];
    if (!slot || !slot.buffer) return;

    const source = this.audioCtx.createBufferSource();
    source.buffer = slot.buffer;
    source.connect(this.audioCtx.destination);
    source.start();
    return source;
  }

  getSlots() {
    return this.slots;
  }
}