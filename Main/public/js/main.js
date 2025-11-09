import { SamplerEngine } from "./samplerEngine.js";
import { SamplerGUI } from "./samplerGUI.js";

let audioCtx;
let engine;
let gui;
let presets = [];

window.onload = async () => {
  audioCtx = new AudioContext();
  engine = new SamplerEngine(audioCtx);
  gui = new SamplerGUI(engine, "padsContainer");

  await loadPresets();
};

async function loadPresets() {
  const dropdown = document.getElementById("presetDropdown");
  const response = await fetch("http://localhost:3000/api/presets");
  presets = await response.json();

  dropdown.querySelectorAll("option:not([value=''])").forEach(opt => opt.remove());

  presets.forEach(preset => {
    const option = document.createElement("option");
    option.value = preset.name;
    option.textContent = preset.name;
    dropdown.appendChild(option);
  });
}

document.getElementById("presetDropdown").addEventListener("change", async (e) => {
  const selectedName = e.target.value;
  if (!selectedName) return;

  const preset = presets.find(p => p.name === selectedName);
  if (!preset) return console.warn("Preset not found:", selectedName);

  await engine.loadPreset(preset);
  gui.renderPads();
});