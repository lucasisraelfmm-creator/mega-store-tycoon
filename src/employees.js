/* Funcionários: candidatos, contratação, demissão, treinamento, promoções, escalas, salários
   e o comportamento autônomo de cada função dentro da loja. */
(function () {
  'use strict';
  const M = window.MST, U = M.U, P = () => M.path;

  M.ROLES = {
    caixa: { name: 'Operador de Caixa', sal: 70, lvl: 1, desc: 'Atende clientes no caixa. Atendimento rápido reduz filas.' },
    repositor: { name: 'Repositor', sal: 64, lvl: 1, desc: 'Leva mercadorias do depósito às prateleiras.' },
    estoquista: { name: 'Estoquista', sal: 68, lvl: 1, desc: 'Descarrega entregas para o depósito e ajuda na reposição.' },
    faxineiro: { name: 'Faxineiro', sal: 55, lvl: 2, desc: 'Mantém a loja limpa e atraente.' },
    seguranca: { name: 'Segurança', sal: 92, lvl: 2, desc: 'Patrulha a loja e impede furtos.' },
    gerente: { name: 'Gerente', sal: 175, lvl: 3, max: 1, desc: '+12% de eficiência da equipe e habilita pedidos automáticos.' },
    entregador: { name: 'Entregador', sal: 76, lvl: 3, desc: 'Realiza vendas por delivery usando o estoque do depósito.' },
  };
  M.SHIFTS = {
    integral: { name: 'Integral (07h–22h)', a: 7 * 60, b: 22 * 60, mult: 1 },
    manha: { name: 'Manhã (07h–14h30)', a: 7 * 60, b: 14 * 60 + 30, mult: 0.6 },
    tarde: { name: 'Tarde (14h30–22h)', a: 14 * 60 + 30, b: 22 * 60, mult: 0.6 },
  };
  M.STAFF_MAX = { P: 6, M: 10, G: 16, XG: 26 };

  const FN = ['Ana', 'Bruno', 'Carla', 'Diego', 'Eduarda', 'Felipe', 'Gabriela', 'Heitor', 'Isabela', 'João', 'Karina', 'Lucas', 'Mariana', 'Nicolas', 'Olívia', 'Pedro', 'Rafaela', 'Samuel', 'Tatiane', 'Vinícius', 'Yasmin', 'Thiago', 'Beatriz', 'Caio', 'Débora', 'Enzo', 'Fernanda', 'Gustavo', 'Helena', 'Igor', 'Juliana', 'Leonardo', 'Larissa', 'Matheus', 'Natália', 'Otávio', 'Priscila', 'Renato', 'Sabrina', 'Wesley', 'Letícia', 'André', 'Camila', 'Daniel', 'Lívia', 'Márcio', 'Paula', 'Rodrigo'];
  const LN = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Ferreira', 'Rodrigues', 'Almeida', 'Nascimento', 'Carvalho', 'Gomes', 'Martins', 'Araújo', 'Ribeiro', 'Barbosa', 'Rocha', 'Dias', 'Moreira', 'Teixeira', 'Cardoso', 'Mendes', 'Freitas', 'Pinto', 'Moura', 'Campos', 'Nunes'];

  const EM = (M.emps = {});
  EM.need = (lvl) => Math.round(90 * Math.pow(lvl, 1.6));
  EM.shiftCost = (e) => e.salary * M.SHIFTS[e.shift].mult;

  EM.makeCandidate = function (role) {
    const lvl = U.chance(0.15) ? 3 : U.chance(0.35) ? 2 : 1;
    const sk = { vel: U.rnd(0.65, 1.25), atend: U.rnd(0.65, 1.25), org: U.rnd(0.65, 1.25) };
    for (const k in sk) sk[k] = U.round2(sk[k] + (lvl - 1) * 0.08);
    const eff = U.round2((sk.vel + sk.atend + sk.org) / 3);
    const salary = Math.round(M.ROLES[role].sal * (0.7 + eff * 0.35) * (1 + (lvl - 1) * 0.12));
    return { name: U.pick(FN) + ' ' + U.pick(LN), role, lvl, eff, sk, salary, look: M.sprites.randomLook(), trait: U.pick(['Pontual', 'Comunicativo(a)', 'Organizado(a)', 'Ágil', 'Paciente', 'Dedicado(a)', 'Criativo(a)', 'Cuidadoso(a)']) };
  };
  EM.refreshCandidates = function (force) {
    if (!force && M.S.candDay === M.S.day) return;
    M.S.candDay = M.S.day;
    M.S.cands = {};
    for (const r in M.ROLES) { M.S.cands[r] = []; for (let i = 0; i < 3; i++) M.S.cands[r].push(EM.makeCandidate(r)); }
  };

  EM.hire = function (s, role, idx) {
    const c = M.S.cands[role] && M.S.cands[role][idx]; if (!c) return;
    const R = M.ROLES[role];
    if (R.lvl > M.S.level) return M.toast('Disponível no nível ' + R.lvl + '.', 'bad');
    if (s.emps.length >= M.STAFF_MAX[s.size]) return M.toast('Equipe completa para o tamanho desta loja.', 'bad');
    if (R.max && s.emps.filter((e) => e.role === role).length >= R.max) return M.toast('Esta loja já tem um ' + R.name.toLowerCase() + '.', 'bad');
    const fee = Math.round(c.salary * 1.5);
    if (!M.eco.spend(fee, 'outros', s.id)) return M.toast('Você precisa de ' + U.money0(fee) + ' para a contratação.', 'bad');
    const e = { id: M.S.nextEmpId++, name: c.name, role, lvl: c.lvl, xp: 0, eff: c.eff, sk: c.sk, salary: c.salary, sat: 75, shift: 'integral', look: c.look, trait: c.trait, hired: M.S.day, trained: 0, days: 0 };
    s.emps.push(e);
    M.S.cands[role].splice(idx, 1);
    M.S.cands[role].push(EM.makeCandidate(role));
    M.S.week.hires = (M.S.week.hires || 0) + 1;
    M.audio.sfx('coin');
    M.notify(e.name + ' contratado(a) como ' + R.name + ' em ' + s.name + '.', 'good');
    M.bus.emit('hire', { store: s, emp: e }); M.bus.emit('ui');
    return e;
  };

  EM.fire = function (s, e, silent) {
    const k = s.emps.indexOf(e); if (k < 0) return;
    releaseAll(s, e);
    s.emps.splice(k, 1);
    if (!silent) {
      M.eco.spend(Math.round(e.salary * 2), 'rescisao', s.id, true);
      for (const o of s.emps) o.sat = Math.max(0, o.sat - 3);
      M.notify(e.name + ' foi desligado(a). Rescisão: ' + U.money0(e.salary * 2) + '.', 'info');
    }
    M.bus.emit('ui');
  };
  EM.transfer = function (s, e, to) {
    if (!to || to === s) return;
    if (to.emps.length >= M.STAFF_MAX[to.size]) return M.toast('A equipe de ' + to.name + ' está completa.', 'bad');
    releaseAll(s, e); s.emps.splice(s.emps.indexOf(e), 1); e._a = null; to.emps.push(e);
    M.notify(e.name + ' foi transferido(a) para ' + to.name + '.', 'info'); M.bus.emit('ui');
  };
  EM.trainCost = (e) => 120 + e.lvl * 90;
  EM.train = function (s, e) {
    if (e.trained === M.S.day) return M.toast(e.name.split(' ')[0] + ' já fez um treinamento hoje.', 'bad');
    if (e.eff >= 1.75) return M.toast('Eficiência máxima atingida.', 'bad');
    const c = EM.trainCost(e);
    if (!M.eco.spend(c, 'treinamento', s.id)) return M.toast('Dinheiro insuficiente.', 'bad');
    e.trained = M.S.day; e.eff = U.round2(Math.min(1.75, e.eff + 0.05)); e.xp += 20; e.sat = Math.min(100, e.sat + 4);
    const k = U.pick(['vel', 'atend', 'org']); e.sk[k] = U.round2(Math.min(1.9, e.sk[k] + 0.07));
    M.audio.sfx('levelup');
    M.notify(e.name + ' concluiu um treinamento (+5% de eficiência).', 'good'); M.bus.emit('ui');
  };
  EM.promote = function (s, e) {
    if (e.xp < EM.need(e.lvl)) return M.toast('Experiência insuficiente para promoção.', 'bad');
    if (e.lvl >= 5) return;
    e.xp -= EM.need(e.lvl); e.lvl++; e.salary = Math.round(e.salary * 1.12); e.eff = U.round2(Math.min(1.75, e.eff + 0.06)); e.sat = Math.min(100, e.sat + 15);
    M.audio.sfx('levelup');
    M.notify(e.name + ' foi promovido(a) ao nível ' + e.lvl + '!', 'good'); M.bus.emit('ui');
  };
  EM.raise = function (s, e) { e.salary = Math.round(e.salary * 1.08); e.sat = Math.min(100, e.sat + 12); M.audio.sfx('coin'); M.notify('Aumento concedido a ' + e.name + '.', 'good'); M.bus.emit('ui'); };
  EM.setShift = function (s, e, sh) { if (!M.SHIFTS[sh]) return; e.shift = sh; M.bus.emit('ui'); };

  EM.hasMgr = (s) => s.emps.some((e) => e.role === 'gerente' && EM.onShift(e));
  EM.onShift = (e) => { const sh = M.SHIFTS[e.shift]; return M.S.minute >= sh.a && M.S.minute < sh.b; };
  EM.eff = function (s, e) {
    return e.eff * (0.55 + 0.45 * e.sat / 100) * (1 + 0.06 * (e.lvl - 1)) * (s._mgr ? 1.12 : 1) * (M.S.hq ? 1.05 : 1);
  };
  EM.payroll = (s) => U.sum(s.emps, EM.shiftCost);

  // fim do dia: experiência, satisfação, pedidos de demissão
  EM.daily = function (s) {
    const mgr = s.emps.some((e) => e.role === 'gerente');
    for (const e of s.emps.slice()) {
      e.days++;
      const market = M.ROLES[e.role].sal * (0.7 + e.eff * 0.35) * (1 + (e.lvl - 1) * 0.12);
      let target = 62 + (e.salary / market - 1) * 140 + (mgr && e.role !== 'gerente' ? 8 : 0) - (e.shift === 'integral' ? 7 : 0) + (s.rating - 60) * 0.15;
      target = U.clamp(target, 5, 100);
      e.sat = U.clamp(e.sat + (target - e.sat) * 0.25 + U.rnd(-3, 3), 0, 100);
      if (e.sat < 22 && U.chance(0.25)) { M.notify(e.name + ' (' + M.ROLES[e.role].name + ') pediu demissão por insatisfação.', 'bad'); EM.fire(s, e, true); }
    }
  };

  function releaseAll(s, e) {
    const a = e._a; if (!a) return;
    if (a.chk) { if (a.chk._op === e.id) a.chk._op = null; a.chk = null; }
    if (a.res) { a.res._res = 0; a.res = null; }
    if (a.dirt) { a.dirt._res = 0; a.dirt = null; }
    if (a.carry && a.carry.q > 0) { M.inv.addStorage(s, a.carry.p, a.carry.q); a.carry = null; }
  }
  EM.release = releaseAll;

  // ---------- comportamento ----------
  function spawn(s, e) {
    const ed = P().edge(s);
    e._a = { x: ed[0] + 0.5, y: ed[1] + 0.5, dir: 0, ph: Math.random() * 6, path: null, pi: 0, st: 'arrive', t: 0, moving: false };
    P().go(e._a, P().bfs(s, ed[0], ed[1], s._floorTiles.length ? s._floorTiles.slice(0, 1) : s._doors));
  }
  const tile = (a) => [a.x | 0, a.y | 0];
  function goObj(s, a, o) { const t = tile(a); return P().go(a, P().toObj(s, t[0], t[1], o)); }
  function goTile(s, a, x, y) { const t = tile(a); return P().go(a, P().toTile(s, t[0], t[1], x, y)); }
  function wander(s, a) { const r = P().randomFloor(s); if (r) goTile(s, a, r[0], r[1]); a.t = U.rnd(4, 10); }
  function nearestObj(s, a, kind) {
    let best = null, bd = Infinity;
    for (const o of s.objs) if (M.BUILD[o.t].kind === kind) { const d = U.dist(a.x, a.y, o.x, o.y); if (d < bd) { bd = d; best = o; } }
    return best;
  }
  function goStorage(s, a) {
    const o = nearestObj(s, a, 'storage');
    if (o) return goObj(s, a, o);
    const d = s._doors[0]; if (d == null) return false;
    return P().go(a, P().bfs(s, a.x | 0, a.y | 0, [d - s.gw]));
  }
  function goDock(s, a) { const d = s._doors[0]; if (d == null) return false; return P().go(a, P().bfs(s, a.x | 0, a.y | 0, [d, d - s.gw])); }

  EM.update = function (s, dt) {
    s._mgr = EM.hasMgr(s);
    for (const e of s.emps) {
      const on = EM.onShift(e) && M.stores.isOpenNow(s);
      if (!e._a) { if (on && s._doors.length) spawn(s, e); else continue; }
      const a = e._a;
      a.ph += dt * 9;
      const eff = EM.eff(s, e), spd = 1.15 * (0.6 + 0.4 * e.sk.vel) * (0.75 + 0.25 * eff);
      if (!on && a.st !== 'leave') { releaseAll(s, e); a.st = 'leave'; const ed = P().edge(s); goTile(s, a, ed[0], ed[1]); if (!a.path) { e._a = null; continue; } }
      if (a.st === 'leave') { if (P().move(a, dt * spd)) e._a = null; continue; }
      if (a.hidden) { a.t -= dt; if (a.t <= 0) deliveryReturn(s, e, a); continue; }
      const arrived = P().move(a, dt * spd);
      if (on) e.xp += dt * 0.08;
      try { ROLE_AI[e.role](s, e, a, arrived, dt, eff); } catch (err) { console.error('IA do funcionário', err); a.path = null; a.st = 'idle'; }
    }
  };

  const ROLE_AI = {
    caixa(s, e, a, arrived, dt) {
      if (!a.chk || a.chk._op !== e.id || !s.objs.includes(a.chk)) {
        a.chk = null;
        let best = null, bd = Infinity;
        for (const o of s.objs) if (M.BUILD[o.t].kind === 'checkout' && !o._op) { const q = (o._q ? o._q.length : 0) * -3 + U.dist(a.x, a.y, o.x, o.y); if (q < bd) { bd = q; best = o; } }
        if (best) { best._op = e.id; a.chk = best; a.st = 'toChk'; const sp = M.build.spots(s, best); goTile(s, a, sp.cashier[0], sp.cashier[1]); }
        else if (arrived) wander(s, a);
        return;
      }
      if (a.st === 'toChk' && arrived) {
        const sp = M.build.spots(s, a.chk);
        if (Math.abs(a.x - sp.cashier[0] - 0.5) < 0.1 && Math.abs(a.y - sp.cashier[1] - 0.5) < 0.1) { a.st = 'work'; a.dir = (a.chk.r + 0) % 4; }
        else { goTile(s, a, sp.cashier[0], sp.cashier[1]); if (!a.path) { a.st = 'work'; } }
      }
      if (a.st === 'work') { a.moving = false; a.dir = a.chk.r; }
    },
    repositor(s, e, a, arrived, dt, eff) { stocker(s, e, a, arrived, dt, eff, false); },
    estoquista(s, e, a, arrived, dt, eff) { stocker(s, e, a, arrived, dt, eff, true); },
    faxineiro(s, e, a, arrived, dt, eff) {
      if (a.st === 'clean') { a.t -= dt * eff; a.moving = false; if (a.t <= 0) { const k = s.dirt.indexOf(a.dirt); if (k >= 0) s.dirt.splice(k, 1); a.dirt = null; a.st = 'idle'; if (s.id === M.S.curId && M.fx) M.fx.sparkle(s, a.x, a.y); } return; }
      if (a.dirt && !s.dirt.includes(a.dirt)) { a.dirt = null; a.st = 'idle'; }
      if (a.st === 'toDirt' && arrived) { a.st = 'clean'; a.t = 1.2; return; }
      if (a.st !== 'toDirt') {
        let best = null, bd = Infinity;
        for (const d of s.dirt) if (!d._res) { const dd = U.dist(a.x, a.y, d.x, d.y); if (dd < bd) { bd = dd; best = d; } }
        if (best) { best._res = e.id; a.dirt = best; a.st = 'toDirt'; goTile(s, a, best.x | 0, best.y | 0); if (!a.path) { a.st = 'clean'; a.t = 1.2; } return; }
        if (arrived) { a.t -= dt; if (a.t <= 0) wander(s, a); }
      }
    },
    seguranca(s, e, a, arrived, dt, eff) {
      if (arrived) { a.t -= dt; if (a.t <= 0) { wander(s, a); a.t = U.rnd(2, 6); } }
      for (const c of s._cust) {
        if (c.stole && !c.caught && U.dist(a.x, a.y, c.x, c.y) < 2.6 + eff) {
          c.caught = true;
          for (const it of c.stole) M.inv.addStorage(s, it.p, it.q);
          c.stole = null; c.emo = { type: 'furto', t: 3 }; c.sat = 0;
          s.day.caught = (s.day.caught || 0) + 1;
          if (s.id === M.S.curId) M.toast(e.name.split(' ')[0] + ' impediu um furto!', 'good');
        }
      }
    },
    gerente(s, e, a, arrived, dt) { if (arrived) { a.t -= dt; if (a.t <= 0) wander(s, a); } },
    entregador(s, e, a, arrived, dt, eff) {
      if (a.st === 'out') { if (arrived) { a.hidden = true; a.t = U.rnd(20, 32) / eff; } return; }
      if (a.st === 'back') { if (arrived) { a.st = 'idle'; a.t = 2; } return; }
      a.t -= dt;
      if (arrived && a.st === 'idle' && a.t <= 0) {
        const interval = 45 / (0.4 + s.rating / 100);
        a.t = interval * U.rnd(0.7, 1.3);
        const pool = Object.keys(s.storage).filter((p) => s.storage[p] > 0 && M.stores.allowsProduct(s, M.P[p]));
        if (!pool.length || U.chance(0.25)) { wander(s, a); return; }
        const items = [];
        for (let i = 0, n = U.rndi(1, 4); i < n; i++) { const p = U.pick(pool); const q = Math.min(s.storage[p] || 0, U.rndi(1, 3)); if (q > 0) { M.inv.removeStorage(s, p, q); items.push({ p, q }); } }
        if (!items.length) return;
        a.carry = { p: items[0].p, q: 0, box: true }; a.deliv = items; a.st = 'out';
        const ed = P().edge(s); goTile(s, a, ed[0], ed[1]);
      }
    },
  };

  function deliveryReturn(s, e, a) {
    a.hidden = false;
    let total = 6.9, items = 0;
    for (const it of a.deliv || []) { total += M.eco.sell(it.p) * it.q; items += it.q; s.day.cogs += M.P[it.p].cost * it.q; M.game.recordSale(s, it.p, it.q); }
    if (items) {
      M.eco.earn(total, 'delivery', s.id); s.day.sales += total; s.day.items += items; s.day.deliv = (s.day.deliv || 0) + 1;
      M.S.xp += total * 0.02; s.life.sales += total;
      M.bus.emit('sale', { store: s, total, items, delivery: true });
    }
    a.deliv = null; a.carry = null; a.st = 'back';
    const t = P().edge(s); a.x = t[0] + 0.5; a.y = t[1] + 0.5;
    if (!goDock(s, a)) a.st = 'idle';
  }

  // repositor/estoquista: pega mercadoria e leva aonde precisa
  function stocker(s, e, a, arrived, dt, eff, dockFirst) {
    const carryCap = Math.round((dockFirst ? 22 : 12) + (dockFirst ? 22 : 14) * e.sk.org * eff);
    if (a.st === 'busy') { a.t -= dt * eff; a.moving = false; if (a.t > 0) return; a.st = a.next; }
    if (a.st === 'toDock' && arrived) {
      const n = M.inv.unload(s, carryCap);
      if (n > 0) { a.carry = { p: null, q: n, box: true }; a.st = 'busy'; a.t = 0.6; a.next = 'storeDock'; goStorage(s, a); }
      else a.st = 'idle';
      return;
    }
    if (a.st === 'storeDock') { if (arrived) { a.carry = null; a.st = 'busy'; a.t = 0.5; a.next = 'idle'; } return; }
    if (a.st === 'toStorage' && arrived) {
      const r = a.res;
      if (!r || !r.o.slots || !s.objs.includes(r.o) || !r.o.slots[r.i].p) { if (r) r.o.slots[r.i]._res = 0; a.res = null; a.st = 'idle'; return; }
      const sl = r.o.slots[r.i], need = M.inv.slotCap(r.o, sl.p) - sl.q;
      const n = M.inv.removeStorage(s, sl.p, Math.min(need, carryCap), true);
      if (n <= 0) { sl._res = 0; a.res = null; a.st = 'idle'; return; }
      a.carry = { p: sl.p, q: n, box: true }; a.st = 'busy'; a.t = 0.5; a.next = 'toShelf';
      if (!goObj(s, a, r.o)) { M.inv.addStorage(s, sl.p, n); a.carry = null; sl._res = 0; a.res = null; a.st = 'idle'; }
      return;
    }
    if (a.st === 'toShelf' && arrived) {
      const r = a.res;
      if (r && s.objs.includes(r.o)) {
        const sl = r.o.slots[r.i];
        sl._res = 0;
        if (sl.p === a.carry.p) {
          const n = Math.min(a.carry.q, M.inv.slotCap(r.o, sl.p) - sl.q);
          sl.q += n; a.carry.q -= n;
          M.S.td.restock += n;
          if (n > 0 && s.id === M.S.curId && M.fx) M.fx.pop(s, r.o);
        }
      }
      if (a.carry && a.carry.q > 0) { s.storage[a.carry.p] = (s.storage[a.carry.p] || 0) + a.carry.q; }
      a.carry = null; a.res = null; a.st = 'busy'; a.t = 0.7; a.next = 'idle';
      return;
    }
    if (a.st === 'idle' || a.st === 'arrive') {
      if (a.st === 'arrive' && !arrived) return;
      const dockQ = M.inv.dockQty(s);
      if ((dockFirst || !s.emps.some((x) => x.role === 'estoquista' && x._a)) && dockQ > 0 && M.inv.free(s) > 0) { a.st = 'toDock'; if (!goDock(s, a)) a.st = 'idle'; return; }
      const needs = M.inv.needs(s, dockFirst ? 0.35 : 0.6).filter((n) => !n.o.slots[n.i]._res).sort((x, y) => x.ratio - y.ratio);
      if (needs.length) {
        const n = needs[0]; n.o.slots[n.i]._res = e.id; a.res = n; a.st = 'toStorage';
        if (!goStorage(s, a)) { n.o.slots[n.i]._res = 0; a.res = null; a.st = 'idle'; }
        return;
      }
      a.st = 'wait'; a.t = U.rnd(2, 5); wander(s, a);
      return;
    }
    if (a.st === 'wait') { a.t -= dt; if (a.t <= 0 || arrived) { if (a.t <= 0) a.st = 'idle'; else if (arrived) a.st = 'idle'; } }
  }
})();
