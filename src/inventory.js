/* Estoque: depósito, prateleiras (slots), doca de recebimento, lotes com validade (FIFO). */
(function () {
  'use strict';
  const M = window.MST;
  const I = (M.inv = {});

  I.cap = function (s) {
    let c = s.type === 'cd' ? 800 : { P: 80, M: 110, G: 220, XG: 360 }[s.size] || 80;
    for (const o of s.objs) { const d = M.BUILD[o.t]; if (d.store) c += d.store * (s.type === 'cd' ? 2.5 : 1); }
    return Math.round(c);
  };
  I.used = function (s) { let u = 0; for (const k in s.storage) u += s.storage[k]; return u; };
  I.free = (s) => Math.max(0, I.cap(s) - I.used(s));
  I.slotCap = function (o, pid) {
    const d = M.BUILD[o.t], p = M.P[pid];
    return Math.max(1, Math.round(d.cap * (p ? p.bulk : 1)));
  };
  I.shelfQty = function (s, pid) {
    let q = 0;
    for (const o of s.objs) if (o.slots) for (const sl of o.slots) if (sl.p === pid) q += sl.q;
    return q;
  };
  I.total = (s, pid) => (s.storage[pid] || 0) + I.shelfQty(s, pid);
  I.dockQty = (s) => { let q = 0; for (const d of s.dock) q += d.q; return q; };
  I.listed = function (s) { // produtos atribuídos a algum slot
    const set = {};
    for (const o of s.objs) if (o.slots) for (const sl of o.slots) if (sl.p) set[sl.p] = (set[sl.p] || 0) + sl.q;
    return set;
  };

  function addBatch(s, pid, q, exp) {
    const p = M.P[pid];
    if (!p || !p.life) return;
    const b = (s.batches[pid] = s.batches[pid] || []);
    const e = exp || M.S.day + p.life;
    const last = b[b.length - 1];
    if (last && last.exp === e) last.q += q; else { b.push({ q, exp: e }); b.sort((a, c) => a.exp - c.exp); }
  }
  function consume(s, pid, n) {
    const b = s.batches[pid]; if (!b) return;
    while (n > 0 && b.length) { if (b[0].q <= n) { n -= b[0].q; b.shift(); } else { b[0].q -= n; n = 0; } }
    if (!b.length) delete s.batches[pid];
  }

  I.addStorage = function (s, pid, q, exp) {
    if (q <= 0) return;
    s.storage[pid] = (s.storage[pid] || 0) + q;
    addBatch(s, pid, q, exp);
  };
  I.removeStorage = function (s, pid, q, keepBatch) {
    const have = s.storage[pid] || 0; q = Math.min(q, have);
    if (q <= 0) return 0;
    s.storage[pid] = have - q;
    if (s.storage[pid] <= 0) delete s.storage[pid];
    if (!keepBatch) consume(s, pid, q);
    return q;
  };
  I.nextExpiry = function (s, pid) { const b = s.batches[pid]; return b && b.length ? b[0].exp : 0; };

  // depósito → slot. retorna unidades movidas
  I.restock = function (s, o, i, max) {
    const sl = o.slots[i]; if (!sl || !sl.p) return 0;
    const cap = I.slotCap(o, sl.p);
    let n = Math.min(cap - sl.q, s.storage[sl.p] || 0);
    if (max != null) n = Math.min(n, max);
    if (n <= 0) return 0;
    I.removeStorage(s, sl.p, n, true);
    sl.q += n;
    return n;
  };
  I.restockObj = function (s, o) { let n = 0; if (o.slots) for (let i = 0; i < o.slots.length; i++) n += I.restock(s, o, i); return n; };

  // venda/retirada de um slot
  I.take = function (s, o, i, n) {
    const sl = o.slots[i]; if (!sl || !sl.p) return 0;
    n = Math.min(n, sl.q); if (n <= 0) return 0;
    sl.q -= n; consume(s, sl.p, n);
    return n;
  };

  // troca o produto de um slot (devolve o que havia ao depósito)
  I.assign = function (s, o, i, pid) {
    const sl = o.slots[i]; if (!sl) return;
    if (sl.p && sl.q > 0) { s.storage[sl.p] = (s.storage[sl.p] || 0) + sl.q; }
    sl.p = pid || null; sl.q = 0;
  };
  I.canHold = function (o, pid) {
    const d = M.BUILD[o.t], p = M.P[pid];
    return !!(d && p && d.fix === p.fix);
  };

  // encontra slots com o produto em estoque
  I.findSlots = function (s, pid, needStock) {
    const out = [];
    for (const o of s.objs) if (o.slots) for (let i = 0; i < o.slots.length; i++) { const sl = o.slots[i]; if (sl.p === pid && (!needStock || sl.q > 0)) out.push({ o, i }); }
    return out;
  };

  // remove produtos vencidos (chamado na abertura do dia). retorna [{pid,q}]
  I.expire = function (s, day) {
    const lost = [];
    for (const pid in s.batches) {
      const b = s.batches[pid]; let q = 0;
      while (b.length && b[0].exp <= day) { q += b[0].q; b.shift(); }
      if (!b.length) delete s.batches[pid];
      if (q <= 0) continue;
      let rem = q;
      const st = Math.min(rem, s.storage[pid] || 0);
      if (st > 0) { s.storage[pid] -= st; if (s.storage[pid] <= 0) delete s.storage[pid]; rem -= st; }
      if (rem > 0) for (const o of s.objs) if (o.slots) for (const sl of o.slots) if (sl.p === pid && rem > 0) { const t = Math.min(rem, sl.q); sl.q -= t; rem -= t; }
      if (q - rem > 0) lost.push({ p: pid, q: q - rem });
    }
    return lost;
  };

  I.discard = function (s, pid, q) { return I.removeStorage(s, pid, q); };

  // doca → depósito (respeita capacidade). retorna unidades movidas
  I.unload = function (s, max) {
    let moved = 0, free = I.free(s);
    while (max > 0 && free > 0 && s.dock.length) {
      const d = s.dock[0], n = Math.min(d.q, max, free);
      I.addStorage(s, d.p, n, d.exp);
      d.q -= n; max -= n; free -= n; moved += n;
      if (d.q <= 0) s.dock.shift();
    }
    return moved;
  };

  // valor do estoque a preço de custo
  I.value = function (s) {
    let v = 0;
    for (const k in s.storage) v += s.storage[k] * M.P[k].cost;
    for (const o of s.objs) if (o.slots) for (const sl of o.slots) if (sl.p) v += sl.q * M.P[sl.p].cost;
    return v;
  };

  // slots que precisam de reposição e têm estoque no depósito
  I.needs = function (s, thr) {
    const out = [];
    for (const o of s.objs) if (o.slots) for (let i = 0; i < o.slots.length; i++) {
      const sl = o.slots[i]; if (!sl.p) continue;
      const cap = I.slotCap(o, sl.p);
      if (sl.q <= cap * thr && (s.storage[sl.p] || 0) > 0) out.push({ o, i, ratio: sl.q / cap });
    }
    return out;
  };
})();
