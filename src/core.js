/* MEGA STORE TYCOON — núcleo: namespace, constantes, utilitários e barramento de eventos */
(function () {
  'use strict';
  const M = (window.MST = window.MST || {});
  M.VERSION = '1.0.0';

  M.C = {
    T: 32,                // tamanho do tile em px (zoom 1)
    DAY_START: 7 * 60,    // 07:00
    DAY_END: 22 * 60,     // 22:00
    DAY_LEN: 15 * 60,     // minutos de jogo por dia útil
    MIN_PER_SEC: 3,       // minutos de jogo por segundo real em 1x
    SIDE: 2,              // linhas de calçada na base de cada loja
    MONTH: 14,            // dias por mês
    YEAR: 168,            // dias por ano
    MONTHS: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    WD: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    DIRS: [[0, 1], [-1, 0], [0, -1], [1, 0]], // S, O, N, L
  };

  const U = (M.U = {});
  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.rnd = (a, b) => a + Math.random() * (b - a);
  U.rndi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  U.chance = (p) => Math.random() < p;
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.wpick = (arr, wf) => {
    let tot = 0;
    const ws = arr.map((a) => { const w = Math.max(0, wf(a)); tot += w; return w; });
    if (tot <= 0) return null;
    let r = Math.random() * tot;
    for (let i = 0; i < arr.length; i++) { r -= ws[i]; if (r <= 0) return arr[i]; }
    return arr[arr.length - 1];
  };
  U.shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    return arr;
  };
  U.dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  U.sum = (arr, f) => { let s = 0; for (const a of arr) s += f ? f(a) : a; return s; };
  U.round2 = (n) => Math.round(n * 100) / 100;
  U.mulberry = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  U.hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  // ---- formatação (pt-BR) ----
  U.money = (n) => {
    const neg = n < 0; n = Math.abs(n);
    const s = n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (neg ? '-R$ ' : 'R$ ') + s;
  };
  U.money0 = (n) => {
    const neg = n < 0; n = Math.abs(n);
    let s;
    if (n >= 1e6) s = (n / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' mi';
    else if (n >= 1e4) s = (n / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil';
    else s = Math.round(n).toLocaleString('pt-BR');
    return (neg ? '-R$ ' : 'R$ ') + s;
  };
  U.num = (n) => Math.round(n).toLocaleString('pt-BR');
  U.pct = (n) => (n * 100).toFixed(0) + '%';
  U.time = (min) => {
    const h = Math.floor(min / 60), m = Math.floor(min % 60);
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  };
  U.dur = (min) => {
    min = Math.max(0, Math.round(min));
    if (min < 60) return min + ' min';
    const h = Math.floor(min / 60), m = min % 60;
    return h + 'h' + (m ? ' ' + m + 'min' : '');
  };
  U.dateInfo = (day) => {
    const doy = (day - 1) % M.C.YEAR;
    const month = Math.floor(doy / M.C.MONTH);
    return { doy, month, dom: (doy % M.C.MONTH) + 1, year: Math.floor((day - 1) / M.C.YEAR) + 1, wd: (day - 1) % 7, monthName: M.C.MONTHS[month], wdName: M.C.WD[(day - 1) % 7] };
  };
  U.date = (day) => { const d = U.dateInfo(day); return d.wdName + ', ' + d.dom + ' de ' + d.monthName; };
  U.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.stars = (v) => { // v 0..100 → 0..5
    const n = U.clamp(v / 20, 0, 5); let s = '';
    for (let i = 1; i <= 5; i++) s += n >= i - 0.25 ? '★' : n >= i - 0.75 ? '⯨' : '☆';
    return s;
  };
  U.shade = (hex, amt) => { // amt -1..1
    let c = hex.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    const n = parseInt(c, 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
    else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
    return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  };

  // ---- barramento de eventos ----
  const handlers = {};
  M.bus = {
    on(evt, fn) { (handlers[evt] = handlers[evt] || []).push(fn); },
    emit(evt, data) {
      const hs = handlers[evt]; if (!hs) return;
      for (let i = 0; i < hs.length; i++) {
        try { hs[i](data); } catch (e) { console.error('[bus:' + evt + ']', e); }
      }
    },
  };

  // tempo absoluto de jogo em minutos úteis (noites são puladas)
  M.now = () => (M.S.day - 1) * M.C.DAY_LEN + (M.S.minute - M.C.DAY_START);

  // estado de execução (não salvo)
  M.R = { view: 'menu', paused: false, time: 0, fps: 60, hover: null, modal: 0 };

  // configurações do jogador (salvas à parte do progresso)
  M.settings = { music: 0.5, sfx: 0.7, quality: 'alta', maxCust: 45, autosave: 60, skipReport: false, showGrid: true };
})();
