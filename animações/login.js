document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const submitButton = loginForm.querySelector('button[type="submit"]');

    // Credenciais de acesso (substitua por um método seguro em um projeto real)
    const validUsername = 'CASA TAPERA';
    const validPassword = '#CT2411';

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Adiciona feedback visual de carregamento
        submitButton.classList.add('loading');
        submitButton.disabled = true;
        const buttonText = submitButton.querySelector('.btn-text');
        
        // Adiciona o spinner se ele ainda não existir
        let spinner = submitButton.querySelector('.spinner-icon');
        if (!spinner) {
            spinner = document.createElement('i');
            spinner.className = 'fas fa-spinner spinner-icon';
            submitButton.prepend(spinner);
        }
        
        // Atualiza o texto do botão
        spinner.style.display = 'inline-block';
        buttonText.textContent = 'Entrando...';

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // Simula uma pequena demora de rede para o feedback visual ser perceptível
        setTimeout(() => {
            if (username.toUpperCase() === validUsername && password === validPassword) {
                // Login bem-sucedido
                errorMessage.textContent = '';
                // Salva um indicador de que o usuário está logado na sessão do navegador
                sessionStorage.setItem('isLoggedIn', 'true');
                // Redireciona para o painel de controle
                // CORREÇÃO: Como Login.html está em /corpo, o caminho é direto.
                window.location.href = 'PainelDeControle.html';
            } else {
                // Login falhou
                errorMessage.textContent = 'Usuário ou senha inválidos.';
                passwordInput.value = ''; // Limpa o campo de senha
                
                // Remove o estado de carregamento em caso de falha
                submitButton.classList.remove('loading');
                submitButton.disabled = false;
                spinner.style.display = 'none';
                buttonText.textContent = 'Entrar';
            }
        }, 500); // 0.5 segundos de delay simulado
    });

    // Evento para mostrar/ocultar a senha
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        // Altera o ícone do olho
        const icon = togglePasswordBtn.querySelector('i');
        if (type === 'password') {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        } else {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    });
});