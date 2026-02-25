// Web Audio API — programmatic sound effects (no external files needed)

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function tone(freq, type, duration, gain = 0.3, delay = 0) {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const vol = ac.createGain();
  osc.connect(vol);
  vol.connect(ac.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + delay);
  vol.gain.setValueAtTime(gain, ac.currentTime + delay);
  vol.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + duration);
  osc.start(ac.currentTime + delay);
  osc.stop(ac.currentTime + delay + duration);
}

function noise(duration, gain = 0.15) {
  const ac = getCtx();
  const bufLen = ac.sampleRate * duration;
  const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const vol = ac.createGain();
  vol.gain.setValueAtTime(gain, ac.currentTime);
  vol.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  src.connect(vol);
  vol.connect(ac.destination);
  src.start();
  src.stop(ac.currentTime + duration);
}

export const sounds = {
  cardDeal() {
    noise(0.08, 0.12);
    tone(900, 'sine', 0.06, 0.1);
  },
  chipPlace() {
    tone(1200, 'triangle', 0.08, 0.2);
    tone(900,  'triangle', 0.06, 0.1, 0.04);
  },
  win() {
    tone(523, 'sine', 0.12, 0.25);
    tone(659, 'sine', 0.12, 0.25, 0.13);
    tone(784, 'sine', 0.2,  0.3,  0.26);
  },
  lose() {
    tone(300, 'sawtooth', 0.15, 0.2);
    tone(220, 'sawtooth', 0.2,  0.2, 0.15);
    tone(180, 'sawtooth', 0.25, 0.2, 0.32);
  },
  blackjack() {
    [0, 0.1, 0.2, 0.3, 0.4].forEach((d, i) => {
      tone(523 + i * 100, 'sine', 0.15, 0.3, d);
    });
    tone(1047, 'sine', 0.4, 0.4, 0.55);
  },
  bust() {
    tone(400, 'sawtooth', 0.1, 0.25);
    tone(300, 'sawtooth', 0.1, 0.25, 0.12);
    tone(200, 'sawtooth', 0.2, 0.3,  0.25);
  },
  dealerReveal() {
    noise(0.06, 0.1);
    tone(660, 'sine', 0.08, 0.15);
  },
  shuffle() {
    for (let i = 0; i < 6; i++) noise(0.06, 0.08 + Math.random() * 0.06);
  },
  split() {
    tone(880, 'triangle', 0.1, 0.2);
    tone(660, 'triangle', 0.1, 0.2, 0.12);
  },
  push() {
    tone(440, 'sine', 0.18, 0.2);
  },
};

export function play(name) {
  if (!sounds[name]) return;
  try { sounds[name](); } catch (_) { /* AudioContext not ready */ }
}
