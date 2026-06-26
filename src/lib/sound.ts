// Lightweight Web-Audio sound effects — no asset files, crisp & subtle.
let ctx: AudioContext | null = null;
let enabled = true;

export const setSoundEnabled = (v: boolean) => {
  enabled = v;
  try { localStorage.setItem("pps_sound", v ? "1" : "0"); } catch {}
};
export const getSoundEnabled = () => {
  try { return localStorage.getItem("pps_sound") !== "0"; } catch { return true; }
};
enabled = getSoundEnabled();

function ac() {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.06, delay = 0, sweep?: number) {
  if (!enabled) return;
  try {
    const a = ac();
    const o = a.createOscillator();
    const g = a.createGain();
    const t = a.currentTime + delay;
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (sweep) o.frequency.exponentialRampToValueAtTime(sweep, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + dur + 0.02);
  } catch {}
}

export const sfx = {
  click: () => tone(420, 0.05, "triangle", 0.035),
  tap: () => tone(660, 0.04, "sine", 0.03),
  send: () => tone(540, 0.08, "sine", 0.05, 0, 760),
  receive: () => { tone(680, 0.09, "sine", 0.055); tone(880, 0.09, "sine", 0.04, 0.06); },
  success: () => { tone(523, 0.1, "sine", 0.05); tone(659, 0.1, "sine", 0.05, 0.08); tone(784, 0.16, "sine", 0.05, 0.16); },
  notify: () => { tone(880, 0.08, "triangle", 0.045); tone(1175, 0.12, "triangle", 0.04, 0.07); },
  hot: () => tone(300, 0.16, "sawtooth", 0.04, 0, 620),
  error: () => { tone(220, 0.16, "square", 0.04); tone(180, 0.18, "square", 0.04, 0.09); },
  ring: () => { tone(440, 0.2, "sine", 0.05); tone(480, 0.2, "sine", 0.05, 0.25); },
};
