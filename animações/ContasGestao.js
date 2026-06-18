document.addEventListener('DOMContentLoaded', () => {
    const botoesAba = document.querySelectorAll('.btn-aba');
    const conteudosAba = document.querySelectorAll('.aba-conteudo');
    let graficoPizza = null; // Variável para armazenar a instância do gráfico
    const modalPagamento = document.getElementById('modal-pagamento');
    let operacaoPendente = null; // Guarda a operação a ser confirmada

    botoesAba.forEach(botao => {
        botao.addEventListener('click', () => {
            // Remove a classe 'active' de todos os botões e conteúdos
            botoesAba.forEach(b => b.classList.remove('active'));
            conteudosAba.forEach(c => c.classList.remove('active'));
            // Limpa a operação pendente ao trocar de aba
            operacaoPendente = null;
            modalPagamento.classList.remove('visivel');


            // Adiciona a classe 'active' ao botão clicado e ao conteúdo correspondente
            botao.classList.add('active');
            const idAba = `aba-${botao.dataset.aba}`;
            document.getElementById(idAba).classList.add('active');

            // Renderiza o gráfico apenas se a aba "Contas a Pagar" for selecionada
            if (botao.dataset.aba === 'pagar') {
                renderizarGraficoPizza();
            }
        });
    });

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

    // --- NOVA FUNÇÃO DE INTEGRAÇÃO COM O CAIXA ---
    function registrarTransacaoFinanceira(tipo, valor, descricao, metodoPagamento) {
        const CHAVE_HISTORICO_FINANCEIRO = 'casaTaperaHistoricoFinanceiro';
        try {
            const historico = JSON.parse(localStorage.getItem(CHAVE_HISTORICO_FINANCEIRO)) || [];
            const novaTransacao = {
                id: `trans-conta-${Date.now()}`,
                tipo: tipo, // 'entrada' ou 'saida'
                descricao: `${descricao} (${metodoPagamento})`,
                valor: valor,
                hora: new Date().toISOString()
            };
            historico.unshift(novaTransacao);
            localStorage.setItem(CHAVE_HISTORICO_FINANCEIRO, JSON.stringify(historico));
            alert(`Operação registrada no painel financeiro.`);

        } catch (error) { console.error("Erro ao registrar transação no caixa:", error); }
    }

    // Lógica para FINALIZAR a operação após escolher o método de pagamento
    modalPagamento.addEventListener('click', (e) => {
        const metodoBtn = e.target.closest('.btn-pagamento-modal');
        if (metodoBtn && operacaoPendente) {
            const metodoPagamento = metodoBtn.dataset.metodo;
            const { linha, abaAtiva, valor, descricao } = operacaoPendente;

            const tipoTransacao = (abaAtiva === 'pagar') ? 'saida' : 'entrada';
            const descCompleta = (abaAtiva === 'pagar') ? `Pagamento: ${descricao}` : `Recebimento: ${descricao}`;

            registrarTransacaoFinanceira(tipoTransacao, valor, descCompleta, metodoPagamento);

            // Atualiza a UI da tabela
            const statusSpan = linha.querySelector('.status-conta');
            statusSpan.classList.remove('status-pendente', 'status-atrasado');
            statusSpan.classList.add('status-pago');
            statusSpan.textContent = (abaAtiva === 'pagar') ? 'Pago' : 'Recebido';
            linha.querySelectorAll('.btn-acao-conta').forEach(b => b.disabled = true);

            if (abaAtiva === 'pagar') {
                renderizarGraficoPizza();
            }
            atualizarCardsResumo();
            
            operacaoPendente = null;
            modalPagamento.classList.remove('visivel');
        }

        if (e.target === modalPagamento || e.target.closest('.btn-fechar-modal') || e.target.id === 'btn-cancelar-pagamento-modal') {
            operacaoPendente = null;
            modalPagamento.classList.remove('visivel');
        };
    });



    // --- LÓGICA DO MODAL ---
    const modalConta = document.getElementById('modal-conta');
    const formConta = document.getElementById('form-conta');
    const modalTitulo = document.getElementById('modal-conta-titulo');
    const btnSalvarConta = document.getElementById('btn-salvar-conta');

    // --- SELETORES DO RELATÓRIO DE MOTOBOY ---
    const secaoRelatorioMotoboy = document.querySelector('.secao-relatorio-motoboy');
    const filtrosMotoboy = secaoRelatorioMotoboy.querySelector('.filtros-container');
    const modalMotoboy = document.getElementById('modal-motoboy-detalhes');
    const tabelaCorpoMotoboy = secaoRelatorioMotoboy.querySelector('.tabela-relatorio tbody');
    const totalEntregasEl = document.getElementById('total-entregas-motoboy');
    const valorTotalTaxasEl = document.getElementById('valor-total-taxas-motoboy');

    // --- FUNÇÕES AUXILIARES DE FORMATAÇÃO E CÁLCULO ---
    function formatarMoeda(valor) {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function parseMoeda(texto) {
        if (!texto) return 0;
        // Remove 'R$', espaços, troca o separador de milhar '.' por nada e a vírgula de decimal por '.'
        return parseFloat(texto.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
    }

    function atualizarCardsResumo() {
        const totalPagarEl = document.getElementById('total-a-pagar');
        const totalReceberEl = document.getElementById('total-a-receber');
        const totalFiadosEl = document.getElementById('total-fiados');

        // Função interna para calcular o total de uma tabela
        const calcularTotal = (tabelaSelector, statusExcluir) => {
            let total = 0;
            const tabela = document.getElementById(tabelaSelector);
            if (!tabela) return 0;

            tabela.querySelectorAll('tbody tr').forEach(linha => {
                const status = linha.querySelector('.status-conta')?.textContent.trim();
                if (status !== statusExcluir) {
                    const valorTexto = linha.querySelector('[data-label="Valor"]')?.textContent;
                    total += parseMoeda(valorTexto);
                }
            });
            return total;
        };

        // Calcular e atualizar totais
        totalPagarEl.textContent = formatarMoeda(calcularTotal('tabela-contas-pagar', 'Pago'));
        totalReceberEl.textContent = formatarMoeda(calcularTotal('tabela-contas-receber', 'Recebido'));
        totalFiadosEl.textContent = formatarMoeda(calcularTotal('tabela-contas-fiados', 'Recebido'));
    }

    // Abrir modal para ADICIONAR
    document.querySelectorAll('.btn-adicionar').forEach(btn => {
        btn.addEventListener('click', () => {
            const abaAtiva = document.querySelector('.btn-aba.active').dataset.aba;
            formConta.reset();
            document.getElementById('conta-id').value = ''; // Limpa o ID para modo de adição
            
            configurarModalParaAba(abaAtiva, 'Adicionar');
            modalConta.classList.add('visivel');
        });
    });

    // Abrir modal para EDITAR
    document.querySelector('#conteudo-abas').addEventListener('click', (e) => {
        const btnEditar = e.target.closest('.btn-editar');
        const btnPagar = e.target.closest('.btn-pagar');
        const btnRemover = e.target.closest('.btn-remover');

        if (btnRemover) {
            const linha = btnRemover.closest('tr');
            const descricao = linha.querySelector('[data-label="Descrição"], [data-label="Cliente"]')?.textContent;
            const valorTexto = linha.querySelector('.valor-conta, [data-label="Valor"]')?.textContent;
            
            if (confirm(`Mover a conta "${descricao}" para a lixeira?`)) {
                const abaAtiva = document.querySelector('.btn-aba.active').dataset.aba;
                
                // Envia para a lixeira antes de remover da tela
                const dadoLixeira = {
                    id: linha.dataset.id,
                    numero: (linha.dataset.id || '0').substring(0, 5),
                    nome: descricao,
                    valorTotal: parseMoeda(valorTexto),
                    origemAba: abaAtiva
                };

                adicionarALixeira('nota', dadoLixeira, 'Controle Fiscal');
                linha.remove();
                alert('Conta movida para a lixeira.');
                
                atualizarCardsResumo();
                if (abaAtiva === 'pagar') {
                    renderizarGraficoPizza();
                }
            }
        }

        if (btnPagar) {
            const linha = btnPagar.closest('tr');
            const statusSpan = linha.querySelector('.status-conta');
            if (statusSpan.classList.contains('status-pago') || statusSpan.textContent === 'Recebido') {
                return;
            }

            const abaAtiva = document.querySelector('.btn-aba.active').dataset.aba;
            const valorTexto = linha.querySelector('.valor-conta, [data-label="Valor"]').textContent;
            const valor = parseMoeda(valorTexto);
            const descricao = linha.querySelector('[data-label="Descrição"], [data-label="Cliente"]').textContent;
            
            operacaoPendente = { linha, abaAtiva, valor, descricao };

            document.getElementById('modal-pagamento-descricao').textContent = `Como a conta "${descricao}" de ${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} foi liquidada?`;
            modalPagamento.classList.add('visivel');
        }

        if (btnEditar) {
            const btn = btnEditar;
            const linha = btn.closest('tr');
            const id = linha.dataset.id;
            const abaAtiva = document.querySelector('.btn-aba.active').dataset.aba;

            // Preenche o formulário com os dados da linha
            document.getElementById('conta-id').value = id;
            if (abaAtiva === 'fiados') {
                document.getElementById('conta-cliente').value = linha.querySelector('[data-label="Cliente"]').textContent;
                document.getElementById('conta-descricao').value = 'Fiado'; // Fiado não tem descrição editável
            } else {
                document.getElementById('conta-descricao').value = linha.querySelector('[data-label="Descrição"]').textContent;
            }
            if (abaAtiva === 'pagar') {
                document.getElementById('conta-categoria').value = linha.querySelector('[data-label="Categoria"]').textContent;
            }

            const statusSpan = linha.querySelector('.status-conta');
            let statusValue = 'pendente'; // default
            if (statusSpan.classList.contains('status-pago')) statusValue = 'pago';
            else if (statusSpan.classList.contains('status-atrasado')) statusValue = 'atrasado';
            
            document.getElementById('conta-status').value = statusValue;

            const valorTexto = linha.querySelector('[data-label="Valor"]').textContent;
            document.getElementById('conta-valor').value = parseFloat(valorTexto).toFixed(2);
            
            const dataTexto = linha.querySelector('[data-label="Vencimento"], [data-label="Data"]').textContent;
            const [dia, mes, ano] = dataTexto.split('/');
            document.getElementById('conta-vencimento').value = `${ano}-${mes}-${dia}`;

            configurarModalParaAba(abaAtiva, 'Editar');
            modalConta.classList.add('visivel');
        }
    });

    function configurarModalParaAba(aba, modo) {
        const campoCliente = document.getElementById('campo-cliente');
        const campoCategoria = document.getElementById('campo-categoria');
        const campoStatus = document.getElementById('campo-status');
        const campoDescricao = document.getElementById('conta-descricao');

        // Habilita todos os campos por padrão antes de configurar
        formConta.querySelectorAll('input, select').forEach(el => el.disabled = false);
        btnSalvarConta.style.display = 'block';

        // Esconde todos os campos específicos por padrão
        campoCliente.style.display = 'none';
        campoStatus.style.display = 'block'; // Visível por padrão
        campoCategoria.style.display = 'none';
        campoDescricao.readOnly = false;
        // Re-habilita a descrição caso tenha sido desabilitada no modo "Fiado"
        campoDescricao.disabled = false;
        campoDescricao.style.cursor = 'auto';
        campoDescricao.style.backgroundColor = '#333';

        let titulo = '';
        if (aba === 'pagar') {
            titulo = `${modo} Conta a Pagar`;
            campoCategoria.style.display = 'block';
        } else if (aba === 'receber') {
            titulo = `${modo} Conta a Receber`;
        } else if (aba === 'fiados') {
            titulo = `${modo} Fiado`;
            campoStatus.style.display = 'none'; // Esconde o status para fiado
            campoCliente.style.display = 'block';
            if (modo === 'Editar') {
                // Desabilita todos os campos para fiado, exceto o status
                formConta.querySelectorAll('input').forEach(el => {
                    if(el.type !== 'hidden') el.disabled = true;
                });
                campoDescricao.style.cursor = 'not-allowed';
                campoDescricao.style.backgroundColor = '#2a2a2a';
                // Esconde o botão de salvar
                btnSalvarConta.style.display = 'none';
            }
        }
        modalTitulo.textContent = titulo;
        btnSalvarConta.textContent = modo === 'Adicionar' ? 'Adicionar' : 'Salvar Alterações';
        document.getElementById('conta-tipo').value = aba;
    }

    function adicionarNovaLinha(dados, tipo) {
        const tabelaBody = document.querySelector(`#aba-${tipo} .tabela-contas tbody`);
        if (!tabelaBody) {
            console.error(`Tabela para a aba "${tipo}" não encontrada.`);
            return;
        }

        const tr = document.createElement('tr');
        tr.dataset.id = dados.id;

        const data = new Date(dados.vencimento + 'T00:00:00');
        const dataFormatada = data.toLocaleDateString('pt-BR');
        const valorFormatado = dados.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        let statusTexto = dados.status.charAt(0).toUpperCase() + dados.status.slice(1);
        if (tipo === 'fiados' && dados.status === 'pendente') {
            statusTexto = 'Aberto';
        }

        let htmlInterno = '';
        if (tipo === 'pagar') {
            htmlInterno = `
                <td data-label="Vencimento">${dataFormatada}</td>
                <td data-label="Descrição">${dados.descricao}</td>
                <td data-label="Categoria">${dados.categoria}</td>
                <td data-label="Valor" class="valor-conta">${valorFormatado}</td>
                <td data-label="Status"><span class="status-conta status-${dados.status}">${statusTexto}</span></td>
                <td data-label="Ações" class="coluna-acoes">
                    <button class="btn-acao-conta btn-pagar" title="Marcar como Paga"><i class="fas fa-check"></i></button>
                    <button class="btn-acao-conta btn-editar" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-acao-conta btn-remover" title="Remover"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
        } else if (tipo === 'receber') {
            htmlInterno = `
                <td data-label="Vencimento">${dataFormatada}</td>
                <td data-label="Descrição">${dados.descricao}</td>
                <td data-label="Valor" class="valor-conta">${valorFormatado}</td>
                <td data-label="Status"><span class="status-conta status-${dados.status}">${statusTexto}</span></td>
                <td data-label="Ações" class="coluna-acoes">
                    <button class="btn-acao-conta btn-pagar" title="Marcar como Recebido"><i class="fas fa-check"></i></button>
                    <button class="btn-acao-conta btn-editar" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-acao-conta btn-remover" title="Remover"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
        } else if (tipo === 'fiados') {
            htmlInterno = `
                <td data-label="Cliente">${dados.cliente}</td>
                <td data-label="Data">${dataFormatada}</td>
                <td data-label="Valor" class="valor-conta">${valorFormatado}</td>
                <td data-label="Status"><span class="status-conta status-pendente">${statusTexto}</span></td>
                <td data-label="Ações" class="coluna-acoes">
                    <button class="btn-acao-conta btn-pagar" title="Marcar como Recebido"><i class="fas fa-check"></i></button>
                    <button class="btn-acao-conta btn-remover" title="Remover"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
        }

        tr.innerHTML = htmlInterno;
        tabelaBody.prepend(tr);
    }

    // Fechar modal
    modalConta.querySelector('.btn-fechar-modal').addEventListener('click', () => modalConta.classList.remove('visivel'));
    modalConta.addEventListener('click', (e) => {
        if (e.target === modalConta) modalConta.classList.remove('visivel');
    });

    // Salvar dados do modal (simulação)
    formConta.addEventListener('submit', (e) => {
        e.preventDefault();
        const contaId = document.getElementById('conta-id').value;
        const tipo = document.getElementById('conta-tipo').value;

        if (contaId) { // Modo Edição
            const linha = document.querySelector(`tr[data-id="${contaId}"]`);
            if (linha) {
                // Atualiza os valores na tabela
                const valor = parseFloat(document.getElementById('conta-valor').value);
                const data = new Date(document.getElementById('conta-vencimento').value + 'T00:00:00');
                const dataFormatada = data.toLocaleDateString('pt-BR');

                if (tipo === 'fiados') {
                    linha.querySelector('[data-label="Cliente"]').textContent = document.getElementById('conta-cliente').value;
                    linha.querySelector('[data-label="Data"]').textContent = dataFormatada;
                } else {
                    linha.querySelector('[data-label="Descrição"]').textContent = document.getElementById('conta-descricao').value;
                    linha.querySelector('[data-label="Vencimento"]').textContent = dataFormatada;
                }
                if (tipo === 'pagar') {
                    linha.querySelector('[data-label="Categoria"]').textContent = document.getElementById('conta-categoria').value;
                }
                linha.querySelector('[data-label="Valor"]').textContent = formatarMoeda(valor);

                // Atualiza o status
                const statusSelect = document.getElementById('conta-status').value;
                const statusSpan = linha.querySelector('.status-conta');
                statusSpan.className = 'status-conta'; // Limpa classes antigas
                statusSpan.classList.add(`status-${statusSelect}`);
                statusSpan.textContent = statusSelect.charAt(0).toUpperCase() + statusSelect.slice(1);
                if (tipo === 'fiados' && statusSelect === 'pendente') statusSpan.textContent = 'Aberto';

                // Reabilita/desabilita botões de ação com base no novo status
                const acoesHabilitadas = statusSelect !== 'pago';
                linha.querySelectorAll('.btn-acao-conta').forEach(b => b.disabled = !acoesHabilitadas);

                alert('Conta editada com sucesso!');
            }
        } else {
            // Lógica para ADICIONAR uma nova linha
            const dadosNovaConta = {
                id: `${tipo}-${Date.now()}`,
                descricao: document.getElementById('conta-descricao').value,
                cliente: document.getElementById('conta-cliente').value,
                categoria: document.getElementById('conta-categoria').value,
                valor: parseFloat(document.getElementById('conta-valor').value.replace(',', '.')) || 0,
                vencimento: document.getElementById('conta-vencimento').value,
                // Para fiado, o status é sempre 'pendente' (Aberto) ao criar
                status: tipo === 'fiados' ? 'pendente' : document.getElementById('conta-status').value,
            };
            adicionarNovaLinha(dadosNovaConta, tipo);
            alert('Nova conta adicionada com sucesso!');
        }

        modalConta.classList.remove('visivel');
        
        // Atualiza o gráfico se estiver na aba correta
        if (tipo === 'pagar') {
            renderizarGraficoPizza();
        }
        atualizarCardsResumo();
    });

    // Função para renderizar o gráfico de pizza
    function renderizarGraficoPizza() {
        const ctx = document.getElementById('grafico-despesas');
        if (!ctx) return; // Se o canvas não existir, não faz nada

        // Destrói o gráfico anterior se ele existir, para evitar sobreposição
        if (graficoPizza) {
            graficoPizza.destroy();
        }

        const tabelaPagar = document.getElementById('tabela-contas-pagar');
        if (!tabelaPagar) return;

        const dadosGrafico = {};

        // Itera sobre as linhas da tabela de contas a pagar
        tabelaPagar.querySelectorAll('tbody tr').forEach(linha => {
            const status = linha.querySelector('.status-conta')?.textContent.trim();
            // Considera apenas as contas que não estão pagas
            if (status !== 'Pago') {
                const categoria = linha.querySelector('[data-label="Categoria"]')?.textContent.trim();
                const valorTexto = linha.querySelector('[data-label="Valor"]')?.textContent.trim();
                const valor = parseMoeda(valorTexto);

                if (categoria && !isNaN(valor)) {
                    if (dadosGrafico[categoria]) {
                        dadosGrafico[categoria] += valor;
                    } else {
                        dadosGrafico[categoria] = valor;
                    }
                }
            }
        });

        const labels = Object.keys(dadosGrafico);
        const data = Object.values(dadosGrafico);

        graficoPizza = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Despesas por Categoria',
                    data: data,
                    // Cores personalizadas (Laranja e Amarelo)
                    backgroundColor: [
                        'rgba(240, 100, 0, 0.8)',  // Laranja (var(--color-orange))
                        'rgba(255, 198, 0, 0.8)', // Amarelo (var(--color-yellow))
                    ],
                    borderColor: [
                        '#f06400',
                        '#ffc600',
                    ],
                    borderWidth: 2,
                    hoverOffset: 20
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { color: '#cecaca' } },
                    title: {
                        display: true,
                        text: 'Despesas Pendentes por Categoria',
                        color: '#ffc600',
                        font: { size: 22 }
                    }
                }
            }
        });
    }

    // --- LÓGICA PARA RELATÓRIO E MODAL DE DETALHES DO MOTOBOY ---
    const btnFecharModalMotoboy = modalMotoboy.querySelector('.btn-fechar-modal');
    const tituloModalMotoboy = document.getElementById('modal-motoboy-titulo');
    const corpoTabelaDetalhes = document.getElementById('corpo-tabela-detalhes');

    // Dados de exemplo para o relatório de motoboys, usados como fallback
    const dadosEntregasExemplo = {
        "carlos-almeida": {
            nome: "Carlos Almeida",
            entregas: [
                { data: new Date().toLocaleDateString('pt-BR'), endereco: "Rua das Flores, 123 (Exemplo)", valor: 8.00 },
                { data: new Date().toLocaleDateString('pt-BR'), endereco: "Av. Principal, 456 (Exemplo)", valor: 10.00 },
            ]
        },
        "mariana-costa": {
            nome: "Mariana Costa",
            entregas: [
                { data: new Date().toLocaleDateString('pt-BR'), endereco: "Rua da Paz, 555 (Exemplo)", valor: 8.00 },
            ]
        }
    };

    function renderizarRelatorioMotoboy(periodo) {
        const CHAVE_HISTORICO_FINANCEIRO = 'casaTaperaHistoricoFinanceiro';
        const todasTransacoes = JSON.parse(localStorage.getItem(CHAVE_HISTORICO_FINANCEIRO)) || [];

        const transacoesEntrega = todasTransacoes.filter(t => t.categoria === 'Entrega' && t.motoboy);

        const agora = new Date();
        const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
        
        const entregasFiltradas = transacoesEntrega.filter(entrega => {
            const dataEntrega = new Date(entrega.hora);
            switch (periodo) {
                case 'diario': return dataEntrega.toDateString() === hoje.toDateString();
                case 'semanal':
                    const inicioSemana = new Date(hoje);
                    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
                    return dataEntrega >= inicioSemana;
                case 'mensal': return dataEntrega.getMonth() === agora.getMonth() && dataEntrega.getFullYear() === agora.getFullYear();
                default: return true;
            }
        });

        const relatorioPorMotoboy = {};
        entregasFiltradas.forEach(entrega => {
            const nomeMotoboy = entrega.motoboy;
            if (!relatorioPorMotoboy[nomeMotoboy]) {
                relatorioPorMotoboy[nomeMotoboy] = {
                    nome: nomeMotoboy,
                    entregas: 0,
                    valor: 0,
                    isReal: true // Flag para identificar dados reais
                };
            }
            relatorioPorMotoboy[nomeMotoboy].entregas++;
            relatorioPorMotoboy[nomeMotoboy].valor += entrega.valor;
        });

        // Se não houver dados reais para o período, usa os dados de exemplo como fallback
        if (Object.keys(relatorioPorMotoboy).length === 0) {
            Object.keys(dadosEntregasExemplo).forEach(motoboyId => {
                const motoboyExemplo = dadosEntregasExemplo[motoboyId];
                relatorioPorMotoboy[motoboyExemplo.nome] = {
                    nome: motoboyExemplo.nome,
                    entregas: motoboyExemplo.entregas.length,
                    valor: motoboyExemplo.entregas.reduce((acc, entrega) => acc + entrega.valor, 0),
                    isReal: false // Flag para identificar dados de exemplo
                };
            });
        }

        let totalGeralEntregas = 0;
        let valorTotalGeral = 0;
        tabelaCorpoMotoboy.innerHTML = '';

        const motoboysOrdenados = Object.keys(relatorioPorMotoboy).sort();

        motoboysOrdenados.forEach(nomeMotoboy => {
            const dadosMotoboy = relatorioPorMotoboy[nomeMotoboy];
            totalGeralEntregas += dadosMotoboy.entregas;
            valorTotalGeral += dadosMotoboy.valor;

            const tr = `
                <tr data-motoboy-nome="${nomeMotoboy}" data-is-real="${dadosMotoboy.isReal}" class="linha-motoboy">
                    <td data-label="Motoboy"><div class="info-motoboy"><i class="fas fa-motorcycle"></i><span>${dadosMotoboy.nome}</span></div></td>
                    <td data-label="Total de Entregas">${dadosMotoboy.entregas}</td>
                    <td data-label="Valor Total das Taxas">${formatarMoeda(dadosMotoboy.valor)}</td>
                    <td data-label="Ações"><button class="btn-ver-detalhes">Ver Detalhes</button></td>
                </tr>
            `;
            tabelaCorpoMotoboy.innerHTML += tr;
        });

        totalEntregasEl.textContent = totalGeralEntregas;
        valorTotalTaxasEl.textContent = formatarMoeda(valorTotalGeral);

        if (tabelaCorpoMotoboy.innerHTML === '') {
            tabelaCorpoMotoboy.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #888;">Nenhum relatório de entrega para este período.</td></tr>';
        }
    }

    if (filtrosMotoboy) {
        filtrosMotoboy.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-filtro')) {
                filtrosMotoboy.querySelector('.btn-filtro.active').classList.remove('active');
                e.target.classList.add('active');
                renderizarRelatorioMotoboy(e.target.dataset.period);
            }
        });
    }

    if (secaoRelatorioMotoboy) {
        secaoRelatorioMotoboy.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-ver-detalhes')) {
                const linha = e.target.closest('tr');
                const nomeMotoboy = linha.dataset.motoboyNome;
                const isReal = linha.dataset.isReal === 'true';

                let entregasDoMotoboy = [];

                if (isReal) {
                    // Busca todas as entregas do motoboy no histórico financeiro
                    const CHAVE_HISTORICO_FINANCEIRO = 'casaTaperaHistoricoFinanceiro';
                    const todasTransacoes = JSON.parse(localStorage.getItem(CHAVE_HISTORICO_FINANCEIRO)) || [];
                    entregasDoMotoboy = todasTransacoes.filter(t => t.motoboy === nomeMotoboy);
                } else {
                    // Busca as entregas dos dados de exemplo
                    const motoboyIdExemplo = Object.keys(dadosEntregasExemplo).find(id => dadosEntregasExemplo[id].nome === nomeMotoboy);
                    if (motoboyIdExemplo) {
                        entregasDoMotoboy = dadosEntregasExemplo[motoboyIdExemplo].entregas;
                    }
                }

                tituloModalMotoboy.textContent = `Detalhes de: ${nomeMotoboy}`;
                corpoTabelaDetalhes.innerHTML = '';

                if (entregasDoMotoboy.length > 0) {
                    if (isReal) entregasDoMotoboy.sort((a, b) => new Date(b.hora) - new Date(a.hora));
                    
                    entregasDoMotoboy.forEach(entrega => {
                        const dataFormatada = isReal ? new Date(entrega.hora).toLocaleDateString('pt-BR') : entrega.data;
                        const tr = `<tr><td>${dataFormatada}</td><td>${entrega.endereco}</td><td>${formatarMoeda(entrega.valor)}</td></tr>`;
                        corpoTabelaDetalhes.innerHTML += tr;
                    });
                } else {
                    corpoTabelaDetalhes.innerHTML = '<tr><td colspan="3" style="text-align:center;">Nenhuma entrega encontrada para este motoboy.</td></tr>';
                }

                modalMotoboy.classList.add('visivel');
            }
        });
    }

    btnFecharModalMotoboy.addEventListener('click', () => modalMotoboy.classList.remove('visivel'));
    modalMotoboy.addEventListener('click', (e) => { if (e.target === modalMotoboy) modalMotoboy.classList.remove('visivel'); });

    // --- INICIALIZAÇÃO ---
    renderizarGraficoPizza();
    atualizarCardsResumo();
    renderizarRelatorioMotoboy('diario'); // Renderiza o relatório inicial
});