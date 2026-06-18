document.addEventListener('DOMContentLoaded', () => {
    // --- FUNÇÃO AUXILIAR PARA A LIXEIRA GERAL ---
    function adicionarALixeira(tipo, dado, origem) {
        const lixeira = JSON.parse(localStorage.getItem('casaTaperaLixeira')) || [];
        lixeira.unshift({
            id: `trash-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            tipo: tipo, // 'item' ou 'categoria'
            dado: dado, 
            origem: origem, 
            dataExclusao: new Date().toISOString()
        });
        localStorage.setItem('casaTaperaLixeira', JSON.stringify(lixeira));
    }

    // --- INICIALIZAÇÃO DE ABAS ---
    let abaAtiva = 'cardapio';
    const gridEdicao = document.querySelector('.grid-edicao-cardapio');

    // Injeta a navegação por abas dinamicamente
    const abasHTML = `
        <div class="container-abas">
            <button class="btn-aba active" data-aba="cardapio">Cardápio Geral</button>
            <button class="btn-aba" data-aba="montagem">Estação de Montagem</button>
        </div>
    `;
    gridEdicao.insertAdjacentHTML('beforebegin', abasHTML);

    function atualizarVisibilidadeAbas() {
        const categorias = document.querySelectorAll('.categoria-cardapio');
        const montagemKeywords = ['monte seu', 'montagem', 'ingredientes', 'adicionais'];

        categorias.forEach(cat => {
            const h3 = cat.querySelector('h3');
            if (!h3) return;
            const nome = h3.textContent.toLowerCase().trim();
            const ehMontagem = montagemKeywords.some(keyword => nome.includes(keyword));
            
            if (abaAtiva === 'montagem') {
                cat.style.display = ehMontagem ? 'block' : 'none';
            } else {
                cat.style.display = ehMontagem ? 'none' : 'block';
            }
        });
    }

    // --- FUNÇÃO PARA GERAR O HTML DE UM ITEM NO EDITOR ---
    function gerarItemEditorHTML(id, nome, preco, desativado = false) {
        return `
            <div class="item-editavel ${desativado ? 'item-desativado' : ''}" data-item-id="${id}" draggable="true">
                <span class="nome-item-editavel">${nome}</span>
                <div class="acoes-item">
                    <div class="container-preco">
                        <span class="prefixo-moeda">R$</span>
                        <input type="number" step="0.50" class="input-preco" value="${parseFloat(preco).toFixed(2)}" disabled>
                    </div>
                    <button class="btn-acao-item btn-editar-item" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-acao-item btn-salvar-item" title="Salvar"><i class="fas fa-save"></i></button>
                    <button class="btn-acao-item btn-ocultar-item" title="${desativado ? 'Mostrar' : 'Ocultar'} no cardápio">
                        <i class="fas ${desativado ? 'fa-eye-slash' : 'fa-eye'}"></i>
                    </button>
                    <button class="btn-acao-item btn-reordenar-item" title="Pressione e arraste para mudar o lugar"><i class="fas fa-grip-vertical"></i></button>
                    <button class="btn-acao-item btn-remover-item" title="Remover"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `;
    }

    // --- FUNÇÃO PARA RENDERIZAR O EDITOR COM DADOS SALVOS ---
    function renderizarEditorSalvo() {
        const cardapioSalvo = JSON.parse(localStorage.getItem('cardapioTaperaPrecos'));
        const ordemCategorias = JSON.parse(localStorage.getItem('cardapioTaperaOrdemCategorias'));

        // Se não há dados salvos, mantemos o HTML padrão que já veio no arquivo
        if (!cardapioSalvo || Object.keys(cardapioSalvo).length === 0) {
            document.querySelectorAll('.item-editavel').forEach(itemEl => itemEl.setAttribute('draggable', true));
            document.querySelectorAll('.categoria-cardapio').forEach(cat => cat.setAttribute('draggable', true));
            return;
        }

        const grid = document.querySelector('.grid-edicao-cardapio');
        grid.innerHTML = ''; // Limpa o grid estático

        // Agrupa itens por categoria
        const itensPorCategoria = {};
        Object.keys(cardapioSalvo).forEach(id => {
            const item = cardapioSalvo[id];
            const catNome = item.categoria.trim();
            if (!itensPorCategoria[catNome]) itensPorCategoria[catNome] = [];
            itensPorCategoria[catNome].push({ ...item, id });
        });

        // Segue a ordem salva e adiciona ao final categorias novas que não estão na lista de ordem
        let categoriasParaRenderizar = [...(ordemCategorias || [])];
        Object.keys(itensPorCategoria).forEach(cat => {
            if (!categoriasParaRenderizar.includes(cat)) {
                categoriasParaRenderizar.push(cat);
            }
        });

        categoriasParaRenderizar.forEach(nomeCat => {
            const itens = (itensPorCategoria[nomeCat.trim()] || []).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
            
            // Se a categoria está na lista de ordem mas não tem itens (pode acontecer), criamos o container vazio
            const itensHtml = itens.map(it => gerarItemEditorHTML(it.id, it.nome, it.preco, it.desativado)).join('');

            const categoriaHtml = `
                <div class="categoria-cardapio" draggable="true">
                    <div class="categoria-header">
                        <h3>${nomeCat}</h3>
                    </div>
                    ${itensHtml}
                </div>
            `;
            grid.insertAdjacentHTML('beforeend', categoriaHtml);
        });

        // Garante que todos os itens carregados sejam arrastáveis
        document.querySelectorAll('.item-editavel').forEach(itemEl => itemEl.setAttribute('draggable', true));
        atualizarVisibilidadeAbas();
    }

    // Inicializa o editor carregando os dados do LocalStorage
    renderizarEditorSalvo();

    // Ouvinte para a troca de abas
    document.querySelector('.container-abas').addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-aba');
        if (!btn) return;

        document.querySelectorAll('.btn-aba').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        abaAtiva = btn.dataset.aba;
        atualizarVisibilidadeAbas();
    });

    // --- LÓGICA DE ARRASTAR CATEGORIAS NO GRID ---
    let cardArrastado = null;
    let itemArrastado = null;

    // Torna as categorias iniciais arrastáveis
    document.querySelectorAll('.categoria-cardapio').forEach(cat => cat.setAttribute('draggable', true));

    gridEdicao.addEventListener('dragstart', (e) => {
        const target = e.target;

        // Se estivermos arrastando um item individual
        if (target.classList.contains('item-editavel')) {
            itemArrastado = target;
            target.classList.add('arrastando-item');
            e.dataTransfer.effectAllowed = 'move';
            return; // Sai para não ativar o drag da categoria pai
        }

        // Se estivermos arrastando uma categoria completa
        const card = target.closest('.categoria-cardapio');
        if (card && target.classList.contains('categoria-cardapio')) {
            cardArrastado = card;
            card.classList.add('arrastando');
            e.dataTransfer.effectAllowed = 'move';
        }
    });

    gridEdicao.addEventListener('dragend', (e) => {
        if (cardArrastado) cardArrastado.classList.remove('arrastando');
        if (itemArrastado) itemArrastado.classList.remove('arrastando-item');
        
        cardArrastado = null;
        itemArrastado = null;
    });

    gridEdicao.addEventListener('dragover', (e) => {
        e.preventDefault();

        if (itemArrastado) {
            const itemAlvo = e.target.closest('.item-editavel');
            const categoriaAlvo = e.target.closest('.categoria-cardapio');

            if (itemAlvo && itemAlvo !== itemArrastado) {
                const rect = itemAlvo.getBoundingClientRect();
                const proximo = (e.clientY - rect.top) > (rect.height / 2);
                itemAlvo.parentNode.insertBefore(itemArrastado, proximo ? itemAlvo.nextSibling : itemAlvo);
            } else if (categoriaAlvo && !categoriaAlvo.contains(itemArrastado)) {
                // Permite mover itens entre categorias diferentes
                categoriaAlvo.appendChild(itemArrastado);
            }
        } else if (cardArrastado) {
            const cardAlvo = e.target.closest('.categoria-cardapio');
            if (cardAlvo && cardAlvo !== cardArrastado) {
                const rect = cardAlvo.getBoundingClientRect();
                const proximo = (e.clientY - rect.top) > (rect.height / 2);
                gridEdicao.insertBefore(cardArrastado, proximo ? cardAlvo.nextSibling : cardAlvo);
            }
        }
    });

    // Função aprimorada para exportar o cardápio como PDF com layout de menu
    function exportarCardapioPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        // --- CONFIGURAÇÕES DO DOCUMENTO ---
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        const margin = 10;
        const lineHeight = 6;
        const colWidth = (pageWidth - margin * 4) / 3; // 3 colunas
        const col1_x = margin; 
        const col2_x = margin * 2 + colWidth;
        const col3_x = margin * 3 + colWidth * 2;
        const colPositions = [col1_x, col2_x, col3_x];
        let yPositions = [0, 0, 0]; // Posição Y para cada coluna
        let maxColumnHeight = 0; // Altura máxima alcançada entre as colunas

        // --- ESTRUTURA DO CARDÁPIO (como na index.html) ---
        const layoutColunas = { // Reorganizado para melhor distribuição
            'coluna1': {
                categorias: ['Hambúrgueres', 'Acompanhamentos', 'Pães e Cucas']
            },
            'coluna2': {
                categorias: ['Pastéis Salgados', 'Pastéis Doces']
            },
            'coluna3': {
                categorias: ['Sucos Naturais', 'Bebidas']
            }
        };

        // --- FUNÇÕES AUXILIARES ---
        const checkPageEnd = (neededHeight) => {
            // Função desativada para forçar tudo em uma página.
            // Se o conteúdo for muito grande, ele será cortado.
        };

        const addHeaderAndFooter = () => {
            // Define a cor de preenchimento para preto e desenha o fundo
            doc.setFillColor(26, 26, 26); // Cor --color-dark-gray (1a1a1a)
            doc.rect(0, 0, pageWidth, pageHeight, 'F'); // 'F' para preencher
            // Adiciona rodapé
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Cardápio sujeito a alterações. Consulte disponibilidade.', pageWidth / 2, pageHeight - 7, { align: 'center' });
        };

        // --- INÍCIO DA GERAÇÃO DO PDF ---
        addHeaderAndFooter();
        yPositions = [15, 15, 15]; // Posição Y inicial (subiu)
        maxColumnHeight = 15;

        // Mapeia todas as categorias e seus itens da página de edição
        const todasCategorias = {};
        document.querySelectorAll('.categoria-cardapio').forEach(catDiv => {
            const nomeCat = catDiv.querySelector('h3').textContent;
            const itens = [];
            catDiv.querySelectorAll('.item-editavel').forEach(itemDiv => {
                if (itemDiv.classList.contains('item-desativado')) return; // Pula itens ocultos no PDF
                itens.push({
                    nome: itemDiv.querySelector('.nome-item-editavel').textContent,
                    preco: parseFloat(itemDiv.querySelector('.input-preco').value).toFixed(2)
                });
            });
            todasCategorias[nomeCat] = itens;
        });

        // Desenha as 3 colunas
        Object.values(layoutColunas).forEach((colunaLayout, index) => {
            const x = colPositions[index];
            let y = yPositions[index];

            colunaLayout.categorias.forEach(nomeCategoria => {
                const itensDaCategoria = todasCategorias[nomeCategoria];
                if (!itensDaCategoria || itensDaCategoria.length === 0) return;

                // Desenha o título da categoria
                checkPageEnd(20); // Espaço para o título
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(13); // Fonte reduzida
                doc.setTextColor('#f06400'); // Laranja
                doc.text(nomeCategoria.toUpperCase(), x, y);
                y += lineHeight * 1.5; // Espaçamento reduzido

                // Desenha os itens
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9); // Fonte reduzida
                doc.setTextColor('#cecaca'); // Branco

                itensDaCategoria.forEach(item => {
                    checkPageEnd(lineHeight * 1.5); // Espaço para o item

                    const nomeItem = item.nome;
                    const precoItem = `R$ ${item.preco.replace('.', ',')}`; // Corrigido para usar o preço formatado
                    const nomeWidth = doc.getStringUnitWidth(nomeItem) * doc.getFontSize() / doc.internal.scaleFactor;
                    const precoWidth = doc.getStringUnitWidth(precoItem) * doc.getFontSize() / doc.internal.scaleFactor;
                    const espacoDisponivel = colWidth - nomeWidth - precoWidth - 2; // -2 para margem
                    const pontos = '.'.repeat(Math.max(2, Math.floor(espacoDisponivel / 1.2)));

                    doc.text(nomeItem, x, y);
                    doc.text(pontos, x + nomeWidth + 1, y, { charSpace: 0.5 });

                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor('#ffc600'); // Amarelo
                    doc.text(precoItem, x + colWidth, y, { align: 'right' });

                    // Reseta a fonte
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor('#cecaca');
                    y += lineHeight * 1.1; // Espaçamento reduzido
                });
                y += lineHeight; // Espaço extra entre categorias reduzido
            });
            // Atualiza a altura máxima geral
            if (y > maxColumnHeight) maxColumnHeight = y;
        });

        // --- SEÇÃO MONTE SEU LANCHE (NA MESMA PÁGINA) ---
        let yLanche = maxColumnHeight + 2; // Continua de onde o cardápio parou (espaçamento reduzido)
        checkPageEnd(50); // Verifica se há espaço para a seção

        // Título da Seção
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16); // Fonte reduzida
        doc.setTextColor('#f06400');
        doc.text('MONTE SEU LANCHE', pageWidth / 2, yLanche, { align: 'center' });
        yLanche += 15;

        // Layout de 2 colunas para Hambúrguer e Pastel
        const colLancheWidth = (pageWidth - margin * 3) / 2;
        const colLanche1_x = margin;
        const colLanche2_x = margin * 2 + colLancheWidth;

        // Função para desenhar uma seção de montagem
        function desenharSecaoMontagem(x, y, titulo, descricao, nomeCategoria) {
            checkPageEnd(20); // Espaço para título e descrição
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12); // Fonte reduzida
            doc.setTextColor('#ffc600'); // Amarelo
            doc.text(titulo, x + colLancheWidth / 2, y, { align: 'center' });
            y += 5; // Espaçamento reduzido

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5); // Fonte reduzida
            doc.setTextColor('#cecaca');
            doc.text(descricao, x + colLancheWidth / 2, y, { align: 'center', maxWidth: colLancheWidth });
            y += 8; // Espaçamento reduzido

            const itensDaCategoria = todasCategorias[nomeCategoria] || [];
            itensDaCategoria.forEach(item => {
                const isBase = item.nome.toLowerCase().includes('base');
                const corPreco = isBase ? '#cecaca' : '#ffc600'; // Branco para bases, amarelo para extras

                checkPageEnd(lineHeight); // Espaço para cada item
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8); // Fonte reduzida
                doc.setTextColor(corPreco); // Define a cor do nome do item
                doc.text(item.nome, x, y, { maxWidth: colLancheWidth - 20 });

                doc.setFont('helvetica', 'bold');
                doc.setTextColor(corPreco); // Usa a mesma cor para o preço
                doc.text(`R$ ${item.preco.replace('.', ',')}`, x + colLancheWidth - 2, y, { align: 'right' });
                y += lineHeight * 0.8; // Espaçamento entre itens reduzido
            });
            return y;
        }

        // Desenha a coluna do Hambúrguer
        const descHamburguer = "A base inclui pão, bife e queijo. Adicione ingredientes para personalizar.";
        desenharSecaoMontagem(colLanche1_x, yLanche, 'MONTE SEU HAMBÚRGUER', descHamburguer, 'Monte seu Hambúrguer');

        // Desenha a coluna do Pastel
        const descPastel = "Escolha uma base e turbine seu pastel com os ingredientes que você mais gosta.";
        desenharSecaoMontagem(colLanche2_x, yLanche, 'MONTE SEU PASTEL', descPastel, 'Monte seu Pastel');

        doc.save('cardapio-casa-tapera.pdf');
    }

    const containerGerenciamento = document.querySelector('.container-gerenciamento');

    containerGerenciamento.addEventListener('click', (e) => {
        const btnEditar = e.target.closest('.btn-editar-item');
        const btnSalvar = e.target.closest('.btn-salvar-item');
        const btnRemover = e.target.closest('.btn-remover-item');
        const btnOcultar = e.target.closest('.btn-ocultar-item');

        if (btnEditar) {
            const itemContainer = btnEditar.closest('.item-editavel');
            const inputPreco = itemContainer.querySelector('.input-preco');
            
            inputPreco.disabled = false;
            inputPreco.focus();

            btnEditar.style.display = 'none';
            itemContainer.querySelector('.btn-salvar-item').style.display = 'inline-block';
        }

        if (btnSalvar) {
            const itemContainer = btnSalvar.closest('.item-editavel');
            const inputPreco = itemContainer.querySelector('.input-preco');
            inputPreco.value = parseFloat(inputPreco.value).toFixed(2);
            inputPreco.disabled = true;
            btnSalvar.style.display = 'none';
            itemContainer.querySelector('.btn-editar-item').style.display = 'inline-block';
        }

        if (btnRemover) {
            const itemContainer = btnRemover.closest('.item-editavel');
            const nomeItem = itemContainer.querySelector('.nome-item-editavel').textContent;
            const idItem = itemContainer.dataset.itemId;
            const precoItem = itemContainer.querySelector('.input-preco').value;
            const categoriaNome = itemContainer.closest('.categoria-cardapio').querySelector('h3').textContent.trim();

            const cardapioSalvo = JSON.parse(localStorage.getItem('cardapioTaperaPrecos')) || {};
            const itemOriginal = cardapioSalvo[idItem];

            if (confirm(`Tem certeza que deseja remover o item "${nomeItem}"?`)) {
                // Envia para a lixeira antes de remover do DOM
                adicionarALixeira('item', { id: idItem, nome: nomeItem, preco: precoItem, categoria: categoriaNome, ordem: itemOriginal ? itemOriginal.ordem : 999 }, 'Personalizar Cardápio');
                
                itemContainer.remove();
                alert(`Item "${nomeItem}" movido para a Lixeira. Clique em "Salvar e Atualizar" para persistir.`);
            }
        }

        if (btnOcultar) {
            const itemContainer = btnOcultar.closest('.item-editavel');
            itemContainer.classList.toggle('item-desativado');
            const icone = btnOcultar.querySelector('i');
            if (itemContainer.classList.contains('item-desativado')) {
                icone.classList.replace('fa-eye', 'fa-eye-slash');
                btnOcultar.title = "Mostrar no cardápio";
            } else {
                icone.classList.replace('fa-eye-slash', 'fa-eye');
                btnOcultar.title = "Ocultar no cardápio";
            }
        }
    });

    // Lógica para o botão principal de atualização
    document.getElementById('btn-atualizar-index').addEventListener('click', () => {
        const btnAtualizar = document.getElementById('btn-atualizar-index');
        const icone = btnAtualizar.querySelector('i');

        // Adiciona a animação e desabilita o botão
        icone.classList.add('girando');
        btnAtualizar.disabled = true;

        // A lógica de salvar continua a mesma
        setTimeout(() => {
            const cardapioSalvo = JSON.parse(localStorage.getItem('cardapioTaperaPrecos')) || {};
            const cardapioAtualizado = {};
            let ordemGlobal = 0;

            // Percorre cada categoria e seus itens mantendo a ordem
            document.querySelectorAll('.categoria-cardapio').forEach((categDiv, catIndex) => {
                const h3 = categDiv.querySelector('h3');
                if (!h3) return;
                
                categDiv.querySelectorAll('.item-editavel').forEach((item, itemIndex) => {
                    const id = item.dataset.itemId;
                    const nome = item.querySelector('.nome-item-editavel').textContent;
                    const preco = item.querySelector('.input-preco').value;
                    const categoria = h3.textContent.trim();

                    cardapioAtualizado[id] = { 
                        nome: nome, 
                        preco: parseFloat(preco), 
                        categoria: categoria,
                        desativado: item.classList.contains('item-desativado'), // Salva se está oculto
                        ordem: ordemGlobal++ // Mantém a ordem de exibição
                    };
                });
            });

            localStorage.setItem('cardapioTaperaPrecos', JSON.stringify(cardapioAtualizado));

            // Salva a ordem das categorias baseada na disposição atual do Grid (Source of Truth)
            const ordemCategorias = Array.from(document.querySelectorAll('.categoria-cardapio h3'))
                                         .map(h3 => h3.textContent.trim());
            localStorage.setItem('cardapioTaperaOrdemCategorias', JSON.stringify(ordemCategorias));

            // Dispara um evento customizado para notificar outras abas
            window.dispatchEvent(new CustomEvent('cardapioAtualizado', { 
                detail: {
                    cardapio: cardapioAtualizado,
                    timestamp: Date.now()
                } 
            }));

            alert('Cardápio principal atualizado com sucesso!');

            // Remove a animação e reabilita o botão
            icone.classList.remove('girando');
            btnAtualizar.disabled = false;
        }, 1000); // Atraso de 1 segundo para simular o processamento
    });

    // --- LÓGICA DO MODAL PARA ADICIONAR ITEM ---
    const modal = document.getElementById('modal-add-item');
    const btnAbrirModal = document.getElementById('btn-add-novo-item');
    const btnFecharModal = modal.querySelector('.btn-fechar-modal');
    const form = document.getElementById('form-novo-item');
    const selectCategoriaNovoItem = document.getElementById('novo-item-categoria');

    function popularSelectCategorias() {
        if (!selectCategoriaNovoItem) return;
        selectCategoriaNovoItem.innerHTML = '<option value="" disabled selected>Selecione uma categoria</option>';
        document.querySelectorAll('.categoria-cardapio h3').forEach(h3 => {
            const option = document.createElement('option');
            option.value = h3.textContent;
            option.textContent = h3.textContent;
            selectCategoriaNovoItem.appendChild(option);
        });
    }

    btnAbrirModal.addEventListener('click', () => {
        popularSelectCategorias();
        modal.classList.add('visivel');
    });
    btnFecharModal.addEventListener('click', () => modal.classList.remove('visivel'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('visivel');
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('novo-item-nome').value;
        const preco = document.getElementById('novo-item-preco').value;
        const categoriaNome = selectCategoriaNovoItem.value;

        // Cria um ID único para o novo item
        const novoId = `novo-${nome.toLowerCase().replace(/\s+/g, '-')}`;

        // Usa a função centralizada para gerar o HTML
        const novoItemHtml = gerarItemEditorHTML(novoId, nome, preco);

        // Procura se a categoria já existe
        let categoriaDiv = Array.from(document.querySelectorAll('.categoria-cardapio h3')).find(h3 => h3.textContent === categoriaNome)?.closest('.categoria-cardapio');

        if (categoriaDiv) {
            // Adiciona o item à categoria existente
            categoriaDiv.insertAdjacentHTML('beforeend', novoItemHtml);
        } else {
            // Cria uma nova categoria
            const novaCategoriaHtml = `
                <div class="categoria-cardapio" draggable="true">
                    <div class="categoria-header">
                        <h3>${categoriaNome}</h3>
                    </div>
                    ${novoItemHtml}
                </div>
            `;
            document.querySelector('.grid-edicao-cardapio').insertAdjacentHTML('beforeend', novaCategoriaHtml);
        }

        alert(`Item "${nome}" adicionado com sucesso!`);
        form.reset();
        modal.classList.remove('visivel');
    });

    // --- LÓGICA PARA CRIAR NOVA CATEGORIA ---
    const modalGerenciarCategorias = document.getElementById('modal-gerenciar-categorias');
    const btnAbrirModalCategorias = document.getElementById('btn-gerenciar-categorias');
    const btnFecharModalCategorias = modalGerenciarCategorias.querySelector('.btn-fechar-modal');
    const listaCategoriasGerenciar = document.getElementById('lista-categorias-gerenciar');
    const btnCriarCategoria = document.getElementById('btn-criar-categoria');
    const inputNovaCategoria = document.getElementById('input-nova-categoria');

    function popularModalCategorias() {
        listaCategoriasGerenciar.innerHTML = '';
        document.querySelectorAll('.categoria-cardapio').forEach(catDiv => {
            const h3 = catDiv.querySelector('h3');
            if (!h3) return;
            const nome = h3.textContent;
            const li = document.createElement('li');
            li.classList.add('item-categoria-reordenavel');
            li.draggable = true;
            li.dataset.nome = nome;
            li.innerHTML = `
                <div class="nome-categoria-display">
                    <span>${nome}</span>
                    <input type="text" class="input-editar-categoria" value="${nome}" style="display:none;">
                </div>
                <div class="acoes-categoria-modal">
                    <button class="btn-acao-item btn-editar-categoria-modal" title="Editar Nome"><i class="fas fa-edit"></i></button>
                    <button class="btn-acao-item btn-salvar-categoria-modal" title="Salvar Nome" style="display:none;"><i class="fas fa-save"></i></button>
                    <i class="fas fa-grip-vertical btn-reordenar-item" title="Pressione e arraste para reordenar"></i>
                    <button class="btn-remover-categoria-modal" title="Remover Categoria"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            listaCategoriasGerenciar.appendChild(li);
        });
    }

    btnAbrirModalCategorias.addEventListener('click', () => {
        popularModalCategorias();
        modalGerenciarCategorias.classList.add('visivel');
    });

    btnFecharModalCategorias.addEventListener('click', () => modalGerenciarCategorias.classList.remove('visivel'));
    modalGerenciarCategorias.addEventListener('click', (e) => {
        if (e.target === modalGerenciarCategorias) modalGerenciarCategorias.classList.remove('visivel');
    });

    // Lógica de Drag and Drop para Categorias no Modal
    let categoriaArrastada = null;

    listaCategoriasGerenciar.addEventListener('dragstart', (e) => {
        const li = e.target.closest('.item-categoria-reordenavel');
        if (li) {
            categoriaArrastada = li;
            li.classList.add('arrastando');
            e.dataTransfer.effectAllowed = 'move';
        }
    });

    // Função para reordenar o grid principal da página de edição baseado na ordem do modal
    function reordenarGridPersonalizar() {
        const grid = document.querySelector('.grid-edicao-cardapio');
        const itensModal = Array.from(document.querySelectorAll('#lista-categorias-gerenciar .item-categoria-reordenavel'));
        
        itensModal.forEach(li => {
            const nome = li.dataset.nome;
            const categoriaCard = Array.from(document.querySelectorAll('.categoria-cardapio h3'))
                                        .find(h3 => h3.textContent.trim() === nome)?.closest('.categoria-cardapio');
            if (categoriaCard) {
                grid.appendChild(categoriaCard); // O appendChild move o elemento existente para o final do grid
            }
        });
    }

    listaCategoriasGerenciar.addEventListener('dragend', (e) => {
        if (categoriaArrastada) {
            categoriaArrastada.classList.remove('arrastando');
            categoriaArrastada = null;
            reordenarGridPersonalizar(); // Atualiza o grid no fundo imediatamente
        }
    });

    listaCategoriasGerenciar.addEventListener('dragover', (e) => {
        e.preventDefault();
        const liAlvo = e.target.closest('.item-categoria-reordenavel');
        if (liAlvo && liAlvo !== categoriaArrastada) {
            const rect = liAlvo.getBoundingClientRect();
            const meio = rect.top + rect.height / 2;
            if (e.clientY > meio) {
                liAlvo.after(categoriaArrastada);
            } else {
                liAlvo.before(categoriaArrastada);
            }
        }
    });

    btnCriarCategoria.addEventListener('click', () => {
        const nomeNovaCategoria = inputNovaCategoria.value.trim();
        if (nomeNovaCategoria) {
            const novaCategoriaHtml = `
                <div class="categoria-cardapio" draggable="true">
                    <div class="categoria-header">
                        <h3>${nomeNovaCategoria}</h3>
                    </div>
                    <!-- Itens podem ser adicionados aqui posteriormente -->
                </div>
            `;
            document.querySelector('.grid-edicao-cardapio').insertAdjacentHTML('beforeend', novaCategoriaHtml);
            alert(`Categoria "${nomeNovaCategoria}" criada com sucesso!`);
            inputNovaCategoria.value = '';
            popularModalCategorias(); // Atualiza a lista no modal
        }
    });

    listaCategoriasGerenciar.addEventListener('click', (e) => {
        const li = e.target.closest('li.item-categoria-reordenavel');
        if (!li) return;

        if (e.target.closest('.btn-editar-categoria-modal')) {
            const spanDisplay = li.querySelector('.nome-categoria-display span');
            const inputEdit = li.querySelector('.nome-categoria-display input');
            const btnEdit = li.querySelector('.btn-editar-categoria-modal');
            const btnSave = li.querySelector('.btn-salvar-categoria-modal');

            spanDisplay.style.display = 'none';
            inputEdit.style.display = 'inline-block';
            inputEdit.focus();
            btnEdit.style.display = 'none';
            btnSave.style.display = 'inline-block';
        }

        if (e.target.closest('.btn-salvar-categoria-modal')) {
            const spanDisplay = li.querySelector('.nome-categoria-display span');
            const inputEdit = li.querySelector('.nome-categoria-display input');
            const btnEdit = li.querySelector('.btn-editar-categoria-modal');
            const btnSave = li.querySelector('.btn-salvar-categoria-modal');

            const oldName = li.dataset.nome;
            const newName = inputEdit.value.trim();

            if (newName && newName !== oldName) {
                spanDisplay.textContent = newName;
                li.dataset.nome = newName;
                const categoriaCardH3 = Array.from(document.querySelectorAll('.categoria-cardapio h3')).find(h3 => h3.textContent.trim() === oldName);
                if (categoriaCardH3) categoriaCardH3.textContent = newName;
                alert(`Categoria "${oldName}" renomeada para "${newName}". Clique em "Salvar e Atualizar" para aplicar a mudança no cardápio principal.`);
            } else if (!newName) { alert('O nome da categoria não pode ser vazio.'); inputEdit.value = oldName; }
            spanDisplay.style.display = 'inline-block'; inputEdit.style.display = 'none'; btnEdit.style.display = 'inline-block'; btnSave.style.display = 'none';
        }

        // Lógica de remoção existente
        if (e.target.closest('.btn-remover-categoria-modal')) {
            const nomeCategoria = li.querySelector('.nome-categoria-display span').textContent; // Pega o nome do span
            const grid = document.querySelector('.grid-edicao-cardapio');
            const indexOriginal = Array.from(grid.querySelectorAll('.categoria-cardapio'))
                                       .findIndex(c => c.querySelector('h3').textContent.trim() === nomeCategoria);

            if (confirm(`Tem certeza que deseja remover a categoria "${nomeCategoria}"? Todos os seus itens serão movidos para a lixeira.`)) {
                const categoriaCard = Array.from(document.querySelectorAll('.categoria-cardapio h3')).find(h3 => h3.textContent === nomeCategoria)?.closest('.categoria-cardapio');
                
                if (categoriaCard) {
                    // Coleta dados dos itens da categoria para a lixeira
                    const itens = [];
                    categoriaCard.querySelectorAll('.item-editavel').forEach(itemEl => {
                        itens.push({
                            id: itemEl.dataset.itemId,
                            nome: itemEl.querySelector('.nome-item-editavel').textContent,
                            preco: itemEl.querySelector('.input-preco').value
                        });
                    });

                    adicionarALixeira('categoria', { nome: nomeCategoria, itens: itens, secao: categoriaCard.dataset.secao, originalIndex: indexOriginal }, 'Personalizar Cardápio');
                    categoriaCard.remove();
                }
                li.remove();
                alert(`Categoria "${nomeCategoria}" movida para a Lixeira.`);
            }
        }
    });

    // Adiciona o evento de clique ao novo botão de exportar PDF
    const btnExportarPDFTopo = document.getElementById('btn-exportar-pdf-topo');
    if (btnExportarPDFTopo) btnExportarPDFTopo.addEventListener('click', exportarCardapioPDF);


});