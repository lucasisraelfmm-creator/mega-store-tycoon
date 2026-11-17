/* Fornecedores, pedidos, negociação, caminhões de entrega e reposição automática. */
(function () {
  'use strict';
  const M = window.MST, U = M.U;
  const ALL = () => M.CATS.map((c) => c.id);

  M.SUPPLIERS = [
    { id: 'atacadao', name: 'Atacadão Popular', cats: ['alimentos', 'bebidas', 'doces', 'limpeza', 'higiene'], mult: 0.9, eta: 300, min: 250, rel: 0.9, lvl: 1, color: '#e8590c', desc: 'Preço baixo, entrega lenta e pedido mínimo.' },
    { id: 'rapida', name: 'Distribuidora Rápida', cats: ['alimentos', 'bebidas', 'doces', 'limpeza', 'higiene'], mult: 1.04, eta: 75, min: 0, rel: 0.97, lvl: 1, color: '#1c7ed6', desc: 'Entrega expressa, mas cobra mais caro.' },
    { id: 'fresco', name: 'Fazenda FrescoBom', cats: ['alimentos', 'bebidas', 'doces'], perishOnly: true, mult: 0.86, eta: 150, min: 120, rel: 0.92, lvl: 2, color: '#2f9e44', desc: 'Especialista em perecíveis: frios, hortifrúti e laticínios.' },
    { id: 'brinq', name: 'Brinquedolândia', cats: ['brinquedos'], mult: 0.93, eta: 240, min: 300, rel: 0.94, lvl: 3, color: '#f59f00', desc: 'Fabricante nacional de brinquedos.' },
    { id: 'ferr', name: 'Ferragens União', cats: ['ferramentas'], mult: 0.92, eta: 240, min: 300, rel: 0.95, lvl: 3, color: '#495057', desc: 'Ferramentas e materiais de construção.' },
    { id: 'tecno', name: 'TecnoImport', cats: ['eletronicos'], mult: 0.95, eta: 480, min: 1500, rel: 0.88, lvl: 4, color: '#4263eb', desc: 'Importadora de eletrônicos.' },
    { id: 'moda', name: 'Moda Brasil Têxtil', cats: ['roupas'], mult: 0.9, eta: 360, min: 600, rel: 0.93, lvl: 4, color: '#d6336c', desc: 'Confecção de roupas e calçados.' },
    { id: 'casa', name: 'Casa & Lar Móveis', cats: ['moveis'], mult: 0.92, eta: 480, min: 1500, rel: 0.9, lvl: 5, color: '#8f5b34', desc: 'Fábrica de móveis planejados e estofados.' },
    { id: 'nacional', name: 'MegaDistribuidora Nacional', cats: null, mult: 0.96, eta: 420, min: 4000, rel: 0.96, lvl: 5, color: '#0ca678', desc: 'Tudo em um só lugar, para grandes volumes.' },
    { id: 'maison', name: 'Maison Prestige', cats: ['luxo'], mult: 0.95, eta: 600, min: 5000, rel: 0.97, lvl: 6, color: '#b08900', desc: 'Grifes e artigos de luxo importados.' },
  ];
  M.SUP = {};
  M.SUPPLIERS.forEach((s) => (M.SUP[s.id] = s));

  const SU = (M.sup = {});
  SU.state = (id) => (M.S.sup[id] = M.S.sup[id] || { rel: 10, disc: 0, discUntil: 0, negDay: 0, spent: 0 });
  SU.cats = (sp) => sp.cats || ALL();
  SU.sells = (sp, p) => SU.cats(sp).includes(p.cat) && (!sp.perishOnly || p.life > 0) && p.lvl <= M.S.level;
  SU.available = () => M.SUPPLIERS.filter((s) => s.lvl <= M.S.level);
  SU.discount = function (sp) {
    const st = SU.state(sp.id);
    let d = Math.min(0.08, st.rel * 0.0008);
    if (st.discUntil >= M.S.day) d += st.disc;
    if (M.S.cdOwned) d += 0.06;
    return d;
  };
  SU.unit = (sp, pid) => U.round2(M.P[pid].cost * sp.mult * (1 - SU.discount(sp)));
  SU.volume = (total) => (total >= 20000 ? 0.09 : total >= 5000 ? 0.06 : total >= 1000 ? 0.03 : 0);
  SU.eta = (sp) => Math.round(sp.eta * (M.S.cdOwned ? 0.5 : 1));
  SU.quote = function (sp, items) {
    let sub = 0;
    for (const it of items) sub += SU.unit(sp, it.p) * it.q;
    const vol = SU.volume(sub);
    const ship = sub > 0 ? Math.max(25, Math.round(sub * 0.015)) : 0;
    return { sub, vol, ship, total: U.round2(sub * (1 - vol) + ship) };
  };
  SU.best = function (pid) { // fornecedor mais barato disponível para o produto
    let best = null, bp = Infinity;
    for (const sp of SU.available()) if (SU.sells(sp, M.P[pid])) { const u = SU.unit(sp, pid) * (1 + sp.eta / 4000); if (u < bp) { bp = u; best = sp; } }
    return best;
  };

  SU.order = function (s, supId, items, auto) {
    const sp = M.SUP[supId];
    items = items.filter((it) => it.q > 0 && SU.sells(sp, M.P[it.p]));
    if (!items.length) return null;
    const q = SU.quote(sp, items);
    if (q.sub < sp.min) { if (!auto) M.toast('Pedido mínimo de ' + sp.name + ': ' + U.money0(sp.min) + '.', 'bad'); return null; }
    if (!M.eco.spend(q.total, 'compras', s.id)) { if (!auto) M.toast('Dinheiro insuficiente para este pedido.', 'bad'); return null; }
    const late = Math.random() > sp.rel ? 1.6 : 1;
    const o = { id: M.S.nextOrderId++, store: s.id, sup: supId, items: items.map((i) => ({ p: i.p, q: Math.round(i.q) })), cost: q.total, placed: M.now(), eta: M.now() + Math.round(SU.eta(sp) * late * U.rnd(0.9, 1.1)), status: 'a caminho', auto: !!auto };
    M.S.orders.push(o);
    const st = SU.state(supId); st.spent += q.total; st.rel = Math.min(100, st.rel + q.total / 400);
    M.S.week.orders = (M.S.week.orders || 0) + 1;
    if (!auto) { M.audio.sfx('buy'); M.notify('Pedido #' + o.id + ' feito com ' + sp.name + ' (' + U.money0(q.total) + '). Chega em ' + U.dur(o.eta - M.now()) + '.', 'info'); }
    M.bus.emit('order', o);
    return o;
  };

  SU.negotiate = function (supId) {
    const sp = M.SUP[supId], st = SU.state(supId);
    if (st.negDay === M.S.day) return M.toast('Você já negociou com ' + sp.name + ' hoje.', 'bad');
    st.negDay = M.S.day;
    const mgr = M.S.stores.some((s) => s.emps.some((e) => e.role === 'gerente'));
    const p = 0.3 + st.rel / 220 + (mgr ? 0.15 : 0) + (M.S.hq ? 0.1 : 0);
    if (Math.random() < p) {
      st.disc = U.round2(U.rnd(0.04, 0.1 + st.rel / 1000)); st.discUntil = M.S.day + 2;
      M.audio.sfx('coin');
      M.notify('Negociação com ' + sp.name + ' bem-sucedida: ' + Math.round(st.disc * 100) + '% de desconto por 3 dias!', 'good');
      M.bus.emit('negotiate', { ok: true });
    } else {
      st.rel = Math.max(0, st.rel - 3);
      M.audio.sfx('error');
      M.notify(sp.name + ' recusou sua proposta. Tente novamente amanhã.', 'bad');
      M.bus.emit('negotiate', { ok: false });
    }
    M.bus.emit('ui');
  };

  // ---------- entregas ----------
  SU.update = function () {
    const now = M.now();
    for (const o of M.S.orders) {
      if (o.status !== 'a caminho' || now < o.eta) continue;
      const s = M.game.storeById(o.store);
      if (!s) { o.status = 'cancelado'; continue; }
      o.status = 'chegando';
      s._trucks.push({ order: o, x: -5, tx: doorX(s) - 1.5, st: 'in', t: 0, color: M.SUP[o.sup].color, boxes: Math.min(8, 2 + o.items.length) });
      if (s.id === M.S.curId && M.R.view === 'store') M.audio.sfx('truck');
    }
    if (M.S.orders.length > 60) M.S.orders = M.S.orders.filter((o) => o.status !== 'entregue' || o.placed > now - 2000);
  };
  function doorX(s) { const d = s._doors && s._doors[0]; return d != null ? (d % s.gw) + 0.5 : s.ownW / 2; }

  // caminhões na rua em frente à loja (coordenadas em tiles; y fixo na via)
  SU.updateTrucks = function (s, dt) {
    for (let i = s._trucks.length - 1; i >= 0; i--) {
      const t = s._trucks[i];
      if (t.st === 'in') { t.x += dt * 2.2; if (t.x >= t.tx) { t.x = t.tx; t.st = 'unload'; t.t = 0; } }
      else if (t.st === 'unload') {
        t.t += dt;
        if (t.t >= 8) {
          const o = t.order;
          for (const it of o.items) s.dock.push({ p: it.p, q: it.q });
          o.status = 'entregue';
          t.st = 'out';
          if (!o.auto || s.id === M.S.curId) M.notify('Entrega do pedido #' + o.id + ' recebida em ' + s.name + '.', 'info');
          M.bus.emit('delivered', o);
        }
      } else { t.x += dt * 2.6; if (t.x > s.gw + 8) s._trucks.splice(i, 1); }
    }
  };

  // ---------- reposição automática (exige gerente na loja ou escritório central) ----------
  SU.autoEnabled = (s) => s.auto.order && (M.S.hq || s.emps.some((e) => e.role === 'gerente'));
  SU.autoOrder = function (s) {
    if (!SU.autoEnabled(s) || !M.stores.isRetail(s)) return;
    const listed = M.inv.listed(s), groups = {};
    for (const pid in listed) {
      let cap = 0; for (const f of M.inv.findSlots(s, pid)) cap += M.inv.slotCap(f.o, pid);
      const have = M.inv.total(s, pid) + M.stores.pendingQty(s, pid);
      if (have > cap * (0.4 + s.auto.level)) continue;
      const want = Math.ceil(cap * (1.2 + s.auto.level * 2) - have);
      const sp = SU.best(pid); if (!sp || want <= 0) continue;
      (groups[sp.id] = groups[sp.id] || []).push({ p: pid, q: want });
    }
    let free = M.inv.free(s) - M.inv.dockQty(s);
    for (const sid in groups) {
      const sp = M.SUP[sid];
      let items = groups[sid];
      const tot = U.sum(items, (i) => i.q);
      if (tot > free) { const f = Math.max(0, free) / tot; items = items.map((i) => ({ p: i.p, q: Math.floor(i.q * f) })).filter((i) => i.q > 0); }
      if (!items.length) continue;
      let q = SU.quote(sp, items);
      if (q.sub < sp.min) { const alt = M.SUP.rapida; if (items.every((i) => SU.sells(alt, M.P[i.p]))) { const o = SU.order(s, 'rapida', items, true); if (o) free -= U.sum(items, (i) => i.q); } continue; }
      if (q.total > M.S.money * 0.6) continue;
      const o = SU.order(s, sid, items, true);
      if (o) free -= U.sum(items, (i) => i.q);
    }
  };
})();
