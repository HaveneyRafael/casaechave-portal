document.addEventListener('DOMContentLoaded', carregarLeads);

let todosLeads = [];

async function carregarLeads() {
    const tbody = document.getElementById('tabela-leads');

    try {
        // Traz os leads e FAZ JOIN na tabela 'imoveis' para pegar apenas o 'titulo'
        const { data: leads, error } = await sb
            .from('leads')
            .select(`
                *,
                imoveis ( titulo, bairro )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        todosLeads = leads || [];
        desenharTabela(todosLeads);

    } catch (error) {
        console.warn('Falha ao carregar contatos.');
        tbody.innerHTML = '<tr><td colspan="6" class="p-12 text-center text-red-500 font-light">Falha na conexão com os contatos.</td></tr>';
    }
}

// Formatar data bonitinha
function formatarData(dataString) {
    const d = new Date(dataString);
    return d.toLocaleDateString('pt-BR', { 
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }) + 'h';
}

function desenharTabela(lista) {
    const tbody = document.getElementById('tabela-leads');
    
    // Calcula quantos estão pendentes ('Novo')
    const pendentes = todosLeads.filter(l => l.status === 'Novo').length;
    document.getElementById('badge-total').innerText = pendentes;
    
    if (!lista || lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-12 text-center text-zinc-500 font-light">Nenhum contato encontrado.</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    lista.forEach(lead => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-zinc-50 transition border-b border-zinc-100 last:border-0';
        
        // Imóvel de interesse: prioriza o campo "mensagem" (texto livre do cliente)
        // Se tiver imovel_id vinculado, mostra o título do imóvel do banco como informação extra
        let nomeImovel = '';
        if (lead.mensagem) {
            nomeImovel = sanitizeHTML(lead.mensagem);
            if (lead.imoveis) {
                nomeImovel += `<br><span class="text-xs text-zinc-400 font-normal">${sanitizeHTML(lead.imoveis.titulo)} — ${sanitizeHTML(lead.imoveis.bairro)}</span>`;
            }
        } else if (lead.imoveis) {
            nomeImovel = `${sanitizeHTML(lead.imoveis.titulo)}<br><span class="text-xs text-zinc-400 font-normal">${sanitizeHTML(lead.imoveis.bairro)}</span>`;
        } else {
            nomeImovel = '<span class="text-zinc-400">Não informado</span>';
        }

        // Origem do contato (badge colorido)
        const origem = lead.origem || 'Desconhecida';
        let origemClass = 'text-zinc-500 bg-zinc-50 border-zinc-200';
        if (origem === 'Agendar Visita') {
            origemClass = 'text-blue-600 bg-blue-50 border-blue-200';
        } else if (origem === 'Interessado') {
            origemClass = 'text-purple-600 bg-purple-50 border-purple-200';
        }

        // Dropdown de Atendimento
        const statusClass = lead.status === 'Novo' ? 'text-red-600 bg-red-50 border-red-200' : 
                            (lead.status === 'Em Atendimento' ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200');

        const opcoesStatus = ['Novo', 'Em Atendimento', 'Finalizado'];
        const selectOptions = opcoesStatus.map(op => 
            `<option value="${op}" ${lead.status === op ? 'selected' : ''} class="text-black bg-white">${op}</option>`
        ).join('');

        // Monta o link pro whatsapp limpando o numero de caracteres especiais (apenas números)
        const zapLimpo = lead.telefone.replace(/\D/g, "");
        const zapLink = `https://wa.me/55${zapLimpo}`;

        tr.innerHTML = `
            <td class="p-5 align-middle text-zinc-500 text-xs">
                ${formatarData(lead.created_at)}
            </td>
            <td class="p-5 align-middle">
                <p class="font-bold text-base text-black truncate max-w-[200px] mb-1 capitalize">${sanitizeHTML(lead.nome)}</p>
                <p class="text-[11px] text-zinc-500 uppercase tracking-widest font-label">${sanitizeHTML(lead.telefone)}</p>
            </td>
            <td class="p-5 align-middle font-bold text-sm text-zinc-700 max-w-[220px]">
                ${nomeImovel}
            </td>
            <td class="p-5 align-middle">
                <span class="inline-block border rounded-md text-[10px] font-label uppercase tracking-widest px-3 py-1.5 font-bold ${origemClass}">${sanitizeHTML(origem)}</span>
            </td>
            <td class="p-5 align-middle">
                <select onchange="atualizarStatusLead('${lead.id}', this.value)" class="border rounded-md text-xs font-label uppercase tracking-widest px-3 py-1.5 focus:border-black outline-none cursor-pointer ${statusClass}">
                    ${selectOptions}
                </select>
            </td>
            <td class="p-5 align-middle text-center w-48">
                <div class="flex items-center justify-center gap-2">
                    <a href="${zapLink}" target="_blank" class="inline-flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#128C7E] text-white px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition">
                        <span class="material-symbols-outlined text-[16px]">chat</span> Abrir
                    </a>
                    <button onclick="compartilharLead('${lead.nome}', '${lead.telefone}', '${(lead.mensagem || '').replace(/'/g, "\\'")}', '${lead.origem || 'Desconhecida'}', '${formatarData(lead.created_at)}')" class="inline-flex items-center justify-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition">
                        <span class="material-symbols-outlined text-[16px]">share</span> Enviar
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// ==== Função de Pesquisa ====
window.filtrarLeads = function() {
    const termo = document.getElementById('campo-busca').value.toLowerCase();
    
    const filtrados = todosLeads.filter(l => {
        return l.nome.toLowerCase().includes(termo) || 
               l.telefone.includes(termo) ||
               (l.mensagem && l.mensagem.toLowerCase().includes(termo)) ||
               (l.origem && l.origem.toLowerCase().includes(termo));
    });
    
    desenharTabela(filtrados);
}

// ==== Função para trocar Status ====
window.atualizarStatusLead = async function(id, novoStatus) {
    try {
        const { error } = await sb
            .from('leads')
            .update({ status: novoStatus })
            .eq('id', id);

        if (error) throw error;
        
        carregarLeads(); // recarregar pra atualizar a bolinha e as cores
        
    } catch (error) {
        alert("Erro ao alterar o status do lead.");
        if (typeof console !== 'undefined') console.warn('Falha na operação.');
    }
}

// ==== Função para Compartilhar Lead via WhatsApp ====
window.compartilharLead = function(nome, telefone, imovel, origem, data) {
    const mensagem = `👤 Nome: ${nome}\n📱 WhatsApp: ${telefone}\n🏠 Imóvel de Interesse: ${imovel || 'Não informado'}\n📋 Origem: ${origem}\n📅 Data: ${data}`;
    const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
}
