/* Pathfinding em grade (BFS com buffers reutilizados) + utilitários de movimento dos agentes. */
(function () {
  'use strict';
  const M = window.MST;
  const P = (M.path = {});
  let Q = new Int32Array(2048), PREV = new Int32Array(2048), MARK = new Uint8Array(2048), GOAL = new Uint8Array(2048);
  const DX = [0, -1, 0, 1], DY = [1, 0, -1, 0];

  function ensure(n) {
    if (Q.length >= n) return;
    Q = new Int32Array(n); PREV = new Int32Array(n); MARK = new Uint8Array(n); GOAL = new Uint8Array(n);
  }

  P.footprint = function (o) {
    const d = M.BUILD[o.t];
    return o.r % 2 ? [d.h, d.w] : [d.w, d.h];
  };

  // recalcula mapa de caminhada, índice de objetos e listas auxiliares
  P.rebuild = function (s) {
    const n = s.gw * s.gh;
    if (!s._walk || s._walk.length !== n) { s._walk = new Uint8Array(n); s._objAt = new Int16Array(n); }
    const walk = s._walk, top = s.gh - s.ownH, side = s.gh - M.C.SIDE;
    s._objAt.fill(0);
    s._doors = []; s._floorTiles = []; s._windows = [];
    for (let y = 0; y < s.gh; y++) for (let x = 0; x < s.gw; x++) {
      const i = y * s.gw + x; let w = 0;
      if (y >= side) w = 1;
      else if (x < s.ownW && y >= top) { const wl = s.wall[i]; w = wl === 0 || wl === 2 ? 1 : 0; if (wl === 2) s._doors.push(i); else if (wl === 3) s._windows.push(i); }
      walk[i] = w;
    }
    for (let k = 0; k < s.objs.length; k++) {
      const o = s.objs[k], d = M.BUILD[o.t], f = P.footprint(o);
      for (let yy = 0; yy < f[1]; yy++) for (let xx = 0; xx < f[0]; xx++) {
        const i = (o.y + yy) * s.gw + o.x + xx;
        s._objAt[i] = k + 1;
        if (d.block !== false) walk[i] = 0;
      }
    }
    for (let i = 0; i < n; i++) if (walk[i] && s.floor[i] && ((i / s.gw) | 0) < side && s.wall[i] === 0) s._floorTiles.push(i);
    s._ver = (s._ver || 0) + 1;
  };

  // BFS do ponto inicial até qualquer célula-objetivo; retorna lista de pontos [x,y] (centros) ou null
  P.bfs = function (s, sx, sy, goals) {
    const gw = s.gw, gh = s.gh, n = gw * gh, walk = s._walk;
    ensure(n);
    sx = Math.max(0, Math.min(gw - 1, sx | 0)); sy = Math.max(0, Math.min(gh - 1, sy | 0));
    const start = sy * gw + sx;
    GOAL.fill(0, 0, n);
    let any = false;
    for (let i = 0; i < goals.length; i++) { const g = goals[i]; if (g >= 0 && g < n && walk[g]) { GOAL[g] = 1; any = true; } }
    if (!any) return null;
    let found = -1;
    if (GOAL[start]) found = start;
    else {
      MARK.fill(0, 0, n);
      let qh = 0, qt = 0;
      Q[qt++] = start; MARK[start] = 1; PREV[start] = -1;
      while (qh < qt && found < 0) {
        const c = Q[qh++], cx = c % gw, cy = (c / gw) | 0;
        for (let d = 0; d < 4; d++) {
          const nx = cx + DX[d], ny = cy + DY[d];
          if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
          const ni = ny * gw + nx;
          if (MARK[ni] || !walk[ni]) continue;
          MARK[ni] = 1; PREV[ni] = c;
          if (GOAL[ni]) { found = ni; break; }
          Q[qt++] = ni;
        }
      }
    }
    if (found < 0) return null;
    const cells = [];
    if (found === start) cells.push(start);
    else { let c = found; while (c !== -1) { cells.push(c); c = c === start ? -1 : PREV[c]; } cells.reverse(); }
    // suaviza "escadinhas" em diagonais quando os dois cantos estão livres
    const pts = [];
    let i = 0;
    while (i < cells.length) {
      const c = cells[i];
      pts.push([(c % gw) + 0.5, ((c / gw) | 0) + 0.5]);
      if (i + 2 < cells.length) {
        const a = cells[i], b = cells[i + 2];
        const ax = a % gw, ay = (a / gw) | 0, bx = b % gw, by = (b / gw) | 0;
        if (Math.abs(ax - bx) === 1 && Math.abs(ay - by) === 1 && walk[ay * gw + bx] && walk[by * gw + ax]) { i += 2; continue; }
      }
      i++;
    }
    pts.goal = found;
    return pts;
  };

  P.toTile = (s, sx, sy, tx, ty) => P.bfs(s, sx, sy, [ty * s.gw + tx]);

  // células caminháveis adjacentes ao objeto
  P.access = function (s, o) {
    const f = P.footprint(o), out = [], gw = s.gw, walk = s._walk;
    for (let xx = 0; xx < f[0]; xx++) {
      const a = (o.y - 1) * gw + o.x + xx, b = (o.y + f[1]) * gw + o.x + xx;
      if (o.y - 1 >= 0 && walk[a]) out.push(a);
      if (o.y + f[1] < s.gh && walk[b]) out.push(b);
    }
    for (let yy = 0; yy < f[1]; yy++) {
      const a = (o.y + yy) * gw + o.x - 1, b = (o.y + yy) * gw + o.x + f[0];
      if (o.x - 1 >= 0 && walk[a]) out.push(a);
      if (o.x + f[0] < gw && walk[b]) out.push(b);
    }
    return out;
  };
  P.toObj = (s, sx, sy, o) => P.bfs(s, sx, sy, P.access(s, o));

  P.randomFloor = function (s) {
    const l = s._floorTiles;
    if (!l || !l.length) return null;
    const i = l[(Math.random() * l.length) | 0];
    return [i % s.gw, (i / s.gw) | 0];
  };

  // ponto de entrada/saída na calçada
  P.edge = function (s) {
    const y = s.gh - 2;
    return Math.random() < 0.5 ? [0, y] : [s.gw - 1, y];
  };

  // avança o agente pelo caminho; retorna true ao chegar
  P.move = function (a, d) {
    if (!a.path) { a.moving = false; return true; }
    a.moving = true;
    while (d > 0 && a.pi < a.path.length) {
      const t = a.path[a.pi], dx = t[0] - a.x, dy = t[1] - a.y, L = Math.hypot(dx, dy);
      if (L > 0.001) a.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 1) : dy > 0 ? 0 : 2;
      if (L <= d) { a.x = t[0]; a.y = t[1]; a.pi++; d -= L; }
      else { a.x += (dx / L) * d; a.y += (dy / L) * d; d = 0; }
    }
    if (a.pi >= a.path.length) { a.path = null; a.moving = false; return true; }
    return false;
  };
  P.go = function (a, pts) { a.path = pts; a.pi = 0; return !!pts; };
})();
