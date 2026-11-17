/* Conteúdo dos painéis de gestão. Cada painel define título, abas e uma função render que retorna HTML. */
(function () {
  'use strict';
  const M = window.MST, U = M.U, UI = M.ui, A = UI.A, P = UI.panels;
  const ic = (n, c) => UI.icon(n, c), $ = UI.$;
  const st = () => M.game.store();
  const pi = (pid, s) => M.sprites.icon(pid, s || 26);
  const bar = (k, cls) => '<div class="bar ' + (cls || '') + '"><i style="width:' + (U.clamp(k, 0, 1) * 100).toFixed(0) + '%"></i></div>';
  const stat = (lab, val, sub, cls) => '<div class="stat ' + (cls || '') + '"><span>' + lab + '</span><b>' + val + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div>';
  const pill = (txt, cls) => '<span class="pill ' + (cls || '') + '">' + txt + '</span>';
  const lockTxt = (lvl) => (lvl > M.S.level ? pill('Nível ' + lvl, 'lock') : '');
  const objById = (s, id) => s.objs.find((o) => o.id === id);

  // ================= INSPETOR DE OBJETO =================
  P.obj = {
    icon: 'info', narrow: true,
    title: (o) => { const s = st(), ob = s && objById(s, o.id); return ob ? M.BUILD[ob.t].name : 'Objeto'; },
    render(opts) {
      const s = st(), o = objById(s, opts.id); if (!o) return null;
      const d = M.BUILD[o.t]; let h = '';
      if (o.slots) {
        const T = M.stores.type(s);
        const prods = M.PRODUCTS.filter((p) => p.fix === d.fix && T.cats.includes(p.cat));
        h += '<p class="muted">Expõe: ' + M.FIX_NAMES[d.fix] + '. Escolha um produto para cada espaço.</p><div class="slots-l">';
        o.slots.forEach((sl, i) => {
          const cap = sl.p ? M.inv.slotCap(o, sl.p) : d.cap;
          const groups = {};
          for (const p of prods) (groups[p.cat] = groups[p.cat] || []).push(p);
          let opt = '<option value="">— vazio —</option>';
          for (const c in groups) opt += '<optgroup label="' + M.CAT[c].name + '">' + groups[c].map((p) => '<option value="' + p.id + '"' + (p.id === sl.p ? ' selected' : '') + (p.lvl > M.S.level ? ' disabled' : '') + '>' + U.esc(p.name) + (p.lvl > M.S.level ? ' (nv ' + p.lvl + ')' : ' · ' + U.money(M.eco.sell(p.id))) + '</option>').join('') + '</optgroup>';
          h += '<div class="slot-r">' + (sl.p ? pi(sl.p, 34) : '<i class="pi empty"></i>') + '<div class="sl-b"><select data-ch="slotSet" data-o="' + o.id + '" data-i="' + i + '">' + opt + '</select>' +
            (sl.p ? '<div class="sl-m">' + bar(sl.q / cap, sl.q === 0 ? 'bad' : sl.q < cap * 0.3 ? 'warn' : '') + '<small>' + sl.q + '/' + cap + ' · depósito ' + (s.storage[sl.p] || 0) + '</small></div>' : '') + '</div></div>';
        });
        h += '</div><div class="row-btns"><button class="btn primary" data-a="goRestock" data-o="' + o.id + '">' + ic('hand') + 'Ir repor</button><button class="btn" data-a="autoFill" data-o="' + o.id + '">Preencher vazios</button><button class="btn" data-a="orderFor" data-o="' + o.id + '">' + ic('cart') + 'Encomendar</button></div>';
      } else if (d.kind === 'checkout' || d.kind === 'self') {
        const op = M.cust.operator(s, o);
        h += '<div class="stats">' + stat('Fila', (o._q ? o._q.length : 0) + ' clientes') + stat('Operador', d.kind === 'self' ? 'Automático' : op ? (op.player ? 'Você' : op.e.name.split(' ')[0]) : o._op ? 'A caminho' : 'Ninguém', null, !op && d.kind !== 'self' ? 'warn' : '') + '</div>';
        if (d.kind === 'checkout') h += '<p class="muted">Caixas precisam de um operador. Contrate Operadores de Caixa ou atenda você mesmo.</p><div class="row-btns"><button class="btn primary" data-a="goChk" data-o="' + o.id + '">' + ic('hand') + (M.player.atChk === o ? 'Você está operando' : 'Operar este caixa') + '</button><button class="btn" data-a="open" data-p="funcionarios" data-tab="contratar">Contratar operador</button></div>';
      } else if (d.kind === 'storage') {
        h += '<div class="stats">' + stat('Capacidade da estante', '+' + Math.round(d.store * (s.type === 'cd' ? 2.5 : 1))) + stat('Depósito', M.inv.used(s) + '/' + M.inv.cap(s)) + '</div><div class="row-btns"><button class="btn" data-a="open" data-p="estoque">Ver estoque</button></div>';
      } else {
        h += '<p>' + U.esc(d.desc || 'Item de decoração.') + '</p><div class="stats">' + (d.appeal ? stat('Atratividade', '+' + d.appeal) : '') + (d.income ? stat('Renda', U.money0(d.income) + '/dia') : '') + (d.maint ? stat('Manutenção', U.money0(d.maint) + '/dia') : '') + '</div>';
      }
      h += '<div class="row-btns sub"><button class="btn ghost" data-a="objMove" data-o="' + o.id + '">' + ic('move') + 'Mover</button><button class="btn ghost danger" data-a="objSell" data-o="' + o.id + '">' + ic('trash') + 'Vender (' + U.money0(d.cost * 0.5) + ')</button></div>';
      return h;
    },
  };
  A.slotSet = (el, d) => { const s = st(), o = objById(s, +d.o); if (!o) return; M.inv.assign(s, o, +d.i, el.value || null); M.inv.restock(s, o, +d.i); s._lc = null; M.bus.emit('slotSet'); UI.renderPanel(); };
  A.goRestock = (el, d) => { const s = st(), o = objById(s, +d.o); if (o && M.player.doTask({ type: 'restock', o })) { UI.close(); } };
  A.goChk = (el, d) => { const s = st(), o = objById(s, +d.o); if (o && M.player.doTask({ type: 'chk', o })) UI.close(); };
  A.autoFill = (el, d) => { const s = st(), o = objById(s, +d.o); if (!o) return; const tmp = s.objs; s.objs = [o]; const n = M.stores.autoAssign(s); s.objs = tmp; M.inv.restockObj(s, o); s._lc = null; M.toast(n ? n + ' espaço(s) preenchido(s).' : 'Nenhum produto disponível para os espaços vazios.', n ? 'good' : 'info'); UI.renderPanel(); };
  A.orderFor = (el, d) => { const s = st(), o = objById(s, +d.o); if (!o) return; UI.cart = null; const c = cart(); for (const sl of o.slots) if (sl.p) { const sp = M.sup.best(sl.p); if (sp && sp.id !== c.sup && !Object.keys(c.items).length) c.sup = sp.id; c.items[sl.p] = (c.items[sl.p] || 0) + M.inv.slotCap(o, sl.p) * 2; } UI.open('fornecedores', { tab: 'pedido' }); };
  A.objMove = (el, d) => { const s = st(), o = objById(s, +d.o); UI.close(); M.build.enter('mover'); M.build.st.moving = o; M.build.st.rot = o.r; };
  A.objSell = (el, d) => { const s = st(), o = objById(s, +d.o); if (!o) return; UI.close(); M.build.enter('demolir'); M.build.st.pending = { type: 'demolish', objs: [o], walls: [], floors: [], cost: -M.BUILD[o.t].cost * 0.5, cells: [] }; UI.dirty(); };

  // ================= LOJA =================
  P.loja = {
    icon: 'loja', title: () => U.esc(st().name), tabs: [['visao', 'Visão geral'], ['reforma', 'Reformas'], ['config', 'Ajustes']],
    render(o, tab) {
      const s = st(), T = M.stores.type(s), g = s._agg, fc = M.eco.storeDaily(s);
      if (tab === 'visao') {
        const L = M.LOT_SIZES[s.size], lot = s.lotId != null ? M.world.lot(s.lotId) : null;
        let h = '<div class="stats">' + stat('Tipo', T.name, M.LOT_SIZES[s.size].name) + stat('Avaliação', U.stars(s.rating), Math.round(s.rating) + '%') + stat('Atratividade', Math.round(M.build.appeal(s)) + '/100', s.dirt.length ? s.dirt.length + ' pontos de sujeira' : 'Limpa') + stat('Movimento previsto', (M.cust.rate(s) * 60).toFixed(0) + ' clientes/h') + '</div>';
        h += '<div class="stats">' + stat('Área', (s.ownW - 2) + '×' + (s.ownH - M.C.SIDE - 2), 'Terreno ' + L.gw + '×' + (L.gh - M.C.SIDE)) + stat('Expositores', s.objs.filter((x) => x.slots).length, g.slots + ' espaços') + stat('Equipe', s.emps.length + '/' + M.STAFF_MAX[s.size]) + stat('Custos fixos/dia', U.money0(fc.sal + fc.rent + fc.maint), 'Salários ' + U.money0(fc.sal)) + '</div>';
        h += '<div class="stats">' + stat('Vendas hoje', U.money0(s.day.sales)) + stat('Clientes hoje', s.day.cust, s.day.served + ' compraram') + stat('Satisfação hoje', s.day.satN ? Math.round(s.day.satSum / s.day.satN) + '%' : '—') + stat('Região', lot ? M.ZONES[lot.zone].name : '—', lot ? 'Concorrência: ' + Math.round((1 - M.world.competition(s)) * 100) + '% de impacto' : '') + '</div>';
        h += '<h4>Vendas dos últimos dias</h4><canvas class="chart" id="lojaChart" height="150"></canvas>';
        return h;
      }
      if (tab === 'reforma') {
        const ex = M.build.expandInfo(s);
        let h = '<div class="cards2"><div class="card"><h4>' + ic('expand') + 'Ampliar prédio</h4>' + (ex ? '<p>Nova área ' + (ex.nw - 2) + '×' + (ex.nh - M.C.SIDE - 2) + '. As paredes são reconstruídas automaticamente.</p><button class="btn primary" data-a="bexpand">Ampliar por ' + U.money0(ex.cost) + '</button>' : '<p>O prédio já ocupa todo o terreno.</p>') + '</div>';
        h += '<div class="card"><h4>' + ic('paint') + 'Fachada</h4><p>Cores, letreiros e toldos deixam a loja mais atraente.</p><button class="btn" data-a="open" data-p="fachada">Personalizar fachada</button></div>';
        if (s.rent) h += '<div class="card"><h4>' + ic('loja') + 'Comprar o imóvel</h4><p>Você paga ' + U.money0(s.rent) + ' de aluguel por dia. Compre o imóvel para eliminar esse custo.</p><button class="btn" data-a="buyout">Comprar por ' + U.money0(M.stores.buyoutPrice(s)) + '</button></div>';
        h += '</div>';
        if (s.type !== 'cd') {
          h += '<h4>Converter estabelecimento</h4><p class="muted">Muda o tipo da loja e as categorias de produtos permitidas. Produtos incompatíveis voltam para o depósito.</p><div class="types">';
          for (const k in M.STORE_TYPES) {
            const t = M.STORE_TYPES[k]; if (k === 'cd' || k === s.type) continue;
            const fits = t.sizes.includes(s.size), lock = t.lvl > M.S.level;
            h += '<div class="type' + (!fits || lock ? ' dis' : '') + '"><b>' + t.name + '</b><small>' + t.cats.map((c) => M.CAT[c].name).join(', ') + '</small>' + (lock ? pill('Nível ' + t.lvl, 'lock') : !fits ? pill('Prédio incompatível', 'lock') : '<button class="btn sm" data-a="convert" data-t="' + k + '">Reformar · ' + U.money0(M.stores.convertCost(s, k)) + '</button>') + '</div>';
          }
          h += '</div>';
        }
        return h;
      }
      const mgr = M.sup.autoEnabled(s) || s.emps.some((e) => e.role === 'gerente') || M.S.hq;
      return '<div class="form"><label><span>Nome da loja</span><input id="renameIn" maxlength="32" value="' + U.esc(s.name) + '"></label><button class="btn" data-a="rename">Renomear</button></div>' +
        '<div class="card"><h4>' + ic('bolt') + 'Reposição automática</h4><p>Faz pedidos sozinho às 8h, 13h e 18h quando o estoque baixa. ' + (mgr ? '' : '<b>Requer um gerente nesta loja ou o escritório central.</b>') + '</p>' +
        '<label class="chk"><input type="checkbox" data-ch="autoOrder"' + (s.auto.order ? ' checked' : '') + (mgr ? '' : ' disabled') + '> Ativar pedidos automáticos</label>' +
        '<label class="rng"><span>Estoque de segurança</span><input type="range" min="0.1" max="1" step="0.05" value="' + s.auto.level + '" data-ch="autoLevel"><em>' + Math.round(s.auto.level * 100) + '%</em></label></div>' +
        (M.S.stores.length > 1 ? '<div class="card danger"><h4>Vender estabelecimento</h4><p>Você recebe cerca de ' + U.money0(M.eco.storeValue(s) * 0.7) + '. Funcionários são desligados.</p><button class="btn danger" data-a="sellStore">Vender ' + U.esc(s.name) + '</button></div>' : '');
    },
    after(win, o, tab) { if (tab === 'visao') chartBars(win.querySelector('#lojaChart'), st().hist.slice(-14).map((r) => ({ label: 'D' + r.day, inc: r.sales, exp: 0, profit: r.profit })), { single: true }); },
  };
  A.buyout = () => { M.stores.buyout(st()); UI.renderPanel(); };
  A.convert = (el, d) => { M.stores.convert(st(), d.t); UI.renderPanel(); };
  A.rename = () => { M.stores.rename(st(), $('#renameIn').value); UI.renderPanel(); UI.dirty(); };
  A.autoOrder = (el) => { st().auto.order = el.checked; if (el.checked) M.sup.autoOrder(st()); };
  A.autoLevel = (el) => { st().auto.level = +el.value; UI.renderPanel(); };
  A.sellStore = (el) => { if (el.dataset.sure) { M.stores.sell(st()); UI.close(); } else { el.dataset.sure = 1; el.textContent = 'Clique novamente para confirmar'; } };

  P.fachada = {
    icon: 'paint', title: 'Fachada', narrow: true,
    render() {
      const s = st(), F = M.FACADE;
      const row = (key, label) => '<h4>' + label + '</h4><div class="facade">' + F[key].map((opt, i) => {
        const on = s.facade[key] === i, lock = (opt.lvl || 1) > M.S.level;
        return '<button class="fopt' + (on ? ' on' : '') + '" data-a="facade" data-k="' + key + '" data-i="' + i + '"' + (lock ? ' disabled' : '') + '>' + (opt.c ? '<i style="background:' + opt.c + '"></i>' : '') + '<b>' + opt.name + '</b><small>' + (on ? 'Atual' : lock ? 'Nível ' + opt.lvl : opt.cost ? U.money0(opt.cost) : 'Grátis') + (opt.a ? ' · +' + opt.a + ' atração' : '') + '</small></button>';
      }).join('') + '</div>';
      return row('color', 'Cor da fachada') + row('sign', 'Letreiro') + row('awning', 'Toldo');
    },
  };
  A.facade = (el, d) => { M.build.setFacade(st(), d.k, +d.i); UI.renderPanel(); };

  // ================= CATÁLOGO =================
  UI._cat = 'alimentos';
  P.catalogo = {
    icon: 'catalogo', title: 'Catálogo e preços', wide: true, live: false, tabs: [['produtos', 'Produtos e preços'], ['promocoes', 'Promoções']],
    render(o, tab) {
      if (tab === 'promocoes') return promoHTML();
      const cat = UI._cat, q = (UI._q || '').toLowerCase(), s = st();
      const cats = '<div class="chips">' + M.CATS.map((c) => '<button data-a="cat" data-c="' + c.id + '" class="chip' + (c.id === cat ? ' on' : '') + '" style="--c:' + c.color + '">' + c.name + '<small>' + M.PRODUCTS.filter((p) => p.cat === c.id).length + '</small></button>').join('') + '</div>';
      const list = M.PRODUCTS.filter((p) => (q ? p.name.toLowerCase().includes(q) : p.cat === cat));
      const allowed = M.stores.type(s).cats;
      let h = cats + '<div class="toolbar"><label class="search">' + ic('search') + '<input id="catSearch" placeholder="Buscar produto" value="' + U.esc(UI._q || '') + '" data-in="catSearch"></label>' +
        (q ? '' : '<label class="rng inline"><span>Margem da categoria</span><input type="range" id="mkRange" min="5" max="150" step="5" value="' + Math.round((M.CAT[cat].markup - 1) * 100) + '" data-in="mkShow"><em id="mkVal">' + Math.round((M.CAT[cat].markup - 1) * 100) + '%</em></label><button class="btn sm" data-a="applyMk">Aplicar à categoria</button><button class="btn sm ghost" data-a="resetPrices">Preços sugeridos</button>') + '</div>';
      h += '<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>Produto</th><th>Custo</th><th>Preço de venda</th><th>Mercado</th><th>Margem</th><th>Demanda</th><th>Validade</th><th>Estoque</th></tr></thead><tbody>';
      for (const p of list) {
        const lock = p.lvl > M.S.level, price = M.eco.price(p.id), ref = M.eco.ref(p.id), r = price / ref, mg = (price - p.cost) / price;
        let tot = 0; for (const x of M.S.stores) tot += M.inv.total(x, p.id);
        h += '<tr class="' + (lock ? 'lock' : '') + '"><td>' + pi(p.id, 30) + '</td><td><b>' + U.esc(p.name) + '</b><small>' + M.CAT[p.cat].name + ' · ' + M.FIX_NAMES[p.fix] + (allowed.includes(p.cat) ? '' : ' · não vendido nesta loja') + '</small>' + lockTxt(p.lvl) + '</td>' +
          '<td class="num">' + U.money(p.cost) + '</td>' +
          '<td><div class="pricein"><button data-a="pstep" data-p="' + p.id + '" data-v="-1">' + ic('minus') + '</button><input type="number" step="0.01" min="0.1" value="' + price.toFixed(2) + '" data-ch="setPrice" data-p="' + p.id + '"><button data-a="pstep" data-p="' + p.id + '" data-v="1">' + ic('plus') + '</button></div>' + (M.eco.promo(p.cat) ? '<small class="promo">promo ' + U.money(M.eco.sell(p.id)) + '</small>' : '') + '</td>' +
          '<td class="num"><span class="' + (r > 1.15 ? 'neg' : r < 0.95 ? 'pos' : '') + '">' + U.money(ref) + '</span><small>' + (r >= 1 ? '+' : '') + Math.round((r - 1) * 100) + '%</small></td>' +
          '<td class="num ' + (mg < 0.1 ? 'neg' : '') + '">' + Math.round(mg * 100) + '%</td>' +
          '<td><span class="dem">' + '●'.repeat(Math.ceil(p.demand / 2)) + '<i>' + '●'.repeat(5 - Math.ceil(p.demand / 2)) + '</i></span></td>' +
          '<td>' + (p.life ? p.life + ' dias' : '—') + '</td><td class="num">' + tot + '</td></tr>';
      }
      h += '</tbody></table></div><p class="muted">Preços acima do mercado reduzem as vendas e a satisfação; abaixo, atraem clientes mas diminuem a margem. O preço de mercado reflete os concorrentes (índice ' + M.S.market.idx.toFixed(2) + ').</p>';
      return h;
    },
  };
  function promoHTML() {
    let h = '<p>Uma promoção dá desconto em toda a categoria e atrai mais clientes, principalmente os impulsivos.</p><div class="promoform"><label><span>Categoria</span><select id="prCat">' + M.CATS.map((c) => '<option value="' + c.id + '">' + c.name + '</option>').join('') + '</select></label>' +
      '<label><span>Desconto</span><select id="prPct"><option value="0.1">10%</option><option value="0.15">15%</option><option value="0.2" selected>20%</option><option value="0.3">30%</option><option value="0.4">40%</option></select></label>' +
      '<label><span>Duração</span><select id="prDays"><option value="1">1 dia</option><option value="3" selected>3 dias</option><option value="5">5 dias</option><option value="7">7 dias</option></select></label><button class="btn primary" data-a="startPromo">Lançar promoção</button></div>';
    const act = M.S.promos.filter((p) => p.until >= M.S.day);
    h += '<h4>Promoções ativas</h4>' + (act.length ? '<ul class="list">' + act.map((p) => '<li>' + pill(Math.round(p.pct * 100) + '%', 'gold') + '<b>' + M.CAT[p.cat].name + '</b><span>até o dia ' + p.until + '</span><button class="btn sm ghost" data-a="endPromo" data-c="' + p.cat + '">Encerrar</button></li>').join('') + '</ul>' : '<p class="empty">Nenhuma promoção ativa.</p>');
    const ev = M.events.upcoming(3);
    if (ev.length) h += '<h4>Próximas datas comemorativas</h4><ul class="list">' + ev.map((e) => '<li>' + ic('calendar') + '<b>' + e.def.name + '</b><span>dia ' + e.day + ' · ' + Object.keys(e.def.cats).map((c) => M.CAT[c].name).join(', ') + '</span></li>').join('') + '</ul>';
    return h;
  }
  A.cat = (el, d) => { UI._cat = d.c; UI._q = ''; UI.renderPanel(); };
  A.catSearch = (el) => { UI._q = el.value; clearTimeout(A._cs); A._cs = setTimeout(() => { UI.renderPanel(); const i = $('#catSearch'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250); };
  A.setPrice = (el, d) => { M.eco.setPrice(d.p, el.value); M.bus.emit('priceSet'); UI.renderPanel(); };
  A.pstep = (el, d) => { const p = M.eco.price(d.p), step = p < 10 ? 0.1 : p < 100 ? 0.5 : p < 1000 ? 5 : 50; M.eco.setPrice(d.p, p + step * +d.v); M.bus.emit('priceSet'); UI.renderPanel(); };
  A.mkShow = (el) => { const e = $('#mkVal'); if (e) e.textContent = el.value + '%'; };
  A.applyMk = () => { M.eco.applyMarkup(UI._cat, +$('#mkRange').value); M.bus.emit('priceSet'); M.toast('Preços de ' + M.CAT[UI._cat].name + ' atualizados.', 'good'); UI.renderPanel(); };
  A.resetPrices = () => { M.eco.resetPrices(UI._cat); M.bus.emit('priceSet'); UI.renderPanel(); };
  A.startPromo = () => { M.eco.startPromo($('#prCat').value, +$('#prPct').value, +$('#prDays').value); UI.renderPanel(); };
  A.endPromo = (el, d) => { M.S.promos = M.S.promos.filter((p) => p.cat !== d.c); UI.renderPanel(); };

  // ================= ESTOQUE =================
  P.estoque = {
    icon: 'estoque', title: () => 'Estoque · ' + U.esc(st().name), wide: true, tabs: [['deposito', 'Depósito'], ['prateleiras', 'Prateleiras'], ['doca', 'Doca e entregas']],
    render(o, tab) {
      const s = st(), cap = M.inv.cap(s), used = M.inv.used(s);
      let h = '<div class="stats">' + stat('Depósito', used + '/' + cap, bar(used / cap, used / cap > 0.9 ? 'bad' : '')) + stat('Na doca', M.inv.dockQty(s) + ' itens') + stat('Valor do estoque', U.money0(M.inv.value(s))) + stat('Produtos expostos', Object.keys(M.inv.listed(s)).length) + '</div>';
      if (tab === 'deposito') {
        const ids = Object.keys(s.storage).filter((k) => s.storage[k] > 0).sort((a, b) => M.P[a].cat.localeCompare(M.P[b].cat) || s.storage[b] - s.storage[a]);
        const listed = M.inv.listed(s);
        h += '<div class="row-btns"><button class="btn" data-a="autoAssignAll">' + ic('bolt') + 'Distribuir produtos nos espaços vazios</button><button class="btn" data-a="open" data-p="fornecedores">' + ic('cart') + 'Fazer pedido</button></div>';
        if (!ids.length) h += '<p class="empty">O depósito está vazio. Faça pedidos aos fornecedores para receber mercadorias.</p>';
        else {
          h += '<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>Produto</th><th>Depósito</th><th>Prateleiras</th><th>Vencimento</th><th></th></tr></thead><tbody>';
          for (const k of ids) {
            const p = M.P[k], ex = M.inv.nextExpiry(s, k), dl = ex ? ex - M.S.day : null;
            h += '<tr><td>' + pi(k, 28) + '</td><td><b>' + U.esc(p.name) + '</b><small>' + M.CAT[p.cat].name + (listed[k] == null ? ' · ' + pill('fora das prateleiras', 'warn') : '') + '</small></td><td class="num">' + s.storage[k] + '</td><td class="num">' + M.inv.shelfQty(s, k) + '</td>' +
              '<td>' + (dl == null ? '—' : dl <= 1 ? pill(dl <= 0 ? 'vence hoje' : 'amanhã', 'bad') : dl + ' dias') + '</td><td><button class="btn sm ghost danger" data-a="discard" data-p="' + k + '">Descartar</button></td></tr>';
          }
          h += '</tbody></table></div>';
        }
        return h;
      }
      if (tab === 'prateleiras') {
        const fx = s.objs.filter((x) => x.slots);
        if (!fx.length) return h + '<p class="empty">Esta loja não tem expositores. Use o modo Construção.</p>';
        h += '<div class="shelves">';
        fx.forEach((x) => {
          const d = M.BUILD[x.t];
          h += '<div class="shelf"><div class="sh-h"><b>' + d.name + '</b><button class="btn sm" data-a="inspect" data-o="' + x.id + '">Editar</button><button class="btn sm ghost" data-a="goRestock" data-o="' + x.id + '">Repor</button></div><div class="sh-s">' +
            x.slots.map((sl) => { const c = sl.p ? M.inv.slotCap(x, sl.p) : 1; return '<div class="sh-sl' + (sl.p && !sl.q ? ' empty' : '') + '" title="' + (sl.p ? U.esc(M.P[sl.p].name) + ' ' + sl.q + '/' + c : 'Vazio') + '">' + (sl.p ? pi(sl.p, 24) + bar(sl.q / c, !sl.q ? 'bad' : sl.q < c * 0.3 ? 'warn' : '') : '<i class="pi empty"></i>') + '</div>'; }).join('') + '</div></div>';
        });
        return h + '</div>';
      }
      h += '<h4>Na doca (aguardando descarga)</h4>';
      h += s.dock.length ? '<div class="dock-l">' + s.dock.map((d) => '<span>' + pi(d.p, 24) + '<b>' + d.q + '</b></span>').join('') + '</div><p class="muted">Estoquistas e repositores levam as caixas ao depósito. Você também pode ir até a porta e apertar E.</p><div class="row-btns"><button class="btn" data-a="goDock">' + ic('hand') + 'Ir descarregar</button></div>' : '<p class="empty">Nada na doca.</p>';
      const ords = M.S.orders.filter((x) => x.store === s.id && x.status !== 'entregue' && x.status !== 'cancelado');
      h += '<h4>Pedidos a caminho</h4>' + (ords.length ? ordersHTML(ords) : '<p class="empty">Nenhum pedido a caminho.</p>');
      return h;
    },
  };
  A.discard = (el, d) => { const s = st(); M.inv.discard(s, d.p, s.storage[d.p] || 0); UI.renderPanel(); };
  A.autoAssignAll = () => { const s = st(), n = M.stores.autoAssign(s); for (const o of s.objs) if (o.slots) M.inv.restockObj(s, o); s._lc = null; M.toast(n ? n + ' espaços receberam produtos.' : 'Todos os espaços já estão em uso.', n ? 'good' : 'info'); UI.renderPanel(); };
  A.inspect = (el, d) => UI.open('obj', { id: +d.o });
  A.goDock = () => { if (M.player.doTask({ type: 'dock' })) UI.close(); };
  function ordersHTML(ords) {
    return '<ul class="list">' + ords.map((o) => { const sp = M.SUP[o.sup], left = o.eta - M.now(); return '<li><i class="sw" style="background:' + sp.color + '"></i><b>#' + o.id + ' ' + sp.name + '</b><span>' + U.sum(o.items, (i) => i.q) + ' itens · ' + U.money0(o.cost) + (o.auto ? ' · automático' : '') + '</span>' + pill(o.status === 'a caminho' ? 'chega em ' + U.dur(left) : o.status, o.status === 'a caminho' ? '' : 'gold') + '</li>'; }).join('') + '</ul>';
  }

  // ================= FORNECEDORES =================
  function cart() {
    const s = st();
    if (!UI.cart || UI.cart.store !== s.id) UI.cart = { store: s.id, sup: 'atacadao', items: {}, cat: null };
    if (!M.SUP[UI.cart.sup] || M.SUP[UI.cart.sup].lvl > M.S.level) UI.cart.sup = 'atacadao';
    return UI.cart;
  }
  P.fornecedores = {
    icon: 'fornecedores', title: 'Fornecedores', wide: true, live: false, tabs: [['pedido', 'Novo pedido'], ['lista', 'Comparar fornecedores'], ['pedidos', 'Pedidos']],
    render(o, tab) {
      const s = st();
      if (tab === 'lista') {
        return '<div class="sups">' + M.SUPPLIERS.map((sp) => {
          const ss = M.sup.state(sp.id), lock = sp.lvl > M.S.level, disc = M.sup.discount(sp);
          return '<div class="sup' + (lock ? ' dis' : '') + '"><div class="sup-h"><i class="sw" style="background:' + sp.color + '"></i><b>' + sp.name + '</b>' + lockTxt(sp.lvl) + '</div><p>' + sp.desc + '</p>' +
            '<div class="kv"><span>Preço</span><b>' + Math.round(sp.mult * 100) + '% do custo base</b><span>Entrega</span><b>' + U.dur(M.sup.eta(sp)) + '</b><span>Pedido mínimo</span><b>' + (sp.min ? U.money0(sp.min) : '—') + '</b><span>Confiabilidade</span><b>' + Math.round(sp.rel * 100) + '%</b><span>Desconto atual</span><b class="pos">' + Math.round(disc * 100) + '%</b><span>Categorias</span><b>' + (sp.perishOnly ? 'Perecíveis' : M.sup.cats(sp).map((c) => M.CAT[c].name).join(', ')) + '</b></div>' +
            '<div class="rel"><span>Relacionamento</span>' + bar(ss.rel / 100, 'gold') + '</div>' +
            (lock ? '' : '<div class="row-btns"><button class="btn sm" data-a="pickSup" data-s="' + sp.id + '">Comprar</button><button class="btn sm ghost" data-a="negotiate" data-s="' + sp.id + '"' + (ss.negDay === M.S.day ? ' disabled' : '') + '>' + (ss.negDay === M.S.day ? 'Negociado hoje' : 'Negociar desconto') + '</button></div>') + '</div>';
        }).join('') + '</div>' + (M.S.cdOwned ? '<p class="pos">Seu centro de distribuição reduz o tempo de entrega pela metade e dá 6% de desconto.</p>' : '<p class="muted">Dica: um centro de distribuição (nível 5) reduz prazos e custos de todas as compras.</p>');
      }
      if (tab === 'pedidos') {
        const ords = M.S.orders.slice().reverse().slice(0, 30);
        return ords.length ? ordersHTML(ords) : '<p class="empty">Você ainda não fez pedidos.</p>';
      }
      if (!M.stores.isRetail(s)) return '<p class="empty">Centros de distribuição não vendem diretamente. Os benefícios valem para todas as suas compras.</p>';
      const c = cart(), sp = M.SUP[c.sup], T = M.stores.type(s);
      const avail = M.sup.available();
      let h = '<div class="chips">' + avail.map((x) => '<button class="chip' + (x.id === c.sup ? ' on' : '') + '" style="--c:' + x.color + '" data-a="pickSup" data-s="' + x.id + '">' + x.name + '<small>' + Math.round(x.mult * 100) + '% · ' + U.dur(M.sup.eta(x)) + '</small></button>').join('') + '</div>';
      const prods = M.PRODUCTS.filter((p) => M.sup.sells(sp, p) && T.cats.includes(p.cat));
      const cats = [...new Set(prods.map((p) => p.cat))];
      if (c.cat && !cats.includes(c.cat)) c.cat = null;
      const listed = M.inv.listed(s);
      h += '<div class="toolbar"><div class="chips sm"><button class="chip' + (!c.cat ? ' on' : '') + '" data-a="cartCat" data-c="">Expostos na loja</button>' + cats.map((k) => '<button class="chip' + (c.cat === k ? ' on' : '') + '" style="--c:' + M.CAT[k].color + '" data-a="cartCat" data-c="' + k + '">' + M.CAT[k].name + '</button>').join('') + '</div><button class="btn sm" data-a="suggest">' + ic('bolt') + 'Pedido sugerido</button><button class="btn sm ghost" data-a="cartClear">Limpar</button></div>';
      const shown = prods.filter((p) => (c.cat ? p.cat === c.cat : listed[p.id] != null || c.items[p.id]));
      if (!shown.length) h += '<p class="empty">' + (c.cat ? 'Nenhum produto disponível.' : 'Nenhum produto exposto nesta loja é vendido por ' + sp.name + '. Escolha uma categoria acima ou outro fornecedor.') + '</p>';
      else {
        h += '<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>Produto</th><th>Custo unitário</th><th>Venda</th><th>Em estoque</th><th>A caminho</th><th>Quantidade</th></tr></thead><tbody>';
        for (const p of shown) {
          const lock = p.lvl > M.S.level, q = c.items[p.id] || 0;
          h += '<tr class="' + (lock ? 'lock' : '') + '"><td>' + pi(p.id, 28) + '</td><td><b>' + U.esc(p.name) + '</b><small>' + M.CAT[p.cat].name + (p.life ? ' · validade ' + p.life + ' d' : '') + '</small></td><td class="num">' + U.money(M.sup.unit(sp, p.id)) + '</td><td class="num">' + U.money(M.eco.price(p.id)) + '</td><td class="num">' + M.inv.total(s, p.id) + '</td><td class="num">' + M.stores.pendingQty(s, p.id) + '</td>' +
            '<td>' + (lock ? lockTxt(p.lvl) : '<div class="qty"><button data-a="qstep" data-p="' + p.id + '" data-v="-10">−10</button><input type="number" min="0" value="' + q + '" data-ch="qset" data-p="' + p.id + '"><button data-a="qstep" data-p="' + p.id + '" data-v="10">+10</button><button data-a="qstep" data-p="' + p.id + '" data-v="50">+50</button></div>') + '</td></tr>';
        }
        h += '</tbody></table></div>';
      }
      const items = Object.keys(c.items).filter((k) => c.items[k] > 0).map((k) => ({ p: k, q: c.items[k] }));
      const qt = M.sup.quote(sp, items), units = U.sum(items, (i) => i.q), free = M.inv.free(s) - M.inv.dockQty(s);
      h += '<div class="cartbar"><div class="cb-l"><span>' + items.length + ' produtos · ' + units + ' unidades</span>' + (units > 0 && units > free ? '<span class="neg">' + ic('info') + 'O depósito comporta mais ' + Math.max(0, free) + ' unidades. O excedente fica na doca.</span>' : '<span class="muted">Espaço livre no depósito: ' + Math.max(0, free) + '</span>') + (qt.sub && qt.sub < sp.min ? '<span class="neg">Pedido mínimo: ' + U.money0(sp.min) + '</span>' : '') + '</div>' +
        '<div class="cb-r"><div class="kv"><span>Subtotal</span><b>' + U.money(qt.sub) + '</b><span>Desconto por volume</span><b class="pos">−' + Math.round(qt.vol * 100) + '%</b><span>Frete</span><b>' + U.money(qt.ship) + '</b><span>Total</span><b class="big">' + U.money(qt.total) + '</b></div>' +
        '<button class="btn primary" data-a="placeOrder"' + (!items.length ? ' disabled' : '') + '>' + ic('fornecedores') + 'Fazer pedido · chega em ' + U.dur(M.sup.eta(sp)) + '</button></div></div>';
      return h;
    },
  };
  A.pickSup = (el, d) => { const c = cart(); c.sup = d.s; for (const k in c.items) if (!M.sup.sells(M.SUP[d.s], M.P[k])) delete c.items[k]; M.R.panel.tab = 'pedido'; UI.renderPanel(); };
  A.cartCat = (el, d) => { cart().cat = d.c || null; UI.renderPanel(); };
  A.qstep = (el, d) => { const c = cart(); c.items[d.p] = Math.max(0, (c.items[d.p] || 0) + +d.v); UI.renderPanel(); };
  A.qset = (el, d) => { cart().items[d.p] = Math.max(0, Math.round(+el.value || 0)); UI.renderPanel(); };
  A.cartClear = () => { cart().items = {}; UI.renderPanel(); };
  A.suggest = () => {
    const s = st(), c = cart(), sp = M.SUP[c.sup];
    const sug = M.stores.suggestedOrder(s, 2);
    let n = 0;
    for (const it of sug) if (M.sup.sells(sp, M.P[it.p])) { c.items[it.p] = it.q; n++; }
    M.toast(n ? n + ' produtos sugeridos para completar as prateleiras e o depósito.' : 'Nada a sugerir com ' + sp.name + '. Tente outro fornecedor.', n ? 'good' : 'info');
    UI.renderPanel();
  };
  A.placeOrder = () => {
    const s = st(), c = cart(), items = Object.keys(c.items).filter((k) => c.items[k] > 0).map((k) => ({ p: k, q: c.items[k] }));
    if (M.sup.order(s, c.sup, items)) { c.items = {}; UI.renderPanel(); }
  };
  A.negotiate = (el, d) => { M.sup.negotiate(d.s); UI.renderPanel(); };

  // ================= FUNCIONÁRIOS =================
  UI._role = 'caixa';
  const roleColor = { caixa: '#ff8a3d', repositor: '#2ec4b6', gerente: '#e9ecef', seguranca: '#22283a', faxineiro: '#74c0fc', estoquista: '#f59f00', entregador: '#51cf66' };
  function avatar(look, role) {
    const key = JSON.stringify(look) + role;
    avatar.c = avatar.c || {};
    if (!avatar.c[key]) {
      const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const x = cv.getContext('2d');
      const L = M.sprites.ROLE_LOOK[role] || {};
      M.sprites.person(x, 32, 60, 56, look, 0, 0, { shirt: L.shirt, apron: L.apron, tie: L.tie, hat: L.hat, pants: L.pants });
      avatar.c[key] = cv.toDataURL();
    }
    return '<img class="av" src="' + avatar.c[key] + '" alt="">';
  }
  const skills = (sk) => '<div class="skills"><span>Rapidez' + bar(sk.vel / 1.9) + '</span><span>Atendimento' + bar(sk.atend / 1.9) + '</span><span>Organização' + bar(sk.org / 1.9) + '</span></div>';
  P.funcionarios = {
    icon: 'equipe', title: () => 'Equipe · ' + U.esc(st().name), wide: true, tabs: [['equipe', 'Equipe da loja'], ['contratar', 'Contratar'], ['empresa', 'Toda a empresa']],
    render(o, tab) {
      const s = st();
      if (tab === 'contratar') {
        const roles = Object.keys(M.ROLES);
        let h = '<div class="chips">' + roles.map((r) => '<button class="chip' + (UI._role === r ? ' on' : '') + '" style="--c:' + roleColor[r] + '" data-a="role" data-r="' + r + '"' + '>' + M.ROLES[r].name + (M.ROLES[r].lvl > M.S.level ? ' 🔒' : '') + '</button>').join('') + '</div>';
        const R = M.ROLES[UI._role];
        h += '<p class="muted">' + R.desc + ' Salário de mercado: ~' + U.money0(R.sal) + '/dia. A taxa de contratação equivale a 1,5 dia de salário. Novos candidatos chegam todos os dias.</p>';
        if (R.lvl > M.S.level) return h + '<p class="empty">Disponível a partir do nível ' + R.lvl + '.</p>';
        h += '<div class="cands">' + (M.S.cands[UI._role] || []).map((c, i) => '<div class="emp">' + avatar(c.look, c.role) + '<div class="em-b"><b>' + U.esc(c.name) + '</b><small>Nível ' + c.lvl + ' · ' + c.trait + '</small>' + skills(c.sk) + '<div class="kv"><span>Eficiência</span><b>' + Math.round(c.eff * 100) + '%</b><span>Salário</span><b>' + U.money0(c.salary) + '/dia</b></div><button class="btn sm primary" data-a="hire" data-i="' + i + '">Contratar · ' + U.money0(c.salary * 1.5) + '</button></div></div>').join('') + '</div>';
        return h;
      }
      if (tab === 'empresa') {
        let h = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nome</th><th>Função</th><th>Loja</th><th>Nível</th><th>Eficiência</th><th>Satisfação</th><th>Salário/dia</th></tr></thead><tbody>';
        let tot = 0;
        for (const x of M.S.stores) for (const e of x.emps) { tot += M.emps.shiftCost(e); h += '<tr><td><b>' + U.esc(e.name) + '</b></td><td>' + M.ROLES[e.role].name + '</td><td>' + U.esc(x.name) + '</td><td>' + e.lvl + '</td><td class="num">' + Math.round(e.eff * 100) + '%</td><td>' + bar(e.sat / 100, e.sat < 35 ? 'bad' : e.sat < 60 ? 'warn' : '') + '</td><td class="num">' + U.money0(M.emps.shiftCost(e)) + '</td></tr>'; }
        return h + '</tbody></table></div><p>Folha de pagamento diária: <b>' + U.money0(tot) + '</b></p>';
      }
      if (!s.emps.length) return '<p class="empty">Nenhum funcionário nesta loja. Sem equipe, você precisa operar o caixa e repor tudo sozinho.</p><div class="row-btns"><button class="btn primary" data-a="tab" data-t="contratar">Contratar funcionários</button></div>';
      let h = '<p class="muted">' + s.emps.length + '/' + M.STAFF_MAX[s.size] + ' funcionários · folha ' + U.money0(M.emps.payroll(s)) + '/dia' + (s.emps.some((e) => e.role === 'gerente') ? ' · gerente: +12% de eficiência' : '') + '</p><div class="emps">';
      for (const e of s.emps) {
        const need = M.emps.need(e.lvl), on = M.emps.onShift(e), a = e._a;
        const doing = !a ? (on ? 'Chegando' : 'Fora do turno') : a.st === 'work' ? 'No caixa' : a.carry ? 'Carregando mercadoria' : a.st === 'clean' || a.st === 'toDirt' ? 'Limpando' : a.hidden || a.st === 'out' ? 'Em entrega' : a.st === 'leave' ? 'Indo embora' : 'Trabalhando';
        const others = M.S.stores.filter((x) => x !== s);
        h += '<div class="emp">' + avatar(e.look, e.role) + '<div class="em-b"><div class="em-h"><b>' + U.esc(e.name) + '</b>' + pill(M.ROLES[e.role].name) + pill('Nv ' + e.lvl, 'gold') + '<small class="' + (on ? 'pos' : 'muted') + '">' + doing + '</small></div>' + skills(e.sk) +
          '<div class="kv"><span>Eficiência real</span><b>' + Math.round(M.emps.eff(s, e) * 100) + '%</b><span>Salário</span><b>' + U.money0(M.emps.shiftCost(e)) + '/dia</b><span>Satisfação</span><b class="' + (e.sat < 35 ? 'neg' : '') + '">' + Math.round(e.sat) + '%</b><span>Experiência</span><b>' + Math.floor(e.xp) + '/' + need + '</b></div>' +
          '<div class="em-a"><select data-ch="shift" data-e="' + e.id + '">' + Object.keys(M.SHIFTS).map((k) => '<option value="' + k + '"' + (e.shift === k ? ' selected' : '') + '>' + M.SHIFTS[k].name + '</option>').join('') + '</select>' +
          '<button class="btn sm" data-a="train" data-e="' + e.id + '"' + (e.trained === M.S.day ? ' disabled' : '') + '>Treinar · ' + U.money0(M.emps.trainCost(e)) + '</button>' +
          '<button class="btn sm' + (e.xp >= need && e.lvl < 5 ? ' primary' : '') + '" data-a="promote" data-e="' + e.id + '"' + (e.xp >= need && e.lvl < 5 ? '' : ' disabled') + '>Promover</button>' +
          '<button class="btn sm" data-a="raise" data-e="' + e.id + '">Aumento +8%</button>' +
          (others.length ? '<select data-ch="transfer" data-e="' + e.id + '"><option value="">Transferir…</option>' + others.map((x) => '<option value="' + x.id + '">' + U.esc(x.name) + '</option>').join('') + '</select>' : '') +
          '<button class="btn sm ghost danger" data-a="fire" data-e="' + e.id + '">Demitir</button></div></div></div>';
      }
      return h + '</div>';
    },
  };
  const empById = (id) => st().emps.find((e) => e.id === +id);
  A.role = (el, d) => { UI._role = d.r; UI.renderPanel(); };
  A.hire = (el, d) => { M.emps.hire(st(), UI._role, +d.i); UI.renderPanel(); };
  A.shift = (el, d) => { M.emps.setShift(st(), empById(d.e), el.value); };
  A.train = (el, d) => { M.emps.train(st(), empById(d.e)); UI.renderPanel(); };
  A.promote = (el, d) => { M.emps.promote(st(), empById(d.e)); UI.renderPanel(); };
  A.raise = (el, d) => { M.emps.raise(st(), empById(d.e)); UI.renderPanel(); };
  A.transfer = (el, d) => { if (!el.value) return; M.emps.transfer(st(), empById(d.e), M.game.storeById(+el.value)); UI.renderPanel(); };
  A.fire = (el, d) => { if (el.dataset.sure) { M.emps.fire(st(), empById(d.e)); UI.renderPanel(); } else { el.dataset.sure = 1; el.textContent = 'Confirmar demissão'; UI._hold = true; setTimeout(() => (UI._hold = false), 3000); } };

  // ================= FINANÇAS =================
  UI._period = 'dia';
  P.financas = {
    icon: 'financas', title: 'Finanças', wide: true, tabs: [['resumo', 'Resumo'], ['graficos', 'Gráficos'], ['lojas', 'Por loja'], ['banco', 'Banco']],
    render(o, tab) {
      const S = M.S, t = M.eco.totals(S.today), loan = S.today.inc.emprestimos || 0;
      if (tab === 'graficos') {
        const per = UI._period;
        return '<div class="chips">' + [['dia', 'Diário (14 dias)'], ['semana', 'Semanal (8 semanas)'], ['mes', 'Mensal (6 meses)']].map((p) => '<button class="chip' + (per === p[0] ? ' on' : '') + '" data-a="period" data-v="' + p[0] + '">' + p[1] + '</button>').join('') + '</div>' +
          '<div class="legend"><span><i class="lg inc"></i>Receitas</span><span><i class="lg exp"></i>Despesas</span><span><i class="lg pro"></i>Lucro</span></div><canvas class="chart" id="finChart" height="240"></canvas>' +
          '<h4>Saldo em caixa</h4><canvas class="chart" id="cashChart" height="120"></canvas>' + (S.hist.length < 2 ? '<p class="muted">Os gráficos ficam mais completos a cada dia encerrado.</p>' : '');
      }
      if (tab === 'lojas') {
        let h = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Loja</th><th>Tipo</th><th>Vendas hoje</th><th>Resultado hoje</th><th>Vendas 7 dias</th><th>Lucro 7 dias</th><th>Clientes hoje</th><th>Avaliação</th><th></th></tr></thead><tbody>';
        for (const s of S.stores) {
          const tt = M.eco.totals(s.led), h7 = s.hist.slice(-7);
          h += '<tr><td><b>' + U.esc(s.name) + '</b></td><td>' + M.stores.type(s).name + '</td><td class="num">' + U.money0(s.day.sales) + '</td><td class="num ' + (tt.inc - tt.exp >= 0 ? 'pos' : 'neg') + '">' + U.money0(tt.inc - tt.exp) + '</td><td class="num">' + U.money0(U.sum(h7, (r) => r.sales)) + '</td><td class="num">' + U.money0(U.sum(h7, (r) => r.profit)) + '</td><td class="num">' + s.day.cust + '</td><td>' + U.stars(s.rating) + '</td><td><button class="btn sm" data-a="visit" data-s="' + s.id + '">Visitar</button></td></tr>';
        }
        return h + '</tbody></table></div>';
      }
      if (tab === 'banco') {
        const lim = M.eco.loanLimit(), av = Math.max(0, lim - S.debt);
        return '<div class="stats">' + stat('Dívida', U.money0(S.debt), S.debt ? 'Juros ' + U.money0(S.debt * M.eco.LOAN_RATE) + '/dia' : '') + stat('Limite de crédito', U.money0(lim), '45% do valor da empresa') + stat('Disponível', U.money0(av)) + stat('Valor da empresa', U.money0(M.eco.companyValue())) + '</div>' +
          '<h4>Pedir empréstimo</h4><div class="row-btns">' + [5000, 20000, 50000, 150000, 500000].filter((v) => v <= av).map((v) => '<button class="btn" data-a="borrow" data-v="' + v + '">' + U.money0(v) + '</button>').join('') + (av >= 1000 ? '<button class="btn" data-a="borrow" data-v="' + Math.floor(av / 1000) * 1000 + '">Tudo (' + U.money0(Math.floor(av / 1000) * 1000) + ')</button>' : '') + '</div>' +
          '<h4>Pagar dívida</h4><div class="row-btns">' + (S.debt ? [5000, 20000, 50000].filter((v) => v < S.debt).map((v) => '<button class="btn" data-a="repay" data-v="' + v + '">' + U.money0(v) + '</button>').join('') + '<button class="btn primary" data-a="repay" data-v="' + Math.ceil(S.debt) + '">Quitar tudo</button>' : '<p class="empty">Você não tem dívidas.</p>') + '</div>' +
          '<p class="muted">Saldo negativo gera juros de cheque especial de ' + (M.eco.OVERDRAFT_RATE * 100).toFixed(1) + '% ao dia. Três dias seguidos abaixo de −R$ 15 mil levam à falência.</p>';
      }
      const fc = U.sum(S.stores, (s) => { const f = M.eco.storeDaily(s); return f.sal + f.rent + f.maint; });
      let h = '<div class="stats">' + stat('Saldo', U.money(S.money), null, S.money < 0 ? 'neg' : '') + stat('Receitas hoje', U.money0(t.inc - loan)) + stat('Despesas hoje', U.money0(t.exp)) + stat('Lucro hoje', U.money0(t.inc - loan - t.exp), 'até agora', t.inc - loan - t.exp >= 0 ? 'pos' : 'neg') + '</div>';
      h += '<div class="stats">' + stat('Custos fixos previstos', U.money0(fc) + '/dia', 'salários, aluguel e manutenção (cobrados ao fechar)') + stat('Impostos previstos', U.money0(U.sum(S.stores, (s) => s.day.sales) * M.eco.TAX), '6% do faturamento') + stat('Faturamento total', U.money0(S.stats.sales), S.stats.cust + ' clientes atendidos') + stat('Melhor dia', U.money0(S.stats.best)) + '</div>';
      const rows = (obj, names) => Object.keys(names).filter((k) => obj[k]).map((k) => '<tr><td>' + names[k] + '</td><td class="num">' + U.money(obj[k]) + '</td></tr>').join('') || '<tr><td colspan="2" class="muted">Sem lançamentos</td></tr>';
      h += '<div class="cols2"><div><h4>Receitas de hoje</h4><table class="tbl sm">' + rows(S.today.inc, M.eco.INC) + '</table></div><div><h4>Despesas de hoje</h4><table class="tbl sm">' + rows(S.today.exp, M.eco.EXP) + '</table></div></div>';
      return h;
    },
    after(win, o, tab) {
      if (tab !== 'graficos') return;
      const n = UI._period === 'dia' ? 14 : UI._period === 'semana' ? 8 : 6;
      const ser = M.eco.series(UI._period, n);
      chartBars(win.querySelector('#finChart'), ser);
      chartLine(win.querySelector('#cashChart'), ser.map((r) => ({ label: r.label, v: r.money })));
    },
  };
  A.period = (el, d) => { UI._period = d.v; UI.renderPanel(); };
  A.borrow = (el, d) => { M.eco.borrow(+d.v); UI.renderPanel(); };
  A.repay = (el, d) => { M.eco.repay(+d.v); UI.renderPanel(); };
  A.visit = (el, d) => { UI.close(); M.game.setStore(+d.s); M.game.setView('store'); };

  // gráficos em canvas
  function cssv(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#888'; }
  function prep(cv) {
    if (!cv) return null;
    const w = cv.clientWidth || 600, h = +cv.getAttribute('height'), dpr = window.devicePixelRatio || 1;
    cv.width = w * dpr; cv.height = h * dpr; cv.style.height = h + 'px';
    const c = cv.getContext('2d'); c.scale(dpr, dpr); return { c, w, h };
  }
  function niceMax(v) { if (v <= 0) return 100; const p = Math.pow(10, Math.floor(Math.log10(v))); for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p; return 10 * p; }
  function chartBars(cv, ser, opt) {
    const g = prep(cv); if (!g) return; const { c, w, h } = g; opt = opt || {};
    const padL = 58, padB = 22, padT = 10, iw = w - padL - 8, ih = h - padB - padT;
    if (!ser.length) { c.fillStyle = cssv('--muted'); c.font = '13px Nunito'; c.fillText('Sem dados ainda. Encerre o primeiro dia.', padL, h / 2); return; }
    const mx = niceMax(Math.max(1, ...ser.map((r) => Math.max(r.inc, r.exp, Math.abs(r.profit))))), mn = Math.min(0, ...ser.map((r) => r.profit));
    const lo = mn < 0 ? -niceMax(-mn) : 0, span = mx - lo, Y = (v) => padT + ih - ((v - lo) / span) * ih;
    c.font = '11px "Space Mono", monospace'; c.fillStyle = cssv('--muted'); c.strokeStyle = cssv('--grid'); c.lineWidth = 1; c.textAlign = 'right'; c.textBaseline = 'middle';
    for (let k = 0; k <= 4; k++) { const v = lo + (span * k) / 4, y = Y(v); c.beginPath(); c.moveTo(padL, y); c.lineTo(w - 8, y); c.stroke(); c.fillText(U.money0(v).replace('R$ ', ''), padL - 6, y); }
    const bw = iw / ser.length, inc = cssv('--teal'), exp = cssv('--coral'), pro = cssv('--gold');
    ser.forEach((r, i) => {
      const x = padL + i * bw;
      if (opt.single) { c.fillStyle = inc; c.fillRect(x + bw * 0.2, Y(r.inc), bw * 0.6, Y(0) - Y(r.inc)); }
      else { c.fillStyle = inc; c.fillRect(x + bw * 0.12, Y(r.inc), bw * 0.36, Y(0) - Y(r.inc)); c.fillStyle = exp; c.fillRect(x + bw * 0.52, Y(r.exp), bw * 0.36, Y(0) - Y(r.exp)); }
      c.fillStyle = cssv('--muted'); c.textAlign = 'center'; c.textBaseline = 'top'; if (ser.length < 16 || i % 2 === 0) c.fillText(r.label, x + bw / 2, h - padB + 6);
    });
    c.strokeStyle = pro; c.lineWidth = 2.5; c.beginPath();
    ser.forEach((r, i) => { const x = padL + i * bw + bw / 2, y = Y(r.profit); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke();
    ser.forEach((r, i) => { const x = padL + i * bw + bw / 2, y = Y(r.profit); c.fillStyle = i === ser.length - 1 ? pro : cssv('--panel'); c.beginPath(); c.arc(x, y, i === ser.length - 1 ? 4.5 : 3, 0, 6.283); c.fill(); c.strokeStyle = pro; c.lineWidth = 2; c.stroke(); });
  }
  function chartLine(cv, ser) {
    const g = prep(cv); if (!g || !ser.length) return; const { c, w, h } = g;
    const padL = 58, padB = 18, iw = w - padL - 8, ih = h - padB - 8;
    const vs = ser.map((r) => r.v), mx = niceMax(Math.max(...vs, 1)), mn = Math.min(0, ...vs), lo = mn < 0 ? -niceMax(-mn) : 0, Y = (v) => 8 + ih - ((v - lo) / (mx - lo)) * ih;
    c.font = '11px "Space Mono", monospace'; c.fillStyle = cssv('--muted'); c.strokeStyle = cssv('--grid'); c.textAlign = 'right'; c.textBaseline = 'middle';
    for (let k = 0; k <= 2; k++) { const v = lo + ((mx - lo) * k) / 2, y = Y(v); c.beginPath(); c.moveTo(padL, y); c.lineTo(w - 8, y); c.stroke(); c.fillText(U.money0(v).replace('R$ ', ''), padL - 6, y); }
    const X = (i) => padL + (ser.length === 1 ? iw / 2 : (i / (ser.length - 1)) * iw);
    const grad = c.createLinearGradient(0, 8, 0, 8 + ih); grad.addColorStop(0, 'rgba(46,196,182,.35)'); grad.addColorStop(1, 'rgba(46,196,182,0)');
    c.beginPath(); ser.forEach((r, i) => (i ? c.lineTo(X(i), Y(r.v)) : c.moveTo(X(i), Y(r.v)))); c.lineTo(X(ser.length - 1), Y(lo)); c.lineTo(X(0), Y(lo)); c.closePath(); c.fillStyle = grad; c.fill();
    c.beginPath(); ser.forEach((r, i) => (i ? c.lineTo(X(i), Y(r.v)) : c.moveTo(X(i), Y(r.v)))); c.strokeStyle = cssv('--teal'); c.lineWidth = 2.5; c.stroke();
    const L = ser.length - 1; c.fillStyle = cssv('--teal'); c.beginPath(); c.arc(X(L), Y(ser[L].v), 4.5, 0, 6.283); c.fill();
  }
  UI.chartBars = chartBars;

  // ================= EMPRESA =================
  P.empresa = {
    icon: 'empresa', title: 'Administração da empresa', wide: true, tabs: [['unidades', 'Unidades'], ['marketing', 'Marketing'], ['concorrencia', 'Concorrência'], ['sede', 'Escritório central']],
    render(o, tab) {
      const S = M.S;
      if (tab === 'marketing') {
        const act = S.camps.filter((c) => c.until >= S.day);
        return '<p>Campanhas aumentam o movimento em todas as suas lojas. Bônus atual: <b class="pos">+' + Math.round(M.eco.marketingBoost() * 100) + '%</b> de clientes.</p><div class="camps">' + M.eco.CAMPAIGNS.map((c) => {
          const on = act.find((x) => x.id === c.id), lock = c.lvl > S.level;
          return '<div class="camp' + (lock ? ' dis' : '') + '"><b>' + c.name + '</b><p>' + c.desc + '</p><div class="kv"><span>Efeito</span><b>+' + Math.round(c.boost * 100) + '% clientes</b><span>Duração</span><b>' + c.days + ' dias</b></div>' + (lock ? lockTxt(c.lvl) : on ? pill('No ar até o dia ' + on.until, 'gold') : '<button class="btn sm primary" data-a="campaign" data-c="' + c.id + '">Contratar · ' + U.money0(M.eco.campaignCost(c)) + '</button>') + '</div>';
        }).join('') + '</div><p class="muted">O custo cresce com o número de lojas, pois a campanha cobre toda a rede.</p>';
      }
      if (tab === 'concorrencia') {
        const sh = M.comps.shares();
        let h = '<h4>Participação de mercado</h4><div class="sharebar">' + sh.filter((x) => x.share > 0.005).map((x) => '<i style="width:' + (x.share * 100).toFixed(1) + '%;background:' + x.color + '" title="' + U.esc(x.name) + ' ' + U.pct(x.share) + '"></i>').join('') + '</div><div class="legend">' + sh.map((x) => '<span><i class="lg" style="background:' + x.color + '"></i>' + U.esc(x.name) + ' ' + U.pct(x.share) + '</span>').join('') + '</div>';
        h += '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Empresa</th><th>Estratégia</th><th>Lojas</th><th>Funcionários</th><th>Preços</th><th>Qualidade</th><th>Faturamento ontem</th></tr></thead><tbody>';
        const strat = { preco: 'Preço baixo', equilibrio: 'Equilibrada', qualidade: 'Qualidade', expansao: 'Expansão' };
        for (const c of S.comps) h += '<tr class="' + (c.active ? '' : 'lock') + '"><td><i class="sw" style="background:' + c.color + '"></i><b>' + c.name + '</b>' + (c.promoUntil >= S.day ? pill('em promoção', 'warn') : '') + '</td><td>' + strat[c.strat] + '</td><td class="num">' + (c.active ? c.stores.length : '—') + '</td><td class="num">' + (c.active ? c.emps : '—') + '</td><td class="num">' + (c.active ? Math.round(M.comps.effIdx(c) * 100) + '%' : '—') + '</td><td>' + (c.active ? bar(c.quality / 100) : 'Ainda não chegou') + '</td><td class="num">' + (c.active ? U.money0(c.rev) : '—') + '</td></tr>';
        h += '</tbody></table></div><p class="muted">Concorrentes perto das suas lojas disputam os mesmos clientes. Eles reagem quando você ganha mercado: baixam preços, fazem promoções e abrem novas unidades.</p>';
        return h;
      }
      if (tab === 'sede') {
        const lot = S.lots.find((l) => l.hq);
        if (S.hq) return '<div class="card"><h4>' + ic('empresa') + 'Sede de ' + U.esc(S.name) + '</h4><p>Benefícios ativos:</p><ul><li>+5% de eficiência para todos os funcionários</li><li>Pedidos automáticos em todas as lojas, mesmo sem gerente</li><li>+10% de chance de sucesso nas negociações</li><li>Valorização de R$ 60 mil no valor da empresa</li></ul></div>';
        return '<div class="card"><h4>' + ic('empresa') + 'Torre Empresarial — Centro Comercial</h4><p>Um escritório central para administrar toda a rede.</p><ul><li>+5% de eficiência para todos os funcionários</li><li>Pedidos automáticos em todas as lojas</li><li>Negociações mais fortes com fornecedores</li></ul>' + (S.level < 5 ? pill('Disponível no nível 5', 'lock') : '<button class="btn primary" data-a="buyHQ">Comprar sede · ' + U.money0(lot.price) + '</button>') + '</div>';
      }
      let h = '<div class="stats">' + stat('Valor da empresa', U.money0(M.eco.companyValue())) + stat('Estabelecimentos', S.stores.length) + stat('Funcionários', U.sum(S.stores, (s) => s.emps.length)) + stat('Nível', S.level + ' · ' + M.LEVELS[S.level - 1].name) + '</div><div class="units">';
      for (const s of S.stores) {
        const t = M.stores.type(s), lot = s.lotId != null ? M.world.lot(s.lotId) : null;
        h += '<div class="unit' + (s.id === S.curId ? ' cur' : '') + '"><div class="u-h"><b>' + U.esc(s.name) + '</b>' + pill(t.name) + (M.stores.isOpenNow(s) ? '' : pill('Em obras', 'warn')) + '</div><small>' + (lot ? U.esc(lot.name) + ' · ' + M.ZONES[lot.zone].name : '') + '</small>' +
          '<div class="kv"><span>Vendas hoje</span><b>' + U.money0(s.day.sales) + '</b><span>Equipe</span><b>' + s.emps.length + '</b><span>Avaliação</span><b>' + U.stars(s.rating) + '</b><span>Valor</span><b>' + U.money0(M.eco.storeValue(s)) + '</b></div><button class="btn sm" data-a="visit" data-s="' + s.id + '">Visitar</button></div>';
      }
      h += '<div class="unit add" data-a="dock" data-k="map">' + ic('plus') + '<b>Abrir nova unidade</b><small>Escolha um terreno no mapa da cidade</small></div></div>';
      return h;
    },
  };
  A.campaign = (el, d) => { M.eco.startCampaign(d.c); UI.renderPanel(); };
  A.buyHQ = () => { M.game.buyHQ(); UI.renderPanel(); };

  // ================= MISSÕES =================
  P.missoes = {
    icon: 'missoes', title: 'Missões e progresso', wide: true, tabs: [['missoes', 'Missões'], ['objetivos', 'Objetivos especiais'], ['calendario', 'Eventos'], ['progressao', 'Progressão']],
    render(o, tab) {
      const S = M.S;
      if (tab === 'objetivos') return '<div class="achs">' + M.ACH.map((a) => { const d = S.missions.ach[a.id]; return '<div class="ach' + (d ? ' ok' : '') + '">' + ic(d ? 'trophy' : 'flag') + '<b>' + a.name + '</b><small>' + a.desc + '</small><em>' + (d ? 'Concluído no dia ' + d : '+' + U.money0(a.r)) + '</em></div>'; }).join('') + '</div>';
      if (tab === 'calendario') {
        const act = S.events.active;
        let h = '<h4>Acontecendo agora</h4>' + (act.length ? '<ul class="list">' + act.map((e) => '<li>' + ic('calendar') + '<b>' + e.name + '</b><span>até o dia ' + e.until + (e.cats ? ' · ' + Object.keys(e.cats).map((c) => M.CAT[c].name + ' ×' + e.cats[c]).join(', ') : '') + (e.traffic && e.traffic !== 1 ? ' · movimento ×' + e.traffic : '') + '</span></li>').join('') + '</ul>' : '<p class="empty">Nenhum evento hoje.</p>');
        h += '<h4>Próximas datas comemorativas</h4><ul class="list">' + M.events.upcoming(6).map((e) => '<li>' + ic('calendar') + '<b>' + e.def.name + '</b><span>dia ' + e.day + ' (' + U.date(e.day) + ') · em ' + (e.day - S.day) + ' dias</span></li>').join('') + '</ul><p class="muted">Durante as datas comemorativas, produtos específicos vendem muito mais. Abasteça-se antes!</p>';
        return h;
      }
      if (tab === 'progressao') {
        return '<div class="levels">' + M.LEVELS.map((L) => {
          const cur = L.n === S.level, done = L.n < S.level, nx = L.n === S.level + 1;
          const un = M.prog.unlocks(L.n).slice(0, 8).map((u) => u.name).join(', ');
          return '<div class="lv' + (cur ? ' cur' : done ? ' done' : '') + '"><div class="lv-n">' + L.n + '</div><div><b>' + L.name + '</b><small>' + L.desc + '</small>' + (nx ? '<div class="req">' + bar((S.xp - M.LEVELS[S.level - 1].xp) / (L.xp - M.LEVELS[S.level - 1].xp)) + '<span>' + U.num(S.xp) + '/' + U.num(L.xp) + ' XP' + (L.stores ? ' · ' + S.stores.length + '/' + L.stores + ' estabelecimentos' : '') + '</span></div>' : '') + (un && L.n > 1 ? '<small class="un">Libera: ' + un + '</small>' : '') + '</div></div>';
        }).join('') + '</div><p class="muted">Ganhe XP vendendo (2 XP a cada R$ 100), concluindo missões e objetivos especiais.</p>';
      }
      const sec = (title, list, extra) => '<h4>' + title + '</h4>' + (list.length ? '<div class="mis">' + list.map((m) => { const pr = M.missions.progress(m), k = U.clamp(pr / m.target, 0, 1); return '<div class="mi' + (m.done ? ' ok' : m.failed ? ' fail' : '') + '">' + ic(m.done ? 'check' : m.scope === 'e' ? 'star' : 'flag') + '<div><b>' + U.esc(m.txt) + '</b>' + bar(k, m.done ? 'ok' : '') + '<small>' + (m.done ? 'Concluída' : m.failed ? 'Expirada' : fmtProg(m, pr)) + (m.end && !m.done ? ' · avaliada no fechamento' : '') + (m.until ? ' · até o dia ' + m.until : '') + '</small></div><em>+' + U.money0(m.reward.m) + '<br>+' + m.reward.xp + ' XP</em></div>'; }).join('') + '</div>' : '<p class="empty">' + (extra || 'Nenhuma missão.') + '</p>');
      return sec('Missões diárias', S.missions.daily) + sec('Missões semanais · renovam no dia ' + (Math.floor((S.day - 1) / 7) * 7 + 8), S.missions.weekly) + sec('Desafios de eventos', (S.missions.event || []).filter((m) => !m.failed || m.until >= S.day - 3), 'Os desafios surgem nas datas comemorativas.');
    },
  };
  function fmtProg(m, pr) { const money = /vendas|lucro|w_lucro/.test(m.k) || (m.k === 'evento' && !m.cat); return (money ? U.money0(pr) + ' de ' + U.money0(m.target) : Math.floor(pr) + ' de ' + m.target); }

  // ================= NOTIFICAÇÕES =================
  P.notificacoes = {
    icon: 'bell', title: 'Notificações', narrow: true,
    render() { M.R.unread = 0; return M.R.notes.length ? '<ul class="notes">' + M.R.notes.map((n) => '<li class="t-' + n.type + '"><small>Dia ' + n.day + ' · ' + U.time(n.time) + '</small>' + U.esc(n.msg) + '</li>').join('') + '</ul>' : '<p class="empty">Nada por aqui ainda.</p>'; },
  };

  // ================= TERRENO (MAPA) =================
  P.lote = {
    icon: 'mapa', narrow: true,
    title: (o) => { const l = M.world.lot(o.id); return l ? U.esc(l.name) : 'Terreno'; },
    render(o) {
      const l = M.world.lot(o.id); if (!l) return null;
      const Z = M.ZONES[l.zone];
      let h = '<div class="stats">' + stat('Região', Z.name) + stat('Tamanho', l.hq ? 'Torre' : M.LOT_SIZES[l.size].name) + stat('Público', Math.round(l.pop * 100) + '%', 'potencial de clientes') + '</div>';
      if (l.hq) return h + '<p>' + (M.S.hq ? 'Sede da sua empresa.' : 'Salas comerciais para o escritório central da empresa.') + '</p>' + (M.S.hq ? '' : '<button class="btn primary" data-a="buyHQ"' + (M.S.level < 5 ? ' disabled' : '') + '>' + (M.S.level < 5 ? 'Disponível no nível 5' : 'Comprar sede · ' + U.money0(l.price)) + '</button>');
      if (l.owner === 'player') {
        const s = M.game.storeById(l.storeId);
        return h + '<p>Sua unidade: <b>' + U.esc(s.name) + '</b> (' + M.stores.type(s).name + ').</p><div class="kv"><span>Vendas hoje</span><b>' + U.money0(s.day.sales) + '</b><span>Avaliação</span><b>' + U.stars(s.rating) + '</b></div><div class="row-btns"><button class="btn primary" data-a="visit" data-s="' + s.id + '">Visitar loja</button></div>';
      }
      if (l.owner) {
        const c = M.S.comps.find((x) => x.id === l.owner), cs = c && c.stores.find((x) => x.lotId === l.id);
        return h + '<p><i class="sw" style="background:' + c.color + '"></i> Loja da concorrente <b>' + c.name + '</b>.</p><div class="kv"><span>Avaliação</span><b>' + U.stars(cs ? cs.rating : 50) + '</b><span>Preços</span><b>' + Math.round(M.comps.effIdx(c) * 100) + '% do mercado</b><span>Faturamento</span><b>~' + U.money0(cs ? cs.rev : 0) + '/dia</b></div>';
      }
      h += '<p>Terreno à venda por <b>' + U.money0(l.price) + '</b>. Escolha o tipo de estabelecimento:</p><label class="form1"><span>Nome</span><input id="newStoreName" maxlength="28" placeholder="Nome da nova loja"></label><div class="types">';
      for (const k in M.STORE_TYPES) {
        const t = M.STORE_TYPES[k], lock = t.lvl > M.S.level, fits = t.sizes.includes(l.size) && (!t.zones || t.zones.includes(l.zone));
        const total = l.price + M.stores.buildCost(k, l.size);
        h += '<div class="type' + (lock || !fits ? ' dis' : '') + '"><b>' + t.name + '</b><small>' + (t.cats.length ? t.cats.map((c) => M.CAT[c].name).join(', ') : 'Entregas 2× mais rápidas e 6% de desconto em todas as compras') + '</small>' +
          (lock ? pill('Nível ' + t.lvl, 'lock') : !fits ? pill(t.zones ? 'Só na zona industrial' : 'Terreno ' + t.sizes.map((z) => M.LOT_SIZES[z].name).join('/'), 'lock') : '<button class="btn sm primary" data-a="openStore" data-l="' + l.id + '" data-t="' + k + '"' + (M.S.money < total ? ' disabled' : '') + '>Construir · ' + U.money0(total) + '</button>') + '</div>';
      }
      return h + '</div>';
    },
  };
  A.openStore = (el, d) => { const nm = ($('#newStoreName') || {}).value; const s = M.stores.open(+d.l, d.t, nm && nm.trim()); if (s) { UI.close(); M.R.hoverLot = null; } };
})();
