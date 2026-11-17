/* Renderização da loja em visão top-down 3/4: piso em cache, paredes com volume, expositores com
   mercadorias visíveis, personagens ordenados por profundidade, caminhões, iluminação dia/noite e
   sobreposições do modo construção. */
(function () {
  'use strict';
  const M = window.MST, U = M.U, G = () => M.gfx;
  const R = (M.render = {});
  const T = 32, MX = 5, MT = 4, MB = 6, WALL_H = 20, FRONT_H = 11;
  R.T = T;

  // ---------- fundo estático (piso, calçada, rua, estacionamento) ----------
  const FLOOR_DRAW = {
    1(c, x, y, i) { c.fillStyle = '#eceff1'; c.fillRect(x, y, T, T); c.fillStyle = (i & 1) ? 'rgba(0,0,0,.025)' : 'rgba(255,255,255,.4)'; c.fillRect(x + 1, y + 1, T - 2, T - 2); c.fillStyle = 'rgba(120,130,140,.28)'; c.fillRect(x, y, T, 1); c.fillRect(x, y, 1, T); },
    2(c, x, y, i) { c.fillStyle = '#c3c8cd'; c.fillRect(x, y, T, T); const h = U.hash('c' + i); c.fillStyle = 'rgba(0,0,0,.05)'; for (let k = 0; k < 5; k++) c.fillRect(x + ((h >> (k * 3)) % 30), y + ((h >> (k * 4 + 1)) % 30), 2, 2); if (i % 3 === 0) { c.fillStyle = 'rgba(0,0,0,.06)'; c.fillRect(x, y, T, 1); } },
    3(c, x, y, i, tx, ty) { c.fillStyle = '#c4935f'; c.fillRect(x, y, T, T); for (let k = 0; k < 4; k++) { c.fillStyle = (tx + k + ty * 3) % 3 ? 'rgba(120,70,30,.12)' : 'rgba(255,240,210,.12)'; c.fillRect(x, y + k * 8, T, 8); c.fillStyle = 'rgba(90,50,20,.3)'; c.fillRect(x, y + k * 8 + 7, T, 1); c.fillRect(x + ((tx * 13 + k * 11) % 32), y + k * 8, 1, 7); } },
    4(c, x, y, i, tx, ty) { c.fillStyle = (tx + ty) & 1 ? '#2f343b' : '#f1f3f5'; c.fillRect(x, y, T, T); c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(x + 2, y + 2, T - 4, 4); },
    5(c, x, y, i) { c.fillStyle = '#3a56c9'; c.fillRect(x, y, T, T); const h = U.hash('k' + i); c.fillStyle = 'rgba(255,255,255,.05)'; for (let k = 0; k < 8; k++) c.fillRect(x + ((h >> k) % 31), y + ((h >> (k + 3)) % 31), 1, 1); },
    6(c, x, y, i, tx, ty) { c.fillStyle = '#454b54'; c.fillRect(x, y, T, T); if (!(tx & 1) && !(ty & 1)) { c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(x + 3, y + 3, T * 2 - 6, 3); } c.fillStyle = 'rgba(0,0,0,.25)'; if (!(tx & 1)) c.fillRect(x, y, 1, T); if (!(ty & 1)) c.fillRect(x, y, T, 1); },
    7(c, x, y, i, tx, ty) { c.fillStyle = '#f3f1ee'; c.fillRect(x, y, T, T); const h = U.hash('m' + tx + ',' + ty); c.strokeStyle = 'rgba(150,140,130,.25)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + (h % 32), y); c.quadraticCurveTo(x + 16, y + (h >> 4) % 32, x + ((h >> 8) % 32), y + T); c.stroke(); c.fillStyle = 'rgba(180,170,160,.22)'; c.fillRect(x, y, T, 1); c.fillRect(x, y, 1, T); },
  };

  function buildBg(s) {
    const q = M.settings.quality, RS = q === 'alta' ? 1.5 : 1;
    const W = (s.gw + MX * 2) * T, H = (s.gh + MT + MB) * T;
    let cv = s._bgc;
    if (!cv || cv.width !== Math.round(W * RS) || cv.height !== Math.round(H * RS)) { cv = document.createElement('canvas'); cv.width = Math.round(W * RS); cv.height = Math.round(H * RS); }
    const c = cv.getContext('2d');
    c.setTransform(RS, 0, 0, RS, MX * T * RS, MT * T * RS);
    const top = s.gh - s.ownH, side = s.gh - M.C.SIDE;
    // grama e vizinhança
    c.fillStyle = '#86b468'; c.fillRect(-MX * T, -MT * T, W, H);
    const rng = U.mulberry(s.id * 977 + 13);
    for (let i = 0; i < 26; i++) { c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(-MX * T + rng() * W, -MT * T + rng() * (H - MB * T), 6, 3); }
    // lote: estacionamento na área ainda não construída
    c.fillStyle = '#5d6271'; c.fillRect(0, 0, s.gw * T, side * T);
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2;
    for (let x = 1; x < s.gw; x += 2) { c.beginPath(); c.moveTo(x * T, 6); c.lineTo(x * T, T * 1.4); c.stroke(); }
    for (let x = 0; x < s.gw; x += 2) { const h = U.hash(s.id + 'car' + x); if (h % 3 === 0 && (x >= s.ownW || top > 2)) M.world.carTop(c, x * T + T, T * 0.75 + 2, ['#e03131', '#1971c2', '#f8f9fa', '#212529', '#fab005'][h % 5], true); }
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, 0, s.gw * T, 3);
    // muretas do lote
    c.fillStyle = '#9aa0a6'; c.fillRect(-4, -4, 4, side * T + 4); c.fillRect(s.gw * T, -4, 4, side * T + 4); c.fillRect(-4, -4, s.gw * T + 8, 4);
    // árvores e cercas vivas na vizinhança
    for (let y = -MT + 1; y < side; y += 3) { M.world.tree(c, -MX * T + 40 + (y * 7 % 3) * 10, y * T + 30, 0.9, rng()); M.world.tree(c, (s.gw + 2.4) * T + (y * 5 % 3) * 10, y * T + 30, 0.9, rng()); }
    // calçada
    for (let y = side; y < s.gh; y++) for (let x = -MX; x < s.gw + MX; x++) {
      c.fillStyle = (x + y) & 1 ? '#d4cfc4' : '#cdc8bc'; c.fillRect(x * T, y * T, T, T);
      c.fillStyle = 'rgba(0,0,0,.07)'; c.fillRect(x * T, y * T, T, 1); c.fillRect(x * T, y * T, 1, T);
    }
    c.fillStyle = '#a8a294'; c.fillRect(-MX * T, s.gh * T - 4, W, 4);
    // rua
    c.fillStyle = '#3b404d'; c.fillRect(-MX * T, s.gh * T, W, 4 * T);
    c.fillStyle = '#f2c94c'; for (let x = -MX * T; x < (s.gw + MX) * T; x += 40) c.fillRect(x, s.gh * T + 2 * T - 2, 22, 3);
    c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(-MX * T, s.gh * T + 4 * T - 6, W, 2);
    c.fillStyle = '#86b468'; c.fillRect(-MX * T, (s.gh + 4) * T, W, (MB - 4) * T);
    for (let x = -MX + 1; x < s.gw + MX; x += 4) M.world.tree(c, x * T + 16, (s.gh + 5) * T + 26, 0.85, rng());
    // pisos internos
    for (let y = top; y < side; y++) for (let x = 0; x < s.ownW; x++) {
      const i = y * s.gw + x, f = s.floor[i];
      if (!f) { if (y >= top && x < s.ownW) { c.fillStyle = '#8a8f98'; c.fillRect(x * T, y * T, T, T); } continue; }
      FLOOR_DRAW[f](c, x * T, y * T, i, x, y);
    }
    // oclusão ambiente junto às paredes
    for (let y = top; y < side; y++) for (let x = 0; x < s.ownW; x++) {
      const i = y * s.gw + x; if (s.wall[i] || !s.floor[i]) continue;
      if (y > 0 && s.wall[i - s.gw] === 1) { const g = c.createLinearGradient(0, y * T, 0, y * T + 12); g.addColorStop(0, 'rgba(0,0,0,.22)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x * T, y * T, T, 12); }
      if (x > 0 && s.wall[i - 1] === 1) { const g = c.createLinearGradient(x * T, 0, x * T + 8, 0); g.addColorStop(0, 'rgba(0,0,0,.14)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x * T, y * T, 8, T); }
    }
    // capacho nas portas
    for (const d of s._doors) { const x = d % s.gw, y = (d / s.gw) | 0; c.fillStyle = '#5f4b3b'; G().rr(c, x * T + 2, (y + 1) * T + 3, T - 4, T - 10, 3); c.fill(); }
    c.setTransform(1, 0, 0, 1, 0, 0);
    s._bgc = cv; s._bgRS = RS; s._floorDirty = false; s._bgQ = q;
  }

  // ---------- objetos ----------
  function shadow(c, x, y, w, h) { c.fillStyle = 'rgba(0,0,0,.2)'; G().rr(c, x + 3, y + 4, w, h, 4); c.fill(); }
  function block(c, x, y, w, h, hgt, top, front, rad) {
    shadow(c, x, y, w, h);
    c.fillStyle = front; G().rr(c, x, y + h - hgt - 2, w, hgt + 2, rad || 3); c.fill();
    c.fillStyle = top; G().rr(c, x, y - hgt, w, h, rad || 3); c.fill();
    c.strokeStyle = 'rgba(20,24,38,.35)'; c.lineWidth = 1; G().rr(c, x + 0.5, y - hgt + 0.5, w - 1, h + hgt - 1, rad || 3); c.stroke();
  }
  const fp = (o) => M.path.footprint(o);

  function slotRects(o, x, y, w, h, n) { // divide o tampo ao longo do eixo maior
    const out = [], horiz = w >= h;
    for (let i = 0; i < n; i++) out.push(horiz ? [x + (i * w) / n, y, w / n, h] : [x, y + (i * h) / n, w, h / n]);
    return { out, horiz };
  }
  function drawProducts(c, o, x, y, w, h, cap, iconS, rows) {
    const d = M.BUILD[o.t], sr = slotRects(o, x, y, w, h, d.slots);
    for (let i = 0; i < d.slots; i++) {
      const sl = o.slots[i], r = sr.out[i];
      if (!sl.p) { c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(r[0] + 2, r[1] + 2, r[2] - 4, r[3] - 4); continue; }
      const cp = M.inv.slotCap(o, sl.p), k = sl.q / cp;
      const n = sl.q <= 0 ? 0 : k > 0.66 ? 3 : k > 0.33 ? 2 : 1;
      if (!n) { c.strokeStyle = 'rgba(224,49,49,.55)'; c.lineWidth = 1.5; c.setLineDash([3, 2]); c.strokeRect(r[0] + 2.5, r[1] + 2.5, r[2] - 5, r[3] - 5); c.setLineDash([]); continue; }
      for (let k2 = 0; k2 < Math.min(n, rows.length); k2++) {
        const pr = rows[k2];
        const cx = sr.horiz ? r[0] + r[2] / 2 : r[0] + r[2] * pr, cy = sr.horiz ? r[1] + r[3] * pr : r[1] + r[3] / 2;
        M.sprites.draw(c, sl.p, cx, cy, iconS);
      }
    }
    // etiquetas de preço na borda frontal
    for (let i = 0; i < d.slots; i++) {
      const sl = o.slots[i], r = sr.out[i]; if (!sl.p) continue;
      c.fillStyle = M.eco.promo(M.P[sl.p].cat) ? '#ffd43b' : '#fff';
      if (sr.horiz) c.fillRect(r[0] + r[2] / 2 - 4, r[1] + r[3] - 3, 8, 3); else c.fillRect(r[0] + r[2] - 3, r[1] + r[3] / 2 - 4, 3, 8);
    }
  }

  const DRAW = {
    prateleira(c, o, x, y, w, h) {
      block(c, x + 1, y + 2, w - 2, h - 4, 12, '#e9ecef', '#8f99a3');
      c.fillStyle = '#ced4da'; c.fillRect(x + 3, y - 10 + (h - 4) / 2 - 1 + 2, w - 6, 2);
      drawProducts(c, o, x + 2, y + 2 - 12, w - 4, h - 4, 0, w >= h ? 12 : 12, [0.27, 0.73, 0.5]);
    },
    gondola(c, o, x, y, w, h) {
      block(c, x + 1, y + 1, w - 2, h - 2, 15, '#f1f3f5', '#4c6ef5');
      c.fillStyle = '#364fc7'; if (w >= h) c.fillRect(x + 1, y + h / 2 - 15, w - 2, 2); else c.fillRect(x + w / 2 - 1, y - 14, 2, h - 2);
      drawProducts(c, o, x + 2, y + 1 - 15, w - 4, h - 2, 0, 13, [0.25, 0.75, 0.5]);
    },
    geladeira(c, o, x, y, w, h) {
      block(c, x + 1, y + 2, w - 2, h - 4, 22, '#f8f9fa', '#dee2e6');
      // vidro com produtos
      const gx = x + 3, gy = y + h - 4 - 20, gw = w - 6, gh = 18;
      c.fillStyle = '#d0ebff'; c.fillRect(gx, gy, gw, gh);
      const sr = slotRects(o, gx, gy, gw, gh, M.BUILD[o.t].slots);
      o.slots.forEach((sl, i) => { if (!sl.p || sl.q <= 0) return; const r = sr.out[i], k = sl.q / M.inv.slotCap(o, sl.p); const n = k > 0.5 ? 2 : 1; for (let j = 0; j < n; j++) M.sprites.draw(c, sl.p, sr.horiz ? r[0] + r[2] / 2 : r[0] + r[2] / 2, (sr.horiz ? r[1] : r[1]) + 5 + j * 8, 10); });
      c.fillStyle = 'rgba(165,216,255,.35)'; c.fillRect(gx, gy, gw, gh);
      c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(gx + 4, gy); c.lineTo(gx + 10, gy); c.lineTo(gx + 4, gy + gh); c.lineTo(gx - 2 + 4, gy + gh); c.fill();
      c.fillStyle = '#74c0fc'; c.fillRect(x + 3, y + 2 - 22 + 2, w - 6, 3);
      drawProducts(c, o, x + 3, y + 2 - 22 + 5, w - 6, h - 9, 0, 10, [0.5]);
    },
    banca(c, o, x, y, w, h) {
      block(c, x + 1, y + 3, w - 2, h - 5, 8, '#a87a4f', '#7b5232');
      c.strokeStyle = 'rgba(70,40,20,.4)'; c.lineWidth = 1; for (let k = 4; k < w - 2; k += 8) { c.beginPath(); c.moveTo(x + k, y + 3 + h - 5 - 8); c.lineTo(x + k, y + h - 2); c.stroke(); }
      c.fillStyle = '#2f9e44'; c.fillRect(x + 1, y - 6, w - 2, 3);
      drawProducts(c, o, x + 2, y + 3 - 8, w - 4, h - 5, 0, 13, [0.35, 0.7, 0.5]);
    },
    arara(c, o, x, y, w, h) {
      shadow(c, x + 2, y + 6, w - 4, h - 10);
      c.fillStyle = '#868e96'; c.fillRect(x + 3, y + h - 8, 3, 6); c.fillRect(x + w - 6, y + h - 8, 3, 6);
      c.strokeStyle = '#495057'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 4, y + 2); c.lineTo(x + w - 4, y + 2); c.stroke();
      const sr = slotRects(o, x + 4, y - 4, w - 8, h, M.BUILD[o.t].slots);
      o.slots.forEach((sl, i) => { if (!sl.p || sl.q <= 0) return; const r = sr.out[i], n = Math.min(3, Math.ceil(sl.q / M.inv.slotCap(o, sl.p) * 3)); for (let j = 0; j < n; j++) M.sprites.draw(c, sl.p, r[0] + r[2] * (0.25 + j * 0.25), y + 12, 16); });
      c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 4, y + 1); c.lineTo(x + w - 4, y + 1); c.stroke();
    },
    vitrine(c, o, x, y, w, h) {
      block(c, x + 1, y + 2, w - 2, h - 4, 12, '#3b2f45', '#d4af37');
      c.fillStyle = '#5c3d6e'; c.fillRect(x + 4, y - 7, w - 8, h - 10);
      drawProducts(c, o, x + 4, y + 2 - 12, w - 8, h - 4, 0, 13, [0.5]);
      c.fillStyle = 'rgba(200,230,255,.25)'; c.fillRect(x + 2, y - 9, w - 4, h - 6);
      c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(x + 6, y - 9, 3, h - 6);
    },
    palete(c, o, x, y, w, h) {
      shadow(c, x + 3, y + 3, w - 6, h - 6);
      c.fillStyle = '#c49a6c'; for (let k = 0; k < 5; k++) c.fillRect(x + 4, y + 4 + k * (h - 8) / 5, w - 8, (h - 8) / 5 - 3);
      c.fillStyle = '#9c7448'; c.fillRect(x + 4, y + h / 2 - 2, w - 8, 4);
      o.slots.forEach((sl, i) => { if (!sl.p || sl.q <= 0) return; const cx = x + (w * (i + 0.5)) / o.slots.length, cy = y + h / 2 - 6; c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(cx + 2, cy + 18, 18, 6, 0, 0, 6.283); c.fill(); M.sprites.draw(c, sl.p, cx, cy, 34); if (sl.q > 1) { c.font = '800 10px Nunito, system-ui'; c.fillStyle = '#fff'; c.strokeStyle = '#212529'; c.lineWidth = 3; c.textAlign = 'center'; c.strokeText('×' + sl.q, cx + 14, cy + 16); c.fillText('×' + sl.q, cx + 14, cy + 16); } });
    },
    caixa(c, o, x, y, w, h, s, t) {
      block(c, x + 1, y + 3, w - 2, h - 6, 11, '#495057', '#343a40');
      const horiz = w >= h, sp = M.build.spots(s, o);
      const busy = o._q && o._q.length && o._q[0].qi === 0 && !o._q[0].path && M.cust.operator(s, o);
      // esteira
      const bx = x + 5, by = y + 3 - 11 + 4, bw = horiz ? w - 26 : w - 10, bh = horiz ? h - 14 : h - 26;
      c.fillStyle = '#1f2329'; c.fillRect(bx, by, bw, bh);
      c.fillStyle = 'rgba(255,255,255,.12)'; const off = busy ? (t * 30) % 8 : 0;
      if (horiz) for (let k = -8; k < bw; k += 8) { const xx = bx + k + off; if (xx > bx && xx < bx + bw - 2) c.fillRect(xx, by, 2, bh); }
      else for (let k = -8; k < bh; k += 8) { const yy = by + k + off; if (yy > by && yy < by + bh - 2) c.fillRect(bx, yy, bw, 2); }
      // registradora próxima ao operador
      const rx = (sp.cashier[0] + 0.5) * T, ry = (sp.cashier[1] + 0.5) * T;
      const cx = U.clamp(rx, x + 10, x + w - 10), cy = U.clamp(ry, y - 6, y + h - 16);
      G().box(c, cx - 8, cy - 7, 16, 12, 2, '#f1f3f5'); c.fillStyle = busy ? '#69db7c' : '#2b8a3e'; c.fillRect(cx - 6, cy - 5, 12, 6);
      // número do caixa
      const num = s.objs.filter((q) => M.BUILD[q.t].kind === 'checkout').indexOf(o) + 1;
      const lx = x + (horiz ? 4 : w / 2), ly = y - 22;
      c.fillStyle = '#868e96'; c.fillRect(lx - 1, ly, 2, 12);
      G().rr(c, lx - 8, ly - 12, 16, 13, 3); c.fillStyle = o._op ? '#40c057' : '#fa5252'; c.fill();
      c.fillStyle = '#fff'; c.font = '900 9px Nunito, system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(num), lx, ly - 5.5);
    },
    self(c, o, x, y, w, h, s, t) {
      block(c, x + 4, y + 6, w - 8, h - 10, 20, '#e9ecef', '#adb5bd');
      c.fillStyle = '#1c7ed6'; c.fillRect(x + 8, y - 11, w - 16, 10);
      c.fillStyle = 'rgba(255,255,255,' + (0.4 + Math.sin(t * 3) * 0.2) + ')'; c.fillRect(x + 10, y - 9, 6, 2);
    },
    estante(c, o, x, y, w, h, s) {
      block(c, x + 1, y + 1, w - 2, h - 2, 18, '#ced4da', '#1864ab', 2);
      c.fillStyle = '#f76707'; c.fillRect(x + 1, y + h - 2 - 18 + 6, w - 2, 3); c.fillRect(x + 1, y + h - 2 - 18 + 13, w - 2, 3);
      const used = M.inv.used(s), cap = Math.max(1, M.inv.cap(s)), n = Math.round(Math.min(1, used / cap) * 6 + (used > 0 ? 0.5 : 0));
      for (let k = 0; k < n; k++) { const bx = x + 4 + (k % 3) * ((w - 8) / 3), byy = y - 15 + Math.floor(k / 3) * ((h - 6) / 2); G().box(c, bx, byy, (w - 8) / 3 - 3, (h - 6) / 2 - 3, 1.5, k % 2 ? '#c79a5b' : '#d8ae6d'); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(bx + (w - 8) / 6 - 3, byy, 2, (h - 6) / 2 - 3); }
    },
    carrinhos(c, o, x, y, w, h) {
      shadow(c, x + 2, y + 6, w - 4, h - 10);
      c.fillStyle = '#adb5bd'; c.fillRect(x + 3, y + 4, w - 6, 3); c.fillRect(x + 3, y + h - 8, w - 6, 3);
      for (let k = 0; k < 4; k++) { G().rr(c, x + 6 + k * 9, y + 6, 16, h - 14, 2); c.fillStyle = '#e03131'; c.fill(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; c.stroke(); }
    },
    camera(c, o, x, y, w, h, s, t) {
      c.fillStyle = '#868e96'; c.fillRect(x + 14, y - 10, 4, 22); G().circ(c, x + 16, y - 12, 7, '#343a40');
      G().circ(c, x + 16, y - 12, 2.5, Math.sin(t * 4) > 0 ? '#ff6b6b' : '#c92a2a', true);
    },
    lixeira(c, o, x, y, w, h) { shadow(c, x + 9, y + 12, 14, 12); G().box(c, x + 9, y + 4, 14, 20, 3, '#2b8a3e'); c.fillStyle = '#237032'; c.fillRect(x + 8, y + 3, 16, 4); },
    info(c, o, x, y, w, h) {
      block(c, x + 1, y + 6, w - 2, h - 8, 13, '#fff4e6', '#e8590c');
      G().circ(c, x + w / 2, y - 14, 8, '#1c7ed6'); c.fillStyle = '#fff'; c.font = '900 11px Nunito, system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('i', x + w / 2, y - 13.5);
    },
    cafe(c, o, x, y, w, h, s, t) {
      block(c, x + 5, y + 6, w - 10, h - 10, 22, '#343a40', '#212529');
      c.fillStyle = '#ffa94d'; c.fillRect(x + 9, y - 12, w - 18, 4);
      for (let k = 0; k < 3; k++) { const a = (t * 0.8 + k / 3) % 1; c.fillStyle = 'rgba(255,255,255,' + (0.5 - a * 0.5) + ')'; c.beginPath(); c.arc(x + 16 + Math.sin((t + k) * 3) * 3, y - 18 - a * 16, 2 + a * 3, 0, 6.283); c.fill(); }
    },
    planta(c, o, x, y) { plant(c, x + 16, y + 26, 1, '#2f9e44'); },
    vaso(c, o, x, y) { c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x + 19, y + 28, 11, 4, 0, 0, 6.283); c.fill(); G().box(c, x + 9, y + 16, 14, 12, 3, '#d9480f'); for (let k = 0; k < 7; k++) { c.save(); c.translate(x + 16, y + 14); c.rotate(-1.4 + k * 0.47); c.fillStyle = k % 2 ? '#2b8a3e' : '#40c057'; c.beginPath(); c.ellipse(0, -11, 4, 13, 0, 0, 6.283); c.fill(); c.restore(); } },
    flores(c, o, x, y) { G().box(c, x + 3, y + 12, 26, 16, 3, '#8d5a34'); c.fillStyle = '#5c940d'; c.fillRect(x + 5, y + 12, 22, 6); const cols = ['#ff6b6b', '#ffd43b', '#f783ac', '#ffffff', '#cc5de8']; for (let k = 0; k < 7; k++) G().circ(c, x + 7 + (k * 7) % 20, y + 9 + (k % 3) * 3, 3, cols[k % 5], true); },
    arvore(c, o, x, y) { M.world.tree(c, x + 16, y + 26, 1, (o.x * 7 + o.y) % 10 / 10); },
    banco(c, o, x, y, w, h) { shadow(c, x + 4, y + 10, w - 8, h - 16); c.fillStyle = '#495057'; c.fillRect(x + 6, y + 18, 3, 8); c.fillRect(x + w - 9, y + 18, 3, 8); c.fillStyle = '#a0522d'; for (let k = 0; k < 3; k++) c.fillRect(x + 3, y + 6 + k * 5, w - 6, 4); },
    tapete(c, o, x, y, w, h) { G().rr(c, x + 3, y + 4, w - 6, h - 8, 4); c.fillStyle = '#c92a2a'; c.fill(); c.strokeStyle = '#ffd43b'; c.lineWidth = 2; G().rr(c, x + 6, y + 7, w - 12, h - 14, 3); c.stroke(); },
    luminaria(c, o, x, y) { c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x + 18, y + 27, 8, 3, 0, 0, 6.283); c.fill(); c.fillStyle = '#343a40'; c.fillRect(x + 14.5, y - 18, 3, 44); G().circ(c, x + 16, y - 20, 7, '#fff3bf'); },
    banner(c, o, x, y, w, h, s, t) { c.fillStyle = '#495057'; c.fillRect(x + 8, y - 16, 2, 42); c.fillRect(x + 22, y - 16, 2, 42); const wv = Math.sin(t * 2) * 1.5; c.fillStyle = '#e03131'; c.fillRect(x + 9, y - 16 + wv, 14, 24); c.fillStyle = '#ffd43b'; c.font = '900 6px Nunito, system-ui'; c.textAlign = 'center'; c.fillText('OFERTA', x + 16, y - 6 + wv); c.fillText('%', x + 16, y + 2 + wv); },
    som(c, o, x, y, w, h, s, t) { block(c, x + 8, y + 8, 16, 18, 16, '#343a40', '#212529'); G().circ(c, x + 16, y + 10, 5, '#495057'); if (M.S.speed > 0) { c.fillStyle = '#fff'; c.font = '900 10px Nunito, system-ui'; c.globalAlpha = 0.5 + Math.sin(t * 4) * 0.4; c.fillText('♪', x + 26, y - 6 - (t * 10) % 8); c.globalAlpha = 1; } },
    ar(c, o, x, y, w, h, s, t) { block(c, x + 3, y + 8, w - 6, h - 12, 18, '#f8f9fa', '#ced4da'); c.strokeStyle = '#adb5bd'; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x + 6, y - 6 + k * 3); c.lineTo(x + w - 6, y - 6 + k * 3); c.stroke(); } },
    aquario(c, o, x, y, w, h, s, t) {
      block(c, x + 2, y + 4, w - 4, h - 6, 20, '#1864ab', '#495057');
      c.fillStyle = '#339af0'; c.fillRect(x + 4, y + h - 2 - 22, w - 8, 18);
      for (let k = 0; k < 4; k++) { const fx = x + 8 + ((t * (10 + k * 6) + k * 20) % (w - 16)), fy = y + h - 18 - k * 3; c.fillStyle = ['#ff922b', '#ffd43b', '#ff6b6b', '#fff'][k]; c.beginPath(); c.ellipse(fx, fy, 3.5, 2, 0, 0, 6.283); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(x + 6, y + h - 22, 3, 16);
    },
    fonte(c, o, x, y, w, h, s, t) {
      shadow(c, x + 4, y + 6, w - 8, h - 10);
      G().ell(c, x + w / 2, y + h / 2 + 4, w / 2 - 4, h / 2 - 8, '#adb5bd'); G().ell(c, x + w / 2, y + h / 2 + 4, w / 2 - 9, h / 2 - 13, '#4dabf7', true);
      c.fillStyle = '#ced4da'; c.fillRect(x + w / 2 - 3, y + 8, 6, 22);
      for (let k = 0; k < 8; k++) { const a = (t + k / 8) % 1, ang = (k / 8) * 6.283; c.fillStyle = 'rgba(200,235,255,' + (1 - a) + ')'; c.beginPath(); c.arc(x + w / 2 + Math.cos(ang) * a * 18, y + 8 + a * a * 26 - a * 14 + Math.sin(ang) * a * 5, 2, 0, 6.283); c.fill(); }
    },
    estatua(c, o, x, y) { shadow(c, x + 6, y + 14, 20, 12); G().box(c, x + 6, y + 14, 20, 14, 2, '#868e96'); G().circ(c, x + 16, y - 14, 6, '#fcc419'); G().box(c, x + 10, y - 9, 12, 24, 4, '#fab005'); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(x + 12, y - 7, 2, 18); },
  };
  function plant(c, x, y, s, col) {
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x + 2, y + 2, 10 * s, 4 * s, 0, 0, 6.283); c.fill();
    G().box(c, x - 7 * s, y - 10 * s, 14 * s, 11 * s, 3, '#e8590c');
    for (let k = 0; k < 6; k++) { c.save(); c.translate(x, y - 10 * s); c.rotate(-1.2 + k * 0.48); c.fillStyle = k % 2 ? col : U.shade(col, 0.2); c.beginPath(); c.ellipse(0, -8 * s, 4 * s, 9 * s, 0, 0, 6.283); c.fill(); c.restore(); }
  }

  function drawObj(c, s, o, t, ghost) {
    const f = fp(o), x = o.x * T, y = o.y * T, w = f[0] * T, h = f[1] * T;
    const fn = DRAW[o.t] || DRAW.planta;
    let sc = 1;
    if (o._b) { const k = (t - o._b) / 0.45; if (k < 1) sc = 0.55 + 0.45 * (1 - Math.pow(1 - k, 3)) + Math.sin(k * Math.PI) * 0.12; else o._b = 0; }
    if (sc !== 1) { c.save(); c.translate(x + w / 2, y + h); c.scale(sc, sc); c.translate(-(x + w / 2), -(y + h)); }
    fn(c, o, x, y, w, h, s, t);
    if (sc !== 1) c.restore();
  }
  R.drawObj = drawObj; R.DRAW = DRAW; R.FLOOR_DRAW = FLOOR_DRAW;

  // ---------- paredes ----------
  function wallTile(c, s, i, t, facadeCol) {
    const x = i % s.gw, y = (i / s.gw) | 0, px = x * T, py = y * T, wv = s.wall[i];
    const bot = s.gh - M.C.SIDE - 1, facade = y === bot;
    const H = facade ? FRONT_H : WALL_H;
    const below = y + 1 < s.gh ? s.wall[i + s.gw] : 0;
    if (wv === 2) { // porta automática
      const op = s._door && s._door[i] || 0;
      c.fillStyle = '#495057'; c.fillRect(px, py + T - H - 14, 4, H + 14); c.fillRect(px + T - 4, py + T - H - 14, 4, H + 14); c.fillRect(px, py + T - H - 16, T, 4);
      c.fillStyle = 'rgba(165,216,255,.55)'; const pw = (T - 8) / 2 * (1 - op);
      c.fillRect(px + 4, py + T - H - 12, pw, H + 12); c.fillRect(px + T - 4 - pw, py + T - H - 12, pw, H + 12);
      c.fillStyle = 'rgba(255,255,255,.6)'; if (pw > 3) { c.fillRect(px + 6, py + T - H - 10, 2, H + 6); c.fillRect(px + T - 4 - pw + 2, py + T - H - 10, 2, H + 6); }
      return;
    }
    const topCol = facade ? U.shade(facadeCol, 0.25) : '#e3e6ea', frontCol = facade ? facadeCol : '#b9c0c9';
    c.fillStyle = topCol; c.fillRect(px, py - H, T, T);
    c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(px, py - H, T, 1);
    if (!below || below === 2 || facade) {
      c.fillStyle = frontCol; c.fillRect(px, py + T - H, T, H);
      c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(px, py + T - H, T, 2);
      if (!facade) { c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(px, py + T - 4, T, 4); }
    }
    if (wv === 3) { // janela
      c.fillStyle = 'rgba(140,200,255,.7)'; c.fillRect(px + 3, py - H + 4, T - 6, T - 8);
      c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(px + 6, py - H + 6, 4, T - 12);
      if (!below || facade) { c.fillStyle = M.game.darkness() > 0.3 ? 'rgba(255,230,150,.85)' : 'rgba(120,180,230,.85)'; c.fillRect(px + 4, py + T - H + 2, T - 8, H - 4); }
    }
  }

  function facadeSign(c, s, t) {
    const F = M.FACADE, bot = s.gh - M.C.SIDE - 1, col = F.color[s.facade.color].c;
    const signW = Math.min(s.ownW - 2, Math.max(6, Math.round(s.name.length * 0.33) + 2)) * T, sx = (s.ownW * T - signW) / 2, sy = (bot + 1) * T - FRONT_H - 18;
    // toldo
    if (s.facade.awning) {
      const prem = s.facade.awning === 2;
      for (let x = 1; x < s.ownW - 1; x++) { const k = s.gw * bot + x; if (s.wall[k] === 2) continue; c.fillStyle = (x & 1) ? (prem ? '#1c7ed6' : '#e03131') : '#f8f9fa'; c.fillRect(x * T, (bot + 1) * T, T, 9); }
      c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(T, (bot + 1) * T + 9, (s.ownW - 2) * T, 3);
    }
    const lvl = s.facade.sign, night = M.game.darkness();
    G().rr(c, sx, sy, signW, 18, 4); c.fillStyle = lvl === 2 ? '#141824' : lvl === 1 ? '#f8f9fa' : U.shade(col, -0.3); c.fill();
    c.strokeStyle = M.S.brand || '#f59f00'; c.lineWidth = 2; c.stroke();
    c.font = '900 12px "Baloo 2", Nunito, system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
    let tc = lvl === 1 ? '#212529' : '#fff';
    if (lvl === 2) { const hue = (t * 40) % 360; tc = 'hsl(' + hue + ',90%,65%)'; c.shadowColor = tc; c.shadowBlur = 10 + night * 10; }
    else if (lvl === 1 && night > 0.3) { c.shadowColor = '#fff3bf'; c.shadowBlur = 8; }
    c.fillStyle = tc; c.fillText(s.name.toUpperCase(), sx + signW / 2, sy + 9.5);
    c.shadowBlur = 0;
  }

  // ---------- caminhão ----------
  function truck(c, s, tr, t) {
    const x = tr.x * T, y = (s.gh + 1.5) * T;
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x - 58, y + 14, 104, 10);
    // carroceria
    G().box(c, x - 60, y - 30, 74, 42, 3, '#f1f3f5');
    c.fillStyle = tr.color; c.fillRect(x - 60, y - 6, 74, 8);
    c.fillStyle = tr.color; c.font = '900 9px Nunito, system-ui'; c.textAlign = 'center'; c.fillText((M.SUP[tr.order.sup] || {}).name || '', x - 23, y - 14);
    // cabine (à direita, sentido da via)
    G().box(c, x + 14, y - 18, 26, 30, 5, tr.color);
    c.fillStyle = 'rgba(40,60,90,.85)'; c.fillRect(x + 28, y - 14, 10, 10);
    G().circ(c, x - 42, y + 14, 7, '#212529'); G().circ(c, x - 12, y + 14, 7, '#212529'); G().circ(c, x + 28, y + 14, 7, '#212529');
    if (tr.st === 'unload') {
      c.fillStyle = '#868e96'; c.fillRect(x - 66, y - 28, 6, 38);
      const n = tr.boxes, k = (tr.t % 2) / 2;
      for (let i = 0; i < Math.min(3, n); i++) { const bx = U.lerp(x - 70, x - 70, k), by = U.lerp(y - 10, (s.gh - 2) * T, ((k + i / 3) % 1)); G().box(c, bx - 6, by - 6, 12, 10, 1.5, '#c79a5b'); }
    }
    if (M.game.darkness() > 0.3) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x + 44, y, 0, x + 44, y, 60); g.addColorStop(0, 'rgba(255,240,180,.5)'); g.addColorStop(1, 'rgba(255,240,180,0)'); c.fillStyle = g; c.fillRect(x + 40, y - 40, 70, 80); c.restore(); }
  }

  // ---------- personagens ----------
  function drawCustomer(c, p) {
    M.sprites.person(c, p.x * T, p.y * T + 8, T, p.look, p.dir, p.ph, { moving: p.moving, carry: p.cart.length ? 'basket' : null, items: U.sum(p.cart, (i) => i.q) });
  }
  function drawEmp(c, e) {
    const a = e._a, L = M.sprites.ROLE_LOOK[e.role] || {};
    M.sprites.person(c, a.x * T, a.y * T + 8, T, e.look, a.dir, a.ph, { moving: a.moving, shirt: L.shirt, apron: L.apron, tie: L.tie, hat: L.hat, pants: L.pants, carry: a.carry ? 'box' : e.role === 'faxineiro' ? 'mop' : null });
  }
  function drawPlayer(c, t) {
    const P = M.player, L = M.sprites.ROLE_LOOK.jogador;
    M.sprites.person(c, P.x * T, P.y * T + 8, T, M.S.look, P.dir, P.ph, { moving: P.moving, shirt: L.shirt, pants: L.pants });
    const by = P.y * T - 46 + Math.sin(t * 4) * 2;
    c.fillStyle = '#ffd43b'; c.strokeStyle = '#1f2a44'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(P.x * T - 6, by - 6); c.lineTo(P.x * T + 6, by - 6); c.lineTo(P.x * T, by + 2); c.closePath(); c.fill(); c.stroke();
  }

  // ---------- quadro principal ----------
  let lightCv = null;
  R.draw = function (ctx, cam, vw, vh, t) {
    const s = M.game.store(); if (!s) return;
    if (!s._bgc || s._floorDirty || s._bgQ !== M.settings.quality) buildBg(s);
    const z = cam.z;
    ctx.fillStyle = '#86b468'; ctx.fillRect(0, 0, vw, vh);
    ctx.save();
    ctx.translate(Math.round(vw / 2), Math.round(vh / 2)); ctx.scale(z, z); ctx.translate(-cam.x, -cam.y);
    const x0 = cam.x - vw / 2 / z, y0 = cam.y - vh / 2 / z, x1 = cam.x + vw / 2 / z, y1 = cam.y + vh / 2 / z;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(s._bgc, -MX * T, -MT * T, s._bgc.width / s._bgRS, s._bgc.height / s._bgRS);
    const P = M.player;
    // portas automáticas
    s._door = s._door || {};
    for (const d of s._doors) {
      const dx = (d % s.gw) + 0.5, dy = ((d / s.gw) | 0) + 0.5; let near = U.dist(P.x, P.y, dx, dy) < 1.6;
      if (!near) for (const c of s._cust) if (Math.abs(c.x - dx) < 1.4 && Math.abs(c.y - dy) < 1.6) { near = true; break; }
      if (!near) for (const e of s.emps) if (e._a && !e._a.hidden && Math.abs(e._a.x - dx) < 1.4 && Math.abs(e._a.y - dy) < 1.6) { near = true; break; }
      s._door[d] = U.clamp((s._door[d] || 0) + (near ? 0.12 : -0.06), 0, 1);
    }
    // camada do piso: tapetes, sujeira, doca
    for (const o of s.objs) if (o.t === 'tapete') drawObj(ctx, s, o, t);
    for (const d of s.dirt) {
      const px = d.x * T, py = d.y * T;
      if (d.k === 0) { ctx.fillStyle = 'rgba(110,80,40,.35)'; ctx.beginPath(); ctx.ellipse(px, py, 7, 4, 0.3, 0, 6.283); ctx.fill(); }
      else if (d.k === 1) { ctx.fillStyle = '#f1f3f5'; ctx.save(); ctx.translate(px, py); ctx.rotate(0.6); ctx.fillRect(-4, -3, 8, 6); ctx.restore(); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.strokeRect(px - 4, py - 3, 8, 6); }
      else { ctx.fillStyle = 'rgba(160,200,240,.45)'; ctx.beginPath(); ctx.ellipse(px, py, 8, 5, 0, 0, 6.283); ctx.fill(); }
    }
    const dq = M.inv.dockQty(s);
    if (dq && s._doors.length) {
      const d = s._doors[0], bx = (d % s.gw + 1.2) * T, by = (s.gh - 2) * T + 6;
      const n = Math.min(9, Math.ceil(dq / 15));
      ctx.fillStyle = '#b08455'; ctx.fillRect(bx - 2, by + 14, 44, 8);
      for (let k = 0; k < n; k++) G().box(ctx, bx + (k % 3) * 14, by + 6 - Math.floor(k / 3) * 9, 13, 10, 1.5, k % 2 ? '#c79a5b' : '#d8ae6d');
    }
    // fila: marcações no chão
    for (const o of s.objs) if (M.BUILD[o.t].kind === 'checkout' || M.BUILD[o.t].kind === 'self') {
      const sp = M.build.spots(s, o); ctx.fillStyle = 'rgba(255,212,59,.35)';
      for (let k = 0; k < Math.min(4, sp.queue.length); k++) ctx.fillRect(sp.queue[k][0] * T - 9, sp.queue[k][1] * T + 10, 18, 3);
    }
    // lista ordenada por profundidade
    const list = [];
    const top = s.gh - s.ownH;
    for (let y = top; y < s.gh - M.C.SIDE; y++) for (let x = 0; x < s.ownW; x++) { const i = y * s.gw + x; if (s.wall[i]) { const py = y * T; if (py - 30 > y1 || py + T < y0 - 30 || x * T > x1 || (x + 1) * T < x0) continue; list.push({ k: y + 0.98, w: i }); } }
    for (const o of s.objs) { if (o.t === 'tapete') continue; const f = fp(o); list.push({ k: o.y + f[1] - 0.02, o }); }
    for (const c of s._cust) list.push({ k: c.y + 0.25, c });
    for (const e of s.emps) if (e._a && !e._a.hidden) list.push({ k: e._a.y + 0.25, e });
    if (P.store === s.id) list.push({ k: P.y + 0.26, p: 1 });
    for (const tr of s._trucks) list.push({ k: s.gh + 2, tr });
    list.sort((a, b) => a.k - b.k);
    const facadeCol = M.FACADE.color[s.facade.color].c;
    let signDrawn = false;
    const bot = s.gh - M.C.SIDE - 1;
    for (const it of list) {
      if (!signDrawn && it.k > bot + 1) { facadeSign(ctx, s, t); signDrawn = true; }
      if (it.w != null) wallTile(ctx, s, it.w, t, facadeCol);
      else if (it.o) drawObj(ctx, s, it.o, t);
      else if (it.c) drawCustomer(ctx, it.c);
      else if (it.e) drawEmp(ctx, it.e);
      else if (it.p) drawPlayer(ctx, t);
      else if (it.tr) truck(ctx, s, it.tr, t);
    }
    if (!signDrawn) facadeSign(ctx, s, t);
    // postes na calçada
    for (let x = -3; x < s.gw + 4; x += 7) { const px = x * T + 16, py = (s.gh - 1) * T + 28; ctx.fillStyle = '#495057'; ctx.fillRect(px - 1.5, py - 50, 3, 50); ctx.fillRect(px - 1.5, py - 50, 14, 3); G().circ(ctx, px + 12, py - 47, 4, '#fff3bf'); }
    M.fx.draw(ctx, T);
    // emoções e balões
    for (const c of s._cust) if (c.emo) M.sprites.emote(ctx, c.x * T, c.y * T + 8, T, c.emo.type, Math.min(1, c.emo.t * 2));
    if (z > 0.8) for (const o of s.objs) if (o._q && o._q.length > 2) { const sp = M.build.spots(s, o); const q = sp.queue[0]; ctx.font = '800 10px Nunito, system-ui'; ctx.fillStyle = 'rgba(20,22,34,.75)'; G().rr(ctx, q[0] * T + 10, q[1] * T - 40, 30, 15, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('👥' + o._q.length, q[0] * T + 25, q[1] * T - 32.5); }
    // hover
    const hv = M.R.hoverObj;
    if (hv && s.objs.includes(hv) && !M.build.st.on) { const f = fp(hv); ctx.strokeStyle = '#ffd43b'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.strokeRect(hv.x * T + 1, hv.y * T - 14, f[0] * T - 2, f[1] * T + 12); ctx.setLineDash([]); }
    if (M.build.st.on) buildOverlay(ctx, s, t);
    ctx.restore();
    lighting(ctx, s, cam, vw, vh, t);
  };

  function lighting(ctx, s, cam, vw, vh, t) {
    const q = M.settings.quality; if (q === 'baixa') return;
    const dk = M.game.darkness(), z = cam.z;
    const toS = (wx, wy) => [(wx - cam.x) * z + vw / 2, (wy - cam.y) * z + vh / 2];
    if (!lightCv) lightCv = document.createElement('canvas');
    if (lightCv.width !== vw || lightCv.height !== vh) { lightCv.width = vw; lightCv.height = vh; }
    const lc = lightCv.getContext('2d');
    if (dk > 0.02) {
      lc.globalCompositeOperation = 'source-over'; lc.clearRect(0, 0, vw, vh);
      lc.fillStyle = 'rgba(12,18,52,' + dk * 0.62 + ')'; lc.fillRect(0, 0, vw, vh);
      lc.globalCompositeOperation = 'destination-out';
      const top = s.gh - s.ownH, a = toS(0, top * T - WALL_H), b = toS(s.ownW * T, (s.gh - M.C.SIDE) * T);
      lc.fillStyle = 'rgba(0,0,0,.82)'; lc.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
      for (let x = -3; x < s.gw + 4; x += 7) { const p = toS(x * T + 28, (s.gh - 1) * T - 18); const g = lc.createRadialGradient(p[0], p[1] + 30 * z, 0, p[0], p[1] + 30 * z, 110 * z); g.addColorStop(0, 'rgba(0,0,0,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)'); lc.fillStyle = g; lc.fillRect(p[0] - 110 * z, p[1] - 80 * z, 220 * z, 220 * z); }
      lc.globalCompositeOperation = 'source-over';
      ctx.drawImage(lightCv, 0, 0);
    }
    // brilhos coloridos (geladeiras, vitrines, luminárias, caixas)
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const glowA = 0.1 + dk * 0.25;
    for (const o of s.objs) {
      const d = M.BUILD[o.t]; if (!d.light) continue;
      const f = fp(o), p = toS((o.x + f[0] / 2) * T, (o.y + f[1] / 2) * T - 10), r = (40 + f[0] * 16) * z;
      if (p[0] < -r || p[1] < -r || p[0] > vw + r || p[1] > vh + r) continue;
      const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); g.addColorStop(0, hexA(d.light, glowA)); g.addColorStop(1, hexA(d.light, 0));
      ctx.fillStyle = g; ctx.fillRect(p[0] - r, p[1] - r, r * 2, r * 2);
    }
    // luz de teto (qualidade alta)
    if (q === 'alta') {
      const top = s.gh - s.ownH;
      for (let y = top + 2; y < s.gh - M.C.SIDE - 1; y += 4) for (let x = 2; x < s.ownW - 1; x += 4) {
        const p = toS(x * T + 16, y * T + 16), r = 90 * z;
        if (p[0] < -r || p[1] < -r || p[0] > vw + r || p[1] > vh + r) continue;
        const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); g.addColorStop(0, 'rgba(255,244,214,' + (0.05 + dk * 0.07) + ')'); g.addColorStop(1, 'rgba(255,244,214,0)');
        ctx.fillStyle = g; ctx.fillRect(p[0] - r, p[1] - r, r * 2, r * 2);
      }
    }
    ctx.restore();
    if (q === 'alta') { // vinheta
      const g = ctx.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.45, vw / 2, vh / 2, Math.max(vw, vh) * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(10,12,30,.28)'); ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh);
    }
  }
  function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }

  // ---------- sobreposição de construção ----------
  function buildOverlay(c, s, t) {
    const B = M.build, st = B.st, top = s.gh - s.ownH, side = s.gh - M.C.SIDE;
    c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1;
    if (M.settings.showGrid) {
      c.beginPath();
      for (let x = 0; x <= s.ownW; x++) { c.moveTo(x * T, top * T); c.lineTo(x * T, side * T); }
      for (let y = top; y <= side; y++) { c.moveTo(0, y * T); c.lineTo(s.ownW * T, y * T); }
      c.stroke();
    }
    c.strokeStyle = '#ffd43b'; c.lineWidth = 2; c.setLineDash([8, 5]); c.strokeRect(0, top * T, s.ownW * T, (side - top) * T); c.setLineDash([]);
    const ex = B.expandInfo(s);
    if (ex) { c.strokeStyle = 'rgba(255,255,255,.35)'; c.setLineDash([4, 6]); c.strokeRect(0, (s.gh - ex.nh) * T, ex.nw * T, (ex.nh - M.C.SIDE) * T); c.setLineDash([]); }
    const pulse = 0.5 + Math.sin(t * 6) * 0.25;
    const def = M.BUILD[st.tool];
    // células pendentes
    if (st.pending && st.pending.cells) { c.fillStyle = st.pending.type === 'demolish' ? 'rgba(250,82,82,' + pulse * 0.6 + ')' : 'rgba(81,207,102,' + pulse * 0.6 + ')'; for (const i of st.pending.cells) c.fillRect((i % s.gw) * T + 1, ((i / s.gw) | 0) * T + 1, T - 2, T - 2); }
    if (st.pending && st.pending.type === 'demolish') for (const o of st.pending.objs) { const f = fp(o); c.fillStyle = 'rgba(250,82,82,' + pulse * 0.5 + ')'; c.fillRect(o.x * T, o.y * T, f[0] * T, f[1] * T); }
    if (st.drag) {
      const cells = B.dragCells(s), demo = st.tool === 'demolir';
      c.fillStyle = demo ? 'rgba(250,82,82,.45)' : 'rgba(81,207,102,.45)';
      for (const i of cells) c.fillRect((i % s.gw) * T + 1, ((i / s.gw) | 0) * T + 1, T - 2, T - 2);
    }
    // fantasma do objeto
    let ghost = null;
    if (st.pending && (st.pending.type === 'obj' || st.pending.type === 'move')) ghost = { t: st.pending.t, x: st.pending.x, y: st.pending.y, r: st.pending.r, ok: true, pend: true };
    else if (st.tool === 'mover' && st.moving) ghost = { t: st.moving.t, x: st.hx, y: st.hy, r: st.rot, ok: B.canPlace(s, M.BUILD[st.moving.t], st.hx, st.hy, st.rot, st.moving) };
    else if (def && (def.w) && !st.drag) ghost = { t: st.tool, x: st.hx, y: st.hy, r: st.rot, ok: B.canPlace(s, def, st.hx, st.hy, st.rot) };
    if (st.moving) { const f = fp(st.moving); c.strokeStyle = '#4dabf7'; c.lineWidth = 2; c.strokeRect(st.moving.x * T, st.moving.y * T, f[0] * T, f[1] * T); }
    if (ghost) {
      const d = M.BUILD[ghost.t], o = { t: ghost.t, x: ghost.x, y: ghost.y, r: ghost.r, slots: d.slots ? Array.from({ length: d.slots }, () => ({ p: null, q: 0 })) : null };
      const f = fp(o);
      c.globalAlpha = ghost.pend ? 0.75 + pulse * 0.25 : 0.6; drawObj(c, s, o, t); c.globalAlpha = 1;
      c.fillStyle = ghost.ok ? 'rgba(81,207,102,.3)' : 'rgba(250,82,82,.4)'; c.fillRect(ghost.x * T, ghost.y * T, f[0] * T, f[1] * T);
      c.strokeStyle = ghost.ok ? '#51cf66' : '#fa5252'; c.lineWidth = 2; c.strokeRect(ghost.x * T + 1, ghost.y * T + 1, f[0] * T - 2, f[1] * T - 2);
      // seta de orientação (frente)
      const D = M.C.DIRS[ghost.r], cx = (ghost.x + f[0] / 2) * T, cy = (ghost.y + f[1] / 2) * T;
      if (d.kind === 'checkout' || d.kind === 'self' || d.kind === 'fixture') { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(cx + D[0] * 18, cy + D[1] * 18); c.lineTo(cx + D[0] * 8 - D[1] * 6, cy + D[1] * 8 - D[0] * 6); c.lineTo(cx + D[0] * 8 + D[1] * 6, cy + D[1] * 8 + D[0] * 6); c.fill(); }
    } else if (!st.drag && st.tool) {
      c.strokeStyle = st.tool === 'demolir' ? '#fa5252' : '#fff'; c.lineWidth = 2; c.strokeRect(st.hx * T + 1, st.hy * T + 1, T - 2, T - 2);
    }
  }

  R.clampCam = function (cam, vw, vh) {
    const s = M.game.store(); if (!s) return;
    const minX = -MX * T + vw / 2 / cam.z * 0.3, maxX = (s.gw + MX) * T - vw / 2 / cam.z * 0.3;
    const minY = -MT * T, maxY = (s.gh + MB) * T;
    cam.x = U.clamp(cam.x, Math.min(minX, maxX), Math.max(minX, maxX)); cam.y = U.clamp(cam.y, minY, maxY);
  };
  R.fit = function (cam, vw, vh) {
    const s = M.game.store(); if (!s) return;
    const top = s.gh - s.ownH;
    const w = (s.ownW + 2) * T, h = (s.ownH + 4) * T;
    cam.z = U.clamp(Math.min(vw / w, (vh - 150) / h), 0.45, 1.8);
    cam.x = (s.ownW * T) / 2; cam.y = ((top + s.gh + 1) * T) / 2;
  };
})();
