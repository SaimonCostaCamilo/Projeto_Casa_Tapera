document.addEventListener('DOMContentLoaded', () => {
    const btnConfiguracoes = document.getElementById('btn-configuracoes');
    const barraLateralConfiguracoes = document.getElementById('barra-lateral-configuracoes');
    const btnFecharBarraLateral = document.getElementById('btn-fechar-barra-lateral');
    const novosPedidosList = document.getElementById('lista-novos-pedidos');
    const emPreparoList = document.getElementById('lista-em-preparo');
    const finalizadosList = document.getElementById('lista-finalizados');
    const somNotificacao = document.getElementById('som-notificacao');

    // Armazena os IDs dos pedidos na coluna "Novos" para detectar a chegada de um novo.
    let idsPedidosNovosConhecidos = new Set();

    // Objeto para armazenar temporariamente os pedidos em modo de edição
    let pedidosEmEdicao = {};

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

    // --- LÓGICA PARA DESBLOQUEAR O ÁUDIO ---
    // Navegadores modernos bloqueiam o som automático.
    // Esta função "desbloqueia" o áudio na primeira interação do usuário.
    function desbloquearAudio() {
        somNotificacao.play().catch(() => {}); // Tenta tocar
        somNotificacao.pause(); // Pausa imediatamente
        somNotificacao.currentTime = 0; // Volta para o início
        document.body.removeEventListener('click', desbloquearAudio); // Remove o listener para não rodar de novo
    }
    document.body.addEventListener('click', desbloquearAudio);

    function carregarPedidos() {
        const todosPedidos = JSON.parse(localStorage.getItem('pedidosTapera')) || [];
        
        novosPedidosList.innerHTML = '';
        emPreparoList.innerHTML = '';
        finalizadosList.innerHTML = '';
        idsPedidosNovosConhecidos.clear(); // Limpa o set antes de repopular

        todosPedidos.forEach((pedido, index) => {
            const cardPedido = criarCardPedido(pedido);
            // Adiciona uma variável CSS para o atraso da animação
            cardPedido.style.setProperty('--order-index', index);
            if (pedido.status === 'novo') {
                novosPedidosList.appendChild(cardPedido);
                idsPedidosNovosConhecidos.add(pedido.id); // Adiciona o ID ao set de conhecidos
            } else if (pedido.status === 'preparo') {
                emPreparoList.appendChild(cardPedido);
            } else if (pedido.status === 'finalizado') {
                finalizadosList.appendChild(cardPedido);
            }
        });
    }

    function criarCardPedido(pedido) {
        const card = document.createElement('div');
        card.className = 'card-pedido';
        card.dataset.orderId = pedido.id;

        // Formata a hora do pedido (usa pedido.data ou extrai do ID timestamp)
        const dataPedido = pedido.data ? new Date(pedido.data) : new Date(parseInt(pedido.id.split('-')[1]));
        const horaFormatada = dataPedido.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        let itemsHtml = '<ul>';
        for (const itemName in pedido.items) {
            const item = pedido.items[itemName];
            itemsHtml += `<li>${item.quantity}x ${itemName}</li>`;
        }
        itemsHtml += '</ul>';

        // CORREÇÃO DEFINITIVA: Lógica robusta para exibir o total, com ou sem cupom.
        let totalHtml;
        // Verifica se os campos existem e se o valor final é de fato menor que o subtotal (indicando um desconto)
        if (pedido.valorFinal !== undefined && pedido.subTotal !== undefined && pedido.valorFinal < pedido.subTotal) {
            totalHtml = `Subtotal: <del>R$ ${pedido.subTotal.toFixed(2).replace('.', ',')}</del><br>Total: R$ ${pedido.valorFinal.toFixed(2).replace('.', ',')}`;
        } else {
            // Caso contrário, mostra apenas o valor final (ou o subtotal se valorFinal não existir).
            // Garante que valorAMostrar seja um número antes de chamar toFixed.
            const valorAMostrar = typeof pedido.valorFinal === 'number' ? pedido.valorFinal : (typeof pedido.subTotal === 'number' ? pedido.subTotal : 0);
            totalHtml = `Total: R$ ${valorAMostrar.toFixed(2).replace('.', ',')}`;
        }

        const idElemento = `<p class="id-pedido">ID: ${pedido.id}</p>`;
        const botaoImprimirInline = pedido.status === 'preparo' ? `<button class="btn-acao btn-imprimir btn-imprimir-inline" title="Imprimir pedido"><i class="fas fa-print"></i></button>` : '';

        // Define se o estilo de destaque (para 'novo' e 'finalizado') deve ser aplicado
        const isDestaqueHorario = pedido.status === 'novo' || pedido.status === 'finalizado';
        const spanHorario = `<span style="${isDestaqueHorario ? 'font-size: 1.2em; font-family: \'Bebas Neue\', sans-serif; background: rgba(240, 100, 0, 0.1); padding: 4px 10px; border-radius: 6px;' : 'font-size: 0.8em; margin-left: 10px; font-family: \'Roboto\', sans-serif;'} color: var(--color-orange); font-weight: bold;">${isDestaqueHorario ? '' : '['}${horaFormatada}${isDestaqueHorario ? '' : ']'}</span>`;

        // Horário específico para o modo Preparo (abaixo do ID)
        const htmlHorarioPreparo = pedido.status === 'preparo' ? `<p style="font-size: 0.85em; color: var(--color-orange); margin: 2px 0 0 0; font-family: 'Roboto', sans-serif; font-weight: bold;"><i class="far fa-clock"></i> ${horaFormatada}</p>` : '';

        card.innerHTML = `
            <div class="cabecalho-pedido" style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="flex: 1;">
                    <h4 style="margin: 0;">${pedido.nomeCliente}</h4>
                    ${idElemento}
                    ${htmlHorarioPreparo}
                </div>
                ${isDestaqueHorario ? spanHorario : botaoImprimirInline}
            </div>
            <div class="detalhes-pedido">
                ${itemsHtml}
            </div>
            <p class="total-pedido">${totalHtml}</p>
            <p><strong>Pagamento:</strong> ${pedido.metodoPagamento}</p>
            <p><strong>Entrega:</strong> ${pedido.metodoEntrega === 'delivery' ? 'Entrega' : 'Retirada'}</p>
            ${pedido.metodoEntrega === 'delivery' && pedido.endereco ? `<p style="margin-top: 5px;"><strong>Endereço:</strong> ${pedido.endereco}</p>` : ''}
            <div class="acoes-pedido">
                ${pedido.status === 'novo' ? '<button class="btn-acao btn-preparo">▶ Iniciar Preparo</button>' : ''}
                ${pedido.status === 'preparo' ? '<button class="btn-acao btn-finalizar">✔ Finalizar</button>' : ''}
                ${(pedido.status === 'novo') ? '<button class="btn-acao btn-editar-comanda"><i class="fas fa-edit"></i> Editar</button>' : ''}
                <button class="btn-acao btn-excluir">✖ Remover</button>
            </div>
        `;
        return card;
    }

    // --- FUNÇÃO DE INTEGRAÇÃO COM O HISTÓRICO FINANCEIRO (REINTEGRADA E CORRIGIDA) ---
    function registrarVendaOnline(pedido) {
        const CHAVE_HISTORICO_FINANCEIRO = 'casaTaperaHistoricoFinanceiro';
        try {
            const historico = JSON.parse(localStorage.getItem(CHAVE_HISTORICO_FINANCEIRO)) || [];
            
            // Separa o valor da venda do valor da entrega
            const taxaEntrega = pedido.taxaEntrega || 0;
            const valorVenda = (typeof pedido.valorFinal === 'number' ? pedido.valorFinal : 0) - taxaEntrega;

            // Cria a transação para a VENDA DOS PRODUTOS
            const novaTransacaoVenda = {
                id: `trans-pedido-${pedido.id}-${Date.now()}`,
                tipo: 'entrada',
                descricao: `Venda Online Pedido #${pedido.id.substring(7)} (${pedido.metodoPagamento})`,
                valor: valorVenda, // Apenas o valor dos produtos
                hora: new Date().toISOString()
            };
            historico.unshift(novaTransacaoVenda);

            // Se houver taxa de entrega, cria uma transação separada para o motoboy
            if (taxaEntrega > 0) {
                // Simulação de atribuição de motoboy (alternando entre os dois)
                const motoboysDisponiveis = ["Carlos Almeida", "Mariana Costa"];
                const motoboyAtribuido = motoboysDisponiveis[Math.floor(Math.random() * motoboysDisponiveis.length)];

                const transacaoMotoboy = {
                    id: `trans-motoboy-${pedido.id}-${Date.now()}`,
                    tipo: 'saida', // A taxa é uma despesa para o restaurante, paga ao motoboy
                    descricao: `Taxa de entrega Pedido #${pedido.id.substring(7)}`,
                    valor: taxaEntrega,
                    hora: new Date().toISOString(),
                    categoria: 'Entrega', // Categoria para o financeiro
                    motoboy: motoboyAtribuido, // Campo extra para identificar o motoboy
                    endereco: pedido.endereco // Salva o endereço da entrega
                };
                historico.unshift(transacaoMotoboy);
            }

            localStorage.setItem(CHAVE_HISTORICO_FINANCEIRO, JSON.stringify(historico));
        } catch (error) {
            console.error("Erro ao registrar venda no histórico financeiro:", error);
        }
    }

    function imprimirPedido(pedido) {
        const listaItens = Object.entries(pedido.items)
            .map(([nome, item]) => `<li>${item.quantity}x ${nome} - R$ ${item.price.toFixed(2).replace('.', ',')}</li>`)
            .join('');

        const tipoEntrega = pedido.metodoEntrega === 'delivery' ? 'Entrega' : 'Retirada';
        const cabecalho = `
            <h2 style="margin: 0 0 0.25rem 0;">Pedido #${pedido.id}</h2>
            <p style="margin: 0.15rem 0;">Cliente: <strong>${pedido.nomeCliente}</strong></p>
            <p style="margin: 0.15rem 0;">Status: ${pedido.status} | ${tipoEntrega} | Pagamento: ${pedido.metodoPagamento}</p>
            <hr />
        `;

        const conteudo = `
            <div style="font-family: Arial, sans-serif; color: #222;">
                ${cabecalho}
                <h3>Itens</h3>
                <ul style="margin:0 0 0.5rem 1rem; padding: 0; list-style: disc;">
                    ${listaItens}
                </ul>
                <p style="font-weight: bold; margin: 0.5rem 0;">Total: R$ ${(pedido.valorFinal || 0).toFixed(2).replace('.', ',')}</p>
            </div>
        `;

        const novaJanela = window.open('', '_blank');
        if (!novaJanela) {
            alert('Falha ao abrir janela de impressão. Verifique se o bloqueador de popups está ativo.');
            return;
        }

        novaJanela.document.write(`
            <html>
                <head>
                    <title>Imprimir Pedido #${pedido.id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        h2 { color: #d2691e; }
                        h3 { margin-bottom: 0.3rem; }
                        p, li { color: #222; }
                        ul { list-style: disc inside; }
                    </style>
                </head>
                <body>
                    ${conteudo}
                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(function() { window.close(); }, 200);
                        };
                    </script>
                </body>
            </html>
        `);

        novaJanela.document.close();
    }

    function atualizarStatusPedido(idPedido, novoStatus) {
        let todosPedidos = JSON.parse(localStorage.getItem('pedidosTapera')) || [];
        const indicePedido = todosPedidos.findIndex(p => p.id === idPedido);
        if (indicePedido > -1) {
            if (novoStatus === 'delete') {
                const pedidoExcluido = todosPedidos[indicePedido];
                // Envia para a lixeira antes de remover
                adicionarALixeira('pedido', { ...pedidoExcluido, originalIndex: indicePedido }, 'Painel de Controle');
                
                todosPedidos.splice(indicePedido, 1);
            } else {
                todosPedidos[indicePedido].status = novoStatus;
                // Se o pedido foi finalizado, registra a venda no histórico financeiro.
                if (novoStatus === 'finalizado') {
                    const pedido = todosPedidos[indicePedido];
                    registrarVendaOnline(pedido);
                }
            }
            localStorage.setItem('pedidosTapera', JSON.stringify(todosPedidos));
            carregarPedidos();
        }
    }

    // --- FUNÇÕES DE EDIÇÃO DE COMANDA ---

    function renderizarCardParaEdicao(cardElement, pedido) {
        let itemsHtml = '<ul>';
        if (Object.keys(pedido.items).length > 0) {
            for (const itemName in pedido.items) {
                const item = pedido.items[itemName];
                const unitPrice = item.price;
                const totalPrice = unitPrice * item.quantity;
                itemsHtml += `
                    <li class="item-comanda-editavel" data-name="${itemName}">
                        <span>${item.quantity}x ${itemName}</span>
                        <div class="controles-item-comanda">
                            <span>R$ ${totalPrice.toFixed(2).replace('.',',')}</span>
                            <button class="btn-qtd-comanda" data-change="-1" title="Diminuir"><i class="fas fa-minus-circle"></i></button>
                            <button class="btn-qtd-comanda" data-change="1" title="Aumentar"><i class="fas fa-plus-circle"></i></button>
                            <button class="btn-remover-item-comanda" title="Remover"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </li>`;
            }
        } else {
            itemsHtml += '<li style="text-align: center; color: #888;">Nenhum item no pedido.</li>';
        }
        itemsHtml += '</ul>';

        cardElement.querySelector('.detalhes-pedido').innerHTML = itemsHtml;
        
        recalculateAndRenderTotal(cardElement, pedido);

        const acoesDiv = cardElement.querySelector('.acoes-pedido');
        acoesDiv.innerHTML = `
            <button class="btn-acao btn-add-item-comanda"><i class="fas fa-plus"></i> Adicionar</button>
            <button class="btn-acao btn-salvar-comanda"><i class="fas fa-save"></i> Salvar</button>
            <button class="btn-acao btn-cancelar-edicao">✖ Cancelar</button>
        `;
    }

    function recalculateAndRenderTotal(cardElement, pedido) {
        let subTotal = 0;
        for (const itemName in pedido.items) {
            const item = pedido.items[itemName];
            subTotal += item.price * item.quantity;
        }
        pedido.subTotal = subTotal;

        let valorFinal = subTotal;
        if (pedido.cupom) {
            let desconto = 0;
            if (pedido.cupom.tipo === 'percentual') {
                desconto = (subTotal * pedido.cupom.valor) / 100;
            } else {
                desconto = pedido.cupom.valor;
            }
            valorFinal = Math.max(0, subTotal - desconto);
        }
        pedido.valorFinal = valorFinal;

        const totalPedidoEl = cardElement.querySelector('.total-pedido');
        if (totalPedidoEl) {
            let totalHtml;
            if (pedido.valorFinal < pedido.subTotal) {
                totalHtml = `Subtotal: <del>R$ ${pedido.subTotal.toFixed(2).replace('.', ',')}</del><br>Total: R$ ${pedido.valorFinal.toFixed(2).replace('.', ',')}`;
            } else {
                const valorAMostrar = typeof pedido.valorFinal === 'number' ? pedido.valorFinal : (typeof pedido.subTotal === 'number' ? pedido.subTotal : 0);
                totalHtml = `Total: R$ ${valorAMostrar.toFixed(2).replace('.', ',')}`;
            }
            totalPedidoEl.innerHTML = totalHtml;
        }
    }

    function toggleEditMode(cardElement, pedidoId) {
        const isEditing = cardElement.classList.toggle('editing-comanda');
        
        if (isEditing) {
            const todosPedidos = JSON.parse(localStorage.getItem('pedidosTapera')) || [];
            const pedidoOriginal = todosPedidos.find(p => p.id === pedidoId);
            if (!pedidoOriginal) return;

            pedidosEmEdicao[pedidoId] = JSON.parse(JSON.stringify(pedidoOriginal));
            renderizarCardParaEdicao(cardElement, pedidosEmEdicao[pedidoId]);
        } else {
            // Correção: Em vez de recarregar tudo, substitui apenas o card cancelado.
            delete pedidosEmEdicao[pedidoId];
            
            const todosPedidos = JSON.parse(localStorage.getItem('pedidosTapera')) || [];
            const pedidoOriginal = todosPedidos.find(p => p.id === pedidoId);

            if (pedidoOriginal) {
                // Cria um novo card com os dados originais do localStorage
                const novoCard = criarCardPedido(pedidoOriginal);
                // Preserva o índice da animação para evitar que o card "pule"
                const orderIndex = cardElement.style.getPropertyValue('--order-index');
                if (orderIndex) {
                    novoCard.style.setProperty('--order-index', orderIndex);
                }
                // Substitui o card em modo de edição pelo card original
                cardElement.replaceWith(novoCard);
            } else {
                // Fallback de segurança: se não encontrar o pedido, recarrega tudo.
                carregarPedidos();
            }
        }
    }

    function alterarQtdItemComanda(pedidoId, itemName, change) {
        const pedidoEditado = pedidosEmEdicao[pedidoId];
        if (!pedidoEditado || !pedidoEditado.items[itemName]) return;

        pedidoEditado.items[itemName].quantity += change;

        if (pedidoEditado.items[itemName].quantity <= 0) {
            delete pedidoEditado.items[itemName];
        }

        const cardElement = document.querySelector(`.card-pedido[data-order-id="${pedidoId}"]`);
        renderizarCardParaEdicao(cardElement, pedidoEditado);
    }

    function removerItemComanda(pedidoId, itemName) {
        const pedidoEditado = pedidosEmEdicao[pedidoId];
        if (!pedidoEditado || !pedidoEditado.items[itemName]) return;

        delete pedidoEditado.items[itemName];

        const cardElement = document.querySelector(`.card-pedido[data-order-id="${pedidoId}"]`);
        renderizarCardParaEdicao(cardElement, pedidoEditado);
    }

    function salvarComandaEditada(pedidoId) {
        const pedidoEditado = pedidosEmEdicao[pedidoId];
        if (!pedidoEditado) return;

        let todosPedidos = JSON.parse(localStorage.getItem('pedidosTapera')) || [];
        const indicePedido = todosPedidos.findIndex(p => p.id === pedidoId);

        if (indicePedido > -1) {
            recalculateAndRenderTotal(document.createElement('div'), pedidoEditado); // Recalcula totais
            todosPedidos[indicePedido] = pedidoEditado;
            localStorage.setItem('pedidosTapera', JSON.stringify(todosPedidos));
            
            delete pedidosEmEdicao[pedidoId];
            carregarPedidos();
            alert('Pedido atualizado com sucesso!');
        }
    }

    // --- LÓGICA DO MODAL DE ADICIONAR ITEM ---
    const modalAddItem = document.getElementById('modal-add-item-painel');
    const cardapioContainer = document.getElementById('cardapio-para-adicionar-painel');
    let pedidoIdParaAdicionar = null;

    const cardapioData = {
        "Hambúrgueres": [ { nome: "Hambúrguer de Carne", preco: 20.00 }, { nome: "Hambúrguer de Frango", preco: 22.00 }, { nome: "Hambúrguer de Bacon", preco: 25.00 }, { nome: "Hambúrguer Vegano", preco: 25.00 }, ],
        "Pastéis Salgados": [ { nome: "Pastel de Carne", preco: 12.00 }, { nome: "Frango c/ Catupiry", preco: 12.00 }, { nome: "Calabresa", preco: 12.00 }, { nome: "Queijo c/ Orégano", preco: 12.00 }, { nome: "Queijo", preco: 12.00 }, ],
        "Pastéis Doces": [ { nome: "Chocolate ao Leite", preco: 15.00 }, { nome: "Romeu e Julieta", preco: 14.00 }, { nome: "Creme Ninho", preco: 15.00 }, { nome: "Stikadinho", preco: 17.00 }, { nome: "Ouro Branco", preco: 15.00 }, { nome: "Oreo", preco: 15.00 }, { nome: "Kit-Kat", preco: 17.00 }, { nome: "Sonho de Valsa", preco: 15.00 }, ],
        "Acompanhamentos": [ { nome: "Batata P", preco: 8.00 }, { nome: "Batata M", preco: 10.00 }, { nome: "Batata G", preco: 15.00 }, ],
        "Pães e Cucas": [ { nome: "Pão Artesanal 500g", preco: 20.00 }, { nome: "Cuca de Goiabada 500g", preco: 15.00 }, { nome: "Cuca de Doce de Leite 500g", preco: 17.00 }, ],
        "Sucos Naturais": [ { nome: "Suco de Laranja", preco: 6.00 }, { nome: "Suco de Limão", preco: 6.00 }, { nome: "Suco de Manga", preco: 8.00 }, { nome: "Suco de Maracujá", preco: 8.00 }, { nome: "Suco de Abacaxi", preco: 8.00 }, ],
        "Bebidas": [ { nome: "Coca-Cola Lata 350ml", preco: 7.00 }, { nome: "Refrigerantes Lata 350ml", preco: 6.00 }, { nome: "Água c/ Gás", preco: 3.50 }, { nome: "Água s/ Gás", preco: 3.00 }, { nome: "Suco de Laranja", preco: 6.00 }, ]
    };

    function abrirModalAdicionarItem(pedidoId) {
        pedidoIdParaAdicionar = pedidoId;
        cardapioContainer.innerHTML = '';

        for (const categoria in cardapioData) {
            let categoriaHtml = `<div class="categoria-modal"><h4>${categoria}</h4><div class="itens-categoria-modal">`;
            cardapioData[categoria].forEach(item => {
                categoriaHtml += `<button class="btn-item-cardapio" data-nome="${item.nome}" data-preco="${item.preco}">
                                    <span class="nome-item-modal">${item.nome}</span>
                                    <span class="preco-item-modal">R$ ${item.preco.toFixed(2)}</span>
                                </button>`;
            });
            categoriaHtml += `</div></div>`;
            cardapioContainer.innerHTML += categoriaHtml;
        }
        modalAddItem.classList.add('visivel');
    }

    cardapioContainer.addEventListener('click', (e) => {
        const btnItem = e.target.closest('.btn-item-cardapio');
        if (btnItem && pedidoIdParaAdicionar) {
            const nome = btnItem.dataset.nome;
            const preco = parseFloat(btnItem.dataset.preco);
            const pedidoEditado = pedidosEmEdicao[pedidoIdParaAdicionar];

            if (pedidoEditado.items[nome]) {
                pedidoEditado.items[nome].quantity++;
            } else {
                pedidoEditado.items[nome] = { price: preco, quantity: 1 };
            }
            
            btnItem.style.backgroundColor = 'var(--color-green)';
            setTimeout(() => { btnItem.style.backgroundColor = ''; }, 300);

            const cardElement = document.querySelector(`.card-pedido[data-order-id="${pedidoIdParaAdicionar}"]`);
            renderizarCardParaEdicao(cardElement, pedidoEditado);
        }
    });

    modalAddItem.querySelector('.btn-fechar-modal').addEventListener('click', () => modalAddItem.classList.remove('visivel'));
    modalAddItem.addEventListener('click', (e) => { if (e.target === modalAddItem) modalAddItem.classList.remove('visivel'); });

    document.querySelector('.grid-painel').addEventListener('click', (e) => {
        const card = e.target.closest('.card-pedido');
        if (!card) return;
        const idPedido = card.dataset.orderId;

        // Ações de edição (só funcionam se o card estiver em modo de edição)
        if (card.classList.contains('editing-comanda')) {
            const btnQtd = e.target.closest('.btn-qtd-comanda');
            const btnRemover = e.target.closest('.btn-remover-item-comanda');

            if (e.target.closest('.btn-salvar-comanda')) {
                salvarComandaEditada(idPedido);
            } else if (e.target.closest('.btn-cancelar-edicao')) {
                toggleEditMode(card, idPedido);
            } else if (e.target.closest('.btn-add-item-comanda')) {
                abrirModalAdicionarItem(idPedido);
            } else if (btnQtd) {
                const itemName = btnQtd.closest('.item-comanda-editavel').dataset.name;
                const change = parseInt(btnQtd.dataset.change, 10);
                alterarQtdItemComanda(idPedido, itemName, change);
            } else if (btnRemover) {
                const itemName = btnRemover.closest('.item-comanda-editavel').dataset.name;
                if (confirm(`Tem certeza que deseja remover o item "${itemName}" do pedido?`)) {
                    removerItemComanda(idPedido, itemName);
                }
            }
            return; // Impede que outras ações (como mover card) sejam acionadas
        }

        // Ações normais do card
        if (e.target.closest('.btn-preparo')) {
            atualizarStatusPedido(idPedido, 'preparo');
        } else if (e.target.closest('.btn-finalizar')) {
            atualizarStatusPedido(idPedido, 'finalizado');
        } else if (e.target.closest('.btn-excluir')) {
            if (confirm('Tem certeza que deseja remover este pedido?')) {
                atualizarStatusPedido(idPedido, 'delete');
            }
        } else if (e.target.closest('.btn-editar-comanda')) {
            toggleEditMode(card, idPedido);
        } else if (e.target.closest('.btn-imprimir')) {
            const todosPedidos = JSON.parse(localStorage.getItem('pedidosTapera')) || [];
            const pedido = todosPedidos.find(p => p.id === idPedido);
            if (pedido) {
                imprimirPedido(pedido);
            }
        }
    });

    // Adiciona animação ao botão de recarregar
    const btnRecarregar = document.getElementById('btn-recarregar');
    btnRecarregar.addEventListener('click', () => {
        const icone = btnRecarregar.querySelector('i');
        icone.classList.add('girando');
        btnRecarregar.disabled = true;

        carregarPedidos(); // Executa a função de carregar pedidos

        setTimeout(() => {
            icone.classList.remove('girando');
            btnRecarregar.disabled = false;
        }, 1000); // Remove a animação após 1 segundo
    });

    document.getElementById('btn-limpar-tudo').addEventListener('click', () => {
        const todosPedidos = JSON.parse(localStorage.getItem('pedidosTapera')) || [];
        if (todosPedidos.length === 0) return;

        if (confirm('ATENÇÃO: Isso moverá TODOS os pedidos para a lixeira. Deseja continuar?')) {
            todosPedidos.forEach((pedido, index) => {
                adicionarALixeira('pedido', { ...pedido, originalIndex: index }, 'Painel de Controle');
            });
            localStorage.removeItem('pedidosTapera');
            carregarPedidos();
        }
    });

    // Botões do modal de impressão
    const modalImprimir = document.getElementById('modal-imprimir-pedido');
    const btnFecharImprimir = document.getElementById('btn-fechar-modal-imprimir');
    const btnImprimir = document.getElementById('btn-imprimir-pedido');

    function fecharModalImprimir() {
        modalImprimir.classList.add('oculto');
        modalImprimir.classList.remove('visivel');
    }

    if (btnFecharImprimir) {
        btnFecharImprimir.addEventListener('click', fecharModalImprimir);
    }

    if (btnImprimir) {
        btnImprimir.addEventListener('click', () => {
            if (!pedidoImpressaoAtual) return;
            // Requer interações do usuário e pode ser bloqueado por pop-ups em navegadores restritivos.
            window.print();
            fecharModalImprimir();
        });
    }

    if (modalImprimir) {
        modalImprimir.addEventListener('click', (e) => {
            if (e.target === modalImprimir) {
                fecharModalImprimir();
            }
        });
    }

    // --- LÓGICA PARA VERIFICAR NOVOS PEDIDOS E TOCAR SOM ---
    function verificarNovosPedidos() {
        const todosPedidos = JSON.parse(localStorage.getItem('pedidosTapera')) || [];
        const pedidosNovosAtuais = todosPedidos.filter(p => p.status === 'novo');

        // Verifica se há algum pedido novo que não conhecíamos
        const chegouPedidoNovo = pedidosNovosAtuais.some(p => !idsPedidosNovosConhecidos.has(p.id));

        if (chegouPedidoNovo) {
            console.log('Novo pedido detectado! Tocando notificação...');
            somNotificacao.play().catch(e => console.error("Erro ao tocar notificação:", e));
            carregarPedidos(); // Recarrega a interface para mostrar o novo pedido
        }
    }

    // Inicia a verificação periódica a cada 10 segundos
    setInterval(verificarNovosPedidos, 10000);

    // Carrega os pedidos ao iniciar
    carregarPedidos();

    // --- LÓGICA GENÉRICA PARA DROPDOWNS ---
    document.querySelectorAll('.dropdown').forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');

        toggle.addEventListener('click', (event) => {
            event.stopPropagation(); // Impede que o clique feche o menu imediatamente

            const wasOpen = dropdown.classList.contains('show');

            // Fecha outros dropdowns abertos
            document.querySelectorAll('.dropdown.show').forEach(openDropdown => {
                if (openDropdown !== dropdown) {
                    openDropdown.classList.remove('show');
                }
            });
            
            // Se o menu já estava aberto, o toggle abaixo vai fechá-lo. Não fazemos mais nada.
            if (wasOpen) {
                dropdown.classList.remove('show');
                return;
            }

            // Reseta a posição do menu antes de exibi-lo para garantir o cálculo correto
            menu.style.left = '0';
            menu.style.right = 'auto';

            // Abre o menu atual para poder medir sua posição
            dropdown.classList.add('show');

            // Lógica para ajustar a posição do menu APÓS ele estar visível
            const menuRect = menu.getBoundingClientRect();
            const screenWidth = window.innerWidth;

            // Se o lado direito do menu estiver fora da tela
            if (menuRect.right > screenWidth - 10) { // 10px de margem de segurança
                menu.style.left = 'auto'; // Remove o alinhamento à esquerda
                menu.style.right = '0';   // Alinha o menu à direita do botão pai
            } else { // Garante que ele volte ao padrão se a tela for redimensionada
                menu.style.left = '0';
                menu.style.right = 'auto';
            }
        });

        // Adiciona funcionalidade de alerta para cada opção
        dropdown.querySelectorAll('.dropdown-menu a').forEach(option => {
            // Adiciona o alerta apenas se o link for '#'
            if (option.getAttribute('href') === '#' && !option.hasAttribute('data-action')) {
                option.addEventListener('click', (e) => {
                    e.preventDefault(); // Impede a navegação para '#'
                    alert(`Funcionalidade "${e.target.textContent.trim()}" em desenvolvimento.`);
                });
            }
            // Links com páginas reais (como "Pdv.html") funcionarão normalmente.
        });
    });

    // Fecha o dropdown se clicar em qualquer lugar fora dele
    document.addEventListener('click', (event) => {
        // Se o clique não foi no botão que abre o menu, fecha todos os menus abertos
        if (!event.target.closest('.dropdown-toggle')) {
            document.querySelectorAll('.dropdown.show').forEach(dropdown => {
                dropdown.classList.remove('show');
            });
        }
    }, true); // Usa a fase de captura para garantir que este evento rode antes dos outros

    // --- LÓGICA DA SIDEBAR DE CONFIGURAÇÕES ---
    btnConfiguracoes.addEventListener('click', () => {
        barraLateralConfiguracoes.classList.add('aberta');
    });

    btnFecharBarraLateral.addEventListener('click', () => {
        barraLateralConfiguracoes.classList.remove('aberta');
    });

    // Fecha a sidebar se clicar fora dela
    window.addEventListener('click', (event) => {
        if (barraLateralConfiguracoes.classList.contains('aberta') && !barraLateralConfiguracoes.contains(event.target) && !btnConfiguracoes.contains(event.target)) {
            barraLateralConfiguracoes.classList.remove('aberta');
        }
    });

    // --- LÓGICA PARA ALTERAR STATUS DA LOJA ---
    const statusLinks = document.querySelectorAll('#close-options-dropdown .dropdown-menu a');
    
    // Elementos do Modal de Agendamento
    const modalAgendamento = document.getElementById('modal-agendar-fechamento');
    const btnFecharModalAgendamento = document.getElementById('btn-fechar-modal-agendamento');
    const btnCancelarAgendamento = document.getElementById('btn-cancelar-agendamento');
    const btnConfirmarAgendamento = document.getElementById('btn-confirmar-agendamento');
    const inputHorarioFechamento = document.getElementById('input-horario-fechamento');
    // Novos seletores
    const diasSemanaCheckboxes = document.querySelectorAll('.dias-semana-container input[name="dia-semana"]');
    const repetirAgendamentoCheckbox = document.getElementById('repetir-agendamento');
    const listaAgendamentosAtivos = document.getElementById('lista-agendamentos-ativos');
    const CHAVE_AGENDAMENTOS = 'casaTaperaAgendamentos';
    const diasDaSemanaNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    // Elementos do Picker Customizado
    const triggerHorario = document.getElementById('trigger-horario-fechamento');
    const displayHorario = document.getElementById('display-horario');
    const modalTimePicker = document.getElementById('modal-custom-time-picker');
    const pickerHoras = document.getElementById('picker-horas');
    const pickerMinutos = document.getElementById('picker-minutos');
    const btnConfirmarPicker = document.getElementById('btn-confirmar-picker');
    const btnCancelarPicker = document.getElementById('btn-cancelar-picker');

    statusLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const action = e.target.closest('a').dataset.action;
            if (!action) return;

            e.preventDefault();

            let newStatus = '';
            let alertMessage = '';

            switch (action) {
                case 'open-all':
                    newStatus = 'aberto';
                    alertMessage = 'Loja aberta para todos os serviços!';
                    break;
                case 'close-delivery':
                    newStatus = 'parcial-delivery-fechado';
                    alertMessage = 'O serviço de delivery foi fechado. Mesas e retiradas continuam funcionando.';
                    break;
                case 'close-table':
                    newStatus = 'parcial-mesa-fechada';
                    alertMessage = 'O serviço de mesas foi fechado. Delivery continua funcionando.';
                    break;
                case 'close-all':
                    newStatus = 'fechado';
                    alertMessage = 'A loja foi completamente fechada.';
                    break;
                case 'schedule-close':
                    abrirModalAgendamento();
                    return; // Retorna para não executar a atualização de status imediata
                default:
                    // Para 'schedule-close' ou outros
                    return; // Não faz nada se a ação não for uma das acima
            }
            localStorage.setItem('casaTaperaStatus', newStatus);
            alert(`Status da loja atualizado: ${alertMessage}`);
        });
    });

    // --- LÓGICA DO MODAL DE AGENDAMENTO ---
    function renderizarAgendamentosAtivos() {
        const agendamentos = JSON.parse(localStorage.getItem(CHAVE_AGENDAMENTOS)) || [];
        listaAgendamentosAtivos.innerHTML = '';
    
        if (agendamentos.length === 0) {
            listaAgendamentosAtivos.innerHTML = '<li>Nenhum agendamento ativo.</li>';
            return;
        }
    
        agendamentos.forEach(ag => {
            const li = document.createElement('li');
            li.dataset.id = ag.id;
            const dias = ag.dias.map(d => diasDaSemanaNomes[d]).join(', ');
            const repeticao = ag.repetir ? ' (Semanal)' : '';
            li.innerHTML = `
                <span>${dias} às ${ag.horario}${repeticao}</span>
                <button class="btn-remover-agendamento" title="Remover agendamento">&times;</button>
            `;
            listaAgendamentosAtivos.appendChild(li);
        });
    }

    function abrirModalAgendamento() {
        renderizarAgendamentosAtivos();
        modalAgendamento.classList.add('visivel');
    }

    function fecharModalAgendamento() {
        modalAgendamento.classList.remove('visivel');
        // Limpa os campos ao fechar
        diasSemanaCheckboxes.forEach(cb => cb.checked = false);
        inputHorarioFechamento.value = '';
        if(displayHorario) displayHorario.textContent = '--:--';
        repetirAgendamentoCheckbox.checked = false;
    }

    if (btnFecharModalAgendamento) btnFecharModalAgendamento.addEventListener('click', fecharModalAgendamento);
    if (btnCancelarAgendamento) btnCancelarAgendamento.addEventListener('click', fecharModalAgendamento);

    if (btnConfirmarAgendamento) btnConfirmarAgendamento.addEventListener('click', () => {
        const horario = inputHorarioFechamento.value;
        const diasSelecionados = Array.from(diasSemanaCheckboxes)
                                      .filter(cb => cb.checked)
                                      .map(cb => parseInt(cb.value));
        const repetir = repetirAgendamentoCheckbox.checked;
    
        if (!horario) {
            alert("Por favor, selecione um horário.");
            return;
        }
        if (diasSelecionados.length === 0) {
            alert("Por favor, selecione pelo menos um dia da semana.");
            return;
        }
    
        const agendamentos = JSON.parse(localStorage.getItem(CHAVE_AGENDAMENTOS)) || [];
        const novoAgendamento = {
            id: `ag-${Date.now()}`,
            dias: diasSelecionados,
            horario: horario,
            repetir: repetir
        };
    
        agendamentos.push(novoAgendamento);
        localStorage.setItem(CHAVE_AGENDAMENTOS, JSON.stringify(agendamentos));
    
        alert(`Fechamento agendado com sucesso!`);
        renderizarAgendamentosAtivos(); // Atualiza a lista
        
        // Limpa os campos para o próximo agendamento
        diasSemanaCheckboxes.forEach(cb => cb.checked = false);
        inputHorarioFechamento.value = '';
        if(displayHorario) displayHorario.textContent = '--:--';
        repetirAgendamentoCheckbox.checked = false;
    });

    // Remover agendamento
    if (listaAgendamentosAtivos) {
        listaAgendamentosAtivos.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remover-agendamento')) {
                const idParaRemover = e.target.closest('li').dataset.id;
                let agendamentos = JSON.parse(localStorage.getItem(CHAVE_AGENDAMENTOS)) || [];
                agendamentos = agendamentos.filter(ag => ag.id !== idParaRemover);
                localStorage.setItem(CHAVE_AGENDAMENTOS, JSON.stringify(agendamentos));
                renderizarAgendamentosAtivos();
            }
        });
    }

    // --- LÓGICA DO PICKER DE HORÁRIO CUSTOMIZADO ---
    let horaSelecionada = '00';
    let minutoSelecionado = '00';

    function popularPicker() {
        pickerHoras.innerHTML = '';
        pickerMinutos.innerHTML = '';

        for (let i = 0; i < 24; i++) {
            const val = String(i).padStart(2, '0');
            const div = document.createElement('div');
            div.className = 'picker-item';
            div.textContent = val;
            div.onclick = () => selecionarItem(pickerHoras, div, 'hora');
            if (val === horaSelecionada) div.classList.add('selected');
            pickerHoras.appendChild(div);
        }

        for (let i = 0; i < 60; i += 5) { // Minutos de 5 em 5 para facilitar
            const val = String(i).padStart(2, '0');
            const div = document.createElement('div');
            div.className = 'picker-item';
            div.textContent = val;
            div.onclick = () => selecionarItem(pickerMinutos, div, 'minuto');
            if (val === minutoSelecionado) div.classList.add('selected');
            pickerMinutos.appendChild(div);
        }
    }

    function selecionarItem(container, item, tipo) {
        container.querySelectorAll('.picker-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (tipo === 'hora') horaSelecionada = item.textContent;
        if (tipo === 'minuto') minutoSelecionado = item.textContent;
    }

    if (triggerHorario) {
        triggerHorario.addEventListener('click', () => {
            // Reseta para hora atual ou 00:00 se vazio
            const agora = new Date();
            horaSelecionada = String(agora.getHours()).padStart(2, '0');
            minutoSelecionado = String(Math.floor(agora.getMinutes() / 5) * 5).padStart(2, '0');
            
            popularPicker();
            modalTimePicker.classList.add('visivel');
            // Scroll para a seleção inicial após renderizar
            setTimeout(() => {
                const selHora = pickerHoras.querySelector('.selected');
                const selMin = pickerMinutos.querySelector('.selected');
                if(selHora) selHora.scrollIntoView({ block: 'center' });
                if(selMin) selMin.scrollIntoView({ block: 'center' });
            }, 100);
        });
    }

    if (btnCancelarPicker) btnCancelarPicker.addEventListener('click', () => modalTimePicker.classList.remove('visivel'));
    if (btnConfirmarPicker) btnConfirmarPicker.addEventListener('click', () => {
        const horarioFinal = `${horaSelecionada}:${minutoSelecionado}`;
        inputHorarioFechamento.value = horarioFinal;
        displayHorario.textContent = horarioFinal;
        modalTimePicker.classList.remove('visivel');
    });

    // --- LÓGICA DE VERIFICAÇÃO DE AGENDAMENTO ---
    setInterval(() => {
        let agendamentos = JSON.parse(localStorage.getItem(CHAVE_AGENDAMENTOS)) || [];
        if (agendamentos.length === 0) return;
    
        const agora = new Date();
        const diaAtual = agora.getDay();
        const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
        
        let agendamentoAcionado = false;
    
        const agendamentosAtualizados = agendamentos.filter(ag => {
            // Verifica se o agendamento já foi acionado neste ciclo
            if (agendamentoAcionado) return true;
    
            if (ag.dias.includes(diaAtual) && ag.horario === horaAtual) {
                localStorage.setItem('casaTaperaStatus', 'fechado');
                alert(`A loja foi fechada automaticamente conforme agendamento para ${diasDaSemanaNomes[diaAtual]} às ${ag.horario}.`);
                agendamentoAcionado = true;
                
                // Se o agendamento repete, mantém ele na lista. Se não, ele será filtrado (retorna false).
                return ag.repetir;
            }
            // Mantém agendamentos que não correspondem ao horário atual
            return true;
        });
    
        // Se um agendamento foi acionado e removido, atualiza o localStorage
        if (agendamentoAcionado && agendamentos.length !== agendamentosAtualizados.length) {
            localStorage.setItem(CHAVE_AGENDAMENTOS, JSON.stringify(agendamentosAtualizados));
            // Se o modal estiver aberto, atualiza a lista
            if (modalAgendamento.classList.contains('visivel')) {
                renderizarAgendamentosAtivos();
            }
        }
    });

    // --- LÓGICA DE LOGOUT ---
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            // Limpa o indicador de login da sessão
            sessionStorage.removeItem('isLoggedIn');
            // Redireciona para a página de login
            // CORREÇÃO: Como PainelDeControle.html e Login.html estão no mesmo diretório 'corpo', o caminho é direto.
            window.location.href = 'Login.html';
        });
    }

    // --- LÓGICA DA LIXEIRA GERAL NA SIDEBAR ---
    const btnAbrirLixeira = document.getElementById('btn-abrir-lixeira');
    const containerLixeira = document.getElementById('lixeira-sidebar-container');
    const listaLixeira = document.getElementById('lista-lixeira-sidebar');

    function renderizarLixeiraSidebar() {
        const lixeira = JSON.parse(localStorage.getItem('casaTaperaLixeira')) || [];
        if (!listaLixeira) return;
        
        listaLixeira.innerHTML = '';

        if (lixeira.length === 0) {
            listaLixeira.innerHTML = '<p class="lixeira-vazia-msg">Nenhum item excluído recentemente.</p>';
            return;
        }

        // Exibe apenas os 5 itens mais recentes na sidebar para não sobrecarregar
        lixeira.slice(0, 5).forEach(item => {
            const div = document.createElement('div');
            div.className = 'item-lixeira-sidebar';
            div.dataset.id = item.id;
            
            const valorReal = item.dado.valorTotal || item.dado.valor || item.dado.valorFinal || (item.dado.data ? item.dado.data.total : 0);
            const valorFormatado = valorReal ? ` - ${parseFloat(valorReal).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}` : '';
            const nomeExibicao = item.tipo === 'pesquisa' ? item.dado.termo : (item.tipo === 'mesa' ? `Mesa ${item.dado.id}` : (item.tipo === 'cupom' ? item.dado.codigo : (item.tipo === 'pedido' ? `Pedido #${item.id.substring(7)}` : (item.tipo === 'nota' ? (item.dado.numero && item.dado.numero !== '000' ? `NF-e #${item.dado.numero}` : (item.dado.descricao || item.dado.nome)) + valorFormatado : item.dado.nome))));
            const tipoLabel = item.tipo === 'categoria' ? 'Container' : (item.tipo === 'pesquisa' ? 'Pesquisa' : (item.tipo === 'mesa' ? 'Mesa' : (item.tipo === 'cupom' ? 'Cupom' : (item.tipo === 'pedido' ? 'Pedido' : (item.tipo === 'nota' ? 'Nota Fiscal' : 'Produto')))));

            const botaoVerItens = (item.tipo === 'pedido' || item.tipo === 'categoria' || item.tipo === 'nota' || item.tipo === 'mesa') ? '<button class="btn-lixeira-ver-itens" title="Ver Itens"><i class="fas fa-list"></i> Itens</button>' : '';

            div.innerHTML = `
                <div class="item-lixeira-header">
                    <span class="origem-badge">${item.origem}</span>
                    <span style="color: #666; font-size: 0.8em;">${tipoLabel}</span>
                </div>
                <h5>${nomeExibicao}</h5>
                ${(item.tipo === 'nota' || item.tipo === 'pedido' || item.tipo === 'mesa') ? `<p class="nota-valor-total-sidebar" style="color: var(--color-yellow); margin-bottom: 5px;">Valor Total Gasto: ${(parseFloat(valorReal) || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>` : ''}
                ${item.tipo === 'nota' ? `
                    <div style="margin-bottom: 8px; font-size: 0.75em; color: #777; border-left: 1px solid #444; padding-left: 8px;">
                        <p>${item.dado.categoria || item.dado.origemAba || 'Financeiro'}</p>
                    </div>` : ''}
                ${item.tipo === 'pedido' ? `
                    <div style="margin-bottom: 8px; font-size: 0.75em; color: #777; border-left: 1px solid var(--color-orange); padding-left: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px;">
                            <p style="margin: 0;"><strong>Hora do Pedido:</strong></p>
                            <span style="font-size: 1.1em; font-family: 'Bebas Neue', sans-serif; background: rgba(240, 100, 0, 0.1); padding: 3px 8px; border-radius: 5px; color: var(--color-orange); font-weight: bold;">
                                ${(() => {
                                    const d = item.dado.data ? new Date(item.dado.data) : new Date(parseInt(item.dado.id.split('-')[1]));
                                    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                })()}
                            </span>
                        </div>
                        <p><strong>Tipo:</strong> ${item.dado.metodoEntrega === 'delivery' ? 'Entrega' : (item.dado.metodoEntrega === 'mesa' ? 'Mesa' : 'Retirada')}</p>
                        ${item.dado.metodoEntrega === 'delivery' ? `<p><strong>Endereço:</strong> ${item.dado.endereco || 'N/A'}</p>` : ''}
                    </div>` : ''}
                <p class="msg-reposicao">Excluído de: <strong>${item.origem}</strong>. Deseja repor?</p>
                <div class="acoes-lixeira-sidebar">
                    <button class="btn-lixeira-restaurar"><i class="fas fa-undo"></i> Restaurar</button>
                    ${botaoVerItens}
                    <button class="btn-lixeira-excluir" title="Excluir Permanentemente"><i class="fas fa-trash-alt"></i></button>
                </div>
                <div class="detalhes-pedido-lixeira-sidebar" style="display: none; margin-top: 10px; font-size: 0.85em; background: #222; padding: 8px; border-radius: 4px; color: #ccc;"></div>
            `;
            listaLixeira.appendChild(div);
        });
    }

    if (btnAbrirLixeira) {
        btnAbrirLixeira.addEventListener('click', (e) => {
            e.preventDefault();
            renderizarLixeiraSidebar();
            containerLixeira.classList.toggle('visivel');
        });
    }

    if (listaLixeira) {
        listaLixeira.addEventListener('click', (e) => {
            const itemDiv = e.target.closest('.item-lixeira-sidebar');
            if (!itemDiv) return;
            
            const id = itemDiv.dataset.id;
            const lixeira = JSON.parse(localStorage.getItem('casaTaperaLixeira')) || [];
            const itemLixeira = lixeira.find(it => it.id === id);

            if (e.target.closest('.btn-lixeira-ver-itens')) {
                const detalhesDiv = itemDiv.querySelector('.detalhes-pedido-lixeira-sidebar');
                const isVisible = detalhesDiv.style.display === 'block';

                if (!isVisible) {
                    let listaHtml = '<ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; width: 100%; gap: 4px;">';
                    
                    if (itemLixeira.tipo === 'pedido' || itemLixeira.tipo === 'mesa' || 
                       (itemLixeira.tipo === 'nota' && (itemLixeira.dado.items || itemLixeira.dado.itens))) {
                        const itensRaw = itemLixeira.tipo === 'pedido' ? itemLixeira.dado.items : 
                                       (itemLixeira.tipo === 'mesa' ? itemLixeira.dado.data.itens : (itemLixeira.dado.items || itemLixeira.dado.itens));
                        
                        if (itensRaw && !Array.isArray(itensRaw)) {
                            const nomesOrdenados = Object.keys(itensRaw || {}).sort();
                            nomesOrdenados.forEach(nome => {
                                const item = itensRaw[nome];
                                const valorTotalItem = (item.price || 0) * (item.quantity || 1);
                                listaHtml += `<li style="border-bottom: 1px solid #333; padding: 4px 0; display: flex; justify-content: space-between;">
                                    <span>${item.quantity || 1}x ${nome}</span>
                                    <span style="color: #888;">${valorTotalItem.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span></li>`;
                            });
                        } else if (Array.isArray(itensRaw)) {
                            itensRaw.forEach(it => {
                                const valor = parseFloat(it.preco || it.price) || 0;
                                const qtd = it.qtd || it.quantity || 1;
                                listaHtml += `<li style="border-bottom: 1px solid #333; padding: 4px 0; display: flex; justify-content: space-between;">
                                    <span>${qtd}x ${it.nome}</span>
                                    <span style="color: #888;">${(valor * qtd).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span></li>`;
                            });
                        }
                    } else if (itemLixeira.tipo === 'categoria' || itemLixeira.tipo === 'nota') {
                        const itens = itemLixeira.dado.itens || itemLixeira.dado.items;
                        if (itens && Array.isArray(itens)) {
                            const itensOrdenados = [...itens].sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
                            itensOrdenados.forEach(it => {
                                const qtd = it.qtd || it.quantity || 1;
                                const valorItem = parseFloat(it.preco || it.price) || 0;

                                listaHtml += `<li style="border-bottom: 1px solid #333; padding: 4px 0; display: flex; justify-content: space-between; align-items: center;">
                                    <span>${qtd}x ${it.nome}</span>
                                    <span style="color: #888;">${valorItem.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span></li>`;
                            });
                        } else {
                            const textoBase = itemLixeira.dado.descricao || itemLixeira.dado.nome || "Lançamento Fiscal";
                            const valorNota = itemLixeira.dado.valorTotal || itemLixeira.dado.valor || 0;

                            if (textoBase.includes('\n')) {
                                const linhas = textoBase.split('\n');
                                linhas.forEach((linha, idx) => {
                                    const itemTexto = linha.trim().replace(/^- /, '');
                                    if (!itemTexto) return;
                                    listaHtml += `<li style="border-bottom: 1px solid #333; padding: 4px 0; display: flex; justify-content: space-between; align-items: center;">
                                        <span>${itemTexto.includes('x ') ? itemTexto : `1x ${itemTexto}`}</span>
                                        <span style="color: #888;">${idx === 0 ? parseFloat(valorNota).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) : '-'}</span>
                                    </li>`;
                                });
                            } else {
                                listaHtml += `<li style="border-bottom: 1px solid #333; padding: 4px 0; display: flex; justify-content: space-between; align-items: center;">
                                    <span>1x ${textoBase}</span>
                                    <span style="color: #888;">${parseFloat(valorNota).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                                </li>`;
                            }
                        }
                    }
                    
                    // Adiciona o valor total na sidebar para Notas Fiscais, Pedidos e Mesas
                    const possuiValor = itemLixeira.tipo === 'nota' || itemLixeira.tipo === 'pedido' || itemLixeira.tipo === 'mesa';
                    if (possuiValor) {
                        const valorMesa = itemLixeira.tipo === 'mesa' && itemLixeira.dado.data ? itemLixeira.dado.data.total : 0;
                        const total = parseFloat(itemLixeira.dado.valorTotal || itemLixeira.dado.valor || itemLixeira.dado.valorFinal || valorMesa || 0);
                        listaHtml += `<li style="padding: 10px 8px; margin-top: 6px; border-top: 2px solid var(--color-orange); border-bottom: 2px solid var(--color-orange); display: flex; justify-content: space-between; font-weight: bold; color: white; background: rgba(240, 100, 0, 0.1); font-family: 'Bebas Neue', sans-serif; font-size: 1.2em; border-radius: 4px;">
                            <span>VALOR TOTAL GASTO:</span>
                            <span style="color: var(--color-yellow);">${total.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                        </li>`;
                    }

                    listaHtml += '</ul>';
                    detalhesDiv.innerHTML = listaHtml;
                    detalhesDiv.style.display = 'block';
                    e.target.closest('.btn-lixeira-ver-itens').innerHTML = '<i class="fas fa-times"></i> Fechar';
                } else {
                    detalhesDiv.style.display = 'none';
                    e.target.closest('.btn-lixeira-ver-itens').innerHTML = '<i class="fas fa-list"></i> Itens';
                }
            }

            if (e.target.closest('.btn-lixeira-restaurar')) {
                restaurarItemDaLixeira(itemLixeira);
                const novaLixeira = lixeira.filter(it => it.id !== id);
                localStorage.setItem('casaTaperaLixeira', JSON.stringify(novaLixeira));
                
                // Notifica o sistema que o cardápio mudou para sincronizar abas abertas
                window.dispatchEvent(new CustomEvent('cardapioAtualizado'));
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'cardapioTaperaPrecos',
                    newValue: localStorage.getItem('cardapioTaperaPrecos')
                }));
                
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'notasFiscaisTapera',
                    newValue: localStorage.getItem('notasFiscaisTapera')
                }));
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'casaTaperaHistoricoFinanceiro',
                    newValue: localStorage.getItem('casaTaperaHistoricoFinanceiro')
                }));

                // Se estiver na página inicial do painel, recarrega a grid de pedidos
                if (typeof carregarPedidos === 'function') carregarPedidos();

                renderizarLixeiraSidebar();
            }

            if (e.target.closest('.btn-lixeira-excluir')) {
                if (confirm('Esta ação é irreversível. Deseja excluir permanentemente?')) {
                    const novaLixeira = lixeira.filter(it => it.id !== id);
                    localStorage.setItem('casaTaperaLixeira', JSON.stringify(novaLixeira));
                    renderizarLixeiraSidebar();
                }
            }
        });
    }

    function restaurarItemDaLixeira(itemLixeira) {
        const { tipo, dado } = itemLixeira;
        const precos = JSON.parse(localStorage.getItem('cardapioTaperaPrecos')) || {};
        const ordem = JSON.parse(localStorage.getItem('cardapioTaperaOrdemCategorias')) || [];

        if (tipo === 'item') {
            precos[dado.id] = { ...dado, preco: parseFloat(dado.preco), desativado: false, ordem: 999 };
            if (!ordem.includes(dado.categoria)) ordem.push(dado.categoria);
            
            localStorage.setItem('cardapioTaperaPrecos', JSON.stringify(precos));
            localStorage.setItem('cardapioTaperaOrdemCategorias', JSON.stringify(ordem));
            alert(`Item "${dado.nome}" restaurado com sucesso!`);
        } else if (tipo === 'categoria') {
            if (dado.secao === 'Estoque') {
                const estoque = JSON.parse(localStorage.getItem('casaTaperaEstoque')) || {};
                const novosItens = {};
                if (Array.isArray(dado.itens)) {
                    dado.itens.forEach(it => {
                        const id = it.id || it.nome.toLowerCase().replace(/\s+/g, '-');
                        novosItens[id] = it;
                    });
                }
                const chaves = Object.keys(estoque);
                const novoEstoque = {};
                if (dado.originalIndex !== undefined && dado.originalIndex <= chaves.length) {
                    chaves.splice(dado.originalIndex, 0, dado.nome);
                    chaves.forEach(k => { novoEstoque[k] = (k === dado.nome) ? novosItens : estoque[k]; });
                } else {
                    Object.assign(novoEstoque, estoque);
                    novoEstoque[dado.nome] = novosItens;
                }
                localStorage.setItem('casaTaperaEstoque', JSON.stringify(novoEstoque));
                alert(`Container de estoque "${dado.nome}" restaurado com sucesso!`);
            } else {
                if (!ordem.includes(dado.nome)) {
                    if (dado.originalIndex !== undefined && dado.originalIndex <= ordem.length) {
                        ordem.splice(dado.originalIndex, 0, dado.nome);
                    } else {
                        ordem.push(dado.nome);
                    }
                }
                dado.itens.forEach(it => {
                    precos[it.id] = { ...it, preco: parseFloat(it.preco), categoria: dado.nome, desativado: false, ordem: it.ordem !== undefined ? it.ordem : 999 };
                });
                localStorage.setItem('cardapioTaperaPrecos', JSON.stringify(precos));
                localStorage.setItem('cardapioTaperaOrdemCategorias', JSON.stringify(ordem));
                alert(`Container "${dado.nome}" restaurado com sucesso!`);
            }
            
            if (dado.secao) {
                const secoesMap = JSON.parse(localStorage.getItem('cardapioTaperaSecoesMap')) || {};
                secoesMap[dado.nome] = dado.secao;
                localStorage.setItem('cardapioTaperaSecoesMap', JSON.stringify(secoesMap));
            }
        } else if (tipo === 'pesquisa') {
            let historico = JSON.parse(localStorage.getItem('casaTaperaHistoricoPesquisa')) || [];
            if (!historico.includes(dado.termo)) {
                if (dado.originalIndex !== undefined && dado.originalIndex <= historico.length) {
                    historico.splice(dado.originalIndex, 0, dado.termo);
                } else {
                    historico.unshift(dado.termo);
                }
                localStorage.setItem('casaTaperaHistoricoPesquisa', JSON.stringify(historico));
            }
            alert(`Pesquisa "${dado.termo}" restaurada ao histórico!`);
        } else if (tipo === 'mesa') {
            const mesas = JSON.parse(localStorage.getItem('casaTaperaMesasData')) || {};
            const keys = Object.keys(mesas);
            const novoMapa = {};
            
            if (dado.originalIndex !== undefined && dado.originalIndex <= keys.length) {
                // Reinsere a mesa na ordem original das chaves na sidebar
                keys.splice(dado.originalIndex, 0, dado.id);
                keys.forEach(k => {
                    novoMapa[k] = (k === dado.id) ? dado.data : mesas[k];
                });
                localStorage.setItem('casaTaperaMesasData', JSON.stringify(novoMapa));
            } else {
                // Fallback padrão
                mesas[dado.id] = dado.id;
                localStorage.setItem('casaTaperaMesasData', JSON.stringify(mesas));
            }
            alert(`Mesa ${dado.id} restaurada com sucesso!`);
        } else if (tipo === 'cupom') {
            const cupons = JSON.parse(localStorage.getItem('casaTaperaCupons')) || [];
            if (!cupons.some(c => c.codigo === dado.codigo)) {
                if (dado.originalIndex !== undefined && dado.originalIndex <= cupons.length) {
                    cupons.splice(dado.originalIndex, 0, dado);
                } else {
                    cupons.push(dado);
                }
                localStorage.setItem('casaTaperaCupons', JSON.stringify(cupons));
                alert(`Cupom "${dado.codigo}" restaurado com sucesso!`);
            } else {
                alert(`Erro: Já existe um cupom ativo com o código "${dado.codigo}".`);
            }
        } else if (tipo === 'conta') { // Added missing 'conta' restore logic
            const clientes = JSON.parse(localStorage.getItem('clientesCadastradosTapera')) || [];
            if (!clientes.some(c => c.id === dado.id)) {
                if (dado.originalIndex !== undefined) {
                    clientes.splice(dado.originalIndex, 0, dado);
                } else {
                    clientes.push(dado);
                }
                localStorage.setItem('clientesCadastradosTapera', JSON.stringify(clientes));
                alert(`Cadastro de "${dado.nome}" restaurado com sucesso!`);
            }
        } else if (tipo === 'pedido') {
            const pedidos = JSON.parse(localStorage.getItem('pedidosTapera')) || [];
            if (!pedidos.some(p => p.id === dado.id)) {
                // Reinsere na posição original para manter a ordem cronológica do painel
                if (dado.originalIndex !== undefined) {
                    pedidos.splice(dado.originalIndex, 0, dado);
                } else {
                    pedidos.push(dado);
                }
                localStorage.setItem('pedidosTapera', JSON.stringify(pedidos));
                alert(`Pedido #${dado.id.substring(7)} restaurado com sucesso!`);
            }
        } else if (tipo === 'nota') {
            const CHAVE_HISTORICO = 'casaTaperaHistoricoFinanceiro';
            const CHAVE_NOTAS = 'casaTaperaNotasFiscais';
            let historico = JSON.parse(localStorage.getItem(CHAVE_HISTORICO)) || [];
            let notas = JSON.parse(localStorage.getItem(CHAVE_NOTAS)) || [];
            
            // Recupera o objeto completo para não perder metadados fiscais e remove o estado de cancelamento
            const transacaoRestaurada = {
                ...dado,
                cancelada: false,
                status: 'emitida'
            };

            // Atualiza ou Adiciona no Histórico Financeiro
            const idxHist = historico.findIndex(n => n.id === dado.id);
            if (idxHist > -1) {
                historico[idxHist] = transacaoRestaurada;
            } else {
                historico.push(transacaoRestaurada);
            }
            historico.sort((a, b) => new Date(b.hora) - new Date(a.hora));
            localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(historico));

            // Atualiza ou Adiciona no Histórico de Notas Emitidas (NF-e)
            const idxNotas = notas.findIndex(n => n.id === dado.id);
            if (idxNotas > -1) {
                notas[idxNotas] = transacaoRestaurada;
            } else {
                notas.push(transacaoRestaurada);
            }
            notas.sort((a, b) => new Date(b.hora) - new Date(a.hora));
            localStorage.setItem(CHAVE_NOTAS, JSON.stringify(notas));
            
            alert(`Nota Fiscal restaurada com sucesso!`);
        }
    }
});