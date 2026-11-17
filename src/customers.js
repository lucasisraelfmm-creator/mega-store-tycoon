/* Clientes com IA: personalidade, orçamento, lista de compras, avaliação de preços, filas,
   pagamento, satisfação, furtos e sujeira. */
(function () {
  'use strict';
  const M = window.MST, U = M.U;
  const CU = (M.cust = {});

  M.PERS = {
    economico: { name: 'Econômico', sens: 1.05, bm: 0.95, pat: [14, 26], items: [2, 5], w: 3, spd: 0.95, desc: 'Compara preços e evita produtos caros.' },
    apressado: { name: 'Apressado', sens: 0.45, bm: 1.3, pat: [5, 11], items: [1, 3], w: 2, spd: 1.25, desc: 'Odeia filas.' },
    exigente: { name: 'Exigente', sens: 0.6, bm: 1.4, pat: [11, 20], items: [2, 4], w: 2, spd: 1, picky: true, desc: 'Valoriza limpeza, decoração e atendimento.' },
    familia: { name: 'Família', sens: 0.8, bm: 1.2, pat: [16, 30], items: [4, 9], w: 2, spd: 0.85, desc: 'Compras grandes para a casa toda.' },
    impulsivo: { name: 'Impulsivo', sens: 0.35, bm: 1.7, pat: [12, 24], items: [2, 5], w: 1.4, spd: 1.05, impulse: true, desc: 'Compra por impulso, adora promoções.' },
    abastado: { name: 'Abastado', sens: 0.15, bm: 3, pat: [10, 20], items: [1, 4], w: 0.6, spd: 1, rich: true, desc: 'Prefere qualidade e produtos de luxo.' },
  };
  const PERS_KEYS = Object.keys(M.PERS);
  const CAP = { P: 18, M: 30, G: 44, XG: 60 };
  let cid = 1;

  CU.cap = (s) => Math.min(CAP[s.size], M.settings.maxCust);

  // cache de produtos expostos na loja
  function listing(s) {
    if (s._lc && s._lc.v === s._ver && s._lc.t > M.R.time - 2) return s._lc;
    const map = M.inv.listed(s), arr = Object.keys(map);
    const T = M.stores.type(s);
    const wish = M.PRODUCTS.filter((p) => T.cats.includes(p.cat) && p.lvl <= M.S.level && map[p.id] == null);
    s._lc = { v: s._ver, t: M.R.time, map, arr, wish };
    return s._lc;
  }
  CU.listing = listing;

  CU.priceIndex = function (s) {
    if (s._pi && s._pi.t > M.R.time - 3) return s._pi.v;
    const L = listing(s); let w = 0, sum = 0;
    for (const pid of L.arr) { const p = M.P[pid], d = p.demand; sum += (M.eco.sell(pid) / M.eco.ref(pid)) * d; w += d; }
    const v = w ? sum / w : 1;
    s._pi = { t: M.R.time, v };
    return v;
  };

  CU.rate = function (s) {
    if (!M.stores.isRetail(s) || !M.stores.isOpenNow(s) || !s._doors.length) return 0;
    const L = listing(s); if (!L.arr.length) return 0;
    const T = M.stores.type(s), g = s._agg;
    const base = 0.2 * M.world.zonePop(s) * T.traffic * (0.5 + 0.5 * Math.min(2.4, Math.sqrt(L.arr.length / 10)));
    const hour = M.game.hourCurve(M.S.minute);
    const rating = 0.45 + s.rating / 100;
    const appeal = 0.7 + M.build.appeal(s) / 200;
    const r = CU.priceIndex(s), price = U.clamp(2.1 - 1.1 * r, 0.25, 1.35);
    const mkt = 1 + M.eco.marketingBoost() + (g ? g.traffic : 0);
    const wd = U.dateInfo(M.S.day).wd, week = wd >= 5 ? 1.2 : wd === 4 ? 1.08 : 1;
    const ev = M.events.traffic(s);
    const comp = M.world.competition(s);
    return base * hour * rating * appeal * price * mkt * week * ev * comp * (M.S.diffMult || 1);
  };

  function weightFor(p, pers) {
    let w = Math.pow(p.demand, 1.35) * M.events.mult(p);
    const pr = M.eco.promo(p.cat); if (pr) w *= 1 + pr * (pers.impulse ? 6 : 3.5);
    if (p.cat === 'luxo') w *= pers.rich ? 7 : 0.12;
    else if (pers.rich && p.cost > 200) w *= 2;
    if (!pers.rich && p.cost > 1500) w *= 0.35;
    return w;
  }

  CU.spawn = function (s) {
    const L = listing(s);
    const pk = U.wpick(PERS_KEYS, (k) => M.PERS[k].w * (k === 'abastado' ? 0.6 + M.build.appeal(s) / 60 : 1));
    const pers = M.PERS[pk];
    const n = U.rndi(pers.items[0], pers.items[1]) + Math.round((s._agg.basket || 0) * U.rnd(0, 4));
    const list = [], pool = L.arr.slice();
    let value = 0;
    for (let i = 0; i < n && pool.length; i++) {
      if (L.wish.length && U.chance(0.1)) { const w = U.wpick(L.wish, (p) => weightFor(p, pers)); if (w) { list.push(w.id); continue; } }
      const pid = U.wpick(pool, (id) => weightFor(M.P[id], pers)); if (!pid) break;
      pool.splice(pool.indexOf(pid), 1); list.push(pid); value += M.eco.sell(pid) * (M.P[pid].cost < 15 ? 1.5 : 1);
    }
    if (!list.length) return null;
    const ed = M.path.edge(s);
    const thiefP = 0.035 * (1 - Math.min(0.85, (s._agg.sec || 0) * 0.22 + s.emps.filter((e) => e.role === 'seguranca' && e._a).length * 0.3));
    const c = {
      id: cid++, look: M.sprites.randomLook(), x: ed[0] + 0.5, y: ed[1] + 0.5, dir: 0, ph: Math.random() * 6, moving: false, path: null, pi: 0,
      pk, pers, list, li: 0, cart: [], budget: Math.max(15, value * pers.bm * U.rnd(0.95, 1.7)), spent: 0,
      pat: U.rnd(pers.pat[0], pers.pat[1]) * (1 + (s._agg.service || 0) * 0.1 + (s.objs.some((o) => o.t === 'cafe') ? 0.15 : 0)),
      sat: U.clamp(62 + M.build.appeal(s) * (pers.picky ? 0.3 : 0.24) + (s._agg.service ? 4 : 0), 0, 100),
      st: 'shop', t: 0, wait: 0, emo: null, thief: U.chance(thiefP), stole: null, life: 0,
    };
    s._cust.push(c);
    s.day.cust++;
    nextTarget(s, c);
    return c;
  };

  function emote(c, type) { c.emo = { type, t: 2.2 }; }

  function nextTarget(s, c) {
    while (c.li < c.list.length) {
      const pid = c.list[c.li];
      const slots = M.inv.findSlots(s, pid);
      if (!slots.length) { // procurou algo que a loja não vende
        c.li++; c.sat -= 1.5; s.day.wish = (s.day.wish || 0) + 1; s.day.wishes = s.day.wishes || {}; s.day.wishes[pid] = (s.day.wishes[pid] || 0) + 1;
        if (!c.emo && U.chance(0.5)) emote(c, 'vazio');
        continue;
      }
      let best = null, bd = Infinity;
      for (const f of slots) { const d = U.dist(c.x, c.y, f.o.x, f.o.y) + (f.o.slots[f.i].q > 0 ? 0 : 12); if (d < bd) { bd = d; best = f; } }
      c.target = best; c.st = 'toShelf';
      const pts = M.path.toObj(s, c.x | 0, c.y | 0, best.o);
      if (pts) { M.path.go(c, pts); return; }
      c.li++; // inalcançável
    }
    goCheckout(s, c);
  }

  function checkouts(s) { return s.objs.filter((o) => { const k = M.BUILD[o.t].kind; return k === 'checkout' || k === 'self'; }); }
  CU.checkouts = checkouts;

  CU.operator = function (s, o) {
    if (M.BUILD[o.t].kind === 'self') return { eff: 0.75, atend: 0.9 };
    if (o._op === 'player') return M.player.atChk === o ? { eff: 1.15, atend: 1.15, player: true } : null;
    if (o._op) {
      const e = s.emps.find((x) => x.id === o._op);
      if (e && e._a && e._a.st === 'work' && e._a.chk === o) return { eff: M.emps.eff(s, e) * (0.6 + 0.4 * e.sk.vel), atend: e.sk.atend, e };
    }
    return null;
  };

  function goCheckout(s, c) {
    if (!c.cart.length) { leave(s, c); return; }
    if (c.thief && !c.caught) { // furtador: sai sem pagar
      c.stole = c.cart; c.cart = []; leave(s, c); return;
    }
    const list = checkouts(s);
    if (!list.length) { abandon(s, c, 'semcaixa'); return; }
    let best = null, bs = Infinity;
    for (const o of list) {
      const staffed = CU.operator(s, o) || (o._op && M.BUILD[o.t].kind === 'checkout');
      const q = (o._q ? o._q.length : 0);
      const sc = q * 2.5 + U.dist(c.x, c.y, o.x, o.y) * 0.35 + (staffed ? 0 : 40);
      if (sc < bs) { bs = sc; best = o; }
    }
    best._q = best._q || [];
    if (best._q.length >= 6) { emote(c, 'fila'); c.sat -= 6; if (c.pers === M.PERS.apressado && U.chance(0.5)) { abandon(s, c, 'fila'); return; } }
    best._q.push(c); c.chk = best; c.qi = -1; c.st = 'queue'; c.wait = 0; c.pay = 0;
    c.payNeed = 0.45 + U.sum(c.cart, (i) => i.q) * 0.09;
  }

  function leave(s, c) {
    if (c.chk && c.chk._q) { const k = c.chk._q.indexOf(c); if (k >= 0) c.chk._q.splice(k, 1); }
    c.chk = null; c.st = 'leave';
    const ed = M.path.edge(s);
    if (!M.path.go(c, M.path.toTile(s, c.x | 0, c.y | 0, ed[0], ed[1]))) c.gone = true;
  }
  function abandon(s, c, why) {
    // devolve itens do carrinho ao depósito (funcionários repõem depois)
    let v = 0;
    for (const it of c.cart) { M.inv.addStorage(s, it.p, it.q); v += it.price * it.q; }
    c.cart = []; s.day.lost += v; c.sat -= 18; emote(c, 'bravo');
    if (why === 'fila') s.day.queueQuit = (s.day.queueQuit || 0) + 1;
    leave(s, c);
  }

  function atShelf(s, c) {
    const f = c.target, o = f && f.o;
    c.li++;
    if (!o || !s.objs.includes(o) || !o.slots[f.i]) return;
    const sl = o.slots[f.i], pid = c.list[c.li - 1];
    if (sl.p !== pid || sl.q <= 0) {
      c.sat -= 5; s.day.stockout++; s.day.miss = s.day.miss || {}; s.day.miss[pid] = (s.day.miss[pid] || 0) + 1; emote(c, 'vazio'); return;
    }
    const p = M.P[pid], price = M.eco.sell(pid), ref = M.eco.ref(pid), r = price / ref;
    let pBuy = U.clamp(1.18 - (r - 1) * (1.1 + c.pers.sens * 2.6), 0, 1);
    if (M.eco.promo(p.cat)) pBuy = Math.min(1, pBuy + 0.15);
    if (price > c.budget - c.spent) { s.day.budget = (s.day.budget || 0) + 1; return; }
    if (Math.random() > pBuy) { c.sat -= 2 + 5 * c.pers.sens * Math.max(0, r - 1) * 3; s.day.pricey++; emote(c, 'caro'); return; }
    let q = 1;
    if (price < 15) q = U.rndi(1, c.pers === M.PERS.familia ? 4 : 2);
    if (c.pers.impulse && U.chance(0.3)) q++;
    q = Math.min(q, sl.q, Math.max(1, Math.floor((c.budget - c.spent) / price)));
    const got = M.inv.take(s, o, f.i, q);
    if (got <= 0) return;
    c.cart.push({ p: pid, q: got, price });
    c.spent += price * got;
    if (r < 0.92) c.sat += 2.5; else if (r < 1.02) c.sat += 1;
    if (s.id === M.S.curId && M.fx) M.fx.item(s, c.x, c.y, pid);
    // compra por impulso de um item próximo
    if (c.pers.impulse && U.chance(0.35)) {
      const other = o.slots.filter((x) => x.p && x.q > 0 && x.p !== pid);
      if (other.length) { const ox = U.pick(other); c.list.splice(c.li, 0, ox.p); }
    }
  }

  function finish(s, c, op) {
    let total = 0, items = 0;
    for (const it of c.cart) { total += it.price * it.q; items += it.q; s.day.cogs += M.P[it.p].cost * it.q; M.game.recordSale(s, it.p, it.q); }
    total = U.round2(total);
    M.eco.earn(total, 'vendas', s.id);
    s.day.sales += total; s.day.items += items; s.day.served++; s.life.sales += total; s.life.cust++;
    M.S.stats.sales += total; M.S.stats.cust++; M.S.stats.items += items;
    M.S.xp += total * 0.02;
    c.sat += (op.atend - 1) * 12 + (c.wait < 3 ? 4 : 0);
    c.cart = [];
    emote(c, c.sat > 70 ? 'feliz' : 'pago');
    if (s.id === M.S.curId && M.R.view === 'store') { M.audio.sfx('cash'); if (M.fx) M.fx.money(s, c.x, c.y - 0.4, total); }
    M.bus.emit('sale', { store: s, total, items });
    leave(s, c);
  }

  CU.update = function (s, dt) {
    const cust = s._cust;
    // geração de clientes
    if (M.S.minute < M.C.DAY_END - 25 && cust.length < CU.cap(s)) {
      s._spawnAcc = (s._spawnAcc || 0) + CU.rate(s) * dt;
      let guard = 3;
      while (s._spawnAcc >= 1 && guard-- > 0) { s._spawnAcc -= 1; if (cust.length < CU.cap(s)) CU.spawn(s); }
      if (s._spawnAcc > 3) s._spawnAcc = 3;
    }
    const dirtF = 0.0022 * (1 - Math.min(0.75, (s._agg.clean || 0) * 0.15));
    for (let i = cust.length - 1; i >= 0; i--) {
      const c = cust[i];
      c.life += dt; c.ph += dt * 10;
      if (c.emo) { c.emo.t -= dt; if (c.emo.t <= 0) c.emo = null; }
      if (c.gone || c.life > 320) { finalize(s, c); cust.splice(i, 1); continue; }
      const arrived = M.path.move(c, dt * 1.0 * c.pers.spd);
      if (s.dirt.length) c.sat -= dt * Math.min(12, s.dirt.length) * 0.012 * (c.pers.picky ? 2 : 1);
      if (c.st !== 'leave' && Math.random() < dirtF * dt && s.dirt.length < 30) s.dirt.push({ x: c.x, y: c.y + 0.1, k: (Math.random() * 3) | 0 });
      if (c.st === 'toShelf') { if (arrived) { c.st = 'look'; c.t = U.rnd(0.5, 1.2); faceObj(c, c.target && c.target.o); } }
      else if (c.st === 'look') { c.t -= dt; if (c.t <= 0) { atShelf(s, c); nextTarget(s, c); } }
      else if (c.st === 'queue') queueStep(s, c, dt);
      else if (c.st === 'leave') { if (arrived) { finalize(s, c); cust.splice(i, 1); } }
    }
    // atendimento nos caixas
    for (const o of s.objs) {
      if (!o._q || !o._q.length) continue;
      const front = o._q[0];
      if (!front || front.st !== 'queue' || front.qi !== 0 || front.path) continue;
      const op = CU.operator(s, o);
      if (!op) continue;
      front.pay += dt * op.eff;
      front.dir = (o.r + 2) % 4;
      if (front.pay >= front.payNeed) finish(s, front, op);
    }
  };

  function faceObj(c, o) {
    if (!o) return;
    const f = M.path.footprint(o), cx = o.x + f[0] / 2, cy = o.y + f[1] / 2, dx = cx - c.x, dy = cy - c.y;
    c.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 1) : dy > 0 ? 0 : 2;
  }

  function queueStep(s, c, dt) {
    const o = c.chk;
    if (!o || !s.objs.includes(o)) { c.chk = null; goCheckout(s, c); return; }
    const idx = o._q.indexOf(c);
    if (idx < 0) { goCheckout(s, c); return; }
    const sp = M.build.spots(s, o), spot = sp.queue[Math.min(idx, sp.queue.length - 1)];
    if (c.qi !== idx) { c.qi = idx; M.path.go(c, M.path.toTile(s, c.x | 0, c.y | 0, spot[0] | 0, spot[1] | 0)); }
    if (c.path) return; // ainda caminhando até a fila
    c.wait += dt;
    if (c.wait > 5) c.sat -= dt * 0.9;
    if (c.wait > c.pat * 0.7 && !c.emo && U.chance(dt * 0.3)) emote(c, 'fila');
    if (c.wait > c.pat && idx > 0) abandon(s, c, 'fila');
    else if (c.wait > c.pat * 1.6) abandon(s, c, 'fila');
  }

  function finalize(s, c) {
    if (c.chk && c.chk._q) { const k = c.chk._q.indexOf(c); if (k >= 0) c.chk._q.splice(k, 1); }
    if (c.stole && !c.caught) { let v = 0; for (const it of c.stole) v += it.price * it.q; s.day.theft += v; s.day.thefts = (s.day.thefts || 0) + 1; }
    if (c.cart.length) for (const it of c.cart) M.inv.addStorage(s, it.p, it.q);
    const sat = U.clamp(c.sat, 0, 100);
    if (!c.thief) { s.day.satSum += sat; s.day.satN++; s.rating = U.clamp(s.rating * 0.992 + sat * 0.008, 0, 100); }
  }

  CU.clear = function (s) {
    for (const c of s._cust) { c.gone = true; finalize(s, c); }
    s._cust = [];
    for (const o of s.objs) o._q = [];
  };
})();
