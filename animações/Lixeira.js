document.addEventListener('DOMContentLoaded', () => {
    const gridLixeira = document.getElementById('grid-lixeira');
    const btnLimparLixeira = document.getElementById('btn-limpar-lixeira');
    const containerAbas = document.querySelector('.container-abas');
    let filtroAtual = 'todos';

    const nomesAbas = {
        'todos': 'Todos',
        'Personalizar Cardápio': 'Cardápio',
        'Painel de Controle': 'Pedidos',
        'Gerenciador de Mesas': 'Mesas',
        'Controle de Estoque': 'Estoque',
        'Clientes Cadastrados': 'Clientes',
        'Mensagens IA': 'Pesquisas',
        'Automações': 'Automações',
        'Controle Fiscal': 'Fiscal'
    };

    function atualizarContadoresAbas() {
        const lixeira = JSON.parse(localStorage.getItem('casaTaperaLixeira')) || [];
        const contadores = {
            'todos': lixeira.length,
            'Personalizar Cardápio': 0,
            'Painel de Controle': 0,
            'Gerenciador de Mesas': 0,
            'Controle de Estoque': 0,
            'Clientes Cadastrados': 0,
            'Mensagens IA': 0,
            'Automações': 0,
            'Controle Fiscal': 0
        };

        lixeira.forEach(item => {
            if (item.tipo === 'cupom' || item.tipo === 'automacao' || item.origem === 'Automações' || item.origem === 'Sugestões de Marketing' || item.origem === 'Cupons de Desconto') {
                contadores['Automações']++;
            } else if (item.tipo === 'pesquisa' || item.origem === 'Mensagens IA') {
                contadores['Mensagens IA']++;
            } else if (item.tipo === 'nota' || item.origem === 'Controle Fiscal') {
                contadores['Controle Fiscal']++;
            } else if (item.tipo === 'cliente' || item.tipo === 'conta' || item.tipo === 'clientes' || item.origem === 'Clientes Cadastrados' || item.origem === 'Clientes Bloqueados') {
                contadores['Clientes Cadastrados']++;
            } else if (contadores.hasOwnProperty(item.origem)) {
                contadores[item.origem]++;
            }
        });

        containerAbas.querySelectorAll('.btn-aba').forEach(btn => {
            const origem = btn.dataset.origem;
            const count = contadores[origem] || 0;
            const nomeExibicao = nomesAbas[origem];
            btn.innerHTML = `${nomeExibicao} <span class="contador-aba">${count}</span>`;
            
            // Adiciona classe de opacidade se não houver itens na aba
            btn.classList.toggle('aba-vazia', count === 0);
        });
    }

    function renderizarLixeira() {
        let lixeira = JSON.parse(localStorage.getItem('casaTaperaLixeira')) || [];
        gridLixeira.innerHTML = '';

        // Aplica o filtro de abas
        if (filtroAtual !== 'todos') {
            lixeira = lixeira.filter(item => {
                if (filtroAtual === 'Automações') {
                    return item.tipo === 'cupom' || item.tipo === 'automacao' || item.origem === 'Automações' || item.origem === 'Sugestões de Marketing' || item.origem === 'Cupons de Desconto';
                }
                if (filtroAtual === 'Mensagens IA') {
                    return (item.tipo === 'pesquisa' || item.origem === 'Mensagens IA') && item.tipo !== 'cupom' && item.tipo !== 'automacao';
                }
                if (filtroAtual === 'Clientes Cadastrados') {
                    return item.tipo === 'cliente' || item.tipo === 'conta' || item.tipo === 'clientes' || item.origem === 'Clientes Cadastrados' || item.origem === 'Clientes Bloqueados';
                }
                return (filtroAtual === 'Controle Fiscal' && item.tipo === 'nota') || item.origem === filtroAtual;
            });
        }

        // Funções auxiliares para formatação visual (Máscaras)
        const formatarCPF = (v) => {
            v = (v || "").replace(/\D/g, "");
            if (v.length !== 11) return v || 'Não informado';
            return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
        };

        const formatarTelefone = (v) => {
            v = (v || "").replace(/\D/g, "").replace(/^55/, ""); // Remove prefixo de país se houver
            if (v.length === 11) return v.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
            if (v.length === 10) return v.replace(/^(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
            return v || 'Não informado';
        };

        if (lixeira.length === 0) {
            gridLixeira.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #666; font-style: italic;">Nenhum item encontrado em "${filtroAtual === 'todos' ? 'Geral' : filtroAtual}".</div>`;
            return;
        }

        lixeira.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card-lixeira';
            card.dataset.id = item.id;
            const data = new Date(item.dataExclusao).toLocaleString('pt-BR');

            // Mapeamento de nomes visuais e descrições para cada tipo de dado
            let nomeTipo = 'Produto';
            let descricaoTipo = 'Item individual do cardápio ou estoque.';
            
            if (item.tipo === 'categoria') {
                nomeTipo = 'Container';
                descricaoTipo = 'Grupo de itens ou seção completa.';
            } else if (item.tipo === 'pesquisa') {
                nomeTipo = 'Pesquisa';
                descricaoTipo = 'Histórico de buscas da assistente IA.';
            } else if (item.tipo === 'conta' || item.tipo === 'cliente' || item.tipo === 'clientes') {
                nomeTipo = 'Cliente';
                descricaoTipo = 'Cadastro de perfil e dados de cliente.';
            } else if (item.tipo === 'cupom') {
                nomeTipo = 'Cupom';
                descricaoTipo = 'Código promocional ou link de desconto.';
            } else if (item.tipo === 'mesa') {
                nomeTipo = 'Mesa';
                descricaoTipo = 'Configuração de mesa física e seu QR Code.';
            } else if (item.tipo === 'pedido') {
                nomeTipo = 'Pedido';
                descricaoTipo = 'Histórico completo de um pedido de cliente.';
            } else if (item.tipo === 'nota') {
                nomeTipo = 'Nota Fiscal';
                descricaoTipo = 'Documento fiscal ou comprovante de transação.';
            } else if (item.tipo === 'automacao') {
                nomeTipo = 'Automação';
                descricaoTipo = 'Mensagem automática de marketing.';
            }

            const botaoVerItens = (item.tipo === 'pedido' || item.tipo === 'categoria' || item.tipo === 'nota' || item.tipo === 'mesa' || item.tipo === 'automacao') ? '<button class="btn-ver-itens"><i class="fas fa-list"></i> Ver Mensagem</button>' : '';
            const categoriaFinanceira = item.dado.categoria || item.dado.origemAba || 'Lançamento Geral';
            const dataOrigem = item.dado.hora ? new Date(item.dado.hora).toLocaleDateString('pt-BR') : 'N/A';

            card.innerHTML = `
                <div class="header-card-lixeira">
                    <span class="badge-tipo ${item.tipo}">${nomeTipo}</span>
                    <span style="color: #666;">${data}</span>
                </div>
                <div class="corpo-card-lixeira">
                    <h3>${item.tipo === 'pesquisa' ? item.dado.termo : (item.tipo === 'mesa' ? `Mesa ${item.dado.id}` : (item.tipo === 'cupom' ? item.dado.codigo : (item.tipo === 'pedido' ? `Pedido #${item.dado.id.substring(7)}` : (item.tipo === 'automacao' ? (item.dado.texto || item.dado.mensagem || 'Mensagem de Automação') : (item.tipo === 'nota' ? (item.dado.numero && item.dado.numero !== '000' ? `NF-e #${item.dado.numero}` : (item.dado.descricao || item.dado.nome)) + (item.dado.valorTotal || item.dado.valor || item.dado.valorFinal || (item.dado.data ? item.dado.data.total : 0) ? ` - ${parseFloat(item.dado.valorTotal || item.dado.valor || item.dado.valorFinal || (item.dado.data ? item.dado.data.total : 0)).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}` : '') : (item.dado.nome || item.dado.descricao || 'Item sem nome'))))))}</h3>
                    ${(item.tipo === 'nota' || item.tipo === 'pedido' || item.tipo === 'mesa') ? 
                        `<p class="nota-valor-total" style="color: var(--color-yellow); font-weight: bold; margin: 8px 0;">Valor Total Gasto: ${(parseFloat(item.dado.valorTotal || item.dado.valor || item.dado.valorFinal || (item.dado.data ? item.dado.data.total : 0)) || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>` : ''}
                    ${item.tipo === 'nota' ? `
                        <div class="detalhes-nota-vertical" style="display: flex; flex-direction: column; gap: 3px; margin-bottom: 10px; border-left: 2px solid #444; padding-left: 10px;">
                            <p style="font-size: 0.85em; color: #aaa;"><strong>Cliente:</strong> ${item.dado.cliente || 'N/A'}</p>
                            <p style="font-size: 0.85em; color: #aaa;"><strong>Data:</strong> ${item.dado.data ? new Date(item.dado.data + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}</p>
                        </div>` : ''}
                    ${(item.tipo === 'conta' || item.tipo === 'cliente' || item.tipo === 'clientes') ? `
                        <div class="detalhes-cliente-vertical" style="display: flex; flex-direction: column; gap: 3px; margin-bottom: 10px; border-left: 2px solid var(--color-yellow); padding-left: 10px;">
                            <p style="font-size: 0.85em; color: #aaa;"><strong>CPF:</strong> ${formatarCPF(item.dado.cpf)}</p>
                            <p style="font-size: 0.85em; color: #aaa;"><strong>Telefone:</strong> ${formatarTelefone(item.dado.telefone)}</p>
                            <p style="font-size: 0.85em; color: #aaa;"><strong>E-mail:</strong> ${item.dado.email || 'Não informado'}</p>
                            <p style="font-size: 0.85em; color: #aaa;"><strong>Endereço:</strong> ${item.dado.endereco || (item.dado.rua ? `${item.dado.rua}, ${item.dado.numero} - ${item.dado.bairro}` : 'Não informado')}</p>
                        </div>` : ''}
                    ${item.tipo === 'pedido' ? `
                        <div class="detalhes-pedido-lixeira-info" style="display: flex; flex-direction: column; gap: 3px; margin-bottom: 10px; border-left: 2px solid var(--color-orange); padding-left: 10px;">
                            <p style="font-size: 0.85em; color: #aaa; margin: 0;"><strong>Cliente:</strong> ${item.dado.nomeCliente}</p>
                            <div style="margin: 5px 0;">
                                <span style="font-size: 1.1em; font-family: 'Bebas Neue', sans-serif; background: rgba(240, 100, 0, 0.1); padding: 4px 10px; border-radius: 6px; color: var(--color-orange); font-weight: bold;">
                                    ${(() => {
                                        const d = item.dado.data ? new Date(item.dado.data) : new Date(parseInt(item.dado.id.split('-')[1]));
                                        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                    })()}
                                </span>
                            </div>
                            <p style="font-size: 0.85em; color: #aaa;"><strong>Tipo:</strong> ${item.dado.metodoEntrega === 'delivery' ? 'Entrega' : (item.dado.metodoEntrega === 'mesa' ? 'Mesa' : 'Retirada')}</p>
                            ${item.dado.metodoEntrega === 'delivery' ? `<p style="font-size: 0.85em; color: #aaa;"><strong>Endereço:</strong> ${item.dado.endereco || 'N/A'}</p>` : ''}
                        </div>` : ''}
                    <p class="descricao-tipo-lixeira" style="font-size: 0.85em; color: #888; font-style: italic; margin-bottom: 8px;">${descricaoTipo}</p>
                    <p class="origem-texto"><i class="fas fa-map-marker-alt" style="font-size: 0.8em; color: var(--color-red);"></i> Excluído da página: <strong>${item.origem}</strong></p>
                    <p class="aviso-reposicao">Deseja realizar a reposição deste campo no sistema?</p>
                    <div class="detalhes-pedido-lixeira" style="display: none; margin-top: 15px; padding: 15px; background: #222; border-radius: 8px; border-left: 3px solid var(--color-orange); color: #ccc;"></div>
                </div>
                <div class="acoes-lixeira">
                    <button class="btn-restaurar"><i class="fas fa-undo"></i> Restaurar</button>
                    ${botaoVerItens}
                    <button class="btn-excluir-permanente" title="Excluir Definitivamente"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            gridLixeira.appendChild(card);
        });
    }

    // Lógica de troca de abas
    containerAbas.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-aba');
        if (!btn) return;

        containerAbas.querySelectorAll('.btn-aba').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        filtroAtual = btn.dataset.origem;
        renderizarLixeira();
    });

    gridLixeira.addEventListener('click', (e) => {
        const card = e.target.closest('.card-lixeira');
        if (!card) return;
        const id = card.dataset.id;
        const lixeira = JSON.parse(localStorage.getItem('casaTaperaLixeira')) || [];
        const itemLixeira = lixeira.find(it => it.id === id);

        if (e.target.closest('.btn-ver-itens')) {
            const detalhesDiv = card.querySelector('.detalhes-pedido-lixeira');
            const isVisible = detalhesDiv.style.display === 'block';

            if (!isVisible) {
                let tituloLista = 'Itens do Lançamento:';
                if (itemLixeira.tipo === 'pedido') tituloLista = 'Itens do Pedido:';
                else if (itemLixeira.tipo === 'categoria') tituloLista = 'Produtos do Container:';
                else if (itemLixeira.tipo === 'nota') tituloLista = 'Itens da Nota Fiscal:';
                else if (itemLixeira.tipo === 'mesa') tituloLista = 'Consumo da Mesa:';
                else if (itemLixeira.tipo === 'automacao') tituloLista = 'Mensagem da Automação:';

                let listaHtml = `<h4 style="margin-bottom: 10px; color: var(--color-yellow); font-family: 'Bebas Neue', sans-serif;">${tituloLista}</h4><ul style="list-style: none; padding: 0; display: flex; flex-direction: column; width: 100%; gap: 5px;">`;
                
                if (itemLixeira.tipo === 'pedido' || itemLixeira.tipo === 'mesa' || (itemLixeira.tipo === 'nota' && (itemLixeira.dado.items || itemLixeira.dado.itens))) {
                    const itensRaw = itemLixeira.tipo === 'pedido' ? itemLixeira.dado.items : 
                                   (itemLixeira.tipo === 'mesa' ? itemLixeira.dado.data.itens : (itemLixeira.dado.items || itemLixeira.dado.itens));
                    
                    if (itensRaw && !Array.isArray(itensRaw)) {
                        // Tratamento para objetos (Pedidos ou Notas que vieram de pedidos)
                        const nomesOrdenados = Object.keys(itensRaw || {}).sort();
                        nomesOrdenados.forEach(nome => {
                            listaHtml += `<li style="padding: 5px 0; border-bottom: 1px solid #333; display: flex; justify-content: space-between;">
                                <span>${itensRaw[nome].quantity || 1}x ${nome}</span>
                                <span style="color: #888;">R$ ${((itensRaw[nome].price || 0) * (itensRaw[nome].quantity || 1)).toFixed(2).replace('.', ',')}</span>
                            </li>`;
                        });
                    } else if (Array.isArray(itensRaw)) {
                        // Tratamento para arrays (Mesas ou Notas Fiscais padrão)
                        itensRaw.forEach(it => {
                            listaHtml += `<li style="padding: 5px 0; border-bottom: 1px solid #333; display: flex; justify-content: space-between;">
                                <span>${it.qtd || it.quantity || 1}x ${it.nome}</span>
                                <span style="color: #888;">${(parseFloat((it.preco || it.price) * (it.qtd || it.quantity || 1)) || parseFloat(it.preco || it.price) || 0).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                            </li>`;
                        });
                    }
                } else if (itemLixeira.tipo === 'categoria' || itemLixeira.tipo === 'nota') {
                    const itens = itemLixeira.dado.itens || itemLixeira.dado.items;
                    if (itens && Array.isArray(itens)) {
                        // Organização: Ordenação alfabética para Containers e Notas Fiscais
                        const itensOrdenados = [...itens].sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
                        
                        itensOrdenados.forEach(it => {
                            const qtd = it.qtd || it.quantity || 1;
                            const valorItem = parseFloat(it.preco || it.price) || 0;

                            listaHtml += `<li style="padding: 5px 0; border-bottom: 1px solid #333; display: flex; justify-content: space-between;">
                                <span>${qtd}x ${it.nome}</span>
                                <span style="color: #888;">${(valorItem * qtd).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                            </li>`;
                        });
                    } else {
                        // Fallback para notas sem lista de itens explícita (ex: lançamentos de caixa ou emissão de NF)
                        const textoBase = itemLixeira.dado.descricao || itemLixeira.dado.nome || "Lançamento Fiscal";
                        const valorNota = itemLixeira.dado.valorTotal || itemLixeira.dado.valor || 0;

                        // Se a descrição for multi-linha (como as geradas de pedidos), organiza em lista vertical
                        if (textoBase.includes('\n')) {
                            const linhas = textoBase.split('\n');
                            linhas.forEach((linha, idx) => {
                                const itemTexto = linha.trim().replace(/^- /, ''); // Remove hífens de lista
                                if (!itemTexto) return;
                                
                                listaHtml += `<li style="padding: 5px 0; border-bottom: 1px solid #333; display: flex; justify-content: space-between;">
                                    <span>${itemTexto.includes('x ') ? itemTexto : `1x ${itemTexto}`}</span>
                                    <span style="color: #888;">${idx === 0 ? parseFloat(valorNota).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) : '-'}</span>
                                </li>`;
                            });
                        } else {
                            listaHtml += `<li style="padding: 5px 0; border-bottom: 1px solid #333; display: flex; justify-content: space-between;">
                                <span>1x ${textoBase}</span>
                                <span style="color: #888;">${parseFloat(valorNota).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                            </li>`;
                        }
                    }
                }

                // Adiciona o resumo do valor total ao final da lista para Notas Fiscais, Pedidos e Mesas
                const possuiValor = itemLixeira.tipo === 'nota' || itemLixeira.tipo === 'pedido' || itemLixeira.tipo === 'mesa';
                if (possuiValor) {
                    // Busca o valor em diversas chaves possíveis para garantir compatibilidade entre as páginas de origem
                    const valorMesa = itemLixeira.tipo === 'mesa' && itemLixeira.dado.data ? itemLixeira.dado.data.total : 0;
                    const total = parseFloat(itemLixeira.dado.valorTotal || itemLixeira.dado.valor || itemLixeira.dado.valorFinal || valorMesa || 0);
                    const valorFormatado = total > 0 ? total.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) : 'R$ 0,00';
                    listaHtml += `<li style="padding: 12px 8px; margin-top: 8px; border-top: 2px solid var(--color-orange); border-bottom: 2px solid var(--color-orange); display: flex; justify-content: space-between; font-weight: bold; color: white; background: rgba(240, 100, 0, 0.15); font-family: 'Bebas Neue', sans-serif; font-size: 1.35em; border-radius: 4px;">
                        <span>VALOR TOTAL GASTO:</span>
                        <span style="color: var(--color-yellow);">${valorFormatado}</span>
                    </li>`;
                } else if (itemLixeira.tipo === 'automacao') {
                    // Exibe a mensagem da automação sem valor total
                    const textoAutomacao = itemLixeira.dado.texto || itemLixeira.dado.mensagem || 'Mensagem não disponível';
                    const categoriaAutomacao = itemLixeira.dado.categoria || 'Categoria não especificada';
                    listaHtml += `<li style="padding: 15px; border-bottom: 1px solid #333; background: rgba(0, 184, 148, 0.1); border-left: 3px solid #00b894; border-radius: 4px;">
                        <p style="margin: 0; color: #ccc; font-style: italic;">"${textoAutomacao}"</p>
                        <p style="margin: 10px 0 0 0; font-size: 0.85em; color: #888;"><strong>Categoria:</strong> ${categoriaAutomacao}</p>
                    </li>`;
                }

                listaHtml += '</ul>';;
                detalhesDiv.innerHTML = listaHtml;
                detalhesDiv.style.display = 'block';
                e.target.closest('.btn-ver-itens').innerHTML = '<i class="fas fa-times"></i> Fechar';
            } else {
                detalhesDiv.style.display = 'none';
                e.target.closest('.btn-ver-itens').innerHTML = itemLixeira.tipo === 'automacao' ? '<i class="fas fa-list"></i> Ver Mensagem' : '<i class="fas fa-list"></i> Ver Itens';
            }
        }

        if (e.target.closest('.btn-restaurar')) {
            restaurarItem(itemLixeira);
            const novaLixeira = lixeira.filter(it => it.id !== id);
            localStorage.setItem('casaTaperaLixeira', JSON.stringify(novaLixeira));
            
            // Notifica o sistema para sincronização imediata
            window.dispatchEvent(new CustomEvent('cardapioAtualizado'));
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'cardapioTaperaPrecos',
                newValue: localStorage.getItem('cardapioTaperaPrecos')
            }));
            // Notifica especificamente o sistema fiscal
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'notasFiscaisTapera',
                newValue: localStorage.getItem('notasFiscaisTapera')
            }));
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'casaTaperaHistoricoFinanceiro',
                newValue: localStorage.getItem('casaTaperaHistoricoFinanceiro')
            }));

            renderizarLixeira();
            atualizarContadoresAbas();
        }

        if (e.target.closest('.btn-excluir-permanente')) {
            if (confirm('Esta ação é definitiva. Excluir mesmo assim?')) {
                const novaLixeira = lixeira.filter(it => it.id !== id);
                localStorage.setItem('casaTaperaLixeira', JSON.stringify(novaLixeira));
                renderizarLixeira();
                atualizarContadoresAbas();
            }
        }
    });

    function restaurarItem(itemLixeira) {
        const { tipo, dado } = itemLixeira;
        const precos = JSON.parse(localStorage.getItem('cardapioTaperaPrecos')) || {};
        const ordem = JSON.parse(localStorage.getItem('cardapioTaperaOrdemCategorias')) || [];

        if (tipo === 'item') {
            // Restaura o item preservando sua ordem original dentro da categoria
            precos[dado.id] = { ...dado, preco: parseFloat(dado.preco), desativado: false, ordem: dado.ordem !== undefined ? dado.ordem : 999 };
            if (!ordem.includes(dado.categoria)) ordem.push(dado.categoria);

            localStorage.setItem('cardapioTaperaPrecos', JSON.stringify(precos));
            localStorage.setItem('cardapioTaperaOrdemCategorias', JSON.stringify(ordem));
            alert(`"${dado.nome}" foi restaurado no cardápio!`);
        } else if (tipo === 'categoria') {
            if (dado.secao === 'Estoque') {
                const estoque = JSON.parse(localStorage.getItem('casaTaperaEstoque')) || {};
                const novosItens = {};
                // Reconstroi o objeto de itens da categoria do estoque
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
                    chaves.forEach(k => {
                        novoEstoque[k] = (k === dado.nome) ? novosItens : estoque[k];
                    });
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
                
                if (dado.secao && dado.secao !== 'Estoque') {
                    const secoesMap = JSON.parse(localStorage.getItem('cardapioTaperaSecoesMap')) || {};
                    secoesMap[dado.nome] = dado.secao;
                    localStorage.setItem('cardapioTaperaSecoesMap', JSON.stringify(secoesMap));
                }
                alert(`Container "${dado.nome}" restaurado com sucesso!`);
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
                // Reinsere a mesa na ordem original das chaves do objeto para preservar a posição
                keys.splice(dado.originalIndex, 0, dado.id);
                keys.forEach(k => {
                    novoMapa[k] = (k === dado.id) ? dado.data : mesas[k];
                });
                localStorage.setItem('casaTaperaMesasData', JSON.stringify(novoMapa));
            } else {
                // Fallback caso o índice não exista
                mesas[dado.id] = dado.data;
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
        } else if (tipo === 'conta' || tipo === 'cliente' || tipo === 'clientes') {
            const clientes = JSON.parse(localStorage.getItem('clientesCadastradosTapera')) || [];
            if (!clientes.some(c => c.id === dado.id)) {
                // Devolve o cliente para sua posição original na lista de cadastrados
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
                if (dado.originalIndex !== undefined) {
                    pedidos.splice(dado.originalIndex, 0, dado);
                } else {
                    pedidos.push(dado);
                }
                localStorage.setItem('pedidosTapera', JSON.stringify(pedidos));
                alert(`Pedido #${dado.id.substring(7)} restaurado com sucesso!`);
            }
        } else if (tipo === 'nota') {
            const CHAVE_NOTAS = 'notasFiscaisTapera';
            let notas = JSON.parse(localStorage.getItem(CHAVE_NOTAS)) || [];
            
            // Restaura a nota para sua posição original
            if (dado.originalIndex !== undefined && dado.originalIndex <= notas.length) {
                notas.splice(dado.originalIndex, 0, dado);
            } else {
                notas.push(dado);
            }
            localStorage.setItem(CHAVE_NOTAS, JSON.stringify(notas));

            // Sincroniza com EmissaoNotaFiscal.html (mesma aba)
            window.dispatchEvent(new CustomEvent('notasFiscaisAtualizadas', { detail: notas }));
            
            // Sincroniza com outras abas
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'notasFiscaisTapera',
                newValue: JSON.stringify(notas)
            }));

            alert(`Nota Fiscal #${dado.numero} restaurada com sucesso para o histórico de emissão!`);
        }
    }

    btnLimparLixeira.addEventListener('click', () => {
        if (confirm('Deseja apagar permanentemente todos os itens da lixeira?')) {
            localStorage.removeItem('casaTaperaLixeira');
            renderizarLixeira();
            atualizarContadoresAbas();
        }
    });

    renderizarLixeira();
    atualizarContadoresAbas();
});