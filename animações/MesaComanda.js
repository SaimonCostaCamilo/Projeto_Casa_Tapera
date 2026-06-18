document.addEventListener('DOMContentLoaded', () => {
    const gridMesasContainer = document.querySelector('.grid-mesas-container');
    const painelGridMesas = document.getElementById('painel-grid-mesas');
    const painelDetalhes = document.getElementById('painel-detalhes-comanda');
    const modalAddItem = document.getElementById('modal-add-item');
    let mesaAtivaId = null; // Guarda o ID da mesa selecionada
    const modalPagamento = document.getElementById('modal-pagamento');
    const modalEditarMesa = document.getElementById('modal-editar-mesa');
    
    // --- FUNÇÃO AUXILIAR PARA A LIXEIRA GERAL ---
    function adicionarALixeira(tipo, dado, origem) {
        const lixeira = JSON.parse(localStorage.getItem('casaTaperaLixeira')) || [];
        lixeira.unshift({
            id: `trash-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            tipo: tipo, 
            dado: dado, 
            origem: origem, 
            dataExclusao: new Date().toISOString()
        });
        localStorage.setItem('casaTaperaLixeira', JSON.stringify(lixeira));
    }

    // Elementos do Modal de Gerenciamento
    const modalGerenciarMesas = document.getElementById('modal-gerenciar-mesas');
    const btnAbrirGerenciar = document.getElementById('btn-abrir-gerenciar-mesas');
    const btnCriarMesa = document.getElementById('btn-criar-mesa');
    const btnExcluirMesa = document.getElementById('btn-excluir-mesa');
    const selectExcluirMesa = document.getElementById('select-excluir-mesa');
    
    // --- CRIAÇÃO DO BOTÃO E MODAL DE QR CODES ---
    let btnAbrirGerenciarQr;
    if (btnAbrirGerenciar) {
        // Cria um container para os botões do topo para garantir que fiquem lado a lado
        const containerBotoesTopo = document.createElement('div');
        containerBotoesTopo.className = 'container-acoes-topo';

        // Insere o novo container antes do botão de gerenciar e move o botão para dentro dele
        btnAbrirGerenciar.parentElement.insertBefore(containerBotoesTopo, btnAbrirGerenciar);
        containerBotoesTopo.appendChild(btnAbrirGerenciar);

        // Adiciona classes e conteúdo ao botão original
        btnAbrirGerenciar.classList.add('btn-acao-topo');
        btnAbrirGerenciar.innerHTML = `<i class="fas fa-cog"></i> Gerenciar Mesas`;

        // Adiciona o novo botão de QR Code ao lado, dentro do mesmo container
        containerBotoesTopo.insertAdjacentHTML('beforeend', `
            <button id="btn-abrir-gerenciar-qr" class="btn-acao-topo">
                <i class="fas fa-qrcode"></i> Gerenciar QR Codes
            </button>
        `);
        btnAbrirGerenciarQr = document.getElementById('btn-abrir-gerenciar-qr');
    }

    const modalGerenciarQr = document.createElement('div');
    modalGerenciarQr.id = 'modal-gerenciar-qr';
    modalGerenciarQr.className = 'modal-overlay';
    modalGerenciarQr.innerHTML = `
        <div class="modal-container">
            <button class="btn-fechar-modal" title="Fechar">&times;</button>
            <h3><i class="fas fa-qrcode"></i> Gerenciador de QR Codes</h3>
            <p style="font-size: 0.9em; color: #aaa; margin-top: 15px; margin-bottom: 15px; text-align: center;">Selecione uma mesa para visualizar e baixar o QR Code.</p>
            <div class="qr-code-manager-body">
                <div class="qr-code-list-container">
                    <ul id="lista-mesas-qr"></ul>
                </div>
                <div id="qr-code-preview-container" class="qr-code-preview-container">
                    <div class="qr-placeholder">
                        <i class="fas fa-qrcode" style="font-size: 4em; color: #444; margin-bottom: 15px;"></i>
                        <p>Selecione uma mesa ao lado.</p>
                    </div>
                    <div id="qr-code-canvas-wrapper" style="display: none;"></div>
                    <button id="btn-download-qr-visualizado" class="btn-download-qr" style="display: none;"><i class="fas fa-download"></i> Baixar QR Code</button>
                </div>
            </div>
            <div id="qrcode-temp" style="display: none;"></div>
        </div>
    `;
    document.body.appendChild(modalGerenciarQr);

    function renderizarListaQrCodes() {
        const lista = document.getElementById('lista-mesas-qr');
        if (!lista) return;
        lista.innerHTML = '';
        const idsOrdenados = Object.keys(dadosMesas).map(Number).sort((a, b) => a - b);
        idsOrdenados.forEach(id => {
            const li = document.createElement('li');
            li.className = 'item-mesa-qr';
            li.dataset.id = id;
            li.innerHTML = `
                <i class="fas fa-chair"></i>
                <span>Mesa ${id.toString().padStart(2, '0')}</span>
                <i class="fas fa-chevron-right"></i>
            `;
            lista.appendChild(li);
        });
    }

    function visualizarQrCode(mesaId) {
        const lista = document.getElementById('lista-mesas-qr');
        const itemAtivoAnterior = lista.querySelector('.item-mesa-qr.active');
        if (itemAtivoAnterior) itemAtivoAnterior.classList.remove('active');
        const itemNovo = lista.querySelector(`.item-mesa-qr[data-id="${mesaId}"]`);
        if (itemNovo) itemNovo.classList.add('active');

        const previewContainer = document.getElementById('qr-code-preview-container');
        const placeholder = previewContainer.querySelector('.qr-placeholder');
        const canvasWrapper = document.getElementById('qr-code-canvas-wrapper');
        const btnDownload = document.getElementById('btn-download-qr-visualizado');

        placeholder.style.display = 'none';
        canvasWrapper.innerHTML = '';
        canvasWrapper.style.display = 'block';
        btnDownload.style.display = 'inline-flex';

        const url = new URL('index.html', window.location.href);
        url.searchParams.set('mesa', mesaId);
        const urlString = url.toString();

        new QRCode(canvasWrapper, { text: urlString, width: 200, height: 200, colorDark: "#000000", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.H });
        btnDownload.dataset.id = mesaId;
    }

    function resetarVisualizadorQr() {
        const previewContainer = document.getElementById('qr-code-preview-container');
        if (!previewContainer) return;
        previewContainer.querySelector('.qr-placeholder').style.display = 'block';
        document.getElementById('qr-code-canvas-wrapper').style.display = 'none';
        document.getElementById('btn-download-qr-visualizado').style.display = 'none';
        const itemAtivo = document.querySelector('#lista-mesas-qr .item-mesa-qr.active');
        if (itemAtivo) itemAtivo.classList.remove('active');
    }

    const STORAGE_KEY_MESAS = 'casaTaperaMesasData';
    let dadosMesas = JSON.parse(localStorage.getItem(STORAGE_KEY_MESAS));

    // Se não houver dados salvos, inicializa com o padrão
    if (!dadosMesas) {
        dadosMesas = {};
        // Inicializa 10 mesas com estrutura padrão
        for (let i = 1; i <= 10; i++) {
            dadosMesas[i] = { status: 'livre', itens: [], total: 0 };
        }
        // Exemplos de mesas ocupadas (opcional)
        dadosMesas[2] = { status: 'ocupada', itens: [{ nome: 'Hambúrguer de Carne', qtd: 2, preco: 40.00 }, { nome: 'Batata M', qtd: 1, preco: 10.00 }], total: 50.00 };
        dadosMesas[3] = { status: 'reservada', nomeReserva: 'Aniversário Julia', itens: [{ nome: 'Pastel de Carne', qtd: 3, preco: 36.00 }], total: 36.00 };
        dadosMesas[6] = { status: 'ocupada', itens: [{ nome: 'Suco de Laranja', qtd: 4, preco: 24.00 }], total: 24.00 };
        dadosMesas[10] = { status: 'reservada', nomeReserva: 'Família Souza', itens: [{ nome: 'Hambúrguer de Frango', qtd: 1, preco: 22.00 }], total: 22.00 };
        
        localStorage.setItem(STORAGE_KEY_MESAS, JSON.stringify(dadosMesas));
    } else {
        // Verificação de integridade e remoção de mesas extras
        let precisaSalvar = false;

        // Garante que as 10 mesas restantes estejam com dados corretos
        for (let i = 1; i <= 10; i++) {
            const mesa = dadosMesas[i];
            // Se a mesa não existe, ou tem status inválido, ou itens não é array -> Reseta para estrutura padrão
            if (!mesa || !mesa.status || !['livre', 'ocupada', 'reservada'].includes(mesa.status) || !Array.isArray(mesa.itens)) {
                dadosMesas[i] = { status: 'livre', itens: [], total: 0 };
                precisaSalvar = true;
            } else {
                // Se existe, garante que total é número
                if (typeof mesa.total !== 'number') { mesa.total = 0; precisaSalvar = true; }
            }
        }

        if (precisaSalvar) {
            localStorage.setItem(STORAGE_KEY_MESAS, JSON.stringify(dadosMesas));
        }
    }

    // Dados de exemplo do cardápio (pode vir de um backend no futuro)
    const cardapioData = { // Cardápio completo adicionado
        "Hambúrgueres": [
            { nome: "Hambúrguer de Carne", preco: 20.00 },
            { nome: "Hambúrguer de Frango", preco: 22.00 },
            { nome: "Hambúrguer de Bacon", preco: 25.00 },
            { nome: "Hambúrguer Vegano", preco: 25.00 },
        ],
        "Pastéis Salgados": [
            { nome: "Pastel de Carne", preco: 12.00 },
            { nome: "Frango c/ Catupiry", preco: 12.00 },
            { nome: "Calabresa", preco: 12.00 },
            { nome: "Queijo c/ Orégano", preco: 12.00 },
            { nome: "Queijo", preco: 12.00 },
        ],
        "Pastéis Doces": [
            { nome: "Chocolate ao Leite", preco: 15.00 },
            { nome: "Romeu e Julieta", preco: 14.00 },
            { nome: "Creme Ninho", preco: 15.00 },
            { nome: "Stikadinho", preco: 17.00 },
            { nome: "Ouro Branco", preco: 15.00 },
            { nome: "Oreo", preco: 15.00 },
            { nome: "Kit-Kat", preco: 17.00 },
            { nome: "Sonho de Valsa", preco: 15.00 },
        ],
        "Acompanhamentos": [
            { nome: "Batata P", preco: 8.00 },
            { nome: "Batata M", preco: 10.00 },
            { nome: "Batata G", preco: 15.00 },
        ],
        "Pães e Cucas": [
            { nome: "Pão Artesanal 500g", preco: 20.00 },
            { nome: "Cuca de Goiabada 500g", preco: 15.00 },
            { nome: "Cuca de Doce de Leite 500g", preco: 17.00 },
        ],
        "Sucos Naturais": [
            { nome: "Suco de Laranja", preco: 6.00 },
            { nome: "Suco de Limão", preco: 6.00 },
            { nome: "Suco de Manga", preco: 8.00 },
            { nome: "Suco de Maracujá", preco: 8.00 },
            { nome: "Suco de Abacaxi", preco: 8.00 },
        ],
        "Bebidas": [
            { nome: "Coca-Cola Lata 350ml", preco: 7.00 },
            { nome: "Refrigerantes Lata 350ml", preco: 6.00 },
            { nome: "Água c/ Gás", preco: 3.50 },
            { nome: "Água s/ Gás", preco: 3.00 },
            { nome: "Suco de Laranja", preco: 6.00 },
        ]
    };

    function salvarDadosMesas() {
        localStorage.setItem(STORAGE_KEY_MESAS, JSON.stringify(dadosMesas));
    }

    function renderizarMesas() {
        gridMesasContainer.innerHTML = ''; // Limpa o container principal

        // Cria as duas colunas
        const coluna1 = document.createElement('div');
        coluna1.className = 'coluna-mesas';
        const coluna2 = document.createElement('div');
        coluna2.className = 'coluna-mesas';

        // Ordena as chaves para garantir a ordem numérica
        const idsOrdenados = Object.keys(dadosMesas).map(Number).sort((a, b) => a - b);

        idsOrdenados.forEach((idMesa, index) => {
            const mesa = dadosMesas[idMesa];
            if (!mesa) return; // Proteção contra dados inválidos

            const divMesa = document.createElement('div');
            divMesa.className = `mesa status-${mesa.status || 'livre'}`; // Fallback para status
            divMesa.dataset.mesa = idMesa;
            let nomeReservaHtml = '';
            if (mesa.status === 'reservada' && mesa.nomeReserva) {
                nomeReservaHtml = `<small class="nome-reserva">${mesa.nomeReserva}</small>`;
            }
            divMesa.innerHTML = `<i class="fas fa-chair"></i><span>Mesa ${idMesa.toString().padStart(2, '0')}</span>${nomeReservaHtml}`;
            divMesa.addEventListener('click', () => mostrarDetalhesComanda(idMesa));

            // Distribui as mesas nas colunas
            // Divide na metade
            if (index < Math.ceil(idsOrdenados.length / 2)) {
                coluna1.appendChild(divMesa);
            } else {
                coluna2.appendChild(divMesa);
            }
        });

        gridMesasContainer.appendChild(coluna1);
        gridMesasContainer.appendChild(coluna2);
    }

    function mostrarDetalhesComanda(idMesa) {
        mesaAtivaId = idMesa; // Armazena o ID da mesa ativa
        const mesa = dadosMesas[idMesa];
        let conteudoHtml = '';
        let acoesHtml = '';

        if (mesa.status === 'livre') {
            conteudoHtml = `<div class="comanda-vazia"><i class="fas fa-concierge-bell"></i><p>Mesa livre. Abra uma nova comanda para iniciar.</p></div>`;
            acoesHtml = `
                <button class="btn-acao-comanda btn-abrir-comanda" data-mesa="${idMesa}"><i class="fas fa-plus-circle"></i> Abrir Comanda</button>
                <button class="btn-acao-comanda btn-editar-mesa"><i class="fas fa-edit"></i> Editar Mesa</button>
            `;
        } else {
            let itensHtml = '<ul id="lista-itens-comanda">';
            if (mesa.itens.length > 0) {
                mesa.itens.forEach(item => {
                    itensHtml += `<li class="item-comanda">
                        <div class="item-comanda-esquerda">
                            <div class="controles-qtd-wrapper">
                                <button class="btn-qtd btn-diminuir" data-nome="${item.nome}">-</button>
                                <span class="qtd-valor">${item.qtd}</span>
                                <button class="btn-qtd btn-aumentar" data-nome="${item.nome}">+</button>
                            </div>
                            <button class="btn-remover-item-comanda" data-nome="${item.nome}" title="Remover Item da Comanda">&times;</button>
                            <span>${item.nome}</span>
                        </div>
                        <div class="controles-item-comanda"><span>R$ ${item.preco.toFixed(2)}</span></div>
                    </li>`;
                });
            } else {
                itensHtml += `<li class="item-comanda-vazio">Nenhum item lançado.</li>`;
            }
            itensHtml += '</ul>';

            conteudoHtml = `
                <div class="conteudo-comanda">${itensHtml}</div>
                <div class="total-comanda">
                    <span>Total:</span>
                    <span id="valor-total-comanda">R$ ${mesa.total.toFixed(2)}</span>
                </div>
            `;
            acoesHtml = `
                <button class="btn-acao-comanda btn-add-item"><i class="fas fa-plus"></i> Adicionar Item</button>
                <button class="btn-acao-comanda btn-fechar-conta"><i class="fas fa-dollar-sign"></i> Fechar Conta</button>
                <button class="btn-acao-comanda btn-editar-mesa"><i class="fas fa-edit"></i> Editar Mesa</button>
            `;
        }

        painelDetalhes.innerHTML = `
            <div class="cabecalho-detalhes">
                <button class="btn-voltar-grid"><i class="fas fa-arrow-left"></i> Voltar</button>
                <h3>Comanda - Mesa ${idMesa.toString().padStart(2, '0')}</h3>
            </div>
            ${conteudoHtml}
            <div class="acoes-comanda">${acoesHtml}</div>
        `;

        // Mostra o painel de detalhes e esconde a grid
        painelGridMesas.classList.remove('ativo');
        painelDetalhes.classList.add('ativo');
    }

    // Delegação de eventos para o painel de detalhes
    painelDetalhes.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-abrir-comanda')) {
            const idMesa = e.target.dataset.mesa;
            dadosMesas[idMesa].status = 'ocupada';
            dadosMesas[idMesa].itens = []; // Garante que a lista de itens esteja vazia
            dadosMesas[idMesa].total = 0;
            salvarDadosMesas();
            renderizarMesas();
            mostrarDetalhesComanda(idMesa); // Reabre os detalhes com a nova visão
        }

        if (e.target.closest('.btn-voltar-grid')) {
            mesaAtivaId = null; // Limpa a mesa ativa
            painelDetalhes.classList.remove('ativo');
            painelGridMesas.classList.add('ativo');

            // Limpa os dados da mesa anterior e restaura o placeholder original do HTML
            painelDetalhes.innerHTML = 'Selecione uma mesa para ver os detalhes';
        }

        if (e.target.classList.contains('btn-add-item')) {
            abrirModalAdicionarItem();
        }

        if (e.target.classList.contains('btn-remover-item-comanda')) {
            const nomeItem = e.target.dataset.nome;
            if(confirm(`Deseja remover "${nomeItem}" completamente da comanda?`)) {
                removerItemTotalmente(nomeItem);
            }
        }

        if (e.target.classList.contains('btn-diminuir')) {
            const nomeItem = e.target.dataset.nome;
            alterarQuantidadeItem(nomeItem, -1);
        }

        if (e.target.classList.contains('btn-aumentar')) {
            const nomeItem = e.target.dataset.nome;
            alterarQuantidadeItem(nomeItem, 1);
        }

        if (e.target.classList.contains('btn-fechar-conta')) {
            abrirModalPagamento();
        }

        if (e.target.classList.contains('btn-editar-mesa')) {
            abrirModalEditarMesa();
        }
    });

    // --- NOVA FUNÇÃO DE INTEGRAÇÃO COM O CAIXA ---
    function registrarFechamentoMesa(valor, idMesa, metodoPagamento) {
        const CHAVE_HISTORICO_FINANCEIRO = 'casaTaperaHistoricoFinanceiro';
        try {
            const mesa = dadosMesas[idMesa];
            const historico = JSON.parse(localStorage.getItem(CHAVE_HISTORICO_FINANCEIRO)) || [];
            const novaTransacao = {
                id: `trans-mesa-${idMesa}-${Date.now()}`,
                tipo: 'entrada',
                descricao: `Venda Mesa ${idMesa.toString().padStart(2, '0')} (${metodoPagamento})`,
                valor: valor,
                hora: new Date().toISOString(),
                cliente: `Mesa ${idMesa.toString().padStart(2, '0')}${mesa.nomeReserva ? ' (' + mesa.nomeReserva + ')' : ''}`,
                itens: JSON.parse(JSON.stringify(mesa.itens)) // Clona os itens da comanda
            };
            historico.unshift(novaTransacao);
            localStorage.setItem(CHAVE_HISTORICO_FINANCEIRO, JSON.stringify(historico));
        } catch (error) {
            console.error("Erro ao registrar fechamento de mesa no histórico financeiro:", error);
        }
    }

    // --- LÓGICA DO MODAL DE PAGAMENTO ---
    function abrirModalPagamento() {
        if (!mesaAtivaId) return;
        const valorTotal = dadosMesas[mesaAtivaId].total;
        document.getElementById('modal-pagamento-descricao').textContent = `Como a conta de R$ ${valorTotal.toFixed(2).replace('.',',')} foi paga?`;
        modalPagamento.classList.add('visivel');
    }

    modalPagamento.addEventListener('click', (e) => {
        const metodoBtn = e.target.closest('.btn-pagamento-modal');
        if (metodoBtn) {
            const metodo = metodoBtn.dataset.metodo;
            finalizarConta(metodo);
        }
        if (e.target === modalPagamento || e.target.closest('.btn-fechar-modal')) {
            modalPagamento.classList.remove('visivel');
        }
    });

    function finalizarConta(metodoPagamento) {
        const mesa = dadosMesas[mesaAtivaId];
        const valorTotalMesa = mesa.total;

        registrarFechamentoMesa(valorTotalMesa, mesaAtivaId, metodoPagamento);

        mesa.status = 'livre';
        mesa.itens = [];
        mesa.total = 0;
        salvarDadosMesas();
        
        modalPagamento.classList.remove('visivel');
        renderizarMesas();
        mostrarDetalhesComanda(mesaAtivaId);
    }

    function abrirModalAdicionarItem() {
        const containerCardapio = document.getElementById('cardapio-para-adicionar');
        containerCardapio.innerHTML = ''; // Limpa o conteúdo anterior

        for (const categoria in cardapioData) {
            let categoriaHtml = `<div class="categoria-modal"><h4>${categoria}</h4><div class="itens-categoria-modal">`;
            cardapioData[categoria].forEach(item => {
                categoriaHtml += `<button class="btn-item-cardapio" data-nome="${item.nome}" data-preco="${item.preco}">
                                    <span class="nome-item-modal">${item.nome}</span>
                                    <span class="preco-item-modal">R$ ${item.preco.toFixed(2)}</span>
                                </button>`;
            });
            categoriaHtml += `</div></div>`;
            containerCardapio.innerHTML += categoriaHtml;
        }
        modalAddItem.classList.add('visivel');
    }

    // Adicionar item à comanda a partir do modal
    document.getElementById('cardapio-para-adicionar').addEventListener('click', (e) => {
        const btnItem = e.target.closest('.btn-item-cardapio');
        if (btnItem && mesaAtivaId) {
            const nome = btnItem.dataset.nome;
            const preco = parseFloat(btnItem.dataset.preco);
            const mesa = dadosMesas[mesaAtivaId];

            const itemExistente = mesa.itens.find(item => item.nome === nome);
            if (itemExistente) {
                itemExistente.qtd++;
                itemExistente.preco += preco;
            } else {
                mesa.itens.push({ nome: nome, qtd: 1, preco: preco });
            }
            mesa.total += preco;
            salvarDadosMesas();
            
            // Feedback visual de adição
            const originalColor = btnItem.style.backgroundColor;
            btnItem.style.backgroundColor = 'var(--color-green)';
            setTimeout(() => {
                btnItem.style.backgroundColor = originalColor;
            }, 200);

            mostrarDetalhesComanda(mesaAtivaId); // Atualiza a visualização da comanda
        }
    });

    function alterarQuantidadeItem(nomeItem, delta) {
        if (!mesaAtivaId) return;

        const mesa = dadosMesas[mesaAtivaId];
        const itemIndex = mesa.itens.findIndex(item => item.nome === nomeItem);

        if (itemIndex > -1) {
            const item = mesa.itens[itemIndex];
            const precoUnitario = item.preco / item.qtd; // Calcula o preço de uma unidade

            if (delta > 0) {
                item.qtd++;
                item.preco += precoUnitario;
                mesa.total += precoUnitario;
            } else {
                mesa.total -= precoUnitario; // Subtrai o valor do total da mesa
                if (item.qtd > 1) {
                    item.qtd--;
                    item.preco -= precoUnitario;
                } else {
                    mesa.itens.splice(itemIndex, 1); // Remove o item se a quantidade for 1
                }
            }
            salvarDadosMesas();

            mostrarDetalhesComanda(mesaAtivaId); // Atualiza a visualização
        }
    }

    function removerItemTotalmente(nomeItem) {
        if (!mesaAtivaId) return;

        const mesa = dadosMesas[mesaAtivaId];
        const itemIndex = mesa.itens.findIndex(item => item.nome === nomeItem);

        if (itemIndex > -1) {
            const item = mesa.itens[itemIndex];
            mesa.total -= item.preco; // Subtrai o valor total acumulado deste item
            mesa.itens.splice(itemIndex, 1); // Remove o item do array
            salvarDadosMesas();
            mostrarDetalhesComanda(mesaAtivaId); // Atualiza a visualização
        }
    }

    // Fechar modal de adicionar item
    modalAddItem.querySelector('.btn-fechar-modal').addEventListener('click', () => modalAddItem.classList.remove('visivel'));
    modalAddItem.addEventListener('click', (e) => { if (e.target === modalAddItem) modalAddItem.classList.remove('visivel'); });

    // --- LÓGICA DO MODAL DE EDITAR MESA ---
    function abrirModalEditarMesa() {
        if (!mesaAtivaId) return;
        const mesa = dadosMesas[mesaAtivaId];

        document.getElementById('modal-editar-mesa-numero').textContent = mesaAtivaId.toString().padStart(2, '0');
        const statusSelect = document.getElementById('mesa-status');
        const nomeReservaInput = document.getElementById('mesa-nome-reserva');
        const campoNomeReserva = document.getElementById('campo-nome-reserva');

        statusSelect.value = mesa.status;
        nomeReservaInput.value = mesa.nomeReserva || '';

        campoNomeReserva.classList.toggle('oculto', mesa.status !== 'reservada');

        modalEditarMesa.classList.add('visivel');
    }

    document.getElementById('mesa-status').addEventListener('change', (e) => {
        document.getElementById('campo-nome-reserva').classList.toggle('oculto', e.target.value !== 'reservada');
    });

    document.getElementById('form-editar-mesa').addEventListener('submit', (e) => {
        e.preventDefault();
        if (!mesaAtivaId) return;

        const mesa = dadosMesas[mesaAtivaId];
        const novoStatus = document.getElementById('mesa-status').value;
        const novoNomeReserva = document.getElementById('mesa-nome-reserva').value;

        mesa.status = novoStatus;
        mesa.nomeReserva = (novoStatus === 'reservada') ? novoNomeReserva : '';
        salvarDadosMesas();

        modalEditarMesa.classList.remove('visivel');
        renderizarMesas();
        mostrarDetalhesComanda(mesaAtivaId);
    });

    modalEditarMesa.querySelector('.btn-fechar-modal').addEventListener('click', () => modalEditarMesa.classList.remove('visivel'));
    modalEditarMesa.addEventListener('click', (e) => { if (e.target === modalEditarMesa) modalEditarMesa.classList.remove('visivel'); });

    // --- LÓGICA DE GERENCIAMENTO DE MESAS (CRIAR/EXCLUIR) ---
    
    function atualizarSelectExclusao() {
        selectExcluirMesa.innerHTML = '';
        const idsOrdenados = Object.keys(dadosMesas).map(Number).sort((a, b) => a - b);
        idsOrdenados.forEach(id => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = `Mesa ${id.toString().padStart(2, '0')}`;
            selectExcluirMesa.appendChild(option);
        });
    }

    btnAbrirGerenciar.addEventListener('click', () => {
        atualizarSelectExclusao();
        modalGerenciarMesas.classList.add('visivel');
    });

    modalGerenciarMesas.querySelector('.btn-fechar-modal').addEventListener('click', () => modalGerenciarMesas.classList.remove('visivel'));
    modalGerenciarMesas.addEventListener('click', (e) => { if (e.target === modalGerenciarMesas) modalGerenciarMesas.classList.remove('visivel'); });

    // Eventos para o novo modal de QR Codes
    if (btnAbrirGerenciarQr) {
        btnAbrirGerenciarQr.addEventListener('click', () => {
            renderizarListaQrCodes();
            resetarVisualizadorQr();
            modalGerenciarQr.classList.add('visivel');
        });
    }

    modalGerenciarQr.querySelector('.btn-fechar-modal').addEventListener('click', () => modalGerenciarQr.classList.remove('visivel'));
    modalGerenciarQr.addEventListener('click', (e) => { if (e.target === modalGerenciarQr) modalGerenciarQr.classList.remove('visivel'); });

    btnCriarMesa.addEventListener('click', () => {
        const ids = Object.keys(dadosMesas).map(Number);
        const novoId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
        
        dadosMesas[novoId] = { status: 'livre', itens: [], total: 0 };
        salvarDadosMesas();
        renderizarMesas();
        atualizarSelectExclusao();
        renderizarListaQrCodes(); // Atualiza a lista no novo modal
        alert(`Mesa ${novoId} criada com sucesso! O QR Code já está disponível.`);
    });

    btnExcluirMesa.addEventListener('click', () => {
        const idParaExcluir = selectExcluirMesa.value;
        if (!idParaExcluir) return;

        const mesa = dadosMesas[idParaExcluir];
        if (mesa.status !== 'livre') {
            alert('Não é possível excluir uma mesa que está ocupada ou reservada. Finalize a conta primeiro.');
            return;
        }

        if (confirm(`Mover a Mesa ${idParaExcluir} para a lixeira?`)) {
            // Envia para a lixeira antes de deletar
            const originalIndex = Object.keys(dadosMesas).indexOf(idParaExcluir);
            adicionarALixeira('mesa', { id: idParaExcluir, data: mesa, originalIndex: originalIndex }, 'Gerenciador de Mesas');

            delete dadosMesas[idParaExcluir];
            salvarDadosMesas();
            renderizarMesas();
            atualizarSelectExclusao();
            renderizarListaQrCodes(); // Atualiza a lista no novo modal

            // Se a mesa excluída era a que estava selecionada no painel de detalhes, reseta a visualização
            if (parseInt(idParaExcluir) === mesaAtivaId) {
                mesaAtivaId = null;
                painelDetalhes.classList.remove('ativo');
                painelGridMesas.classList.add('ativo');
                painelDetalhes.innerHTML = 'Selecione uma mesa para ver os detalhes';
            }

            alert('Mesa excluída com sucesso.');
        }
    });

    // Usa delegação de eventos no container dos QR Codes
    modalGerenciarQr.addEventListener('click', (e) => {
        const itemMesa = e.target.closest('.item-mesa-qr');
        const btnDownload = e.target.closest('#btn-download-qr-visualizado');

        if (itemMesa) {
            visualizarQrCode(itemMesa.dataset.id);
            return;
        }

        if (btnDownload) {
            downloadQrCode(btnDownload.dataset.id);
            return;
        }
    });

    async function downloadQrCode(mesaId) {
        // Verifica se a biblioteca QRCode está disponível
        if (typeof QRCode === 'undefined') {
            alert('Erro: A biblioteca de geração de QR Code não foi carregada. Verifique o console para mais detalhes.');
            console.error("QRCode.js não encontrado. Adicione o script da biblioteca ao seu HTML.");
            return;
        }

        const url = new URL('index.html', window.location.href);
        url.searchParams.set('mesa', mesaId);
        const urlString = url.toString();

        const tempDiv = document.getElementById('qrcode-temp');
        tempDiv.innerHTML = ''; // Limpa o container temporário

        // Gera o QR Code
        new QRCode(tempDiv, {
            text: urlString, width: 256, height: 256,
            colorDark : "#000000", colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });

        // Pequeno atraso para garantir que o canvas foi renderizado pela biblioteca
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = tempDiv.querySelector('canvas');
        const link = document.createElement('a');
        link.download = `QRCode-Mesa-${mesaId.toString().padStart(2, '0')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    // Renderização inicial
    renderizarMesas();
});