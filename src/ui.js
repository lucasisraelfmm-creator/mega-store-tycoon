/* Interface: HUD, barra de ferramentas, notificações, painéis, modais, menu principal, pausa,
   barra de construção, dicas de contexto. Os conteúdos dos painéis ficam em panels.js. */
(function () {
  'use strict';
  const M = window.MST, U = M.U;
  const UI = (M.ui = { A: {}, panels: {} });
  const $ = (s, r) => (r || document).querySelector(s);
  UI.$ = $;

  const IC = {
    loja: '<path d="M3 9l1.6-5h14.8L21 9M4 9v11h16V9M3 9h18M9.5 20v-6h5v6"/>',
    mapa: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>',
    construir: '<path d="M15 4l5 5-3 3-5-5zM12 7l-8.5 8.5a2 2 0 002.8 2.8L15 10"/>',
    catalogo: '<path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="7.5" r="1.4"/>',
    estoque: '<path d="M3 7.5l9-4.5 9 4.5v9L12 21l-9-4.5v-9zM3 7.5l9 4.5 9-4.5M12 12v9"/>',
    fornecedores: '<path d="M2 6h12v10H2zM14 9.5h4l3 3.5v3h-7M6 19.5a2 2 0 100-4 2 2 0 000 4zM17 19.5a2 2 0 100-4 2 2 0 000 4z"/>',
    equipe: '<circle cx="9" cy="8" r="3.4"/><path d="M2.6 20c0-3.6 2.9-6 6.4-6s6.4 2.4 6.4 6M15.8 4.6a3.4 3.4 0 010 6.8M18 14.2c2 .6 3.4 2.6 3.4 5.8"/>',
    financas: '<path d="M3 3v18h18M7 15l4-4 3 3 6-7"/>',
    empresa: '<path d="M4 21V3h10v18M14 8h6v13M7.5 7h3M7.5 11h3M7.5 15h3M17 12h.5M17 16h.5M2 21h20"/>',
    missoes: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.3"/>',
    pause: '<path d="M8 5v14M16 5v14"/>', play: '<path d="M7 4.5l12.5 7.5L7 19.5z"/>', ff: '<path d="M3.5 5.5l8 6.5-8 6.5zM12.5 5.5l8 6.5-8 6.5z"/>', fff: '<path d="M2 6l6 6-6 6zM9 6l6 6-6 6zM16 6l6 6-6 6z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', bell: '<path d="M6 9.5a6 6 0 0112 0c0 6.5 3 8 3 8H3s3-1.5 3-8M10 21h4"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
    rotate: '<path d="M20 12a8 8 0 11-2.3-5.7M20 4v5h-5"/>', move: '<path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    paint: '<path d="M4 4h13v6H4zM17 7h3v6h-8v3M11 16h2v5h-2z"/>', check: '<path d="M5 12.5l4.5 4.5L19.5 7"/>', plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
    gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
    save: '<path d="M5 3h11l3 3v15H5zM8 3v5h7V3M8 14h8v7H8z"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    hand: '<path d="M8 13V5.5a1.5 1.5 0 013 0V11M11 10V4.5a1.5 1.5 0 013 0V11M14 10.5V6a1.5 1.5 0 013 0v8c0 4-2.5 7-6.5 7S5 18 4.5 15l-1-3.5a1.5 1.5 0 012.8-1L8 13"/>',
    cart: '<path d="M3 4h2.5l2.2 11h11l2-8H6.3M9.5 20a1.4 1.4 0 100-2.8 1.4 1.4 0 000 2.8zM17.5 20a1.4 1.4 0 100-2.8 1.4 1.4 0 000 2.8z"/>',
    door: '<path d="M6 21V3h12v18M3 21h18M14.5 12.5v.5"/>', wall: '<path d="M3 5h18v14H3zM3 9.5h18M3 14.5h18M9 5v4.5M15 5v4.5M6 9.5v5M12 9.5v5M18 9.5v5M9 14.5V19M15 14.5V19"/>',
    window: '<path d="M4 4h16v16H4zM12 4v16M4 12h16"/>', floor: '<path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18"/>', flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    calendar: '<path d="M4 5h16v16H4zM4 9.5h16M8 3v4M16 3v4"/>', trophy: '<path d="M8 4h8v5a4 4 0 01-8 0zM8 6H4.5v1.5A3.5 3.5 0 008 11M16 6h3.5v1.5A3.5 3.5 0 0116 11M12 13v4M8 21h8M9.5 17h5"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-1 .7-1.5 1.2-1.5 2.5M12 17v.5"/>', exit: '<path d="M14 4h6v16h-6M10 8l-4 4 4 4M6 12h10"/>',
    pkg: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM8 5.2l8 4.6"/>', search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>', bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>',
  };
  UI.icon = (n, cls) => '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (IC[n] || IC.info) + '</svg>';
  const ic = UI.icon;

  // ---------- notificações ----------
  M.R.notes = [];
  M.notify = function (msg, type) {
    M.R.notes.unshift({ msg, type: type || 'info', day: M.S ? M.S.day : 0, time: M.S ? M.S.minute : 0 });
    if (M.R.notes.length > 80) M.R.notes.pop();
    M.R.unread = (M.R.unread || 0) + 1;
    UI.toast(msg, type);
    if (type === 'warn' || type === 'event') M.audio.sfx('notify');
  };
  M.toast = (msg, type) => UI.toast(msg, type);
  UI.toast = function (msg, type) {
    const box = $('#toasts'); if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast t-' + (type || 'info');
    el.innerHTML = '<span class="dot"></span><span>' + U.esc(msg) + '</span>';
    box.prepend(el);
    while (box.children.length > 3) box.lastChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, type === 'bad' ? 4200 : 5200);
  };

  UI.typing = () => { const a = document.activeElement; return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT'); };

  // ---------- esqueleto ----------
  UI.init = function () {
    const app = $('#app');
    app.insertAdjacentHTML('beforeend',
      '<header id="top" hidden></header>' +
      '<aside id="tracker" hidden></aside>' +
      '<nav id="dock" hidden></nav>' +
      '<div id="buildbar" hidden></div>' +
      '<div id="confirm" hidden></div>' +
      '<div id="toasts" aria-live="polite"></div>' +
      '<section id="panel" hidden><div class="pwin"></div></section>' +
      '<div id="modal" hidden><div class="mwin"></div></div>' +
      '<div id="tut" hidden></div>' +
      '<div id="tip" hidden></div>' +
      '<div id="menu" hidden></div>');
    document.addEventListener('click', onClick);
    document.addEventListener('change', onChange);
    document.addEventListener('input', onInput);
    document.addEventListener('mouseover', (e) => { const b = e.target.closest && e.target.closest('button,.card-btn'); if (b && !b.disabled && b !== UI._lastHover) { UI._lastHover = b; M.audio.sfx('hover'); } });
    M.bus.on('ui', () => UI.dirty());
    M.bus.on('dayEnd', (rep) => { if (M.settings.skipReport && !rep.bankrupt) { M.R.report = null; M.toast('Dia ' + rep.day + ' encerrado: lucro de ' + U.money0(rep.profit) + '.', rep.profit >= 0 ? 'good' : 'bad'); return; } UI.showReport(rep); });
    M.bus.on('levelup', (d) => UI.showLevelUp(d));
    M.bus.on('gameOver', () => UI.showGameOver());
    M.bus.on('build', () => UI.dirty());
    setInterval(() => UI.refresh(), 250);
    setInterval(() => { if (M.R.panel && !UI.typing() && !UI._hold) UI.renderPanel(true); }, 1200);
  };

  let dirtyF = false;
  UI.dirty = () => { dirtyF = true; };
  UI.refresh = function () {
    if (M.R.view === 'menu' || !M.S) return;
    if (dirtyF) { dirtyF = false; UI.renderTop(); UI.renderDock(); UI.renderBuild(); }
    UI.updateTop(); UI.renderTracker(); UI.renderConfirm();
  };

  function onClick(e) {
    const t = e.target.closest('[data-a]');
    if (!t || t.disabled) return;
    const fn = UI.A[t.dataset.a];
    if (!fn) return;
    e.preventDefault();
    M.audio.init();
    if (!t.dataset.silent) M.audio.sfx('click');
    try { fn(t, t.dataset, e); } catch (err) { console.error('Ação ' + t.dataset.a, err); M.toast('Algo deu errado: ' + err.message, 'bad'); }
  }
  function onChange(e) {
    const t = e.target.closest('[data-ch]'); if (!t) return;
    const fn = UI.A[t.dataset.ch]; if (fn) try { fn(t, t.dataset, e); } catch (err) { console.error(err); }
  }
  function onInput(e) {
    const t = e.target.closest('[data-in]'); if (!t) return;
    const fn = UI.A[t.dataset.in]; if (fn) try { fn(t, t.dataset, e); } catch (err) { console.error(err); }
  }

  // ---------- HUD ----------
  UI.showHUD = function (on) {
    for (const id of ['#top', '#dock', '#tracker']) $(id).hidden = !on;
    $('#menu').hidden = on;
    if (on) { UI.renderTop(); UI.renderDock(); }
  };
  UI.renderTop = function () {
    const S = M.S, L = M.LEVELS[S.level - 1], N = M.LEVELS[S.level];
    const s = M.game.store();
    const opts = S.stores.map((x) => '<option value="' + x.id + '"' + (x.id === S.curId ? ' selected' : '') + '>' + U.esc(x.name) + '</option>').join('');
    $('#top').innerHTML =
      '<div class="brand"><div class="mark" style="--b:' + S.brand + '">' + U.esc(S.name.charAt(0).toUpperCase()) + '</div>' +
      '<div class="bt"><b>' + U.esc(S.name) + '</b><span class="lvl" data-a="open" data-p="missoes" data-tab="progressao">Nv ' + S.level + ' · ' + L.name + '</span>' +
      '<div class="xp" title="Experiência"><i id="xpbar"></i></div></div></div>' +
      '<label class="storesel" title="Estabelecimento atual">' + ic('loja') + '<select data-ch="pickStore" id="storePick">' + opts + '</select></label>' +
      '<div class="cash" data-a="open" data-p="financas"><span class="lab">Saldo</span><b id="hudMoney"></b><span id="hudProfit" class="sub"></span></div>' +
      '<div class="clock"><div class="ct"><b id="hudTime"></b><span id="hudDate"></span></div><div class="dayp"><i id="hudDayBar"></i></div>' +
      '<div class="speed">' + [0, 1, 2, 4].map((v) => '<button data-a="speed" data-v="' + v + '" class="' + (S.speed === v ? 'on' : '') + '" title="' + (v ? 'Velocidade ' + v + 'x' : 'Pausar tempo (Espaço)') + '">' + ic(v === 0 ? 'pause' : v === 1 ? 'play' : v === 2 ? 'ff' : 'fff') + '</button>').join('') + '</div></div>' +
      '<div class="rate" title="Avaliação da loja"><span id="hudStars"></span><small id="hudRating"></small></div>' +
      '<div class="tbtns"><button data-a="open" data-p="notificacoes" title="Notificações" class="bell">' + ic('bell') + '<em id="hudUnread"></em></button>' +
      '<button data-a="pause" title="Menu (Esc)">' + ic('menu') + '</button></div>';
    void s; void N;
    UI.updateTop();
  };
  UI.updateTop = function () {
    const S = M.S, s = M.game.store(); if (!s || !$('#hudMoney')) return;
    const N = M.LEVELS[S.level], L = M.LEVELS[S.level - 1];
    $('#hudMoney').textContent = U.money(S.money);
    $('#hudMoney').classList.toggle('neg', S.money < 0);
    const t = M.eco.totals(S.today), p = t.inc - t.exp - (S.today.inc.emprestimos || 0);
    $('#hudProfit').textContent = 'Hoje ' + (p >= 0 ? '+' : '') + U.money0(p);
    $('#hudProfit').className = 'sub ' + (p >= 0 ? 'pos' : 'neg');
    $('#hudTime').textContent = U.time(S.minute);
    $('#hudDate').textContent = 'Dia ' + S.day + ' · ' + U.date(S.day);
    $('#hudDayBar').style.width = ((S.minute - M.C.DAY_START) / M.C.DAY_LEN * 100).toFixed(1) + '%';
    $('#hudStars').textContent = U.stars(s.rating);
    $('#hudRating').textContent = Math.round(s.rating) + '%';
    $('#xpbar').style.width = (N ? U.clamp((S.xp - L.xp) / (N.xp - L.xp), 0, 1) * 100 : 100) + '%';
    const un = $('#hudUnread'); un.textContent = M.R.unread ? Math.min(99, M.R.unread) : ''; un.hidden = !M.R.unread;
  };

  const DOCK = [
    ['view', 'loja', 'Loja', 'L'], ['map', 'mapa', 'Mapa', 'M'], ['build', 'construir', 'Construir', 'B'], ['catalogo', 'catalogo', 'Catálogo', 'C'],
    ['estoque', 'estoque', 'Estoque', 'I'], ['fornecedores', 'fornecedores', 'Fornecedores', 'F'], ['funcionarios', 'equipe', 'Equipe', 'H'],
    ['financas', 'financas', 'Finanças', 'G'], ['empresa', 'empresa', 'Empresa', 'K'], ['missoes', 'missoes', 'Missões', 'J'],
  ];
  UI.renderDock = function () {
    const p = M.R.panel && M.R.panel.name;
    $('#dock').innerHTML = DOCK.map((d) => {
      let on = false;
      if (d[0] === 'view') on = M.R.view === 'store' && !M.build.st.on;
      else if (d[0] === 'map') on = M.R.view === 'world';
      else if (d[0] === 'build') on = M.build.st.on;
      else on = p === d[0];
      return '<button class="db' + (on ? ' on' : '') + '" data-a="dock" data-k="' + d[0] + '" id="dock-' + d[0] + '" title="' + d[2] + ' (' + d[3] + ')">' + ic(d[1]) + '<span>' + d[2] + '</span></button>';
    }).join('');
  };
  UI.A.dock = function (el, d) {
    const k = d.k;
    if (k === 'view') { UI.close(); M.build.exit(); M.game.setView('store'); }
    else if (k === 'map') { UI.close(); M.game.setView(M.R.view === 'world' ? 'store' : 'world'); }
    else if (k === 'build') { UI.close(); if (M.build.st.on) M.build.exit(); else { M.game.setView('store'); M.build.enter(M.build.st.tool || 'prateleira'); } }
    else { if (M.R.panel && M.R.panel.name === k) UI.close(); else UI.open(k); }
    UI.dirty();
  };
  UI.A.speed = (el, d) => M.game.setSpeed(+d.v);
  UI.A.pickStore = (el) => { M.game.setStore(+el.value); M.game.setView('store'); el.blur(); };
  UI.A.open = (el, d) => UI.open(d.p, d.tab ? { tab: d.tab } : null);
  UI.A.close = () => UI.close();

  UI.renderTracker = function () {
    const S = M.S; if (!S || $('#tracker').hidden) return;
    const ms = S.missions.daily.concat(S.missions.event || []).filter((m) => !m.failed).slice(0, 4);
    let h = '<div class="trk-h" data-a="open" data-p="missoes">' + ic('missoes') + ' Missões de hoje</div>';
    for (const m of ms) {
      const pr = M.missions.progress(m), k = U.clamp(pr / m.target, 0, 1);
      h += '<div class="trk' + (m.done ? ' done' : '') + (m.scope === 'e' ? ' ev' : '') + '"><span>' + U.esc(m.txt) + '</span><div class="bar"><i style="width:' + (k * 100).toFixed(0) + '%"></i></div></div>';
    }
    const ev = S.events.active;
    if (ev.length) h += '<div class="trk-ev">' + ev.map((e) => '<span>' + ic('calendar') + U.esc(e.name) + '</span>').join('') + '</div>';
    const s = M.game.store();
    if (s && M.stores.isRetail(s)) {
      const warn = [];
      if (!M.cust.checkouts(s).some((o) => M.cust.operator(s, o))) warn.push('Nenhum caixa em operação');
      if (M.inv.dockQty(s)) warn.push(M.inv.dockQty(s) + ' itens na doca');
      const empty = s.objs.reduce((n, o) => n + (o.slots ? o.slots.filter((sl) => sl.p && sl.q === 0).length : 0), 0);
      if (empty) warn.push(empty + ' espaços vazios nas prateleiras');
      if (!M.stores.isOpenNow(s)) warn.push('Loja em obras');
      if (warn.length) h += '<div class="trk-warn">' + warn.map((w) => '<span>' + ic('info') + w + '</span>').join('') + '</div>';
    }
    if ($('#tracker')._h !== h) { $('#tracker').innerHTML = h; $('#tracker')._h = h; }
  };

  // ---------- painéis ----------
  UI.open = function (name, opts) {
    const P = UI.panels[name]; if (!P) return;
    if (M.build.st.on && name !== 'obj') M.build.exit();
    M.R.panel = { name, tab: (opts && opts.tab) || (P.tabs ? P.tabs[0][0] : null), opts: opts || {} };
    M.audio.sfx('open');
    UI.renderPanel(); UI.dirty();
    M.bus.emit('panel', name);
  };
  UI.close = function () {
    if (!M.R.panel) return;
    M.R.panel = null; $('#panel').hidden = true; M.audio.sfx('close'); UI.dirty();
  };
  UI.A.tab = (el, d) => { M.R.panel.tab = d.t; UI.renderPanel(); };
  UI.renderPanel = function (soft) {
    const st = M.R.panel, root = $('#panel');
    if (!st) { root.hidden = true; return; }
    const P = UI.panels[st.name];
    if (soft && P.live === false) return;
    let body;
    try { body = P.render(st.opts, st.tab); } catch (e) { console.error(e); body = '<p class="empty">Não foi possível exibir este painel.</p>'; }
    if (body == null) { UI.close(); return; }
    const win = root.firstChild;
    const prevBody = win.querySelector('.pbody'), scroll = prevBody ? prevBody.scrollTop : 0;
    const tabs = P.tabs ? '<div class="tabs">' + P.tabs.filter((t) => !t[2] || t[2]()).map((t) => '<button data-a="tab" data-t="' + t[0] + '" class="' + (st.tab === t[0] ? 'on' : '') + '">' + t[1] + '</button>').join('') + '</div>' : '';
    const title = typeof P.title === 'function' ? P.title(st.opts) : P.title;
    const html = '<div class="phead"><div class="pt">' + ic(P.icon || 'info') + '<h2>' + title + '</h2></div>' + tabs + '<button class="x" data-a="close" title="Fechar (Esc)">' + ic('close') + '</button></div><div class="pbody">' + body + '</div>';
    if (soft && win._html === html) return;
    win._html = html;
    win.innerHTML = html;
    root.className = P.wide ? 'wide' : P.narrow ? 'narrow' : '';
    root.hidden = false;
    const nb = win.querySelector('.pbody'); if (soft) nb.scrollTop = scroll;
    if (P.after) try { P.after(win, st.opts, st.tab); } catch (e) { console.error(e); }
  };
  // evita re-render enquanto o mouse está sobre um menu suspenso
  document.addEventListener('mousedown', (e) => { if (e.target.closest && e.target.closest('#panel select')) { UI._hold = true; setTimeout(() => (UI._hold = false), 4000); } });

  // ---------- modais ----------
  UI.modal = function (html, cls) {
    const m = $('#modal'); m.firstChild.innerHTML = html; m.className = cls || ''; m.hidden = false; M.R.modal = true;
  };
  UI.closeModal = function () { $('#modal').hidden = true; M.R.modal = false; };
  UI.A.closeModal = () => UI.closeModal();

  UI.showReport = function (rep) {
    const row = (k, v, cls) => '<div class="rr ' + (cls || '') + '"><span>' + k + '</span><b>' + v + '</b></div>';
    let st = '';
    for (const r of rep.stores) {
      st += '<div class="rcard"><h4>' + U.esc(r.name) + '<small>' + U.stars(r.rating) + '</small></h4>' +
        row('Faturamento', U.money(r.sales)) + row('Custo das mercadorias', '−' + U.money(r.cogs)) + row('Salários', '−' + U.money(r.sal)) + row('Aluguel e manutenção', '−' + U.money(r.rent + r.maint)) + row('Impostos (6%)', '−' + U.money(r.tax)) +
        (r.serv ? row('Serviços (café etc.)', U.money(r.serv)) : '') + row('Resultado operacional', U.money(r.profit), r.profit >= 0 ? 'pos' : 'neg') + (r.buys || r.invest ? '<div class="rnote">Fora do resultado: compras de estoque ' + U.money(r.buys) + (r.invest ? ' · investimentos ' + U.money(r.invest) : '') + '</div>' : '') +
        '<div class="rgrid"><span><b>' + r.cust + '</b>clientes</span><span><b>' + r.served + '</b>compraram</span><span><b>' + Math.round(r.sat) + '%</b>satisfação</span><span><b>' + r.items + '</b>itens</span>' + (r.deliv ? '<span><b>' + r.deliv + '</b>deliveries</span>' : '') + '<span><b>' + r.stockout + '</b>faltas</span></div>';
      if (r.top.length) st += '<div class="rtop">' + r.top.map((t) => '<span title="' + U.esc(M.P[t.p].name) + '">' + M.sprites.icon(t.p, 26) + '<b>' + t.q + '</b></span>').join('') + '</div>';
      if (r.miss.length) st += '<div class="rmiss">Prateleiras vazias para: ' + r.miss.map((t) => U.esc(M.P[t.p].name) + ' (' + t.q + ')').join(', ') + '</div>';
      if (r.tips.length) st += '<ul class="rtips">' + r.tips.map((t) => '<li>' + U.esc(t) + '</li>').join('') + '</ul>';
      st += '</div>';
    }
    const ms = rep.missions.map((m) => '<li class="' + (m.done ? 'ok' : '') + '">' + ic(m.done ? 'check' : 'close') + U.esc(m.txt) + '</li>').join('');
    UI.modal('<div class="receipt"><div class="rh"><span class="eyebrow">Fechamento do caixa</span><h2>Dia ' + rep.day + '</h2><small>' + rep.date + '</small></div>' +
      '<div class="rsum"><div><span>Receitas</span><b>' + U.money(rep.inc) + '</b></div><div><span>Despesas</span><b>' + U.money(rep.exp) + '</b></div><div class="' + (rep.profit >= 0 ? 'pos' : 'neg') + '"><span>Fluxo de caixa</span><b>' + U.money(rep.profit) + '</b></div><div><span>Saldo</span><b>' + U.money(rep.money) + '</b></div></div>' +
      (rep.expired ? '<p class="rwarn">Produtos vencidos descartados: ' + U.money(rep.expired) + '</p>' : '') +
      '<div class="rstores">' + st + '</div>' +
      '<div class="rfoot"><div><h5>Missões do dia</h5><ul class="rms">' + ms + '</ul></div><div class="share"><h5>Participação de mercado</h5><b>' + U.pct(rep.share) + '</b></div></div>' +
      '<div class="mact"><label class="chk"><input type="checkbox" data-ch="skipReport"' + (M.settings.skipReport ? ' checked' : '') + '> Não mostrar relatórios diários</label><button class="btn primary" data-a="nextDay">Abrir a loja · Dia ' + (rep.day + 1) + '</button></div></div>', 'report');
  };
  UI.A.nextDay = () => { UI.closeModal(); M.game.closeReport(); M.audio.sfx('door'); };
  UI.A.skipReport = (el) => { M.settings.skipReport = el.checked; M.save.saveSettings(); };

  UI.showLevelUp = function (d) {
    const un = d.unlocks.map((u) => '<li><em>' + u.t + '</em>' + U.esc(u.name) + '</li>').join('');
    UI.modal('<div class="lvlup"><span class="eyebrow">Sua empresa cresceu</span><div class="badge">' + d.level + '</div><h2>' + d.info.name + '</h2><p>' + d.info.desc + '</p>' + (un ? '<h5>Desbloqueado</h5><ul>' + un + '</ul>' : '') + '<button class="btn primary" data-a="closeModal">Continuar</button></div>', 'levelup');
  };
  UI.showGameOver = function () {
    UI.modal('<div class="lvlup over"><span class="eyebrow">Fim de jogo</span><h2>Falência</h2><p>Sua empresa ficou três dias seguidos com dívidas acima de R$ 15 mil. Carregue um jogo salvo ou recomece.</p><div class="mact"><button class="btn" data-a="menuLoad">Carregar jogo</button><button class="btn primary" data-a="toMenu">Menu principal</button></div></div>', 'levelup');
  };

  // ---------- pausa ----------
  UI.A.pause = () => UI.showPause();
  UI.showPause = function () {
    if (M.R.view === 'menu') return;
    M.R.paused = true;
    UI.modal('<div class="pause"><h2>Jogo pausado</h2><div class="pmenu">' +
      '<button class="btn primary" data-a="resume">' + ic('play') + 'Continuar</button>' +
      '<button class="btn" data-a="saveMenu">' + ic('save') + 'Salvar jogo</button>' +
      '<button class="btn" data-a="loadMenu">' + ic('pkg') + 'Carregar jogo</button>' +
      '<button class="btn" data-a="settings">' + ic('gear') + 'Configurações</button>' +
      '<button class="btn" data-a="pauseNotes">' + ic('bell') + 'Notificações</button>' +
      '<button class="btn" data-a="help">' + ic('help') + 'Controles e ajuda</button>' +
      '<button class="btn ghost" data-a="toMenu">' + ic('exit') + 'Sair para o menu</button></div></div>', 'pausem');
  };
  UI.A.resume = () => { UI.closeModal(); M.R.paused = false; };
  UI.A.pauseNotes = () => { UI.A.resume(); UI.open('notificacoes'); };
  UI.slotList = function (mode) {
    return '<div class="slots">' + M.save.list().filter((r) => mode === 'load' || r.slot !== 'auto').map((r) => {
      const m = r.meta;
      return '<button class="slot" data-a="' + (mode === 'load' ? 'doLoad' : 'doSave') + '" data-slot="' + r.slot + '"' + (mode === 'load' && !m ? ' disabled' : '') + '><b>' + M.save.label(r.slot) + '</b>' +
        (m ? '<span>' + U.esc(m.name) + ' · Dia ' + m.day + ' · Nv ' + m.level + ' · ' + U.money0(m.money) + '</span><small>' + new Date(m.time).toLocaleString('pt-BR') + '</small>' : '<span>Vazio</span>') + '</button>';
    }).join('') + '</div>';
  };
  UI.A.saveMenu = () => UI.modal('<div class="pause"><h2>Salvar jogo</h2>' + UI.slotList('save') + '<details class="exp"><summary>Exportar / importar</summary><p>Copie este código para guardar seu progresso fora do navegador.</p><textarea id="expTxt" readonly>' + M.save.exportText() + '</textarea><div class="mact"><button class="btn" data-a="copyExport">Copiar código</button><button class="btn" data-a="downloadSave">Baixar arquivo</button></div></details><div class="mact"><button class="btn ghost" data-a="pause">Voltar</button></div></div>', 'pausem');
  UI.A.loadMenu = () => UI.modal('<div class="pause"><h2>Carregar jogo</h2>' + UI.slotList('load') + '<details class="exp"><summary>Importar código</summary><textarea id="impTxt" placeholder="Cole aqui o código exportado"></textarea><div class="mact"><button class="btn" data-a="doImport">Importar</button></div></details><div class="mact"><button class="btn ghost" data-a="' + (M.R.view === 'menu' ? 'menuHome' : 'pause') + '">Voltar</button></div></div>', 'pausem');
  UI.A.doSave = (el, d) => { M.save.save(d.slot); UI.A.saveMenu(); };
  UI.A.doLoad = (el, d) => { if (M.save.load(d.slot)) { UI.closeModal(); UI.enterGame(); } };
  UI.A.doImport = () => { if (M.save.importText($('#impTxt').value)) { UI.closeModal(); UI.enterGame(); } };
  UI.A.copyExport = () => { const t = $('#expTxt'); t.select(); try { navigator.clipboard.writeText(t.value).then(() => M.toast('Código copiado.', 'good'), () => M.toast('Selecione o texto e copie manualmente.', 'info')); } catch (e) { M.toast('Selecione o texto e copie manualmente.', 'info'); } };
  UI.A.downloadSave = () => {
    try { const b = new Blob([M.save.serialize()], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'mega-store-tycoon-dia' + M.S.day + '.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
    catch (e) { M.toast('Download indisponível aqui. Use “Copiar código”.', 'info'); }
  };
  UI.A.toMenu = () => { if (M.S && M.R.view !== 'menu') M.save.save('auto', true); UI.closeModal(); UI.close(); M.build.exit(); M.R.paused = false; UI.showMenu(); };
  UI.A.menuLoad = () => { UI.closeModal(); UI.A.loadMenu(); };

  UI.settingsHTML = function () {
    const S = M.settings;
    const sel = (id, opts, v) => '<select id="' + id + '" data-ch="setting" data-k="' + id + '">' + opts.map((o) => '<option value="' + o[0] + '"' + (String(v) === String(o[0]) ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>';
    return '<div class="settings">' +
      '<label><span>Música</span><input type="range" id="music" min="0" max="1" step="0.05" value="' + S.music + '" data-in="setting" data-k="music"><em>' + Math.round(S.music * 100) + '%</em></label>' +
      '<label><span>Efeitos sonoros</span><input type="range" id="sfx" min="0" max="1" step="0.05" value="' + S.sfx + '" data-in="setting" data-k="sfx"><em>' + Math.round(S.sfx * 100) + '%</em></label>' +
      '<label><span>Qualidade gráfica</span>' + sel('quality', [['alta', 'Alta (iluminação completa)'], ['media', 'Média'], ['baixa', 'Baixa (computadores modestos)']], S.quality) + '</label>' +
      '<label><span>Clientes simultâneos por loja</span><input type="range" id="maxCust" min="15" max="60" step="5" value="' + S.maxCust + '" data-in="setting" data-k="maxCust"><em>' + S.maxCust + '</em></label>' +
      '<label><span>Salvamento automático</span>' + sel('autosave', [[0, 'Desligado'], [30, 'A cada 30 s'], [60, 'A cada 1 min'], [120, 'A cada 2 min']], S.autosave) + '</label>' +
      '<label class="chk"><input type="checkbox" id="showGrid" data-ch="setting" data-k="showGrid"' + (S.showGrid ? ' checked' : '') + '> Mostrar grade no modo construção</label>' +
      '<label class="chk"><input type="checkbox" id="skipRep" data-ch="setting" data-k="skipReport"' + (S.skipReport ? ' checked' : '') + '> Pular relatório diário</label></div>';
  };
  UI.A.setting = (el, d) => {
    const k = d.k, S = M.settings;
    if (el.type === 'checkbox') S[k] = el.checked;
    else if (el.type === 'range') { S[k] = +el.value; const em = el.parentNode.querySelector('em'); if (em) em.textContent = k === 'maxCust' ? el.value : Math.round(el.value * 100) + '%'; }
    else S[k] = isNaN(+el.value) ? el.value : +el.value;
    if (k === 'music' || k === 'sfx') M.audio.setVolumes();
    M.save.saveSettings();
  };
  UI.A.settings = () => UI.modal('<div class="pause"><h2>Configurações</h2>' + UI.settingsHTML() + '<div class="mact"><button class="btn ghost" data-a="' + (M.R.view === 'menu' ? 'menuHome' : 'pause') + '">Voltar</button></div></div>', 'pausem');
  UI.helpHTML = () => '<div class="help"><table>' + [
    ['WASD / setas', 'Mover o personagem (na loja) ou a câmera (no mapa)'], ['Clique no chão', 'Andar até o ponto'], ['Clique em objeto', 'Abrir detalhes (prateleira, caixa...)'], ['E', 'Interagir: operar caixa, repor, descarregar, limpar'],
    ['Arrastar / botão direito', 'Mover a câmera'], ['Roda do mouse', 'Zoom'], ['B', 'Modo construção'], ['R', 'Girar objeto'], ['Enter', 'Confirmar obra'], ['Esc', 'Cancelar / fechar / pausar'],
    ['Espaço', 'Pausar o tempo'], ['1 / 2 / 3', 'Velocidade 1x, 2x, 4x'], ['M', 'Mapa da cidade'], ['C, I, F, H, G, K, J', 'Catálogo, Estoque, Fornecedores, Equipe, Finanças, Empresa, Missões'],
  ].map((r) => '<tr><td><kbd>' + r[0] + '</kbd></td><td>' + r[1] + '</td></tr>').join('') + '</table>' +
    '<h5>Como prosperar</h5><ul><li>Mantenha as prateleiras cheias: clientes que não encontram produtos ficam insatisfeitos.</li><li>Preços acima do mercado espantam clientes econômicos; promoções atraem impulsivos.</li><li>Funcionários trabalham sozinhos. Um gerente habilita pedidos automáticos.</li><li>Produtos perecíveis vencem: confira a validade no Estoque.</li><li>Abra novas unidades pelo Mapa quando atingir o nível necessário.</li></ul></div>';
  UI.A.help = () => UI.modal('<div class="pause wide"><h2>Controles e ajuda</h2>' + UI.helpHTML() + '<div class="mact"><button class="btn ghost" data-a="' + (M.R.view === 'menu' ? 'menuHome' : 'pause') + '">Voltar</button></div></div>', 'pausem');

  // ---------- menu principal ----------
  UI.showMenu = function () {
    M.R.view = 'menu';
    UI.showHUD(false);
    $('#buildbar').hidden = true; $('#confirm').hidden = true; $('#tut').hidden = true; $('#panel').hidden = true;
    UI.menuHome();
  };
  UI.menuHome = function () {
    const last = M.save.latest();
    $('#menu').hidden = false;
    $('#menu').innerHTML = '<div class="mcol"><div class="logo"><span class="l1">MEGA STORE</span><span class="l2">TYCOON</span><span class="tag">De lojinha de bairro a império do varejo</span></div>' +
      '<div class="mbtns">' +
      (last ? '<button class="btn primary big" data-a="menuContinue">' + ic('play') + 'Continuar<small>' + U.esc(last.meta.name) + ' · Dia ' + last.meta.day + ' · ' + U.money0(last.meta.money) + '</small></button>' : '') +
      '<button class="btn ' + (last ? '' : 'primary ') + 'big" data-a="menuNew">' + ic('plus') + 'Novo jogo</button>' +
      '<button class="btn" data-a="loadMenu">' + ic('pkg') + 'Carregar</button>' +
      '<button class="btn" data-a="settings">' + ic('gear') + 'Configurações</button>' +
      '<button class="btn" data-a="help">' + ic('help') + 'Como jogar</button>' +
      '<button class="btn" data-a="menuContent">' + ic('star') + 'Conteúdo e créditos</button></div>' +
      '<p class="ver">Versão ' + M.VERSION + ' · ' + M.EDITION.name + ' · ' + M.PRODUCTS.length + ' produtos</p></div>';
  };
  UI.A.menuHome = () => { UI.closeModal(); UI.menuHome(); };
  UI.A.menuContinue = () => { const l = M.save.latest(); if (l && M.save.load(l.slot)) UI.enterGame(); };
  UI.A.menuContent = () => UI.modal('<div class="pause wide"><h2>Conteúdo e créditos</h2><p>' + M.EDITION.name + '. Arte, música e efeitos sonoros são gerados pelo próprio jogo, sem arquivos externos.</p><h5>Pacotes instalados</h5><ul class="packs">' +
    '<li><b>Jogo base</b><span>' + M.CATS.length + ' categorias, 7 níveis, ' + Object.keys(M.BUILD).length + ' construções, ' + M.SUPPLIERS.length + ' fornecedores</span></li>' +
    M.packs.list.map((p) => '<li><b>' + U.esc(p.name) + (p.locked ? ' <em>indisponível nesta edição</em>' : ' <em>incluído</em>') + '</b><span>' + U.esc(p.desc) + ' (' + p.products + ' produtos, ' + p.builds + ' construções)</span></li>').join('') +
    '</ul><p class="muted">Novos mapas, expansões e pacotes de decoração podem ser adicionados como arquivos de pacote (veja src/packs.js e o README).</p><div class="mact"><button class="btn ghost" data-a="menuHome">Voltar</button></div></div>', 'pausem');

  let newLook = null;
  UI.A.menuNew = function () {
    newLook = M.sprites.randomLook();
    const brands = M.BRANDS.map((c, i) => '<label class="sw"><input type="radio" name="brand" value="' + c + '"' + (i === 0 ? ' checked' : '') + '><i style="background:' + c + '"></i></label>').join('');
    UI.modal('<form class="newgame" id="ngForm"><h2>Nova empresa</h2>' +
      '<label><span>Nome da empresa</span><input id="ngName" maxlength="24" value="Mercado Popular" required></label>' +
      '<label><span>Nome da primeira loja</span><input id="ngStore" maxlength="28" value="Mercadinho da Esquina" required></label>' +
      '<div class="lbl">Cor da marca</div><div class="swatches">' + brands + '</div>' +
      '<div class="lbl">Seu personagem</div><div class="look"><canvas id="ngLook" width="96" height="96"></canvas><button type="button" class="btn" data-a="ngReroll">Mudar visual</button></div>' +
      '<div class="lbl">Dificuldade</div><div class="diffs">' + M.DIFFS.map((d, i) => '<label class="diff"><input type="radio" name="diff" value="' + i + '"' + (i === 1 ? ' checked' : '') + '><span><b>' + d.name + '</b><small>' + U.money0(d.money) + ' · ' + d.desc + '</small></span></label>').join('') + '</div>' +
      '<label class="chk"><input type="checkbox" id="ngTut" checked> Jogar o tutorial</label>' +
      '<div class="mact"><button type="button" class="btn ghost" data-a="menuHome">Cancelar</button><button class="btn primary" data-a="ngStart">Começar</button></div></form>', 'pausem');
    drawLook();
  };
  function drawLook() {
    const c = $('#ngLook'); if (!c) return; const x = c.getContext('2d');
    x.clearRect(0, 0, 96, 96);
    const L = M.sprites.ROLE_LOOK.jogador;
    M.sprites.person(x, 48, 84, 88, newLook, 0, 0, { shirt: L.shirt, pants: L.pants });
  }
  UI.A.ngReroll = () => { newLook = M.sprites.randomLook(); drawLook(); };
  UI.A.ngStart = function () {
    const name = ($('#ngName').value || '').trim() || 'Minha Empresa', storeName = ($('#ngStore').value || '').trim() || 'Mercadinho';
    const brand = (document.querySelector('input[name=brand]:checked') || {}).value || M.BRANDS[0];
    const diff = +((document.querySelector('input[name=diff]:checked') || {}).value || 1);
    const tut = $('#ngTut').checked;
    UI.closeModal();
    M.game.newGame({ name, storeName, brand, diff, look: newLook });
    M.S.tut.done = !tut;
    UI.enterGame();
    M.save.save('auto', true);
  };
  UI.enterGame = function () {
    UI.showHUD(true);
    M.R.paused = false;
    UI.dirty(); UI.refresh();
    if (M.tutorial) M.tutorial.start();
  };

  // ---------- barra de construção ----------
  const previews = {};
  function preview(id) {
    if (previews[id]) return previews[id];
    const d = M.BUILD[id], cv = document.createElement('canvas'); cv.width = 88; cv.height = 64;
    const c = cv.getContext('2d');
    try {
      if (d.kind === 'floor') { for (let y = 0; y < 2; y++) for (let x = 0; x < 3; x++) M.render.FLOOR_DRAW[d.fl](c, 0 + x * 32 - 4, y * 32, x + y * 3, x, y); }
      else if (d.kind === 'wall' || d.kind === 'door' || d.kind === 'window') {
        c.fillStyle = '#e3e6ea'; c.fillRect(8, 10, 72, 30); c.fillStyle = '#b9c0c9'; c.fillRect(8, 40, 72, 16);
        if (d.kind === 'window') { c.fillStyle = 'rgba(140,200,255,.85)'; c.fillRect(30, 14, 28, 22); c.fillRect(30, 42, 28, 12); }
        if (d.kind === 'door') { c.clearRect(30, 10, 28, 46); c.fillStyle = 'rgba(165,216,255,.7)'; c.fillRect(30, 18, 28, 38); c.fillStyle = '#495057'; c.fillRect(28, 14, 32, 4); }
      } else {
        const o = { t: id, x: 0, y: 0, r: 0, slots: d.slots ? Array.from({ length: d.slots }, () => ({ p: null, q: 0 })) : null };
        const w = d.w * 32, h = d.h * 32, sc = Math.min(1, 70 / w, 50 / (h + 24));
        c.translate(44 - (w * sc) / 2, 58 - h * sc); c.scale(sc, sc);
        const s = M.game.store();
        M.render.DRAW[id] ? M.render.DRAW[id](c, o, 0, 0, w, h, s, 0) : null;
      }
    } catch (e) { /* prévia indisponível */ }
    previews[id] = cv.toDataURL();
    return previews[id];
  }
  UI.renderBuild = function () {
    const bb = $('#buildbar'), st = M.build.st;
    const on = st.on && M.R.view === 'store';
    document.getElementById('app').classList.toggle('mode-build', on);
    if (!on) { bb.hidden = true; return; }
    const grp = UI._bgrp || 'expositores';
    const s = M.game.store(), ex = M.build.expandInfo(s);
    const items = Object.values(M.BUILD).filter((d) => d.grp === grp);
    bb.innerHTML = '<div class="bgroups">' + M.BUILD_GROUPS.map((g) => '<button data-a="bgrp" data-g="' + g.id + '" class="' + (g.id === grp ? 'on' : '') + '">' + g.name + '</button>').join('') +
      '<span class="sp"></span><button data-a="btool" data-t="mover" class="tool' + (st.tool === 'mover' ? ' on' : '') + '">' + ic('move') + 'Mover</button>' +
      '<button data-a="btool" data-t="demolir" class="tool' + (st.tool === 'demolir' ? ' on' : '') + '">' + ic('trash') + 'Demolir</button>' +
      '<button data-a="brot" class="tool" title="Girar (R)">' + ic('rotate') + 'Girar</button>' +
      '<button data-a="bexpand" class="tool"' + (ex ? '' : ' disabled') + ' title="Ampliar a área construída">' + ic('expand') + (ex ? 'Ampliar ' + U.money0(ex.cost) : 'Tamanho máximo') + '</button>' +
      '<button data-a="open" data-p="fachada" class="tool">' + ic('paint') + 'Fachada</button>' +
      '<button data-a="bexit" class="tool exit">' + ic('close') + 'Sair</button></div>' +
      '<div class="bitems">' + items.map((d) => {
        const lock = d.lvl > M.S.level;
        return '<button class="bitem' + (st.tool === d.id ? ' on' : '') + (lock ? ' lock' : '') + '" data-a="btool" data-t="' + d.id + '"' + (lock ? ' disabled' : '') + ' title="' + U.esc(d.desc || d.name) + '">' +
          '<img src="' + preview(d.id) + '" alt=""><b>' + U.esc(d.name) + '</b><span>' + (lock ? 'Nível ' + d.lvl : U.money0(d.cost) + (d.kind === 'floor' || d.kind === 'wall' ? '/tile' : '')) + '</span></button>';
      }).join('') + '</div>';
    bb.hidden = false;
  };
  UI.A.bgrp = (el, d) => { UI._bgrp = d.g; UI.renderBuild(); };
  UI.A.btool = (el, d) => { M.build.setTool(d.t); UI.renderBuild(); };
  UI.A.brot = () => M.build.rotate();
  UI.A.bexpand = () => { const s = M.game.store(); const e = M.build.expandInfo(s); if (!e) return; if (M.S.money < e.cost) return M.toast('Você precisa de ' + U.money0(e.cost) + ' para ampliar.', 'bad'); M.build.expand(s); UI.renderBuild(); M.render.fit(M.R.cams.store, M.R.vw, M.R.vh); };
  UI.A.bexit = () => { M.build.exit(); UI.dirty(); };
  UI.renderConfirm = function () {
    const c = $('#confirm'), p = M.build.st.pending;
    if (!p || !M.build.st.on) { c.hidden = true; c._k = ''; return; }
    const k = p.type + p.cost;
    if (c._k === k && !c.hidden) return;
    c._k = k;
    const label = p.type === 'demolish' ? 'Demolir' + (p.cost < 0 ? ' · reembolso ' + U.money0(-p.cost) : '') : p.type === 'move' ? 'Mover aqui' : 'Construir · ' + U.money(p.cost);
    c.innerHTML = '<button class="btn primary" data-a="bconfirm">' + ic('check') + label + ' <kbd>Enter</kbd></button><button class="btn ghost" data-a="bcancel">' + ic('close') + 'Cancelar <kbd>Esc</kbd></button>';
    c.hidden = false;
  };
  UI.A.bconfirm = () => { M.build.confirm(); UI.renderConfirm(); };
  UI.A.bcancel = () => { M.build.cancel(); UI.renderConfirm(); };

  // ---------- dica flutuante ----------
  UI.tip = function (html, x, y) {
    const t = $('#tip'); if (!html) { t.hidden = true; return; }
    if (t._h !== html) { t.innerHTML = html; t._h = html; }
    t.hidden = false;
    const w = t.offsetWidth, h = t.offsetHeight;
    t.style.left = Math.min(window.innerWidth - w - 8, x + 16) + 'px';
    t.style.top = Math.min(window.innerHeight - h - 8, y + 16) + 'px';
  };
})();
