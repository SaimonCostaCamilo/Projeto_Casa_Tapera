document.addEventListener('DOMContentLoaded', () => {
    const displayNome = document.getElementById('display-nome');
    const btnSortear = document.getElementById('btn-iniciar-sorteio');
    const listaUl = document.getElementById('lista-clientes-sorteio');
    const totalClientesSpan = document.getElementById('total-clientes');
    const modalVencedor = document.getElementById('modal-vencedor-final');
    const nomeVencedorModal = document.getElementById('nome-vencedor-modal');
    const detalhesVencedorModal = document.getElementById('detalhes-vencedor-modal');
    
    // Novos elementos do sistema de convite
    const btnCopiar = document.getElementById('btn-copiar-link');
    const inputLink = document.getElementById('input-link-convite');
    const abasLista = document.querySelectorAll('.btn-aba-lista');
    const modalConvite = document.getElementById('modal-entrar-sorteio');
    const inputNomeNovo = document.getElementById('nome-participante-novo');
    const btnConfirmarEntrada = document.getElementById('btn-confirmar-entrada');

    let listaSistema = [];
    let listaConvidados = [];
    let fonteAtiva = 'sistema'; // 'sistema' ou 'convite'
    let clientesParaSorteio = [];

    function inicializar() {
        verificarConvite();
        gerarLinkConvite();

        // 1. Tenta carregar clientes da lista de cadastrados (quem criou conta)
        const cadastrados = JSON.parse(localStorage.getItem('clientesCadastradosTapera')) || [];
        
        // 2. Tenta carregar do histórico de pedidos (clientes que compraram sem criar conta)
        const todosPedidos = JSON.parse(localStorage.getItem('pedidosTapera')) || [];
        const clientesDosPedidos = {};

        if (cadastrados.length > 0) {
            listaSistema = cadastrados;
        } else if (todosPedidos.length > 0) {
            // Consolida clientes baseados no histórico de vendas
            todosPedidos.forEach(pedido => {
                const nome = pedido.nomeCliente || 'Cliente não identificado';
                if (nome === 'Cliente não identificado' || nome.includes('(Mesa')) return;
                
                if (!clientesDosPedidos[nome]) {
                    clientesDosPedidos[nome] = {
                        nome: nome,
                        telefone: pedido.telefone || '',
                        email: pedido.email || '',
                        cpf: pedido.cpf || '',
                        endereco: pedido.endereco || ''
                    };
                }
            });
            listaSistema = Object.values(clientesDosPedidos);
        } else {
            // Fallback: Dados de demonstração se o sistema estiver totalmente vazio
            const nomesDemo = ["Ana Silva", "Bruno Costa", "Carla Dias", "Daniel Souza", "Eduarda Lima", "Fábio Pereira", "Gabriela Santos", "Hugo Oliveira", "Isabela Martins", "João Almeida", "Larissa Ferreira", "Marcos Rocha", "Natália Ribeiro", "Otávio Mendes", "Patrícia Nogueira"];
            listaSistema = nomesDemo.map(n => ({ nome: n, telefone: '5199999999', email: 'demo@tapera.com' }));
        }

        // Carrega lista de convidados do localStorage
        listaConvidados = JSON.parse(localStorage.getItem('clientesConviteTapera')) || [];

        renderizarListaAtiva();
    }

    function renderizarListaAtiva() {
        const lista = fonteAtiva === 'sistema' ? listaSistema : listaConvidados;
        clientesParaSorteio = [...lista];
        
        // Ordena por nome
        clientesParaSorteio.sort((a, b) => a.nome.localeCompare(b.nome));
        totalClientesSpan.textContent = clientesParaSorteio.length;
        
        if (clientesParaSorteio.length === 0) {
            displayNome.textContent = fonteAtiva === 'sistema' ? "Sem clientes" : "Ninguém entrou pelo link";
            btnSortear.disabled = true;
            listaUl.innerHTML = '<li style="grid-column: 1/-1; text-align: center;">Lista vazia.</li>';
            return;
        }

        btnSortear.disabled = false;
        displayNome.textContent = "Aguardando...";

        // Popula a lista visual
        listaUl.innerHTML = clientesParaSorteio.map(c => `
            <li class="${fonteAtiva === 'convite' ? 'item-convidado' : ''}">
                <i class="fas ${fonteAtiva === 'sistema' ? 'fa-user' : 'fa-user-plus'}"></i> ${c.nome}
            </li>
        `).join('');
    }

    function gerarLinkConvite() {
        // Gera o link apontando para a página index.html com o parâmetro de participação
        const url = new URL(window.location.href);
        const urlPath = url.pathname;
        // Substitui a página de sorteio por index.html no link que será enviado ao cliente
        const newPath = urlPath.substring(0, urlPath.lastIndexOf('/') + 1) + 'index.html';
        const inviteUrl = url.origin + newPath + '?participar=true';
        inputLink.value = inviteUrl;
    }

    function verificarConvite() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('participar') === 'true') {
            modalConvite.style.display = 'flex';
        }
    }

    // --- EVENTOS ---

    btnConfirmarEntrada.addEventListener('click', () => {
        const nome = inputNomeNovo.value.trim();
        if (!nome) return alert("Por favor, digite seu nome.");

        let convidados = JSON.parse(localStorage.getItem('clientesConviteTapera')) || [];
        convidados.push({ 
            nome: nome, 
            id: 'conv-' + Date.now(),
            telefone: 'Inscrito via link',
            email: 'N/A'
        });
        
        localStorage.setItem('clientesConviteTapera', JSON.stringify(convidados));
        alert("Inscrição confirmada! Aguarde o sorteio.");
        
        // Limpa a URL e recarrega para fechar o modal e atualizar a lista
        window.location.href = window.location.pathname;
    });

    abasLista.forEach(aba => {
        aba.addEventListener('click', () => {
            abasLista.forEach(b => b.classList.remove('ativa'));
            aba.classList.add('ativa');
            fonteAtiva = aba.dataset.fonte;
            renderizarListaAtiva();
        });
    });

    btnCopiar.addEventListener('click', () => {
        inputLink.select();
        document.execCommand('copy');
        btnCopiar.innerHTML = '<i class="fas fa-check"></i> Copiado!';
        setTimeout(() => btnCopiar.innerHTML = 'Copiar', 2000);
    });

    function realizarSorteio() {
        btnSortear.disabled = true;
        displayNome.classList.remove('vencedor');
        
        let tempoTotal = 3000; // 3 segundos de animação
        let intervaloInicial = 50; // Velocidade inicial
        let tempoDecorrido = 0;

        const animar = () => {
            const clienteAleatorio = clientesParaSorteio[Math.floor(Math.random() * clientesParaSorteio.length)];
            displayNome.textContent = clienteAleatorio.nome;

            tempoDecorrido += intervaloInicial;
            
            // Efeito de desaceleração (easing)
            if (tempoDecorrido < tempoTotal) {
                // Aumenta o intervalo progressivamente para dar efeito de parada
                intervaloInicial += (tempoDecorrido / tempoTotal) * 15; 
                setTimeout(animar, intervaloInicial);
            } else {
                finalizarSorteio(clienteAleatorio);
            }
        };

        animar();
    }

    function finalizarSorteio(vencedor) {
        displayNome.classList.add('vencedor');
        btnSortear.disabled = false;

        // Toca som se houver (opcional)
        try {
            const audio = new Audio('../blip.mp3');
            audio.play();
        } catch(e) {}

        // Máscaras para exibição no modal do vencedor
        const formatarCPF = (v) => {
            v = (v || "").replace(/\D/g, "");
            if (v.length !== 11) return v || 'Não informado';
            return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
        };

        const formatarTelefone = (v) => {
            v = (v || "").replace(/\D/g, "").replace(/^55/, ""); 
            if (v.length === 11) return v.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
            if (v.length === 10) return v.replace(/^(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
            return v || 'Não informado';
        };

        // Mostra o modal de celebração após um pequeno delay
        setTimeout(() => {
            nomeVencedorModal.textContent = vencedor.nome;
            detalhesVencedorModal.innerHTML = `
                <strong>Telefone/WhatsApp:</strong> ${formatarTelefone(vencedor.telefone)}<br>
                <strong>E-mail:</strong> ${vencedor.email || 'Não informado'}<br>
                <strong>CPF:</strong> ${formatarCPF(vencedor.cpf)}
            `;
            modalVencedor.style.display = 'flex';
        }, 800);
    }

    btnSortear.addEventListener('click', realizarSorteio);

    inicializar();
});