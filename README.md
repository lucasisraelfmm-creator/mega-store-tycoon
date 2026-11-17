# MEGA STORE TYCOON

Jogo 2D de simulação e gestão de varejo, em visão top-down. Você começa com uma pequena loja de bairro, poucas prateleiras e pouco dinheiro, e transforma o negócio em um império comercial com supermercados, lojas especializadas, shoppings, centros de distribuição e escritório central.

Feito em **HTML, CSS e JavaScript puro com Canvas 2D**, sem dependências nem etapa de build. Roda direto no navegador e pode ser publicado no GitHub Pages.

## Como jogar

Abra o `index.html` por um servidor local (o navegador bloqueia alguns recursos em `file://`):

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

### Controles

| Tecla / ação | Função |
| --- | --- |
| WASD / setas | Mover o personagem (na loja) ou a câmera (no mapa) |
| Clique no chão | Andar até o ponto |
| Clique em objeto | Gerenciar prateleira, caixa, estante... |
| E | Interagir: operar caixa, repor prateleira, descarregar doca, limpar |
| Arrastar / botão direito | Mover a câmera |
| Roda do mouse / pinça | Zoom |
| B | Modo construção · R gira · Enter confirma · Esc cancela |
| Espaço | Pausar o tempo · 1, 2, 3 = velocidade 1x, 2x, 4x |
| M / L | Mapa da cidade / voltar à loja |
| C, I, F, H, G, K, J | Catálogo, Estoque, Fornecedores, Equipe, Finanças, Empresa, Missões |
| Esc | Fechar painel ou abrir o menu de pausa |

## Sistemas

- **Mundo:** cidade procedural com bairro residencial, centro comercial e área industrial, ruas com trânsito, pedestres, estacionamentos, depósitos, fábricas, parque e terrenos à venda. Renderização em *chunks* com cache LRU (carregamento sob demanda), zoom e câmera livre.
- **Construção:** paredes, portas automáticas, janelas, 7 tipos de piso, 7 expositores, caixas, autoatendimento, estantes de depósito e mais de 15 decorações. Grade, rotação, mover, demolir com reembolso, pré-visualização e confirmação. Ampliação do prédio e personalização da fachada (cor, letreiro, toldo).
- **Produtos:** 258 produtos em 11 categorias (alimentos, bebidas, doces, limpeza, higiene, eletrônicos, roupas, brinquedos, ferramentas, móveis e luxo), cada um com ícone próprio, custo, preço, demanda, validade, margem, nível de desbloqueio e tipo de expositor. Os produtos aparecem nas prateleiras conforme o estoque.
- **Clientes com IA:** 6 personalidades (econômico, apressado, exigente, família, impulsivo, abastado), orçamento, lista de compras, avaliação de preço em relação ao mercado, filas com paciência, satisfação, furtos e sujeira. A avaliação da loja reflete a experiência.
- **Funcionários:** operador de caixa, repositor, estoquista, faxineiro, segurança, gerente e entregador. Habilidades, nível, experiência, eficiência e satisfação. Contratação, demissão, treinamento, promoção, aumento, transferência e escalas de turno. Todos trabalham sozinhos.
- **Fornecedores e estoque:** 10 fornecedores com preços, prazos, pedido mínimo, confiabilidade e relacionamento. Desconto por volume, negociação diária, caminhões animados, doca, depósito com capacidade, lotes com validade (FIFO) e reposição automática.
- **Finanças:** saldo, vendas, custo das mercadorias, salários, aluguel, manutenção, impostos, compras, juros. Gráficos diário, semanal e mensal, relatório de fechamento em formato de cupom, empréstimos e valor da empresa. Preço editável para cada produto, margens por categoria e promoções.
- **Expansão:** compra de terrenos, 8 tipos de estabelecimento (Pequena Loja, Mercado de Bairro, Supermercado, Grande Supermercado, Loja de Roupas, Loja de Eletrônicos, Loja de Móveis, Centro Comercial), centro de distribuição e escritório central. Cada unidade tem equipe, estoque, despesas e faturamento próprios.
- **Concorrência:** 4 empresas com estratégias diferentes que abrem lojas, ajustam preços, fazem promoções, investem em qualidade e disputam participação de mercado.
- **Missões e eventos:** missões diárias e semanais, desafios em datas comemorativas (Ano Novo, Carnaval, Páscoa, Dia das Mães, Festa Junina, Dia dos Pais, Dia das Crianças, Black Friday, Natal...), eventos aleatórios e 18 objetivos especiais.
- **Progressão:** 7 níveis (Pequena Loja → Império Empresarial), cada um liberando produtos, construções, funções, fornecedores e campanhas.
- **Áudio:** trilha ambiente e efeitos sintetizados com Web Audio, com volumes independentes.
- **Salvamento:** automático e manual em 3 espaços, exportação/importação por código ou arquivo, validação e migração de versões.
- **Tutorial interativo** que espera cada ação real do jogador.

## Estrutura

```
index.html          página e ordem de carregamento
style.css           interface
src/core.js         namespace, constantes, utilitários, barramento de eventos
src/products.js     catálogo de produtos e categorias
src/sprites.js      ícones e personagens desenhados proceduralmente
src/pathfinding.js  BFS em grade e movimento dos agentes
src/inventory.js    depósito, prateleiras, doca, validade
src/building.js     peças, grade, modelos de loja, modo construção
src/stores.js       tipos de estabelecimento, abertura, reforma, venda
src/economy.js      livro-razão, preços, promoções, marketing, empréstimos
src/suppliers.js    fornecedores, pedidos, caminhões, reposição automática
src/employees.js    funções, RH e comportamento autônomo
src/customers.js    IA dos clientes
src/world.js        cidade, terrenos, trânsito e renderização do mapa
src/competitors.js  empresas concorrentes
src/missions.js     níveis, missões, eventos e objetivos
src/fx.js           partículas e efeitos
src/audio.js        música e efeitos sonoros
src/player.js       avatar do jogador
src/render.js       renderização da loja (piso, paredes, objetos, luz)
src/packs.js        pacotes de conteúdo
src/save.js         salvamento
src/ui.js           HUD, menus, modais, construção
src/panels.js       painéis de gestão
src/tutorial.js     tutorial
src/game.js         estado, loop e ciclo diário
src/main.js         inicialização e entrada
```

Toda a arte é gerada em código, então a pasta `assets/` não é necessária. Ela pode ser criada no futuro para sprites ou áudio de pacotes adicionais.

## Publicar no GitHub Pages

1. Envie o repositório para o GitHub.
2. Em **Settings → Pages**, escolha *Deploy from a branch*, branch `main`, pasta `/ (root)`.
3. O jogo fica disponível em `https://<usuario>.github.io/<repositorio>/`.

## Preparado para conteúdo adicional

O arquivo `src/packs.js` define o ponto de extensão para expansões, novos produtos, pacotes de decoração, opções de fachada e itens cosméticos. Um pacote é um arquivo JavaScript carregado depois de `packs.js` que chama `MST.packs.register({...})`. O jogo base já inclui o pacote gratuito **Verão Tropical** como exemplo.

- `MST.EDITION` identifica a edição (base ou premium). Pacotes marcados com `premium: true` só são ativados em uma edição premium.
- Saves são compatíveis entre versões: produtos têm IDs estáveis e a migração remove com segurança itens de pacotes ausentes.
- Não há compras simuladas nem botões sem função. A tela "Conteúdo e créditos" lista apenas o que está realmente instalado.

Ideias de evolução: novos mapas (litoral, metrópole), pacotes temáticos de decoração, novas categorias, modo campanha com objetivos por cidade e trilhas sonoras adicionais.
