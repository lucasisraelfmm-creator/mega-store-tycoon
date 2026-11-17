/* Progressão (7 níveis empresariais), missões diárias e semanais, objetivos especiais (conquistas),
   datas comemorativas, eventos aleatórios e desafios de vendas. */
(function () {
  'use strict';
  const M = window.MST, U = M.U;

  // ---------- níveis ----------
  M.LEVELS = [
    { n: 1, name: 'Pequena Loja', xp: 0, desc: 'Uma lojinha de bairro com poucas prateleiras.' },
    { n: 2, name: 'Mercado de Bairro', xp: 450, desc: 'Geladeiras, hortifrúti, limpeza e higiene.' },
    { n: 3, name: 'Supermercado', xp: 1800, desc: 'Gôndolas, brinquedos, ferramentas e gerentes.' },
    { n: 4, name: 'Grande Supermercado', xp: 5200, desc: 'Eletrônicos, roupas e autoatendimento.' },
    { n: 5, name: 'Rede Comercial', xp: 14000, stores: 2, desc: 'Móveis, centro de distribuição e escritório central.' },
    { n: 6, name: 'Centro Comercial', xp: 36000, stores: 3, desc: 'Produtos de luxo e shopping centers.' },
    { n: 7, name: 'Império Empresarial', xp: 90000, stores: 5, desc: 'O topo do varejo nacional.' },
  ];
  const PR = (M.prog = {});
  PR.next = () => M.LEVELS[M.S.level] || null;
  PR.retailStores = () => M.S.stores.length;
  PR.canLevel = function () {
    const n = PR.next(); if (!n) return false;
    return M.S.xp >= n.xp && (!n.stores || PR.retailStores() >= n.stores);
  };
  PR.check = function () {
    if (!PR.canLevel()) return;
    M.S.level++;
    const L = M.LEVELS[M.S.level - 1];
    M.audio.sfx('levelup');
    if (M.fx) M.fx.confetti();
    M.bus.emit('levelup', { level: M.S.level, info: L, unlocks: PR.unlocks(M.S.level) });
    M.notify('Nível ' + L.n + ' — ' + L.name + '!', 'good');
    for (const s of M.S.stores) { s._lc = null; }
  };
  PR.unlocks = function (n) {
    const out = [];
    for (const k in M.BUILD) if (M.BUILD[k].lvl === n) out.push({ t: 'Construção', name: M.BUILD[k].name });
    for (const k in M.ROLES) if (M.ROLES[k].lvl === n) out.push({ t: 'Funcionário', name: M.ROLES[k].name });
    for (const k in M.STORE_TYPES) if (M.STORE_TYPES[k].lvl === n && n > 1) out.push({ t: 'Estabelecimento', name: M.STORE_TYPES[k].name });
    for (const s of M.SUPPLIERS) if (s.lvl === n && n > 1) out.push({ t: 'Fornecedor', name: s.name });
    for (const c of M.eco.CAMPAIGNS) if (c.lvl === n && n > 1) out.push({ t: 'Marketing', name: c.name });
    const prods = M.PRODUCTS.filter((p) => p.lvl === n);
    if (prods.length && n > 1) {
      const cats = {}; for (const p of prods) cats[p.cat] = (cats[p.cat] || 0) + 1;
      for (const c in cats) out.push({ t: 'Produtos', name: cats[c] + ' em ' + M.CAT[c].name });
    }
    if (n === 5) out.push({ t: 'Empresa', name: 'Escritório Central' });
    return out;
  };

  // ---------- eventos ----------
  M.EVENT_DEFS = [
    { id: 'verao', name: 'Verão Escaldante', m: 0, a: 4, b: 13, cats: { bebidas: 1.4 }, prods: { 'Sorvete 2L': 2.5, 'Água de Coco': 2 }, traffic: 1.05, icon: 'sol' },
    { id: 'anonovo', name: 'Ano Novo', m: 0, a: 1, b: 2, cats: { luxo: 1.5, bebidas: 1.3 }, prods: { Espumante: 5, 'Champanhe Safrado': 4, 'Vinho Branco': 2 }, traffic: 1.15, icon: 'fogos' },
    { id: 'carnaval', name: 'Carnaval', m: 1, a: 6, b: 9, cats: { bebidas: 1.8 }, prods: { 'Cerveja Lata': 3, Isotônico: 2, 'Água Mineral 500ml': 2 }, traffic: 1.1, icon: 'mascara' },
    { id: 'pascoa', name: 'Páscoa', m: 3, a: 5, b: 9, cats: { doces: 1.8 }, prods: { 'Ovo de Chocolate': 9, 'Chocolate ao Leite': 2, Bombom: 2 }, traffic: 1.1, icon: 'ovo' },
    { id: 'maes', name: 'Dia das Mães', m: 4, a: 8, b: 11, cats: { luxo: 2.2, roupas: 1.6, higiene: 1.3 }, prods: { 'Perfume Importado': 4, 'Bolsa Feminina': 3, 'Hidratante': 2 }, traffic: 1.15, icon: 'coracao' },
    { id: 'junina', name: 'Festa Junina', m: 5, a: 6, b: 11, cats: { doces: 1.5, alimentos: 1.15 }, prods: { 'Milho em Conserva': 4, 'Paçoca': 6, 'Goiabada': 3 }, traffic: 1.1, icon: 'fogueira' },
    { id: 'pais', name: 'Dia dos Pais', m: 7, a: 7, b: 10, cats: { ferramentas: 2, eletronicos: 1.5 }, prods: { 'Whisky 12 anos': 4, 'Furadeira': 3, 'Carteira de Couro Fino': 3 }, traffic: 1.12, icon: 'gravata' },
    { id: 'criancas', name: 'Dia das Crianças', m: 9, a: 7, b: 12, cats: { brinquedos: 3, doces: 1.4 }, prods: {}, traffic: 1.15, icon: 'balao' },
    { id: 'blackfriday', name: 'Black Friday', m: 10, a: 10, b: 13, cats: { eletronicos: 2.2, roupas: 1.5 }, prods: {}, all: 1.25, traffic: 1.7, icon: 'tag' },
    { id: 'natal', name: 'Natal', m: 11, a: 5, b: 12, cats: { brinquedos: 2.2, luxo: 1.8, bebidas: 1.3 }, prods: { Panetone: 9, 'Vinho Tinto': 2 }, traffic: 1.3, icon: 'arvore' },
  ];
  M.RANDOM_EVENTS = [
    { id: 'calor', name: 'Onda de Calor', days: 2, cats: { bebidas: 1.8 }, prods: { 'Sorvete 2L': 3 }, traffic: 1, msg: 'Termômetros acima de 38 °C: bebidas geladas e sorvetes em alta!' },
    { id: 'chuva', name: 'Chuva Forte', days: 1, cats: {}, traffic: 0.7, msg: 'Temporal na cidade: menos clientes nas ruas hoje.' },
    { id: 'feriado', name: 'Feriado Prolongado', days: 2, cats: { alimentos: 1.2, bebidas: 1.3 }, traffic: 1.25, msg: 'Feriado prolongado: movimento acima do normal.' },
    { id: 'crise', name: 'Crise Econômica', days: 3, cats: { luxo: 0.5, eletronicos: 0.7 }, traffic: 0.85, msg: 'A inflação subiu: consumidores estão cautelosos.' },
    { id: 'festival', name: 'Festival no Bairro', days: 1, cats: { doces: 1.5, bebidas: 1.4 }, traffic: 1.35, zone: 'residencial', msg: 'Festival de rua no bairro residencial!' },
    { id: 'jogo', name: 'Final do Campeonato', days: 1, cats: { bebidas: 2, alimentos: 1.2 }, prods: { 'Cerveja Lata': 3, 'Refrigerante Lata': 2 }, traffic: 1.1, msg: 'Dia de final: todo mundo quer petiscos e bebidas!' },
    { id: 'inspecao', name: 'Inspeção Sanitária', days: 0, msg: '' },
    { id: 'influencer', name: 'Visita de Influenciador', days: 0, msg: '' },
  ];

  const EV = (M.events = {});
  EV.active = () => M.S.events.active;
  EV.mult = function (p) {
    let m = 1;
    for (const e of M.S.events.active) {
      if (e.all) m *= e.all;
      if (e.cats && e.cats[p.cat]) m *= e.cats[p.cat];
      if (e.prods) for (const k in e.prods) if (p.name.indexOf(k) === 0) m *= e.prods[k];
    }
    return m;
  };
  EV.traffic = function (s) {
    let m = 1;
    for (const e of M.S.events.active) { if (e.zone) { const l = s.lotId != null ? M.world.lot(s.lotId) : null; if (!l || l.zone !== e.zone) continue; } m *= e.traffic || 1; }
    return m;
  };
  EV.upcoming = function (n) {
    const out = [];
    for (let d = M.S.day; d < M.S.day + 60 && out.length < n; d++) {
      const di = U.dateInfo(d);
      for (const e of M.EVENT_DEFS) if (e.m === di.month && e.a === di.dom) out.push({ def: e, day: d });
    }
    return out;
  };

  EV.daily = function () {
    const di = U.dateInfo(M.S.day);
    M.S.events.active = M.S.events.active.filter((e) => e.until >= M.S.day);
    for (const e of M.EVENT_DEFS) {
      if (e.m === di.month && e.a === di.dom && !M.S.events.active.some((x) => x.id === e.id)) {
        const ev = Object.assign({ until: M.S.day + (e.b - e.a), cal: true }, e);
        M.S.events.active.push(ev);
        M.notify('Começou: ' + e.name + '! Demanda especial até o dia ' + ev.until + '.', 'event');
        M.bus.emit('event', ev);
        MI.eventChallenge(ev);
      }
    }
    if (!M.S.events.active.some((e) => !e.cal) && M.S.day > 3 && U.chance(0.14)) {
      const r = U.pick(M.RANDOM_EVENTS);
      if (r.id === 'inspecao') {
        const s = U.pick(M.S.stores.filter(M.stores.isRetail)); if (!s) return;
        if (s.dirt.length > 6) { const f = 400 + s.dirt.length * 60; M.eco.spend(f, 'impostos', s.id, true); M.notify('Inspeção sanitária em ' + s.name + ': multa de ' + U.money0(f) + ' pela sujeira!', 'bad'); }
        else { s.rating = Math.min(100, s.rating + 4); M.notify('Inspeção sanitária aprovou ' + s.name + ' com louvor. Avaliação +4.', 'good'); }
      } else if (r.id === 'influencer') {
        const s = U.pick(M.S.stores.filter(M.stores.isRetail)); if (!s) return;
        if (s.rating > 68) { s.rating = Math.min(100, s.rating + 6); M.S.camps.push({ id: 'influencer', until: M.S.day + 1, boost: 0.25 }); M.notify('Um influenciador elogiou ' + s.name + ' nas redes! Mais clientes pelos próximos 2 dias.', 'good'); }
        else { s.rating = Math.max(0, s.rating - 5); M.notify('Um influenciador criticou ' + s.name + ' nas redes. Avaliação −5.', 'bad'); }
      } else {
        const ev = Object.assign({ until: M.S.day + r.days - 1 }, r);
        M.S.events.active.push(ev);
        M.notify(r.name + ': ' + r.msg, 'event'); M.bus.emit('event', ev);
      }
    }
  };

  // ---------- missões ----------
  const MI = (M.missions = {});
  const avgSales = () => { const h = M.S.hist.slice(-3); return h.length ? Math.max(400, U.sum(h, (r) => r.sales) / h.length) : 600; };
  const roundNice = (v) => (v > 10000 ? Math.round(v / 1000) * 1000 : v > 1000 ? Math.round(v / 100) * 100 : Math.max(5, Math.round(v / 10) * 10));
  const catsSold = () => { const set = {}; for (const s of M.S.stores) { const L = M.inv.listed(s); for (const p in L) set[M.P[p].cat] = 1; } return Object.keys(set); };

  const DAILY = [
    { k: 'vendas', gen: () => { const v = roundNice(avgSales() * U.rnd(1.05, 1.3)); return { target: v, txt: 'Fature ' + U.money0(v) + ' hoje' }; }, prog: () => M.S.td.sales },
    { k: 'clientes', gen: () => { const h = M.S.hist.slice(-3), a = h.length ? U.sum(h, (r) => r.cust) / h.length : 50; const v = roundNice(a * U.rnd(1.05, 1.25)); return { target: v, txt: 'Atenda ' + v + ' clientes hoje' }; }, prog: () => M.S.td.cust },
    { k: 'itens', gen: () => { const v = roundNice(avgSales() / 6); return { target: v, txt: 'Venda ' + v + ' itens hoje' }; }, prog: () => M.S.td.items },
    { k: 'cat', gen: () => { const cs = catsSold(); if (!cs.length) return null; const c = U.pick(cs); const v = roundNice(U.rnd(15, 35) * (1 + M.S.level * 0.4)); return { target: v, cat: c, txt: 'Venda ' + v + ' itens de ' + M.CAT[c].name }; }, prog: (m) => M.S.td.cat[m.cat] || 0 },
    { k: 'repor', gen: () => { const v = roundNice(U.rnd(40, 90) * (1 + M.S.level * 0.3)); return { target: v, txt: 'Reponha ' + v + ' unidades nas prateleiras' }; }, prog: () => M.S.td.restock },
    { k: 'satisf', end: true, gen: () => { const v = U.pick([70, 75, 80]); return { target: v, txt: 'Termine o dia com satisfação média de ' + v + '%' }; }, prog: () => M.game.avgSat() },
    { k: 'lucro', end: true, gen: () => { const v = roundNice(avgSales() * 0.18); return { target: v, txt: 'Tenha lucro líquido de ' + U.money0(v) + ' hoje' }; }, prog: () => { const t = M.eco.totals(M.S.today); return t.inc - t.exp - (M.S.today.inc.emprestimos || 0); } },
  ];
  const WEEKLY = [
    { k: 'w_lucro', gen: () => { const v = roundNice(avgSales() * 7 * 0.2); return { target: v, txt: 'Lucre ' + U.money0(v) + ' nesta semana' }; }, prog: () => M.S.week.profit + (() => { const t = M.eco.totals(M.S.today); return t.inc - t.exp - (M.S.today.inc.emprestimos || 0); })() },
    { k: 'w_clientes', gen: () => { const h = M.S.hist.slice(-3), a = h.length ? U.sum(h, (r) => r.cust) / h.length : 50; const v = roundNice(a * 7 * 1.1); return { target: v, txt: 'Atenda ' + v + ' clientes nesta semana' }; }, prog: () => M.S.week.cust + M.S.td.cust },
    { k: 'w_build', gen: () => { const v = U.rndi(3, 6); return { target: v, txt: 'Construa ' + v + ' itens (expositores, decoração...)' }; }, prog: () => M.S.week.builds || 0 },
    { k: 'w_hire', gen: () => ({ target: 1, txt: 'Contrate um novo funcionário' }), prog: () => M.S.week.hires || 0 },
    { k: 'w_orders', gen: () => { const v = U.rndi(3, 5); return { target: v, txt: 'Faça ' + v + ' pedidos a fornecedores' }; }, prog: () => M.S.week.orders || 0 },
    { k: 'w_rating', gen: () => ({ target: 80, txt: 'Alcance avaliação de 4 estrelas em uma loja' }), prog: () => Math.max(...M.S.stores.map((s) => s.rating)) },
  ];

  function mk(defs, scope, n) {
    const out = [], pool = U.shuffle(defs.slice());
    for (const d of pool) {
      if (out.length >= n) break;
      const g = d.gen(); if (!g) continue;
      const mult = scope === 'w' ? 2.5 : 1;
      out.push({ id: M.S.nextMid = (M.S.nextMid || 0) + 1, k: d.k, scope, txt: g.txt, target: g.target, cat: g.cat, end: !!d.end, done: false, reward: { m: roundNice((70 + M.S.level * 110) * mult * U.rnd(0.8, 1.2)), xp: Math.round((20 + M.S.level * 10) * mult) } });
    }
    return out;
  }
  const defOf = (m) => DAILY.concat(WEEKLY).find((d) => d.k === m.k);
  MI.progress = function (m) {
    if (m.scope === 'e') return m.prog || 0;
    const d = defOf(m); if (!d) return 0;
    try { return d.prog(m) || 0; } catch (e) { return 0; }
  };
  MI.newDay = function () { M.S.missions.daily = mk(DAILY, 'd', 3); };
  MI.newWeek = function () { M.S.missions.weekly = mk(WEEKLY, 'w', 3); };
  MI.complete = function (m) {
    if (m.done) return;
    m.done = true;
    M.eco.earn(m.reward.m, 'recompensas'); M.S.xp += m.reward.xp;
    M.S.stats.missions = (M.S.stats.missions || 0) + 1;
    M.audio.sfx('mission');
    M.notify('Missão concluída: ' + m.txt + ' (+' + U.money0(m.reward.m) + ', +' + m.reward.xp + ' XP)', 'good');
    M.bus.emit('mission', m);
  };
  MI.update = function () {
    for (const m of M.S.missions.daily.concat(M.S.missions.weekly, M.S.missions.event || [])) {
      if (m.done || m.end || m.failed) continue;
      if (MI.progress(m) >= m.target) MI.complete(m);
    }
    // eventos: progresso por categoria durante a data
    for (const m of M.S.missions.event || []) if (!m.done && !m.failed && m.until < M.S.day) m.failed = true;
    ACH.check();
  };
  MI.endDay = function () {
    for (const m of M.S.missions.daily) if (!m.done && m.end && MI.progress(m) >= m.target) MI.complete(m);
  };
  MI.eventChallenge = function (ev) {
    const cats = Object.keys(ev.cats || {}).filter((c) => M.S.stores.some((s) => M.stores.type(s).cats.includes(c)));
    if (!cats.length && !ev.all) return;
    const cat = cats.length ? U.pick(cats) : null;
    const days = ev.until - M.S.day + 1;
    const target = roundNice(cat ? U.rnd(20, 40) * days * (1 + M.S.level * 0.3) : avgSales() * days * 1.2);
    const m = { id: M.S.nextMid = (M.S.nextMid || 0) + 1, k: 'evento', scope: 'e', ev: ev.id, cat, txt: cat ? ev.name + ': venda ' + target + ' itens de ' + M.CAT[cat].name : ev.name + ': fature ' + U.money0(target), target, prog: 0, until: ev.until, done: false, reward: { m: roundNice(target * (cat ? 3 : 0.06) + 200 * M.S.level), xp: 80 + M.S.level * 30 } };
    M.S.missions.event = (M.S.missions.event || []).filter((x) => !x.done && !x.failed).concat([m]);
  };
  // chamado a cada venda
  M.bus.on('saleItem', (d) => {
    for (const m of M.S.missions.event || []) if (!m.done && !m.failed) { if (m.cat ? M.P[d.p].cat === m.cat : false) m.prog += d.q; }
  });
  M.bus.on('sale', (d) => { for (const m of M.S.missions.event || []) if (!m.done && !m.failed && !m.cat) m.prog += d.total; });

  // ---------- objetivos especiais ----------
  M.ACH = [
    { id: 'venda1', name: 'Primeira Venda', desc: 'Venda para o seu primeiro cliente.', r: 100, c: () => M.S.stats.cust >= 1 },
    { id: 'pedido1', name: 'Negociante', desc: 'Faça seu primeiro pedido a um fornecedor.', r: 150, c: () => M.S.nextOrderId > 1 },
    { id: 'func1', name: 'Gerando Empregos', desc: 'Contrate seu primeiro funcionário.', r: 200, c: () => M.S.stores.some((s) => s.emps.length) },
    { id: 'lucro1', name: 'No Azul', desc: 'Termine um dia com lucro.', r: 200, c: () => M.S.stats.profitDays >= 1 },
    { id: 'clientes500', name: 'Freguesia Fiel', desc: 'Atenda 500 clientes.', r: 500, c: () => M.S.stats.cust >= 500 },
    { id: 'expo10', name: 'Loja Cheia', desc: 'Tenha 10 expositores em uma loja.', r: 600, c: () => M.S.stores.some((s) => s.objs.filter((o) => o.slots).length >= 10) },
    { id: 'caixa10k', name: 'Reserva de Caixa', desc: 'Tenha R$ 10 mil em caixa.', r: 500, c: () => M.S.money >= 10000 },
    { id: 'ampliar', name: 'Obras', desc: 'Amplie uma loja.', r: 400, c: () => M.S.stores.some((s) => s.ownW > 14) },
    { id: 'loja2', name: 'Segunda Unidade', desc: 'Abra sua segunda loja.', r: 1500, c: () => M.S.stores.length >= 2 },
    { id: 'estrelas', name: 'Cinco Estrelas', desc: 'Alcance 90% de avaliação em uma loja.', r: 1500, c: () => M.S.stores.some((s) => s.rating >= 90) },
    { id: 'equipe10', name: 'Equipe Completa', desc: 'Tenha 10 funcionários na empresa.', r: 1200, c: () => U.sum(M.S.stores, (s) => s.emps.length) >= 10 },
    { id: 'fat100k', name: 'Seis Dígitos', desc: 'Fature R$ 100 mil no total.', r: 3000, c: () => M.S.stats.sales >= 100000 },
    { id: 'cd', name: 'Logística Própria', desc: 'Construa um centro de distribuição.', r: 5000, c: () => M.S.cdOwned },
    { id: 'hq', name: 'Sede Própria', desc: 'Compre o escritório central.', r: 5000, c: () => M.S.hq },
    { id: 'lojas5', name: 'Rede Consolidada', desc: 'Tenha 5 estabelecimentos.', r: 15000, c: () => M.S.stores.length >= 5 },
    { id: 'share40', name: 'Líder de Mercado', desc: 'Tenha 40% de participação de mercado.', r: 20000, c: () => { const s = M.comps.shares(); return s[0].share >= 0.4; } },
    { id: 'fat1mi', name: 'Milionário', desc: 'Fature R$ 1 milhão no total.', r: 50000, c: () => M.S.stats.sales >= 1e6 },
    { id: 'imperio', name: 'Império Empresarial', desc: 'Alcance o nível 7.', r: 100000, c: () => M.S.level >= 7 },
  ];
  const ACH = (M.ach = {});
  let achT = 0;
  ACH.check = function () {
    if (M.R.time - achT < 1.5) return; achT = M.R.time;
    for (const a of M.ACH) {
      if (M.S.missions.ach[a.id]) continue;
      let ok = false; try { ok = a.c(); } catch (e) { ok = false; }
      if (ok) {
        M.S.missions.ach[a.id] = M.S.day;
        M.eco.earn(a.r, 'recompensas'); M.S.xp += Math.round(a.r / 10);
        M.audio.sfx('mission');
        M.notify('Objetivo especial: ' + a.name + '! +' + U.money0(a.r), 'good');
        M.bus.emit('achievement', a);
      }
    }
  };
})();
