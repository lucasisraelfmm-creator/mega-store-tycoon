/* Áudio sintetizado com Web Audio: trilha ambiente procedural (sem arquivos externos) e efeitos sonoros.
   Volumes de música e efeitos são independentes e salvos nas configurações. */
(function () {
  'use strict';
  const M = window.MST;
  const A = (M.audio = { ctx: null, ok: false });
  let master, musicG, sfxG, noiseBuf, timer = null, nextT = 0, step = 0;

  A.init = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      A.ctx = new AC();
      master = A.ctx.createGain(); master.gain.value = 0.9; master.connect(A.ctx.destination);
      const comp = A.ctx.createDynamicsCompressor(); comp.connect(master);
      musicG = A.ctx.createGain(); musicG.connect(comp);
      sfxG = A.ctx.createGain(); sfxG.connect(comp);
      noiseBuf = A.ctx.createBuffer(1, A.ctx.sampleRate * 0.5, A.ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      A.ok = true; A.setVolumes();
      A.startMusic();
    } catch (e) { console.warn('Áudio indisponível', e); }
  };
  A.setVolumes = function () {
    if (!A.ok) return;
    musicG.gain.setTargetAtTime(M.settings.music * 0.32, A.ctx.currentTime, 0.1);
    sfxG.gain.setTargetAtTime(M.settings.sfx * 0.6, A.ctx.currentTime, 0.05);
  };

  function tone(type, f, t0, dur, vol, dest, f2, attack) {
    const o = A.ctx.createOscillator(), g = A.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + (attack || 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || sfxG); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur, vol, freq, q, dest, type) {
    const s = A.ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = A.ctx.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1;
    const g = A.ctx.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(dest || sfxG); s.start(t0); s.stop(t0 + dur + 0.02);
  }

  const last = {};
  A.sfx = function (name) {
    if (!A.ok || M.settings.sfx <= 0) return;
    const now = A.ctx.currentTime;
    if (last[name] && now - last[name] < (name === 'cash' ? 0.12 : 0.04)) return;
    last[name] = now;
    const t = now + 0.005;
    switch (name) {
      case 'click': tone('triangle', 880, t, 0.06, 0.25); break;
      case 'hover': tone('sine', 1320, t, 0.03, 0.06); break;
      case 'open': tone('sine', 520, t, 0.09, 0.2, null, 780); break;
      case 'close': tone('sine', 700, t, 0.08, 0.16, null, 460); break;
      case 'cash': tone('square', 1568, t, 0.08, 0.12); tone('square', 2093, t + 0.07, 0.22, 0.12); noise(t, 0.12, 0.25, 5000, 2); break;
      case 'coin': tone('square', 988, t, 0.07, 0.1); tone('square', 1319, t + 0.06, 0.2, 0.1); break;
      case 'buy': tone('triangle', 660, t, 0.08, 0.22); tone('triangle', 990, t + 0.07, 0.12, 0.2); break;
      case 'build': noise(t, 0.09, 0.6, 400, 0.8); tone('sine', 140, t, 0.12, 0.5, null, 70); noise(t + 0.13, 0.08, 0.4, 600, 0.8); tone('sine', 170, t + 0.13, 0.1, 0.35, null, 80); break;
      case 'demolish': noise(t, 0.35, 0.7, 250, 0.5, null, 'lowpass'); tone('sawtooth', 120, t, 0.3, 0.15, null, 50); break;
      case 'error': tone('square', 220, t, 0.12, 0.12); tone('square', 180, t + 0.1, 0.16, 0.12); break;
      case 'notify': tone('sine', 1046, t, 0.12, 0.15); tone('sine', 1568, t + 0.08, 0.2, 0.12); break;
      case 'mission': [784, 988, 1175, 1568].forEach((f, i) => tone('triangle', f, t + i * 0.07, 0.25, 0.18)); break;
      case 'levelup': [523, 659, 784, 1046, 1318].forEach((f, i) => tone('square', f, t + i * 0.09, 0.3, 0.09)); [523, 659, 784].forEach((f) => tone('triangle', f, t + 0.5, 0.9, 0.12)); break;
      case 'truck': tone('sawtooth', 311, t, 0.18, 0.08); tone('sawtooth', 370, t, 0.18, 0.08); tone('sawtooth', 311, t + 0.25, 0.28, 0.08); tone('sawtooth', 370, t + 0.25, 0.28, 0.08); break;
      case 'door': tone('sine', 1760, t, 0.05, 0.04); break;
    }
  };

  // ---------- trilha procedural (lo-fi bossa) ----------
  const BPM = 88, STEP = 60 / BPM / 2; // colcheias
  const PROG = [ // acordes (MIDI) — Cmaj7, Am7, Dm7, G7, Em7, A7, Dm7, G7
    [48, 55, 59, 64], [45, 52, 55, 60], [50, 57, 60, 65], [43, 50, 53, 59],
    [52, 55, 59, 62], [45, 52, 55, 61], [50, 57, 60, 65], [43, 50, 53, 59],
  ];
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function schedule() {
    if (!A.ok) return;
    while (nextT < A.ctx.currentTime + 0.25) {
      const bar = Math.floor(step / 8) % PROG.length, b = step % 8, ch = PROG[bar], t = nextT;
      if (M.settings.music > 0) {
        if (b === 0) { // pad
          for (let i = 1; i < 4; i++) tone('triangle', mtof(ch[i] + 12), t, STEP * 7.6, 0.045, musicG, null, 0.25);
          tone('sine', mtof(ch[0] - 12), t, STEP * 3.5, 0.16, musicG, null, 0.02);
        }
        if (b === 3 || b === 6) tone('sine', mtof(ch[0] - 12 + (b === 6 ? 7 : 0)), t, STEP * 1.8, 0.11, musicG);
        // arpejo suave
        const arp = [1, 2, 3, 2, 1, 3, 2, 3];
        if ((step * 7) % 5 !== 0) tone('sine', mtof(ch[arp[b]] + 24), t, STEP * 1.4, 0.035, musicG);
        // percussão leve
        noise(t, 0.04, b % 2 ? 0.05 : 0.09, 8000, 1, musicG, 'highpass');
        if (b === 2 || b === 5) noise(t, 0.08, 0.07, 1800, 1.2, musicG);
      }
      nextT += STEP; step++;
    }
  }
  A.startMusic = function () {
    if (!A.ok || timer) return;
    nextT = A.ctx.currentTime + 0.1;
    timer = setInterval(schedule, 60);
  };
  document.addEventListener('visibilitychange', () => {
    if (!A.ctx) return;
    if (document.hidden) A.ctx.suspend(); else A.ctx.resume();
  });
})();
