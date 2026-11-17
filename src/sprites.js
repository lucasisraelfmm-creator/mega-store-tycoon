/* Sprites procedurais: ícones de produtos (atlas gerado em tempo de carga) e personagens animados.
   Nenhum arquivo de imagem é necessário — toda a arte é desenhada em Canvas 2D. */
(function () {
  'use strict';
  const M = window.MST, U = M.U;
  const CELL = 64, COLS = 16;
  const OUT = 'rgba(22,24,38,.62)';

  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }
  function box(c, x, y, w, h, r, f, noStroke) { rr(c, x, y, w, h, r); c.fillStyle = f; c.fill(); if (!noStroke) { c.strokeStyle = OUT; c.lineWidth = 2; c.stroke(); } }
  function circ(c, x, y, r, f, noStroke) { c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fillStyle = f; c.fill(); if (!noStroke) { c.strokeStyle = OUT; c.lineWidth = 2; c.stroke(); } }
  function ell(c, x, y, rx, ry, f, noStroke) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 6.2832); c.fillStyle = f; c.fill(); if (!noStroke) { c.strokeStyle = OUT; c.lineWidth = 2; c.stroke(); } }
  function poly(c, pts, f, noStroke) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fillStyle = f; c.fill(); if (!noStroke) { c.strokeStyle = OUT; c.lineWidth = 2; c.lineJoin = 'round'; c.stroke(); } }
  function line(c, x1, y1, x2, y2, col, w) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = col; c.lineWidth = w || 2; c.lineCap = 'round'; c.stroke(); }
  M.gfx = { rr, box, circ, ell, poly, line, OUT };

  const ACC = ['#ff6b57', '#ffd166', '#2ec4b6', '#5c7cfa', '#f783ac', '#94d82d', '#ffffff', '#ff922b'];

  const SH = {
    saco(c, m, d, l, a) { poly(c, [19, 10, 45, 10, 50, 20, 48, 55, 16, 55, 14, 20], m); line(c, 18, 17, 46, 17, d, 2); box(c, 20, 28, 24, 15, 3, a, 1); line(c, 24, 35, 40, 35, d, 2); },
    caixa(c, m, d, l, a) { box(c, 14, 9, 36, 47, 3, m); box(c, 15, 10, 34, 8, 2, d, 1); circ(c, 32, 36, 9, a, 1); line(c, 27, 36, 37, 36, l, 2); },
    garrafa(c, m, d, l, a) { box(c, 27, 8, 10, 14, 2, d); box(c, 25, 4, 14, 7, 2, a); box(c, 20, 19, 24, 38, 7, m); box(c, 21, 32, 22, 12, 1, a, 1); line(c, 24, 24, 24, 50, 'rgba(255,255,255,.35)', 2); },
    lata(c, m, d, l, a) { box(c, 18, 10, 28, 46, 6, m); box(c, 19, 22, 26, 16, 0, a, 1); ell(c, 32, 13, 11, 3, l, 1); line(c, 22, 18, 22, 50, 'rgba(255,255,255,.35)', 2); },
    pote(c, m, d, l, a) { box(c, 17, 9, 30, 10, 3, a); box(c, 15, 18, 34, 38, 8, m); box(c, 19, 30, 26, 13, 2, l, 1); line(c, 23, 36, 41, 36, d, 2); },
    fruta(c, m, d, l) { circ(c, 32, 36, 19, m); circ(c, 25, 29, 5, 'rgba(255,255,255,.35)', 1); line(c, 32, 18, 34, 10, '#5d4037', 3); ell(c, 40, 13, 6, 3, '#4caf50'); },
    folha(c, m, d, l) { ell(c, 22, 36, 11, 17, d); ell(c, 42, 36, 11, 17, d); ell(c, 32, 33, 12, 21, m); line(c, 32, 16, 32, 50, l, 2); },
    pao(c, m, d, l) { ell(c, 32, 36, 23, 15, m); line(c, 20, 30, 25, 40, l, 3); line(c, 30, 28, 35, 40, l, 3); line(c, 40, 30, 45, 40, l, 3); },
    queijo(c, m, d, l) { poly(c, [8, 44, 54, 24, 56, 48, 10, 52], m); poly(c, [8, 44, 54, 24, 30, 22], l); circ(c, 26, 44, 3, d, 1); circ(c, 42, 40, 4, d, 1); circ(c, 46, 47, 2, d, 1); },
    carne(c, m, d, l) { box(c, 8, 18, 48, 32, 6, '#eef1f4'); ell(c, 32, 34, 18, 11, m); line(c, 22, 32, 34, 30, l, 2); line(c, 30, 38, 42, 36, l, 2); },
    ovo(c, m, d, l) { box(c, 9, 30, 46, 20, 6, d); ell(c, 20, 28, 7, 9, m); ell(c, 32, 28, 7, 9, m); ell(c, 44, 28, 7, 9, m); },
    barra(c, m, d, l, a) { box(c, 11, 19, 42, 28, 3, m); line(c, 25, 20, 25, 46, d, 2); line(c, 39, 20, 39, 46, d, 2); line(c, 12, 33, 52, 33, d, 2); box(c, 11, 19, 18, 28, 3, a); },
    bala(c, m, d, l, a) { poly(c, [6, 22, 20, 32, 6, 42], a); poly(c, [58, 22, 44, 32, 58, 42], a); circ(c, 32, 32, 14, m); c.beginPath(); c.arc(32, 32, 7, 0.5, 4.2); c.strokeStyle = l; c.lineWidth = 3; c.stroke(); },
    bolo(c, m, d, l, a) { box(c, 11, 30, 42, 22, 4, m); box(c, 9, 22, 46, 13, 6, l); circ(c, 32, 18, 5, '#e53935'); line(c, 12, 43, 52, 43, d, 2); },
    spray(c, m, d, l, a) { box(c, 26, 8, 12, 12, 2, d); box(c, 36, 10, 10, 5, 1, d); box(c, 21, 20, 22, 36, 5, m); box(c, 22, 30, 20, 12, 1, a, 1); },
    frasco(c, m, d, l, a) { box(c, 30, 8, 4, 14, 1, d); box(c, 28, 5, 16, 6, 2, d); box(c, 18, 20, 28, 36, 9, m); box(c, 22, 32, 20, 12, 3, l, 1); },
    tubo(c, m, d, l, a) { poly(c, [22, 8, 42, 8, 46, 48, 18, 48], m); box(c, 26, 48, 12, 9, 2, a); line(c, 22, 18, 43, 18, d, 2); box(c, 25, 24, 14, 12, 2, l, 1); },
    rolo(c, m, d, l) { box(c, 15, 12, 34, 42, 11, m); ell(c, 32, 19, 9, 4, d); line(c, 20, 30, 20, 46, 'rgba(0,0,0,.1)', 2); line(c, 44, 30, 44, 46, 'rgba(0,0,0,.1)', 2); },
    sabao(c, m, d, l) { box(c, 10, 24, 44, 22, 9, m); line(c, 18, 30, 34, 30, l, 3); circ(c, 44, 18, 5, 'rgba(255,255,255,.7)'); circ(c, 52, 26, 3, 'rgba(255,255,255,.7)'); },
    escova(c, m, d, l) { line(c, 32, 8, 32, 40, OUT, 7); line(c, 32, 8, 32, 40, m, 4); box(c, 17, 38, 30, 9, 3, m); for (let i = 0; i < 6; i++) line(c, 20 + i * 5, 48, 20 + i * 5, 56, d, 3); },
    celular(c, m, d, l) { box(c, 19, 6, 26, 52, 6, '#20232e'); box(c, 22, 11, 20, 38, 2, m, 1); line(c, 25, 15, 34, 15, l, 2); circ(c, 32, 53, 2, '#555', 1); },
    tv(c, m, d, l) { box(c, 6, 12, 52, 34, 3, '#191c26'); const g = c.createLinearGradient(8, 14, 56, 44); g.addColorStop(0, '#4dabf7'); g.addColorStop(1, '#7048e8'); box(c, 9, 15, 46, 28, 1, g, 1); line(c, 14, 38, 28, 20, 'rgba(255,255,255,.25)', 4); line(c, 32, 46, 32, 52, '#333', 4); line(c, 22, 54, 42, 54, '#333', 4); },
    laptop(c, m, d, l) { box(c, 13, 12, 38, 28, 3, '#22252f'); box(c, 16, 15, 32, 22, 1, '#74c0fc', 1); poly(c, [8, 42, 56, 42, 52, 51, 12, 51], m); line(c, 26, 47, 38, 47, d, 2); },
    fone(c, m, d, l) { c.beginPath(); c.arc(32, 32, 19, 3.3, 6.1); c.strokeStyle = OUT; c.lineWidth = 8; c.stroke(); c.strokeStyle = m; c.lineWidth = 5; c.stroke(); box(c, 8, 30, 12, 22, 5, m); box(c, 44, 30, 12, 22, 5, m); },
    console(c, m, d, l, a) { box(c, 10, 20, 44, 26, 7, m); circ(c, 22, 33, 5, d, 1); circ(c, 41, 29, 3, a, 1); circ(c, 46, 36, 3, l, 1); },
    camera(c, m, d, l) { box(c, 20, 14, 14, 8, 2, d); box(c, 8, 20, 48, 30, 5, m); circ(c, 32, 35, 11, '#1b1e28'); circ(c, 32, 35, 6, '#4dabf7', 1); circ(c, 29, 32, 2, '#fff', 1); },
    camiseta(c, m, d, l) { poly(c, [20, 10, 27, 10, 32, 16, 37, 10, 44, 10, 57, 21, 50, 30, 44, 26, 44, 55, 20, 55, 20, 26, 14, 30, 7, 21], m); line(c, 26, 34, 38, 34, l, 3); },
    calca(c, m, d, l) { poly(c, [17, 8, 47, 8, 49, 56, 36, 56, 32, 26, 28, 56, 15, 56], m); line(c, 18, 15, 46, 15, d, 2); },
    vestido(c, m, d, l) { poly(c, [24, 8, 30, 12, 34, 12, 40, 8, 39, 24, 52, 55, 12, 55, 25, 24], m); line(c, 25, 25, 39, 25, d, 3); },
    sapato(c, m, d, l) { poly(c, [9, 26, 26, 26, 34, 37, 52, 41, 56, 50, 9, 50], m); line(c, 10, 49, 55, 49, '#f5f5f5', 4); line(c, 28, 32, 34, 30, l, 2); },
    bone(c, m, d, l) { c.beginPath(); c.arc(28, 38, 18, 3.1416, 0); c.closePath(); c.fillStyle = m; c.fill(); c.strokeStyle = OUT; c.lineWidth = 2; c.stroke(); box(c, 34, 36, 24, 7, 3, d); circ(c, 28, 20, 2.5, l, 1); },
    bolsa(c, m, d, l, a) { c.beginPath(); c.arc(32, 26, 11, 3.1416, 0); c.strokeStyle = OUT; c.lineWidth = 6; c.stroke(); c.strokeStyle = d; c.lineWidth = 3; c.stroke(); box(c, 12, 26, 40, 30, 6, m); box(c, 27, 34, 10, 7, 2, '#ffd43b'); },
    urso(c, m, d, l) { circ(c, 19, 21, 7, m); circ(c, 45, 21, 7, m); circ(c, 32, 36, 18, m); ell(c, 32, 42, 8, 6, l, 1); circ(c, 25, 32, 2.2, '#222', 1); circ(c, 39, 32, 2.2, '#222', 1); circ(c, 32, 40, 2, '#222', 1); },
    bola(c, m, d, l, a) { circ(c, 32, 33, 20, m); poly(c, [32, 24, 40, 30, 37, 39, 27, 39, 24, 30], '#2b2f3a', 1); line(c, 32, 24, 32, 14, '#2b2f3a', 2); line(c, 40, 30, 50, 27, '#2b2f3a', 2); line(c, 24, 30, 14, 27, '#2b2f3a', 2); line(c, 37, 39, 43, 48, '#2b2f3a', 2); line(c, 27, 39, 21, 48, '#2b2f3a', 2); },
    carro(c, m, d, l) { box(c, 17, 18, 28, 16, 6, l); box(c, 6, 29, 52, 16, 6, m); circ(c, 19, 46, 7, '#22252f'); circ(c, 45, 46, 7, '#22252f'); circ(c, 19, 46, 2.5, '#aaa', 1); circ(c, 45, 46, 2.5, '#aaa', 1); },
    blocos(c, m, d, l, a) { box(c, 8, 34, 24, 20, 2, m); box(c, 32, 34, 24, 20, 2, a); box(c, 20, 14, 24, 20, 2, '#ff6b6b'); circ(c, 27, 13, 3.5, '#ff6b6b'); circ(c, 37, 13, 3.5, '#ff6b6b'); },
    boneca(c, m, d, l) { poly(c, [32, 26, 48, 56, 16, 56], m); circ(c, 32, 19, 11, '#ffd7b5'); c.beginPath(); c.arc(32, 17, 11, 3.3, 6.1); c.lineTo(32, 14); c.closePath(); c.fillStyle = '#6d4c41'; c.fill(); circ(c, 28, 20, 1.6, '#222', 1); circ(c, 36, 20, 1.6, '#222', 1); },
    martelo(c, m, d, l) { line(c, 32, 20, 32, 56, OUT, 9); line(c, 32, 20, 32, 56, '#b07b45', 6); box(c, 14, 8, 36, 15, 3, m); line(c, 18, 12, 46, 12, l, 2); },
    chave(c, m, d, l) { line(c, 20, 50, 42, 20, OUT, 10); line(c, 20, 50, 42, 20, m, 7); c.beginPath(); c.arc(45, 16, 9, 0.9, 5.6); c.strokeStyle = OUT; c.lineWidth = 9; c.stroke(); c.strokeStyle = m; c.lineWidth = 6; c.stroke(); circ(c, 19, 51, 5, d); },
    furadeira(c, m, d, l) { box(c, 44, 22, 14, 5, 1, '#9aa3ad'); box(c, 8, 16, 38, 18, 5, m); box(c, 24, 32, 13, 24, 3, d); line(c, 14, 22, 34, 22, l, 2); },
    cadeira(c, m, d, l) { box(c, 18, 6, 28, 28, 4, m); box(c, 13, 32, 38, 11, 3, l); line(c, 17, 44, 17, 56, OUT, 6); line(c, 47, 44, 47, 56, OUT, 6); line(c, 17, 44, 17, 56, d, 3); line(c, 47, 44, 47, 56, d, 3); },
    mesa(c, m, d, l) { box(c, 11, 30, 6, 26, 1, d); box(c, 47, 30, 6, 26, 1, d); box(c, 6, 20, 52, 11, 3, m); line(c, 10, 24, 54, 24, l, 2); },
    sofa(c, m, d, l) { box(c, 8, 14, 48, 26, 7, d); box(c, 12, 30, 40, 20, 5, m); box(c, 4, 26, 12, 26, 5, m); box(c, 48, 26, 12, 26, 5, m); line(c, 32, 32, 32, 48, d, 2); },
    cama(c, m, d, l) { box(c, 6, 14, 52, 12, 3, '#8d6e63'); box(c, 8, 22, 48, 32, 4, '#f5f5f5'); box(c, 8, 34, 48, 20, 4, m); box(c, 14, 24, 14, 8, 3, '#fff'); box(c, 36, 24, 14, 8, 3, '#fff'); },
    luminaria(c, m, d, l) { line(c, 32, 28, 32, 52, OUT, 6); line(c, 32, 28, 32, 52, '#9aa3ad', 3); ell(c, 32, 54, 11, 3.5, '#6b7280'); poly(c, [22, 8, 42, 8, 50, 30, 14, 30], m); line(c, 24, 12, 20, 26, 'rgba(255,255,255,.4)', 2); },
    armario(c, m, d, l) { box(c, 13, 6, 38, 50, 3, m); line(c, 32, 8, 32, 54, d, 2); circ(c, 28, 32, 2, l, 1); circ(c, 36, 32, 2, l, 1); line(c, 15, 46, 49, 46, d, 2); },
    relogio(c, m, d, l) { box(c, 25, 3, 14, 58, 4, '#3b3f4c'); circ(c, 32, 32, 16, m); circ(c, 32, 32, 11, '#fdfdfd', 1); line(c, 32, 32, 32, 25, '#222', 2); line(c, 32, 32, 37, 34, '#222', 2); },
    joia(c, m, d, l) { poly(c, [20, 18, 44, 18, 54, 30, 32, 56, 10, 30], m); poly(c, [20, 18, 44, 18, 38, 30, 26, 30], l, 1); line(c, 10, 30, 54, 30, 'rgba(255,255,255,.6)', 1.5); line(c, 26, 30, 32, 56, 'rgba(255,255,255,.6)', 1.5); line(c, 38, 30, 32, 56, 'rgba(255,255,255,.6)', 1.5); line(c, 50, 8, 50, 16, '#fff', 2); line(c, 46, 12, 54, 12, '#fff', 2); },
    perfume(c, m, d, l) { box(c, 27, 6, 10, 8, 2, '#d4af37'); box(c, 29, 13, 6, 8, 1, '#c9c9c9'); box(c, 16, 20, 32, 36, 6, m); box(c, 21, 30, 22, 14, 2, 'rgba(255,255,255,.55)', 1); },
    oculos(c, m, d, l) { line(c, 4, 26, 14, 32, OUT, 4); line(c, 60, 26, 50, 32, OUT, 4); circ(c, 20, 36, 11, m); circ(c, 44, 36, 11, m); line(c, 29, 33, 35, 33, OUT, 3); line(c, 15, 31, 20, 29, 'rgba(255,255,255,.5)', 2); line(c, 39, 31, 44, 29, 'rgba(255,255,255,.5)', 2); },
  };

  const SP = (M.sprites = { CELL, COLS, atlas: null, rows: 0 });

  SP.build = function () {
    const n = M.PRODUCTS.length;
    SP.rows = Math.ceil(n / COLS);
    const cv = document.createElement('canvas');
    cv.width = COLS * CELL; cv.height = SP.rows * CELL;
    const c = cv.getContext('2d');
    for (const p of M.PRODUCTS) {
      const cx = (p.idx % COLS) * CELL, cy = Math.floor(p.idx / COLS) * CELL;
      c.save(); c.translate(cx, cy);
      const acc = ACC[U.hash(p.name) % ACC.length];
      const fn = SH[p.shape] || SH.caixa;
      fn(c, p.color, U.shade(p.color, -0.28), U.shade(p.color, 0.4), acc);
      c.restore();
    }
    SP.atlas = cv;
    try {
      const st = document.createElement('style');
      st.textContent = '.pi{background-image:url(' + cv.toDataURL('image/png') + ')}';
      document.head.appendChild(st);
    } catch (e) { console.warn('Atlas de ícones indisponível para a interface', e); }
  };

  // desenha o ícone do produto centrado em (x,y) com tamanho s
  SP.draw = function (ctx, pid, x, y, s) {
    const p = M.P[pid]; if (!p || !SP.atlas) return;
    ctx.drawImage(SP.atlas, (p.idx % COLS) * CELL, Math.floor(p.idx / COLS) * CELL, CELL, CELL, x - s / 2, y - s / 2, s, s);
  };

  // HTML de ícone para a interface
  SP.icon = function (pid, size) {
    const p = M.P[pid]; if (!p) return '';
    size = size || 28;
    return '<i class="pi" style="width:' + size + 'px;height:' + size + 'px;background-size:' + COLS * size + 'px ' + SP.rows * size + 'px;background-position:-' + (p.idx % COLS) * size + 'px -' + Math.floor(p.idx / COLS) * size + 'px"></i>';
  };

  // ---------- personagens ----------
  const SKIN = ['#ffd7b5', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#5c3a1e'];
  const HAIR = ['#2b1d14', '#4a2f1b', '#6d4c41', '#b08d57', '#d8b35a', '#8e2b1c', '#9e9e9e', '#101014'];
  const SHIRT = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#ecf0f1', '#34495e', '#fd79a8', '#00b894', '#6c5ce7'];
  const PANTS = ['#2c3e50', '#34495e', '#5d4037', '#1e3799', '#636e72', '#2d3436', '#6d4c41'];
  SP.randomLook = () => ({ skin: U.pick(SKIN), hair: U.pick(HAIR), shirt: U.pick(SHIRT), pants: U.pick(PANTS), hs: U.rndi(0, 3) });

  SP.ROLE_LOOK = {
    caixa: { shirt: '#ff8a3d', apron: '#1f2a44' }, repositor: { shirt: '#2ec4b6', apron: '#1f2a44' },
    gerente: { shirt: '#f8f9fa', tie: '#c92a2a', pants: '#212529' }, seguranca: { shirt: '#22283a', hat: '#11141f', pants: '#11141f' },
    faxineiro: { shirt: '#74c0fc', apron: '#e9ecef' }, estoquista: { shirt: '#f59f00', hat: '#f59f00' },
    entregador: { shirt: '#51cf66', hat: '#2b8a3e' }, jogador: { shirt: '#ffd43b', pants: '#1f2a44' },
  };

  /* x,y: posição dos pés (px). s: tamanho do tile em px. dir: 0=S 1=O 2=N 3=L. ph: fase da caminhada. */
  SP.person = function (ctx, x, y, s, look, dir, ph, o) {
    o = o || {};
    const u = s / 32, mv = o.moving ? 1 : 0;
    const sw = Math.sin(ph) * mv, bob = Math.abs(sw) * 1.4 * u;
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.beginPath(); ctx.ellipse(x, y + 1 * u, 8.5 * u, 3.6 * u, 0, 0, 6.2832); ctx.fill();
    // pernas
    const pants = o.pants || look.pants;
    ctx.fillStyle = pants;
    rr(ctx, x - 5.5 * u, y - 9 * u - Math.max(0, sw) * 2.4 * u, 4.6 * u, 8 * u, 2 * u); ctx.fill();
    rr(ctx, x + 0.9 * u, y - 9 * u - Math.max(0, -sw) * 2.4 * u, 4.6 * u, 8 * u, 2 * u); ctx.fill();
    ctx.fillStyle = '#20222c';
    rr(ctx, x - 6 * u, y - 2.6 * u - Math.max(0, sw) * 2.4 * u, 5.4 * u, 3 * u, 1.4 * u); ctx.fill();
    rr(ctx, x + 0.6 * u, y - 2.6 * u - Math.max(0, -sw) * 2.4 * u, 5.4 * u, 3 * u, 1.4 * u); ctx.fill();
    const by = y - 21 * u - bob;
    // braços
    const shirt = o.shirt || look.shirt;
    ctx.fillStyle = look.skin; ctx.strokeStyle = OUT; ctx.lineWidth = 1 * u;
    if (dir !== 3) { ctx.beginPath(); ctx.arc(x - 8.2 * u, by + 8 * u + sw * 2.2 * u, 2.6 * u, 0, 6.2832); ctx.fill(); ctx.stroke(); }
    if (dir !== 1) { ctx.beginPath(); ctx.arc(x + 8.2 * u, by + 8 * u - sw * 2.2 * u, 2.6 * u, 0, 6.2832); ctx.fill(); ctx.stroke(); }
    // corpo
    rr(ctx, x - 7.2 * u, by, 14.4 * u, 14 * u, 5 * u); ctx.fillStyle = shirt; ctx.fill(); ctx.stroke();
    if (o.apron && dir !== 2) { rr(ctx, x - 4.4 * u, by + 4 * u, 8.8 * u, 9.6 * u, 2 * u); ctx.fillStyle = o.apron; ctx.fill(); }
    if (o.tie && dir === 0) { ctx.fillStyle = o.tie; ctx.fillRect(x - 1.1 * u, by + 2 * u, 2.2 * u, 8 * u); }
    // itens carregados
    if (o.carry === 'box') { rr(ctx, x - 6 * u, by + 4 * u, 12 * u, 9 * u, 1.5 * u); ctx.fillStyle = '#c79a5b'; ctx.fill(); ctx.stroke(); ctx.fillStyle = '#e8cfa0'; ctx.fillRect(x - 1 * u, by + 4 * u, 2 * u, 9 * u); }
    else if (o.carry === 'basket') {
      const bx = x + (dir === 1 ? -11 : 6) * u;
      rr(ctx, bx, by + 8 * u, 7.5 * u, 6 * u, 1.5 * u); ctx.fillStyle = '#e03131'; ctx.fill(); ctx.stroke();
      if (o.items) { ctx.fillStyle = '#ffe066'; ctx.fillRect(bx + 1.3 * u, by + 6.6 * u, 2.2 * u, 2.4 * u); if (o.items > 2) { ctx.fillStyle = '#69db7c'; ctx.fillRect(bx + 4 * u, by + 6.2 * u, 2.2 * u, 2.8 * u); } }
    } else if (o.carry === 'mop') { ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 1.6 * u; ctx.beginPath(); ctx.moveTo(x + 9 * u, by - 2 * u); ctx.lineTo(x + 11 * u, y - 1 * u); ctx.stroke(); ctx.fillStyle = '#dee2e6'; ctx.fillRect(x + 8 * u, y - 3 * u, 6 * u, 3 * u); ctx.strokeStyle = OUT; ctx.lineWidth = 1 * u; }
    // cabeça
    const hy = by - 4.6 * u;
    ctx.beginPath(); ctx.arc(x, hy, 7.2 * u, 0, 6.2832); ctx.fillStyle = look.skin; ctx.fill(); ctx.stroke();
    const hs = look.hs;
    if (hs !== 2 || o.hat) {
      ctx.fillStyle = o.hat || look.hair;
      ctx.beginPath();
      if (dir === 2) ctx.arc(x, hy, 7.4 * u, 0, 6.2832);
      else if (dir === 0) ctx.arc(x, hy - 0.6 * u, 7.5 * u, 3.3416, 6.0832);
      else if (dir === 1) ctx.arc(x + 1.2 * u, hy - 0.4 * u, 7.5 * u, 3.9, 7.6);
      else ctx.arc(x - 1.2 * u, hy - 0.4 * u, 7.5 * u, 1.82, 5.52);
      ctx.closePath(); ctx.fill();
      if (!o.hat && hs === 1 && dir !== 2) { ctx.fillRect(x - 7.6 * u, hy - 1 * u, 2.6 * u, 7.5 * u); ctx.fillRect(x + 5 * u, hy - 1 * u, 2.6 * u, 7.5 * u); }
      if (!o.hat && hs === 3) { ctx.beginPath(); ctx.arc(x, hy - 7.6 * u, 3 * u, 0, 6.2832); ctx.fill(); }
      if (o.hat && dir !== 2) { ctx.fillRect(x + (dir === 1 ? -9.5 : dir === 3 ? 3 : -4) * u, hy - 3.4 * u, (dir === 0 ? 8 : 6.5) * u, 2 * u); }
    }
    ctx.fillStyle = '#20222c';
    if (dir === 0) { ctx.fillRect(x - 3.4 * u, hy + 0.4 * u, 1.8 * u, 2.2 * u); ctx.fillRect(x + 1.6 * u, hy + 0.4 * u, 1.8 * u, 2.2 * u); }
    else if (dir === 1) ctx.fillRect(x - 4.6 * u, hy + 0.2 * u, 1.8 * u, 2.2 * u);
    else if (dir === 3) ctx.fillRect(x + 2.8 * u, hy + 0.2 * u, 1.8 * u, 2.2 * u);
  };

  // balão de emoção acima do personagem
  SP.emote = function (ctx, x, y, s, type, a) {
    const u = s / 32;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y - 40 * u);
    const col = { feliz: '#51cf66', bravo: '#ff6b6b', caro: '#ffa94d', vazio: '#ced4da', pago: '#ffd43b', fila: '#ff8787', furto: '#e03131', limpo: '#74c0fc', amor: '#f783ac' }[type] || '#fff';
    circ(ctx, 0, 0, 7.5 * u, '#fff'); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1.8 * u; ctx.lineCap = 'round';
    ctx.font = '700 ' + 10 * u + 'px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const ch = { feliz: '☺', bravo: '!', caro: '$', vazio: '?', pago: '$', fila: '…', furto: '!', limpo: '✦', amor: '♥' }[type] || '•';
    ctx.fillText(ch, 0, 0.6 * u);
    ctx.restore();
  };
})();
