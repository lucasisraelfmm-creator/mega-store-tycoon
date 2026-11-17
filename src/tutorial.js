/* Tutorial interativo: cada passo espera uma ação real do jogador e destaca o botão correspondente. */
(function () {
  'use strict';
  const M = window.MST;
  const TU = (M.tutorial = {});
  const seen = {};
  M.bus.on('panel', (n) => (seen['panel:' + n] = true));
  M.bus.on('build', (d) => { if (d && d.what === 'obj') seen.built = true; });
  M.bus.on('priceSet', () => (seen.price = true));
  M.bus.on('slotSet', () => (seen.slot = true));

  const STEPS = [
    { t: 'Bem-vindo(a) à MEGA STORE TYCOON!', b: 'Você é dono(a) de uma pequena loja de bairro, com poucas prateleiras, um caixa e pouco dinheiro. Seu objetivo é transformá-la em um império comercial. Vamos aprender o básico jogando.', next: true },
    { t: 'Ande pela loja', b: 'Você é o personagem com a seta amarela. Use <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> ou as setas para andar, ou clique em um ponto do chão. Arraste com o botão direito para mover a câmera e use a roda do mouse para o zoom.', c: () => M.player.moved > 4 },
    { t: 'Assuma o caixa', b: 'Os clientes já estão chegando! Aproxime-se do caixa e aperte <kbd>E</kbd>, ou clique no caixa e escolha “Operar este caixa”. Enquanto você estiver lá, as compras são registradas.', c: () => !!M.player.atChk || M.S.stats.cust >= 2 },
    { t: 'Sua primeira venda', b: 'Espere um cliente chegar com a cesta. Cada venda aparece em verde e o dinheiro entra no saldo, no topo da tela.', c: () => M.S.stats.cust >= 1 },
    { t: 'Confira o estoque', b: 'Abra o painel <b>Estoque</b> na barra inferior (atalho <kbd>I</kbd>) para ver o depósito, as prateleiras e as entregas.', c: () => seen['panel:estoque'], hl: '#dock-estoque' },
    { t: 'Compre mercadorias', b: 'O estoque inicial acaba rápido. Abra <b>Fornecedores</b> (<kbd>F</kbd>), clique em <b>Pedido sugerido</b> e depois em <b>Fazer pedido</b>. Um caminhão trará as caixas até a porta.', c: () => M.S.nextOrderId > 1, hl: '#dock-fornecedores' },
    { t: 'Organize as prateleiras', b: 'Feche o painel e clique em uma prateleira da loja. Escolha os produtos de cada espaço e use <b>Ir repor</b> para levar mercadoria do depósito até ela.', c: () => seen['panel:obj'] },
    { t: 'Defina seus preços', b: 'Abra o <b>Catálogo</b> (<kbd>C</kbd>) e ajuste o preço de algum produto. Preços acima do mercado espantam clientes; abaixo dele, sua margem diminui.', c: () => seen.price, hl: '#dock-catalogo' },
    { t: 'Contrate sua equipe', b: 'Em <b>Equipe</b> (<kbd>H</kbd>) → <b>Contratar</b>, contrate um Operador de Caixa. Depois, um Repositor. Funcionários trabalham sozinhos, mesmo quando você está em outra loja.', c: () => M.S.stores.some((s) => s.emps.length), hl: '#dock-funcionarios' },
    { t: 'Construa algo novo', b: 'Abra <b>Construir</b> (<kbd>B</kbd>), escolha uma Prateleira e clique no piso. Gire com <kbd>R</kbd> e confirme com <kbd>Enter</kbd>. Novas prateleiras recebem produtos no painel de cada uma.', c: () => seen.built, hl: '#dock-build' },
    { t: 'O dia termina às 22h', b: 'No fechamento você verá o relatório com vendas, despesas e dicas. Use os botões de velocidade no topo para acelerar o tempo.', next: true },
    { t: 'Tudo pronto!', b: 'Cumpra as missões ao lado, suba de nível para liberar novos produtos e construções, e abra o <b>Mapa</b> (<kbd>M</kbd>) para comprar terrenos e abrir novas unidades. Bons negócios!', next: true, last: true },
  ];

  let glow = null;
  TU.start = function () { if (!M.S.tut.done) TU.render(); else hide(); };
  function hide() { const el = document.getElementById('tut'); if (el) el.hidden = true; if (glow) { glow.classList.remove('glow'); glow = null; } }
  TU.render = function () {
    const el = document.getElementById('tut'), S = M.S;
    if (!S || S.tut.done || M.R.view === 'menu') { hide(); return; }
    const st = STEPS[S.tut.step]; if (!st) { S.tut.done = true; hide(); return; }
    el.innerHTML = '<div class="tu-h"><span>Tutorial · ' + (S.tut.step + 1) + '/' + STEPS.length + '</span><button data-a="tutSkip">Pular tutorial</button></div><h3>' + st.t + '</h3><p>' + st.b + '</p>' +
      (st.next ? '<button class="btn primary" data-a="tutNext">' + (st.last ? 'Começar a jogar' : 'Próximo') + '</button>' : '<div class="tu-wait"><i></i>Esperando você…</div>');
    el.hidden = false;
    if (glow) glow.classList.remove('glow');
    glow = st.hl ? document.querySelector(st.hl) : null;
    if (glow) glow.classList.add('glow');
  };
  TU.advance = function () { M.S.tut.step++; M.audio.sfx('mission'); if (M.S.tut.step >= STEPS.length) M.S.tut.done = true; TU.render(); };
  M.ui.A.tutNext = () => TU.advance();
  M.ui.A.tutSkip = () => { M.S.tut.done = true; hide(); };
  setInterval(() => {
    if (!M.S || M.S.tut.done || M.R.view === 'menu') { const el = document.getElementById('tut'); if (el && !el.hidden) hide(); return; }
    const st = STEPS[M.S.tut.step];
    if (st && st.c && st.c()) TU.advance();
    else if (st && st.hl && (!glow || !document.body.contains(glow))) { glow = document.querySelector(st.hl); if (glow) glow.classList.add('glow'); }
  }, 400);
})();
