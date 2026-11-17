/* Tipos de estabelecimento, abertura de novas unidades, conversão/reforma e montagem automática de expositores. */
(function () {
  'use strict';
  const M = window.MST, U = M.U;

  const BASIC = ['alimentos', 'bebidas', 'doces', 'limpeza', 'higiene'];
  M.STORE_TYPES = {
    mercadinho: { name: 'Pequena Loja', cats: BASIC, fixt: ['prateleira'], lvl: 1, sizes: ['P', 'M'], build: 4000, icon: 'loja', traffic: 1 },
    mercado: { name: 'Mercado de Bairro', cats: BASIC.concat(['brinquedos', 'ferramentas']), fixt: ['prateleira', 'geladeira', 'banca', 'prateleira'], lvl: 2, sizes: ['P', 'M', 'G'], build: 7000, icon: 'mercado', traffic: 1.1 },
    supermercado: { name: 'Supermercado', cats: BASIC.concat(['brinquedos', 'ferramentas', 'eletronicos']), fixt: ['gondola', 'geladeira', 'banca', 'gondola', 'prateleira'], lvl: 3, sizes: ['M', 'G', 'XG'], build: 16000, icon: 'super', traffic: 1.25 },
    hiper: { name: 'Grande Supermercado', cats: BASIC.concat(['brinquedos', 'ferramentas', 'eletronicos', 'roupas', 'moveis']), fixt: ['gondola', 'geladeira', 'gondola', 'banca', 'arara', 'vitrine', 'palete'], lvl: 4, sizes: ['G', 'XG'], build: 30000, icon: 'hiper', traffic: 1.4 },
    roupas: { name: 'Loja de Roupas', cats: ['roupas'], fixt: ['arara', 'arara', 'arara'], lvl: 4, sizes: ['P', 'M', 'G'], build: 9000, icon: 'roupas', traffic: 0.85 },
    eletronicos: { name: 'Loja de Eletrônicos', cats: ['eletronicos'], fixt: ['vitrine', 'prateleira', 'palete'], lvl: 4, sizes: ['P', 'M', 'G'], build: 12000, icon: 'eletro', traffic: 0.8 },
    moveis: { name: 'Loja de Móveis', cats: ['moveis', 'ferramentas'], fixt: ['palete', 'palete', 'prateleira'], lvl: 5, sizes: ['M', 'G', 'XG'], build: 15000, icon: 'moveis', traffic: 0.6 },
    shopping: { name: 'Centro Comercial', cats: M.CATS.map((c) => c.id), fixt: ['gondola', 'arara', 'vitrine', 'geladeira', 'palete', 'banca', 'prateleira'], lvl: 6, sizes: ['XG'], build: 90000, icon: 'shopping', traffic: 1.9 },
    cd: { name: 'Centro de Distribuição', cats: [], fixt: [], lvl: 5, sizes: ['G', 'XG'], build: 35000, icon: 'cd', traffic: 0, zones: ['industrial'] },
  };
  M.SIZE_MULT = { P: 0.6, M: 1, G: 1.7, XG: 2.6 };

  const ST = (M.stores = {});
  ST.type = (s) => M.STORE_TYPES[s.type];
  ST.allowsProduct = (s, p) => ST.type(s).cats.includes(p.cat) && p.lvl <= M.S.level;
  ST.buildCost = (type, size) => Math.round((M.STORE_TYPES[type].build * M.SIZE_MULT[size]) / 100) * 100;
  ST.isRetail = (s) => s.type !== 'cd';
  ST.isOpenNow = (s) => !s.buildUntil || M.now() >= s.buildUntil;

  // distribui produtos liberados pelos expositores vazios
  ST.autoAssign = function (s, onlyEmpty) {
    const T = ST.type(s); if (!T.cats.length) return 0;
    const listed = M.inv.listed(s);
    const byFix = {};
    for (const p of M.PRODUCTS) if (ST.allowsProduct(s, p)) (byFix[p.fix] = byFix[p.fix] || []).push(p);
    for (const k in byFix) byFix[k].sort((a, b) => (listed[a.id] != null) - (listed[b.id] != null) || b.demand - a.demand || a.cost - b.cost);
    const ptr = {}; let n = 0;
    for (const o of s.objs) {
      if (!o.slots) continue;
      const d = M.BUILD[o.t], list = byFix[d.fix]; if (!list || !list.length) continue;
      for (const sl of o.slots) {
        if (onlyEmpty !== false && sl.p) continue;
        let tries = 0;
        while (tries++ < list.length) {
          const i = (ptr[d.fix] = ((ptr[d.fix] || 0) + 1) % list.length);
          const p = list[i];
          if (listed[p.id] == null) { sl.p = p.id; sl.q = 0; listed[p.id] = 0; n++; break; }
        }
      }
    }
    return n;
  };

  // pedido inicial sugerido: completa prateleiras + 50% de reserva
  ST.suggestedOrder = function (s, factor) {
    const want = {};
    for (const o of s.objs) if (o.slots) for (const sl of o.slots) if (sl.p) want[sl.p] = (want[sl.p] || 0) + M.inv.slotCap(o, sl.p) * (factor || 1.5);
    const out = [];
    for (const pid in want) { const q = Math.ceil(want[pid] - M.inv.total(s, pid) - pendingQty(s, pid)); if (q > 0) out.push({ p: pid, q }); }
    return out;
  };
  function pendingQty(s, pid) {
    let q = 0;
    for (const o of M.S.orders) if (o.store === s.id && o.status !== 'entregue') for (const it of o.items) if (it.p === pid) q += it.q;
    for (const d of s.dock) if (d.p === pid) q += d.q;
    return q;
  }
  ST.pendingQty = pendingQty;

  // abre uma nova unidade em um terreno do mapa
  ST.open = function (lotId, type, name) {
    const lot = M.world.lot(lotId), T = M.STORE_TYPES[type];
    if (!lot || lot.owner) return M.toast('Este terreno não está disponível.', 'bad');
    if (T.lvl > M.S.level) return M.toast('Disponível no nível ' + T.lvl + '.', 'bad');
    if (!T.sizes.includes(lot.size)) return M.toast(T.name + ' exige terreno ' + T.sizes.map((z) => M.LOT_SIZES[z].name).join(' ou ') + '.', 'bad');
    if (T.zones && !T.zones.includes(lot.zone)) return M.toast(T.name + ' só pode ser aberto na zona industrial.', 'bad');
    const total = lot.price + ST.buildCost(type, lot.size);
    if (!M.eco.spend(lot.price, 'terrenos', null)) return M.toast('Você precisa de ' + U.money0(total) + ' para comprar o terreno e construir.', 'bad');
    if (!M.eco.spend(ST.buildCost(type, lot.size), 'construcao', null)) { M.eco.refund(lot.price, 'terrenos'); return M.toast('Você precisa de ' + U.money0(total) + ' para comprar o terreno e construir.', 'bad'); }
    const s = M.build.newStore(type, lot.size, name || T.name + ' ' + lot.name, false);
    s.lotId = lot.id; s.buildUntil = M.now() + 120; s.rent = 0;
    M.game.normalize(s);
    ST.autoAssign(s);
    lot.owner = 'player'; lot.storeId = s.id;
    M.S.stores.push(s);
    if (type === 'cd') M.S.cdOwned = true;
    M.audio.sfx('build');
    M.notify('Obra iniciada: ' + s.name + '. Inauguração em cerca de 2 horas de jogo.', 'good');
    M.bus.emit('storeOpened', { store: s });
    M.bus.emit('ui');
    return s;
  };

  // reforma: muda o tipo do estabelecimento mantendo o prédio
  ST.convertCost = (s, type) => Math.round((ST.buildCost(type, s.size) * 0.35) / 100) * 100;
  ST.convert = function (s, type) {
    const T = M.STORE_TYPES[type];
    if (!T || type === s.type || type === 'cd' || s.type === 'cd') return;
    if (T.lvl > M.S.level) return M.toast('Disponível no nível ' + T.lvl + '.', 'bad');
    if (!T.sizes.includes(s.size)) return M.toast('Este prédio não comporta um ' + T.name + '.', 'bad');
    if (!M.eco.spend(ST.convertCost(s, type), 'construcao', s.id)) return M.toast('Dinheiro insuficiente para a reforma.', 'bad');
    s.type = type;
    for (const o of s.objs) if (o.slots) for (let i = 0; i < o.slots.length; i++) { const sl = o.slots[i]; if (sl.p && !T.cats.includes(M.P[sl.p].cat)) M.inv.assign(s, o, i, null); }
    M.build.refresh(s);
    M.audio.sfx('build');
    M.notify(s.name + ' agora é um ' + T.name + '!', 'good');
    M.bus.emit('build', { store: s, what: 'convert' }); M.bus.emit('ui');
  };

  // compra do imóvel alugado (encerra o aluguel)
  ST.buyoutPrice = (s) => Math.round((s.rent || 0) * 60 / 500) * 500;
  ST.buyout = function (s) {
    if (!s.rent) return;
    const p = ST.buyoutPrice(s);
    if (!M.eco.spend(p, 'terrenos', s.id)) return M.toast('Você precisa de ' + U.money0(p) + '.', 'bad');
    s.rent = 0; M.audio.sfx('coin');
    M.notify('Imóvel de ' + s.name + ' comprado. Sem mais aluguel!', 'good'); M.bus.emit('ui');
  };

  ST.rename = function (s, name) { name = String(name || '').trim().slice(0, 32); if (name) { s.name = name; M.bus.emit('ui'); } };

  // venda de uma unidade (não a última)
  ST.sell = function (s) {
    if (M.S.stores.length <= 1) return M.toast('Você não pode vender sua única loja.', 'bad');
    const v = Math.round(M.eco.storeValue(s) * 0.7);
    for (const e of s.emps.slice()) M.emps.fire(s, e, true);
    M.S.stores.splice(M.S.stores.indexOf(s), 1);
    M.S.orders = M.S.orders.filter((o) => o.store !== s.id);
    const lot = s.lotId != null ? M.world.lot(s.lotId) : null;
    if (lot) { lot.owner = null; lot.storeId = null; }
    if (s.type === 'cd') M.S.cdOwned = M.S.stores.some((x) => x.type === 'cd');
    if (M.S.curId === s.id) M.game.setStore(M.S.stores[0].id);
    M.eco.earn(v, 'reembolsos');
    M.notify(s.name + ' foi vendida por ' + U.money0(v) + '.', 'info');
    M.bus.emit('ui');
  };
})();
