// Lógica para carregar os imóveis na listagem (com suporte a filtros via URL e na página)
document.addEventListener('DOMContentLoaded', async () => {
    const gridContainer = document.getElementById('imoveis-grid');

    // Elementos de filtro da página
    const filtroBairroEl = document.getElementById('filtro-bairro-page');
    const filtroTipoEl = document.getElementById('filtro-tipo-page');
    const filtroPrecoEl = document.getElementById('filtro-preco-page');
    const botoesQuartos = document.querySelectorAll('.btn-quarto');

    // Lê os parâmetros da URL para inicialização
    const params = new URLSearchParams(window.location.search);
    const urlTipo = params.get('tipo');
    const urlBairro = params.get('bairro');
    const urlLocacao = params.get('locacao') === 'true';

    // Define Estado Inicial via URL
    if (urlTipo) filtroTipoEl.value = urlTipo;
    if (urlBairro) filtroBairroEl.value = urlBairro;
    
    // O valor de locação mantemos globalmente na página
    let isLocacao = urlLocacao;
    let suitesFilter = null; // null significa "todos"

    if (isLocacao) {
        document.title = 'CasaeChave | Imóveis para Locação';
        const h1 = document.querySelector('main h1');
        if (h1) h1.textContent = 'Imóveis para Locação';
    }

    // Função Principal de Busca
    async function carregarImoveis() {
        gridContainer.innerHTML = '<p class="text-zinc-400 font-light col-span-3">Carregando catálogo de imóveis...</p>';

        try {
            let query = sb
                .from('imoveis')
                .select('*')
                .neq('status', 'Pausado');

            if (isLocacao) {
                query = query.not('valor_aluguel', 'is', null);
            }

            // Valores Atuais dos Filtros
            const bairro = filtroBairroEl.value;
            const tipo = filtroTipoEl.value;
            const precoMax = filtroPrecoEl.value;

            // Aplica filtro de Bairro
            if (bairro && bairro !== "Todos os bairros" && bairro !== "") {
                query = query.ilike('bairro', `%${bairro}%`);
            }

            // Aplica filtro de Tipologia
            if (tipo && tipo !== "") {
                query = query.eq('tipo', tipo);
            }

            // Aplica filtro de Preço Máximo
            if (precoMax && precoMax !== "") {
                const colPreco = isLocacao ? 'valor_aluguel' : 'valor_venda';
                query = query.lte(colPreco, parseFloat(precoMax));
            }

            // Aplica filtro de Suítes/Quartos
            if (suitesFilter) {
                if (suitesFilter === '4') {
                    query = query.gte('suites', 4);
                } else if (suitesFilter === '3') {
                    query = query.gte('suites', 3);
                } else {
                    query = query.eq('suites', parseInt(suitesFilter));
                }
            }

            // Ordena
            query = query.order('created_at', { ascending: false });

            const { data: imoveis, error } = await query;

            if (error) {
                if (typeof console !== 'undefined') console.warn('Falha ao buscar imóveis.');
                gridContainer.innerHTML = '<p class="text-red-500 col-span-3">Erro ao carregar o catálogo.</p>';
                return;
            }

            if (!imoveis || imoveis.length === 0) {
                gridContainer.innerHTML = `
                    <div class="col-span-3 text-center py-20">
                        <span class="material-symbols-outlined text-zinc-300 text-6xl mb-4 block">search_off</span>
                        <p class="text-zinc-500 font-light text-lg mb-2">Nenhum imóvel encontrado com os critérios selecionados.</p>
                        <button onclick="limparFiltros()" class="text-xs font-label uppercase tracking-widest border-b border-primary pb-1 hover:text-red-600 hover:border-red-600 transition-all">Limpar filtros</button>
                    </div>`;
                AtualizarSubtitulo(0, true);
                return;
            }

            gridContainer.innerHTML = '';
            const formatter = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0
            });

            imoveis.forEach(imovel => {
                const fotoUrl = (imovel.imagens && imovel.imagens.length > 0) 
                    ? imovel.imagens[0] 
                    : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80&blur=50'; 

                let precoFormatado;
                let badgeLabel;
                if (isLocacao) {
                    precoFormatado = formatter.format(imovel.valor_aluguel) + '/mês';
                    badgeLabel = 'Locação';
                } else {
                    precoFormatado = imovel.valor_venda ? formatter.format(imovel.valor_venda) : 'Consulte';
                    badgeLabel = imovel.status;
                }

                const a = document.createElement('a');
                a.href = `imovel-detalhe.html?id=${imovel.id}`;
                a.className = 'group cursor-pointer block';
                
                a.innerHTML = `
                    <div class="relative overflow-hidden rounded-lg aspect-[4/5] mb-6 bg-zinc-100">
                        <img src="${sanitizeHTML(fotoUrl)}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Foto do Imóvel">
                        <div class="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-sm text-[10px] font-bold tracking-widest uppercase ${isLocacao ? 'text-tertiary' : ''}">${sanitizeHTML(badgeLabel)}</div>
                    </div>
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-xl font-headline font-bold truncate pr-4">${sanitizeHTML(imovel.titulo)}</h3>
                        <span class="text-xl font-headline font-bold shrink-0 ${isLocacao ? 'text-tertiary' : ''}">${precoFormatado}</span>
                    </div>
                    <p class="text-zinc-500 font-body font-light text-sm truncate">
                        ${sanitizeHTML(imovel.bairro)} • ${imovel.suites} Suíte${imovel.suites !== 1 ? 's' : ''} • ${imovel.area_m2}m²
                    </p>
                `;

                gridContainer.appendChild(a);
            });

            const temFiltroInterno = bairro || tipo || precoMax || suitesFilter;
            AtualizarSubtitulo(imoveis.length, temFiltroInterno);

        } catch (err) {
            if (typeof console !== 'undefined') console.warn('Falha ao carregar catálogo.');
            gridContainer.innerHTML = '<p class="text-red-500 col-span-3">Falha de conexão com o banco de dados.</p>';
        }
    }

    function AtualizarSubtitulo(quantidade, temFiltro) {
        const subtitulo = document.querySelector('main p.text-zinc-500.font-light');
        if (!subtitulo) return;

        if (isLocacao) {
            subtitulo.textContent = `${quantidade} imóve${quantidade !== 1 ? 'is' : 'l'} disponíve${quantidade !== 1 ? 'is' : 'l'} para locação.`;
        } else if (temFiltro) {
            subtitulo.textContent = `${quantidade} propriedade${quantidade !== 1 ? 's' : ''} encontrada${quantidade !== 1 ? 's' : ''} com os filtros aplicados.`;
        } else {
            subtitulo.textContent = `${quantidade} propriedades filtradas de acordo com as exigências do nosso padrão arquitetônico em Aracaju.`;
        }
    }

    window.limparFiltros = () => {
        filtroBairroEl.value = "";
        filtroTipoEl.value = "";
        filtroPrecoEl.value = "";
        suitesFilter = null;
        atualizarBotoesQuartos();
        carregarImoveis();
    }

    function atualizarBotoesQuartos() {
        botoesQuartos.forEach(btn => {
            if (btn.dataset.val === suitesFilter) {
                btn.classList.remove('bg-zinc-100', 'text-black');
                btn.classList.add('bg-primary', 'text-white');
            } else {
                btn.classList.remove('bg-primary', 'text-white');
                btn.classList.add('bg-zinc-100', 'text-black');
            }
        });
    }

    // Event Listeners dos Filtros
    filtroBairroEl.addEventListener('change', carregarImoveis);
    filtroTipoEl.addEventListener('change', carregarImoveis);
    
    // Timeout para digitação de preço
    let precoTimeout;
    filtroPrecoEl.addEventListener('input', () => {
        clearTimeout(precoTimeout);
        precoTimeout = setTimeout(carregarImoveis, 500);
    });

    botoesQuartos.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const val = e.target.dataset.val;
            if (val === suitesFilter) {
                // Desmarca se clicar novamente
                suitesFilter = null;
            } else {
                suitesFilter = val;
            }
            atualizarBotoesQuartos();
            carregarImoveis();
        });
    });

    // Início
    atualizarBotoesQuartos(); // Garante o CSS inicial
    carregarImoveis();

});
