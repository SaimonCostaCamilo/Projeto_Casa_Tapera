/**
 * RENDERIZADOR DINÂMICO DO CARDÁPIO PARA INDEX.HTML
 * ==================================================
 * Este arquivo carrega os dados do localStorage via CardapioSync
 * e renderiza o cardápio dinamicamente no index.html
 * 
 * Funcionalidades:
 * - Atualiza automaticamente quando dados mudam
 * - Permite adicionar novas categorias
 * - Sincroniza com CardapioPersonalizar.js em tempo real
 */

const CardapioRenderizadorIndex = {
    containerId: 'grid-cardapio',
    novosCategorias: [],

    /**
     * Inicializa o renderizador
     */
    inicializar: function() {
        // Aguarda o CardapioSync estar disponível
        if (typeof CardapioSync === 'undefined') {
            console.warn('CardapioSync não carregado ainda. Tentando novamente em 500ms...');
            setTimeout(() => this.inicializar(), 500);
            return;
        }

        this.renderizarCardapio();
        this.escutarMudancas();
        this.adicionarBotaoNovaCategoria();
    },

    /**
     * Renderiza todo o cardápio no HTML
     */
    renderizarCardapio: function() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.warn('Container de cardápio não encontrado. Aguardando...');
            setTimeout(() => this.renderizarCardapio(), 500);
            return;
        }

        const itensPorCategoria = CardapioSync.obterItensPorCategoria();
        const ordem = CardapioSync.obterOrdemCategorias();

        // Ordena categorias
        // Filtro: No index, removemos categorias de montagem do grid principal,
        // pois elas agora têm seções próprias ou aparecem na outra aba.
        const montagemKeywords = ['monte seu', 'montagem', 'ingredientes', 'adicionais'];
        const categoriasOrdenadas = ordem.filter(cat => {
            const nomeLower = cat.toLowerCase();
            return itensPorCategoria[cat] && !montagemKeywords.some(key => nomeLower.includes(key));
        });
        
        // Limpa o container mantendo apenas a estrutura base (sem remover elementos fora do grid)
        // Salva elementos especiais que não devem ser removidos
        const elementosEspeciais = container.querySelectorAll('[data-nao-renderizar]');
        const htmlEspeciais = Array.from(elementosEspeciais).map(el => el.outerHTML);
        
        // Remove apenas as colunas antigas (div.coluna-cardapio)
        container.querySelectorAll('.coluna-cardapio').forEach(col => col.remove());

        // Renderiza cada categoria como uma coluna
        categoriasOrdenadas.forEach(categoria => {
            const itens = itensPorCategoria[categoria];
            const colunaHtml = this.gerarColuna(categoria, itens);
            container.insertAdjacentHTML('beforeend', colunaHtml);
        });

        this.anexarEventosCardapio();
    },

    /**
     * Gera o HTML de uma coluna de categoria
     */
    gerarColuna: function(categoria, itens) {
        const nomeSeguro = this.sanitizarTexto(categoria);
        const tituloFormatado = categoria.toUpperCase();
        
        let itensHtml = itens
            .map(item => this.gerarItemCardapio(item, categoria))
            .join('');

        return `
            <div class="coluna-cardapio" data-categoria="${nomeSeguro}">
                <h3 class="titulo-subsecao">${tituloFormatado}</h3>
                <div class="acomp-bebidas" style="width: 100%;">
                    <ul class="lista-cardapio">
                        ${itensHtml}
                    </ul>
                </div>
                <hr class="divisor-secao">
            </div>
        `;
    },

    /**
     * Gera o HTML de um item individual
     */
    gerarItemCardapio: function(item, categoria) {
        const precoFormatado = parseFloat(item.preco).toFixed(2);
        const precoExibicao = precoFormatado.replace('.', ',');
        const nomeFormatado = item.nome.toUpperCase();
        
        return `
            <li class="item-cardapio-interativo" data-name="${item.nome}" data-price="${precoFormatado}">
                <div class="detalhes-item">
                    <span class="nome-item">${nomeFormatado}</span>
                </div>
                <div class="acoes-item-cardapio">
                    <span class="preco">R$${precoExibicao}</span>
                    <button class="btn-favorito" title="Adicionar aos Favoritos"><i class="far fa-heart"></i></button>
                </div>
            </li>
        `;
    },

    /**
     * Sanitiza texto para uso em atributos
     */
    sanitizarTexto: function(texto) {
        return texto
            .toLowerCase()
            .replace(/[áàâã]/g, 'a')
            .replace(/[éè]/g, 'e')
            .replace(/[íì]/g, 'i')
            .replace(/[óòôõ]/g, 'o')
            .replace(/[úù]/g, 'u')
            .replace(/[ç]/g, 'c')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
    },

    /**
     * Anexa eventos aos itens do cardápio
     */
    anexarEventosCardapio: function() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // Reativa funcionalidades existentes dos itens
        const itens = container.querySelectorAll('.item-cardapio-interativo');
        
        itens.forEach(item => {
            // Adiciona ao carrinho ao clicar
            const botaoFavorito = item.querySelector('.btn-favorito');
            if (botaoFavorito && !botaoFavorito.hasListener) {
                botaoFavorito.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Triggers existing cart functionality if it exists
                    const nomeItem = item.getAttribute('data-name');
                    const precoItem = item.getAttribute('data-price');
                    
                    // Verifica se existe função de adicionar ao carrinho
                    if (typeof adicionarAoCarrinho === 'function') {
                        adicionarAoCarrinho(nomeItem, parseFloat(precoItem));
                    }
                    
                    // Toggle favorito (se função existir)
                    if (typeof toggleFavorito === 'function') {
                        toggleFavorito(botaoFavorito, nomeItem, precoItem);
                    }
                });
                botaoFavorito.hasListener = true;
            }
        });
    },

    /**
     * Ouve mudanças no cardápio via localStorage
     */
    escutarMudancas: function() {
        // Ouve eventos customizados do CardapioSync
        document.addEventListener('cardapioAtualizado', (e) => {
            console.log('Cardápio atualizado:', e.detail);
            // Re-renderiza apenas a categoria afetada (otimização)
            this.renderizarCardapio();
        });

        document.addEventListener('categoriaAdicionada', (e) => {
            console.log('Categoria adicionada:', e.detail);
            this.renderizarCardapio();
        });

        document.addEventListener('categoriasReordenadas', (e) => {
            console.log('Categorias reordenadas');
            this.renderizarCardapio();
        });

        document.addEventListener('cardapioRessetado', () => {
            console.log('Cardápio resetado');
            this.renderizarCardapio();
        });

        // Ouve mudanças no localStorage de outras abas
        window.addEventListener('storage', (e) => {
            if (e.key === CardapioSync.CHAVES.precos || e.key === CardapioSync.CHAVES.ordemCategorias) {
                console.log('Mudanças detectadas de outra aba. Atualizando...');
                this.renderizarCardapio();
            }
        });
    },

    /**
     * Adiciona botão para nova categoria
     */
    adicionarBotaoNovaCategoria: function() {
        const cabecalho = document.querySelector('.cabecalho-secao-cardapio');
        if (!cabecalho || document.getElementById('btn-nova-categoria')) return;

        const botao = document.createElement('button');
        botao.id = 'btn-nova-categoria';
        botao.className = 'btn-nova-categoria';
        botao.innerHTML = '<i class="fas fa-plus"></i> Nova Categoria';
        botao.setAttribute('title', 'Adicionar nova categoria ao cardápio');
        
        botao.addEventListener('click', () => this.mostrarModalNovaCategoria());
        
        // Adiciona estilo CSS se não existir
        if (!document.getElementById('estilo-nova-categoria')) {
            const style = document.createElement('style');
            style.id = 'estilo-nova-categoria';
            style.textContent = `
                .btn-nova-categoria {
                    background-color: #f06400;
                    color: #fff;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 1em;
                    margin: 10px 0;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    transition: background-color 0.3s;
                }
                .btn-nova-categoria:hover {
                    background-color: #ff8533;
                }
                .modal-nova-categoria {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                }
                .modal-nova-categoria.oculto {
                    display: none;
                }
                .modal-conteudo-categoria {
                    background: #1a1a1a;
                    padding: 30px;
                    border-radius: 10px;
                    border: 2px solid #f06400;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.9);
                }
                .modal-conteudo-categoria h3 {
                    color: #ffc600;
                    font-family: 'Bebas Neue', sans-serif;
                    margin-bottom: 20px;
                    font-size: 1.5em;
                }
                .modal-conteudo-categoria input {
                    width: 100%;
                    padding: 10px;
                    margin-bottom: 15px;
                    border: 1px solid #444;
                    border-radius: 5px;
                    background: #222;
                    color: #fff;
                    font-family: 'Roboto', sans-serif;
                    box-sizing: border-box;
                }
                .modal-conteudo-categoria input:focus {
                    outline: none;
                    border-color: #f06400;
                }
                .modal-botoes-categoria {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                }
                .modal-botoes-categoria button {
                    flex: 1;
                    padding: 10px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-family: 'Roboto', sans-serif;
                    font-weight: bold;
                    transition: all 0.3s;
                }
                .btn-confirmar-categoria {
                    background-color: #f06400;
                    color: #fff;
                }
                .btn-confirmar-categoria:hover {
                    background-color: #ff8533;
                }
                .btn-cancelar-categoria {
                    background-color: #444;
                    color: #fff;
                }
                .btn-cancelar-categoria:hover {
                    background-color: #555;
                }
            `;
            document.head.appendChild(style);
        }

        cabecalho.appendChild(botao);
    },

    /**
     * Mostra modal para adicionar nova categoria
     */
    mostrarModalNovaCategoria: function() {
        // Cria modal
        const modal = document.createElement('div');
        modal.className = 'modal-nova-categoria';
        modal.innerHTML = `
            <div class="modal-conteudo-categoria">
                <h3>Nova Categoria</h3>
                <input type="text" id="input-nome-categoria" placeholder="Digite o nome da categoria" autofocus>
                <div class="modal-botoes-categoria">
                    <button class="btn-confirmar-categoria">Adicionar</button>
                    <button class="btn-cancelar-categoria">Cancelar</button>
                </div>
            </div>
        `;

        const btnConfirmar = modal.querySelector('.btn-confirmar-categoria');
        const btnCancelar = modal.querySelector('.btn-cancelar-categoria');
        const inputNome = modal.querySelector('#input-nome-categoria');

        btnConfirmar.addEventListener('click', () => {
            const nomeCat = inputNome.value.trim();
            if (nomeCat.length > 0) {
                CardapioSync.adicionarCategoria(nomeCat);
                modal.remove();
                alert(`Categoria "${nomeCat}" adicionada com sucesso! Agora você pode adicionar itens a ela em "Personalizar Cardápio".`);
            } else {
                alert('Por favor, insira um nome para a categoria.');
            }
        });

        btnCancelar.addEventListener('click', () => modal.remove());

        inputNome.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') btnConfirmar.click();
        });

        document.body.appendChild(modal);
    },

    /**
     * Remove uma categoria
     */
    removerCategoria: function(nomeCat) {
        if (confirm(`Tem certeza que deseja remover a categoria "${nomeCat}"?`)) {
            const ordem = CardapioSync.obterOrdemCategorias();
            const novaOrdem = ordem.filter(cat => cat !== nomeCat);
            CardapioSync.reordenarCategorias(novaOrdem);
        }
    }
};

// Inicializa quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        CardapioRenderizadorIndex.inicializar();
    });
} else {
    CardapioRenderizadorIndex.inicializar();
}
