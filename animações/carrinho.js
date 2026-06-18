document.addEventListener('DOMContentLoaded', () => {
    const numeroTelefone = '555180608775'; // Número de telefone para o link do WhatsApp
    const CHAVE_STORAGE_CUPONS = 'casaTaperaCupons';
    const cart = {}; // Objeto para armazenar os itens do carrinho

    // --- INÍCIO: Criação dinâmica do botão de Configurações ---
    const settingsButton = document.createElement('a');
    settingsButton.href = '#';
    settingsButton.id = 'btn-abrir-sidebar'; // ID que a lógica da sidebar espera
    settingsButton.className = 'icone-configuracoes'; // Classe para estilização do PainelDeControle.css
    settingsButton.title = 'Configurações';
    settingsButton.innerHTML = '<i class="fas fa-cog"></i>';

    // Tenta anexar ao cabeçalho principal da página.
    // Procura pela tag <header> ou por um elemento com a classe 'cabecalho'.
    let header = document.querySelector('header') || document.querySelector('.cabecalho');
    
    if (header) {
        // Garante que o header seja um container de posicionamento para o botão absoluto
        if (window.getComputedStyle(header).position === 'static') {
            header.style.position = 'relative';
        }
        // Anexa o botão diretamente ao cabeçalho principal
        header.appendChild(settingsButton);
    } else {
        // Fallback: anexa ao body se não encontrar um header. A posição pode não ser a ideal.
        document.body.appendChild(settingsButton);
    }
    // --- FIM: Criação dinâmica do botão de Configurações ---

    // --- INÍCIO: Seletores da Sidebar de Configurações ---
    const btnAbrirSidebar = document.getElementById('btn-abrir-sidebar');
    const btnFecharSidebar = document.getElementById('btn-fechar-sidebar');
    const sidebar = document.getElementById('sidebar-configuracoes');
    // --- FIM: Seletores da Sidebar de Configurações ---

    const radiosMetodoEntrega = document.querySelectorAll('input[name="delivery-method"]');
    const containerCampoEndereco = document.getElementById('container-campo-endereco');
    const inputNomeCliente = document.getElementById('nome-cliente');
    const modalAvaliacao = document.getElementById('modal-avaliacao');
    const btnEnviarAvaliacao = document.getElementById('btn-enviar-avaliacao');
    const btnPularAvaliacao = document.getElementById('btn-pular-avaliacao');
    let avaliacaoRealizada = false;
    const estrelas = document.querySelectorAll('#estrelas-container i');
    let notaSelecionada = 0;
    const inputEnderecoCliente = document.getElementById('endereco-cliente');
    const radiosMetodoPagamento = document.querySelectorAll('input[name="payment-method"]');
    const containerCampoTroco = document.getElementById('container-campo-troco');
    const containerDetalhesCartao = document.getElementById('container-detalhes-cartao');
    const containerDetalhesPix = document.getElementById('container-detalhes-pix');
    const btnCopiarChavePix = document.getElementById('btn-copiar-chave-pix');
    const btnLimparCarrinho = document.getElementById('btn-limpar-carrinho');
    const containerCarrinho = document.getElementById('carrinho-compras');
    const cabecalhoCarrinho = document.querySelector('.cabecalho-carrinho');
    const somAdicionar = new Audio('blip.mp3'); // Carrega o arquivo de som
    const inputDividirConta = document.getElementById('dividir-conta-input');
    const containerDividirConta = document.getElementById('dividir-conta-container');
    const valorPorPessoaEl = document.getElementById('valor-por-pessoa');
    const btnVoltarTopo = document.getElementById('btn-voltar-topo');
    const cupomInput = document.getElementById('cupom-input');
    const btnAplicarCupom = document.getElementById('btn-aplicar-cupom');
    const btnCalcularTaxa = document.getElementById('btn-calcular-taxa');
    const cupomInfoEl = document.getElementById('cupom-info');
    let cupomAplicado = null;
    
    // Variáveis para Taxa de Entrega
    const msgTaxaEntrega = document.getElementById('msg-taxa-entrega');
    let valorTaxaEntrega = 0;

    // --- INÍCIO: Carregar dados do cliente salvo ---
    const clienteSalvo = JSON.parse(localStorage.getItem('clienteTapera'));
    if (clienteSalvo) {
        if (inputNomeCliente) inputNomeCliente.value = clienteSalvo.nome || '';
        if (inputEnderecoCliente) inputEnderecoCliente.value = clienteSalvo.endereco || '';
    }
    // --- FIM: Carregar dados do cliente salvo ---

    // --- LÓGICA PARA TORNAR O CARRINHO ARRASTÁVEL ---
    let estaArrastando = false;
    let offsetX, offsetY;

    // Inicia o arrasto
    cabecalhoCarrinho.addEventListener('mousedown', (e) => {
        // Impede o arrasto se o clique for em um botão ou no total
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SPAN') return;

        estaArrastando = true;
        // Calcula a posição do clique em relação ao canto superior esquerdo do carrinho
        offsetX = e.clientX - containerCarrinho.offsetLeft;
        offsetY = e.clientY - containerCarrinho.offsetTop;
        
        // Impede a seleção de texto enquanto arrasta
        document.body.style.userSelect = 'none';
    });

    // Move o carrinho
    document.addEventListener('mousemove', (e) => {
        if (!estaArrastando) return;

        // Define a nova posição do carrinho
        containerCarrinho.style.left = `${e.clientX - offsetX}px`;
        containerCarrinho.style.top = `${e.clientY - offsetY}px`;
    });

    // Finaliza o arrasto
    document.addEventListener('mouseup', () => {
        estaArrastando = false;
        document.body.style.userSelect = ''; // Reabilita a seleção de texto
    });

    // Função para atualizar a exibição do carrinho
    function atualizarVisualizacaoCarrinho() {
        const containerItensCarrinho = document.getElementById('itens-carrinho');
        const elementoTotalCarrinho = document.getElementById('total-carrinho');
        const botaoFinalizar = document.getElementById('btn-finalizar-pedido');

        // --- VERIFICAÇÃO DE STATUS DE FUNCIONAMENTO ---
        const statusLoja = localStorage.getItem('casaTaperaStatus') || 'aberto';
        const metodoEntregaSelecionado = document.querySelector('input[name="delivery-method"]:checked')?.value;
        const isMesa = new URLSearchParams(window.location.search).has('mesa');
        const isAdminPreview = sessionStorage.getItem('adminPreviewMode') === 'true';

        let motivoBloqueio = null;
        if (statusLoja === 'fechado') {
            motivoBloqueio = 'Loja Fechada';
        } else if (statusLoja === 'parcial-delivery-fechado' && metodoEntregaSelecionado === 'delivery' && !isMesa) {
            motivoBloqueio = 'Delivery Indisponível';
        } else if (statusLoja === 'parcial-mesa-fechada' && isMesa) {
            motivoBloqueio = 'Pedidos via Mesa Indisponíveis';
        }

        // No modo Admin Preview, permitimos que o botão mostre o estado normal (mas ele já é bloqueado via CSS)
        const exibirBloqueioNoBotao = motivoBloqueio && !isAdminPreview;

        containerItensCarrinho.innerHTML = ''; // Limpa o carrinho
        cupomInfoEl.classList.add('oculto'); // Esconde info do cupom ao atualizar
        let total = 0;

        const nomesItens = Object.keys(cart);

        if (nomesItens.length === 0) {
            containerItensCarrinho.innerHTML = '<li id="mensagem-carrinho-vazio">Seu carrinho está vazio.</li>';
            containerCarrinho.classList.add('oculto'); // Esconde o carrinho se estiver vazio
            botaoFinalizar.disabled = true;
            btnLimparCarrinho.style.display = 'none';
            containerDividirConta.style.display = 'none';
            
            // Reseta estado se o carrinho for esvaziado
            avaliacaoRealizada = false;
            botaoFinalizar.innerHTML = 'Finalizar Pedido no WhatsApp';
            botaoFinalizar.classList.remove('btn-confirmado-final');
        } else {
            containerCarrinho.classList.remove('oculto'); // Mostra o carrinho se tiver itens
            nomesItens.forEach(nome => {
                const item = cart[nome];
                total += item.price * item.quantity;

                const li = document.createElement('li');
                li.classList.add('item-carrinho');
                li.innerHTML = `
                    <span>${item.quantity}x ${nome}</span>
                    <div class="controles-item-carrinho">
                        <span>R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                        <button class="mudar-quantidade" data-name="${nome}" data-change="-1">-</button>
                        <button class="mudar-quantidade" data-name="${nome}" data-change="1">+</button>
                        <button class="remover-item-totalmente" data-name="${nome}" title="Remover item"><i class="fas fa-trash-alt"></i></button>
                    </div>
                `;
                containerItensCarrinho.appendChild(li);
            });
            
            if (exibirBloqueioNoBotao) {
                botaoFinalizar.disabled = true;
                botaoFinalizar.innerHTML = `<i class="fas fa-store-slash"></i> ${motivoBloqueio}`;
            } else {
                botaoFinalizar.disabled = false;
            }
            
            // Mantém o estado visual se a avaliação já foi feita mas o pedido ainda não foi enviado
            if (avaliacaoRealizada) {
                prepararBotaoConfirmacao();
            }
            btnLimparCarrinho.style.display = 'inline-block';
            containerDividirConta.style.display = 'flex';
        }

        // Aplica o desconto do cupom se houver
        let totalComDesconto = total;
        let htmlTotal = '';

        if (cupomAplicado) {
            let desconto = 0;
            if (cupomAplicado.tipo === 'percentual') {
                desconto = (total * cupomAplicado.valor) / 100;
            } else { // 'fixo'
                desconto = cupomAplicado.valor;
            }
            totalComDesconto = Math.max(0, total - desconto); // Garante que o total não seja negativo
            htmlTotal = `Subtotal: <del>R$ ${total.toFixed(2).replace('.', ',')}</del> R$ ${totalComDesconto.toFixed(2).replace('.', ',')}<br>`;
        } else {
            htmlTotal = `Subtotal: R$ ${total.toFixed(2).replace('.', ',')}<br>`;
        }

        // Adiciona a taxa de entrega se for delivery
        const metodoEntrega = document.querySelector('input[name="delivery-method"]:checked')?.value || 'delivery';
        let totalFinal = totalComDesconto;

        if (metodoEntrega === 'delivery' && valorTaxaEntrega > 0) {
            totalFinal += valorTaxaEntrega;
            htmlTotal += `Taxa Entrega: R$ ${valorTaxaEntrega.toFixed(2).replace('.', ',')}<br>`;
        }

        htmlTotal += `<strong>Total: R$ ${totalFinal.toFixed(2).replace('.', ',')}</strong>`;
        elementoTotalCarrinho.innerHTML = htmlTotal;
        
        atualizarDivisaoConta(totalFinal);

        // Atualiza o QR Code Pix (sem valor embutido)
        atualizarPixDinamico();
    }

    // --- INÍCIO: Lógica de Geração de Pix Dinâmico ---
    function calcularCRC16(payload) {
        let crc = 0xFFFF;
        const polynomial = 0x1021;
        for (let i = 0; i < payload.length; i++) {
            let b = payload.charCodeAt(i);
            for (let j = 0; j < 8; j++) {
                let bit = ((b >> (7 - j) & 1) === 1);
                let c15 = ((crc >> 15 & 1) === 1);
                crc <<= 1;
                if (c15 ^ bit) crc ^= polynomial;
            }
        }
        crc &= 0xFFFF;
        return crc.toString(16).toUpperCase().padStart(4, '0');
    }

    function gerarPixPayload() {
        const pixKey = "+555196270518";
        const merchantName = "Carol";
        const merchantCity = "Porto Alegre";
        
        let payload = "000201"; // Payload Format Indicator
        
        // Merchant Account Information - Pix
        const gui = "br.gov.bcb.pix";
        const accountInfo = "00" + gui.length.toString().padStart(2, '0') + gui + "01" + pixKey.length.toString().padStart(2, '0') + pixKey;
        payload += "26" + accountInfo.length.toString().padStart(2, '0') + accountInfo;
        
        payload += "52040000"; // Merchant Category Code
        payload += "5303986"; // Transaction Currency (986 = BRL)
        
        // Tag 54 (valor) removida para que o cliente insira manualmente no banco

        payload += "5802BR"; // Country Code
        payload += "59" + merchantName.length.toString().padStart(2, '0') + merchantName;
        payload += "60" + merchantCity.length.toString().padStart(2, '0') + merchantCity;
        
        const txId = "***";
        const additionalData = "05" + txId.length.toString().padStart(2, '0') + txId;
        payload += "62" + additionalData.length.toString().padStart(2, '0') + additionalData;
        
        payload += "6304"; // CRC16 Indicator
        payload += calcularCRC16(payload);
        return payload;
    }

    function atualizarPixDinamico() {
        const container = document.getElementById('qrcode-pix-dinamico');
        if (!container || typeof QRCode === 'undefined') return;
        
        const payload = gerarPixPayload();
        container.innerHTML = ""; // Limpa o QR Code anterior
        new QRCode(container, { text: payload, width: 160, height: 160, colorDark: "#000000", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.H });
    }
    // --- FIM: Lógica de Geração de Pix Dinâmico ---

    // Função para calcular e exibir a divisão da conta
    function atualizarDivisaoConta(totalCarrinho) {
        const numPessoas = parseInt(inputDividirConta.value) || 1;

        if (numPessoas > 1 && totalCarrinho > 0) {
            const valorPorPessoa = totalCarrinho / numPessoas;
            valorPorPessoaEl.textContent = `(R$ ${valorPorPessoa.toFixed(2).replace('.', ',')} p/ cada)`;
        } else {
            valorPorPessoaEl.textContent = '';
        }
    }

    // Função para adicionar item ao carrinho
    function adicionarItemAoCarrinho(nome, preco, elementoBotao) {
        // Bloqueia adição se a loja estiver totalmente fechada (exceto Admin em preview)
        const statusLoja = localStorage.getItem('casaTaperaStatus') || 'aberto';
        const isAdminPreview = sessionStorage.getItem('adminPreviewMode') === 'true';
        
        if (statusLoja === 'fechado' && !isAdminPreview) {
            alert('A Casa Tapera está fechada no momento. Por favor, confira nossos horários de funcionamento.');
            return;
        }

        if (cart[nome]) {
            cart[nome].quantity++;
        } else {
            cart[nome] = { price: preco, quantity: 1 };
        }
        atualizarVisualizacaoCarrinho();

        // Adiciona a classe de animação e a remove depois para poder ser reutilizada
        if (elementoBotao) {
            elementoBotao.classList.add('animacao-item-adicionado');
            // Usa 'animationend' para remover a classe. É mais confiável que setTimeout.
            elementoBotao.addEventListener('animationend', () => {
                elementoBotao.classList.remove('animacao-item-adicionado');
            }, { once: true });
        }

        // Toca o som de "blip"
        somAdicionar.currentTime = 0; // Reinicia o som para tocar desde o início
        somAdicionar.play().catch(e => console.error("Erro ao tocar áudio:", e)); // Adicionado tratamento de erro

        // Função que executa a animação de pulso
        const executarAnimacaoPulso = () => {
            containerCarrinho.classList.remove('animacao-pulso-carrinho'); // Garante que a classe seja removida antes de adicionar
            // Força o navegador a refazer a animação
            void containerCarrinho.offsetWidth; 
            containerCarrinho.classList.add('animacao-pulso-carrinho');
        };

        const isMobileOrTablet = window.innerWidth <= 1200;

        // Lógica de animação do carrinho e rolagem
        if (isMobileOrTablet) {
            // Rola suavemente até o carrinho de compras
            containerCarrinho.scrollIntoView({ behavior: 'smooth', block: 'end' });
            // Para telas com rolagem, a animação tem um atraso para esperar a tela descer.
            setTimeout(executarAnimacaoPulso, 700);
        } else {
            // Para desktop, a animação é imediata.
            executarAnimacaoPulso();
        }
    }

    // --- INÍCIO: Lógica do Modal de Detalhes do Item ---
    const ingredientesPorItem = {
        "Hambúrguer de Carne": "Pão brioche artesanal, bife bovino 150g, queijo mussarela derretido, alface, tomate fresco e maionese secreta da casa.",
        "Hambúrguer de Frango": "Pão brioche, suculento filé de frango empanado, queijo mussarela, alface e maionese especial.",
        "Hambúrguer de Bacon": "Pão brioche, bife bovino 150g, queijo mussarela, fatias crocantes de bacon premium, alface, tomate e maionese.",
        "Hambúrguer Vegano": "Pão artesanal vegano, hambúrguer de lentilha e grão-de-bico, queijo de castanhas, alface, tomate e picles.",
        "Batata P": "Porção individual de batatas selecionadas, fritas em óleo vegetal e temperadas com sal.",
        "Batata M": "Porção média de batatas crocantes e sequinhas, perfeita para acompanhar seu lanche.",
        "Batata G": "Porção generosa de batatas fritas, ideal para dividir com amigos ou família.",
        "Pão Artesanal 500g": "Pão caseiro fofinho, produzido diariamente com fermentação natural e sem conservantes químicos.",
        "Cuca de Goiabada 500g": "Receita tradicional gaúcha com massa amanteigada, recheio de goiabada cascão e cobertura de farofa crocante.",
        "Cuca de Doce de Leite 500g": "Massa caseira macia recheada com doce de leite premium e finalizada com nossa tradicional farofa doce.",
        "Suco de Laranja": "Suco 100% natural, extraído diretamente da fruta no momento do pedido. Garrafa de 500ml.",
        "Suco de Limão": "Limonada refrescante feita com limões selecionados e gelo.",
        "Suco de Manga": "Suco natural concentrado de manga, batido com água mineral e açúcar.",
        "Suco de Maracujá": "Suco natural de maracujá, conhecido por seu sabor intenso e propriedades relaxantes.",
        "Suco de Abacaxi": "Suco natural de abacaxi com hortelã, extremamente refrescante.",
        "Coca-Cola Lata 350ml": "Refrigerante Coca-Cola original gelado. Lata 350ml.",
        "Refrigerantes Lata 350ml": "Diversas opções de sabores (Fanta, Sprite, Guaraná). Informe o sabor nas observações.",
        "Água c/ Gás": "Água mineral gaseificada fresca. 500ml.",
        "Água s/ Gás": "Água mineral natural pura. 500ml."
    };

    function abrirModalDetalhes(itemElement) {
        const modalDetalhes = document.getElementById('modal-detalhes-item');
        const btnAddModalCarrinho = document.getElementById('btn-modal-add-carrinho');
        if (!modalDetalhes) return;

        const nome = itemElement.dataset.name;
        const preco = itemElement.dataset.price;
        const imgUrl = itemElement.querySelector('.img-item-cardapio')?.src || '../imagens/Logo_Tapera.jpeg';

        const nomeEl = document.getElementById('modal-item-nome');
        const precoEl = document.getElementById('modal-item-preco');
        const descEl = document.getElementById('modal-item-descricao');
        const fotoEl = document.getElementById('modal-item-foto');

        if (nomeEl) nomeEl.textContent = nome;
        if (precoEl) precoEl.textContent = `R$ ${parseFloat(preco).toFixed(2).replace('.', ',')}`;
        if (fotoEl) fotoEl.src = imgUrl;
        
        const desc = ingredientesPorItem[nome] || "Ingredientes: Preparado com a receita exclusiva da Casa Tapera, utilizando produtos frescos e selecionados diariamente.";
        if (descEl) descEl.textContent = desc;

        if (btnAddModalCarrinho) {
            btnAddModalCarrinho.onclick = () => {
                adicionarItemAoCarrinho(nome, parseFloat(preco), null);
                modalDetalhes.classList.add('oculto');
            };
        }

        modalDetalhes.classList.remove('oculto');
    }

    // Fechar Modal Detalhes
    const modalDetalhesItem = document.getElementById('modal-detalhes-item');
    modalDetalhesItem?.querySelector('.btn-fechar-modal')?.addEventListener('click', () => {
        modalDetalhesItem.classList.add('oculto');
    });
    modalDetalhesItem?.addEventListener('click', (e) => {
        if (e.target === modalDetalhesItem) modalDetalhesItem.classList.add('oculto');
    });
    // --- FIM: Lógica do Modal de Detalhes do Item ---

    // Função para alterar a quantidade de um item
    function alterarQuantidadeItem(nome, alteracao) {
        if (cart[nome]) {
            cart[nome].quantity += alteracao;
            if (cart[nome].quantity <= 0) {
                delete cart[nome];
            }
        }
        atualizarVisualizacaoCarrinho();
    }

    // --- INÍCIO: Lógica de clique nos itens do cardápio (com delegação) ---
    document.body.addEventListener('click', (e) => {
        const elementoItem = e.target.closest('.item-cardapio-interativo');

        // Garante que o clique foi em um item do cardápio e não em um botão de favoritar
        if (elementoItem && !e.target.closest('.btn-favorito')) {
            // Se o clique foi na imagem, abre o modal de detalhes
            if (e.target.classList.contains('img-item-cardapio')) {
                abrirModalDetalhes(elementoItem);
                return;
            }

            const nome = elementoItem.dataset.name;
            const preco = parseFloat(elementoItem.dataset.price);
            adicionarItemAoCarrinho(nome, preco, elementoItem);
        }
    });
    // --- FIM: Lógica de clique nos itens do cardápio ---
    
    // Adiciona evento de clique para os botões de quantidade
    document.getElementById('itens-carrinho').addEventListener('click', (event) => {
        const targetButton = event.target.closest('button');
        if (!targetButton) return;

        const nome = targetButton.dataset.name;

        if (targetButton.classList.contains('mudar-quantidade')) {
            const alteracao = parseInt(targetButton.dataset.change, 10);
            alterarQuantidadeItem(nome, alteracao);
        } else if (targetButton.classList.contains('remover-item-totalmente')) {
            if (cart[nome]) {
                delete cart[nome];
                atualizarVisualizacaoCarrinho();
            }
        }
    });

    // Adiciona evento de clique para o botão de limpar carrinho
    btnLimparCarrinho.addEventListener('click', () => {
        // Limpa o objeto do carrinho de forma mais eficiente
        Object.keys(cart).forEach(key => delete cart[key]);
        atualizarVisualizacaoCarrinho();
    });

    // Adiciona evento para mostrar/esconder o campo de troco
    radiosMetodoPagamento.forEach(radio => {
        radio.addEventListener('change', (event) => {
            const metodoPagamento = event.target.value;
            // Mostra/esconde o campo de troco
            containerCampoTroco.style.display = (metodoPagamento === 'Dinheiro') ? 'block' : 'none';
            // Mostra/esconde os detalhes do cartão
            containerDetalhesCartao.classList.toggle('oculto', metodoPagamento !== 'Cartão');
            // Mostra/esconde os detalhes do Pix
            if (containerDetalhesPix) {
                containerDetalhesPix.classList.toggle('oculto', metodoPagamento !== 'Pix');
            }
        });
    });

    // Adiciona evento para alternar a visibilidade do campo de endereço
    radiosMetodoEntrega.forEach(radio => {
        radio.addEventListener('change', (event) => {
            containerCampoEndereco.style.display = (event.target.value === 'pickup') ? 'none' : 'block';
            atualizarVisualizacaoCarrinho(); // Atualiza o total para incluir/remover taxa
        });
    });

    // Lógica das Estrelas do Modal
    estrelas.forEach(estrela => {
        estrela.addEventListener('click', () => {
            notaSelecionada = parseInt(estrela.dataset.valor);
            estrelas.forEach(s => {
                const val = parseInt(s.dataset.valor);
                s.classList.toggle('fas', val <= notaSelecionada);
                s.classList.toggle('far', val > notaSelecionada);
                s.classList.toggle('ativa', val <= notaSelecionada);
            });
        });
    });

    btnEnviarAvaliacao.addEventListener('click', () => {
        const googleUrl = 'https://www.google.com/search?sca_esv=ffb1a34a2d49d962&sxsrf=ANbL-n4x-IxzapwXCgOhhxJipk8zhxcOIQ:1777155020049&si=AL3DRZEsmMGCryMMFSHJ3StBhOdZ2-6yYkXd_doETEE1OR-qOeOXIUKNSR_6CMv1jyhyjCizCDvJxjhJQ9_2UEHo9aLiQXkYE46IQF5Rd_UGV5XLt58cIGEVjUDNfsOdPj2JihAJ7q-oF3AiFodJ2v2U4Uk4V8Dn_w%3D%3D&q=Casa+Tapera+RS+Coment%C3%A1rios&sa=X&ved=2ahUKEwiw8bitgoqUAxUorpUCHXgeK9QQ0bkNegQIMhAD&biw=1536&bih=730&dpr=1.25';
        window.open(googleUrl, '_blank');
        modalAvaliacao.classList.add('oculto');
        prepararBotaoConfirmacao();
    });

    btnPularAvaliacao.addEventListener('click', () => {
        modalAvaliacao.classList.add('oculto');
        prepararBotaoConfirmacao();
    });

    function prepararBotaoConfirmacao() {
        avaliacaoRealizada = true;
        const btnFinalizar = document.getElementById('btn-finalizar-pedido');
        btnFinalizar.innerHTML = '<i class="fab fa-whatsapp"></i> Confirmar e Enviar Agora';
        btnFinalizar.classList.add('btn-confirmado-final');
        
        // Injeta estilo de animação de pulso se não existir
        if (!document.getElementById('style-pulso-final')) {
            const style = document.createElement('style');
            style.id = 'style-pulso-final';
            style.textContent = `
                .btn-confirmado-final { background-color: #25d366 !important; color: #fff !important; animation: pulso-confirmacao 1.5s infinite; transform: scale(1.02); border: none !important; }
                @keyframes pulso-confirmacao {
                    0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7); }
                    70% { box-shadow: 0 0 0 12px rgba(37, 211, 102, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
                }
            `;
            document.head.appendChild(style);
        }
        btnFinalizar.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Função principal que gera a mensagem e abre o WhatsApp
    function processarFinalizacaoPedido() {
        const nomeCliente = inputNomeCliente.value.trim();
        const metodoEntrega = document.querySelector('input[name="delivery-method"]:checked').value;
        const enderecoCliente = inputEnderecoCliente.value.trim();
        const metodoPagamento = document.querySelector('input[name="payment-method"]:checked').value;
        const trocoPara = document.getElementById('troco-cliente').value;
        const observacoes = document.getElementById('observacoes-pedido').value.trim();
        const numPessoas = parseInt(inputDividirConta.value) || 1;

        // Calcula os totais ANTES de criar o objeto do pedido
        let subTotal = 0;
        Object.values(cart).forEach(item => { subTotal += item.price * item.quantity; });

        let valorFinal = subTotal;
        let infoDesconto = '';
        if (cupomAplicado) {
            let desconto = cupomAplicado.tipo === 'percentual' ? (subTotal * cupomAplicado.valor) / 100 : cupomAplicado.valor;
            valorFinal = Math.max(0, subTotal - desconto);
        }

        if (metodoEntrega === 'delivery' && valorTaxaEntrega > 0) {
            valorFinal += valorTaxaEntrega;
        }

        // Salva o pedido no localStorage para o painel de controle
        try {
            const todosPedidos = JSON.parse(localStorage.getItem('pedidosTapera')) || [];
            const novoPedido = {
                id: `pedido-${Date.now()}`,
                nomeCliente: nomeCliente,
                telefone: clienteSalvo ? (clienteSalvo.telefone || '') : '',
                metodoEntrega: metodoEntrega,
                endereco: enderecoCliente,
                metodoPagamento: metodoPagamento,
                items: cart,
                subTotal: subTotal,
                cupom: cupomAplicado, // Salva o objeto do cupom inteiro
                valorFinal: valorFinal, // Salva o valor já com desconto
                taxaEntrega: (metodoEntrega === 'delivery' ? valorTaxaEntrega : 0),
                status: 'novo', // Status inicial
                data: new Date().toISOString()
            };
            todosPedidos.push(novoPedido);
            localStorage.setItem('pedidosTapera', JSON.stringify(todosPedidos));
            alert('Pedido enviado para a cozinha!');
        } catch (error) { console.error("Erro ao salvar pedido no localStorage:", error); }

        // Gera a mensagem do WhatsApp (aqui a variável infoDesconto é preenchida)
        if (cupomAplicado) {
            let desconto = cupomAplicado.tipo === 'percentual' ? (subTotal * cupomAplicado.valor) / 100 : cupomAplicado.valor;
            infoDesconto = `\nSubtotal: R$ ${subTotal.toFixed(2).replace('.', ',')}\n*Desconto (${cupomAplicado.codigo}): -R$ ${desconto.toFixed(2).replace('.', ',')}*\n`;
        }

        let mensagem = `Olá, Vim pelo site da Casa Tapera! Gostaria de fazer o seguinte pedido:\n\n*Cliente:* ${nomeCliente}\n*Tipo:* ${metodoEntrega === 'delivery' ? 'Entrega' : 'Retirada'}\n`;
        if (metodoEntrega === 'delivery') { mensagem += `*Endereço:* ${enderecoCliente}\n`; }
        mensagem += '\n--- MEU PEDIDO ---\n';
        Object.keys(cart).forEach(nome => { mensagem += `${cart[nome].quantity}x ${nome} - R$ ${(cart[nome].price * cart[nome].quantity).toFixed(2).replace('.', ',')}\n`; });
        
        mensagem += infoDesconto; // Adiciona as informações de desconto, se houver
        
        if (metodoEntrega === 'delivery' && valorTaxaEntrega > 0) {
            mensagem += `Taxa de Entrega: R$ ${valorTaxaEntrega.toFixed(2).replace('.', ',')}\n`;
        }

        mensagem += `\n*Total: R$ ${valorFinal.toFixed(2).replace('.', ',')}*\n*Pagamento:* ${metodoPagamento}\n`;
        if (numPessoas > 1) {
            const valorPorPessoa = valorFinal / numPessoas;
            mensagem += `*Dividido para ${numPessoas} pessoas: R$ ${valorPorPessoa.toFixed(2).replace('.', ',')} para cada.*\n`;
        }
        if (metodoPagamento === 'Dinheiro' && trocoPara) { mensagem += `*Troco para:* R$ ${parseFloat(trocoPara).toFixed(2).replace('.', ',')}\n`; }
        if (observacoes) { mensagem += `\n*Observações:* ${observacoes}\n`; }

        // Limpa o carrinho e atualiza a interface para que o carrinho feche automaticamente
        Object.keys(cart).forEach(key => delete cart[key]);
        atualizarVisualizacaoCarrinho();

        const mensagemCodificada = encodeURIComponent(mensagem);
        
        // Abre o WhatsApp em uma nova aba/janela conforme solicitado
        window.open(`https://api.whatsapp.com/send?phone=${numeroTelefone}&text=${mensagemCodificada}`, '_blank');
        
        // Pequeno feedback visual opcional para o usuário saber que foi enviado
        alert('Tudo certo! Seu pedido foi gerado e o WhatsApp foi aberto em uma nova aba para você concluir o envio.');
    }

    // Adiciona evento de clique para o botão de finalizar pedido (interceptador)
    document.getElementById('btn-finalizar-pedido').addEventListener('click', () => {
        const nomeCliente = inputNomeCliente.value.trim();
        const metodoEntrega = document.querySelector('input[name="delivery-method"]:checked').value;
        const enderecoCliente = inputEnderecoCliente.value.trim();

        if (!nomeCliente || (metodoEntrega === 'delivery' && !enderecoCliente)) {
            alert('Por favor, preencha seu nome e endereço para continuar.');
            return;
        }

        // Se a avaliação já foi processada, executa o envio final para o WhatsApp
        if (avaliacaoRealizada) {
            processarFinalizacaoPedido();
            return;
        }

        // Reseta estrelas antes de mostrar
        estrelas.forEach(s => { s.className = 'far fa-star'; });
        notaSelecionada = 0;
        modalAvaliacao.classList.remove('oculto');
    });

    // Adiciona evento para atualizar a divisão da conta ao mudar o número de pessoas
    inputDividirConta.addEventListener('input', () => {
        atualizarVisualizacaoCarrinho();
    });

    // --- LÓGICA PARA CUPOM DE DESCONTO ---
    function aplicarCupom() {
        const codigo = cupomInput.value.trim().toUpperCase();
        if (!codigo) return;

        const cupons = JSON.parse(localStorage.getItem(CHAVE_STORAGE_CUPONS)) || [];
        const cupomEncontrado = cupons.find(c => c.codigo === codigo && c.ativo);

        cupomInfoEl.classList.remove('oculto', 'sucesso', 'erro');

        if (cupomEncontrado) {
            cupomAplicado = cupomEncontrado;
            const tipoValor = cupomAplicado.tipo === 'percentual' ? `${cupomAplicado.valor}%` : `R$ ${cupomAplicado.valor.toFixed(2)}`;
            cupomInfoEl.textContent = `Cupom "${codigo}" aplicado! Desconto de ${tipoValor}.`;
            cupomInfoEl.classList.add('sucesso');
            cupomInput.disabled = true;
            btnAplicarCupom.textContent = 'Remover';
        } else {
            cupomAplicado = null;
            cupomInfoEl.textContent = 'Cupom inválido ou não encontrado.';
            cupomInfoEl.classList.add('erro');
        }
        atualizarVisualizacaoCarrinho();
    }

    btnAplicarCupom.addEventListener('click', () => {
        if (cupomAplicado) { // Se já tem cupom, a ação é remover
            cupomAplicado = null;
            cupomInput.value = '';
            cupomInput.disabled = false;
            btnAplicarCupom.textContent = 'Aplicar';
            cupomInfoEl.classList.add('oculto');
            atualizarVisualizacaoCarrinho();
        } else {
            aplicarCupom();
        }
    });

    // --- LÓGICA PARA ITENS PERSONALIZADOS ---

    const checkboxesIngredientesHamburguer = document.querySelectorAll('#ingredientes-hamburguer input[type="checkbox"]');
    const checkboxApenasBaseHamburguer = document.getElementById('hamburguer-apenas-base');
    const resumoHamburguer = document.querySelector('#adicionar-hamburguer-montado').previousElementSibling.querySelector('span');
    
    const radiosBasePastel = document.querySelectorAll('#ingredientes-base-pastel input[type="radio"]');
    const checkboxesExtrasPastel = document.querySelectorAll('#ingredientes-extras-pastel input[type="checkbox"]');
    const resumoPastel = document.querySelector('#adicionar-pastel-montado').previousElementSibling.querySelector('span');

    // Lógica para o Hambúrguer Personalizado
    function atualizarHamburguerMontado() {
        const apenasBase = checkboxApenasBaseHamburguer.checked;
        const ingredientesSelecionados = Array.from(document.querySelectorAll('#ingredientes-hamburguer input:checked:not(#hamburguer-apenas-base)'));
        
        const precoBase = 12.00; // Novo preço base (Pão, Bife, Queijo)
        let precoExtras = 0;
        // Só calcula o preço dos extras se a opção "Apenas a Base" não estiver marcada.
        if (!apenasBase) {
            ingredientesSelecionados.forEach(el => precoExtras += parseFloat(el.dataset.price));
        }
        const precoFinal = precoBase + precoExtras;
        resumoHamburguer.textContent = `Total do Item: R$ ${precoFinal.toFixed(2).replace('.', ',')}`;
    }

    // Eventos para os checkboxes do hambúrguer
    checkboxesIngredientesHamburguer.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            if (e.target.id === 'hamburguer-apenas-base') {
                // Se "Apenas a Base" for marcado, desmarca e desabilita os outros
                const outrosCheckboxes = Array.from(checkboxesIngredientesHamburguer).filter(cb => cb.id !== 'hamburguer-apenas-base');
                if (e.target.checked) {
                    outrosCheckboxes.forEach(cb => {
                        cb.checked = false;
                        cb.disabled = true;
                    });
                } else {
                    outrosCheckboxes.forEach(cb => cb.disabled = false);
                }
            } else {
                // Se outro ingrediente for marcado, desmarca "Apenas a Base"
                checkboxApenasBaseHamburguer.checked = false;
            }
            atualizarHamburguerMontado();
        });
    });

    // Lógica para o Pastel Personalizado
    function atualizarPastelMontado() {
        const elementoBase = document.querySelector('#ingredientes-base-pastel input:checked');
        if (!elementoBase) return;

        const precoBase = parseFloat(elementoBase.dataset.price);
        const ingredientesExtras = Array.from(document.querySelectorAll('#ingredientes-extras-pastel input:checked'));
        
        let precoExtra = 0;
        ingredientesExtras.forEach(el => {
            precoExtra += parseFloat(el.dataset.price || 2.00); // Usa 2.00 como fallback
        });
        const precoFinal = precoBase + precoExtra;

        resumoPastel.textContent = `Total do Item: R$ ${precoFinal.toFixed(2).replace('.', ',')}`;
    }

    [...radiosBasePastel, ...checkboxesExtrasPastel].forEach(el => {
        el.addEventListener('change', atualizarPastelMontado);
    });

    // Botão para adicionar Hambúrguer ao carrinho principal
    document.getElementById('adicionar-hamburguer-montado').addEventListener('click', (e) => {
        const apenasBase = checkboxApenasBaseHamburguer.checked;
        const ingredientesSelecionados = Array.from(document.querySelectorAll('#ingredientes-hamburguer input:checked:not(#hamburguer-apenas-base)'));

        if (!apenasBase && ingredientesSelecionados.length === 0) {
            alert('Por favor, selecione os ingredientes ou marque a opção "Apenas a Base".');
            return;
        }

        const precoBase = 12.00;
        let precoFinal = precoBase;
        let nomeItem = 'Hambúrguer (Base)';

        if (!apenasBase) {
            const precoExtras = ingredientesSelecionados.reduce((soma, el) => soma + parseFloat(el.dataset.price), 0);
            precoFinal += precoExtras;
            const nomesIngredientes = ingredientesSelecionados.map(el => el.value);
            
            // Junta os ingredientes de forma mais natural (ex: "Alface e Tomate")
            const listaFormatada = nomesIngredientes.length > 1 
                ? nomesIngredientes.slice(0, -1).join(', ') + ' e ' + nomesIngredientes.slice(-1)
                : nomesIngredientes.join('');
            nomeItem = `Hamb. Personalizado (Base + ${listaFormatada})`;
        }

        adicionarItemAoCarrinho(nomeItem, precoFinal, e.target);

        // Limpa a seleção e reseta o sumário
        checkboxesIngredientesHamburguer.forEach(cb => { cb.checked = false; cb.disabled = false; });
        atualizarHamburguerMontado();
    });

    // Botão para adicionar Pastel ao carrinho principal
    document.getElementById('adicionar-pastel-montado').addEventListener('click', (e) => {
        const elementoBase = document.querySelector('#ingredientes-base-pastel input:checked');
        if (!elementoBase) return;

        const nomeBase = elementoBase.value;
        const precoBase = parseFloat(elementoBase.dataset.price);

        const ingredientesExtras = Array.from(document.querySelectorAll('#ingredientes-extras-pastel input:checked'));
        const precoExtra = ingredientesExtras.reduce((soma, el) => {
            return soma + parseFloat(el.dataset.price || 2.00);
        }, 0);
        const precoFinal = precoBase + precoExtra;

        const nomesExtras = ingredientesExtras.map(el => el.value);
        let nomeItem = `Pastel Personalizado (${nomeBase}`;
        if (nomesExtras.length > 0) {
            nomeItem += ` + ${nomesExtras.join(', ')}`;
        }
        nomeItem += ')';

        adicionarItemAoCarrinho(nomeItem, precoFinal, e.target);

        // Limpa a seleção de extras e reseta o sumário
        ingredientesExtras.forEach(el => el.checked = false);
        document.querySelector('#ingredientes-base-pastel input[value="Carne"]').checked = true; // Reseta para a primeira base
        atualizarPastelMontado();
    });

    // Inicializa a visão do carrinho e dos itens personalizados
    atualizarVisualizacaoCarrinho();
    atualizarHamburguerMontado();
    atualizarPastelMontado();

    // --- LÓGICA DE CÁLCULO DE TAXA DE ENTREGA ---
    const coordsLoja = [-30.1413, -51.1851]; // Coordenadas da Casa Tapera
    let mapRouting = null;

    // Inicializa o mapa oculto se necessário
    if (!mapRouting && typeof L !== 'undefined') {
        mapRouting = L.map('mapa-oculto').setView(coordsLoja, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRouting);
    }

    async function calcularTaxaEntrega(endereco) {
        if (!endereco || typeof L === 'undefined') return;
        
        msgTaxaEntrega.style.display = 'block';
        msgTaxaEntrega.textContent = 'Calculando taxa de entrega...';
        msgTaxaEntrega.style.color = '#cecaca';

        // Adiciona cidade e estado para melhorar a precisão da busca
        const termoBusca = `${endereco}, Porto Alegre - RS`;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(termoBusca)}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data && data.length > 0) {
                const destLat = data[0].lat;
                const destLon = data[0].lon;
                
                // Calcula a rota
                L.Routing.control({
                    waypoints: [
                        L.latLng(coordsLoja),
                        L.latLng(destLat, destLon)
                    ],
                    router: L.Routing.osrmv1({
                        serviceUrl: 'https://router.project-osrm.org/route/v1'
                    }),
                    createMarker: function() { return null; } // Não cria marcadores visuais
                }).on('routesfound', function(e) {
                    const routes = e.routes;
                    const summary = routes[0].summary;
                    const distanciaKm = summary.totalDistance / 1000;
                    
                    const valorPorKm = parseFloat(localStorage.getItem('casaTaperaValorKm')) || 0;
                    valorTaxaEntrega = distanciaKm * valorPorKm;
                    
                    msgTaxaEntrega.textContent = `Distância: ${distanciaKm.toFixed(1)}km | Taxa: R$ ${valorTaxaEntrega.toFixed(2).replace('.', ',')}`;
                    msgTaxaEntrega.style.color = '#ffc600';
                    
                    atualizarVisualizacaoCarrinho();
                }).addTo(mapRouting);
            } else {
                msgTaxaEntrega.textContent = 'Endereço não localizado. Taxa a combinar.';
                msgTaxaEntrega.style.color = '#ff0019';
                valorTaxaEntrega = 0;
                atualizarVisualizacaoCarrinho();
            }
        } catch (error) {
            console.error("Erro ao calcular taxa:", error);
            msgTaxaEntrega.textContent = 'Erro no cálculo. Taxa a combinar.';
            valorTaxaEntrega = 0;
            atualizarVisualizacaoCarrinho();
        }
    }

    // Dispara o cálculo quando o usuário sai do campo de endereço (blur) ou pressiona Enter
    inputEnderecoCliente.addEventListener('change', () => {
        calcularTaxaEntrega(inputEnderecoCliente.value);
    });

    // Adiciona evento de clique para o botão de consultar taxa
    if (btnCalcularTaxa) {
        btnCalcularTaxa.addEventListener('click', () => {
            calcularTaxaEntrega(inputEnderecoCliente.value);
        });
    }

    // --- LÓGICA DO BOTÃO VOLTAR AO TOPO (MOVIDA PARA CÁ) ---
    if (btnVoltarTopo) {
        window.addEventListener('scroll', () => {
            // Compatibilidade ampliada para detecção de scroll em Desktop
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const alturaTotalPagina = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
            const posicaoFimJanela = scrollTop + window.innerHeight;

            // Mostra o botão se houver scroll real E (rolou > 300px OU chegou no fim da página)
            // Usamos 'scrollTop' para compatibilidade total em navegadores Desktop
            const deveMostrar = (scrollTop > 100) && (scrollTop > 300 || posicaoFimJanela >= (alturaTotalPagina - 150));

            btnVoltarTopo.classList.toggle('oculto', !deveMostrar);
        });

        // Adiciona o evento de clique para rolar suavemente para o topo
        btnVoltarTopo.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // --- INÍCIO: Lógica para abrir/fechar a Sidebar de Configurações ---
    if (btnAbrirSidebar && sidebar) {
        btnAbrirSidebar.addEventListener('click', (e) => {
            e.preventDefault();
            sidebar.classList.add('aberta');
        });
    }

    if (btnFecharSidebar && sidebar) {
        btnFecharSidebar.addEventListener('click', () => {
            sidebar.classList.remove('aberta');
        });
    }

    // Fecha a sidebar se o usuário clicar fora dela
    document.addEventListener('click', (e) => {
        if (sidebar && sidebar.classList.contains('aberta') && !sidebar.contains(e.target) && !e.target.closest('.icone-configuracoes')) {
            sidebar.classList.remove('aberta');
        }
    });
    // --- FIM: Lógica para abrir/fechar a Sidebar de Configurações ---

    // --- INÍCIO: Lógica para a Sidebar do Cliente (index.html) ---
    if (sidebar) {
        const btnLinkFaq = document.getElementById('btn-link-faq');
        const btnAlterarTema = document.getElementById('btn-alterar-tema');

        // Lógica para o link do FAQ - Agora rola até o rodapé da página
        if (btnLinkFaq) {
            btnLinkFaq.addEventListener('click', (e) => {
                e.preventDefault();
                // Procura por qualquer footer ou elemento com classe rodape
                const footer = document.querySelector('footer') || document.querySelector('.rodape');
                if (footer) {
                    // Rola suavemente até o rodapé
                    footer.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
                sidebar.classList.remove('aberta'); // Fecha a sidebar após o clique
            });
        }

        // Lógica para alterar tema (se o botão existir)
        if (btnAlterarTema) {
            btnAlterarTema.addEventListener('click', (e) => {
                e.preventDefault();
                alert('Funcionalidade de alterar tema em desenvolvimento!');
                sidebar.classList.remove('aberta'); 
            });
        }

        // Adiciona alerta para links em desenvolvimento
        const btnMeusFavoritos = document.getElementById('btn-meus-favoritos');
        sidebar.querySelectorAll('a[href="#"]').forEach(link => {
            if (link.id !== 'btn-alterar-tema' && link.id !== 'btn-link-faq' && link.id !== 'btn-meus-favoritos') {
                link.addEventListener('click', (e) => e.preventDefault());
            }
        });
    }
    // --- FIM: Lógica para a Sidebar do Cliente ---

    // --- INÍCIO: Lógica para Favoritar Itens ---
    const CHAVE_STORAGE_FAVORITOS = 'casaTaperaFavoritos';

    // Referência para atualização externa
    let atualizarFavoritosSidebarRef = null;

    function carregarFavoritos() {
        const favoritos = JSON.parse(localStorage.getItem(CHAVE_STORAGE_FAVORITOS)) || [];
        favoritos.forEach(nomeItem => {
            document.querySelectorAll(`.item-cardapio-interativo[data-name="${nomeItem}"] .btn-favorito`).forEach(btn => {
                btn.classList.add('favoritado');
            });
        });
    }

    document.body.addEventListener('click', (e) => {
        const favButton = e.target.closest('.btn-favorito');
        if (favButton) {
            e.preventDefault();
            e.stopPropagation();

            const itemElement = favButton.closest('.item-cardapio-interativo');
            const nomeItem = itemElement.dataset.name;
            const isFavoritedNow = favButton.classList.toggle('favoritado');

            let favoritos = JSON.parse(localStorage.getItem(CHAVE_STORAGE_FAVORITOS)) || [];
            if (isFavoritedNow) {
                if (!favoritos.includes(nomeItem)) favoritos.push(nomeItem);
            } else {
                favoritos = favoritos.filter(fav => fav !== nomeItem);
            }
            localStorage.setItem(CHAVE_STORAGE_FAVORITOS, JSON.stringify(favoritos));

            // Sincroniza o botão na página principal se a ação foi no modal
            document.querySelectorAll(`.item-cardapio-interativo[data-name="${nomeItem}"] .btn-favorito`).forEach(btn => {
                btn.classList.toggle('favoritado', isFavoritedNow);
            });

            // Vincula a atualização da sidebar em tempo real
            if (atualizarFavoritosSidebarRef) atualizarFavoritosSidebarRef();
        }
    });

    // --- LÓGICA DO DROPDOWN DE FAVORITOS NA SIDEBAR ---
    const favoritosContainer = document.getElementById('favoritos-container');
    if (favoritosContainer) {
        const listaFavoritosSidebar = document.getElementById('lista-favoritos-sidebar');
        const btnFecharFavoritos = document.getElementById('btn-fechar-favoritos');
        const btnMeusFavoritos = document.getElementById('btn-meus-favoritos');
        const favoritosFooter = document.getElementById('favoritos-footer');
        const btnAddTodosFavoritos = document.getElementById('btn-add-todos-favoritos');

        function atualizarFavoritosSidebar() {
            const favoritos = JSON.parse(localStorage.getItem(CHAVE_STORAGE_FAVORITOS)) || [];
            listaFavoritosSidebar.innerHTML = '';

            if (favoritos.length === 0) {
                listaFavoritosSidebar.innerHTML = '<p style="text-align: center; color: #888; font-size: 0.9em; padding: 10px 0;">Nenhum item favorito.</p>';
                favoritosFooter.style.display = 'none';
                return;
            }

            favoritos.forEach(nomeItem => {
                const itemElement = document.querySelector(`.item-cardapio-interativo[data-name="${nomeItem}"]`);
                if (itemElement) {
                    const preco = parseFloat(itemElement.dataset.price);
                    const div = document.createElement('div');
                    div.className = 'item-favorito';
                    div.dataset.name = nomeItem;
                    div.dataset.price = preco;
                    div.innerHTML = `
                        <span class="nome-item-favorito">${nomeItem}</span>
                        <div class="acoes-favorito-sidebar">
                            <button class="btn-add-favorito-carrinho" title="Adicionar ao Carrinho"><i class="fas fa-plus"></i></button>
                            <button class="btn-remover-favorito-sidebar" title="Remover" data-name="${nomeItem}"><i class="fas fa-times"></i></button>
                        </div>
                    `;
                    listaFavoritosSidebar.appendChild(div);
                }
            });
            favoritosFooter.style.display = 'flex';
        }

        atualizarFavoritosSidebarRef = atualizarFavoritosSidebar;

        btnMeusFavoritos.addEventListener('click', (e) => {
            e.preventDefault();
            atualizarFavoritosSidebar();
            favoritosContainer.classList.toggle('visivel');
            favoritosContainer.classList.toggle('oculto');
        });

        btnFecharFavoritos.addEventListener('click', () => {
            favoritosContainer.classList.remove('visivel');
            favoritosContainer.classList.add('oculto');
        });

        btnAddTodosFavoritos.addEventListener('click', () => {
            const itensFavoritos = listaFavoritosSidebar.querySelectorAll('.item-favorito');
            if (itensFavoritos.length > 0) {
                itensFavoritos.forEach(item => {
                    const nome = item.dataset.name;
                    const preco = parseFloat(item.dataset.price);
                    // A animação de pulso do botão não é necessária aqui, então passamos null
                    adicionarItemAoCarrinho(nome, preco, null);
                });
                alert(`${itensFavoritos.length} item(ns) favorito(s) adicionado(s) ao carrinho!`);
            }
        });

        listaFavoritosSidebar.addEventListener('click', (e) => {
            const addBtn = e.target.closest('.btn-add-favorito-carrinho');
            const removeBtn = e.target.closest('.btn-remover-favorito-sidebar');

            if (addBtn) {
                e.stopPropagation(); // Impede o fechamento da sidebar
                const itemFavorito = addBtn.closest('.item-favorito');
                adicionarItemAoCarrinho(itemFavorito.dataset.name, parseFloat(itemFavorito.dataset.price), addBtn);
            }

            if (removeBtn) {
                e.stopPropagation(); // Impede o fechamento da sidebar ao remover o item
                const nomeItem = removeBtn.dataset.name;
                let favoritos = JSON.parse(localStorage.getItem(CHAVE_STORAGE_FAVORITOS)) || [];
                favoritos = favoritos.filter(fav => fav !== nomeItem);
                localStorage.setItem(CHAVE_STORAGE_FAVORITOS, JSON.stringify(favoritos));
                
                // Sincroniza ícones na página (remove preenchimento do coração)
                document.querySelectorAll(`.item-cardapio-interativo[data-name="${nomeItem}"] .btn-favorito`).forEach(btn => {
                    btn.classList.remove('favoritado');
                });
                atualizarFavoritosSidebar();
            }
        });
    }

    carregarFavoritos();
    // --- FIM: Lógica para Favoritar Itens ---
});