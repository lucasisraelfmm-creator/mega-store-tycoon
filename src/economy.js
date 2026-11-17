/* Economia: caixa da empresa, livro-razão por categoria (empresa e loja), preços, promoções,
   campanhas de marketing, impostos, empréstimos, histórico para gráficos e valor da empresa. */
(function () {
  'use strict';
  const M = window.MST, U = M.U;
  const E = (M.eco = {});

  E.INC = { vendas: 'Vendas', delivery: 'Delivery', servicos: 'Serviços', recompensas: 'Recompensas', reembolsos: 'Reembolsos/Vendas de ativos', emprestimos: 'Empréstimos' };
  E.EXP = { compras: 'Compras de mercadoria', salarios: 'Salários', aluguel: 'Aluguel', manutencao: 'Manutenção e energia', impostos: 'Impostos', construcao: 'Construção', terrenos: 'Terrenos e imóveis', marketing: 'Marketing', juros: 'Juros', treinamento: 'Treinamento', rescisao: 'Rescisões', outros: 'Outros' };
  E.TAX = 0.06; // Simples Nacional sobre o faturamento
  E.LOAN_RATE = 0.0035; // juros ao dia
  E.OVERDRAFT_RATE = 0.012;

  E.ledger = () => ({ inc: {}, exp: {} });
  function add(led, side, cat, v) { if (!led) return; led[side][cat] = (led[side][cat] || 0) + v; }
  const storeOf = (sid) => (sid != null ? M.game.storeById(sid) : null);

  E.earn = function (amt, cat, sid) {
    if (!(amt > 0)) return;
    M.S.money += amt;
    add(M.S.today, 'inc', cat, amt);
    const s = storeOf(sid); if (s) add(s.led, 'inc', cat, amt);
  };
  E.spend = function (amt, cat, sid, force) {
    if (!(amt >= 0)) return false;
    if (!force && M.S.money < amt) return false;
    M.S.money -= amt;
    add(M.S.today, 'exp', cat, amt);
    const s = storeOf(sid); if (s) add(s.led, 'exp', cat, amt);
    M.bus.emit('money');
    return true;
  };
  E.refund = function (amt, cat, sid) {
    if (!(amt > 0)) return;
    M.S.money += amt;
    const t = M.S.today.exp; t[cat] = (t[cat] || 0) - amt;
    if (t[cat] < 0) { add(M.S.today, 'inc', 'reembolsos', -t[cat]); t[cat] = 0; }
    const s = storeOf(sid);
    if (s) { const e = s.led.exp; e[cat] = Math.max(0, (e[cat] || 0) - amt); }
  };
  E.totals = (led) => ({ inc: U.sum(Object.values(led.inc)), exp: U.sum(Object.values(led.exp)) });

  // ---------- preços ----------
  E.nice = function (v) {
    if (v < 20) return Math.max(0.49, Math.ceil(v * 2) / 2 - 0.01);
    if (v < 200) return Math.ceil(v) - 0.1;
    if (v < 2000) return Math.ceil(v / 10) * 10 - 0.1;
    return Math.ceil(v / 100) * 100 - 0.1;
  };
  E.price = (pid) => { const v = M.S.prices[pid]; return v != null ? v : E.nice(M.P[pid].base * 0.95); };
  E.setPrice = function (pid, v) {
    v = U.round2(U.clamp(+v || 0, 0.1, 999999));
    M.S.prices[pid] = v; M.bus.emit('prices');
  };
  E.promo = function (cat) {
    let best = 0;
    for (const p of M.S.promos) if (p.cat === cat && p.until >= M.S.day) best = Math.max(best, p.pct);
    return best;
  };
  E.sell = (pid) => U.round2(E.price(pid) * (1 - E.promo(M.P[pid].cat)));
  E.ref = (pid) => M.P[pid].base * (M.S.market ? M.S.market.idx : 1);
  E.margin = (pid) => { const pr = E.sell(pid); return pr > 0 ? (pr - M.P[pid].cost) / pr : 0; };
  E.applyMarkup = function (cat, pct) {
    for (const p of M.PRODUCTS) if (p.cat === cat) M.S.prices[p.id] = E.nice(p.cost * (1 + pct / 100));
    M.bus.emit('prices');
  };
  E.suggested = (pid) => E.nice(M.P[pid].base * 0.95);
  E.resetPrices = function (cat) { for (const p of M.PRODUCTS) if (!cat || p.cat === cat) delete M.S.prices[p.id]; M.bus.emit('prices'); };

  E.startPromo = function (cat, pct, days) {
    M.S.promos = M.S.promos.filter((p) => p.cat !== cat);
    M.S.promos.push({ cat, pct, until: M.S.day + days - 1 });
    M.notify('Promoção iniciada: ' + M.CAT[cat].name + ' com ' + Math.round(pct * 100) + '% de desconto por ' + days + ' dia(s).', 'good');
    M.bus.emit('promo', { cat, pct });
  };

  // ---------- marketing ----------
  E.CAMPAIGNS = [
    { id: 'panfletos', name: 'Panfletos no Bairro', cost: 300, days: 3, boost: 0.12, lvl: 1, desc: 'Distribuição de folhetos com as ofertas da semana.' },
    { id: 'carro', name: 'Carro de Som', cost: 900, days: 3, boost: 0.18, lvl: 2, desc: 'Anúncio itinerante pelas ruas da cidade.' },
    { id: 'radio', name: 'Anúncio na Rádio', cost: 2200, days: 5, boost: 0.24, lvl: 3, desc: 'Spots de 30 segundos no horário nobre.' },
    { id: 'redes', name: 'Redes Sociais', cost: 4000, days: 7, boost: 0.3, lvl: 3, desc: 'Influenciadores locais e anúncios segmentados.' },
    { id: 'outdoor', name: 'Outdoors na Cidade', cost: 8000, days: 10, boost: 0.28, lvl: 4, desc: 'Painéis nas avenidas mais movimentadas.' },
    { id: 'tv', name: 'Comercial de TV', cost: 22000, days: 7, boost: 0.55, lvl: 5, desc: 'Campanha regional em rede aberta.' },
  ];
  E.startCampaign = function (id) {
    const c = E.CAMPAIGNS.find((x) => x.id === id); if (!c) return false;
    if (c.lvl > M.S.level) { M.toast('Disponível no nível ' + c.lvl + '.', 'bad'); return false; }
    const cost = Math.round(c.cost * (1 + (M.S.stores.length - 1) * 0.25));
    if (!E.spend(cost, 'marketing')) { M.toast('Dinheiro insuficiente para a campanha.', 'bad'); return false; }
    M.S.camps = M.S.camps.filter((x) => x.id !== id);
    M.S.camps.push({ id, until: M.S.day + c.days - 1, boost: c.boost });
    M.audio.sfx('coin');
    M.notify('Campanha "' + c.name + '" no ar até o dia ' + (M.S.day + c.days - 1) + '.', 'good');
    M.bus.emit('campaign', { id });
    return true;
  };
  E.campaignCost = (c) => Math.round(c.cost * (1 + (M.S.stores.length - 1) * 0.25));
  E.marketingBoost = function () {
    let b = 0; for (const c of M.S.camps) if (c.until >= M.S.day) b += c.boost;
    return Math.min(1, b);
  };

  // ---------- empréstimos ----------
  E.loanLimit = () => Math.max(5000, Math.round((E.companyValue() * 0.45) / 1000) * 1000);
  E.borrow = function (amt) {
    amt = Math.round(amt);
    if (amt <= 0 || M.S.debt + amt > E.loanLimit()) { M.toast('O banco não aprovou esse valor.', 'bad'); return false; }
    M.S.debt += amt; E.earn(amt, 'emprestimos');
    M.notify('Empréstimo de ' + U.money0(amt) + ' aprovado. Juros de ' + (E.LOAN_RATE * 100).toFixed(2) + '% ao dia.', 'info');
    M.audio.sfx('coin'); return true;
  };
  E.repay = function (amt) {
    amt = Math.min(Math.round(amt), M.S.debt, Math.floor(M.S.money));
    if (amt <= 0) return false;
    M.S.money -= amt; M.S.debt -= amt;
    M.notify('Você quitou ' + U.money0(amt) + ' da dívida.', 'good'); return true;
  };

  // ---------- valor da empresa ----------
  E.storeValue = function (s) {
    let v = M.inv.value(s);
    for (const o of s.objs) v += M.BUILD[o.t].cost * 0.55;
    const lot = s.lotId != null ? M.world.lot(s.lotId) : null;
    if (lot && !s.rent) v += lot.price;
    return v;
  };
  E.companyValue = function () {
    let v = M.S.money - M.S.debt;
    for (const s of M.S.stores) v += E.storeValue(s);
    if (M.S.hq) v += 60000;
    return v;
  };

  // custos fixos diários previstos de uma loja
  E.storeDaily = function (s) {
    let sal = 0; for (const e of s.emps) sal += e.salary;
    return { sal, rent: s.rent || 0, maint: s._agg ? s._agg.maint : 0 };
  };

  // histórico agregado para gráficos: period 'dia' | 'semana' | 'mes'
  E.series = function (period, n) {
    const h = M.S.hist, size = period === 'semana' ? 7 : period === 'mes' ? M.C.MONTH : 1, out = [];
    if (!h.length) return out;
    const lastDay = h[h.length - 1].day;
    for (let k = n - 1; k >= 0; k--) {
      const hi = lastDay - k * size, lo = hi - size + 1;
      const rows = h.filter((r) => r.day >= lo && r.day <= hi);
      if (!rows.length && hi < 1) continue;
      out.push({
        label: size === 1 ? 'D' + hi : (period === 'semana' ? 'S' : 'M') + Math.ceil(hi / size),
        inc: U.sum(rows, (r) => r.inc), exp: U.sum(rows, (r) => r.exp), sales: U.sum(rows, (r) => r.sales),
        profit: U.sum(rows, (r) => r.inc - r.exp), cust: U.sum(rows, (r) => r.cust), money: rows.length ? rows[rows.length - 1].money : 0,
      });
    }
    return out;
  };
})();
