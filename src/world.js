/* Mundo: cidade gerada proceduralmente (bairro residencial, centro comercial, zona industrial),
   terrenos à venda, trânsito animado e renderização em chunks com cache (carregamento sob demanda). */
(function () {
  'use strict';
  const M = window.MST, U = M.U, G = () => M.gfx;
  const W = (M.world = {});
  const T = 32, BLK = 16, ROAD = 3, CH = 16;
  W.T = T; W.W = BLK * 7 + ROAD; W.H = BLK * 4 + ROAD;

  M.ZONES = {
    residencial: { name: 'Bairro Residencial', pop: 1.0, price: 1, grass: '#7fb069', color: '#8ce99a' },
    centro: { name: 'Centro Comercial', pop: 1.35, price: 1.6, grass: '#a3b18a', color: '#ffd43b' },
    industrial: { name: 'Área Industrial', pop: 0.55, price: 0.7, grass: '#9c9a7e', color: '#adb5bd' },
  };
  W.LOT_WORLD = { P: [5, 4], M: [6, 5], G: [8, 6], XG: [10, 8] };
  const LOT_PRICE = { P: 6000, M: 12000, G: 26000, XG: 52000 };
  const STREETS = ['Rua das Flores', 'Av. Brasil', 'Rua do Comércio', 'Rua Ipê Amarelo', 'Av. Paulista', 'Rua XV de Novembro', 'Rua das Palmeiras', 'Av. Central', 'Rua Sete de Setembro', 'Rua da Indústria', 'Av. dos Bandeirantes', 'Rua Santos Dumont', 'Rua Tiradentes', 'Rua Boa Vista', 'Av. Atlântica', 'Rua dos Ipês', 'Rua Aurora', 'Rua do Porto', 'Av. das Nações', 'Rua Primavera'];

  W.zoneAt = (bx) => (bx <= 1 ? 'residencial' : bx <= 4 ? 'centro' : 'industrial');

  // ---------- geração ----------
  W.generate = function (seed) {
    const R = U.mulberry(seed), rnd = (a, b) => a + R() * (b - a), rndi = (a, b) => Math.floor(rnd(a, b + 1)), pick = (arr) => arr[Math.floor(R() * arr.length)];
    const deco = [], lots = [];
    let sn = 0;
    for (let by = 0; by < 4; by++) for (let bx = 0; bx < 7; bx++) {
      const x0 = bx * BLK + ROAD + 1, y0 = by * BLK + ROAD + 1, iw = BLK - ROAD - 2, ih = BLK - ROAD - 2; // 11x11 utilizáveis
      const zone = W.zoneAt(bx);
      const isHQ = bx === 3 && by === 1, isPark = bx === 0 && by === 2;
      if (isPark) { parkBlock(deco, x0, y0, iw, ih, R); continue; }
      if (isHQ) {
        lots.push({ id: lots.length, x: x0 + 3, y: y0 + 2, w: 6, h: 7, size: 'HQ', zone, name: 'Torre Empresarial', price: 60000, hq: true, pop: 1 });
        deco.push({ k: 'plaza', x: x0, y: y0 + 9, w: iw, h: 2 });
        deco.push({ k: 'tree', x: x0, y: y0 + 1, w: 1, h: 1, c: R() }); deco.push({ k: 'tree', x: x0 + 10, y: y0 + 1, w: 1, h: 1, c: R() });
        continue;
      }
      // terrenos na face inferior do quarteirão (de frente para a avenida)
      let sizes;
      if (zone === 'residencial') sizes = R() < 0.75 ? [pick(['P', 'M', 'P'])] : [];
      else if (zone === 'centro') sizes = R() < 0.5 ? [pick(['M', 'G'])] : [pick(['XG', 'G', 'XG'])];
      else sizes = [pick(['G', 'XG'])];
      if (bx === 1 && by === 1) sizes = ['M']; // lote inicial
      let cx = x0, maxH = 0;
      const used = [];
      for (const sz of sizes) {
        const d = W.LOT_WORLD[sz];
        if (cx + d[0] > x0 + iw) break;
        const lx = sizes.length === 1 ? x0 + Math.floor((iw - d[0]) / 2) : cx;
        const lot = { id: lots.length, x: lx, y: y0 + ih - d[1], w: d[0], h: d[1], size: sz, zone, name: STREETS[sn++ % STREETS.length] + ', ' + (100 + rndi(0, 900)), pop: M.ZONES[zone].pop * rnd(0.85, 1.2) };
        lot.price = Math.round((LOT_PRICE[sz] * M.ZONES[zone].price * (0.6 + lot.pop * 0.4)) / 500) * 500;
        lots.push(lot); used.push([lot.x, lot.y, lot.w, lot.h]);
        cx = lx + d[0] + 1; maxH = Math.max(maxH, d[1]);
      }
      fillBlock(deco, zone, x0, y0, iw, ih, used, R);
    }
    W.deco = deco; W.lotDefs = lots; W.seed = seed;
    W.chunks = new Map(); W.initTraffic(R);
    return lots;
  };

  function free(used, x, y, w, h) {
    for (const u of used) if (x < u[0] + u[2] + 0 && x + w > u[0] && y < u[1] + u[3] && y + h > u[1]) return false;
    return true;
  }
  function parkBlock(deco, x0, y0, iw, ih, R) {
    deco.push({ k: 'park', x: x0, y: y0, w: iw, h: ih });
    deco.push({ k: 'pond', x: x0 + 3, y: y0 + 3, w: 5, h: 4 });
    for (let i = 0; i < 16; i++) { const x = x0 + Math.floor(R() * iw), y = y0 + Math.floor(R() * ih); if (x >= x0 + 2 && x <= x0 + 8 && y >= y0 + 2 && y <= y0 + 7) continue; deco.push({ k: 'tree', x, y, w: 1, h: 1, c: R() }); }
    deco.push({ k: 'bench', x: x0 + 1, y: y0 + 9, w: 2, h: 1 }); deco.push({ k: 'bench', x: x0 + 7, y: y0 + 9, w: 2, h: 1 });
  }
  function fillBlock(deco, zone, x0, y0, iw, ih, used, R) {
    const rnd = (a, b) => a + R() * (b - a), rndi = (a, b) => Math.floor(rnd(a, b + 1));
    const items = [];
    if (zone === 'residencial') {
      for (let y = y0; y + 3 <= y0 + ih; y += 4) for (let x = x0; x + 3 <= x0 + iw; x += 4) {
        if (!free(used, x - 1, y - 1, 5, 5)) continue;
        if (R() < 0.12) { items.push({ k: 'tree', x: x + 1, y: y + 1, w: 1, h: 1, c: R() }); continue; }
        const w = rndi(2, 3), h = rndi(2, 3);
        items.push({ k: 'house', x: x + (R() < 0.5 ? 0 : 3 - w), y: y + 3 - h, w, h, c: R(), hgt: rnd(14, 22) });
        if (R() < 0.6) items.push({ k: 'tree', x: x + 3, y: y + 3, w: 1, h: 1, c: R() });
      }
    } else if (zone === 'centro') {
      for (let y = y0; y + 4 <= y0 + ih; y += 5) for (let x = x0; x + 4 <= x0 + iw; x += 5) {
        if (!free(used, x - 1, y - 1, 6, 6)) continue;
        const r = R();
        if (r < 0.45) items.push({ k: 'tower', x, y, w: rndi(3, 4), h: rndi(3, 4), c: R(), hgt: rnd(40, 95) });
        else if (r < 0.7) items.push({ k: 'shops', x, y: y + 2, w: 4, h: 2, c: R(), hgt: 18 });
        else if (r < 0.88) items.push({ k: 'parking', x, y, w: 4, h: 4 });
        else { items.push({ k: 'plaza', x, y, w: 4, h: 4 }); items.push({ k: 'tree', x: x + 1, y: y + 1, w: 1, h: 1, c: R() }); }
      }
    } else {
      for (let y = y0; y + 5 <= y0 + ih; y += 6) for (let x = x0; x + 5 <= x0 + iw; x += 6) {
        if (!free(used, x - 1, y - 1, 6, 6)) continue;
        const r = R();
        if (r < 0.45) items.push({ k: 'warehouse', x, y, w: 5, h: 4, c: R(), hgt: 26 });
        else if (r < 0.75) items.push({ k: 'factory', x, y, w: 4, h: 4, c: R(), hgt: 30 });
        else items.push({ k: 'containers', x, y: y + 1, w: 5, h: 3, c: R() });
      }
    }
    for (const it of items) deco.push(it);
  }

  W.lot = (id) => (M.S && M.S.lots ? M.S.lots[id] : null);
  W.initLots = function () { // estado salvo = definição + dono
    const defs = W.generate(M.S.seed);
    if (!M.S.lots || !M.S.lots.length) M.S.lots = defs.map((d) => Object.assign({}, d, { owner: null, storeId: null }));
    else M.S.lots.forEach((l, i) => { const d = defs[i]; if (d) Object.assign(l, d, { owner: l.owner, storeId: l.storeId }); });
  };

  W.zonePop = function (s) {
    const l = s.lotId != null ? W.lot(s.lotId) : null;
    return l ? l.pop : 1;
  };
  W.center = (l) => [l.x + l.w / 2, l.y + l.h / 2];

  // efeito da concorrência e das próprias lojas próximas sobre o movimento de uma loja
  W.competition = function (s) {
    if (s._comp && s._comp.d === M.S.day && s._comp.t > M.R.time - 5) return s._comp.v;
    const l = s.lotId != null ? W.lot(s.lotId) : null; if (!l) return 1;
    const c = W.center(l), mine = (0.5 + s.rating / 100) * M.SIZE_MULT[s.size] / Math.max(0.6, M.cust.priceIndex(s));
    let sum = 0;
    for (const cp of M.S.comps) for (const cs of cp.stores) {
      const l2 = W.lot(cs.lotId); if (!l2) continue;
      const c2 = W.center(l2), d = U.dist(c[0], c[1], c2[0], c2[1]);
      const att = (0.5 + cp.quality / 100) * M.SIZE_MULT[l2.size] / cp.priceIdx;
      sum += Math.exp(-d / 18) * (att / mine) * 0.3;
    }
    for (const o of M.S.stores) if (o !== s && M.stores.isRetail(o) && o.lotId != null) {
      const l2 = W.lot(o.lotId), c2 = W.center(l2), d = U.dist(c[0], c[1], c2[0], c2[1]);
      sum += Math.exp(-d / 14) * 0.18;
    }
    const v = U.clamp(1 / (1 + sum), 0.3, 1);
    s._comp = { d: M.S.day, t: M.R.time, v };
    return v;
  };

  // ---------- trânsito ----------
  const CAR_COLORS = ['#e03131', '#1971c2', '#f8f9fa', '#212529', '#fab005', '#2b8a3e', '#868e96', '#ae3ec9', '#e8590c', '#0c8599'];
  W.initTraffic = function (R) {
    R = R || Math.random;
    W.cars = []; W.peds = [];
    for (let i = 0; i < 46; i++) {
      const horiz = R() < 0.55, dir = R() < 0.5 ? 1 : -1;
      const road = horiz ? Math.floor(R() * 5) : Math.floor(R() * 8);
      W.cars.push({ h: horiz, dir, road, p: R() * (horiz ? W.W : W.H), v: 3 + R() * 2.5, c: CAR_COLORS[Math.floor(R() * CAR_COLORS.length)], truck: R() < 0.15, bus: R() < 0.05 });
    }
    for (let i = 0; i < 36; i++) {
      const bx = Math.floor(R() * 7), by = Math.floor(R() * 4);
      W.peds.push({ bx, by, t: R() * 44, v: (R() < 0.5 ? 1 : -1) * (0.6 + R() * 0.5), look: M.sprites.randomLook(), ph: R() * 6 });
    }
  };
  function lanePos(car) {
    const off = car.dir > 0 ? 2.15 : 0.85;
    return car.h ? [car.p, car.road * BLK + off] : [car.road * BLK + (car.dir > 0 ? 0.85 : 2.15), car.p];
  }
  W.updateTraffic = function (dt) { // dt em segundos reais
    if (!W.cars) return;
    for (const c of W.cars) {
      const prev = c.p;
      c.p += c.v * c.dir * dt;
      const kp = Math.floor((prev - 1.5) / BLK), kn = Math.floor((c.p - 1.5) / BLK);
      if (kp !== kn && Math.random() < 0.28) {
        const k = c.dir > 0 ? kn : kp;
        if (k >= 0 && k <= (c.h ? 7 : 4)) { const old = c.road; c.h = !c.h; c.road = k; c.p = old * BLK + 1.5; c.dir = Math.random() < 0.5 ? 1 : -1; }
      }
      const lim = c.h ? W.W : W.H;
      if (c.p > lim + 2) c.p = -2; if (c.p < -2) c.p = lim + 2;
    }
    for (const p of W.peds) { p.t += p.v * dt; p.ph += dt * 8; if (p.t > 44) p.t -= 44; if (p.t < 0) p.t += 44; }
  };
  function pedPos(p) { // perímetro da calçada do quarteirão
    const x0 = p.bx * BLK + ROAD + 0.5, y0 = p.by * BLK + ROAD + 0.5, L = BLK - ROAD - 1;
    const t = p.t % (L * 4), side = Math.floor(t / L), k = t - side * L;
    if (side === 0) return [x0 + k, y0, 3]; if (side === 1) return [x0 + L, y0 + k, 0]; if (side === 2) return [x0 + L - k, y0 + L, 1]; return [x0, y0 + L - k, 2];
  }

  // ---------- desenho estático (chunks) ----------
  function isRoad(x, y) { return x % BLK < ROAD || y % BLK < ROAD; }
  function drawGround(c, x0, y0) {
    for (let y = y0; y < y0 + CH; y++) for (let x = x0; x < x0 + CH; x++) {
      if (x >= W.W || y >= W.H) continue;
      const px = (x - x0) * T, py = (y - y0) * T;
      const rx = x % BLK, ry = y % BLK;
      if (isRoad(x, y)) {
        c.fillStyle = '#3d4250'; c.fillRect(px, py, T, T);
        const hr = ry < ROAD, vr = rx < ROAD;
        if (hr && !vr && ry === 1) { c.fillStyle = '#f2c94c'; for (let k = 0; k < 2; k++) c.fillRect(px + 4 + k * 16, py + 15, 9, 2); }
        if (vr && !hr && rx === 1) { c.fillStyle = '#f2c94c'; for (let k = 0; k < 2; k++) c.fillRect(px + 15, py + 4 + k * 16, 2, 9); }
        if (hr && vr) { c.fillStyle = '#454a59'; c.fillRect(px, py, T, T); }
        // faixas de pedestre
        if (hr && !vr && (rx === ROAD || rx === BLK - 1)) { c.fillStyle = 'rgba(255,255,255,.75)'; for (let k = 0; k < 4; k++) c.fillRect(px + 3, py + 2 + k * 8, T - 6, 4); }
        if (vr && !hr && (ry === ROAD || ry === BLK - 1)) { c.fillStyle = 'rgba(255,255,255,.75)'; for (let k = 0; k < 4; k++) c.fillRect(px + 2 + k * 8, py + 3, 4, T - 6); }
      } else {
        const bx = Math.floor(x / BLK), zone = W.zoneAt(bx);
        const edge = rx === ROAD || ry === ROAD || rx === BLK - 1 || ry === BLK - 1;
        if (edge) { c.fillStyle = '#c9c6bd'; c.fillRect(px, py, T, T); c.fillStyle = 'rgba(0,0,0,.06)'; c.fillRect(px, py, T, 1); c.fillRect(px, py, 1, T); }
        else {
          c.fillStyle = M.ZONES[zone].grass; c.fillRect(px, py, T, T);
          const h = U.hash(x * 7919 + y * 104729 + '');
          if (zone !== 'centro' && h % 7 === 0) { c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(px + (h % 20), py + ((h >> 5) % 20), 4, 3); }
          if (zone === 'centro') { c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(px, py, T, 1); c.fillRect(px, py, 1, T); }
        }
      }
    }
  }

  const ROOFS = ['#b5523b', '#8c3b2b', '#5f6b7a', '#3f4a5a', '#a0522d', '#7b5e57', '#2f5d62', '#9a6b3d'];
  const WALLS = ['#f1e3c6', '#e9d8b4', '#d8e2dc', '#f4f1de', '#e7c6a5', '#cfd8e3'];
  function building(c, px, py, w, h, hgt, roof, wall, opts) {
    const g = G(); opts = opts || {};
    c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(px + 6, py + 6, w, h);
    // fachada (face frontal)
    const fy = py + h - hgt, fh = hgt;
    c.fillStyle = wall; c.fillRect(px, fy, w, fh);
    c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(px, fy, w, 3);
    if (opts.windows) {
      const rows = Math.max(1, Math.floor(fh / 14)), cols = Math.max(1, Math.floor(w / 14));
      for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
        c.fillStyle = (r + k + (opts.seed || 0)) % 5 === 0 ? '#ffe8a3' : 'rgba(40,70,110,.75)';
        c.fillRect(px + 5 + k * ((w - 6) / cols), fy + 6 + r * 14, (w - 6) / cols - 5, 7);
      }
    }
    // telhado
    g.rr(c, px - 1, fy - h + 1, w + 2, h, 3); c.fillStyle = roof; c.fill();
    c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(px + 2, fy - h + 3, w - 4, 3);
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.strokeRect(px - 0.5, fy - h + 1.5, w + 1, h - 1);
  }

  function drawDeco(c, d, ox, oy) {
    const g = G(), px = d.x * T - ox, py = d.y * T - oy, w = d.w * T, h = d.h * T;
    switch (d.k) {
      case 'house': {
        const roof = ROOFS[Math.floor(d.c * ROOFS.length)], wall = WALLS[Math.floor(d.c * 97) % WALLS.length];
        c.fillStyle = '#8fbf6a'; c.fillRect(px - 2, py - 2, w + 4, h + 4);
        c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(px + 5, py + 5, w - 2, h - 2);
        c.fillStyle = wall; c.fillRect(px + 2, py + h - d.hgt, w - 4, d.hgt);
        c.fillStyle = '#6b4f3a'; c.fillRect(px + w / 2 - 4, py + h - 12, 8, 12);
        c.fillStyle = 'rgba(60,90,130,.8)'; c.fillRect(px + 6, py + h - d.hgt + 5, 7, 6); c.fillRect(px + w - 13, py + h - d.hgt + 5, 7, 6);
        // telhado em duas águas
        const ry = py + h - d.hgt - (h - 8);
        c.fillStyle = roof; c.fillRect(px, ry, w, h - 8);
        c.fillStyle = U.shade(roof, -0.18); c.fillRect(px, ry + (h - 8) / 2, w, (h - 8) / 2);
        c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(px, ry + (h - 8) / 2 - 1, w, 2);
        break;
      }
      case 'tower': {
        const roof = ['#59606e', '#6c7a89', '#495057', '#5c677d'][Math.floor(d.c * 4)], wall = ['#9fb3c8', '#b8c4d6', '#a9b7c6', '#c3cfd9'][Math.floor(d.c * 4)];
        building(c, px + 2, py + 2, w - 4, h - 4, d.hgt, roof, wall, { windows: true, seed: Math.floor(d.c * 10) });
        c.fillStyle = '#868e96'; c.fillRect(px + 10, py + h - d.hgt - h + 14, 10, 8);
        break;
      }
      case 'shops': {
        const cols = ['#e64980', '#4dabf7', '#ffa94d', '#69db7c'];
        building(c, px + 1, py + 1, w - 2, h - 2, d.hgt + 8, '#868e96', '#f1f3f5');
        for (let k = 0; k < 4; k++) { const cc = cols[(k + Math.floor(d.c * 4)) % 4]; c.fillStyle = cc; c.fillRect(px + 2 + k * (w - 4) / 4, py + h - 14, (w - 4) / 4 - 2, 6); c.fillStyle = 'rgba(40,70,110,.7)'; c.fillRect(px + 4 + k * (w - 4) / 4, py + h - 8, (w - 4) / 4 - 6, 6); }
        break;
      }
      case 'warehouse': {
        building(c, px + 2, py + 2, w - 4, h - 4, d.hgt, '#7d8597', '#c9ced6');
        c.strokeStyle = 'rgba(0,0,0,.15)'; for (let k = 1; k < 8; k++) { c.beginPath(); c.moveTo(px + 2 + k * (w - 4) / 8, py + h - d.hgt - h + 6); c.lineTo(px + 2 + k * (w - 4) / 8, py + h - d.hgt - 2); c.stroke(); }
        c.fillStyle = '#495057'; c.fillRect(px + 14, py + h - 22, 26, 20); c.fillRect(px + w - 44, py + h - 22, 26, 20);
        c.fillStyle = '#ffd43b'; c.fillRect(px + 2, py + h - d.hgt, w - 4, 3);
        break;
      }
      case 'factory': {
        building(c, px + 2, py + 2, w - 4, h - 4, d.hgt, '#8a6f5a', '#bfa58a', { windows: true });
        c.fillStyle = '#6c757d'; c.fillRect(px + w - 26, py + h - d.hgt - h - 26, 12, 40);
        c.fillStyle = '#c92a2a'; c.fillRect(px + w - 26, py + h - d.hgt - h - 26, 12, 4);
        break;
      }
      case 'containers': {
        const cs = ['#c92a2a', '#1971c2', '#2b8a3e', '#e67700', '#5f3dc4'];
        c.fillStyle = '#a5a291'; c.fillRect(px, py, w, h);
        for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) { const cc = cs[(r * 2 + k + Math.floor(d.c * 5)) % 5]; g.box(c, px + 4 + k * (w / 2), py + 4 + r * (h - 8) / 3, w / 2 - 8, (h - 8) / 3 - 4, 2, cc); }
        break;
      }
      case 'parking': {
        c.fillStyle = '#5c6170'; c.fillRect(px, py, w, h);
        c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2;
        for (let k = 0; k <= 5; k++) { c.beginPath(); c.moveTo(px + 6 + k * (w - 12) / 5, py + 4); c.lineTo(px + 6 + k * (w - 12) / 5, py + 34); c.stroke(); c.beginPath(); c.moveTo(px + 6 + k * (w - 12) / 5, py + h - 34); c.lineTo(px + 6 + k * (w - 12) / 5, py + h - 4); c.stroke(); }
        for (let k = 0; k < 5; k++) { const hsh = U.hash(d.x + ',' + d.y + ',' + k); if (hsh % 3 === 0) continue; carTop(c, px + 6 + k * (w - 12) / 5 + (w - 12) / 10, py + 19, CAR_COLORS[hsh % CAR_COLORS.length], true); if (hsh % 2) carTop(c, px + 6 + k * (w - 12) / 5 + (w - 12) / 10, py + h - 19, CAR_COLORS[(hsh >> 3) % CAR_COLORS.length], true); }
        break;
      }
      case 'plaza': {
        c.fillStyle = '#d9cbb0'; c.fillRect(px, py, w, h);
        c.strokeStyle = 'rgba(0,0,0,.06)'; for (let k = 0; k < w; k += 16) { c.beginPath(); c.moveTo(px + k, py); c.lineTo(px + k, py + h); c.stroke(); }
        if (d.w >= 4 && d.h >= 4) { g.circ(c, px + w / 2, py + h / 2, 22, '#adb5bd'); g.circ(c, px + w / 2, py + h / 2, 16, '#74c0fc', true); }
        break;
      }
      case 'park': c.fillStyle = '#6aa84f'; c.fillRect(px, py, w, h); c.fillStyle = '#d8c79f'; c.fillRect(px, py + h / 2 - 8, w, 16); c.fillRect(px + w / 2 - 8, py, 16, h); break;
      case 'pond': g.ell(c, px + w / 2, py + h / 2, w / 2, h / 2, '#4dabf7'); g.ell(c, px + w / 2 - 10, py + h / 2 - 8, w / 4, h / 6, 'rgba(255,255,255,.25)', true); break;
      case 'bench': c.fillStyle = '#8d5a34'; c.fillRect(px + 4, py + 10, w - 8, 10); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(px + 4, py + 20, w - 8, 3); break;
      case 'tree': tree(c, px + 16, py + 22, 0.8 + d.c * 0.5, d.c); break;
    }
  }
  function tree(c, x, y, s, k) {
    c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(x + 4, y + 2, 13 * s, 6 * s, 0, 0, 6.283); c.fill();
    c.fillStyle = '#6b4a2b'; c.fillRect(x - 2.5 * s, y - 10 * s, 5 * s, 12 * s);
    const greens = ['#2f9e44', '#37b24d', '#2b8a3e', '#40c057'];
    const g1 = greens[Math.floor((k || 0) * 4) % 4];
    c.fillStyle = U.shade(g1, -0.2); c.beginPath(); c.arc(x, y - 16 * s, 13 * s, 0, 6.283); c.fill();
    c.fillStyle = g1; c.beginPath(); c.arc(x - 3 * s, y - 19 * s, 10 * s, 0, 6.283); c.fill();
    c.fillStyle = 'rgba(255,255,255,.15)'; c.beginPath(); c.arc(x - 6 * s, y - 23 * s, 4 * s, 0, 6.283); c.fill();
  }
  W.tree = tree;
  function carTop(c, x, y, col, vertical, truck, bus) {
    c.save(); c.translate(x, y); if (!vertical) c.rotate(Math.PI / 2);
    const L = bus ? 44 : truck ? 34 : 24, Wd = bus ? 15 : 13;
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(-Wd / 2 + 2, -L / 2 + 3, Wd, L);
    G().rr(c, -Wd / 2, -L / 2, Wd, L, 4); c.fillStyle = col; c.fill();
    if (truck) { c.fillStyle = '#e9ecef'; c.fillRect(-Wd / 2 + 1, -L / 2 + 10, Wd - 2, L - 12); c.fillStyle = 'rgba(40,60,90,.8)'; c.fillRect(-Wd / 2 + 2, -L / 2 + 2, Wd - 4, 5); }
    else if (bus) { c.fillStyle = 'rgba(40,60,90,.75)'; for (let k = 0; k < 5; k++) c.fillRect(-Wd / 2 + 1, -L / 2 + 4 + k * 8, 2, 5), c.fillRect(Wd / 2 - 3, -L / 2 + 4 + k * 8, 2, 5); }
    else { c.fillStyle = 'rgba(40,60,90,.8)'; c.fillRect(-Wd / 2 + 2, -L / 2 + 4, Wd - 4, 5); c.fillRect(-Wd / 2 + 2, L / 2 - 8, Wd - 4, 4); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(-Wd / 2 + 2, -L / 2 + 10, Wd - 4, 8); }
    c.restore();
  }
  W.carTop = carTop;

  function buildChunk(cx, cy) {
    const cv = document.createElement('canvas'); cv.width = CH * T; cv.height = CH * T;
    const c = cv.getContext('2d');
    const x0 = cx * CH, y0 = cy * CH;
    drawGround(c, x0, y0);
    const ox = x0 * T, oy = y0 * T;
    const list = W.deco.filter((d) => d.x < x0 + CH + 1 && d.x + d.w > x0 - 1 && d.y - 4 < y0 + CH && d.y + d.h + 1 > y0);
    const order = { park: 0, plaza: 1, parking: 1, pond: 2, bench: 3 };
    list.sort((a, b) => (order[a.k] != null ? order[a.k] : 5) - (order[b.k] != null ? order[b.k] : 5) || a.y + a.h - (b.y + b.h));
    for (const d of list) drawDeco(c, d, ox, oy);
    return cv;
  }
  function chunk(cx, cy) {
    const k = cx + ',' + cy;
    let e = W.chunks.get(k);
    if (!e) { e = { cv: buildChunk(cx, cy) }; W.chunks.set(k, e); if (W.chunks.size > 40) { const first = W.chunks.keys().next().value; W.chunks.delete(first); } }
    else { W.chunks.delete(k); W.chunks.set(k, e); } // LRU
    return e.cv;
  }

  // ---------- desenho dinâmico ----------
  function drawLot(c, l, t, hover) {
    const g = G(), px = l.x * T, py = l.y * T, w = l.w * T, h = l.h * T;
    if (l.hq) {
      if (M.S.hq) {
        building(c, px, py, w, h, 150, '#3b5bdb', '#c5d3f0', { windows: true, seed: 3 });
        label(c, px + w / 2, py + h - 150 - h - 14, M.S.name + ' • Sede', '#3b5bdb');
      } else {
        building(c, px, py, w, h, 120, '#7d8597', '#cfd6df', { windows: true, seed: 1 });
        sign(c, px + w / 2, py + h - 8, 'SALAS À VENDA', '#2b8a3e');
      }
      return;
    }
    if (!l.owner) {
      c.fillStyle = '#b59f7b'; c.fillRect(px + 2, py + 2, w - 4, h - 4);
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.setLineDash([8, 6]); c.lineWidth = 2; c.strokeRect(px + 4, py + 4, w - 8, h - 8); c.setLineDash([]);
      c.fillStyle = 'rgba(0,0,0,.07)'; for (let k = 0; k < 6; k++) c.fillRect(px + 10 + ((k * 53) % (w - 20)), py + 10 + ((k * 31) % (h - 20)), 10, 4);
      sign(c, px + w / 2, py + h / 2 + 8, 'À VENDA • ' + U.money0(l.price), '#e8590c');
      return;
    }
    let color, name, rating = 0, building0 = false, cdType = false;
    if (l.owner === 'player') {
      const s = M.game.storeById(l.storeId); if (!s) return;
      color = M.S.brand || '#f59f00'; name = s.name; rating = s.rating; building0 = !M.stores.isOpenNow(s); cdType = s.type === 'cd';
    } else {
      const cp = M.S.comps.find((x) => x.id === l.owner); if (!cp) return;
      color = cp.color; name = cp.name; const cs = cp.stores.find((x) => x.lotId === l.id); building0 = !!(cs && cs.openDay > M.S.day); rating = cs ? cs.rating : 0;
    }
    // estacionamento na frente
    const ph = Math.min(2, l.h - 3) * T, bh = h - ph;
    c.fillStyle = '#5c6170'; c.fillRect(px, py + bh, w, ph);
    c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2;
    for (let k = 1; k < l.w; k++) { c.beginPath(); c.moveTo(px + k * T, py + bh + 4); c.lineTo(px + k * T, py + bh + ph * 0.55); c.stroke(); }
    for (let k = 0; k < l.w; k++) { const hs = U.hash(l.id + ':' + k); if (hs % 3 === 0) carTop(c, px + k * T + T / 2, py + bh + 16, CAR_COLORS[hs % CAR_COLORS.length], true); }
    if (building0) {
      c.fillStyle = '#ced4da'; c.fillRect(px + 4, py + 4, w - 8, bh - 8);
      c.strokeStyle = '#f59f00'; c.lineWidth = 3;
      for (let k = 0; k < w; k += 18) { c.beginPath(); c.moveTo(px + 4 + k, py + 4); c.lineTo(px + 4 + k + 12, py + bh - 4); c.stroke(); }
      // guindaste animado
      const a = Math.sin(t * 0.8) * 0.5;
      c.save(); c.translate(px + w * 0.7, py + bh * 0.4);
      c.fillStyle = '#fab005'; c.fillRect(-3, -60, 6, 60); c.rotate(a); c.fillRect(-40, -64, 80, 5); c.fillStyle = '#495057'; c.fillRect(30, -60, 2, 20 + Math.sin(t * 2) * 6); c.restore();
      label(c, px + w / 2, py - 16, 'EM OBRAS • ' + name, color);
      return;
    }
    const hgt = cdType ? 34 : l.size === 'XG' ? 40 : 30;
    building(c, px + 3, py + 3, w - 6, bh - 4, hgt, cdType ? '#868e96' : U.shade(color, -0.35), '#f1f3f5');
    const fy = py + 3 + bh - 4 - hgt;
    c.fillStyle = color; c.fillRect(px + 3, fy, w - 6, 10);
    c.fillStyle = 'rgba(255,255,255,.35)'; for (let k = 0; k < w - 6; k += 16) c.fillRect(px + 3 + k, fy, 8, 10);
    c.fillStyle = 'rgba(40,70,110,.7)'; c.fillRect(px + 10, fy + 14, w - 20, hgt - 18);
    c.fillStyle = '#212529'; c.fillRect(px + w / 2 - 9, fy + 14, 18, hgt - 18);
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(px + w / 2 - 1, fy + 14, 2, hgt - 18);
    label(c, px + w / 2, fy - bh + 30, name, color, rating);
    if (hover) { c.strokeStyle = '#fff'; c.lineWidth = 3; c.strokeRect(px + 1, py + 1, w - 2, h - 2); }
  }
  function sign(c, x, y, txt, col) {
    c.font = '800 11px Nunito, system-ui, sans-serif'; const tw = c.measureText(txt).width + 14;
    c.fillStyle = '#6b4a2b'; c.fillRect(x - 2, y - 2, 4, 16);
    G().rr(c, x - tw / 2, y - 22, tw, 20, 4); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = col; c.lineWidth = 2; c.stroke();
    c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, x, y - 12);
  }
  function label(c, x, y, txt, col, rating) {
    c.font = '800 13px Nunito, system-ui, sans-serif'; const tw = c.measureText(txt).width + 18;
    G().rr(c, x - tw / 2, y - 12, tw, 22, 11); c.fillStyle = 'rgba(20,22,34,.82)'; c.fill();
    c.fillStyle = col; c.beginPath(); c.arc(x - tw / 2 + 9, y - 1, 4, 0, 6.283); c.fill();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, x + 4, y);
    if (rating) { c.font = '700 10px Nunito, system-ui, sans-serif'; c.fillStyle = '#ffd43b'; c.fillText(U.stars(rating), x, y + 17); }
  }

  W.pick = function (wx, wy) {
    const tx = wx / T, ty = wy / T;
    for (const l of M.S.lots) if (tx >= l.x && tx < l.x + l.w && ty >= l.y && ty < l.y + l.h) return l;
    return null;
  };

  W.draw = function (ctx, cam, vw, vh, t) {
    const z = cam.z;
    ctx.fillStyle = '#5d8a4a'; ctx.fillRect(0, 0, vw, vh);
    ctx.save();
    ctx.translate(vw / 2, vh / 2); ctx.scale(z, z); ctx.translate(-cam.x, -cam.y);
    const x0 = cam.x - vw / 2 / z, y0 = cam.y - vh / 2 / z, x1 = cam.x + vw / 2 / z, y1 = cam.y + vh / 2 / z;
    const cs = CH * T;
    ctx.imageSmoothingEnabled = true;
    for (let cy = Math.max(0, Math.floor(y0 / cs)); cy <= Math.min(Math.ceil(W.H / CH) - 1, Math.floor(y1 / cs)); cy++)
      for (let cx = Math.max(0, Math.floor(x0 / cs)); cx <= Math.min(Math.ceil(W.W / CH) - 1, Math.floor(x1 / cs)); cx++)
        ctx.drawImage(chunk(cx, cy), cx * cs, cy * cs);
    // carros
    for (const car of W.cars) {
      const p = lanePos(car), px = p[0] * T, py = p[1] * T;
      if (px < x0 - 60 || px > x1 + 60 || py < y0 - 60 || py > y1 + 60) continue;
      ctx.save(); ctx.translate(px, py); if (car.dir < 0) ctx.rotate(Math.PI); carTop(ctx, 0, 0, car.c, !car.h, car.truck, car.bus); ctx.restore();
    }
    // terrenos e lojas
    const hov = M.R.hoverLot;
    const lots = (M.S ? M.S.lots : []).slice().sort((a, b) => a.y + a.h - (b.y + b.h));
    for (const l of lots) {
      if ((l.x + l.w) * T < x0 - 200 || l.x * T > x1 + 200 || (l.y + l.h) * T < y0 || l.y * T - 220 > y1) continue;
      drawLot(ctx, l, t, hov === l);
      if (hov === l && !l.owner) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(l.x * T + 1, l.y * T + 1, l.w * T - 2, l.h * T - 2); }
    }
    // pedestres
    if (z > 0.55) for (const p of W.peds) {
      const q = pedPos(p), px = q[0] * T, py = q[1] * T;
      if (px < x0 - 20 || px > x1 + 20 || py < y0 - 40 || py > y1 + 20) continue;
      const dir = p.v > 0 ? q[2] : (q[2] + 2) % 4;
      M.sprites.person(ctx, px, py, 22, p.look, dir, p.ph, { moving: true });
    }
    // caminhões de entrega a caminho das suas lojas
    for (const o of (M.S ? M.S.orders : [])) {
      if (o.status !== 'a caminho') continue;
      const s = M.game.storeById(o.store); if (!s || s.lotId == null) continue;
      const l = W.lot(s.lotId), dur = Math.max(1, o.eta - o.placed), k = U.clamp((M.now() - o.placed) / dur, 0, 1);
      const sx = 6 * BLK + 1.5, sy = 2 * BLK + 2.15, ex = l.x + l.w / 2, ey = Math.ceil((l.y + l.h) / BLK) * BLK + 0.85;
      // trajeto em L: pela avenida até a coluna da loja e depois pela rua
      const lx = U.lerp(sx, ex, Math.min(1, k * 1.6)), ly = k < 0.625 ? sy : U.lerp(sy, ey, (k - 0.625) / 0.375);
      ctx.save(); ctx.translate(lx * T, ly * T); if (k >= 0.625) ctx.rotate(ey > sy ? 0 : Math.PI); else ctx.rotate(ex > sx ? Math.PI / 2 : -Math.PI / 2);
      carTop(ctx, 0, 0, M.SUP[o.sup].color, true, true); ctx.restore();
    }
    // noite: escurecimento e postes
    const dark = M.game.darkness();
    ctx.restore();
    if (dark > 0.01) {
      ctx.fillStyle = 'rgba(16,22,58,' + dark * 0.55 + ')'; ctx.fillRect(0, 0, vw, vh);
      if (M.settings.quality !== 'baixa') {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.translate(vw / 2, vh / 2); ctx.scale(z, z); ctx.translate(-cam.x, -cam.y);
        for (let by = 0; by <= 4; by++) for (let bx = 0; bx <= 7; bx++) {
          const px = (bx * BLK + 1.5) * T, py = (by * BLK + 1.5) * T;
          if (px < x0 - 100 || px > x1 + 100 || py < y0 - 100 || py > y1 + 100) continue;
          const gr = ctx.createRadialGradient(px, py, 0, px, py, 110); gr.addColorStop(0, 'rgba(255,200,120,' + dark * 0.35 + ')'); gr.addColorStop(1, 'rgba(255,200,120,0)');
          ctx.fillStyle = gr; ctx.fillRect(px - 110, py - 110, 220, 220);
        }
        for (const l of (M.S ? M.S.lots : [])) if (l.owner) { const px = (l.x + l.w / 2) * T, py = (l.y + l.h * 0.5) * T; const gr = ctx.createRadialGradient(px, py, 0, px, py, l.w * T * 0.7); gr.addColorStop(0, 'rgba(255,230,160,' + dark * 0.3 + ')'); gr.addColorStop(1, 'rgba(255,230,160,0)'); ctx.fillStyle = gr; ctx.fillRect(px - l.w * T, py - l.w * T, l.w * T * 2, l.w * T * 2); }
        ctx.restore();
      }
    }
  };
})();
