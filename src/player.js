/* O avatar do dono: anda pela loja (teclado ou clique), opera caixas, repõe prateleiras,
   descarrega entregas e limpa sujeira. */
(function () {
  'use strict';
  const M = window.MST, U = M.U;
  const PL = (M.player = { x: 5, y: 5, dir: 0, ph: 0, moving: false, path: null, pi: 0, task: null, atChk: null, store: null, keys: {}, moved: 0, busy: 0 });
  const SPD = 4.2; // tiles por segundo real

  PL.enter = function (s) {
    PL.leaveChk();
    PL.store = s.id; PL.task = null; PL.path = null;
    const d = s._doors[0];
    if (d != null) { PL.x = (d % s.gw) + 0.5; PL.y = ((d / s.gw) | 0) - 0.5; }
    else { const r = M.path.randomFloor(s) || [2, s.gh - 4]; PL.x = r[0] + 0.5; PL.y = r[1] + 0.5; }
  };
  PL.leaveChk = function () {
    if (PL.atChk) { if (PL.atChk._op === 'player') PL.atChk._op = null; PL.atChk = null; M.bus.emit('ui'); }
  };
  PL.walk = function (tx, ty) {
    const s = M.game.store(); if (!s) return;
    PL.leaveChk(); PL.task = null;
    M.path.go(PL, M.path.toTile(s, PL.x | 0, PL.y | 0, tx, ty));
  };
  PL.doTask = function (task) {
    const s = M.game.store(); if (!s) return false;
    PL.leaveChk();
    let pts = null;
    if (task.type === 'chk') { const sp = M.build.spots(s, task.o); pts = M.path.toTile(s, PL.x | 0, PL.y | 0, sp.cashier[0], sp.cashier[1]); }
    else if (task.type === 'dock') { const d = s._doors[0]; if (d != null) pts = M.path.bfs(s, PL.x | 0, PL.y | 0, [d, d - s.gw]); }
    else if (task.type === 'clean') pts = M.path.toTile(s, PL.x | 0, PL.y | 0, task.d.x | 0, task.d.y | 0);
    else pts = M.path.toObj(s, PL.x | 0, PL.y | 0, task.o);
    if (!pts) { M.toast('Não há caminho até lá.', 'bad'); return false; }
    PL.task = task; M.path.go(PL, pts);
    return true;
  };

  function walkable(s, x, y) {
    const tx = Math.floor(x), ty = Math.floor(y);
    if (tx < 0 || ty < 0 || tx >= s.gw || ty >= s.gh) return false;
    return !!s._walk[ty * s.gw + tx];
  }

  PL.update = function (dt) {
    const s = M.game.store();
    if (!s || M.R.view !== 'store' || PL.store !== s.id) return;
    PL.ph += dt * 12 * (PL.moving ? 1 : 0);
    if (PL.busy > 0) { PL.busy -= dt; PL.moving = false; return; }
    const k = PL.keys, typing = M.ui && M.ui.typing();
    let dx = 0, dy = 0;
    if (!typing) {
      if (k.ArrowLeft || k.KeyA) dx -= 1; if (k.ArrowRight || k.KeyD) dx += 1;
      if (k.ArrowUp || k.KeyW) dy -= 1; if (k.ArrowDown || k.KeyS) dy += 1;
    }
    if (dx || dy) {
      PL.path = null; PL.task = null; PL.leaveChk();
      const L = Math.hypot(dx, dy), step = (SPD * dt) / L, r = 0.28;
      const nx = PL.x + dx * step, ny = PL.y + dy * step;
      if (walkable(s, nx + Math.sign(dx) * r, PL.y) && walkable(s, nx + Math.sign(dx) * r, PL.y + 0.2)) PL.x = nx;
      if (walkable(s, PL.x, ny + Math.sign(dy) * r) && walkable(s, PL.x + Math.sign(dx || 1) * 0.1, ny + Math.sign(dy) * r)) PL.y = ny;
      PL.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 1) : dy > 0 ? 0 : 2;
      PL.moving = true; PL.moved += SPD * dt;
      return;
    }
    if (PL.path) { const before = PL.pi; M.path.move(PL, SPD * dt); PL.moved += SPD * dt * (PL.path || before ? 1 : 0); if (PL.path) return; }
    PL.moving = false;
    if (PL.task) { const t = PL.task; PL.task = null; perform(s, t); }
    if (PL.atChk) { if (!s.objs.includes(PL.atChk)) PL.leaveChk(); else PL.dir = PL.atChk.r; }
  };

  function perform(s, t) {
    if (t.type === 'chk') {
      const o = t.o; if (!s.objs.includes(o)) return;
      if (o._op && o._op !== 'player') { M.toast('Este caixa já tem um operador.', 'bad'); return; }
      o._op = 'player'; PL.atChk = o; PL.dir = o.r;
      M.toast('Você está operando o caixa. Mova-se para sair.', 'info'); M.bus.emit('playerChk'); M.bus.emit('ui');
    } else if (t.type === 'restock') {
      const n = M.inv.restockObj(s, t.o);
      if (n > 0) { PL.busy = 0.5; M.S.td.restock += n; M.fx.pop(s, t.o); M.fx.text(s, PL.x, PL.y, '+' + n + ' repostos', '#1c7ed6'); M.audio.sfx('buy'); M.bus.emit('restock', { n }); }
      else M.toast('Nada para repor: o depósito não tem esses produtos.', 'bad');
    } else if (t.type === 'dock') {
      const n = M.inv.unload(s, 30);
      if (n > 0) { PL.busy = 0.6; M.fx.text(s, PL.x, PL.y, '+' + n + ' no depósito', '#e8590c'); M.audio.sfx('buy'); }
      else M.toast(M.inv.dockQty(s) ? 'Depósito lotado! Construa estantes.' : 'Não há entregas na doca.', 'bad');
    } else if (t.type === 'clean') {
      const k = s.dirt.indexOf(t.d); if (k >= 0) { s.dirt.splice(k, 1); PL.busy = 0.4; M.fx.sparkle(s, t.d.x, t.d.y); M.audio.sfx('click'); }
    }
  }

  // tecla E: interage com o que estiver mais perto
  PL.interact = function () {
    const s = M.game.store(); if (!s) return;
    if (PL.atChk) { PL.leaveChk(); return; }
    let best = null, bd = 1.9;
    for (const d of s.dirt) { const dd = U.dist(PL.x, PL.y, d.x, d.y); if (dd < 1.2 && dd < bd) { bd = dd; best = { type: 'clean', d }; } }
    if (!best) for (const o of s.objs) {
      const f = M.path.footprint(o), cx = U.clamp(PL.x, o.x, o.x + f[0]), cy = U.clamp(PL.y, o.y, o.y + f[1]);
      const dd = U.dist(PL.x, PL.y, cx, cy); if (dd >= bd) continue;
      const kind = M.BUILD[o.t].kind;
      if (kind === 'checkout') { bd = dd; best = { type: 'chk', o }; }
      else if (o.slots) { bd = dd; best = { type: 'restock', o }; }
    }
    const d = s._doors[0];
    if (!best && d != null && M.inv.dockQty(s) && U.dist(PL.x, PL.y, (d % s.gw) + 0.5, ((d / s.gw) | 0) + 0.5) < 2.5) best = { type: 'dock' };
    if (best) { if (best.type === 'chk') PL.doTask(best); else perform(s, best); }
    else M.toast('Nada por perto para interagir. Aproxime-se de um caixa, prateleira ou da doca.', 'info');
  };
})();
