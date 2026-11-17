/* Pacotes de conteúdo: ponto de extensão para expansões, novos mapas, pacotes de decoração e
   itens cosméticos. Um pacote registra produtos, construções e opções de fachada.
   Nenhuma compra é simulada aqui: o jogo base lista apenas pacotes realmente incluídos.

   Exemplo de pacote externo (arquivo carregado depois de packs.js e antes de main.js):
     MST.packs.register({ id: 'meu-pacote', name: 'Meu Pacote', desc: '...', products: { doces: [[...]] },
       build: { minha_decoracao: { name: 'Minha Decoração', grp: 'decoracao', kind: 'decor', w: 1, h: 1, cost: 100, lvl: 1, appeal: 2 } },
       draw: { minha_decoracao(c, o, x, y, w, h, s, t) { ... } } });
*/
(function () {
  'use strict';
  const M = window.MST;
  const PK = (M.packs = { list: [] });

  // Edição atual. Builds futuras (ex.: versão premium) podem alterar estes valores.
  M.EDITION = { id: 'base', name: 'Edição Base', premium: false };

  PK.register = function (pack) {
    if (!pack || !pack.id || PK.list.some((p) => p.id === pack.id)) return false;
    const info = { id: pack.id, name: pack.name, desc: pack.desc || '', author: pack.author || '', included: pack.included !== false, products: 0, builds: 0, premium: !!pack.premium };
    if (pack.premium && !M.EDITION.premium) { info.locked = true; PK.list.push(info); return false; }
    for (const cat in pack.products || {}) {
      if (!M.CAT[cat]) continue;
      for (const row of pack.products[cat]) { M.addProduct(cat, row); info.products++; }
    }
    for (const id in pack.build || {}) { M.BUILD[id] = Object.assign({ id, pack: pack.id }, pack.build[id]); info.builds++; }
    for (const id in pack.draw || {}) if (M.render && M.render.DRAW) M.render.DRAW[id] = pack.draw[id];
    for (const key in pack.facade || {}) if (M.FACADE[key]) for (const opt of pack.facade[key]) M.FACADE[key].push(opt);
    PK.list.push(info);
    return true;
  };

  // Pacote incluso: Verão Tropical (gratuito, faz parte do jogo base)
  PK.register({
    id: 'tropical', name: 'Verão Tropical', desc: 'Decorações praianas, frutas tropicais e a fachada Azul Caribe.', author: 'Equipe Mega Store',
    products: {
      alimentos: [['Açaí 1L', 'pote', '#4a1d5c', 11, 6, 6, 2, 'fridge'], ['Manga (kg)', 'fruta', '#f4a524', 4.4, 6, 5, 2, 'produce'], ['Abacaxi', 'fruta', '#e8c547', 3.9, 5, 6, 2, 'produce'], ['Tapioca', 'saco', '#f7f2e6', 5.2, 5, 0, 2]],
      bebidas: [['Caldo de Cana', 'garrafa', '#b5c94a', 3.8, 5, 4, 2, 'fridge'], ['Suco de Maracujá', 'caixa', '#f2c12e', 4.6, 5, 0, 2]],
      doces: [['Cocada', 'barra', '#f3ead3', 2.1, 5, 0, 1], ['Picolé de Frutas', 'barra', '#ff8787', 2.4, 6, 30, 2, 'fridge']],
    },
    build: {
      coqueiro: { name: 'Coqueiro', grp: 'decoracao', kind: 'decor', w: 1, h: 1, cost: 220, lvl: 1, appeal: 3.5, out: true },
      guarda_sol: { name: 'Guarda-sol', grp: 'decoracao', kind: 'decor', w: 1, h: 1, cost: 160, lvl: 1, appeal: 2.5, out: true },
      prancha: { name: 'Prancha Decorativa', grp: 'decoracao', kind: 'decor', w: 1, h: 1, cost: 130, lvl: 2, appeal: 2.5 },
    },
    draw: {
      coqueiro(c, o, x, y, w, h, s, t) {
        c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x + 20, y + 27, 13, 5, 0, 0, 6.283); c.fill();
        c.strokeStyle = '#8d6e3f'; c.lineWidth = 5; c.beginPath(); c.moveTo(x + 16, y + 26); c.quadraticCurveTo(x + 10, y + 4, x + 18, y - 18); c.stroke();
        const sw = Math.sin(t * 1.5) * 0.08;
        for (let k = 0; k < 6; k++) { c.save(); c.translate(x + 18, y - 18); c.rotate(k * 1.05 + sw); c.fillStyle = k % 2 ? '#2b8a3e' : '#40c057'; c.beginPath(); c.ellipse(13, 0, 15, 4.5, 0.2, 0, 6.283); c.fill(); c.restore(); }
        M.gfx.circ(c, x + 16, y - 14, 3.5, '#6b4a2b'); M.gfx.circ(c, x + 21, y - 13, 3.5, '#6b4a2b');
      },
      guarda_sol(c, o, x, y) {
        c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x + 20, y + 24, 18, 7, 0, 0, 6.283); c.fill();
        c.fillStyle = '#868e96'; c.fillRect(x + 15, y - 14, 2, 40);
        for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(x + 16, y - 16); c.arc(x + 16, y - 10, 17, Math.PI + k * (Math.PI / 6), Math.PI + (k + 1) * (Math.PI / 6)); c.closePath(); c.fillStyle = k % 2 ? '#fff' : '#ff6b6b'; c.fill(); }
      },
      prancha(c, o, x, y) {
        c.save(); c.translate(x + 16, y + 6); c.rotate(-0.25);
        M.gfx.ell(c, 0, 0, 7, 20, '#4dabf7'); c.fillStyle = '#ffd43b'; c.fillRect(-1.5, -18, 3, 36); c.restore();
      },
    },
    facade: { color: [{ name: 'Azul Caribe', c: '#1098ad', cost: 1200, a: 3 }] },
  });
})();
