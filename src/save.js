/* Salvamento: slots manuais, salvamento automático, exportação/importação, validação e migração de versões.
   Configurações do jogador são salvas separadamente do progresso. */
(function () {
  'use strict';
  const M = window.MST, U = M.U;
  const SV = (M.save = {});
  const KEY = 'mst_save_', META = 'mst_meta_', SETTINGS = 'mst_settings';
  SV.SLOTS = ['auto', '1', '2', '3'];

  function ls() { try { return window.localStorage; } catch (e) { return null; } }
  SV.serialize = () => JSON.stringify(M.S, (k, v) => (k.charAt(0) === '_' ? undefined : v));

  SV.meta = () => ({ name: M.S.name, day: M.S.day, money: Math.round(M.S.money), level: M.S.level, stores: M.S.stores.length, time: Date.now(), ver: M.VERSION });
  SV.save = function (slot, silent) {
    if (!M.S) return false;
    const st = ls(); if (!st) { if (!silent) M.toast('O navegador bloqueou o armazenamento local.', 'bad'); return false; }
    try {
      const json = SV.serialize();
      st.setItem(KEY + slot, json);
      st.setItem(META + slot, JSON.stringify(SV.meta()));
      SV.lastSave = Date.now();
      if (!silent) { M.toast('Jogo salvo (' + SV.label(slot) + ').', 'good'); M.audio.sfx('notify'); }
      return true;
    } catch (e) {
      console.error('Falha ao salvar', e);
      M.toast('Não foi possível salvar: espaço insuficiente no navegador.', 'bad');
      return false;
    }
  };
  SV.label = (slot) => (slot === 'auto' ? 'Automático' : 'Espaço ' + slot);
  SV.list = function () {
    const st = ls(), out = [];
    for (const s of SV.SLOTS) {
      let m = null;
      try { m = st && JSON.parse(st.getItem(META + s) || 'null'); } catch (e) { m = null; }
      out.push({ slot: s, meta: m });
    }
    return out;
  };
  SV.latest = function () {
    let best = null;
    for (const r of SV.list()) if (r.meta && (!best || r.meta.time > best.meta.time)) best = r;
    return best;
  };
  SV.remove = function (slot) { const st = ls(); if (!st) return; st.removeItem(KEY + slot); st.removeItem(META + slot); };

  SV.validate = function (d) {
    if (!d || typeof d !== 'object') throw new Error('Arquivo inválido');
    if (!Array.isArray(d.stores) || !d.stores.length) throw new Error('Save sem lojas');
    if (typeof d.money !== 'number' || !isFinite(d.money)) throw new Error('Saldo inválido');
    return true;
  };
  SV.migrate = function (d) {
    d.ver = d.ver || 1;
    d.td = d.td || M.game.newTd(); d.week = d.week || M.game.newWeek();
    d.missions = d.missions || { daily: [], weekly: [], event: [], ach: {} }; d.missions.ach = d.missions.ach || {}; d.missions.event = d.missions.event || [];
    d.events = d.events || { active: [] }; d.promos = d.promos || []; d.camps = d.camps || []; d.sup = d.sup || {}; d.market = d.market || { idx: 1 };
    d.stats = Object.assign({ sales: 0, cust: 0, items: 0, profitDays: 0, best: 0, missions: 0 }, d.stats || {});
    d.tut = d.tut || { step: 0, done: true };
    // produtos removidos por pacotes desativados
    for (const s of d.stores) {
      for (const k in s.storage) if (!M.P[k]) delete s.storage[k];
      for (const k in s.batches || {}) if (!M.P[k]) delete s.batches[k];
      s.dock = (s.dock || []).filter((x) => M.P[x.p]);
      s.objs = s.objs.filter((o) => M.BUILD[o.t]);
      for (const o of s.objs) if (o.slots) for (const sl of o.slots) if (sl.p && !M.P[sl.p]) { sl.p = null; sl.q = 0; }
    }
    for (const k in d.prices) if (!M.P[k]) delete d.prices[k];
    return d;
  };
  SV.apply = function (d) {
    SV.validate(d);
    M.S = SV.migrate(d);
    M.game.afterLoad();
  };
  SV.load = function (slot) {
    const st = ls(); if (!st) return false;
    const raw = st.getItem(KEY + slot);
    if (!raw) { M.toast('Nenhum jogo salvo neste espaço.', 'bad'); return false; }
    const backup = M.S;
    try { SV.apply(JSON.parse(raw)); M.toast('Jogo carregado: dia ' + M.S.day + '.', 'good'); return true; }
    catch (e) { console.error(e); M.S = backup; M.toast('O arquivo salvo está corrompido e não pôde ser carregado.', 'bad'); return false; }
  };
  SV.exportText = () => btoa(unescape(encodeURIComponent(SV.serialize())));
  SV.importText = function (txt) {
    const backup = M.S;
    try {
      txt = String(txt || '').trim();
      const json = txt.charAt(0) === '{' ? txt : decodeURIComponent(escape(atob(txt)));
      SV.apply(JSON.parse(json)); M.toast('Jogo importado com sucesso.', 'good'); return true;
    } catch (e) { console.error(e); M.S = backup; M.toast('Código de importação inválido.', 'bad'); return false; }
  };

  SV.saveSettings = function () { const st = ls(); if (st) try { st.setItem(SETTINGS, JSON.stringify(M.settings)); } catch (e) { /* ignorado */ } };
  SV.loadSettings = function () {
    const st = ls(); if (!st) return;
    try { const v = JSON.parse(st.getItem(SETTINGS) || 'null'); if (v) Object.assign(M.settings, v); } catch (e) { /* configurações padrão */ }
  };

  // salvamento automático periódico
  let acc = 0;
  SV.tick = function (dt) {
    if (!M.S || M.R.view === 'menu' || !M.settings.autosave) return;
    acc += dt;
    if (acc >= M.settings.autosave) { acc = 0; SV.save('auto', true); }
  };
  window.addEventListener('beforeunload', () => { if (M.S && M.R.view !== 'menu') SV.save('auto', true); });
  void U;
})();
