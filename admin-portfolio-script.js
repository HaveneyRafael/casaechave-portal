document.addEventListener('DOMContentLoaded', carregarPortfolio);

const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

let todosImoveis = [];
let usuarioLogado = null;

async function carregarPortfolio() {
    const tbody = document.getElementById('tabela-corpo');

    try {
        // Obter usuário logado atual
        const { data: { user } } = await sb.auth.getUser();
        usuarioLogado = user;

        const { data: imoveis, error } = await sb
            .from('imoveis')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        todosImoveis = imoveis || [];

        desenharTabela(todosImoveis);

    } catch (error) {
        if (typeof console !== 'undefined') console.warn('Falha ao carregar portfólio.');
        document.getElementById('tabela-corpo').innerHTML = '<tr><td colspan="5" class="p-12 text-center text-red-500 font-light">Falha na conexão. Tente recarregar.</td></tr>';
    }
}

// ==== Função para desenhar a tabela com base num array de imóveis ====
function desenharTabela(listaImoveis) {
    const tbody = document.getElementById('tabela-corpo');
    
    if (!listaImoveis || listaImoveis.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-12 text-center text-zinc-500 font-light">Nenhum imóvel encontrado.</td></tr>';
        return;
    }

    tbody.innerHTML = ''; // Limpar aviso

    listaImoveis.forEach(imovel => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-zinc-50 transition border-b border-zinc-100 last:border-0';

        // Pega a primeira foto
        const fotoThumb = (imovel.imagens && imovel.imagens.length > 0) 
            ? imovel.imagens[0] 
            : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=150&q=80&blur=50';

        // Todos os status possiveis
        const opcoesStatus = ['Lançamento', 'Pronto', 'Em Construção', 'Pausado'];
        const selectOptions = opcoesStatus.map(op => 
            `<option value="${op}" ${imovel.status === op ? 'selected' : ''}>${op}</option>`
        ).join('');
        
        // Gerar um ID curto para visualização
        const shortId = imovel.id.substring(0, 6).toUpperCase();

        // Controla se o botão de Excluir aparece (baseado na role do usuário autenticado)
        let botaoExcluir = '';
        const userRole = usuarioLogado?.user_metadata?.role;
        if (usuarioLogado && userRole !== 'corretor') {
            botaoExcluir = `
                <button onclick="removerImovel('${imovel.id}')" class="text-zinc-400 hover:text-[#ff291b] p-2 transition rounded-full hover:bg-red-50 text-sm flex items-center justify-end w-full gap-2 font-bold select-none">
                    <span class="material-symbols-outlined text-lg">delete</span> Excluir
                </button>
            `;
        } else {
            botaoExcluir = `<span class="text-[10px] text-zinc-300 uppercase tracking-widest font-label mt-2 block">Sem Permissão</span>`;
        }

        let precoVisualizacao = '';
        if (imovel.valor_venda > 0 && imovel.valor_aluguel > 0) {
            precoVisualizacao = `<div class="flex flex-col"><span class="text-xs text-zinc-500 font-normal">Venda: ${formatter.format(imovel.valor_venda)}</span><span>Locação: ${formatter.format(imovel.valor_aluguel)}</span></div>`;
        } else if (imovel.valor_aluguel > 0) {
            precoVisualizacao = `<span class="text-tertiary">Locação: ${formatter.format(imovel.valor_aluguel)}</span>`;
        } else {
            precoVisualizacao = formatter.format(imovel.valor_venda || 0);
        }

        tr.innerHTML = `
            <td class="p-4 align-top w-28 cursor-pointer hover:opacity-80 transition" title="Clique para editar" onclick="window.location.href='admin-editar.html?id=${imovel.id}'">
                <div class="flex flex-col items-start gap-2">
                    <img src="${fotoThumb}" class="w-16 h-16 object-cover rounded-md shadow-sm">
                    <span class="text-[10px] font-bold text-zinc-400 tracking-widest font-label uppercase">#${shortId}</span>
                </div>
            </td>
            <td class="p-4 align-top cursor-pointer group" title="Clique para editar" onclick="window.location.href='admin-editar.html?id=${imovel.id}'">
                <p class="font-bold text-base text-black truncate max-w-sm mb-1 group-hover:text-[#ff291b] transition">${sanitizeHTML(imovel.titulo)}</p>
                <p class="text-xs text-zinc-500 uppercase tracking-widest font-label">${sanitizeHTML(imovel.tipo)} • ${sanitizeHTML(imovel.bairro)}</p>
            </td>
            <td class="p-4 align-top">
                <div class="font-bold whitespace-nowrap text-zinc-800">${precoVisualizacao}</div>
            </td>
            <td class="p-4 align-top">
                <select onchange="atualizarStatus('${imovel.id}', this.value)" class="bg-surface-container-low border border-zinc-200 py-1.5 px-3 rounded-md text-xs font-label uppercase tracking-widest text-zinc-600 focus:border-black outline-none cursor-pointer">
                    ${selectOptions}
                </select>
            </td>
            <td class="p-4 align-top text-right">
                ${botaoExcluir}
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// ==== Função de Pesquisa ====
window.filtrarPortfolio = function() {
    const termo = document.getElementById('campo-busca').value.toLowerCase();
    
    // Filtra procurando titulo, bairro ou o inicio do ID
    const filtrados = todosImoveis.filter(imovel => {
        const shortId = imovel.id.substring(0, 6).toLowerCase();
        return imovel.titulo.toLowerCase().includes(termo) || 
               imovel.bairro.toLowerCase().includes(termo) ||
               shortId.includes(termo);
    });
    
    desenharTabela(filtrados);
}

// ==== Função para trocar Status no banco ====
window.atualizarStatus = async function(id, novoStatus) {
    try {
        const { error } = await sb
            .from('imoveis')
            .update({ status: novoStatus })
            .eq('id', id);

        if (error) throw error;
        
    } catch (error) {
        alert("Erro ao alterar o status do imóvel.");
        if (typeof console !== 'undefined') console.warn('Falha ao atualizar status.');
        carregarPortfolio(); // recarregar com as ultimas verdades
    }
}

// ==== Função para Deletar Imóvel do banco ====
window.removerImovel = async function(id) {
    // Confirmação de segurança dupla (alerta nativo)
    const prosseguir = confirm("Tem certeza absoluta? Essa ação não pode ser desfeita e deletará o imóvel definitivamente da vitrine.");
    
    if (!prosseguir) return;

    try {
        const { error } = await sb
            .from('imoveis')
            .delete()
            .eq('id', id);

        if (error) throw error;
        
        // Remove da tela sem precisar recarregar a página inteira
        carregarPortfolio();

    } catch (error) {
        alert("Erro ao remover imóvel.");
        if (typeof console !== 'undefined') console.warn('Falha ao remover imóvel.');
    }
}
