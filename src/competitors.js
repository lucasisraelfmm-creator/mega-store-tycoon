/* Empresas concorrentes controladas por IA: abrem lojas, compram estoque, contratam, definem preços,
   fazem promoções e disputam participação de mercado com o jogador. */
(function () {
  'use strict';
  const M = window.MST, U = M.U;
  const CP = (M.comps = {});

  M.COMPANIES = [
    { id: 'economix', name: 'Rede Economix', color: '#e03131', strat: 'preco', priceIdx: 0.9, minIdx: 0.82, quality: 52, maxStores: 5, enter: 1, zones: ['residencial', 'industrial'], slogan: 'O menor preço da cidade.' },
    { id: 'superbom', name: 'SuperBom', color: '#1971c2', strat: 'equilibrio', priceIdx: 1.0, minIdx: 0.9, quality: 64, maxStores: 5, enter: 1, zones: ['centro', 'residencial'], slogan: 'Qualidade com preço justo.' },
    { id: 'gourmet', name: 'Empório Gourmet', color: '#7048e8', strat: 'qualidade', priceIdx: 1.2, minIdx: 1.05, quality: 86, maxStores: 3, enter: 9, zones: ['centro'], slogan: 'Produtos selecionados para você.' },
    { id: 'megamart', name: 'MegaMart', color: '#f08c00', strat: 'expansao', priceIdx: 0.96, minIdx: 0.86, quality: 60, maxStores: 8, enter: 18, zones: ['centro', 'residencial', 'industrial'], slogan: 'Tudo o que você precisa, em todo lugar.' },
  ];

  CP.init = function () {
    M.S.comps = M.COMPANIES.map((d) => ({ id: d.id, name: d.name, color: d.color, strat: d.strat, priceIdx: d.priceIdx, quality: d.quality, money: d.enter > 1 ? 30000 : 15000, stores: [], active: d.enter <= 1, emps: 0, rev: 0, promoUntil: 0, hist: [] }));
    for (const c of M.S.comps) if (c.active) CP.openStore(c, true);
    if (M.S.comps[0].active) CP.openStore(M.S.comps[0], true);
    CP.updateMarket();
  };
  const def = (c) => M.COMPANIES.find((d) => d.id === c.id);

  CP.openStore = function (c, silent) {
    const d = def(c);
    const free = M.S.lots.filter((l) => !l.owner && !l.hq);
    if (!free.length) return false;
    const pref = free.filter((l) => d.zones.includes(l.zone));
    const pool = pref.length ? pref : free;
    // prefere terrenos próximos às lojas do jogador (competição direta) na estratégia de expansão/preço
    const player = M.S.stores.map((s) => (s.lotId != null ? M.world.center(M.world.lot(s.lotId)) : null)).filter(Boolean);
    const lot = U.wpick(pool, (l) => {
      let w = l.pop * (l.size === 'P' ? 0.5 : 1) * (c.money > l.price * 3 ? 1.5 : 1);
      if (l.price > c.money * 0.8 && !silent) w *= 0.05;
      if (player.length && (d.strat === 'preco' || d.strat === 'expansao')) { const md = Math.min(...player.map((p) => U.dist(p[0], p[1], l.x, l.y))); w *= 1 + 30 / (10 + md); }
      return w;
    });
    if (!lot) return false;
    if (!silent) c.money -= lot.price;
    lot.owner = c.id;
    c.stores.push({ lotId: lot.id, rating: c.quality - 5 + Math.random() * 10, openDay: silent ? 0 : M.S.day + 2, rev: 0 });
    if (!silent) M.notify(c.name + ' comprou um terreno em ' + lot.name + ' (' + M.ZONES[lot.zone].name + ') e vai abrir uma loja.', 'warn');
    M.bus.emit('compOpened', { comp: c, lot });
    return true;
  };

  CP.updateMarket = function () {
    let w = 0, s = 0;
    for (const c of M.S.comps) if (c.active) for (const st of c.stores) { const k = M.SIZE_MULT[M.world.lot(st.lotId).size]; w += k; s += k * CP.effIdx(c); }
    M.S.market.idx = w ? U.clamp(s / w, 0.85, 1.15) : 1;
  };
  CP.effIdx = (c) => c.priceIdx * (c.promoUntil >= M.S.day ? 0.9 : 1);

  // participação de mercado (atratividade ponderada)
  CP.shares = function () {
    const out = [];
    let tot = 0;
    let pa = 0;
    for (const s of M.S.stores) if (M.stores.isRetail(s) && M.stores.isOpenNow(s)) pa += (0.5 + s.rating / 100) * M.SIZE_MULT[s.size] * M.world.zonePop(s) / Math.max(0.6, M.cust.priceIndex(s));
    out.push({ id: 'player', name: M.S.name, color: M.S.brand, a: pa, stores: M.S.stores.filter(M.stores.isRetail).length });
    tot += pa;
    for (const c of M.S.comps) {
      if (!c.active) continue;
      let a = 0; for (const st of c.stores) if (st.openDay <= M.S.day) { const l = M.world.lot(st.lotId); a += (0.5 + st.rating / 100) * M.SIZE_MULT[l.size] * l.pop / CP.effIdx(c); }
      out.push({ id: c.id, name: c.name, color: c.color, a, stores: c.stores.length, comp: c });
      tot += a;
    }
    for (const o of out) o.share = tot ? o.a / tot : 0;
    return out;
  };

  CP.daily = function () {
    const shares = CP.shares(), mine = shares[0].share;
    for (const c of M.S.comps) {
      const d = def(c);
      if (!c.active) {
        if (M.S.day >= d.enter) { c.active = true; CP.openStore(c, false); M.notify('Nova concorrente na cidade: ' + c.name + ' — "' + d.slogan + '"', 'warn'); }
        continue;
      }
      let rev = 0, cost = 0;
      for (const st of c.stores) {
        if (st.openDay > M.S.day) continue;
        const l = M.world.lot(st.lotId), k = M.SIZE_MULT[l.size];
        const r = 2600 * k * l.pop * (0.5 + st.rating / 100) / Math.pow(CP.effIdx(c), 1.6) * (1.05 - mine * 0.6) * U.rnd(0.85, 1.15) * (1 + M.S.level * 0.12);
        st.rev = r; rev += r;
        cost += r * (0.74 / CP.effIdx(c) * 0.98) + 220 * k;
        st.rating = U.clamp(st.rating + (c.quality - st.rating) * 0.1 + U.rnd(-2, 2), 10, 98);
      }
      c.rev = rev; c.money += rev - cost;
      c.emps = Math.round(U.sum(c.stores, (st) => M.SIZE_MULT[M.world.lot(st.lotId).size] * 7));
      c.hist.push(Math.round(rev)); if (c.hist.length > 30) c.hist.shift();
      // política de preços: reage à participação do jogador
      const my = shares.find((x) => x.id === c.id);
      if (my) {
        if (mine > my.share * 1.2 && c.priceIdx > d.minIdx) c.priceIdx = U.round2(Math.max(d.minIdx, c.priceIdx - 0.01));
        else if (c.priceIdx < d.priceIdx) c.priceIdx = U.round2(Math.min(d.priceIdx, c.priceIdx + 0.005));
      }
      // investimentos em qualidade
      if (c.money > 40000 && c.quality < 95 && U.chance(0.15)) { c.money -= 8000; c.quality = Math.min(95, c.quality + 2); }
      // promoções agressivas
      if (c.promoUntil < M.S.day && U.chance(d.strat === 'preco' ? 0.08 : 0.04)) { c.promoUntil = M.S.day + 2; M.notify(c.name + ' anunciou uma grande promoção nos próximos 3 dias!', 'warn'); }
      // expansão
      const growth = d.strat === 'expansao' ? 0.35 : 0.18;
      const openNew = c.stores.length < d.maxStores + Math.floor(M.S.level / 2) && c.money > 45000 && U.chance(growth);
      if (openNew) CP.openStore(c, false);
      // falência / fechamento
      if (c.money < -20000 && c.stores.length > 1) {
        const st = c.stores.pop(); const l = M.world.lot(st.lotId); l.owner = null;
        c.money += l.price * 0.6;
        M.notify(c.name + ' fechou uma loja em ' + l.name + '. O terreno voltou ao mercado.', 'good');
      }
    }
    CP.updateMarket();
  };
})();
