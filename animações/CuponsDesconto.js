document.addEventListener('DOMContentLoaded', () => {
    const formCriarCupom = document.getElementById('form-criar-cupom');
    const listaCuponsContainer = document.getElementById('lista-cupons-ativos');
    const templateCupomCard = document.getElementById('template-cupom-card');
    const mensagemSemCupons = document.querySelector('.sem-cupons-mensagem');

    const CHAVE_STORAGE_CUPONS = 'casaTaperaCupons';

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

    // Carrega e exibe os cupons existentes ao carregar a página
    carregarECarregarCupons();

    // Evento para criar um novo cupom
    formCriarCupom.addEventListener('submit', (e) => {
        e.preventDefault();

        const codigoInput = document.getElementById('codigo-cupom');
        const tipo = document.getElementById('tipo-desconto').value;
        const valor = parseFloat(document.getElementById('valor-desconto').value);

        // Validação simples
        if (!codigoInput.value.trim() || isNaN(valor) || valor <= 0) {
            alert('Por favor, preencha todos os campos corretamente.');
            return;
        }

        const novoCupom = {
            id: `cupom-${Date.now()}`,
            codigo: codigoInput.value.trim().toUpperCase(),
            tipo: tipo,
            valor: valor,
            ativo: true
        };

        salvarCupom(novoCupom);
        formCriarCupom.reset();
        codigoInput.focus();
        carregarECarregarCupons();
    });

    function getCupons() {
        return JSON.parse(localStorage.getItem(CHAVE_STORAGE_CUPONS)) || [];
    }

    function salvarCupom(cupom) {
        const cupons = getCupons();
        // Verifica se já existe um cupom com o mesmo código
        if (cupons.some(c => c.codigo === cupom.codigo)) {
            alert('Já existe um cupom com este código. Por favor, escolha outro.');
            return;
        }
        cupons.push(cupom);
        localStorage.setItem(CHAVE_STORAGE_CUPONS, JSON.stringify(cupons));
        alert('Cupom criado com sucesso!');
    }

    function carregarECarregarCupons() {
        const cupons = getCupons();
        listaCuponsContainer.innerHTML = ''; // Limpa a lista

        if (cupons.length === 0) {
            listaCuponsContainer.appendChild(mensagemSemCupons);
            mensagemSemCupons.style.display = 'block';
        } else {
            mensagemSemCupons.style.display = 'none';
            cupons.forEach(cupom => {
                const card = templateCupomCard.content.cloneNode(true);
                const cupomCardElement = card.querySelector('.cupom-card');
                cupomCardElement.dataset.id = cupom.id;

                card.querySelector('.codigo-cupom-card').textContent = cupom.codigo;
                card.querySelector('.valor-cupom-card').textContent = `Desconto de ${cupom.tipo === 'percentual' ? `${cupom.valor}%` : `R$ ${cupom.valor.toFixed(2)}`}`;

                // Ação de copiar link
                card.querySelector('.btn-copiar-link').addEventListener('click', () => {
                    const urlBase = window.location.origin + '/corpo/index.html';
                    const linkDesconto = `${urlBase}?cupom=${cupom.codigo}`;
                    navigator.clipboard.writeText(linkDesconto).then(() => {
                        alert(`Link de desconto copiado!\n${linkDesconto}`);
                    });
                });

                // Ação de excluir
                card.querySelector('.btn-excluir-cupom').addEventListener('click', () => {
                    if (confirm(`Tem certeza que deseja excluir o cupom "${cupom.codigo}"?`)) {
                        excluirCupom(cupom.id);
                    }
                });

                listaCuponsContainer.appendChild(card);
            });
        }
    }

    function excluirCupom(id) {
        let cupons = getCupons();
        const cupomExcluido = cupons.find(c => c.id === id);
        const originalIndex = cupons.findIndex(c => c.id === id);

        if (cupomExcluido) {
            adicionarALixeira('cupom', { ...cupomExcluido, originalIndex: originalIndex }, 'Automações');
        }

        cupons = cupons.filter(c => c.id !== id);
        localStorage.setItem(CHAVE_STORAGE_CUPONS, JSON.stringify(cupons));
        carregarECarregarCupons();
    }
});