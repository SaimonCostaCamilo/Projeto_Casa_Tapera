/**
 * GERENCIADOR DE SINCRONIZAÇÃO DO CARDÁPIO
 * ==========================================
 * Este arquivo gerencia a sincronização automática de dados entre
 * CardapioPersonalizar.js e index.html usando localStorage.
 * 
 * Funcionalidades:
 * - Sincroniza preços e dados dos itens
 * - Gerencia ordem de categorias
 * - Permite adicionar novas categorias no index
 * - Atualiza automaticamente quando dados mudam
 */

const CardapioSync = {
    // Chaves do localStorage
    CHAVES: {
        precos: 'cardapioTaperaPrecos',
        ordemCategorias: 'cardapioTaperaOrdemCategorias',
        novasCategorias: 'cardapioTaperaCategorias' // Para novas categorias adicionadas no index
    },

    /**
     * Inicializa os dados do cardápio no localStorage
     * Chamado na primeira vez ou quando precisa resetar
     */
    inicializarDados: function() {
        if (!localStorage.getItem(this.CHAVES.precos)) {
            const cardapioPadrao = this.obterCardapioPadrao();
            localStorage.setItem(this.CHAVES.precos, JSON.stringify(cardapioPadrao.precos));
            localStorage.setItem(this.CHAVES.ordemCategorias, JSON.stringify(cardapioPadrao.ordem));
        }
    },

    /**
     * Retorna o cardápio padrão (dados iniciais)
     */
    obterCardapioPadrao: function() {
        return {
            precos: {
                'hamburguer-carne-artesanal': { nome: 'Hambúrguer de Carne', preco: 20.00, categoria: 'Hambúrgueres', ordem: 0, desativado: false },
                'hamburguer-frango-artesanal': { nome: 'Hambúrguer de Frango', preco: 22.00, categoria: 'Hambúrgueres', ordem: 1, desativado: false },
                'hamburguer-bacon-artesanal': { nome: 'Hambúrguer de Bacon', preco: 25.00, categoria: 'Hambúrgueres', ordem: 2, desativado: false },
                'hamburguer-vegano': { nome: 'Hambúrguer Vegano', preco: 25.00, categoria: 'Hambúrgueres', ordem: 3, desativado: false },
                
                'acompanhamento-batata-p': { nome: 'Batata P', preco: 8.00, categoria: 'Acompanhamentos', ordem: 0, desativado: false },
                'acompanhamento-batata-m': { nome: 'Batata M', preco: 10.00, categoria: 'Acompanhamentos', ordem: 1, desativado: false },
                'acompanhamento-batata-g': { nome: 'Batata G', preco: 15.00, categoria: 'Acompanhamentos', ordem: 2, desativado: false },
                
                'pao-artesanal': { nome: 'Pão Artesanal 500g', preco: 20.00, categoria: 'Pães e Cucas', ordem: 0, desativado: false },
                'cuca-goiabada': { nome: 'Cuca de Goiabada 500g', preco: 15.00, categoria: 'Pães e Cucas', ordem: 1, desativado: false },
                'cuca-doce-leite': { nome: 'Cuca de Doce de Leite 500g', preco: 17.00, categoria: 'Pães e Cucas', ordem: 2, desativado: false },
                
                'pastel-carne': { nome: 'Pastel de Carne', preco: 12.00, categoria: 'Pastéis Salgados', ordem: 0, desativado: false },
                'pastel-frango-catupiry': { nome: 'Pastel de Frango c/ Catupiry', preco: 12.00, categoria: 'Pastéis Salgados', ordem: 1, desativado: false },
                'pastel-calabresa': { nome: 'Pastel de Calabresa', preco: 12.00, categoria: 'Pastéis Salgados', ordem: 2, desativado: false },
                'pastel-queijo-oregano': { nome: 'Pastel de Queijo c/ Orégano', preco: 12.00, categoria: 'Pastéis Salgados', ordem: 3, desativado: false },
                'pastel-queijo': { nome: 'Pastel de Queijo', preco: 12.00, categoria: 'Pastéis Salgados', ordem: 4, desativado: false },
                
                'pastel-chocolate': { nome: 'Pastel Chocolate ao Leite', preco: 15.00, categoria: 'Pastéis Doces', ordem: 0, desativado: false },
                'pastel-romeu-julieta': { nome: 'Pastel Romeu e Julieta', preco: 14.00, categoria: 'Pastéis Doces', ordem: 1, desativado: false },
                'pastel-creme-ninho': { nome: 'Pastel Creme Ninho', preco: 15.00, categoria: 'Pastéis Doces', ordem: 2, desativado: false },
                'pastel-stikadinho': { nome: 'Pastel Stikadinho', preco: 17.00, categoria: 'Pastéis Doces', ordem: 3, desativado: false },
                'pastel-ouro-branco': { nome: 'Pastel de Ouro Branco', preco: 15.00, categoria: 'Pastéis Doces', ordem: 4, desativado: false },
                'pastel-oreo': { nome: 'Pastel de Oreo', preco: 15.00, categoria: 'Pastéis Doces', ordem: 5, desativado: false },
                'pastel-kitkat': { nome: 'Pastel de Kit-Kat', preco: 17.00, categoria: 'Pastéis Doces', ordem: 6, desativado: false },
                'pastel-sonho-valsa': { nome: 'Pastel de Sonho de Valsa', preco: 15.00, categoria: 'Pastéis Doces', ordem: 7, desativado: false },
                
                'suco-laranja': { nome: 'Suco de Laranja', preco: 6.00, categoria: 'Sucos Naturais', ordem: 0, desativado: false },
                'suco-limao': { nome: 'Suco de Limão', preco: 6.00, categoria: 'Sucos Naturais', ordem: 1, desativado: false },
                'suco-manga': { nome: 'Suco de Manga', preco: 8.00, categoria: 'Sucos Naturais', ordem: 2, desativado: false },
                'suco-maracuja': { nome: 'Suco de Maracujá', preco: 8.00, categoria: 'Sucos Naturais', ordem: 3, desativado: false },
                'suco-abacaxi': { nome: 'Suco de Abacaxi', preco: 8.00, categoria: 'Sucos Naturais', ordem: 4, desativado: false },
                
                'coca-lata': { nome: 'Coca-Cola Lata 350ml', preco: 7.00, categoria: 'Bebidas', ordem: 0, desativado: false },
                'refrigerante-lata': { nome: 'Refrigerantes Lata 350ml', preco: 6.00, categoria: 'Bebidas', ordem: 1, desativado: false },
                'agua-gas': { nome: 'Água c/ Gás', preco: 3.50, categoria: 'Bebidas', ordem: 2, desativado: false },
                'agua-sem-gas': { nome: 'Água s/ Gás', preco: 3.00, categoria: 'Bebidas', ordem: 3, desativado: false }
            },
            ordem: ['Hambúrgueres', 'Acompanhamentos', 'Pães e Cucas', 'Pastéis Salgados', 'Pastéis Doces', 'Sucos Naturais', 'Bebidas']
        };
    },

    /**
     * Obtém todos os itens do cardápio do localStorage
     */
    obterTodosItens: function() {
        const cardapioSalvo = JSON.parse(localStorage.getItem(this.CHAVES.precos));
        return cardapioSalvo || this.obterCardapioPadrao().precos;
    },

    /**
     * Obtém itens agrupados por categoria
     */
    obterItensPorCategoria: function() {
        const itens = this.obterTodosItens();
        const agrupado = {};

        Object.entries(itens).forEach(([id, item]) => {
            if (!item.desativado) { // Ignora itens desativados
                const categoria = item.categoria.trim();
                if (!agrupado[categoria]) {
                    agrupado[categoria] = [];
                }
                agrupado[categoria].push({ ...item, id });
            }
        });

        return agrupado;
    },

    /**
     * Obtém a ordem das categorias
     */
    obterOrdemCategorias: function() {
        return JSON.parse(localStorage.getItem(this.CHAVES.ordemCategorias)) || 
               this.obterCardapioPadrao().ordem;
    },

    /**
     * Atualiza preço de um item
     */
    atualizarPreco: function(itemId, novoPreco) {
        const itens = this.obterTodosItens();
        if (itens[itemId]) {
            itens[itemId].preco = parseFloat(novoPreco);
            localStorage.setItem(this.CHAVES.precos, JSON.stringify(itens));
            // Dispara evento customizado
            document.dispatchEvent(new CustomEvent('cardapioAtualizado', { detail: { itemId, novoPreco } }));
        }
    },

    /**
     * Atualiza nome de um item
     */
    atualizarNome: function(itemId, novoNome) {
        const itens = this.obterTodosItens();
        if (itens[itemId]) {
            itens[itemId].nome = novoNome;
            localStorage.setItem(this.CHAVES.precos, JSON.stringify(itens));
            document.dispatchEvent(new CustomEvent('cardapioAtualizado', { detail: { itemId, novoNome } }));
        }
    },

    /**
     * Oculta/mostra um item
     */
    alternarVisibilidade: function(itemId, desativado) {
        const itens = this.obterTodosItens();
        if (itens[itemId]) {
            itens[itemId].desativado = desativado;
            localStorage.setItem(this.CHAVES.precos, JSON.stringify(itens));
            document.dispatchEvent(new CustomEvent('cardapioAtualizado', { detail: { itemId, desativado } }));
        }
    },

    /**
     * Remove um item do cardápio
     */
    removerItem: function(itemId) {
        const itens = this.obterTodosItens();
        delete itens[itemId];
        localStorage.setItem(this.CHAVES.precos, JSON.stringify(itens));
        document.dispatchEvent(new CustomEvent('cardapioAtualizado', { detail: { itemId, acao: 'removido' } }));
    },

    /**
     * Adiciona um novo item ao cardápio
     */
    adicionarItem: function(itemId, nome, preco, categoria) {
        const itens = this.obterTodosItens();
        const ordem = Object.values(itens)
            .filter(item => item.categoria === categoria)
            .length;

        itens[itemId] = {
            nome,
            preco: parseFloat(preco),
            categoria,
            ordem,
            desativado: false
        };

        localStorage.setItem(this.CHAVES.precos, JSON.stringify(itens));
        
        // Adiciona categoria à lista se não existir
        this.adicionarCategoria(categoria);
        
        document.dispatchEvent(new CustomEvent('cardapioAtualizado', { detail: { itemId, acao: 'adicionado' } }));
    },

    /**
     * Adiciona uma nova categoria
     */
    adicionarCategoria: function(nomeCat) {
        const ordem = this.obterOrdemCategorias();
        if (!ordem.includes(nomeCat)) {
            ordem.push(nomeCat);
            localStorage.setItem(this.CHAVES.ordemCategorias, JSON.stringify(ordem));
            document.dispatchEvent(new CustomEvent('categoriaAdicionada', { detail: { categoria: nomeCat } }));
        }
    },

    /**
     * Obtém todas as categorias existentes
     */
    obterCategorias: function() {
        const ordem = this.obterOrdemCategorias();
        const itens = this.obterTodosItens();
        
        // Adiciona categorias que possam estar nos itens mas não na ordem
        const categoriasNosItens = new Set(Object.values(itens).map(it => it.categoria));
        const todas = new Set([...ordem, ...categoriasNosItens]);
        
        return Array.from(todas);
    },

    /**
     * Reordena as categorias
     */
    reordenarCategorias: function(novaOrdem) {
        localStorage.setItem(this.CHAVES.ordemCategorias, JSON.stringify(novaOrdem));
        document.dispatchEvent(new CustomEvent('categoriasReordenadas', { detail: { novaOrdem } }));
    },

    /**
     * Limpa todos os dados e volta ao padrão
     */
    resetarCardapio: function() {
        const padrao = this.obterCardapioPadrao();
        localStorage.setItem(this.CHAVES.precos, JSON.stringify(padrao.precos));
        localStorage.setItem(this.CHAVES.ordemCategorias, JSON.stringify(padrao.ordem));
        document.dispatchEvent(new CustomEvent('cardapioRessetado'));
    },

    /**
     * Exporta os dados do cardápio como JSON (para backup)
     */
    exportarDados: function() {
        return {
            precos: this.obterTodosItens(),
            ordem: this.obterOrdemCategorias(),
            dataExportacao: new Date().toISOString()
        };
    }
};

// Inicializa dados ao carregar o script
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        CardapioSync.inicializarDados();
    });
}
