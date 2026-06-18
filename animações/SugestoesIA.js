document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES ---
    const chatWindow = document.getElementById('chat-window');
    const formChat = document.getElementById('form-chat');
    const chatInput = document.getElementById('chat-input');
    const sugestoesRapidasContainer = document.querySelector('.chat-sugestoes-rapidas');
    const listaHistoricoEl = document.getElementById('lista-historico');
    const btnLimparHistorico = document.getElementById('btn-limpar-historico');
    const sidebarHistorico = document.getElementById('sidebar-historico');
    const btnAbrirHistorico = document.getElementById('btn-abrir-historico');
    const typingIndicator = document.getElementById('typing-indicator');
    const modalPesquisa = document.getElementById('modal-pesquisa');
    const iframePesquisa = document.getElementById('iframe-pesquisa');
    const btnFecharPesquisa = document.getElementById('btn-fechar-pesquisa');

    // --- BANCO DE DADOS (SIMULADO) ---
    const CHAVE_HISTORICO = 'casaTaperaHistoricoPesquisa';

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

    const bancoDeSugestoes = {
        'ideia': [
            "Post 'Batalha de Sabores': Crie uma imagem com dois pastéis lado a lado (ex: Carne vs. Queijo) e pergunte nos stories qual o preferido da galera.",
            "Vídeo Reels/TikTok mostrando a montagem de um hambúrguer em câmera rápida. Use uma música que esteja em alta!",
            "Foto 'Close-up Extremo': Tire uma foto bem de perto de um hambúrguer suculento ou de um pastel com queijo derretendo. Use o modo retrato do celular.",
            "Post de 'Pergunta': 'Se você pudesse adicionar UM ingrediente extra no nosso hambúrguer, qual seria?'",
            "Carrossel no Instagram mostrando 'Os 3 pastéis mais pedidos da semana'. Use uma foto para cada um."
        ],
        'legenda': [
            "Sextou com S de 'Sabor que só a Casa Tapera tem'. Já pediu o seu? 🔥",
            "A imagem fala por si, mas a gente reforça: é tão gostoso quanto parece. 😉 Peça pelo link na bio!",
            "⚠️ Cuidado: esta foto pode causar fome imediata. Não nos responsabilizamos pelos atos a seguir. #CasaTapera",
            "Transformando sua fome em felicidade desde sempre. Qual o seu pedido de hoje?",
            "Aquele momento em que você abre a caixa e o cheirinho já conquista. Quem mais ama? 😍"
        ],
        'hashtags': [
            "#CasaTapera #LanchesArtesanais #HamburguerArtesanal #Pastel #Delivery #PortoAlegre #Fome #LancheDaNoite",
            "#Foodie #InstaFood #ComidaDeVerdade #AmoComer #GastronomiaPOA #OndeComerEmPOA",
            "#DeliveryPOA #PeçaEmCasa #LanchePerfeito #SaborIncomparavel #TaperaLovers"
        ]
    };

    // --- FUNÇÕES DO CHAT ---

    /**
     * Adiciona uma mensagem à janela do chat.
     * @param {string} texto - O conteúdo da mensagem.
     * @param {'bot' | 'usuario'} autor - Quem enviou a mensagem.
     */
    function adicionarMensagem(texto, autor) {
        const divMensagem = document.createElement('div');
        divMensagem.classList.add('mensagem-chat', `mensagem-${autor}`);
        
        const pTexto = document.createElement('p');
        pTexto.textContent = texto;
        divMensagem.appendChild(pTexto);

        // Adiciona um botão de copiar para a área de transferência
        if (autor === 'bot') {
            const btnCopiar = document.createElement('button');
            btnCopiar.className = 'btn-copiar-ia';
            btnCopiar.title = 'Copiar para a área de transferência';
            btnCopiar.innerHTML = '<i class="far fa-copy"></i>';
            btnCopiar.addEventListener('click', (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(texto).then(() => {
                    btnCopiar.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => { btnCopiar.innerHTML = '<i class="far fa-copy"></i>'; }, 2000);
                }).catch(err => console.error('Falha ao copiar texto: ', err));
            });
            divMensagem.appendChild(btnCopiar);
        }

        chatWindow.appendChild(divMensagem);

        // Rola para a mensagem mais recente
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    /**
     * Processa a entrada do usuário e gera uma resposta do bot.
     * @param {string} input - A mensagem do usuário.
     */
    function processarInputUsuario(input) {
        const inputLower = input.toLowerCase().trim();
        if (!inputLower) return;

        adicionarMensagem(input, 'usuario');
        chatInput.value = '';
        
        chatInput.disabled = true;
        formChat.querySelector('button').disabled = true;
        
        // Move o indicador para o final do chat e o exibe
        chatWindow.appendChild(typingIndicator);
        typingIndicator.classList.remove('oculto');
        chatWindow.scrollTop = chatWindow.scrollHeight;

        // Simula o tempo de resposta da IA
        setTimeout(() => {
            let textoResposta = "";

            if (bancoDeSugestoes[inputLower]) {
                // Se for um comando de sugestão, gera a sugestão
                const sugestoes = bancoDeSugestoes[inputLower];
                textoResposta = sugestoes[Math.floor(Math.random() * sugestoes.length)];
                adicionarMensagem(textoResposta, 'bot');
            } else {
                // Se não for um comando, trata como uma pesquisa
                realizarPesquisa(input); // Usa o input original para manter maiúsculas/minúsculas
            }

            typingIndicator.classList.add('oculto'); // Esconde o "digitando..."
            chatInput.disabled = false;
            formChat.querySelector('button').disabled = false;
            chatInput.focus();
        }, 1200 + Math.random() * 800); // Resposta entre 1.2 e 2 segundos
    }

    /**
     * Carrega e renderiza o histórico de pesquisas do localStorage.
     */
    function carregarHistorico() {
        const historico = JSON.parse(localStorage.getItem(CHAVE_HISTORICO)) || [];
        listaHistoricoEl.innerHTML = '';

        if (historico.length === 0) {
            listaHistoricoEl.innerHTML = '<li class="sem-historico">Nenhuma pesquisa recente.</li>';
            btnLimparHistorico.style.display = 'none';
            return;
        }

        btnLimparHistorico.style.display = 'block';
        historico.forEach(termo => {
            const li = document.createElement('li');
            li.className = 'item-historico';
            li.dataset.termo = termo;
            li.innerHTML = `
                <span class="termo-pesquisa">${termo}</span>
                <button class="btn-remover-historico" title="Remover do histórico">&times;</button>
            `;
            listaHistoricoEl.appendChild(li);
        });
    }

    /**
     * Salva um novo termo de pesquisa no histórico.
     * @param {string} termo - O termo a ser salvo.
     */
    function salvarPesquisa(termo) {
        let historico = JSON.parse(localStorage.getItem(CHAVE_HISTORICO)) || [];
        // Remove o termo se ele já existir para colocá-lo no topo
        historico = historico.filter(item => item.toLowerCase() !== termo.toLowerCase());
        // Adiciona o novo termo no início da lista
        historico.unshift(termo);
        // Limita o histórico aos últimos 10 itens
        if (historico.length > 10) {
            historico.pop();
        }
        localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(historico));
        carregarHistorico();
    }

    function realizarPesquisa(termo) {
        if (termo) {
            // O parâmetro `igu=1` tenta forçar o Google a não enviar o header que bloqueia o iframe.
            const url = `https://www.google.com/search?igu=1&q=${encodeURIComponent(termo)}`;
            iframePesquisa.src = url;
            modalPesquisa.classList.remove('oculto');
            salvarPesquisa(termo);
        }
    }

    // --- EVENT LISTENERS ---

    // Envia mensagem do input principal
    formChat.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = chatInput.value;
        if (input) {
            processarInputUsuario(input);
        }
    });

    // Botões de sugestão rápida
    sugestoesRapidasContainer.addEventListener('click', (e) => {
        const botao = e.target.closest('.btn-sugestao-rapida');
        if (botao) {
            processarInputUsuario(botao.dataset.comando);
        }
    });

    // Limpa o histórico
    btnLimparHistorico.addEventListener('click', () => {
        const historico = JSON.parse(localStorage.getItem(CHAVE_HISTORICO)) || [];
        if (historico.length === 0) return;

        if (confirm('Deseja mover todo o histórico de pesquisas para a lixeira?')) {
            historico.forEach((termo, index) => {
                adicionarALixeira('pesquisa', { termo: termo, originalIndex: index }, 'Mensagens IA');
            });
            localStorage.removeItem(CHAVE_HISTORICO);
            carregarHistorico();
        }
    });

    // Ações na lista de histórico (refazer pesquisa ou remover item)
    listaHistoricoEl.addEventListener('click', (e) => {
        const item = e.target.closest('.item-historico');
        if (!item) return;

        const termo = item.dataset.termo;

        if (e.target.classList.contains('btn-remover-historico')) {
            // Move para a lixeira e remove do histórico
            let historico = JSON.parse(localStorage.getItem(CHAVE_HISTORICO)) || [];
            const termoIndex = historico.indexOf(termo);
            adicionarALixeira('pesquisa', { termo: termo, originalIndex: termoIndex }, 'Mensagens IA');
            historico = historico.filter(h => h !== termo);
            localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(historico));
            carregarHistorico();
        } else {
            // Refaz a pesquisa
            chatInput.value = termo;
            formChat.dispatchEvent(new Event('submit'));
        }
    });

    // Abre/Fecha a barra lateral de histórico
    btnAbrirHistorico.addEventListener('click', (e) => {
        e.stopPropagation(); // Impede que o clique feche a barra imediatamente
        sidebarHistorico.classList.toggle('aberta');
    });

    // Fecha a barra lateral se clicar fora dela
    document.addEventListener('click', (e) => {
        if (sidebarHistorico.classList.contains('aberta') && !sidebarHistorico.contains(e.target) && !btnAbrirHistorico.contains(e.target)) {
            sidebarHistorico.classList.remove('aberta');
        }
    });

    // Fecha o modal de pesquisa
    btnFecharPesquisa.addEventListener('click', () => {
        modalPesquisa.classList.add('oculto');
        iframePesquisa.src = 'about:blank'; // Limpa o iframe para liberar memória
    });

    // --- INICIALIZAÇÃO ---

    // Ajuste de layout para "subir" o chat e aproximá-lo da section divider
    const containerPrincipal = document.querySelector('.container-gerenciamento');
    const rodapeElemento = document.querySelector('footer, .rodape');
    const divisorRodape = document.querySelector('.divisor-secao');

    if (containerPrincipal) {
        containerPrincipal.style.setProperty('margin-top', '5px', 'important'); // Sobe o container principal
        containerPrincipal.style.setProperty('margin-bottom', '-40px', 'important'); // Puxa o rodapé para cima, colando o chat
        containerPrincipal.style.setProperty('padding-bottom', '0px', 'important');
    }
    
    if (chatWindow) {
        chatWindow.style.setProperty('margin-top', '-10px', 'important'); // Sobe a janela de chat para encostar no título/divider
    }

    if (rodapeElemento) rodapeElemento.style.setProperty('margin-top', '0px', 'important');
    if (divisorRodape) divisorRodape.style.marginTop = '0px';

    if (formChat) formChat.style.marginBottom = '0px';

    // Adiciona funcionalidade de voltar apenas se não estivermos no index ou no próprio painel
    const pathAtual = window.location.pathname.toLowerCase();
    const ePaginaPrincipal = pathAtual.endsWith('index.html') || pathAtual === '/' || pathAtual.endsWith('/') || pathAtual.endsWith('paineldecontrole.html');

    if (!ePaginaPrincipal) {
        // Removida a logo para que ela não atue como botão de voltar no painel
        const elementosVoltar = document.querySelectorAll('.mascote-header, .imagem-bot-header');
        elementosVoltar.forEach(el => {
            el.style.cursor = 'pointer';
            el.title = 'Voltar ao Painel de Controle';
            el.addEventListener('click', () => {
                window.location.href = 'PainelDeControle.html';
            });
        });
    }

    adicionarMensagem("Olá! Sou a assistente de marketing da Casa Tapera. Como posso te ajudar a bombar nas redes sociais hoje? Peça uma 'ideia', 'legenda' ou 'hashtags'!", 'bot');
    carregarHistorico();
});