document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES DE ELEMENTOS ---
    const faturamentoBrutoEl = document.getElementById('faturamento-bruto');
    const despesasPagasEl = document.getElementById('despesas-pagas');
    const lucroLiquidoEl = document.getElementById('lucro-liquido');
    const valorPixEl = document.getElementById('valor-pix');
    const valorCartaoEl = document.getElementById('valor-cartao');
    const valorDinheiroEl = document.getElementById('valor-dinheiro');
    const ticketMedioEl = document.getElementById('ticket-medio');
    const qtdOperacoesEl = document.getElementById('qtd-operacoes');
    const ajusteCaixaEl = document.getElementById('ajuste-caixa');

    const tabelaCorpo = document.querySelector('.tabela-lancamentos tbody');
    const filtrosContainer = document.querySelector('.filtros-container');
    const buscaInput = document.getElementById('busca-transacao');

    const cardsCategoriasContainer = document.getElementById('cards-categorias');
    const listaAuditoria = document.getElementById('lista-auditoria');
    const badgeIntegridade = document.getElementById('badge-integridade');

    const CHAVE_HISTORICO_FINANCEIRO = 'casaTaperaHistoricoFinanceiro';
    const CHAVE_STATUS_CAIXA = 'casaTaperaStatusCaixa';
    const CHAVE_INTEGRIDADE = 'casaTaperaHistoricoFinanceiroHash';

    let chartInstance = null;
    let transacoesAtuais = [];
    let periodoAtivo = 'diario';
    let saldoSistemaAtual = 0;

    function formatarMoeda(valor) {
        return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function formatarDataHora(dataString) {
        const data = new Date(dataString);
        return `${data.toLocaleDateString('pt-BR')} ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }

    function gerarChecksum(transacoes) {
        return transacoes
            .map(t => `${t.id}|${t.tipo}|${t.valor}|${t.hora}|${t.metodo || ''}|${t.categoria || ''}|${t.descricao}`)
            .join('||');
    }

    function salvarHistorico(transacoes) {
        localStorage.setItem(CHAVE_HISTORICO_FINANCEIRO, JSON.stringify(transacoes));
        localStorage.setItem(CHAVE_INTEGRIDADE, gerarChecksum(transacoes));
    }

    function adicionarALixeira(tipo, dado, origem) {
        const lixeira = JSON.parse(localStorage.getItem('casaTaperaLixeira')) || [];
        lixeira.unshift({
            id: `trash-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            tipo,
            dado,
            origem,
            dataExclusao: new Date().toISOString()
        });
        localStorage.setItem('casaTaperaLixeira', JSON.stringify(lixeira));
    }

    function calcularSaldoSistema(transacoes) {
        return transacoes.reduce((total, transacao) => {
            const valor = parseFloat(transacao.valor) || 0;
            return transacao.tipo === 'entrada' ? total + valor : total - valor;
        }, 0);
    }

    function calcularResumo(transacoes) {
        const resumo = {
            faturamentoBruto: 0,
            despesasPagas: 0,
            pix: 0,
            cartao: 0,
            dinheiro: 0,
            ticketMedio: 0,
            totalTransacoes: transacoes.length,
            lucroLiquido: 0,
            ajusteCaixa: 0
        };

        let contagemEntradas = 0;

        transacoes.forEach(transacao => {
            const valor = parseFloat(transacao.valor) || 0;
            if (transacao.tipo === 'entrada') {
                resumo.faturamentoBruto += valor;
                contagemEntradas++;
            } else {
                resumo.despesasPagas += valor;
            }

            const metodo = (transacao.metodo || '').toLowerCase();
            if (metodo.includes('pix')) {
                if (transacao.tipo === 'entrada') resumo.pix += valor;
            }
            else if (metodo.includes('cartao') || metodo.includes('cartão')) resumo.cartao += valor;
            else if (metodo.includes('dinheiro')) resumo.dinheiro += valor;

            if (transacao.categoria === 'Ajuste de Caixa') {
                resumo.ajusteCaixa += (transacao.tipo === 'entrada' ? valor : -valor);
            }
        });

        resumo.lucroLiquido = resumo.faturamentoBruto - resumo.despesasPagas;
        resumo.ticketMedio = contagemEntradas > 0 ? resumo.faturamentoBruto / contagemEntradas : 0;
        return resumo;
    }

    function atualizarCards(resumo) {
        faturamentoBrutoEl.textContent = formatarMoeda(resumo.faturamentoBruto);
        despesasPagasEl.textContent = formatarMoeda(resumo.despesasPagas);
        lucroLiquidoEl.textContent = formatarMoeda(resumo.lucroLiquido);
        valorPixEl.textContent = formatarMoeda(resumo.pix);
        valorCartaoEl.textContent = formatarMoeda(resumo.cartao);
        valorDinheiroEl.textContent = formatarMoeda(resumo.dinheiro);
        ticketMedioEl.textContent = formatarMoeda(resumo.ticketMedio);
        qtdOperacoesEl.textContent = resumo.totalTransacoes;
        ajusteCaixaEl.textContent = formatarMoeda(resumo.ajusteCaixa);
        lucroLiquidoEl.classList.toggle('valor-positivo', resumo.lucroLiquido >= 0);
        lucroLiquidoEl.classList.toggle('valor-negativo', resumo.lucroLiquido < 0);
    }

    function atualizarPainelStatusCaixa() {
        const status = JSON.parse(localStorage.getItem(CHAVE_STATUS_CAIXA)) || { aberto: false };
        const badge = document.getElementById('badge-status-caixa');
        const btnOpCaixa = document.getElementById('btn-abrir-fechar-caixa');
        if (status.aberto) {
            badge.textContent = 'Caixa Aberto';
            badge.classList.remove('status-fechado');
            badge.classList.add('status-aberto');
            if (btnOpCaixa) btnOpCaixa.innerHTML = '<i class="fas fa-lock"></i> Fechar Caixa';
        } else {
            badge.textContent = 'Caixa Fechado';
            badge.classList.remove('status-aberto');
            badge.classList.add('status-fechado');
            if (btnOpCaixa) btnOpCaixa.innerHTML = '<i class="fas fa-lock-open"></i> Abrir Caixa';
        }
    }

    function verificarIntegridade(transacoes) {
        const checksumSalvo = localStorage.getItem(CHAVE_INTEGRIDADE) || '';
        const checksumAtual = gerarChecksum(transacoes);
        if (!checksumSalvo && transacoes.length > 0) {
            badgeIntegridade.textContent = 'Integridade ativa';
            badgeIntegridade.classList.remove('status-alerta');
            badgeIntegridade.classList.add('status-integridade');
            return;
        }
        if (checksumSalvo !== checksumAtual) {
            badgeIntegridade.textContent = 'Integridade inconsistente';
            badgeIntegridade.classList.remove('status-integridade');
            badgeIntegridade.classList.add('status-alerta');
        } else {
            badgeIntegridade.textContent = 'Integridade Financeira segura';
            badgeIntegridade.classList.remove('status-alerta');
            badgeIntegridade.classList.add('status-integridade');
        }
    }

    function renderizarResumoCategoria(transacoes) {
        const categorias = {};
        transacoes.forEach(transacao => {
            const categoria = transacao.categoria || 'Sem categoria';
            if (!categorias[categoria]) categorias[categoria] = { entrada: 0, saida: 0 };
            const valor = parseFloat(transacao.valor) || 0;
            categorias[categoria][transacao.tipo] += valor;
        });
        cardsCategoriasContainer.innerHTML = Object.entries(categorias).map(([categoria, valores]) => {
            return `
                <div class="card-categoria">
                    <h4>${categoria}</h4>
                    <p><strong>Receitas:</strong> ${formatarMoeda(valores.entrada)}</p>
                    <p><strong>Despesas:</strong> ${formatarMoeda(valores.saida)}</p>
                </div>
            `;
        }).join('');
    }

    function renderizarAuditoria(transacoes) {
        const recentes = [...transacoes].sort((a, b) => new Date(b.hora) - new Date(a.hora)).slice(0, 5);
        listaAuditoria.innerHTML = recentes.map(item => {
            return `
                <li>
                    <span class="auditoria-data">${formatarDataHora(item.hora)}</span>
                    <span class="auditoria-texto">${item.tipo.toUpperCase()} • ${item.categoria || 'Sem categoria'} • ${item.descricao} • ${formatarMoeda(item.valor)}</span>
                </li>
            `;
        }).join('');
        if (recentes.length === 0) {
            listaAuditoria.innerHTML = '<li class="auditoria-vazio">Nenhuma movimentação registrada para exibir.</li>';
        }
    }

    function renderizarTabela(transacoes, filtroBusca = '') {
        tabelaCorpo.innerHTML = '';
        const busca = filtroBusca.toLowerCase();
        const filtradas = transacoes.filter(t =>
            t.descricao.toLowerCase().includes(busca) ||
            t.valor.toString().includes(busca) ||
            (t.metodo || '').toLowerCase().includes(busca) ||
            (t.categoria || '').toLowerCase().includes(busca)
        );
        if (filtradas.length === 0) {
            tabelaCorpo.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #888;">Nenhum lançamento para este período.</td></tr>';
            return;
        }
        filtradas.sort((a, b) => new Date(b.hora) - new Date(a.hora));
        filtradas.forEach(transacao => {
            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td data-label="Data/Hora">${formatarDataHora(transacao.hora)}</td>
                <td data-label="Tipo"><span class="tipo-transacao tipo-${transacao.tipo}">${transacao.tipo}</span></td>
                <td data-label="Descrição">${transacao.descricao}</td>
                <td data-label="Método">${transacao.metodo || 'Não informado'}</td>
                <td data-label="Categoria">${transacao.categoria || 'Sem categoria'}</td>
                <td data-label="Valor" class="valor-${transacao.tipo === 'entrada' ? 'positivo' : 'negativo'}">${transacao.tipo === 'entrada' ? '+' : '-'} ${formatarMoeda(transacao.valor)}</td>
                <td data-label="Ações">
                    <button class="btn-acao-estoque btn-excluir btn-cancelar-transacao" data-id="${transacao.id}" title="Cancelar Lançamento"><i class="fas fa-ban"></i></button>
                </td>
            `;
            tabelaCorpo.appendChild(linha);
        });
    }

    function filtrarTransacoesPorPeriodo(transacoes, periodo) {
        const agora = new Date();
        const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
        return transacoes.filter(t => {
            const dataTransacao = new Date(t.hora);
            switch (periodo) {
                case 'diario':
                    return dataTransacao.toDateString() === hoje.toDateString();
                case 'semanal':
                    const inicioSemana = new Date(hoje);
                    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
                    return dataTransacao >= inicioSemana;
                case 'mensal':
                    return dataTransacao.getMonth() === agora.getMonth() && dataTransacao.getFullYear() === agora.getFullYear();
                default:
                    return true;
            }
        });
    }

    function renderizarGrafico(transacoes) {
        const ctx = document.getElementById('grafico-caixa-fluxo').getContext('2d');
        if (chartInstance) chartInstance.destroy();
        const dadosAgrupados = {};
        transacoes.forEach(t => {
            const data = new Date(t.hora).toLocaleDateString('pt-BR');
            if (!dadosAgrupados[data]) dadosAgrupados[data] = { entrada: 0, saida: 0 };
            const valor = parseFloat(t.valor) || 0;
            if (t.tipo === 'entrada') dadosAgrupados[data].entrada += valor;
            else dadosAgrupados[data].saida += valor;
        });
        const labels = Object.keys(dadosAgrupados).reverse();
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Entradas',
                        data: labels.map(label => dadosAgrupados[label].entrada),
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.16)',
                        fill: true,
                        tension: 0.35
                    },
                    {
                        label: 'Saídas',
                        data: labels.map(label => dadosAgrupados[label].saida),
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.16)',
                        fill: true,
                        tension: 0.35
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#ccc' } } },
                scales: {
                    y: { ticks: { color: '#888' }, grid: { color: '#333' } },
                    x: { ticks: { color: '#888' }, grid: { display: false } }
                }
            }
        });
    }

    function registrarMovimentacao(tipo, descricao, valor, categoria = 'Ajuste de Caixa', metodo = 'Sistema', origem = 'Caixa') {
        const todasTransacoes = JSON.parse(localStorage.getItem(CHAVE_HISTORICO_FINANCEIRO)) || [];
        todasTransacoes.unshift({
            id: `trans-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            tipo,
            descricao,
            valor,
            categoria,
            metodo,
            origem,
            hora: new Date().toISOString(),
            registradoPor: 'sistema'
        });
        salvarHistorico(todasTransacoes);
    }

    function registrarLancamentoManual(tipo, descricao, valor, categoria, metodo) {
        const todasTransacoes = JSON.parse(localStorage.getItem(CHAVE_HISTORICO_FINANCEIRO)) || [];
        todasTransacoes.unshift({
            id: `manual-${Date.now()}`,
            tipo,
            descricao,
            valor,
            categoria,
            metodo,
            origem: 'Lançamento Manual',
            hora: new Date().toISOString(),
            registradoPor: 'usuario'
        });
        salvarHistorico(todasTransacoes);
    }

    function injetarBotaoLimpar() {
        const container = document.querySelector('.filtros-container');
        if (!container || document.getElementById('btn-limpar-historico-fiscal')) return;
        const btnLimparHistorico = document.createElement('button');
        btnLimparHistorico.className = 'btn-acao-caixa-topo btn-limpar-historico';
        btnLimparHistorico.id = 'btn-limpar-historico-fiscal';
        btnLimparHistorico.textContent = 'Arquivar Histórico';
        btnLimparHistorico.style.background = 'linear-gradient(135deg, #ff0033 0%, #ff4d4d 100%)';
        btnLimparHistorico.style.color = '#fff';
        btnLimparHistorico.style.border = '2px solid rgba(255, 255, 255, 0.4)';
        btnLimparHistorico.style.fontWeight = 'bold';
        btnLimparHistorico.style.boxShadow = '0 4px 15px rgba(255, 0, 51, 0.4)';
        btnLimparHistorico.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        btnLimparHistorico.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.3)';
        btnLimparHistorico.style.marginLeft = 'auto';
        container.appendChild(btnLimparHistorico);
        btnLimparHistorico.addEventListener('mouseenter', () => {
            btnLimparHistorico.style.transform = 'scale(1.05) translateY(-2px)';
            btnLimparHistorico.style.boxShadow = '0 8px 25px rgba(255, 0, 51, 0.6)';
            btnLimparHistorico.style.filter = 'brightness(1.1)';
        });
        btnLimparHistorico.addEventListener('mouseleave', () => {
            btnLimparHistorico.style.transform = 'scale(1) translateY(0)';
            btnLimparHistorico.style.boxShadow = '0 4px 15px rgba(255, 0, 51, 0.4)';
            btnLimparHistorico.style.filter = 'brightness(1)';
        });
        btnLimparHistorico.addEventListener('click', () => {
            const todasTransacoes = JSON.parse(localStorage.getItem(CHAVE_HISTORICO_FINANCEIRO)) || [];
            if (todasTransacoes.length === 0) {
                alert('O histórico já está vazio.');
                return;
            }
            if (confirm('Deseja mover TODOS os lançamentos para a lixeira e zerar o histórico?')) {
                todasTransacoes.forEach(transacao => {
                    adicionarALixeira('nota', {
                        ...transacao,
                        numero: transacao.id.split('-').pop() || '000',
                        valorTotal: transacao.valor,
                        cliente: transacao.cliente || transacao.descricao,
                        itens: transacao.itens || [],
                        hora: transacao.hora
                    }, 'Controle Fiscal');
                });
                salvarHistorico([]);
                localStorage.setItem('notasFiscaisTapera', JSON.stringify([]));
                carregarEProcessarDados(periodoAtivo);
                alert('Histórico fiscal movido para a lixeira com sucesso!');
            }
        });
    }

    injetarBotaoLimpar();

    filtrosContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-filtro')) {
            filtrosContainer.querySelector('.btn-filtro.active').classList.remove('active');
            e.target.classList.add('active');
            carregarEProcessarDados(e.target.dataset.periodo);
        }
    });

    buscaInput.addEventListener('input', (e) => {
        renderizarTabela(transacoesAtuais, e.target.value);
    });

    tabelaCorpo.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-cancelar-transacao');
        if (!btn) return;
        const id = btn.dataset.id;
        const todasTransacoes = JSON.parse(localStorage.getItem(CHAVE_HISTORICO_FINANCEIRO)) || [];
        const index = todasTransacoes.findIndex(t => t.id === id);
        if (index > -1 && confirm('Deseja cancelar este lançamento e enviá-lo para a lixeira?')) {
            const transacao = todasTransacoes[index];
            adicionarALixeira('nota', {
                id: transacao.id,
                numero: transacao.id.toString().split('-').pop() || '000',
                valorTotal: transacao.valor,
                cliente: transacao.cliente || transacao.descricao,
                itens: transacao.itens || [],
                hora: transacao.hora
            }, 'Controle Fiscal');
            todasTransacoes.splice(index, 1);
            salvarHistorico(todasTransacoes);
            const filtroAtivo = filtrosContainer.querySelector('.btn-filtro.active');
            carregarEProcessarDados(filtroAtivo ? filtroAtivo.dataset.periodo : 'diario');
        }
    });

    const modalOperacao = document.getElementById('modal-operacao-caixa');
    const btnOpCaixa = document.getElementById('btn-abrir-fechar-caixa');
    const formOpCaixa = document.getElementById('form-operacao-caixa');

    btnOpCaixa.onclick = () => {
        const status = JSON.parse(localStorage.getItem(CHAVE_STATUS_CAIXA)) || { aberto: false };
        const titulo = document.getElementById('titulo-modal-caixa');
        const label = document.getElementById('label-valor-caixa');
        const infoFechamento = document.getElementById('info-fechamento-sistema');
        if (!status.aberto) {
            titulo.textContent = 'Abertura de Caixa';
            label.textContent = 'Valor Inicial (Troco):';
            infoFechamento.classList.add('oculto');
        } else {
            titulo.textContent = 'Fechamento de Caixa';
            label.textContent = 'Valor em Dinheiro na Gaveta:';
            infoFechamento.classList.remove('oculto');
            
            // O saldo esperado deve ser a soma de todos os lançamentos em "Dinheiro" desde a abertura
            const todas = JSON.parse(localStorage.getItem(CHAVE_HISTORICO_FINANCEIRO)) || [];
            document.getElementById('saldo-esperado').textContent = formatarMoeda(calcularSaldoSistema(todas));
        }
        modalOperacao.classList.add('visivel');
    };

    formOpCaixa.onsubmit = (e) => {
        e.preventDefault();
        const valor = parseFloat(document.getElementById('valor-operacao-caixa').value);
        const statusAtual = JSON.parse(localStorage.getItem(CHAVE_STATUS_CAIXA)) || { aberto: false };
        const todas = JSON.parse(localStorage.getItem(CHAVE_HISTORICO_FINANCEIRO)) || [];

        if (!statusAtual.aberto) {
            localStorage.setItem(CHAVE_STATUS_CAIXA, JSON.stringify({ aberto: true, dataAbertura: new Date().toISOString(), valorInicial: valor }));
            registrarMovimentacao('entrada', 'Abertura de Caixa (Suprimento)', valor, 'Ajuste de Caixa', 'Dinheiro', 'Caixa');
        } else {
            const saldoAtualTotal = calcularSaldoSistema(todas);
            const diferenca = valor - saldoAtualTotal;

            if (Math.abs(diferenca) > 0.01) {
                const tipoAjuste = diferenca > 0 ? 'entrada' : 'saida';
                const descricaoAjuste = diferenca > 0 ? `Sobra de caixa ${formatarMoeda(diferenca)}` : `Falta de caixa ${formatarMoeda(Math.abs(diferenca))}`;
                registrarMovimentacao(tipoAjuste, descricaoAjuste, Math.abs(diferenca), 'Ajuste de Caixa', 'Dinheiro', 'Fechamento de Caixa');
            }
            localStorage.setItem(CHAVE_STATUS_CAIXA, JSON.stringify({ aberto: false, dataUltimoFechamento: new Date().toISOString() }));
            alert('Caixa fechado com sucesso. Relatório final consolidado.');
        }
        modalOperacao.classList.remove('visivel');
        formOpCaixa.reset();
        carregarEProcessarDados(periodoAtivo);
    };

    const modalManual = document.getElementById('modal-lancamento');
    const btnAbrirModal = document.getElementById('btn-novo-lancamento');
    const btnFecharModal = modalManual.querySelector('.btn-fechar-modal');
    const formLancamento = document.getElementById('form-lancamento');
    const btnExportar = document.getElementById('btn-exportar-caixa');

    btnAbrirModal.onclick = () => modalManual.classList.add('visivel');
    btnFecharModal.onclick = () => modalManual.classList.remove('visivel');
    btnExportar.onclick = () => exportarCSV();

    formLancamento.onsubmit = (e) => {
        e.preventDefault();
        const tipo = document.getElementById('lanc-tipo').value;
        const categoria = document.getElementById('lanc-categoria').value;
        const metodo = document.getElementById('lanc-metodo').value;
        const desc = document.getElementById('lanc-descricao').value.trim();
        const valor = parseFloat(document.getElementById('lanc-valor').value);
        if (valor <= 0) return alert('Insira um valor válido.');
        if (!desc) return alert('Informe uma descrição para o lançamento.');
        registrarLancamentoManual(tipo, `(Manual) ${desc}`, valor, categoria, metodo);
        modalManual.classList.remove('visivel');
        formLancamento.reset();
        carregarEProcessarDados(periodoAtivo);
        alert('Lançamento realizado com sucesso!');
    };

    window.onclick = (e) => {
        if (e.target === modalManual) modalManual.classList.remove('visivel');
        if (e.target === modalOperacao) modalOperacao.classList.remove('visivel');
    };

    function carregarEProcessarDados(periodo = 'diario') {
        periodoAtivo = periodo;
        const todasTransacoes = JSON.parse(localStorage.getItem(CHAVE_HISTORICO_FINANCEIRO)) || [];
        transacoesAtuais = filtrarTransacoesPorPeriodo(todasTransacoes, periodo);
        saldoSistemaAtual = calcularSaldoSistema(todasTransacoes);
        const resumo = calcularResumo(transacoesAtuais);
        atualizarCards(resumo);
        atualizarPainelStatusCaixa();
        renderizarResumoCategoria(transacoesAtuais);
        renderizarAuditoria(transacoesAtuais);
        renderizarTabela(transacoesAtuais);
        renderizarGrafico(transacoesAtuais);
        verificarIntegridade(todasTransacoes);
    }

    function exportarCSV() {
        if (transacoesAtuais.length === 0) return alert('Não há dados para exportar.');
        let csv = 'Data;Tipo;Descricao;Metodo;Categoria;Valor;Origem\n';
        transacoesAtuais.forEach(t => {
            csv += `${formatarDataHora(t.hora)};${t.tipo};${t.descricao};${t.metodo || 'N/A'};${t.categoria || 'N/A'};${t.valor};${t.origem || 'Caixa'}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.setAttribute('href', URL.createObjectURL(blob));
        link.setAttribute('download', `financeiro_tapera_${periodoAtivo}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    carregarEProcessarDados('diario');
});
