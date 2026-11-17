/* Partículas e efeitos: poeira de construção, valores flutuantes, ícones de produtos, brilhos e confete. */
(function () {
  'use strict';
  const M = window.MST, U = M.U;
  const FX = (M.fx = { parts: [], screen: [] });
  const MAX = () => (M.settings.quality === 'baixa' ? 80 : M.settings.quality === 'media' ? 180 : 320);

  function push(p) { if (FX.parts.length < MAX()) FX.parts.push(p); }
  const mine = (s) => s && s.id === M.S.curId;

  FX.dust = function (s, x, y) {
    if (!mine(s)) return;
    for (let i = 0; i < 7; i++) push({ k: 'dust', x: x + U.rnd(-0.4, 0.4), y: y + U.rnd(-0.3, 0.3), vx: U.rnd(-0.8, 0.8), vy: U.rnd(-1, -0.2), t: 0, life: U.rnd(0.5, 0.9), r: U.rnd(3, 7) });
    push({ k: 'ring', x, y, t: 0, life: 0.45 });
  };
  FX.money = function (s, x, y, v) { if (!mine(s)) return; push({ k: 'text', x, y, vy: -0.9, t: 0, life: 1.3, txt: '+' + U.money(v), col: '#2f9e44' }); };
  FX.text = function (s, x, y, txt, col) { if (!mine(s)) return; push({ k: 'text', x, y, vy: -0.7, t: 0, life: 1.4, txt, col: col || '#1c7ed6' }); };
  FX.item = function (s, x, y, pid) { if (!mine(s)) return; push({ k: 'item', x, y: y - 0.8, vy: -0.5, t: 0, life: 0.7, pid }); };
  FX.sparkle = function (s, x, y) { if (!mine(s)) return; for (let i = 0; i < 6; i++) push({ k: 'spark', x: x + U.rnd(-0.5, 0.5), y: y + U.rnd(-0.6, 0.1), vx: 0, vy: -0.4, t: 0, life: U.rnd(0.4, 0.8) }); };
  FX.pop = function (s, o) { if (!mine(s)) return; const f = M.path.footprint(o); push({ k: 'shine', x: o.x, y: o.y, w: f[0], h: f[1], t: 0, life: 0.5 }); };
  FX.confetti = function () {
    const cols = ['#ffd43b', '#ff6b6b', '#51cf66', '#4dabf7', '#cc5de8', '#ff922b'];
    for (let i = 0; i < 140; i++) FX.screen.push({ x: Math.random(), y: -0.05 - Math.random() * 0.3, vx: U.rnd(-0.08, 0.08), vy: U.rnd(0.25, 0.5), r: Math.random() * 6, vr: U.rnd(-6, 6), c: U.pick(cols), t: 0, life: 3.5 });
  };

  FX.update = function (dt) {
    for (let i = FX.parts.length - 1; i >= 0; i--) {
      const p = FX.parts[i]; p.t += dt;
      if (p.vx) p.x += p.vx * dt; if (p.vy) p.y += p.vy * dt;
      if (p.t >= p.life) FX.parts.splice(i, 1);
    }
    for (let i = FX.screen.length - 1; i >= 0; i--) {
      const p = FX.screen[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
      if (p.t >= p.life || p.y > 1.1) FX.screen.splice(i, 1);
    }
  };

  // desenho no espaço do mundo da loja (px, zoom aplicado)
  FX.draw = function (c, T) {
    for (const p of FX.parts) {
      const k = p.t / p.life, a = 1 - k;
      if (p.k === 'dust') { c.fillStyle = 'rgba(200,190,170,' + a * 0.8 + ')'; c.beginPath(); c.arc(p.x * T, p.y * T, p.r * (1 + k), 0, 6.283); c.fill(); }
      else if (p.k === 'ring') { c.strokeStyle = 'rgba(255,255,255,' + a + ')'; c.lineWidth = 3; c.beginPath(); c.arc(p.x * T, p.y * T, 6 + k * 34, 0, 6.283); c.stroke(); }
      else if (p.k === 'text') {
        c.globalAlpha = Math.min(1, a * 1.6); c.font = '900 13px Nunito, system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.lineWidth = 4; c.strokeStyle = '#fff'; c.strokeText(p.txt, p.x * T, p.y * T - 30); c.fillStyle = p.col; c.fillText(p.txt, p.x * T, p.y * T - 30); c.globalAlpha = 1;
      } else if (p.k === 'item') { c.globalAlpha = a; M.sprites.draw(c, p.pid, p.x * T, p.y * T - 10, 16 + k * 4); c.globalAlpha = 1; }
      else if (p.k === 'spark') { c.fillStyle = 'rgba(180,230,255,' + a + ')'; const r = 3 * (1 - k) + 1; c.fillRect(p.x * T - r, p.y * T - 0.5, r * 2, 1.5); c.fillRect(p.x * T - 0.5, p.y * T - r, 1.5, r * 2); }
      else if (p.k === 'shine') { c.fillStyle = 'rgba(255,255,255,' + a * 0.45 + ')'; c.fillRect(p.x * T, p.y * T - 10, p.w * T, p.h * T); }
    }
  };
  FX.drawScreen = function (c, w, h) {
    for (const p of FX.screen) {
      c.save(); c.globalAlpha = Math.min(1, (p.life - p.t) * 2); c.translate(p.x * w, p.y * h); c.rotate(p.r);
      c.fillStyle = p.c; c.fillRect(-4, -2.5, 8, 5); c.restore();
    }
  };
})();
