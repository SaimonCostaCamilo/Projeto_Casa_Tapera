document.addEventListener('DOMContentLoaded', () => {
    const listaContainer = document.getElementById('lista-horarios-edicao');
    const btnSalvar = document.getElementById('btn-salvar-horarios');
    const timePicker = document.getElementById('time-picker-custom');
    const colunaHoras = document.getElementById('coluna-horas');
    const colunaMinutos = document.getElementById('coluna-minutos');
    const btnConfirmarHorario = document.getElementById('btn-confirmar-horario');
    let targetButton = null; // Armazena o botão que abriu o seletor

    const diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    const horariosPadrao = {
        0: { abertura: '08:00', fechamento: '22:00', fechado: false },
        1: { fechado: true },
        2: { fechado: true },
        3: { abertura: '17:00', fechamento: '22:00', fechado: false },
        4: { abertura: '17:00', fechamento: '22:00', fechado: false },
        5: { abertura: '17:00', fechamento: '22:00', fechado: false },
        6: { abertura: '08:00', fechamento: '22:00', fechado: false },
    };

    let horariosAtuais = JSON.parse(localStorage.getItem('casaTaperaHorarios')) || horariosPadrao;

    function renderizarHorarios() {
        listaContainer.innerHTML = '';
        diasDaSemana.forEach((dia, index) => {
            const horario = horariosAtuais[index] || {};
            const isFechado = horario.fechado;

            const li = document.createElement('li');
            li.className = 'dia-horario';
            li.dataset.diaIndex = index;
            li.innerHTML = `
                <div class="dia-horario-header">
                    <h3>${dia}</h3>
                    <label>
                        <input type="checkbox" class="check-fechado" ${isFechado ? 'checked' : ''}> Fechado
                    </label>
                </div>
                <div class="campos-horario ${isFechado ? 'desabilitado' : ''}">
                    <div>Abertura: 
                        <button class="btn-time-picker input-abertura" data-time="${horario.abertura || '00:00'}">
                            <span>${horario.abertura || '00:00'}</span> <i class="fas fa-clock"></i></button>
                    </div>
                    <div>Fechamento: 
                        <button class="btn-time-picker input-fechamento" data-time="${horario.fechamento || '00:00'}">
                            <span>${horario.fechamento || '00:00'}</span> <i class="fas fa-clock"></i></button>
                    </div>
                </div>
            `;
            listaContainer.appendChild(li);
        });
    }

    listaContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('check-fechado')) {
            const li = e.target.closest('.dia-horario');
            const campos = li.querySelector('.campos-horario');
            campos.classList.toggle('desabilitado', e.target.checked);
        }
    });

    btnSalvar.addEventListener('click', () => {
        const novosHorarios = {};
        document.querySelectorAll('.dia-horario').forEach(li => {
            const index = li.dataset.diaIndex;
            const isFechado = li.querySelector('.check-fechado').checked;
            
            if (isFechado) {
                novosHorarios[index] = { fechado: true };
            } else {
                const abertura = li.querySelector('.input-abertura').dataset.time;
                const fechamento = li.querySelector('.input-fechamento').dataset.time;
                novosHorarios[index] = { abertura, fechamento, fechado: false };
            }
        });
        localStorage.setItem('casaTaperaHorarios', JSON.stringify(novosHorarios));
        alert('Horários de funcionamento salvos com sucesso!');
    });

    // --- LÓGICA DO SELETOR DE HORÁRIO CUSTOMIZADO ---
    function popularColunas(horaAtual, minutoAtual) {
        colunaHoras.innerHTML = '';
        colunaMinutos.innerHTML = '';
        for (let i = 0; i < 24; i++) {
            const hora = i.toString().padStart(2, '0');
            const div = document.createElement('div');
            div.className = 'time-picker-opcao';
            div.textContent = hora;
            div.dataset.valor = hora;
            if (hora === horaAtual) div.classList.add('selecionado');
            colunaHoras.appendChild(div);
        }
        for (let i = 0; i < 60; i++) { // Agora com incrementos de 1 minuto
            const minuto = i.toString().padStart(2, '0');
            const div = document.createElement('div');
            div.className = 'time-picker-opcao';
            div.textContent = minuto;
            div.dataset.valor = minuto;
            if (minuto === minutoAtual) div.classList.add('selecionado');
            colunaMinutos.appendChild(div);
        }
    }

    listaContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-time-picker');
        if (btn) {
            targetButton = btn;
            const [hora, minuto] = btn.dataset.time.split(':');
            popularColunas(hora, minuto);

            const rect = btn.getBoundingClientRect();
            timePicker.style.top = `${rect.bottom + window.scrollY}px`;
            timePicker.style.left = `${rect.left + window.scrollX}px`;
            timePicker.style.display = 'block';
        }
    });

    timePicker.addEventListener('click', (e) => {
        if (e.target.classList.contains('time-picker-opcao')) {
            const coluna = e.target.parentElement;
            coluna.querySelector('.selecionado')?.classList.remove('selecionado');
            e.target.classList.add('selecionado');
        }
    });

    btnConfirmarHorario.addEventListener('click', () => {
        const horaSelecionada = colunaHoras.querySelector('.selecionado')?.dataset.valor || '00';
        const minutoSelecionado = colunaMinutos.querySelector('.selecionado')?.dataset.valor || '00';
        const novoHorario = `${horaSelecionada}:${minutoSelecionado}`;

        if (targetButton) {
            targetButton.querySelector('span').textContent = novoHorario;
            targetButton.dataset.time = novoHorario;
        }
        timePicker.style.display = 'none';
    });

    // Fecha o seletor se clicar fora dele
    document.addEventListener('click', (e) => {
        if (!timePicker.contains(e.target) && !e.target.closest('.btn-time-picker')) {
            timePicker.style.display = 'none';
        }
    });

    renderizarHorarios();
});