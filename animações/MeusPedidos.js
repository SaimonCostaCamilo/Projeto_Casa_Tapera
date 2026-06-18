document.addEventListener('DOMContentLoaded', () => {
    const listaAndamento = document.getElementById('lista-pedidos-andamento');
    const listaHistorico = document.getElementById('lista-pedidos-historico');

    const pedidos = JSON.parse(localStorage.getItem('pedidosTapera')) || [];

    // Ordena do mais recente para o mais antigo
    const pedidosOrdenados = pedidos.sort((a, b) => {
        const dataA = new Date(parseInt(a.id.split('-')[1]));
        const dataB = new Date(parseInt(b.id.split('-')[1]));
        return dataB - dataA;
    });

    let temAndamento = false;
    let temHistorico = false;

    pedidosOrdenados.forEach(pedido => {
        const statusNormalizado = pedido.status.toLowerCase().trim();
        const isAndamento = ['novo', 'em preparo'].includes(statusNormalizado);
        const container = isAndamento ? listaAndamento : listaHistorico;
        
        if (isAndamento) temAndamento = true;
        else temHistorico = true;

        const dataPedido = new Date(parseInt(pedido.id.split('-')[1]));
        const dataFormatada = dataPedido.toLocaleDateString('pt-BR') + ' às ' + dataPedido.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});

        const itensHtml = Object.entries(pedido.items || {}).map(([nome, item]) => 
            `<li><span>${item.quantity}x ${nome}</span> <span>R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span></li>`
        ).join('');

        const valorTotal = (pedido.valorFinal || pedido.subTotal || 0).toFixed(2).replace('.', ',');
        const statusClass = `status-${statusNormalizado.replace(/\s+/g, '-')}`;
        
        const card = document.createElement('div');
        card.className = `card-pedido ${statusClass}`;
        card.innerHTML = `
            <div class="cabecalho-card">
                <span class="data-pedido">${dataFormatada}</span>
                <span class="status-badge">${pedido.status.toUpperCase()}</span>
            </div>
            <div class="itens-pedido">
                <ul>${itensHtml}</ul>
            </div>
            <div class="total-pedido">Total: R$ ${valorTotal}</div>
        `;
        container.appendChild(card);
    });

    if (!temAndamento) listaAndamento.innerHTML = '<div class="mensagem-vazio">Nenhum pedido em andamento.</div>';
    if (!temHistorico) listaHistorico.innerHTML = '<div class="mensagem-vazio">Nenhum pedido anterior.</div>';
});