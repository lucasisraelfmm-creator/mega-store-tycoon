/* Catálogo de produtos: 11 categorias, centenas de itens.
   Linha: [nome, forma, cor, custo, demanda(1-10), validade(dias, 0 = não perecível), nível, expositor?]
   Novos pacotes de conteúdo podem registrar produtos via MST.packs.register (ver packs.js). */
(function () {
  'use strict';
  const M = window.MST;

  M.CATS = [
    { id: 'alimentos', name: 'Alimentos', color: '#e8a33d', markup: 1.36, fix: 'shelf' },
    { id: 'bebidas', name: 'Bebidas', color: '#3d9be8', markup: 1.42, fix: 'shelf' },
    { id: 'doces', name: 'Doces', color: '#e85d9b', markup: 1.55, fix: 'shelf' },
    { id: 'limpeza', name: 'Limpeza', color: '#2fc4b2', markup: 1.42, fix: 'shelf' },
    { id: 'higiene', name: 'Higiene Pessoal', color: '#9b7be8', markup: 1.46, fix: 'shelf' },
    { id: 'eletronicos', name: 'Eletrônicos', color: '#5c7cfa', markup: 1.3, fix: 'display' },
    { id: 'roupas', name: 'Roupas', color: '#ef6c57', markup: 1.75, fix: 'rack' },
    { id: 'brinquedos', name: 'Brinquedos', color: '#f4c430', markup: 1.58, fix: 'shelf' },
    { id: 'ferramentas', name: 'Ferramentas', color: '#8d99a6', markup: 1.46, fix: 'shelf' },
    { id: 'moveis', name: 'Móveis', color: '#a9744f', markup: 1.5, fix: 'pallet' },
    { id: 'luxo', name: 'Produtos de Luxo', color: '#d4af37', markup: 1.95, fix: 'display' },
  ];
  M.CAT = {};
  M.CATS.forEach((c) => (M.CAT[c.id] = c));

  M.FIX_NAMES = { shelf: 'Prateleira', fridge: 'Geladeira', produce: 'Banca de Hortifrúti', rack: 'Arara', display: 'Vitrine', pallet: 'Expositor de Piso' };

  const F = 'fridge', H = 'produce', S = 'shelf', D = 'display', P = 'pallet';
  const DATA = {
    alimentos: [
      ['Arroz 5kg', 'saco', '#f4efe2', 16, 9, 0, 1], ['Feijão 1kg', 'saco', '#7a4a2b', 5.2, 9, 0, 1],
      ['Macarrão', 'caixa', '#f2c84b', 2.8, 8, 0, 1], ['Pão de Forma', 'pao', '#d9a05b', 4.5, 8, 7, 1],
      ['Pão Francês (kg)', 'pao', '#e2b06a', 7.5, 9, 2, 1], ['Óleo de Soja', 'garrafa', '#f0c020', 5.5, 7, 0, 1],
      ['Açúcar 1kg', 'saco', '#ffffff', 3.2, 7, 0, 1], ['Sal 1kg', 'saco', '#cfe0ee', 1.6, 5, 0, 1],
      ['Café 500g', 'saco', '#5a3420', 11, 8, 0, 1], ['Farinha de Trigo', 'saco', '#f7f1dc', 3.4, 5, 0, 1],
      ['Molho de Tomate', 'lata', '#d63a2a', 2.2, 7, 0, 1], ['Biscoito Salgado', 'caixa', '#e9b65a', 2.6, 7, 0, 1],
      ['Leite 1L', 'caixa', '#eef5ff', 3.4, 9, 0, 1], ['Ovos (dúzia)', 'ovo', '#f3e2c0', 7.5, 8, 10, 1],
      ['Banana (kg)', 'fruta', '#f5d342', 3, 8, 4, 2, H], ['Maçã (kg)', 'fruta', '#d8342c', 5.5, 7, 6, 2, H],
      ['Tomate (kg)', 'fruta', '#e2452f', 4.2, 7, 4, 2, H], ['Alface', 'folha', '#6cc04a', 1.8, 6, 3, 2, H],
      ['Batata (kg)', 'fruta', '#c9a36a', 3.1, 7, 8, 2, H], ['Laranja (kg)', 'fruta', '#f39a1f', 2.8, 7, 6, 2, H],
      ['Cenoura (kg)', 'folha', '#f08a24', 2.9, 6, 7, 2, H], ['Uva (kg)', 'fruta', '#7b3fa0', 8.5, 5, 5, 3, H],
      ['Queijo Mussarela', 'queijo', '#f6d55c', 14, 7, 12, 2, F], ['Presunto', 'carne', '#e68a8a', 9, 6, 8, 2, F],
      ['Iogurte', 'pote', '#f2f2fa', 2.4, 7, 9, 2, F], ['Manteiga', 'caixa', '#f7dc6f', 6.8, 6, 14, 2, F],
      ['Carne Bovina (kg)', 'carne', '#b83a3a', 26, 8, 4, 2, F], ['Frango (kg)', 'carne', '#f1c9a5', 11, 8, 4, 2, F],
      ['Linguiça', 'carne', '#c0563e', 12, 6, 6, 2, F], ['Pizza Congelada', 'caixa', '#c0392b', 9.5, 6, 30, 3, F],
      ['Sorvete 2L', 'pote', '#f8bbd0', 12, 6, 40, 3, F], ['Lasanha Congelada', 'caixa', '#e67e22', 11, 5, 30, 3, F],
      ['Cereal Matinal', 'caixa', '#f39c12', 8.5, 6, 0, 2], ['Atum em Lata', 'lata', '#4a7fb5', 5.5, 5, 0, 2],
      ['Milho em Conserva', 'lata', '#f1c40f', 2.4, 5, 0, 2], ['Granola', 'saco', '#b98b52', 9, 4, 0, 3],
      ['Mel', 'pote', '#e8a317', 13, 4, 0, 3], ['Azeite Extra Virgem', 'garrafa', '#8a9a2b', 19, 5, 0, 3],
      ['Salmão (kg)', 'carne', '#fa8072', 58, 4, 3, 5, F], ['Queijo Brie', 'queijo', '#f5ecd0', 32, 3, 10, 5, F],
    ],
    bebidas: [
      ['Água Mineral 500ml', 'garrafa', '#bfe6ff', 0.9, 9, 0, 1], ['Refrigerante Cola 2L', 'garrafa', '#3a1f14', 4.8, 9, 0, 1],
      ['Refrigerante Guaraná 2L', 'garrafa', '#3f8f3a', 4.4, 8, 0, 1], ['Suco de Laranja 1L', 'caixa', '#f6a623', 4.2, 7, 0, 1],
      ['Refrigerante Lata', 'lata', '#d62f2f', 2.1, 9, 0, 1], ['Chá Gelado', 'garrafa', '#c98a3a', 3.2, 5, 0, 1],
      ['Água com Gás', 'garrafa', '#9fd8e8', 1.4, 5, 0, 1], ['Suco de Uva 1L', 'caixa', '#6a2c91', 5.6, 6, 0, 2],
      ['Energético', 'lata', '#1f6feb', 5.5, 6, 0, 2], ['Isotônico', 'garrafa', '#35c2ff', 3.6, 5, 0, 2],
      ['Cerveja Lata', 'lata', '#e0b030', 2.6, 9, 0, 2, F], ['Cerveja Long Neck', 'garrafa', '#6b4a1f', 4.2, 7, 0, 2, F],
      ['Água de Coco', 'caixa', '#7ed6a5', 4.4, 5, 0, 2, F], ['Leite Achocolatado', 'caixa', '#7b4a2b', 2.8, 6, 0, 2],
      ['Café Gelado', 'lata', '#4a2f20', 4.6, 4, 0, 3, F], ['Vinho Tinto', 'garrafa', '#5b1020', 24, 5, 0, 3],
      ['Vinho Branco', 'garrafa', '#e6dc9a', 26, 4, 0, 3], ['Espumante', 'garrafa', '#d8c66a', 34, 3, 0, 4],
      ['Cerveja Artesanal', 'garrafa', '#8a3d12', 11, 4, 0, 4, F], ['Kombucha', 'garrafa', '#e58fb0', 9, 3, 0, 4, F],
      ['Whisky 12 anos', 'garrafa', '#b06a1c', 95, 2, 0, 5], ['Gin Premium', 'garrafa', '#8fd3d0', 72, 2, 0, 5],
    ],
    doces: [
      ['Chocolate ao Leite', 'barra', '#6b3f22', 3.6, 9, 0, 1], ['Bala de Goma', 'bala', '#e84a7a', 1.9, 7, 0, 1],
      ['Pirulito', 'bala', '#ff5a5a', 0.6, 6, 0, 1], ['Chiclete', 'caixa', '#ff8ac0', 1.2, 7, 0, 1],
      ['Biscoito Recheado', 'caixa', '#3b5bdb', 2.2, 8, 0, 1], ['Paçoca', 'barra', '#c9a15a', 0.9, 5, 0, 1],
      ['Chocolate Branco', 'barra', '#f5ecd7', 3.9, 6, 0, 1], ['Wafer', 'caixa', '#d98c4a', 2, 6, 0, 1],
      ['Bombom Sortido', 'caixa', '#c0392b', 9.5, 6, 0, 2], ['Doce de Leite', 'pote', '#c98a4a', 7.5, 5, 0, 2],
      ['Goiabada', 'barra', '#a8323a', 4.2, 4, 0, 2], ['Brigadeiro', 'bala', '#4a2a18', 1.6, 6, 6, 2],
      ['Bolo Pronto', 'bolo', '#f0c27b', 12, 5, 5, 2], ['Chocolate Amargo 70%', 'barra', '#2e1a10', 7.8, 4, 0, 3],
      ['Barra de Cereal', 'barra', '#d8a850', 1.7, 6, 0, 2], ['Marshmallow', 'saco', '#ffd6e7', 4.8, 4, 0, 3],
      ['Torta de Limão', 'bolo', '#e9f08a', 18, 4, 4, 3, F], ['Pudim', 'bolo', '#e0a23a', 9, 4, 5, 3, F],
      ['Trufas Finas', 'caixa', '#5a2d3a', 22, 3, 0, 4], ['Ovo de Chocolate', 'ovo', '#7a4526', 28, 3, 0, 3],
      ['Panetone', 'bolo', '#d99a4e', 16, 3, 0, 3], ['Macarons', 'caixa', '#f4a6c9', 30, 2, 8, 5],
    ],
    limpeza: [
      ['Detergente', 'garrafa', '#f2d21b', 1.7, 9, 0, 2], ['Sabão em Pó 1kg', 'caixa', '#2f6fd6', 9.5, 8, 0, 2],
      ['Água Sanitária', 'garrafa', '#e8f1f5', 2.6, 7, 0, 2], ['Desinfetante', 'garrafa', '#8e44ad', 4.4, 7, 0, 2],
      ['Amaciante', 'garrafa', '#6fb7ff', 7.8, 6, 0, 2], ['Esponja', 'sabao', '#f1c40f', 1.1, 7, 0, 2],
      ['Saco de Lixo', 'rolo', '#2d3436', 4.6, 6, 0, 2], ['Papel Toalha', 'rolo', '#ffffff', 4.2, 7, 0, 2],
      ['Limpa Vidros', 'spray', '#4fc3f7', 6.5, 4, 0, 2], ['Multiuso', 'spray', '#ff7f50', 4.8, 6, 0, 2],
      ['Sabão em Barra', 'sabao', '#f5e6a8', 1.9, 5, 0, 2], ['Lustra Móveis', 'spray', '#b9770e', 7.2, 3, 0, 3],
      ['Inseticida', 'spray', '#27ae60', 9.8, 4, 0, 3], ['Vassoura', 'escova', '#c0392b', 11, 3, 0, 3],
      ['Rodo', 'escova', '#2980b9', 9, 3, 0, 3], ['Balde', 'pote', '#3498db', 8, 3, 0, 3],
      ['Luvas de Borracha', 'bolsa', '#f7dc6f', 4.9, 3, 0, 3], ['Alvejante', 'garrafa', '#ecf0f1', 5.8, 4, 0, 3],
      ['Cera Líquida', 'garrafa', '#e59866', 8.5, 2, 0, 4], ['Limpador Perfumado', 'garrafa', '#af7ac5', 6.4, 4, 0, 4],
    ],
    higiene: [
      ['Sabonete', 'sabao', '#f8c8dc', 1.6, 9, 0, 2], ['Creme Dental', 'tubo', '#e74c3c', 3.2, 9, 0, 2],
      ['Papel Higiênico 12un', 'rolo', '#f7f9fb', 11, 9, 0, 2], ['Shampoo', 'frasco', '#48c9b0', 9.5, 7, 0, 2],
      ['Condicionador', 'frasco', '#f5b041', 10.5, 6, 0, 2], ['Desodorante', 'spray', '#5dade2', 8.2, 7, 0, 2],
      ['Escova de Dentes', 'escova', '#3498db', 3.8, 6, 0, 2], ['Fio Dental', 'caixa', '#d5f5e3', 3.4, 4, 0, 2],
      ['Absorvente', 'caixa', '#f1948a', 5.6, 6, 0, 2], ['Fralda Descartável', 'saco', '#aed6f1', 28, 5, 0, 3],
      ['Lâmina de Barbear', 'caixa', '#566573', 9.8, 4, 0, 3], ['Hidratante', 'frasco', '#fadbd8', 12, 4, 0, 3],
      ['Protetor Solar', 'tubo', '#f39c12', 22, 4, 0, 3], ['Enxaguante Bucal', 'garrafa', '#76d7c4', 9.2, 4, 0, 3],
      ['Algodão', 'saco', '#ffffff', 2.9, 3, 0, 3], ['Cotonetes', 'caixa', '#d6eaf8', 2.6, 4, 0, 3],
      ['Sabonete Líquido', 'frasco', '#d2b4de', 7.4, 5, 0, 3], ['Gel de Cabelo', 'pote', '#3498db', 8.8, 3, 0, 4],
      ['Tintura de Cabelo', 'caixa', '#873600', 16, 3, 0, 4], ['Creme Antirrugas', 'pote', '#f9e79f', 38, 2, 0, 5],
    ],
    eletronicos: [
      ['Pilhas AA (4un)', 'caixa', '#f39c12', 8, 7, 0, 4, S], ['Carregador USB', 'caixa', '#ecf0f1', 18, 6, 0, 4, S],
      ['Cabo USB-C', 'caixa', '#34495e', 12, 6, 0, 4, S], ['Fone de Ouvido', 'fone', '#2c3e50', 35, 6, 0, 4],
      ['Mouse Sem Fio', 'console', '#7f8c8d', 42, 5, 0, 4], ['Teclado', 'laptop', '#2d3436', 65, 4, 0, 4],
      ['Caixa de Som Bluetooth', 'console', '#e74c3c', 85, 5, 0, 4], ['Lâmpada LED Smart', 'luminaria', '#f9e79f', 28, 5, 0, 4, S],
      ['Power Bank', 'celular', '#1abc9c', 60, 4, 0, 4], ['Smartwatch', 'relogio', '#2c3e50', 220, 4, 0, 4],
      ['Smartphone Básico', 'celular', '#5d6d7e', 520, 5, 0, 4], ['Smartphone Premium', 'celular', '#1b2631', 2400, 3, 0, 5],
      ['Tablet', 'celular', '#aab7b8', 890, 3, 0, 5], ['Notebook', 'laptop', '#95a5a6', 2100, 3, 0, 5],
      ['Notebook Gamer', 'laptop', '#c0392b', 4600, 2, 0, 6], ['TV 43"', 'tv', '#1c2833', 1350, 3, 0, 5, P],
      ['TV 65" 4K', 'tv', '#17202a', 3200, 2, 0, 6, P], ['Videogame', 'console', '#2e4053', 2300, 3, 0, 5],
      ['Fone Bluetooth Premium', 'fone', '#f4f6f7', 480, 3, 0, 5], ['Câmera Digital', 'camera', '#34495e', 1500, 2, 0, 6],
      ['Drone', 'camera', '#e67e22', 2800, 1, 0, 6], ['Impressora', 'console', '#bdc3c7', 420, 2, 0, 5],
      ['Roteador Wi-Fi', 'console', '#ecf0f1', 140, 3, 0, 4], ['Soundbar', 'console', '#212f3d', 780, 2, 0, 6],
    ],
    roupas: [
      ['Camiseta Básica', 'camiseta', '#ecf0f1', 14, 8, 0, 4], ['Camiseta Estampada', 'camiseta', '#e74c3c', 19, 7, 0, 4],
      ['Calça Jeans', 'calca', '#2e5c9a', 48, 7, 0, 4], ['Bermuda', 'calca', '#c9a66b', 28, 6, 0, 4],
      ['Vestido Casual', 'vestido', '#e84393', 52, 5, 0, 4], ['Camisa Social', 'camiseta', '#85c1e9', 45, 5, 0, 4],
      ['Moletom', 'camiseta', '#7f8c8d', 60, 5, 0, 4], ['Meias (3 pares)', 'sapato', '#ffffff', 9, 6, 0, 4],
      ['Tênis Casual', 'sapato', '#e67e22', 85, 6, 0, 4], ['Chinelo', 'sapato', '#27ae60', 12, 7, 0, 4],
      ['Boné', 'bone', '#2c3e50', 18, 5, 0, 4], ['Jaqueta Jeans', 'camiseta', '#3b6fb5', 95, 4, 0, 5],
      ['Saia', 'vestido', '#8e44ad', 38, 4, 0, 4], ['Pijama', 'camiseta', '#f8c471', 36, 4, 0, 4],
      ['Cueca/Calcinha (kit)', 'calca', '#d7bde2', 16, 5, 0, 4], ['Sapato Social', 'sapato', '#3b2a1a', 120, 3, 0, 5],
      ['Bolsa Feminina', 'bolsa', '#a04000', 75, 4, 0, 5], ['Cinto de Couro', 'bolsa', '#5d4037', 32, 3, 0, 5],
      ['Casaco de Lã', 'camiseta', '#6e2c00', 140, 3, 0, 5], ['Vestido de Festa', 'vestido', '#1a5276', 190, 2, 0, 6],
      ['Terno Completo', 'camiseta', '#1c2833', 380, 2, 0, 6], ['Tênis Esportivo Pro', 'sapato', '#00b894', 260, 3, 0, 6],
    ],
    brinquedos: [
      ['Bola de Futebol', 'bola', '#ffffff', 16, 7, 0, 3], ['Carrinho', 'carro', '#e74c3c', 9, 8, 0, 3],
      ['Boneca', 'boneca', '#f8a5c2', 28, 7, 0, 3], ['Urso de Pelúcia', 'urso', '#c08a52', 24, 6, 0, 3],
      ['Blocos de Montar', 'blocos', '#f1c40f', 35, 7, 0, 3], ['Quebra-Cabeça', 'caixa', '#16a085', 18, 5, 0, 3],
      ['Massinha', 'pote', '#9b59b6', 6, 6, 0, 3], ['Jogo de Cartas', 'caixa', '#c0392b', 8, 5, 0, 3],
      ['Pião', 'bola', '#e67e22', 4, 4, 0, 3], ['Bolhas de Sabão', 'frasco', '#74b9ff', 3.5, 5, 0, 3],
      ['Jogo de Tabuleiro', 'caixa', '#2980b9', 45, 5, 0, 3], ['Pista de Carrinhos', 'carro', '#f39c12', 80, 4, 0, 4],
      ['Dinossauro', 'urso', '#27ae60', 22, 5, 0, 3], ['Kit Médico Infantil', 'caixa', '#ecf0f1', 26, 3, 0, 4],
      ['Patinete', 'carro', '#00cec9', 110, 3, 0, 4], ['Bicicleta Infantil', 'carro', '#d63031', 280, 3, 0, 5, P],
      ['Casa de Bonecas', 'armario', '#fd79a8', 190, 2, 0, 5, P], ['Robô Interativo', 'boneca', '#636e72', 240, 2, 0, 5],
      ['Carro de Controle Remoto', 'carro', '#0984e3', 130, 4, 0, 4], ['Castelo de Blocos', 'blocos', '#a29bfe', 320, 2, 0, 6],
    ],
    ferramentas: [
      ['Martelo', 'martelo', '#7f8c8d', 14, 6, 0, 3], ['Chave de Fenda', 'chave', '#e67e22', 6, 7, 0, 3],
      ['Alicate', 'chave', '#c0392b', 12, 5, 0, 3], ['Trena 5m', 'console', '#f1c40f', 9, 5, 0, 3],
      ['Fita Isolante', 'rolo', '#2d3436', 2.8, 7, 0, 3], ['Parafusos (cx)', 'caixa', '#95a5a6', 5.5, 6, 0, 3],
      ['Pincel', 'escova', '#d35400', 4.5, 5, 0, 3], ['Tinta 3,6L', 'pote', '#3498db', 48, 5, 0, 3],
      ['Lanterna', 'spray', '#f39c12', 16, 4, 0, 3], ['Cadeado', 'bolsa', '#b7950b', 11, 5, 0, 3],
      ['Jogo de Chaves', 'chave', '#566573', 38, 4, 0, 4], ['Serrote', 'martelo', '#a04000', 22, 3, 0, 4],
      ['Furadeira', 'furadeira', '#f1c40f', 150, 4, 0, 4], ['Parafusadeira', 'furadeira', '#27ae60', 180, 4, 0, 4],
      ['Escada 5 Degraus', 'armario', '#bdc3c7', 120, 2, 0, 4, P], ['Caixa de Ferramentas', 'caixa', '#c0392b', 65, 3, 0, 4],
      ['Serra Circular', 'furadeira', '#e74c3c', 340, 2, 0, 5], ['Compressor de Ar', 'console', '#2980b9', 560, 1, 0, 6, P],
      ['Lixadeira', 'furadeira', '#8e44ad', 210, 2, 0, 5], ['Mangueira 20m', 'rolo', '#27ae60', 42, 3, 0, 4],
    ],
    moveis: [
      ['Banqueta', 'cadeira', '#c08a52', 60, 5, 0, 5], ['Cadeira de Jantar', 'cadeira', '#8d5a34', 110, 5, 0, 5],
      ['Cadeira de Escritório', 'cadeira', '#2d3436', 260, 4, 0, 5], ['Mesa de Centro', 'mesa', '#a9744f', 180, 4, 0, 5],
      ['Mesa de Jantar', 'mesa', '#6e4b2a', 620, 3, 0, 5], ['Escrivaninha', 'mesa', '#d7ccc8', 340, 4, 0, 5],
      ['Estante de Livros', 'armario', '#8d6e63', 290, 4, 0, 5], ['Guarda-Roupa', 'armario', '#bcaaa4', 890, 3, 0, 5],
      ['Cômoda', 'armario', '#a1887f', 420, 3, 0, 5], ['Sofá 2 Lugares', 'sofa', '#607d8b', 950, 3, 0, 5],
      ['Sofá Retrátil', 'sofa', '#455a64', 1900, 2, 0, 6], ['Poltrona', 'sofa', '#c0392b', 540, 3, 0, 5],
      ['Cama Solteiro', 'cama', '#90caf9', 520, 3, 0, 5], ['Cama Casal', 'cama', '#ce93d8', 980, 3, 0, 5],
      ['Colchão Casal', 'cama', '#f5f5f5', 760, 3, 0, 5], ['Rack para TV', 'mesa', '#4e342e', 380, 3, 0, 5],
      ['Luminária de Piso', 'luminaria', '#ffe082', 150, 3, 0, 5], ['Abajur', 'luminaria', '#ffab91', 70, 4, 0, 5],
      ['Espelho Grande', 'tv', '#b3e5fc', 210, 2, 0, 5], ['Cama King Premium', 'cama', '#263238', 3400, 1, 0, 7],
    ],
    luxo: [
      ['Perfume Importado', 'perfume', '#f7dc6f', 320, 5, 0, 6], ['Relógio Suíço', 'relogio', '#d4af37', 4800, 2, 0, 6],
      ['Anel de Ouro', 'joia', '#f1c40f', 1900, 3, 0, 6], ['Colar de Pérolas', 'joia', '#fdfefe', 2600, 2, 0, 6],
      ['Brincos de Diamante', 'joia', '#aeeaff', 5200, 2, 0, 6], ['Óculos de Grife', 'oculos', '#1c2833', 780, 4, 0, 6],
      ['Bolsa de Grife', 'bolsa', '#6c3483', 3900, 2, 0, 6], ['Caneta Tinteiro', 'chave', '#1b2631', 650, 3, 0, 6],
      ['Carteira de Couro Fino', 'bolsa', '#784212', 540, 3, 0, 6], ['Lenço de Seda', 'vestido', '#f5b7b1', 420, 3, 0, 6],
      ['Champanhe Safrado', 'garrafa', '#d4ac0d', 880, 3, 0, 6], ['Caviar', 'lata', '#17202a', 1200, 1, 20, 7, F],
      ['Trufas Negras', 'pote', '#3e2723', 950, 1, 10, 7, F], ['Relógio Cravejado', 'relogio', '#aeeaff', 14500, 1, 0, 7],
      ['Colar de Esmeraldas', 'joia', '#2ecc71', 9800, 1, 0, 7], ['Escultura de Cristal', 'joia', '#d6eaf8', 2800, 2, 0, 7],
      ['Sapato Italiano', 'sapato', '#4e342e', 1600, 2, 0, 7], ['Casaco de Caxemira', 'camiseta', '#bfa27a', 2900, 2, 0, 7],
      ['Mala de Viagem Premium', 'bolsa', '#34495e', 2200, 2, 0, 7], ['Conjunto de Chá Porcelana', 'pote', '#fdfefe', 1400, 2, 0, 7],
    ],
  };

  M.PRODUCTS = [];
  M.P = {};
  M.addProduct = function (cat, row) {
    const c = M.CAT[cat];
    // id estável (não depende da ordem), para que saves sobrevivam a novos produtos
    const id = cat.slice(0, 3) + '_' + row[0].toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '');
    const p = { id, idx: M.PRODUCTS.length, cat, name: row[0], shape: row[1], color: row[2], cost: row[3], demand: row[4], life: row[5], lvl: row[6], fix: row[7] || c.fix };
    p.base = Math.round(p.cost * c.markup * 100) / 100; // preço sugerido de referência
    // itens caros ocupam mais espaço
    p.bulk = p.cost > 1500 ? 0.35 : p.cost > 400 ? 0.5 : p.cost > 100 ? 0.75 : 1;
    M.PRODUCTS.push(p);
    M.P[id] = p;
    return p;
  };
  for (const cat of M.CATS) for (const row of DATA[cat.id]) M.addProduct(cat.id, row);

  M.productsUnlocked = (lvl) => M.PRODUCTS.filter((p) => p.lvl <= lvl);
})();
