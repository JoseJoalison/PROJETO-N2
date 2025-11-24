// Número do WhatsApp para abrir o chat com o pedido.
// Troque por outro número se necessário (formato internacional, sem +).
const NUMERO_WHATSAPP = '5561999577146';

// Converte um número para uma string em reais (BRL) de forma amigável.
// Nota: recebe um número e devolve algo como "R$ 10,00".
function formatarBRL(valor) {
  // Usa a formatação local do navegador quando possível.
  try {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  } catch (e) {
    // Queda segura: monta a string manualmente se algo falhar.
    return 'R$ ' + (Number(valor) || 0).toFixed(2).replace('.', ',');
  }
}

// Pega um preço que vem como texto (ex: "R$ 10,00") e transforma em número.
// Nota: tira símbolos e vírgulas para conseguir fazer contas.
function parsePreco(texto) {
  if (!texto) return 0;
  // Remove tudo que não seja número, vírgula, ponto ou sinal negativo
  var cleaned = String(texto).replace(/[^0-9,\.\-]/g, '').replace(/,/g, '.');
  return parseFloat(cleaned) || 0;
}

// Estrutura em memória do carrinho: array de { nome, preco, qtd, descricao }.
var meuCarrinho = [];
var recommendationControlsReady = false;
// Chave usada no localStorage para persistir o carrinho entre visitas.
const CHAVE_CARRINHO = 'cartItems';

// Salva o carrinho no armazenamento local do navegador.
// Nota: guarda o que o cliente escolheu mesmo se a página for fechada.
function salvarCarrinho() {
  try { localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(meuCarrinho)); }
  catch (e) { console.warn('Não foi possível salvar o carrinho', e); }
}

// Tenta recuperar o carrinho salvo no navegador quando a página carrega.
// Nota: se o cliente já tinha itens, eles voltam para a página.
function carregarCarrinho() {
  try {
    var raw = localStorage.getItem(CHAVE_CARRINHO);
    if (!raw) return;
    var list = JSON.parse(raw);
    if (!Array.isArray(list)) return;
    // Normaliza cada item para garantir os tipos corretos (número e inteiro).
    meuCarrinho = list.map(function (it) { return { nome: it.nome, preco: parseFloat(it.preco) || 0, qtd: parseInt(it.qtd, 10) || 1, descricao: it.descricao || '' }; });
  } catch (e) { console.warn('Erro ao carregar carrinho', e); }
}

// Retorna o elemento raiz do painel do carrinho (pode variar conforme layout).
function getPanelRoot() {
  return document.getElementById('cart_panel_submenu') || document.getElementById('cart_panel');
}

function findInPanelById(id) {
  var panel = getPanelRoot();
  if (panel) return panel.querySelector('#' + id);
  return document.getElementById(id);
}

// Procura um item no carrinho pelo nome e retorna o objeto (ou null).
// Nota: usado para saber se já existe o mesmo produto no carrinho.
function encontrarItem(nome) {
  for (var i = 0; i < meuCarrinho.length; i++) { if (meuCarrinho[i].nome === nome) return meuCarrinho[i]; }
  return null;
}

// Adiciona 1 unidade do produto ao carrinho.
// Nota: se o produto já existe, só aumenta a quantidade.
function adicionarAoCarrinho(nome, preco, descricao) {
  var item = encontrarItem(nome);
  if (item) {
    item.qtd = item.qtd + 1;
  } else {
    meuCarrinho.push({ nome: nome, preco: preco, qtd: 1, descricao: descricao || '' });
  }
  salvarCarrinho();
  renderizarCarrinho();
}

// Adiciona uma quantidade específica do produto ao carrinho.
// Nota: útil para recomendações que sugerem mais de uma unidade.
function adicionarAoCarrinhoQtd(nome, preco, qtd, descricao) {
  qtd = parseInt(qtd, 10) || 1;
  if (qtd < 1) return;
  var item = encontrarItem(nome);
  if (item) {
    item.qtd = item.qtd + qtd;
  } else {
    meuCarrinho.push({ nome: nome, preco: preco, qtd: qtd, descricao: descricao || '' });
  }
  salvarCarrinho();
  renderizarCarrinho();
}

// Remove um produto do carrinho totalmente (todas as unidades).
function removerDoCarrinho(nome) {
  for (var i = 0; i < meuCarrinho.length; i++) { if (meuCarrinho[i].nome === nome) { meuCarrinho.splice(i, 1); break; } }
  salvarCarrinho();
  renderizarCarrinho();
}

// Altera a quantidade de um produto (delta pode ser +1 ou -1).
// Nota: botões + e - chamam essa função para ajustar a quantidade.
function alterarQuantidade(nome, delta) {
  var it = encontrarItem(nome);
  if (!it) return;
  it.qtd = it.qtd + delta;
  if (it.qtd < 1) {
    removerDoCarrinho(nome);
  } else {
    salvarCarrinho();
    renderizarCarrinho();
  }
}

// Lê qual forma de pagamento o cliente escolheu (se houver opções).
// Nota: devolve 'cartao' ou 'dinheiro' (padrão é 'dinheiro').
function pagamentoSelecionado() {
  var radios = document.getElementsByName('payment');
  for (var i = 0; i < radios.length; i++) {
    if (radios[i].checked) return radios[i].value;
  }
  return 'dinheiro';
}

// Calcula subtotal, taxa (se pagar no cartão) e total, atualiza a UI.
// Nota: soma os preços, adiciona uma taxa se necessário e mostra na página.
function atualizarTotais() {
  var subtotal = 0;
  for (var i = 0; i < meuCarrinho.length; i++) { subtotal += meuCarrinho[i].preco * meuCarrinho[i].qtd; }
  var pagamento = pagamentoSelecionado();
  // Exemplo simples: taxa fixa de R$1,00 para pagamento com cartão (pode ajustar).
  var taxa = (pagamento === 'cartao') ? 1.00 : 0;
  var total = subtotal + taxa;

  var subEl = findInPanelById('cart_subtotal');
  var totEl = findInPanelById('cart_total');
  if (subEl) subEl.innerText = formatarBRL(subtotal);
  if (totEl) totEl.innerText = formatarBRL(total);

  // Desabilita o botão do WhatsApp se o carrinho estiver vazio.
  var btn = findInPanelById('whatsapp_btn'); if (btn) btn.disabled = (meuCarrinho.length === 0);

  return { subtotal: subtotal, taxa: taxa, total: total, pagamento: pagamento };
}

function renderizarCarrinho() {
  var tableBody = findInPanelById('cart_table_body');
  var ul = findInPanelById('cart_items');

  // Se existe uma tabela (página de carrinho), mostra as linhas nela.
  // Nota: usamos fragmentos para não deixar a página lenta.
  if (tableBody) {
    tableBody.innerHTML = '';
    if (!meuCarrinho || meuCarrinho.length === 0) {
      var trEmpty = document.createElement('tr');
      trEmpty.className = 'empty_cart';
      trEmpty.innerHTML = '<td colspan="5" class="secundario">Carrinho vazio — adicione itens no cardápio</td>';
      tableBody.appendChild(trEmpty);
    } else {
      var frag = document.createDocumentFragment();
      for (var i = 0; i < meuCarrinho.length; i++) {
        var it = meuCarrinho[i];
        var tr = document.createElement('tr');
        // Mostrar apenas o nome do item (sem descrição) na coluna "Item".
        var nomeTd = '<td class="item_name"><div class="item_name_title">' + it.nome + '</div></td>';
        var precoTd = '<td class="item_price">' + formatarBRL(it.preco) + '</td>';
        // Botões + e - atualizam a quantidade chamando `alterarQuantidade`.
        var qtyTd = '<td class="item_qty_td"><button class="qty_minus" onclick="alterarQuantidade(\'' + escapeQuote(it.nome) + '\', -1)">-</button> <span class="item_qty">' + it.qtd + '</span> <button class="qty_plus" onclick="alterarQuantidade(\'' + escapeQuote(it.nome) + '\', 1)">+</button></td>';
        var totalTd = '<td class="item_total">' + formatarBRL(it.preco * it.qtd) + '</td>';
        var actionTd = '<td class="item_actions"><button onclick="removerDoCarrinho(\'' + escapeQuote(it.nome) + '\')" class="remove_item">Remover</button></td>';
        tr.innerHTML = nomeTd + precoTd + qtyTd + totalTd + actionTd;
        frag.appendChild(tr);
      }
      tableBody.appendChild(frag);
    }
  }

  // Fallback: if old-list exists, keep previous behavior (also uses fragment)
  if (ul) {
    ul.innerHTML = '';
    if (!meuCarrinho || meuCarrinho.length === 0) {
      var emptyLi = document.createElement('li');
      emptyLi.className = 'empty_cart';
      emptyLi.innerHTML = '<div class="item_left"><div class="item_name">Carrinho vazio</div><div class="secundario">Adicione itens no cardápio</div></div>';
      ul.appendChild(emptyLi);
    } else {
      var fragUl = document.createDocumentFragment();
      for (var j = 0; j < meuCarrinho.length; j++) {
        var it2 = meuCarrinho[j];
        var li2 = document.createElement('li');
        var html2 = '';
        html2 += '<div class="item_left">';
        html2 += '<div class="item_name">' + it2.nome + '</div>';
        // Mostra preço unitário, quantidade e o total daquele item.
        html2 += '<div class="secundario">' + formatarBRL(it2.preco) + ' x ' + it2.qtd + ' = ' + formatarBRL(it2.preco * it2.qtd) + '</div>';
        html2 += '</div>';
        html2 += '<div class="item_right">';
        html2 += '<button class="qty_minus" onclick="alterarQuantidade(\'' + escapeQuote(it2.nome) + '\', -1)">-</button>';
        html2 += '<div class="item_qty">' + it2.qtd + '</div>';
        html2 += '<button class="qty_plus" onclick="alterarQuantidade(\'' + escapeQuote(it2.nome) + '\', 1)">+</button>';
        html2 += '<button onclick="removerDoCarrinho(\'' + escapeQuote(it2.nome) + '\')" class="remove_item">Remover</button>';
        html2 += '</div>';
        li2.innerHTML = html2;
        fragUl.appendChild(li2);
      }
      ul.appendChild(fragUl);
    }
  }

  atualizarTotais();
  ajustarAlturaCarrinho();
  gerarRecomendacao();
  atualizarMiniResumo();
}

function escapeQuote(s) {
  if (!s) return '';
  return String(s).replace(/'/g, "\\'");
}

function ajustarAlturaCarrinho() {
  var panel = getPanelRoot();
  if (!panel) return;
  var h;
  if (panel.classList && panel.classList.contains('collapsed')) {
    var collapsed = getComputedStyle(document.documentElement).getPropertyValue('--cart-collapsed-height');
    h = parseInt(collapsed, 10) || 42;
  } else {
    h = panel.offsetHeight || 80;
  }
  document.documentElement.style.setProperty('--cart-height', h + 'px');
}
function toggleCartPanel(force) {
  var panel = getPanelRoot();
  var btn = panel ? panel.querySelector('.cart_toggle') : null;
  if (!panel) return;
  var isCollapsed = panel.classList.contains('collapsed');
  var willCollapse = (typeof force === 'boolean') ? force : !isCollapsed;
  if (willCollapse) panel.classList.add('collapsed'); else panel.classList.remove('collapsed');
  if (btn) {
    btn.setAttribute('aria-expanded', (!willCollapse).toString());
    var totalQty = 0, subtotal = 0;
    for (var i = 0; i < meuCarrinho.length; i++) { totalQty += meuCarrinho[i].qtd; subtotal += (meuCarrinho[i].preco * meuCarrinho[i].qtd); }
    var price = formatarBRL(subtotal);
    if (willCollapse) btn.innerHTML = '<span class="cart-open">▸</span> <span class="cart-label">Carrinho</span>'; else btn.innerHTML = '<span class="cart-open">▾</span> <span class="cart-label">Carrinho</span>';
  }
  ajustarAlturaCarrinho();
  atualizarMiniResumo();
}

function atualizarMiniResumo() {
  var countEl = findInPanelById('cart_mini_count');
  var totalEl = findInPanelById('cart_mini_total');
  var totalQty = 0;
  var subtotal = 0;
  for (var i = 0; i < meuCarrinho.length; i++) { totalQty += meuCarrinho[i].qtd; subtotal += meuCarrinho[i].preco * meuCarrinho[i].qtd; }
  if (countEl) countEl.innerText = totalQty;
  if (totalEl) totalEl.innerText = formatarBRL(subtotal);
  
  var toggleBtn = getPanelRoot() ? getPanelRoot().querySelector('.cart_toggle') : null;
  if (toggleBtn) {
    var panel = getPanelRoot();
    var isCollapsed = panel && panel.classList && panel.classList.contains('collapsed');
    var price = formatarBRL(subtotal);
    if (isCollapsed) {
      toggleBtn.innerHTML = '<span class="cart-open">▸</span> <span class="cart-label">Carrinho</span>';
    } else {
      toggleBtn.innerHTML = '<span class="cart-open">▾</span> <span class="cart-label">Carrinho</span>';
    }
    toggleBtn.setAttribute('aria-expanded', (!isCollapsed).toString());
  }
  
  var meuSummary = document.getElementById('meu_cart_summary');
  if (meuSummary) {
    meuSummary.innerText = totalQty + (totalQty === 1 ? ' item — ' : ' itens — ') + formatarBRL(subtotal);
  }
  var floatCount = document.getElementById('floating-cart-count');
  if (floatCount) { floatCount.innerText = totalQty; }

  // atualizar o mini-resumo visível no painel (quando existe)
  var cartMini = findInPanelById('cart_mini');
  var panelRoot = getPanelRoot();
  if (cartMini && panelRoot) {
    var isCollapsed = panelRoot.classList && panelRoot.classList.contains('collapsed');
    if (isCollapsed) {
      // manter apenas a pílula com a quantidade quando estiver colapsado
      cartMini.innerHTML = '<div class="cart_mini_count"><span id="cart_mini_count">' + totalQty + '</span></div>';
    } else {
      // restaurar estrutura: número em destaque e texto abaixo quando expandido
      cartMini.innerHTML = '<div class="cart_mini_count"><span id="cart_mini_count">' + totalQty + '</span></div>' +
                           '<div class="cart_mini_label">itens · <span id="cart_mini_total">' + formatarBRL(subtotal) + '</span></div>';
    }
  }
}

function gerarMensagemNota() {
  var t = atualizarTotais();
  var texto = 'PEDIDO:\n\n';
  for (var i = 0; i < meuCarrinho.length; i++) {
    var it = meuCarrinho[i];
    texto += it.qtd + ' x ' + it.nome + ' — ' + formatarBRL(it.preco) + ' = ' + formatarBRL(it.preco * it.qtd) + '\n';
  }
  texto += '\n';
  texto += 'Subtotal: ' + formatarBRL(t.subtotal) + '\n';
  if (t.taxa > 0) texto += 'Taxa (maquininha): ' + formatarBRL(t.taxa) + '\n';
  texto += 'Total: ' + formatarBRL(t.total) + '\n';
  texto += 'Pagamento: ' + t.pagamento + '\n\n';
  texto += 'Obrigado!';
  return texto;
}

function abrirWhatsApp() { if (meuCarrinho.length === 0) return; salvarCarrinho(); var msg = gerarMensagemNota(); var url = 'https://wa.me/' + NUMERO_WHATSAPP + '?text=' + encodeURIComponent(msg); window.open(url, '_blank'); }

function enviarOuIrCarrinho() { var href = window.location.href || ''; if (href.indexOf('carrinho.html') !== -1) { abrirWhatsApp(); return; } salvarCarrinho(); window.location.href = 'carrinho.html'; }

function gerarRecomendacao() {
  var recEl = document.getElementById('recommendation');
  if (!recEl) return;
  var container = recEl.closest('.recommendation_column');
  if (container) container.classList.remove('is-empty');
  recEl.innerHTML = '';
  recEl.scrollLeft = 0;

  function mostrarMensagem(texto) {
    var msg = document.createElement('div');
    msg.className = 'empty_state secundario';
    msg.innerText = texto;
    recEl.appendChild(msg);
    if (container) container.classList.add('is-empty');
    updateRecommendationControls();
  }

  if (!meuCarrinho.length) {
    mostrarMensagem('Adicione itens para ver recomendações.');
    return;
  }

  var matchRegex = /hamburgue|hamburger|hambúrg|x[- ]?burg|cachorro|hot[- ]?dog|\bdog\b|\bfrango\b/i;
  var totalQty = 0;
  for (var i = 0; i < meuCarrinho.length; i++) {
    var nomeLower = (meuCarrinho[i].nome || '').toLowerCase();
    var descLower = (meuCarrinho[i].descricao || '').toLowerCase();
    if (matchRegex.test(nomeLower + ' ' + descLower)) {
      totalQty += meuCarrinho[i].qtd || 0;
    }
  }

  if (totalQty === 0) {
    mostrarMensagem('Recomendações disponíveis para lanches principais.');
    return;
  }

  var recs = [
    { nome: 'Coca-Cola 350ml', preco: 6.00, qtdSugestao: totalQty },
    { nome: 'Guaraná 350ml', preco: 4.00, qtdSugestao: totalQty }
  ];

  if (totalQty >= 5) {
    var bottles = Math.ceil(totalQty / 5);
    recs.push({ nome: 'Kuat 1.5l', preco: 4.50, qtdSugestao: bottles });
  }

  for (var r = 0; r < recs.length; r++) {
    var sug = recs[r];
    var card = document.createElement('article');
    card.className = 'rec_card';

    var title = document.createElement('div');
    title.className = 'rec_title';
    title.innerText = sug.nome;

    var meta = document.createElement('div');
    meta.className = 'rec_meta';
    meta.innerText = formatarBRL(sug.preco) + (sug.qtdSugestao > 1 ? ' · ' + sug.qtdSugestao + 'x' : '');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'add_btn';
    btn.innerText = 'Adicionar';
    btn.onclick = (function(n, p, q) { return function() { adicionarAoCarrinhoQtd(n, p, q); }; })(sug.nome, sug.preco, sug.qtdSugestao);

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(btn);

    recEl.appendChild(card);
  }

  updateRecommendationControls();
}

function scrollRecommendation(list, direction) {
  if (!list) return;
  var sampleCard = list.querySelector('.rec_card');
  var step = sampleCard ? sampleCard.getBoundingClientRect().width + 16 : 220;
  list.scrollBy({ left: step * direction, behavior: 'smooth' });
}

function setupRecommendationControls() {
  if (recommendationControlsReady) return;
  var container = document.querySelector('.recommendation_column');
  if (!container) return;
  var list = container.querySelector('#recommendation');
  var prev = container.querySelector('[data-carousel="prev"]');
  var next = container.querySelector('[data-carousel="next"]');
  if (!list || !prev || !next) return;
  recommendationControlsReady = true;
  prev.addEventListener('click', function () { scrollRecommendation(list, -1); });
  next.addEventListener('click', function () { scrollRecommendation(list, 1); });
  list.addEventListener('scroll', updateRecommendationControls);
  window.addEventListener('resize', updateRecommendationControls);
  updateRecommendationControls();
}

function updateRecommendationControls() {
  var container = document.querySelector('.recommendation_column');
  if (!container) return;
  var list = container.querySelector('#recommendation');
  var prev = container.querySelector('[data-carousel="prev"]');
  var next = container.querySelector('[data-carousel="next"]');
  if (!list || !prev || !next) return;
  var hasCards = !!list.querySelector('.rec_card');
  var maxScroll = Math.max(0, list.scrollWidth - list.clientWidth - 1);
  var atStart = list.scrollLeft <= 1;
  var atEnd = list.scrollLeft >= maxScroll;
  prev.disabled = atStart;
  next.disabled = atEnd;
  var hideArrows = !hasCards || maxScroll <= 2;
  prev.classList.toggle('is-hidden', hideArrows);
  next.classList.toggle('is-hidden', hideArrows);
  prev.setAttribute('aria-hidden', hideArrows ? 'true' : 'false');
  next.setAttribute('aria-hidden', hideArrows ? 'true' : 'false');
}

window.onload = function () {
  // Suporta diferentes estruturas de cardápio: .linha_item (página menu) e .cardapio_item (home)
  var lista = document.querySelectorAll('.linha_item, .cardapio_item');
  for (var i = 0; i < lista.length; i++) {
    var li = lista[i];
    var acoes = li.querySelector('.acoes_item');
    if (!acoes) continue;

    // Procurar nome em possíveis locais: .nome-item ou h3
    var nomeEl = li.querySelector('.nome_item') || li.querySelector('h3');
    // Procurar descrição em possíveis locais: .descricao_item ou .info_item .secundario ou .secundario
    var descEl = li.querySelector('.descricao_item') || li.querySelector('.info_item .secundario') || li.querySelector('.secundario');
    var precoEl = li.querySelector('.preco');
    var nome = nomeEl ? nomeEl.innerText.trim() : 'Item';
    var descricao = descEl ? descEl.innerText.trim() : '';
    var precoText = precoEl ? precoEl.innerText.trim() : 'R$ 0,00';
    var preco = parsePreco(precoText);
    var bot = document.createElement('button');
    bot.innerText = 'Adicionar';
    bot.onclick = (function(n, p, d) { return function() { adicionarAoCarrinho(n, p, d); }; })(nome, preco, descricao);
    bot.className = 'add_btn';
    acoes.appendChild(bot);
  }

  var radios = document.getElementsByName('payment');
  for (var r = 0; r < radios.length; r++) {
    radios[r].onchange = function() { atualizarTotais(); };
  }

  var btn = findInPanelById('whatsapp_btn'); if (btn) btn.onclick = enviarOuIrCarrinho;
  renderizarCarrinho();
  setupRecommendationControls();
  var panel = getPanelRoot();
  var toggle = panel ? panel.querySelector('.cart_toggle') : null; if (toggle) toggle.addEventListener('click', function (ev) { ev.preventDefault(); toggleCartPanel(); });
  ajustarAlturaCarrinho(); window.onresize = ajustarAlturaCarrinho;
};

carregarCarrinho();
