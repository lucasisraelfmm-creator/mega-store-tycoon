/* Estado do jogo, loop principal (passo fixo), relógio, ciclo diário (abertura, fechamento,
   despesas, relatórios), troca de visão/loja e eventos globais. */
(function () {
  'use strict';
  const M = window.MST, U = M.U, C = M.C;
  const GM = (M.game = {});

  M.DIFFS = [
    { name: 'Fácil', money: 9000, mult: 1.15, desc: 'Mais capital inicial e clientes mais generosos.' },
    { name: 'Normal', money: 5000, mult: 1, desc: 'A experiência equilibrada.' },
    { name: 'Difícil', money: 2500, mult: 0.88, desc: 'Pouco dinheiro e concorrência acirrada.' },
  ];
  M.BRANDS = ['#f59f00', '#e8590c', '#12b886', '#4c6ef5', '#d6336c', '#7048e8', '#0ca678', '#1098ad'];

  GM.storeById = (id) => { if (!M.S) return null; for (const s of M.S.stores) if (s.id === id) return s; return null; };
  GM.store = () => GM.storeById(M.S && M.S.curId);

  GM.normalize = function (s) {
    s._cust = []; s._trucks = []; s._spawnAcc = 0; s._door = {};
    s.led = s.led || M.eco.ledger(); s.dock = s.dock || []; s.dirt = s.dirt || []; s.batches = s.batches || {}; s.storage = s.storage || {};
    s.hist = s.hist || []; s.day = Object.assign(M.build.newDay(), s.day || {}); s.life = s.life || { sales: 0, cust: 0 };
    s.auto = s.auto || { order: false, level: 0.35 }; s.facade = s.facade || { color: 0, sign: 0, awning: 0 };
    s.day.top = s.day.top || {};
    for (const e of s.emps) { e._a = null; e.sk = e.sk || { vel: e.eff, atend: e.eff, org: e.eff }; }
    for (const o of s.objs) { o._q = []; o._op = null; if (o.slots) for (const sl of o.slots) sl._res = 0; }
    M.build.refresh(s);
  };

  GM.blankState = function (opts) {
    const D = M.DIFFS[opts.diff];
    return {
      ver: 1, seed: opts.seed || ((Math.random() * 1e9) | 0), name: opts.name, brand: opts.brand, diff: opts.diff, diffMult: D.mult,
      look: opts.look || M.sprites.randomLook(),
      money: D.money, day: 1, minute: C.DAY_START, speed: 1, level: 1, xp: 0,
      nextStoreId: 1, nextEmpId: 1, nextOrderId: 1, nextMid: 0, stores: [], curId: null,
      prices: {}, orders: [], cands: {}, candDay: 0, today: M.eco.ledger(), hist: [], debt: 0,
      comps: [], lots: [], missions: { daily: [], weekly: [], event: [], ach: {} }, events: { active: [] }, promos: [], camps: [], sup: {},
      tut: { step: 0, done: false }, stats: { sales: 0, cust: 0, items: 0, profitDays: 0, best: 0, missions: 0 },
      hq: false, cdOwned: false, td: GM.newTd(), week: GM.newWeek(), market: { idx: 1 }, bankrupt: 0, played: 0,
    };
  };
  GM.newTd = () => ({ sales: 0, cust: 0, items: 0, cat: {}, restock: 0 });
  GM.newWeek = () => ({ sales: 0, profit: 0, cust: 0, builds: 0, hires: 0, orders: 0 });

  GM.newGame = function (opts) {
    M.S = GM.blankState(opts);
    M.world.initLots();
    const lot = M.S.lots.find((l) => l.size === 'M' && l.zone === 'residencial' && Math.floor(l.x / 16) === 1) || M.S.lots.find((l) => l.size === 'M');
    const s = M.build.newStore('mercadinho', 'M', opts.storeName || ('Mercadinho ' + opts.name), true);
    s.lotId = lot.id; lot.owner = 'player'; lot.storeId = s.id; lot.rented = true;
    M.S.stores.push(s); GM.normalize(s);
    M.S.curId = s.id;
    M.comps.init();
    M.emps.refreshCandidates(true);
    M.missions.newDay(); M.missions.newWeek();
    M.events.daily();
    GM.afterLoad();
    M.notify('Bem-vindo(a), ' + opts.name + '! Sua primeira loja abriu as portas.', 'good');
  };

  GM.afterLoad = function () {
    M.world.initLots();
    for (const s of M.S.stores) GM.normalize(s);
    M.comps.updateMarket();
    M.fx.parts = [];
    const s = GM.store() || M.S.stores[0]; M.S.curId = s.id;
    M.player.enter(s);
    GM.setView('store');
    M.R.paused = false;
    M.bus.emit('loaded');
    M.bus.emit('ui');
  };

  GM.setStore = function (id) {
    const s = GM.storeById(id); if (!s) return;
    M.S.curId = id;
    M.player.enter(s);
    M.render.fit(M.R.cams.store, M.R.vw, M.R.vh);
    M.build.exit();
    M.bus.emit('storeChanged', s); M.bus.emit('ui');
  };
  GM.setView = function (v) {
    if (v === M.R.view) return;
    M.R.view = v;
    if (v === 'store') M.render.fit(M.R.cams.store, M.R.vw, M.R.vh);
    if (v === 'world') { M.build.exit(); const s = GM.store(); const l = s && s.lotId != null ? M.world.lot(s.lotId) : null; const cam = M.R.cams.world; if (l && !cam._init) { cam.x = (l.x + l.w / 2) * 32; cam.y = (l.y + l.h / 2) * 32; cam.z = 0.8; cam._init = true; } }
    M.bus.emit('view', v); M.bus.emit('ui');
  };

  GM.hourCurve = function (min) {
    const h = min / 60;
    return 0.58 + 0.42 * Math.exp(-Math.pow(h - 12.2, 2) / 3) + 0.55 * Math.exp(-Math.pow(h - 18.4, 2) / 3.5) + (h < 8 ? -0.15 : 0) + (h > 21 ? -0.18 : 0);
  };
  GM.darkness = function () {
    if (!M.S) return 0;
    const m = M.S.minute;
    if (m < 8 * 60) return U.clamp((8 * 60 - m) / 60, 0, 1) * 0.35;
    if (m > 17.5 * 60) return U.clamp((m - 17.5 * 60) / (4.5 * 60), 0, 1);
    return 0;
  };
  GM.avgSat = function () {
    let a = 0, n = 0; for (const s of M.S.stores) { a += s.day.satSum; n += s.day.satN; }
    return n ? a / n : 0;
  };
  GM.recordSale = function (s, pid, q) {
    s.day.top[pid] = (s.day.top[pid] || 0) + q;
    const cat = M.P[pid].cat;
    M.S.td.cat[cat] = (M.S.td.cat[cat] || 0) + q;
    M.S.td.items += q;
    M.bus.emit('saleItem', { p: pid, q, store: s });
  };
  M.bus.on('sale', (d) => { if (!M.S) return; M.S.td.sales += d.total; if (!d.delivery) M.S.td.cust++; });
  M.bus.on('build', (d) => { if (M.S && d && (d.what === 'obj' || d.what === 'cells')) M.S.week.builds = (M.S.week.builds || 0) + 1; });

  GM.setSpeed = function (v) { M.S.speed = v; M.bus.emit('speed'); M.bus.emit('ui'); };

  // ---------- passo de simulação ----------
  let hourMark = -1, missionT = 0;
  GM.step = function (d) {
    const S = M.S;
    S.minute += d;
    if (S.minute >= C.DAY_END) { GM.endDay(); return; }
    for (const s of S.stores) {
      if (!M.stores.isOpenNow(s)) continue;
      if (s.buildUntil && !s._opened) { s._opened = true; s.buildUntil = 0; M.notify('Inauguração! ' + s.name + ' abriu as portas.', 'good'); M.audio.sfx('levelup'); M.bus.emit('inaugurated', s); }
      if (M.stores.isRetail(s)) M.cust.update(s, d);
      M.emps.update(s, d);
      M.sup.updateTrucks(s, d);
      // descarga lenta quando não há estoquista em serviço
      if (s.dock.length && !s.emps.some((e) => (e.role === 'estoquista' || e.role === 'repositor') && e._a)) { s._unAcc = (s._unAcc || 0) + d * 1.5; if (s._unAcc >= 1) { M.inv.unload(s, Math.floor(s._unAcc)); s._unAcc %= 1; } }
      if (s._agg.income) { const v = (s._agg.income * d) / C.DAY_LEN; if (v > 0) { M.eco.earn(v, 'servicos', s.id); } }
    }
    M.sup.update();
    const hr = Math.floor(S.minute / 60);
    if (hr !== hourMark) {
      hourMark = hr;
      if (hr === 8 || hr === 13 || hr === 18) for (const s of S.stores) M.sup.autoOrder(s);
      M.bus.emit('hour', hr);
    }
  };

  GM.tick = function (dt) {
    if (!M.S || M.R.view === 'menu') return;
    M.world.updateTraffic(dt * (M.R.paused ? 0 : 1));
    if (M.R.paused || M.R.modal) { M.fx.update(dt); return; }
    M.S.played += dt;
    M.player.update(dt);
    M.fx.update(dt);
    if (M.S.speed > 0) {
      let left = Math.min(dt, 0.1) * C.MIN_PER_SEC * M.S.speed;
      let guard = 20;
      while (left > 0 && guard-- > 0) {
        const d = Math.min(left, 0.5);
        const dayBefore = M.S.day;
        GM.step(d); left -= d;
        if (M.S.day !== dayBefore) break;
      }
    }
    missionT += dt;
    if (missionT > 0.5) { missionT = 0; M.missions.update(); M.prog.check(); }
  };

  // ---------- fim do dia ----------
  GM.endDay = function () {
    const S = M.S, E = M.eco, rep = { day: S.day, stores: [], date: U.date(S.day) };
    for (const s of S.stores) {
      M.cust.clear(s);
      for (const e of s.emps) { M.emps.release(s, e); e._a = null; }
      s._trucks = s._trucks.filter((t) => { if (t.st !== 'out') { for (const it of t.order.items) s.dock.push({ p: it.p, q: it.q }); t.order.status = 'entregue'; } return false; });
      for (const o of s.objs) if (o._op === 'player') o._op = null;
      const sal = M.emps.payroll(s), rent = s.rent || 0, maint = Math.round(s._agg.maint * 100) / 100, tax = U.round2(s.day.sales * E.TAX);
      if (sal) E.spend(sal, 'salarios', s.id, true);
      if (rent) E.spend(rent, 'aluguel', s.id, true);
      if (maint) E.spend(maint, 'manutencao', s.id, true);
      if (tax) E.spend(tax, 'impostos', s.id, true);
      const t = E.totals(s.led);
      const profit = U.round2(s.day.sales + (s.led.inc.servicos || 0) - s.day.cogs - sal - rent - maint - tax);
      const sat = s.day.satN ? s.day.satSum / s.day.satN : 0;
      const top = Object.keys(s.day.top).map((p) => ({ p, q: s.day.top[p] })).sort((a, b) => b.q - a.q).slice(0, 5);
      const miss = Object.keys(s.day.miss || {}).map((p) => ({ p, q: s.day.miss[p] })).sort((a, b) => b.q - a.q).slice(0, 4);
      const wishes = Object.keys(s.day.wishes || {}).map((p) => ({ p, q: s.day.wishes[p] })).sort((a, b) => b.q - a.q).slice(0, 4);
      const r = { id: s.id, name: s.name, type: s.type, sales: s.day.sales, serv: s.led.inc.servicos || 0, buys: s.led.exp.compras || 0, invest: (s.led.exp.construcao || 0) + (s.led.exp.outros || 0) + (s.led.exp.treinamento || 0) + (s.led.exp.rescisao || 0), cogs: s.day.cogs, gross: s.day.sales - s.day.cogs, inc: t.inc, exp: t.exp, profit, sal, rent, maint, tax, cust: s.day.cust, served: s.day.served, sat, lost: s.day.lost, stockout: s.day.stockout, pricey: s.day.pricey, theft: s.day.theft, thefts: s.day.thefts || 0, caught: s.day.caught || 0, exp_: s.day.exp, items: s.day.items, queueQuit: s.day.queueQuit || 0, deliv: s.day.deliv || 0, dirt: s.dirt.length, rating: s.rating, top, miss, wishes, wish: s.day.wish || 0 };
      r.tips = tips(s, r);
      rep.stores.push(r);
      s.hist.push({ day: S.day, sales: s.day.sales, profit, cust: s.day.cust, served: s.day.served, sat, rating: s.rating });
      if (s.hist.length > 168) s.hist.shift();
      M.emps.daily(s);
    }
    if (S.debt > 0) E.spend(U.round2(S.debt * E.LOAN_RATE), 'juros', null, true);
    if (S.money < 0) E.spend(U.round2(-S.money * E.OVERDRAFT_RATE), 'juros', null, true);
    M.missions.endDay();
    const tt = E.totals(S.today), loanIn = S.today.inc.emprestimos || 0;
    const sales = U.sum(rep.stores, (r) => r.sales), cust = U.sum(rep.stores, (r) => r.cust);
    rep.inc = tt.inc - loanIn; rep.exp = tt.exp; rep.profit = rep.inc - rep.exp; rep.money = S.money; rep.byInc = Object.assign({}, S.today.inc); rep.byExp = Object.assign({}, S.today.exp); rep.sales = sales; rep.cust = cust;
    rep.missions = S.missions.daily.map((m) => ({ txt: m.txt, done: m.done }));
    S.hist.push({ day: S.day, inc: rep.inc, exp: rep.exp, sales, cust, money: S.money, profit: rep.profit });
    if (S.hist.length > 336) S.hist.shift();
    if (rep.profit > 0) S.stats.profitDays++;
    S.stats.best = Math.max(S.stats.best, sales);
    S.week.profit += rep.profit; S.week.sales += sales; S.week.cust += cust;
    M.comps.daily();
    rep.share = M.comps.shares()[0].share;
    // falência
    S.bankrupt = S.money < -15000 ? S.bankrupt + 1 : 0;
    if (S.bankrupt === 2) M.notify('Atenção: sua empresa está muito endividada! Mais um dia assim e você vai à falência.', 'bad');
    rep.bankrupt = S.bankrupt >= 3;
    // novo dia
    S.day++; S.minute = C.DAY_START; hourMark = -1;
    S.today = E.ledger(); S.td = GM.newTd();
    const newWeek = (S.day - 1) % 7 === 0;
    for (const s of S.stores) {
      s.led = E.ledger(); s.day = M.build.newDay(); s.day.top = {}; s._comp = null;
      const lost = M.inv.expire(s, S.day);
      if (lost.length) { const v = U.sum(lost, (l) => l.q * M.P[l.p].cost); s.day.exp = v; rep.expired = (rep.expired || 0) + v; M.notify(U.num(U.sum(lost, (l) => l.q)) + ' produtos venceram em ' + s.name + ' (' + U.money0(v) + ' de prejuízo).', 'bad'); }
    }
    if (newWeek) { M.missions.newWeek(); S.week = GM.newWeek(); }
    M.missions.newDay();
    M.events.daily();
    M.emps.refreshCandidates();
    S.promos = S.promos.filter((p) => p.until >= S.day);
    S.camps = S.camps.filter((c) => c.until >= S.day);
    for (const s of S.stores) M.sup.autoOrder(s);
    M.R.report = rep;
    M.bus.emit('dayEnd', rep);
    try { M.save.save('auto', true); } catch (e) { console.error(e); }
  };

  function tips(s, r) {
    const out = [];
    if (r.stockout > 8) out.push('Clientes encontraram prateleiras vazias ' + r.stockout + ' vezes. Faça pedidos maiores, ative a reposição automática ou contrate repositores.');
    if (r.wish > 10 && r.wishes.length) out.push('Clientes procuraram produtos que você não vende (' + r.wishes.map((w) => M.P[w.p].name).join(', ') + '). Coloque-os nas prateleiras.');
    if (r.pricey > 12) out.push(r.pricey + ' clientes acharam os preços altos. Revise as margens no Catálogo.');
    if (r.queueQuit > 2) out.push(r.queueQuit + ' clientes desistiram da fila. Contrate operadores de caixa ou instale mais caixas.');
    if (r.dirt > 6) out.push('A loja está suja (' + r.dirt + ' pontos). Contrate um faxineiro ou instale lixeiras.');
    if (r.thefts > 0) out.push(r.thefts + ' furto(s) hoje (' + U.money0(r.theft) + '). Seguranças e câmeras reduzem perdas.');
    if (r.served && r.sat < 60) out.push('Satisfação baixa. Decoração, limpeza, preços justos e filas curtas ajudam.');
    if (!s.emps.length && r.cust > 30) out.push('Você está fazendo tudo sozinho! Contrate funcionários para a loja funcionar automaticamente.');
    if (M.inv.free(s) < 20 && M.stores.isRetail(s)) out.push('Depósito quase lotado. Construa mais estantes de depósito.');
    if (!out.length && r.profit > 0) out.push('Ótimo dia! Considere ampliar a loja ou investir em marketing.');
    return out;
  }

  GM.closeReport = function () {
    const rep = M.R.report; M.R.report = null;
    if (rep && rep.bankrupt) { M.bus.emit('gameOver'); return; }
    M.bus.emit('ui');
  };

  // atalhos de compra de imóveis especiais
  GM.buyHQ = function () {
    if (M.S.hq) return;
    if (M.S.level < 5) return M.toast('O escritório central é liberado no nível 5.', 'bad');
    const lot = M.S.lots.find((l) => l.hq);
    if (!M.eco.spend(lot.price, 'terrenos')) return M.toast('Você precisa de ' + U.money0(lot.price) + '.', 'bad');
    M.S.hq = true; lot.owner = 'player';
    M.audio.sfx('levelup');
    M.notify('Sua empresa agora tem uma sede própria! Bônus de eficiência e pedidos automáticos em todas as lojas.', 'good');
    M.bus.emit('ui');
  };
})();
