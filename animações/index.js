document.addEventListener('DOMContentLoaded', () => {
    // --- AJUSTE DE POSICIONAMENTO: STATUS E INFO NO CANTO ESQUERDO ---
    const statusLoja = document.getElementById('status-loja-texto');
    const btnInfo = document.getElementById('btn-info-loja');

    if (statusLoja && btnInfo) {
        const containerTop = statusLoja.parentElement;
        if (containerTop) {
            containerTop.style.display = 'flex';
            containerTop.style.justifyContent = 'flex-start';
            containerTop.style.alignItems = 'center';
            containerTop.style.gap = '0px'; // Remove espaço entre os botões
            containerTop.style.margin = '0';
            containerTop.style.paddingLeft = '0px'; // Cola no canto esquerdo
        }
        statusLoja.style.margin = '0';
        btnInfo.style.margin = '0';
    }

    // --- REMOVER COMPORTAMENTO DE LINK/RETORNO DA LOGO NA INDEX ---
    const logoIndex = document.querySelector('.imagem-logo');
    if (logoIndex) {
        logoIndex.style.cursor = 'default';
        const linkPai = logoIndex.closest('a');
        if (linkPai) {
            linkPai.style.cursor = 'default';
            linkPai.addEventListener('click', (e) => e.preventDefault());
        }
    }

    // --- SCRIPT PARA ATUALIZAR STATUS DA LOJA ---
    const statusElement = document.getElementById('status-loja-texto');
    const statusAtual = localStorage.getItem('casaTaperaStatus') || 'aberto'; // Padrão é 'aberto'
    statusElement.classList.remove('status-aberto', 'status-fechado', 'status-parcial');
    let iconHtml = '';
    let textoStatus = '';
    let classeStatus = '';
    switch (statusAtual) {
        case 'fechado':
            textoStatus = ' Loja Fechada';
            classeStatus = 'status-fechado';
            iconHtml = `<span class="fa-stack"><i class="fas fa-store fa-stack-1x"></i><i class="fas fa-slash fa-stack-1x" style="color: #ff8a8a;"></i></span>`;
            break;
        case 'parcial-delivery-fechado':
            textoStatus = ' Delivery Fechado (Mesa e Retirada OK)';
            classeStatus = 'status-parcial';
            iconHtml = `<span class="fa-stack"><i class="fas fa-motorcycle fa-stack-1x"></i><i class="fas fa-slash fa-stack-1x" style="color: #614d00;"></i></span>`;
            break;
        case 'parcial-mesa-fechada':
            textoStatus = ' Mesas Fechadas (Delivery OK)';
            classeStatus = 'status-parcial';
            iconHtml = `<span class="fa-stack"><i class="fas fa-utensils fa-stack-1x"></i><i class="fas fa-slash fa-stack-1x" style="color: #614d00;"></i></span>`;
            break;
        default: // 'aberto'
            textoStatus = ' Funcionando';
            classeStatus = 'status-aberto';
            iconHtml = '<i class="fas fa-store"></i>';
    }
    statusElement.className = `status-loja ${classeStatus}`;
    statusElement.innerHTML = `${iconHtml}${textoStatus}`;

    // --- SCRIPT PARA MODAL DE INFORMAÇÕES ---
    const modalInfo = document.getElementById('modal-info-loja');
    const btnAbrirInfo = document.getElementById('btn-info-loja');
    const btnFecharInfo = modalInfo.querySelector('.btn-fechar-modal');
    btnAbrirInfo.addEventListener('click', () => modalInfo.classList.remove('oculto'));
    btnFecharInfo.addEventListener('click', () => modalInfo.classList.add('oculto'));
    modalInfo.addEventListener('click', (e) => {
        if (e.target === modalInfo) modalInfo.classList.add('oculto');
    });

    // --- SCRIPT PARA HORÁRIOS DINÂMICOS E DESTAQUE DO DIA ATUAL ---
    const containerHorarios = document.getElementById('lista-horarios-modal');
    const diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const diaAtualIndex = new Date().getDay();

    const horariosPadrao = {
        0: { abertura: '08:00', fechamento: '22:00' }, 1: { fechado: true }, 2: { fechado: true },
        3: { abertura: '17:00', fechamento: '22:00' }, 4: { abertura: '17:00', fechamento: '22:00' },
        5: { abertura: '17:00', fechamento: '22:00' }, 6: { abertura: '08:00', fechamento: '22:00' }
    };

    const horariosSalvos = JSON.parse(localStorage.getItem('casaTaperaHorarios')) || horariosPadrao;

    containerHorarios.innerHTML = diasDaSemana.map((dia, index) => {
        const horario = horariosSalvos[index] || {};
        let textoHorario;

        if (horario.fechado) {
            textoHorario = 'Fechado';
        } else {
            textoHorario = `${horario.abertura || 'N/A'} - ${horario.fechamento || 'N/A'}`;
        }

        // Adiciona a classe de destaque se for o dia atual
        if (index === diaAtualIndex) {
            return `<li class="dia-atual"><strong>${dia}:</strong> <span>${textoHorario}</span></li>`;
        }
        return `<li><strong>${dia}:</strong> <span>${textoHorario}</span></li>`;

    }).join('');

    // --- SISTEMA DE ABAS PARA O CARDÁPIO (CLIENTE) ---
    const gridCardapio = document.getElementById('grid-cardapio');
    const secoesMontagem = document.querySelectorAll('.secao-hamburguer, .secao-pastel, .titulo-montagem');

    // Injeta as abas logo após o título da seção de cardápio
    const menuTabsHTML = `
        <div class="container-abas" id="abas-menu-cliente" style="margin-top: 20px;">
            <button class="btn-aba active" data-aba="cardapio">Cardápio Geral</button>
            <button class="btn-aba" data-aba="montagem">Estação de Montagem</button>
        </div>
    `;
    
    const tituloSecao = document.querySelector('.secao-cardapio .titulo-principal');
    if (tituloSecao) tituloSecao.insertAdjacentHTML('afterend', menuTabsHTML);

    function trocarAbaIndex(aba) {
        if (aba === 'montagem') {
            if (gridCardapio) gridCardapio.style.display = 'none';
            secoesMontagem.forEach(s => s.style.display = 'block');
        } else {
            if (gridCardapio) gridCardapio.style.display = 'grid';
            secoesMontagem.forEach(s => s.style.display = 'none');
        }
    }

    document.getElementById('abas-menu-cliente')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-aba');
        if (!btn) return;
        document.querySelectorAll('#abas-menu-cliente .btn-aba').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        trocarAbaIndex(btn.dataset.aba);
    });

    // Inicializa ocultando a montagem
    trocarAbaIndex('cardapio');

    // --- FUNÇÃO PARA RENDERIZAR CARDÁPIO DINAMICAMENTE ---
    function renderizarCardapioDinamico() {
        // Se o cardápio estiver vazio (primeiro acesso), carrega os itens padrão da Casa Tapera
        if (!localStorage.getItem('cardapioTaperaPrecos')) {
            const dadosIniciais = {
                "hamburguer-carne-artesanal": { nome: "Hambúrguer de Carne", preco: 20.00, categoria: "Hambúrgueres", ordem: 1 },
                "hamburguer-frango-artesanal": { nome: "Hambúrguer de Frango", preco: 22.00, categoria: "Hambúrgueres", ordem: 2 },
                "batata-p": { nome: "Batata P", preco: 8.00, categoria: "Acompanhamentos", ordem: 3 },
                "batata-m": { nome: "Batata M", preco: 10.00, categoria: "Acompanhamentos", ordem: 4 },
                "pastel-carne": { nome: "Pastel de Carne", preco: 12.00, categoria: "Pastéis Salgados", ordem: 5 },
                "pastel-chocolate": { nome: "Pastel de Chocolate", preco: 15.00, categoria: "Pastéis Doces", ordem: 6 },
                "coca-cola-lata": { nome: "Coca-Cola Lata 350ml", preco: 7.00, categoria: "Bebidas", ordem: 7 },
                "suco-laranja": { nome: "Suco de Laranja", preco: 6.00, categoria: "Sucos Naturais", ordem: 8 }
            };
            localStorage.setItem('cardapioTaperaPrecos', JSON.stringify(dadosIniciais));
            
            const ordemCategorias = [
                "Hambúrgueres", 
                "Acompanhamentos", 
                "Pastéis Salgados", 
                "Pastéis Doces", 
                "Sucos Naturais", 
                "Bebidas"
            ];
            localStorage.setItem('cardapioTaperaOrdemCategorias', JSON.stringify(ordemCategorias));
        }

        const cardapioSalvo = JSON.parse(localStorage.getItem('cardapioTaperaPrecos')) || {};
        const ordemSalvaRaw = localStorage.getItem('cardapioTaperaOrdemCategorias');
        
        if (Object.keys(cardapioSalvo).length === 0 && !ordemSalvaRaw) return; // Se não há dados, mantém o padrão
        
        // Agrupar itens por categoria, mantendo a ordem
        const itensPorCategoria = {};
        let itensOrdenados = Object.values(cardapioSalvo)
            .filter(item => !item.desativado)
            .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
        
        itensOrdenados.forEach(item => {
            const catNome = item.categoria.trim();
            if (!itensPorCategoria[catNome]) {
                itensPorCategoria[catNome] = [];
            }
            itensPorCategoria[catNome].push(item);
        });
        
        // 1. Obtém a ordem das categorias salva (inclui categorias recém-criadas)
        const ordemSalva = (JSON.parse(ordemSalvaRaw) || []).map(c => c.trim());
        const categoriasNoData = Object.keys(itensPorCategoria);
        
        // 2. Constrói a lista de categorias para processar (Prioridade para a ordem salva + novas categorias encontradas nos itens)
        let categoriasParaRenderizar = [...ordemSalva];
        categoriasNoData.forEach(cat => {
            if (!categoriasParaRenderizar.includes(cat)) {
                categoriasParaRenderizar.push(cat);
            }
        });

        // 3. Se a lista estiver vazia e não houver personalização, usa o padrão do sistema
        if (categoriasParaRenderizar.length === 0) {
            categoriasParaRenderizar = ['Hambúrgueres', 'Acompanhamentos', 'Pães e Cucas', 'Pastéis Salgados', 'Pastéis Doces', 'Sucos Naturais', 'Bebidas'];
        }

        // 4. Filtra apenas as categorias que têm itens ativos para exibição no cardápio do cliente
        // Removemos categorias de montagem do Cardápio Geral para que fiquem apenas na aba de Montagem
        const montagemKeywords = ['monte seu', 'montagem', 'ingredientes', 'adicionais'];
        
        const categoriasComItens = categoriasParaRenderizar.filter(nome => {
            const nomeTrim = nome.trim();
            const nomeLower = nomeTrim.toLowerCase();
            const ehMontagem = montagemKeywords.some(key => nomeLower.includes(key));
            return !ehMontagem && itensPorCategoria[nomeTrim] && itensPorCategoria[nomeTrim].length > 0;
        });

        // Distribui as categorias entre as 3 colunas dinamicamente
        const categoriasColuna = { 'coluna1': [], 'coluna2': [], 'coluna3': [] };
        
        categoriasComItens.forEach((nomeCat, index) => {
            const numColuna = (index % 3) + 1; // Distribui 1, 2, 3, 1, 2, 3...
            categoriasColuna[`coluna${numColuna}`].push(nomeCat);
        });
        
        // Função auxiliar para gerar HTML de um item
        function gerarItemHTML(item) {
            const precoFormatado = typeof item.preco === 'number' ? 
                item.preco.toFixed(2).replace('.', ',') : 
                item.preco.replace('.', ',');
            
            const imgUrl = item.imagem || '../imagens/Logo_Tapera.jpeg';

            return `
                <li class="item-cardapio-interativo" data-name="${item.nome}" data-price="${parseFloat(item.preco).toFixed(2)}">
                    <img src="${imgUrl}" alt="${item.nome}" class="img-item-cardapio" loading="lazy" onerror="this.src='../imagens/Logo_Tapera.jpeg'">
                    <div class="detalhes-item">
                        <span class="nome-item">${item.nome}</span>
                    </div>
                    <div class="acoes-item-cardapio">
                        <span class="preco">R$${precoFormatado}</span>
                        <button class="btn-favorito" title="Adicionar aos Favoritos"><i class="far fa-heart"></i></button>
                    </div>
                </li>
            `;
        }
        
        // Renderizar cada coluna
        Object.entries(categoriasColuna).forEach(([colunaId, categoriasLista]) => {
            const coluna = document.querySelector(`.coluna-cardapio[data-coluna="${colunaId}"]`);
            if (!coluna) return;
            
            let htmlConteudo = '';
            categoriasLista.forEach(nomeCategoria => {
                const nomeTrim = nomeCategoria.trim();
                if (itensPorCategoria[nomeTrim]) {
                    htmlConteudo += `<h3 class="titulo-subsecao">${nomeCategoria}</h3><ul class="lista-cardapio">`;
                    
                    itensPorCategoria[nomeTrim].forEach(item => {
                        htmlConteudo += gerarItemHTML(item);
                    });
                    
                    htmlConteudo += '</ul><br>';
                }
            });
            
            // Inserir HTML mantendo a imagem e estrutura existente
            const imagemCardapio = coluna.querySelector('.imagem-cardapio');
            if (imagemCardapio) {
                imagemCardapio.insertAdjacentHTML('afterend', htmlConteudo);
            } else {
                coluna.innerHTML = htmlConteudo;
            }
        });
    }
    
    // --- FUNÇÃO PARA ATUALIZAR PREÇOS E STATUS DOS ITENS ---
    function atualizarCardapio() {
        const cardapioSalvo = JSON.parse(localStorage.getItem('cardapioTaperaPrecos')) || {};
        
        // Se há dados novos salvos, renderiza dinamicamente
        const temDadosCustomizados = Object.keys(cardapioSalvo).length > 0 || localStorage.getItem('cardapioTaperaOrdemCategorias');
        
        if (temDadosCustomizados) {
            // Limpa TODO o conteúdo antigo das colunas antes de renderizar a nova ordem
            document.querySelectorAll('.coluna-cardapio').forEach(coluna => {
                coluna.querySelectorAll('.titulo-subsecao, .lista-cardapio, br').forEach(el => el.remove());
            });
            
            renderizarCardapioDinamico();
        }
        
        // Se renderizamos dinamicamente, não precisamos do loop abaixo nos itens hardcoded, 
        // pois o renderizador já usou os preços corretos.
        if (temDadosCustomizados) return;

        document.querySelectorAll('.item-cardapio-interativo').forEach(itemElement => {
            const nomeItem = itemElement.dataset.name;
            const itemSalvo = Object.values(cardapioSalvo).find(item => 
                nomeItem.toLowerCase().includes(item.nome.toLowerCase())
            );

            if (itemSalvo) {
                if (itemSalvo.desativado) {
                    itemElement.style.display = 'none';
                } else {
                    const novoPreco = itemSalvo.preco;
                    itemElement.dataset.price = novoPreco.toFixed(2);
                    itemElement.querySelector('.preco').textContent = 
                        `R$${novoPreco.toFixed(2).replace('.', ',')}`;
                    itemElement.style.display = '';
                }
            }
        });
    }
    
    // Executar atualização inicial
    atualizarCardapio();
    
    // --- MONITORAR MUDANÇAS NO LOCALSTORAGE (OUTRO ABA/JANELA) ---
    window.addEventListener('storage', (event) => {
        if (event.key === 'cardapioTaperaPrecos' || event.key === 'cardapioTaperaOrdemCategorias') {
            console.log('Cardápio foi atualizado em outra aba. Sincronizando...');
            atualizarCardapio();
        }
    });
    
    // --- OUVIR EVENTO CUSTOMIZADO (MESMA ABA) ---
    window.addEventListener('cardapioAtualizado', (event) => {
        console.log('Evento de atualização de cardápio detectado!');
        setTimeout(() => {
            atualizarCardapio();
        }, 500);
    });
    
    // --- MONITORAR QUANDO O USUÁRIO VOLTA DA PÁGINA DE PERSONALIZAÇÃO ---
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // Página se tornou visível novamente
            console.log('Página ficou visível novamente. Sincronizando cardápio...');
            atualizarCardapio();
        }
    });
    
    // --- VERIFICAR MUDANÇAS A CADA 30 SEGUNDOS (BACKUP) ---
    setInterval(() => {
        const cardapioAtualizado = localStorage.getItem('cardapioTaperaPrecos');
        if (cardapioAtualizado && Object.keys(JSON.parse(cardapioAtualizado)).length > 0) {
            atualizarCardapio();
        }
    }, 30000);
});