/* Ponto de entrada: inicialização, loop de animação, câmeras e entrada (mouse, teclado e toque). */
(function () {
  'use strict';
  const M = window.MST, U = M.U, T = 32;
  let cv, ctx, dpr = 1, last = 0, fpsAcc = 0, fpsN = 0;

  M.R.cams = { store: { x: 300, y: 300, z: 1 }, world: { x: 1600, y: 900, z: 0.8 }, menu: { x: 1500, y: 900, z: 0.9 } };

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    M.R.vw = window.innerWidth; M.R.vh = window.innerHeight;
    cv.width = Math.round(M.R.vw * dpr); cv.height = Math.round(M.R.vh * dpr);
    cv.style.width = M.R.vw + 'px'; cv.style.height = M.R.vh + 'px';
  }

  function boot() {
    try {
      M.save.loadSettings();
      M.sprites.build();
      cv = document.getElementById('cv'); ctx = cv.getContext('2d');
      resize(); window.addEventListener('resize', resize);
      M.world.generate(20260517);
      M.ui.init();
      bindInput();
      M.ui.showMenu();
      document.getElementById('boot').remove();
      requestAnimationFrame(frame);
    } catch (e) {
      console.error(e);
      const b = document.getElementById('boot'); if (b) b.innerHTML = '<p>Não foi possível iniciar o jogo: ' + U.esc(e.message) + '</p>';
    }
  }

  function frame(ts) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (ts - last) / 1000 || 0.016); last = ts;
    M.R.time += dt;
    fpsAcc += dt; fpsN++; if (fpsAcc > 1) { M.R.fps = Math.round(fpsN / fpsAcc); fpsAcc = 0; fpsN = 0; }
    try {
      M.game.tick(dt);
      M.save.tick(dt);
      panKeys(dt);
      draw();
    } catch (e) {
      console.error('Erro no quadro', e);
      if (!M.R._errShown) { M.R._errShown = true; M.toast('Ocorreu um erro, mas o jogo continua. Detalhes no console.', 'bad'); }
    }
  }

  function draw() {
    const vw = M.R.vw, vh = M.R.vh;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (M.R.view === 'menu') {
      const c = M.R.cams.menu; c.x = 1500 + Math.sin(M.R.time * 0.05) * 900; c.y = 1000 + Math.cos(M.R.time * 0.04) * 380;
      M.world.updateTraffic(1 / 60);
      M.world.draw(ctx, c, vw, vh, M.R.time);
    } else if (M.R.view === 'world') {
      M.world.draw(ctx, M.R.cams.world, vw, vh, M.R.time);
    } else {
      const cam = M.R.cams.store;
      if (M.player.moving && !drag && !M.build.st.on) { // câmera acompanha suavemente
        const px = M.player.x * T, py = M.player.y * T, dz = 140 / cam.z;
        if (Math.abs(px - cam.x) > dz) cam.x += (px - cam.x - Math.sign(px - cam.x) * dz) * 0.08;
        if (Math.abs(py - cam.y) > dz * 0.7) cam.y += (py - cam.y - Math.sign(py - cam.y) * dz * 0.7) * 0.08;
      }
      M.render.clampCam(cam, vw, vh);
      M.render.draw(ctx, cam, vw, vh, M.R.time);
    }
    M.fx.drawScreen(ctx, vw, vh);
  }

  // ---------- coordenadas ----------
  const cam = () => (M.R.view === 'world' ? M.R.cams.world : M.R.cams.store);
  function toWorld(sx, sy) { const c = cam(); return [(sx - M.R.vw / 2) / c.z + c.x, (sy - M.R.vh / 2) / c.z + c.y]; }
  function zoomAt(sx, sy, f) {
    const c = cam(), before = toWorld(sx, sy);
    const lim = M.R.view === 'world' ? [0.3, 1.8] : [0.45, 2.6];
    c.z = U.clamp(c.z * f, lim[0], lim[1]);
    const after = toWorld(sx, sy);
    c.x += before[0] - after[0]; c.y += before[1] - after[1];
  }

  function pickObj(s, wx, wy) {
    const tx = Math.floor(wx / T);
    for (const off of [0, 14, -8]) { const o = M.build.objAt(s, tx, Math.floor((wy + off) / T)); if (o) return o; }
    return null;
  }
  function pickPerson(s, wx, wy) {
    const x = wx / T, y = wy / T + 0.35; let best = null, bd = 0.6;
    for (const c of s._cust) { const d = U.dist(x, y, c.x, c.y); if (d < bd) { bd = d; best = { c }; } }
    for (const e of s.emps) if (e._a && !e._a.hidden) { const d = U.dist(x, y, e._a.x, e._a.y); if (d < bd) { bd = d; best = { e }; } }
    return best;
  }
  function personTip(p, s) {
    if (p.c) {
      const c = p.c, mood = c.sat > 75 ? 'Feliz' : c.sat > 55 ? 'Satisfeito' : c.sat > 35 ? 'Impaciente' : 'Irritado';
      const st = { toShelf: 'Procurando produtos', look: 'Avaliando preços', queue: 'Na fila do caixa', leave: 'Indo embora', shop: 'Entrando' }[c.st] || 'Comprando';
      return '<b>Cliente ' + c.pers.name.toLowerCase() + '</b><span>' + st + '</span><span>Humor: ' + mood + ' (' + Math.round(c.sat) + '%)</span><span>Orçamento: ' + U.money0(c.budget) + ' · gasto ' + U.money0(c.spent) + '</span><span>Cesta: ' + U.sum(c.cart, (i) => i.q) + ' itens · lista ' + c.list.length + '</span><small>' + c.pers.desc + '</small>';
    }
    const e = p.e;
    return '<b>' + U.esc(e.name) + '</b><span>' + M.ROLES[e.role].name + ' · nível ' + e.lvl + '</span><span>Eficiência ' + Math.round(M.emps.eff(s, e) * 100) + '% · satisfação ' + Math.round(e.sat) + '%</span>';
  }

  // ---------- entrada ----------
  let drag = null, pinch = null;
  function bindInput() {
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('mousedown', (e) => {
      M.audio.init();
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      const w = toWorld(e.clientX, e.clientY);
      drag = { x: e.clientX, y: e.clientY, cx: cam().x, cy: cam().y, btn: e.button, moved: false, build: false };
      if (e.button === 0 && M.R.view === 'store' && M.build.st.on && !M.R.modal) { drag.build = true; M.build.down(Math.floor(w[0] / T), Math.floor(w[1] / T)); M.ui.dirty(); }
    });
    window.addEventListener('mousemove', (e) => {
      const w = toWorld(e.clientX, e.clientY);
      if (drag && !drag.build) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.moved && Math.hypot(dx, dy) > 6) drag.moved = true;
        if (drag.moved) { const c = cam(); c.x = drag.cx - dx / c.z; c.y = drag.cy - dy / c.z; }
      }
      if (e.target !== cv) { M.ui.tip(null); M.R.hoverObj = null; return; }
      hover(w, e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', (e) => {
      if (!drag) return;
      const d = drag; drag = null;
      if (d.build) { M.build.up(); M.ui.dirty(); return; }
      if (d.moved || e.target !== cv) return;
      const w = toWorld(e.clientX, e.clientY);
      if (d.btn === 0) click(w);
      else if (d.btn === 2 && M.build.st.on) { if (!M.build.cancel()) M.build.exit(); M.ui.dirty(); }
    });
    cv.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 1 / 1.12); }, { passive: false });
    // toque
    cv.addEventListener('touchstart', (e) => {
      M.audio.init();
      if (e.touches.length === 2) { const a = e.touches[0], b = e.touches[1]; pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), z: cam().z }; drag = null; return; }
      const t = e.touches[0];
      drag = { x: t.clientX, y: t.clientY, cx: cam().x, cy: cam().y, btn: 0, moved: false, touch: true };
      if (M.R.view === 'store' && M.build.st.on) { const w = toWorld(t.clientX, t.clientY); M.build.move(Math.floor(w[0] / T), Math.floor(w[1] / T)); }
    }, { passive: true });
    cv.addEventListener('touchmove', (e) => {
      if (pinch && e.touches.length === 2) { const a = e.touches[0], b = e.touches[1]; const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); const c = cam(); c.z = U.clamp(pinch.z * d / pinch.d, 0.3, 2.6); e.preventDefault(); return; }
      if (!drag) return; const t = e.touches[0]; const dx = t.clientX - drag.x, dy = t.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 10) drag.moved = true;
      if (drag.moved) { const c = cam(); c.x = drag.cx - dx / c.z; c.y = drag.cy - dy / c.z; e.preventDefault(); }
    }, { passive: false });
    cv.addEventListener('touchend', (e) => {
      if (pinch && e.touches.length < 2) { pinch = null; return; }
      if (!drag) return; const d = drag; drag = null;
      if (d.moved) return;
      const w = toWorld(d.x, d.y);
      if (M.R.view === 'store' && M.build.st.on) { M.build.down(Math.floor(w[0] / T), Math.floor(w[1] / T)); M.build.up(); M.ui.dirty(); return; }
      click(w);
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') { onEsc(); e.preventDefault(); return; }
      if (M.ui.typing() || M.R.view === 'menu') return;
      M.player.keys[e.code] = true;
      if (M.R.modal) { if (e.code === 'Enter' && document.querySelector('#modal [data-a=nextDay]')) M.ui.A.nextDay(); return; }
      const k = e.code;
      if (k === 'Space') { M.game.setSpeed(M.S.speed ? 0 : M.R.lastSpeed || 1); e.preventDefault(); }
      else if (k === 'Digit1') M.game.setSpeed(1); else if (k === 'Digit2') M.game.setSpeed(2); else if (k === 'Digit3') M.game.setSpeed(4);
      else if (k === 'KeyB') M.ui.A.dock(null, { k: 'build' });
      else if (k === 'KeyR' && M.build.st.on) M.build.rotate();
      else if (k === 'Enter' && M.build.st.pending) { M.build.confirm(); M.ui.dirty(); }
      else if (k === 'KeyE' && M.R.view === 'store' && !M.build.st.on) M.player.interact();
      else if (k === 'KeyM') M.ui.A.dock(null, { k: 'map' });
      else if (k === 'KeyL') M.ui.A.dock(null, { k: 'view' });
      else { const map = { KeyC: 'catalogo', KeyI: 'estoque', KeyF: 'fornecedores', KeyH: 'funcionarios', KeyG: 'financas', KeyK: 'empresa', KeyJ: 'missoes' }; if (map[k]) M.ui.A.dock(null, { k: map[k] }); }
      if (M.S && M.S.speed) M.R.lastSpeed = M.S.speed;
    });
    window.addEventListener('keyup', (e) => { M.player.keys[e.code] = false; });
    window.addEventListener('blur', () => { M.player.keys = {}; });
  }

  function onEsc() {
    const modal = document.getElementById('modal');
    if (!modal.hidden) { if (modal.classList.contains('report') || modal.classList.contains('levelup')) return; if (M.R.view === 'menu') M.ui.A.menuHome(); else M.ui.A.resume(); return; }
    if (M.R.view === 'menu') return;
    if (M.build.st.on) { if (!M.build.cancel()) M.build.exit(); M.ui.dirty(); return; }
    if (M.R.panel) { M.ui.close(); return; }
    M.ui.showPause();
  }

  function hover(w, sx, sy) {
    if (M.R.view === 'world') {
      const l = M.world.pick(w[0], w[1]); M.R.hoverLot = l;
      cv.style.cursor = l ? 'pointer' : 'grab';
      if (l) {
        let h = '<b>' + U.esc(l.name) + '</b><span>' + M.ZONES[l.zone].name + (l.hq ? '' : ' · ' + M.LOT_SIZES[l.size].name) + '</span>';
        if (l.hq) h += '<span>' + (M.S.hq ? 'Sua sede' : 'Escritório central à venda') + '</span>';
        else if (!l.owner) h += '<span>À venda: ' + U.money0(l.price) + '</span>';
        else if (l.owner === 'player') { const s = M.game.storeById(l.storeId); h += '<span>Sua loja: ' + U.esc(s ? s.name : '') + '</span>'; }
        else { const c = M.S.comps.find((x) => x.id === l.owner); h += '<span>Concorrente: ' + (c ? c.name : '') + '</span>'; }
        M.ui.tip(h, sx, sy);
      } else M.ui.tip(null);
      return;
    }
    if (M.R.view !== 'store' || !M.S) return;
    const s = M.game.store(); if (!s) return;
    const tx = Math.floor(w[0] / T), ty = Math.floor(w[1] / T);
    if (M.build.st.on) { M.build.move(tx, ty); M.ui.tip(null); cv.style.cursor = 'crosshair'; return; }
    const p = pickPerson(s, w[0], w[1]);
    const o = p ? null : pickObj(s, w[0], w[1]);
    M.R.hoverObj = o;
    cv.style.cursor = o || p ? 'pointer' : 'default';
    if (p) M.ui.tip(personTip(p, s), sx, sy);
    else if (o) { const d = M.BUILD[o.t]; let h = '<b>' + d.name + '</b>'; if (o.slots) { const f = o.slots.filter((x) => x.p); h += '<span>' + f.length + '/' + o.slots.length + ' espaços com produto</span>' + f.slice(0, 4).map((x) => '<span>' + U.esc(M.P[x.p].name) + ': ' + x.q + '</span>').join(''); } else if (d.kind === 'checkout') h += '<span>Fila: ' + (o._q ? o._q.length : 0) + '</span>'; h += '<small>Clique para gerenciar</small>'; M.ui.tip(h, sx, sy); }
    else M.ui.tip(null);
  }

  function click(w) {
    if (M.R.modal) return;
    if (M.R.view === 'world') { const l = M.world.pick(w[0], w[1]); if (l) M.ui.open('lote', { id: l.id }); return; }
    if (M.R.view !== 'store') return;
    const s = M.game.store();
    const o = pickObj(s, w[0], w[1]);
    if (o) { M.ui.open('obj', { id: o.id }); return; }
    const tx = Math.floor(w[0] / T), ty = Math.floor(w[1] / T);
    const d = s.dirt.find((x) => U.dist(x.x, x.y, w[0] / T, w[1] / T) < 0.6);
    if (d) { M.player.doTask({ type: 'clean', d }); return; }
    if (tx >= 0 && ty >= 0 && tx < s.gw && ty < s.gh && s._walk[ty * s.gw + tx]) { M.player.walk(tx, ty); M.fx.parts.push({ k: 'ring', x: tx + 0.5, y: ty + 0.5, t: 0, life: 0.4 }); }
    if (M.R.panel && M.R.panel.name === 'obj') M.ui.close();
  }

  function panKeys(dt) {
    if (M.R.view !== 'world' || M.ui.typing() || M.R.modal) return;
    const k = M.player.keys, c = M.R.cams.world, sp = 700 / c.z * dt;
    if (k.KeyA || k.ArrowLeft) c.x -= sp; if (k.KeyD || k.ArrowRight) c.x += sp;
    if (k.KeyW || k.ArrowUp) c.y -= sp; if (k.KeyS || k.ArrowDown) c.y += sp;
    c.x = U.clamp(c.x, 0, M.world.W * T); c.y = U.clamp(c.y, 0, M.world.H * T);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
