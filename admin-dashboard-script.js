document.addEventListener('DOMContentLoaded', iniciarDashboard);

let todosImoveisDashboard = [];
let chartInstancia = null; // para poder destruir/recriar o gráfico

const formatterMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

async function iniciarDashboard() {
    try {
        // Traz todos os imóveis (ordenados do menor pro maior valor)
        // Isso facilita montar a tabela que precisa ser ordem de preço
        const { data: imoveis, error } = await sb
            .from('imoveis')
            .select('*')
            .order('valor_venda', { ascending: true });

        if (error) throw error;
        
        todosImoveisDashboard = imoveis || [];

        // 1. Extrair corretores únicos para o Filtro Dropdown
        const selectCorretor = document.getElementById('filtro-corretor');
        const listaCorretores = [...new Set(todosImoveisDashboard.map(i => i.corretor).filter(Boolean))].sort();
        
        listaCorretores.forEach(corretorNome => {
            const op = document.createElement('option');
            op.value = corretorNome;
            op.innerText = corretorNome;
            selectCorretor.appendChild(op);
        });

        // Executar o ciclo principal (desenhar com "Todos")
        aplicarFiltroCorretor();

    } catch (error) {
        if (typeof console !== 'undefined') console.warn('Erro no Dashboard.');
    }
}

// ==== Gatilho do Dropdown ====
window.aplicarFiltroCorretor = function() {
    const nomeCaptador = document.getElementById('filtro-corretor').value;
    
    let imoveisFiltrados = todosImoveisDashboard;
    if (nomeCaptador !== 'todos') {
        imoveisFiltrados = todosImoveisDashboard.filter(i => i.corretor === nomeCaptador);
    }

    calcularKpis(imoveisFiltrados);
    desenharGraficoMensal(imoveisFiltrados);
    desenharTabelaValores(imoveisFiltrados);
}

// ==== Função 1: KPIs (Quantidades de Captação) ====
function calcularKpis(lista) {
    const agora = new Date();
    
    // Funcao auxiliar p/ checar se uma data cai nos ultimos X dias
    const captoNoPeriodo = (dataCriacao, dias) => {
        const data = new Date(dataCriacao);
        const diasMilissegundos = dias * 24 * 60 * 60 * 1000;
        return (agora - data) <= diasMilissegundos;
    };

    // Hoje = 1 dia
    const qtdeHj = lista.filter(i => captoNoPeriodo(i.created_at, 1)).length;
    document.getElementById('kpi-dia').innerText = qtdeHj;

    const qtde7 = lista.filter(i => captoNoPeriodo(i.created_at, 7)).length;
    document.getElementById('kpi-semana').innerText = qtde7;

    const qtde15 = lista.filter(i => captoNoPeriodo(i.created_at, 15)).length;
    document.getElementById('kpi-quinzena').innerText = qtde15;

    const qtde30 = lista.filter(i => captoNoPeriodo(i.created_at, 30)).length;
    document.getElementById('kpi-mes').innerText = qtde30;

    const qtde90 = lista.filter(i => captoNoPeriodo(i.created_at, 90)).length;
    document.getElementById('kpi-trimestre').innerText = qtde90;

    const qtde365 = lista.filter(i => captoNoPeriodo(i.created_at, 365)).length;
    document.getElementById('kpi-ano').innerText = qtde365;
}

// ==== Função 2: Gráfico de Barras / Histograma (Últimos 6 meses) ====
function desenharGraficoMensal(lista) {
    // 1. Criar o array dos últimos 6 meses (ex: "Nov 25", "Dez 25", "Jan 26"...)
    const mesesLabel = [];
    const chavesMes = []; // yyyy-mm para facilitar o map
    
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        
        // Label Bonita: Ex "Jan"
        const nomeMes = d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
        mesesLabel.push(nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1));
        
        // Chave Tecnica do Mes: "2026-01"
        const mStr = (d.getMonth() + 1).toString().padStart(2, '0');
        chavesMes.push(`${d.getFullYear()}-${mStr}`);
    }

    // 2. Contar Imoveis por Mês
    const dadosContagem = chavesMes.map(chaveReq => {
        return lista.filter(imovel => {
            const d = new Date(imovel.created_at);
            const mStr = (d.getMonth() + 1).toString().padStart(2, '0');
            const imovelChave = `${d.getFullYear()}-${mStr}`;
            return imovelChave === chaveReq;
        }).length;
    });

    // 3. Montar/Atualizar o ChartJS
    const ctx = document.getElementById('grafico-histograma').getContext('2d');
    
    if (chartInstancia) {
        chartInstancia.destroy();
    }

    chartInstancia = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: mesesLabel,
            datasets: [{
                label: 'Novas Captações',
                data: dadosContagem,
                backgroundColor: '#000000',
                borderRadius: 4,
                barPercentage: 0.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 } // nao mostrar decimais em contagem
                },
                x: {
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// ==== Função 3: Tabela Ordenada por Valores ===
function desenharTabelaValores(lista) {
    const tbody = document.getElementById('tabela-valores');
    
    if (!lista || lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-zinc-500 font-light">Nenhum imóvel filtrado para exibição.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    
    // Obs: A lista já veio ordenada do Supabase por 'valor_venda ASC',
    // então é só iterar
    lista.forEach(imovel => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-zinc-50 transition border-b border-zinc-100 last:border-0';
        
        const corretorDisplay = imovel.corretor ? sanitizeHTML(imovel.corretor) : '<span class="text-zinc-400 italic">Sem Captador</span>';

        tr.innerHTML = `
            <td class="py-4 px-6 font-bold text-black max-w-[200px] truncate" title="${sanitizeHTML(imovel.titulo)}">
                ${sanitizeHTML(imovel.titulo)}
            </td>
            <td class="py-4 px-6 text-zinc-500 font-label text-xs uppercase tracking-widest truncate max-w-[150px]">
                ${corretorDisplay}
            </td>
            <td class="py-4 px-6 text-zinc-600 truncate max-w-[150px]">
                ${sanitizeHTML(imovel.bairro)}
            </td>
            <td class="py-4 px-6 font-bold text-zinc-500">
                ${imovel.area_m2}m²
            </td>
            <td class="py-4 px-6 text-xs text-zinc-500 truncate max-w-[150px]">
                ${imovel.suites} Suíte(s) • ${imovel.vagas} Vaga(s)
            </td>
            <td class="py-4 px-6 text-right font-headline font-bold text-black border-l border-zinc-100 bg-zinc-50/50">
                ${formatterMoeda.format(imovel.valor_venda)}
            </td>
        `;

        tbody.appendChild(tr);
    });
}
