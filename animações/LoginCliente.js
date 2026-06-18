document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-login-cliente');
    const nomeInput = document.getElementById('cliente-nome');
    const telefoneInput = document.getElementById('cliente-telefone');
    const emailInput = document.getElementById('cliente-email');
    const cpfInput = document.getElementById('cliente-cpf');
    const cepInput = document.getElementById('cliente-cep');
    const ruaInput = document.getElementById('cliente-rua');
    const numeroInput = document.getElementById('cliente-numero');
    const bairroInput = document.getElementById('cliente-bairro');
    const cidadeInput = document.getElementById('cliente-cidade');
    const estadoInput = document.getElementById('cliente-estado');
    const nascimentoInput = document.getElementById('cliente-nascimento');
    const senhaInput = document.getElementById('cliente-senha');
    const repetirSenhaInput = document.getElementById('cliente-repetir-senha');
    const complementoInput = document.getElementById('cliente-complemento');
    const termosCheck = document.getElementById('termos-check');

    const cpfError = document.getElementById('cpf-error');
    const cepError = document.getElementById('cep-error');
    const senhaError = document.getElementById('senha-error');
    const repetirSenhaError = document.getElementById('repetir-senha-error');
    const formError = document.getElementById('form-error-message');
    const cepSpinner = document.getElementById('cep-spinner');

    // Seleção dos elementos de requisito da senha
    const reqComprimento = document.getElementById('req-comprimento');
    const reqMaiuscula = document.getElementById('req-maiuscula');
    const reqMinuscula = document.getElementById('req-minuscula');
    const reqNumero = document.getElementById('req-numero');
    const reqEspecial = document.getElementById('req-especial');

    // --- FUNÇÕES DE MÁSCARA ---
    const formatarCPF = (value) => {
        value = (value || "").replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        if (value.length > 9) return value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
        if (value.length > 6) return value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
        if (value.length > 3) return value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
        return value;
    };

    const formatarTelefone = (value) => {
        value = (value || "").replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);
        if (value.length > 10) return value.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        if (value.length > 6) return value.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        if (value.length > 2) return value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
        if (value.length > 0) return value.replace(/^(\d*)/, '($1');
        return value;
    };

    const formatarCEP = (value) => {
        value = (value || "").replace(/\D/g, '');
        if (value.length > 8) value = value.slice(0, 8);
        if (value.length > 5) return value.replace(/^(\d{5})(\d)/, '$1-$2');
        return value;
    };

    // Carrega dados do cliente, se existirem, para preencher o formulário
    const clienteSalvo = JSON.parse(localStorage.getItem('clienteTapera'));
    if (clienteSalvo) {
        nomeInput.value = clienteSalvo.nome || '';
        telefoneInput.value = formatarTelefone(clienteSalvo.telefone || '');
        emailInput.value = clienteSalvo.email || '';
        cpfInput.value = formatarCPF(clienteSalvo.cpf || '');
        cepInput.value = formatarCEP(clienteSalvo.cep || '');
        ruaInput.value = clienteSalvo.rua || '';
        numeroInput.value = clienteSalvo.numero || '';
        bairroInput.value = clienteSalvo.bairro || '';
        cidadeInput.value = clienteSalvo.cidade || '';
        estadoInput.value = clienteSalvo.estado || '';
        nascimentoInput.value = clienteSalvo.nascimento || '';
        complementoInput.value = clienteSalvo.complemento || '';
    }

    // --- VALIDAÇÃO DE CPF ---
    function validarCPF(cpf) {
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf === '' || cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
        let soma = 0;
        let resto;
        for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
        resto = (soma * 10) % 11;
        if ((resto === 10) || (resto === 11)) resto = 0;
        if (resto !== parseInt(cpf.substring(9, 10))) return false;
        soma = 0;
        for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
        resto = (soma * 10) % 11;
        if ((resto === 10) || (resto === 11)) resto = 0;
        if (resto !== parseInt(cpf.substring(10, 11))) return false;
        return true;
    }

    cpfInput.addEventListener('input', (e) => {
        e.target.value = formatarCPF(e.target.value);
        const value = e.target.value;

        if (value.length > 0 && !validarCPF(value)) {
            cpfError.textContent = 'CPF inválido.';
            cpfInput.style.borderColor = '#e74c3c';
        } else {
            cpfError.textContent = '';
            cpfInput.style.borderColor = '#555';
        }
    });

    // Máscara Telefone (Suporta Celular e Fixo)
    telefoneInput.addEventListener('input', (e) => {
        e.target.value = formatarTelefone(e.target.value);
    });

    // Máscara CEP
    cepInput.addEventListener('input', (e) => {
        e.target.value = formatarCEP(e.target.value);
    });

    // Limpeza e Normalização de E-mail
    emailInput.addEventListener('input', (e) => {
        let value = e.target.value.toLowerCase().trim();
        e.target.value = value;
    });

    // --- VALIDAÇÃO DE SENHA ---
    function validarSenha(senha) {
        // Mínimo de 8 caracteres, pelo menos uma maiúscula, uma minúscula, um número e um caractere especial
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{8,}$/;
        return regex.test(senha);
    }

    senhaInput.addEventListener('input', () => {
        senhaError.textContent = ''; // Limpa o erro ao digitar
        const senha = senhaInput.value;

        // Validações individuais para feedback em tempo real
        const checks = {
            comprimento: senha.length >= 8,
            maiuscula: /[A-Z]/.test(senha),
            minuscula: /[a-z]/.test(senha),
            numero: /\d/.test(senha),
            especial: /[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(senha)
        };

        const atualizarItem = (el, valido) => {
            if (!el) return;
            const icone = el.querySelector('i');
            el.style.color = valido ? '#2ecc71' : '#888'; // Verde se válido, cinza se não
            if (icone) icone.className = valido ? 'fas fa-check-circle' : 'fas fa-times-circle';
        };

        atualizarItem(reqComprimento, checks.comprimento);
        atualizarItem(reqMaiuscula, checks.maiuscula);
        atualizarItem(reqMinuscula, checks.minuscula);
        atualizarItem(reqNumero, checks.numero);
        atualizarItem(reqEspecial, checks.especial);

        if (senhaInput.value.length > 0 && !validarSenha(senhaInput.value)) {
            senhaError.textContent = 'A senha deve ter no mínimo 8 caracteres, com letras maiúsculas e minúsculas, números e símbolos.';
            senhaInput.style.borderColor = '#e74c3c';
        } else {
            senhaInput.style.borderColor = '#555';
        }
        // Também verifica a repetição da senha se a senha principal for alterada
        if (repetirSenhaInput.value.length > 0) {
            repetirSenhaInput.dispatchEvent(new Event('input'));
        }
    });

    // --- LÓGICA PARA MOSTRAR/ESCONDER SENHA ---
    document.querySelectorAll('.btn-toggle-senha').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = btn.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
                btn.title = "Ocultar Senha";
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
                btn.title = "Mostrar Senha";
            }
        });
    });

    repetirSenhaInput.addEventListener('input', () => {
        repetirSenhaError.textContent = ''; // Limpa o erro ao digitar
        if (repetirSenhaInput.value !== senhaInput.value) {
            repetirSenhaError.textContent = 'As senhas não coincidem.';
            repetirSenhaInput.style.borderColor = '#e74c3c';
        } else {
            repetirSenhaInput.style.borderColor = '#555';
        }
    });

    // --- CONSUMO DA API VIACEP ---
    const limparCamposEndereco = () => {
        ruaInput.value = '';
        bairroInput.value = '';
        cidadeInput.value = '';
        estadoInput.value = '';
    };

    const preencherCamposEndereco = (data) => {
        ruaInput.value = data.logradouro;
        bairroInput.value = data.bairro;
        cidadeInput.value = data.localidade;
        estadoInput.value = data.uf;
        // Foca no campo de número para o usuário preencher
        numeroInput.focus();
    };

    cepInput.addEventListener('blur', async () => {
        const cep = cepInput.value.replace(/\D/g, '');

        if (cep.length !== 8) {
            cepError.textContent = 'CEP deve conter 8 dígitos.';
            limparCamposEndereco();
            return;
        }

        cepError.textContent = '';
        cepSpinner.classList.remove('oculto');
        ruaInput.disabled = true;
        bairroInput.disabled = true;
        cidadeInput.disabled = true;
        estadoInput.disabled = true;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (data.erro) {
                cepError.textContent = 'CEP não encontrado.';
                limparCamposEndereco();
            } else {
                preencherCamposEndereco(data);
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            cepError.textContent = 'Erro ao consultar o CEP. Tente novamente.';
            limparCamposEndereco();
        } finally {
            cepSpinner.classList.add('oculto');
            ruaInput.disabled = false;
            bairroInput.disabled = false;
            cidadeInput.disabled = false;
            estadoInput.disabled = false;
        }
    });

    // --- SUBMISSÃO DO FORMULÁRIO ---
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        formError.textContent = '';

        // Validações
        if (!termosCheck.checked) {
            formError.textContent = 'Você deve aceitar os Termos de Uso e a Política de Privacidade para continuar.';
            return;
        }

        if (!validarCPF(cpfInput.value)) {
            formError.textContent = 'O CPF informado é inválido. Por favor, corrija.';
            cpfInput.focus();
            return;
        }

        if (!nomeInput.value.trim() || !telefoneInput.value.trim() || !cepInput.value.trim() || !ruaInput.value.trim() || !numeroInput.value.trim() || !bairroInput.value.trim() || !cidadeInput.value.trim() || !estadoInput.value.trim() || !nascimentoInput.value.trim()) {
            formError.textContent = 'Por favor, preencha todos os campos obrigatórios.';
            return;
        }

        if (new Date(nascimentoInput.value) > new Date()) {
            formError.textContent = 'Data de nascimento inválida.';
            nascimentoInput.focus();
            return;
        }

        // Validação da senha
        if (!validarSenha(senhaInput.value)) {
            formError.textContent = 'A senha não atende aos requisitos de segurança.';
            senhaInput.focus();
            return;
        }

        // Validação de repetição de senha
        if (senhaInput.value !== repetirSenhaInput.value) {
            formError.textContent = 'As senhas não coincidem.';
            repetirSenhaInput.focus();
            return;
        }

        // Validação do checkbox de termos
        if (!termosCheck.checked) {
            formError.textContent = 'Você deve aceitar os Termos e a Política de Privacidade para continuar.';
            return;
        }

        // Gera um ID único se o cliente ainda não tiver um (baseado no localStorage atual ou novo)
        const dadosAntigos = JSON.parse(localStorage.getItem('clienteTapera'));
        const clienteId = dadosAntigos && dadosAntigos.id ? dadosAntigos.id : `cliente-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // Monta o objeto do cliente
        const clienteData = {
            id: clienteId,
            nome: nomeInput.value.trim(),
            telefone: formatarTelefone(telefoneInput.value),
            email: emailInput.value.trim(),
            cpf: formatarCPF(cpfInput.value),
            senha: senhaInput.value.trim(), // Armazenando a senha (ver observação de segurança)
            nascimento: nascimentoInput.value.trim(),
            cep: formatarCEP(cepInput.value),
            rua: ruaInput.value.trim(),
            numero: numeroInput.value.trim(),
            bairro: bairroInput.value.trim(),
            cidade: cidadeInput.value.trim(),
            estado: estadoInput.value.trim(),
            complemento: complementoInput.value.trim(),
            foto: clienteSalvo ? clienteSalvo.foto : null, // Preserva a foto se estiver apenas atualizando dados
            // Combina os campos de endereço para o campo 'endereco' legado
            endereco: `${ruaInput.value.trim()}, ${numeroInput.value.trim()} - ${bairroInput.value.trim()}, ${cidadeInput.value.trim()} - ${estadoInput.value.trim()}`
        };

        // 1. Salva na sessão atual (para uso no carrinho)
        localStorage.setItem('clienteTapera', JSON.stringify(clienteData));

        // 2. Salva na lista de Clientes Cadastrados (banco de dados local)
        const clientesCadastrados = JSON.parse(localStorage.getItem('clientesCadastradosTapera')) || [];
        
        // Verifica se já existe pelo CPF ou ID para atualizar, senão adiciona
        const indexExistente = clientesCadastrados.findIndex(c => {
            const cpfSalvoRaw = (c.cpf || "").replace(/\D/g, "");
            const cpfNovoRaw = (clienteData.cpf || "").replace(/\D/g, "");
            return c.id === clienteId || (cpfNovoRaw && cpfSalvoRaw === cpfNovoRaw);
        });
        
        if (indexExistente >= 0) {
            clientesCadastrados[indexExistente] = clienteData; // Atualiza dados
        } else {
            clientesCadastrados.push(clienteData); // Adiciona novo
        }
        localStorage.setItem('clientesCadastradosTapera', JSON.stringify(clientesCadastrados));
        localStorage.setItem('ultimoClienteCadastrado', JSON.stringify(clienteData)); // Marcar cliente adicionado para verificação

        // Feedback e redirecionamento
        alert(`Bem-vindo(a), ${clienteData.nome}! Seus dados foram salvos com sucesso e foram adicionados ao cadastro de clientes.`);
        window.location.href = 'index.html';
    });

    // --- INÍCIO: Lógica para Modal de Termos e Política ---
    const modalDocumento = document.getElementById('modal-documento');
    if (modalDocumento) {
        const btnAbrirTermos = document.getElementById('abrir-termos');
        const btnAbrirPolitica = document.getElementById('abrir-politica');
        const btnFecharModal = modalDocumento.querySelector('.btn-fechar-modal');
        const modalTitulo = document.getElementById('modal-doc-titulo');
        const modalConteudo = document.getElementById('modal-doc-conteudo');

        const conteudoTermos = `
            <h3>1. Aceitação dos Termos</h3>
            <p>Ao se cadastrar e utilizar os serviços da Casa Tapera, você concorda em cumprir com os seguintes termos e condições.</p>
            <h3>2. Cadastro do Cliente</h3>
            <p>Você concorda em fornecer informações verdadeiras, precisas e completas durante o processo de cadastro e em manter essas informações atualizadas.</p>
            <h3>3. Uso do Serviço</h3>
            <p>O serviço destina-se ao uso pessoal para realização de pedidos. Qualquer uso indevido, fraudulento ou para fins comerciais é estritamente proibido.</p>
            <h3>4. Propriedade Intelectual</h3>
            <p>Todo o conteúdo presente neste site, incluindo textos, imagens e design, é propriedade da Casa Tapera e protegido por leis de direitos autorais.</p>
            <h3>5. Limitação de Responsabilidade</h3>
            <p>O sistema é fornecido "como está". Não garantimos que o serviço será ininterrupto ou livre de erros.</p>
        `;

        const conteudoPolitica = `
            <h3>1. Coleta de Informações</h3>
            <p>Coletamos as informações que você nos fornece no momento do cadastro, como nome, telefone, e-mail e endereço. Estes dados são armazenados localmente em seu navegador (\`localStorage\`) para facilitar seus futuros pedidos.</p>
            <h3>2. Uso das Informações</h3>
            <p>Suas informações são usadas exclusivamente para processar seus pedidos, incluindo a geração da mensagem para o WhatsApp e o preenchimento automático de campos para sua conveniência.</p>
            <h3>3. Compartilhamento de Dados</h3>
            <p>Não compartilhamos suas informações pessoais com terceiros. Os dados do pedido são enviados via WhatsApp diretamente para o número da loja, como parte do processo de finalização do pedido.</p>
            <h3>4. Segurança</h3>
            <p>Seus dados são armazenados no seu próprio dispositivo. Não temos um banco de dados centralizado com informações de clientes. A segurança dos dados no seu dispositivo é de sua responsabilidade.</p>
            <h3>5. Seus Direitos</h3>
            <p>Você pode visualizar e limpar os dados armazenados a qualquer momento, limpando o cache e os dados de site do seu navegador.</p>
        `;

        const abrirModal = (titulo, conteudo) => {
            modalTitulo.textContent = titulo;
            modalConteudo.innerHTML = conteudo;
            modalDocumento.classList.remove('oculto');
        };

        const fecharModal = () => {
            modalDocumento.classList.add('oculto');
        };

        btnAbrirTermos.addEventListener('click', () => abrirModal('Termos de Uso', conteudoTermos));
        btnAbrirPolitica.addEventListener('click', () => abrirModal('Política de Privacidade', conteudoPolitica));
        btnFecharModal.addEventListener('click', fecharModal);
        modalDocumento.addEventListener('click', (e) => { if (e.target === modalDocumento) fecharModal(); });
    }
    // --- FIM: Lógica para Modal de Termos e Política ---

});