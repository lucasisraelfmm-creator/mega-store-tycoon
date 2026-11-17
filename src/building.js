/* Sistema de construção: catálogo de peças, grade, validação, modelos de loja e modo construção
   (pré-visualização → confirmação). */
(function () {
  'use strict';
  const M = window.MST, U = M.U;
  const B = (M.build = {});

  M.BUILD_GROUPS = [
    { id: 'estrutura', name: 'Estrutura' }, { id: 'piso', name: 'Pisos' }, { id: 'expositores', name: 'Expositores' },
    { id: 'operacao', name: 'Operação' }, { id: 'decoracao', name: 'Decoração' },
  ];

  M.BUILD = {
    // --- estrutura ---
    parede: { name: 'Parede', grp: 'estrutura', kind: 'wall', cost: 30, lvl: 1, desc: 'Arraste para traçar linhas ou contornos.' },
    porta: { name: 'Porta Automática', grp: 'estrutura', kind: 'door', cost: 200, lvl: 1, desc: 'Entrada de clientes e funcionários.' },
    janela: { name: 'Janela', grp: 'estrutura', kind: 'window', cost: 80, lvl: 1, desc: 'Ilumina a loja e melhora a fachada.' },
    // --- pisos ---
    piso_concreto: { name: 'Concreto Polido', grp: 'piso', kind: 'floor', fl: 2, cost: 2, q: 0.5, lvl: 1 },
    piso_ceramica: { name: 'Cerâmica Clara', grp: 'piso', kind: 'floor', fl: 1, cost: 4, q: 1, lvl: 1 },
    piso_xadrez: { name: 'Xadrez Clássico', grp: 'piso', kind: 'floor', fl: 4, cost: 7, q: 1.6, lvl: 2 },
    piso_madeira: { name: 'Madeira', grp: 'piso', kind: 'floor', fl: 3, cost: 9, q: 2.2, lvl: 2 },
    piso_carpete: { name: 'Carpete Azul', grp: 'piso', kind: 'floor', fl: 5, cost: 12, q: 2.6, lvl: 3 },
    piso_porcelanato: { name: 'Porcelanato Escuro', grp: 'piso', kind: 'floor', fl: 6, cost: 18, q: 3.6, lvl: 4 },
    piso_marmore: { name: 'Mármore', grp: 'piso', kind: 'floor', fl: 7, cost: 35, q: 5, lvl: 6 },
    // --- expositores ---
    prateleira: { name: 'Prateleira', grp: 'expositores', kind: 'fixture', fix: 'shelf', w: 2, h: 1, slots: 4, cap: 16, cost: 220, lvl: 1, desc: 'Alimentos, bebidas, doces, limpeza, higiene, brinquedos e ferramentas.' },
    gondola: { name: 'Gôndola Grande', grp: 'expositores', kind: 'fixture', fix: 'shelf', w: 3, h: 1, slots: 6, cap: 22, cost: 430, lvl: 3, desc: 'Mais espaço e capacidade por slot.' },
    geladeira: { name: 'Geladeira Expositora', grp: 'expositores', kind: 'fixture', fix: 'fridge', w: 2, h: 1, slots: 4, cap: 12, cost: 850, maint: 6, lvl: 2, light: '#9be7ff', desc: 'Para frios, laticínios, congelados e bebidas geladas.' },
    banca: { name: 'Banca de Hortifrúti', grp: 'expositores', kind: 'fixture', fix: 'produce', w: 2, h: 1, slots: 4, cap: 14, cost: 300, lvl: 2, desc: 'Frutas, legumes e verduras frescas.' },
    arara: { name: 'Arara de Roupas', grp: 'expositores', kind: 'fixture', fix: 'rack', w: 2, h: 1, slots: 3, cap: 8, cost: 380, lvl: 4, desc: 'Expõe roupas, calçados e acessórios.' },
    vitrine: { name: 'Vitrine', grp: 'expositores', kind: 'fixture', fix: 'display', w: 2, h: 1, slots: 3, cap: 6, cost: 1100, lvl: 4, light: '#fff3bf', desc: 'Eletrônicos e produtos de luxo.' },
    palete: { name: 'Expositor de Piso', grp: 'expositores', kind: 'fixture', fix: 'pallet', w: 2, h: 2, slots: 2, cap: 5, cost: 450, lvl: 3, desc: 'Móveis, TVs e itens volumosos.' },
    // --- operação ---
    caixa: { name: 'Caixa', grp: 'operacao', kind: 'checkout', w: 2, h: 1, cost: 700, lvl: 1, light: '#b2f2bb', desc: 'Precisa de um operador (você ou um funcionário).' },
    self: { name: 'Autoatendimento', grp: 'operacao', kind: 'self', w: 1, h: 1, cost: 4200, maint: 10, lvl: 4, light: '#a5d8ff', desc: 'Caixa automático: não precisa de operador.' },
    estante: { name: 'Estante de Depósito', grp: 'operacao', kind: 'storage', w: 2, h: 1, cost: 260, lvl: 1, store: 120, desc: '+120 unidades de capacidade no depósito.' },
    carrinhos: { name: 'Estação de Carrinhos', grp: 'operacao', kind: 'decor', w: 2, h: 1, cost: 500, lvl: 2, basket: 0.15, appeal: 1, desc: 'Clientes compram mais itens por visita.' },
    camera: { name: 'Câmera de Segurança', grp: 'operacao', kind: 'decor', w: 1, h: 1, cost: 400, lvl: 2, sec: 1, desc: 'Reduz furtos.' },
    lixeira: { name: 'Lixeira', grp: 'operacao', kind: 'decor', w: 1, h: 1, cost: 40, lvl: 1, clean: 1, appeal: 0.5, desc: 'A loja suja mais devagar.' },
    info: { name: 'Balcão de Atendimento', grp: 'operacao', kind: 'decor', w: 2, h: 1, cost: 600, lvl: 3, service: 1, appeal: 2, desc: 'Melhora a satisfação dos clientes.' },
    cafe: { name: 'Máquina de Café', grp: 'operacao', kind: 'decor', w: 1, h: 1, cost: 900, lvl: 3, income: 28, appeal: 2.5, light: '#ffd8a8', desc: 'Renda extra diária e clientes mais pacientes.' },
    // --- decoração ---
    planta: { name: 'Planta', grp: 'decoracao', kind: 'decor', w: 1, h: 1, cost: 60, lvl: 1, appeal: 2 },
    vaso: { name: 'Palmeira em Vaso', grp: 'decoracao', kind: 'decor', w: 1, h: 1, cost: 140, lvl: 2, appeal: 3.5 },
    flores: { name: 'Canteiro de Flores', grp: 'decoracao', kind: 'decor', w: 1, h: 1, cost: 80, lvl: 1, appeal: 2, out: true },
    arvore: { name: 'Árvore', grp: 'decoracao', kind: 'decor', w: 1, h: 1, cost: 120, lvl: 1, appeal: 2.5, out: true },
    banco: { name: 'Banco', grp: 'decoracao', kind: 'decor', w: 2, h: 1, cost: 90, lvl: 1, appeal: 2, out: true },
    tapete: { name: 'Tapete', grp: 'decoracao', kind: 'decor', w: 2, h: 1, cost: 70, lvl: 1, appeal: 1.5, block: false },
    luminaria: { name: 'Luminária', grp: 'decoracao', kind: 'decor', w: 1, h: 1, cost: 150, lvl: 1, appeal: 3, light: '#ffe8a3', out: true },
    banner: { name: 'Banner Promocional', grp: 'decoracao', kind: 'decor', w: 1, h: 1, cost: 120, lvl: 2, appeal: 1, traffic: 0.02, out: true },
    som: { name: 'Caixa de Som', grp: 'decoracao', kind: 'decor', w: 1, h: 1, cost: 350, lvl: 2, appeal: 4 },
    ar: { name: 'Ar-Condicionado', grp: 'decoracao', kind: 'decor', w: 1, h: 1, cost: 1200, maint: 4, lvl: 3, appeal: 6 },
    aquario: { name: 'Aquário', grp: 'decoracao', kind: 'decor', w: 2, h: 1, cost: 3000, maint: 3, lvl: 4, appeal: 9, light: '#74c0fc' },
    fonte: { name: 'Fonte Ornamental', grp: 'decoracao', kind: 'decor', w: 2, h: 2, cost: 2500, lvl: 5, appeal: 11, out: true },
    estatua: { name: 'Estátua Dourada', grp: 'decoracao', kind: 'decor', w: 1, h: 1, cost: 8000, lvl: 7, appeal: 20, out: true },
  };
  for (const k in M.BUILD) M.BUILD[k].id = k;

  M.FLOORS = { 1: 'piso_ceramica', 2: 'piso_concreto', 3: 'piso_madeira', 4: 'piso_xadrez', 5: 'piso_carpete', 6: 'piso_porcelanato', 7: 'piso_marmore' };

  M.LOT_SIZES = {
    P: { name: 'Pequeno', gw: 22, gh: 16, ow: 16, oh: 12 }, M: { name: 'Médio', gw: 30, gh: 20, ow: 22, oh: 15 },
    G: { name: 'Grande', gw: 38, gh: 24, ow: 30, oh: 20 }, XG: { name: 'Enorme', gw: 46, gh: 28, ow: 38, oh: 24 },
  };

  M.FACADE = {
    color: [
      { name: 'Creme', c: '#e4d5b7', cost: 0, a: 0 }, { name: 'Terracota', c: '#c8553d', cost: 800, a: 2 }, { name: 'Azul-petróleo', c: '#2a6f7f', cost: 800, a: 2 },
      { name: 'Verde-oliva', c: '#6b8f3c', cost: 800, a: 2 }, { name: 'Grafite', c: '#454c5e', cost: 1500, a: 3 }, { name: 'Branco Gelo', c: '#eef1f4', cost: 1500, a: 3 },
      { name: 'Vinho', c: '#7b2d43', cost: 2500, a: 4, lvl: 3 }, { name: 'Dourado', c: '#c9a227', cost: 20000, a: 9, lvl: 7 },
    ],
    sign: [{ name: 'Placa Simples', cost: 0, a: 0 }, { name: 'Letreiro Luminoso', cost: 2500, a: 4, lvl: 2 }, { name: 'Letreiro Neon', cost: 9000, a: 8, lvl: 4 }],
    awning: [{ name: 'Sem Toldo', cost: 0, a: 0 }, { name: 'Toldo Listrado', cost: 1200, a: 3 }, { name: 'Toldo Premium', cost: 4000, a: 5, lvl: 3 }],
  };

  B.newDay = () => ({ sales: 0, cogs: 0, cust: 0, served: 0, items: 0, lost: 0, stockout: 0, pricey: 0, theft: 0, exp: 0, satSum: 0, satN: 0 });

  const pid = (name) => { const p = M.PRODUCTS.find((x) => x.name === name); return p ? p.id : null; };

  B.newStore = function (type, size, name, starter) {
    const L = M.LOT_SIZES[size], n = L.gw * L.gh;
    const s = {
      id: M.S.nextStoreId++, name, type, size, gw: L.gw, gh: L.gh, ownW: starter ? 14 : L.ow, ownH: starter ? 10 : L.oh,
      floor: new Array(n).fill(0), wall: new Array(n).fill(0), objs: [], nid: 1,
      storage: {}, batches: {}, dock: [], emps: [], facade: { color: 0, sign: 0, awning: 0 },
      rating: 70, dirt: [], auto: { order: false, level: 0.35 }, day: B.newDay(), hist: [], rent: starter ? 110 : 0,
      lotId: null, opened: M.S.day, life: { sales: 0, cust: 0 },
    };
    B.shell(s, -1, -1);
    B.refresh(s);
    if (starter) starterTemplate(s); else B.template(s);
    B.refresh(s);
    return s;
  };

  // (re)constrói o perímetro do prédio na área do terreno; preserva portas e o interior
  B.shell = function (s, oldW, oldTop) {
    const top = s.gh - s.ownH, bot = s.gh - M.C.SIDE - 1, right = s.ownW - 1;
    const cnt = {}; let fl = 1, best = 0;
    for (const f of s.floor) if (f) { cnt[f] = (cnt[f] || 0) + 1; if (cnt[f] > best) { best = cnt[f]; fl = f; } }
    const hasObj = (i) => s._objAt && s._objAt[i];
    for (let y = top; y <= bot; y++) for (let x = 0; x <= right; x++) {
      const i = y * s.gw + x, edge = x === 0 || x === right || y === top || y === bot;
      if (!s.floor[i]) s.floor[i] = fl;
      if (edge) { if (s.wall[i] !== 2) s.wall[i] = y === bot && x % 4 === 2 && x > 1 && x < right - 1 ? 3 : 1; }
      else if (oldW >= 0 && ((x === oldW - 1 && y >= oldTop) || (y === oldTop && x <= oldW - 1)) && (s.wall[i] === 1 || s.wall[i] === 3) && !hasObj(i)) s.wall[i] = 0;
    }
    if (!s.wall.includes(2)) s.wall[bot * s.gw + Math.min(4, right - 1)] = 2;
  };

  function put(s, t, x, y, r) {
    const d = M.BUILD[t];
    if (!B.canPlace(s, d, x, y, r || 0)) return null;
    const o = { id: s.nid++, t, x, y, r: r || 0 };
    if (d.slots) { o.slots = []; for (let i = 0; i < d.slots; i++) o.slots.push({ p: null, q: 0 }); }
    s.objs.push(o);
    M.path.rebuild(s);
    return o;
  }
  B.put = put;

  function starterTemplate(s) {
    const t = s.gh - s.ownH;
    put(s, 'estante', 1, t + 1, 0);
    const sh = [put(s, 'prateleira', 4, t + 1, 0), put(s, 'prateleira', 7, t + 1, 0), put(s, 'prateleira', 10, t + 1, 0)];
    put(s, 'caixa', 8, t + 4, 0);
    put(s, 'planta', 12, t + 6, 0);
    put(s, 'lixeira', 1, t + 6, 0);
    const init = [
      ['Arroz 5kg', 'Feijão 1kg', 'Macarrão', 'Café 500g'],
      ['Refrigerante Cola 2L', 'Água Mineral 500ml', 'Suco de Laranja 1L', 'Refrigerante Lata'],
      ['Chocolate ao Leite', 'Biscoito Recheado', 'Pão de Forma', 'Leite 1L'],
    ];
    init.forEach((names, k) => names.forEach((nm, i) => {
      const p = pid(nm), o = sh[k]; if (!p || !o) return;
      o.slots[i].p = p; o.slots[i].q = 9;
      M.inv.addStorage(s, p, 9 + 8); // 9 já estão na prateleira (lotes cobrem depósito + prateleiras)
      M.inv.removeStorage(s, p, 9, true);
    }));
  }

  B.template = function (s) {
    const top = s.gh - s.ownH, bot = s.gh - M.C.SIDE - 1, W = s.ownW;
    const doorY = bot;
    // portas
    for (let i = 0; i < s.gw * s.gh; i++) if (s.wall[i] === 2) s.wall[i] = 1;
    const doors = W >= 30 ? [Math.floor(W / 2) - 1, Math.floor(W / 2)] : [Math.floor(W / 2)];
    for (const dx of doors) s.wall[doorY * s.gw + dx] = 2;
    M.path.rebuild(s);
    if (s.type === 'cd') {
      for (let y = top + 2; y < bot - 3; y += 2) for (let x = 2; x + 1 < W - 2; x += 3) put(s, 'estante', x, y, 0);
      return;
    }
    const T = M.STORE_TYPES[s.type], fx = T.fixt;
    let k = 0, placed = 0;
    for (let y = top + 3; y < bot - 6; y += 3) for (let x = 5; x + 2 < W - 2; x += 4) {
      const t = fx[k % fx.length]; k++;
      if (k % 3 === 0) continue; // parte dos espaços fica livre para o jogador montar
      if (put(s, t, x, y, 0)) placed++;
    }
    const nc = Math.max(1, Math.floor(W / 10));
    for (let i = 0; i < nc; i++) put(s, 'caixa', 4 + i * 3, bot - 4, 1);
    for (let i = 0; i < Math.max(2, Math.floor((s.ownH - M.C.SIDE - 6) / 2)); i++) put(s, 'estante', 1, top + 1 + i * 2, 1);
    put(s, 'planta', W - 2, bot - 1, 0); put(s, 'planta', 1, bot - 1, 0);
  };

  B.inOwned = (s, x, y) => x >= 0 && x < s.ownW && y >= s.gh - s.ownH && y < s.gh - M.C.SIDE;

  B.canPlace = function (s, d, x, y, r, ignore) {
    const w = r % 2 ? d.h : d.w, h = r % 2 ? d.w : d.h;
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      const cx = x + xx, cy = y + yy;
      const curb = d.out && cy === s.gh - 1 && cx >= 0 && cx < s.ownW;
      if (!B.inOwned(s, cx, cy) && !curb) return false;
      const i = cy * s.gw + cx;
      if (s.wall[i]) return false;
      if (!d.out && !s.floor[i]) return false;
      if (curb && s._doors && s._doors.some((di) => Math.abs((di % s.gw) - cx) <= 1)) return false;
      const k = s._objAt ? s._objAt[i] : 0;
      if (k && s.objs[k - 1] !== ignore) return false;
    }
    return true;
  };

  B.objAt = function (s, x, y) {
    if (x < 0 || y < 0 || x >= s.gw || y >= s.gh || !s._objAt) return null;
    const k = s._objAt[y * s.gw + x];
    return k ? s.objs[k - 1] : null;
  };

  // geometria do caixa: onde fica o operador, o cliente e a fila
  B.spots = function (s, o) {
    if (o._sp && o._spv === s._ver) return o._sp;
    const D = M.C.DIRS, f = D[o.r], a = D[(o.r + 1) % 4], d = M.BUILD[o.t];
    let ex = o.x, ey = o.y;
    if (d.w * d.h > 1) { // extremidade oposta ao sentido da fila
      const fp = M.path.footprint(o), x2 = o.x + fp[0] - 1, y2 = o.y + fp[1] - 1;
      if (-(x2 * a[0] + y2 * a[1]) > -(o.x * a[0] + o.y * a[1])) { ex = x2; ey = y2; }
    }
    const pay = [ex + f[0], ey + f[1]], cashier = [ex - f[0], ey - f[1]], queue = [];
    let qx = pay[0], qy = pay[1];
    for (let i = 0; i < 9; i++) {
      if (qx < 0 || qy < 0 || qx >= s.gw || qy >= s.gh || !s._walk[qy * s.gw + qx]) break;
      queue.push([qx + 0.5, qy + 0.5]); qx += a[0]; qy += a[1];
    }
    if (!queue.length) queue.push([pay[0] + 0.5, pay[1] + 0.5]);
    o._sp = { pay, cashier, queue }; o._spv = s._ver;
    return o._sp;
  };

  // recalcula caches derivados após qualquer alteração
  B.refresh = function (s) {
    M.path.rebuild(s);
    const g = { decor: 0, sec: 0, basket: 0, clean: 0, service: 0, income: 0, traffic: 0, maint: 0, slots: 0, checkouts: 0, selfs: 0, racks: 0, objs: s.objs.length };
    for (const o of s.objs) {
      const d = M.BUILD[o.t];
      g.decor += d.appeal || 0; g.sec += d.sec || 0; g.basket += d.basket || 0; g.clean += d.clean || 0; g.service += d.service || 0;
      g.income += d.income || 0; g.traffic += d.traffic || 0; g.maint += (d.maint || 0) + d.cost * 0.0015;
      if (d.slots) g.slots += d.slots;
      if (d.kind === 'checkout') g.checkouts++; if (d.kind === 'self') g.selfs++; if (d.kind === 'storage') g.racks++;
    }
    let fq = 0, fn = 0;
    for (let i = 0; i < s.floor.length; i++) if (s.floor[i]) { fn++; fq += M.BUILD[M.FLOORS[s.floor[i]]].q; }
    const F = M.FACADE, fa = F.color[s.facade.color].a + F.sign[s.facade.sign].a + F.awning[s.facade.awning].a;
    g.floorN = fn;
    g.baseAppeal = 18 + (fn ? (fq / fn) * 8 : 0) + (g.decor * 18) / Math.sqrt(Math.max(40, fn)) + fa + s._windows.length * 0.6;
    s._agg = g; s._floorDirty = true;
  };
  B.appeal = (s) => U.clamp((s._agg ? s._agg.baseAppeal : 20) - Math.min(15, s.dirt.length) * 0.9, 0, 100);

  // ---------- ampliação do terreno ----------
  B.expandInfo = function (s) {
    const L = M.LOT_SIZES[s.size];
    if (s.ownW >= L.gw && s.ownH >= L.gh) return null;
    const nw = Math.min(L.gw, s.ownW + 4), nh = Math.min(L.gh, s.ownH + 3);
    const cost = Math.round(((nw * nh - s.ownW * s.ownH) * 55) / 50) * 50;
    return { nw, nh, cost };
  };
  B.expand = function (s) {
    const e = B.expandInfo(s); if (!e) return false;
    if (!M.eco.spend(e.cost, 'construcao', s.id)) return false;
    const oldW = s.ownW, oldTop = s.gh - s.ownH;
    s.ownW = e.nw; s.ownH = e.nh;
    B.shell(s, oldW, oldTop);
    B.refresh(s);
    M.audio.sfx('build'); M.bus.emit('build', { store: s, what: 'expand' });
    M.notify(s.name + ' foi ampliada para ' + e.nw + '×' + (e.nh - M.C.SIDE) + '.', 'good');
    return true;
  };

  // ---------- modo construção ----------
  const st = (B.st = { on: false, tool: null, rot: 0, hx: 0, hy: 0, drag: null, pending: null, moving: null });

  B.enter = function (tool) { st.on = true; st.tool = tool || st.tool; st.pending = null; st.drag = null; st.moving = null; M.bus.emit('ui'); };
  B.exit = function () { st.on = false; st.tool = null; st.pending = null; st.drag = null; st.moving = null; M.bus.emit('ui'); };
  B.setTool = function (t) { st.tool = t; st.pending = null; st.drag = null; st.moving = null; M.bus.emit('ui'); };
  B.rotate = function () { st.rot = (st.rot + 1) % 4; if (st.pending && (st.pending.type === 'obj' || st.pending.type === 'move')) { const p = st.pending; const d = M.BUILD[p.t]; if (B.canPlace(M.game.store(), d, p.x, p.y, st.rot, p.obj)) p.r = st.rot; } M.audio.sfx('click'); };

  function rectCells(s, x0, y0, x1, y1, outline) {
    const ax = Math.min(x0, x1), bx = Math.max(x0, x1), ay = Math.min(y0, y1), by = Math.max(y0, y1), out = [];
    for (let y = ay; y <= by; y++) for (let x = ax; x <= bx; x++) {
      if (outline && x !== ax && x !== bx && y !== ay && y !== by) continue;
      if (B.inOwned(s, x, y)) out.push(y * s.gw + x);
    }
    return out;
  }

  // células afetadas pela ferramenta atual durante o arraste
  B.dragCells = function (s) {
    const d = st.drag; if (!d) return [];
    const def = M.BUILD[st.tool];
    if (st.tool === 'demolir') return rectCells(s, d.x0, d.y0, d.x1, d.y1, false);
    if (!def) return [];
    if (def.kind === 'wall') return rectCells(s, d.x0, d.y0, d.x1, d.y1, true).filter((i) => s.wall[i] !== 1 && !s._objAt[i]);
    if (def.kind === 'floor') return rectCells(s, d.x0, d.y0, d.x1, d.y1, false).filter((i) => s.floor[i] !== def.fl);
    if (def.kind === 'door' || def.kind === 'window') { const i = d.y1 * s.gw + d.x1; return B.inOwned(s, d.x1, d.y1) && !s._objAt[i] && s.wall[i] !== (def.kind === 'door' ? 2 : 3) ? [i] : []; }
    return [];
  };

  B.down = function (x, y) {
    if (st.pending) return;
    const s = M.game.store(), def = M.BUILD[st.tool];
    if (st.tool === 'mover') {
      if (!st.moving) { const o = B.objAt(s, x, y); if (o) { st.moving = o; st.rot = o.r; M.audio.sfx('click'); } return; }
      const d = M.BUILD[st.moving.t];
      if (B.canPlace(s, d, x, y, st.rot, st.moving)) st.pending = { type: 'move', obj: st.moving, t: st.moving.t, x, y, r: st.rot, cost: 0 };
      else M.audio.sfx('error');
      M.bus.emit('ui'); return;
    }
    if (st.tool === 'demolir' || (def && def.kind !== 'fixture' && def.kind !== 'checkout' && def.kind !== 'self' && def.kind !== 'storage' && def.kind !== 'decor')) { st.drag = { x0: x, y0: y, x1: x, y1: y }; return; }
    if (def) {
      if (B.canPlace(s, def, x, y, st.rot)) { st.pending = { type: 'obj', t: st.tool, x, y, r: st.rot, cost: def.cost }; M.audio.sfx('click'); }
      else { M.audio.sfx('error'); M.toast(reason(s, def, x, y), 'bad'); }
      M.bus.emit('ui');
    }
  };
  function reason(s, d, x, y) {
    if (!B.inOwned(s, x, y)) return 'Fora da área do seu terreno.';
    if (!d.out && !s.floor[y * s.gw + x]) return 'Coloque um piso antes.';
    return 'Espaço ocupado.';
  }
  B.move = function (x, y) { st.hx = x; st.hy = y; if (st.drag) { st.drag.x1 = x; st.drag.y1 = y; } };
  B.up = function () {
    if (!st.drag) return;
    const s = M.game.store(), cells = B.dragCells(s);
    st.drag = null;
    if (st.tool === 'demolir') {
      const objs = [], walls = [], floors = [];
      for (const i of cells) {
        const k = s._objAt[i]; if (k && !objs.includes(s.objs[k - 1])) objs.push(s.objs[k - 1]);
        if (s.wall[i]) walls.push(i);
      }
      if (!objs.length && !walls.length) for (const i of cells) if (s.floor[i]) floors.push(i);
      if (!objs.length && !walls.length && !floors.length) return;
      let refund = 0; for (const o of objs) refund += M.BUILD[o.t].cost * 0.5;
      st.pending = { type: 'demolish', objs, walls, floors, cost: -refund, cells: floors.length ? floors : walls };
    } else {
      if (!cells.length) return;
      const def = M.BUILD[st.tool];
      st.pending = { type: 'cells', tool: st.tool, cells, cost: cells.length * def.cost };
    }
    M.audio.sfx('click'); M.bus.emit('ui');
  };
  B.cancel = function () { if (st.pending || st.moving || st.drag) { st.pending = null; st.moving = null; st.drag = null; M.bus.emit('ui'); return true; } return false; };

  B.confirm = function () {
    const p = st.pending, s = M.game.store(); if (!p) return;
    if (p.cost > 0 && !M.eco.spend(p.cost, 'construcao', s.id)) { M.toast('Dinheiro insuficiente para esta obra.', 'bad'); M.audio.sfx('error'); return; }
    const fx = [];
    if (p.type === 'cells') {
      const def = M.BUILD[p.tool];
      for (const i of p.cells) {
        if (def.kind === 'wall') s.wall[i] = 1; else if (def.kind === 'door') s.wall[i] = 2; else if (def.kind === 'window') s.wall[i] = 3; else if (def.kind === 'floor') s.floor[i] = def.fl;
        if (def.kind !== 'floor' && !s.floor[i]) s.floor[i] = 2;
        fx.push([(i % s.gw) + 0.5, ((i / s.gw) | 0) + 0.5]);
      }
    } else if (p.type === 'obj') {
      const d = M.BUILD[p.t];
      if (!B.canPlace(s, d, p.x, p.y, p.r)) { M.eco.refund(p.cost, 'construcao', s.id); st.pending = null; return; }
      const o = { id: s.nid++, t: p.t, x: p.x, y: p.y, r: p.r, _b: M.R.time };
      if (d.slots) { o.slots = []; for (let i = 0; i < d.slots; i++) o.slots.push({ p: null, q: 0 }); }
      s.objs.push(o);
      const f = p.r % 2 ? [d.h, d.w] : [d.w, d.h];
      fx.push([p.x + f[0] / 2, p.y + f[1] / 2]);
    } else if (p.type === 'move') {
      p.obj.x = p.x; p.obj.y = p.y; p.obj.r = p.r; p.obj._b = M.R.time;
      fx.push([p.x + 0.5, p.y + 0.5]); st.moving = null;
    } else if (p.type === 'demolish') {
      for (const o of p.objs) {
        if (o.slots) for (const sl of o.slots) if (sl.p && sl.q) s.storage[sl.p] = (s.storage[sl.p] || 0) + sl.q;
        const k = s.objs.indexOf(o); if (k >= 0) s.objs.splice(k, 1);
        fx.push([o.x + 0.5, o.y + 0.5]);
      }
      for (const i of p.walls) { s.wall[i] = 0; fx.push([(i % s.gw) + 0.5, ((i / s.gw) | 0) + 0.5]); }
      for (const i of p.floors) s.floor[i] = 0;
      if (p.cost < 0) M.eco.refund(-p.cost, 'construcao', s.id);
    }
    st.pending = null;
    B.refresh(s);
    if (M.fx) for (const f of fx.slice(0, 40)) M.fx.dust(s, f[0], f[1]);
    M.audio.sfx(p.type === 'demolish' ? 'demolish' : 'build');
    M.bus.emit('build', { store: s, what: p.type, tool: p.tool || p.t });
    M.bus.emit('ui');
  };

  // fachada
  B.setFacade = function (s, key, idx) {
    const opt = M.FACADE[key][idx]; if (!opt || s.facade[key] === idx) return;
    if ((opt.lvl || 1) > M.S.level) { M.toast('Disponível no nível ' + opt.lvl + '.', 'bad'); return; }
    if (!M.eco.spend(opt.cost, 'construcao', s.id)) { M.toast('Dinheiro insuficiente.', 'bad'); return; }
    s.facade[key] = idx; B.refresh(s); M.audio.sfx('build'); M.bus.emit('build', { store: s, what: 'facade' }); M.bus.emit('ui');
  };
})();
