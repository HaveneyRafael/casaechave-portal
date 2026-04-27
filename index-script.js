// index-script.js — Lógica da página principal (homepage)
// 1. Filtro de busca → redireciona para imoveis.html com query params
// 2. Seção "Imóveis que podem te interessar" → carrega do banco, ordenado por maior valor
// 3. Seção "Explore os bairros" → dinâmico, só mostra bairros com imóveis cadastrados

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. FILTRO DE BUSCA (Search Bar)
    // ==========================================
    const btnBuscar = document.getElementById('btn-buscar');
    const filtroTipo = document.getElementById('filtro-tipo');
    const filtroPreco = document.getElementById('filtro-preco');
    const filtroLocalizacao = document.getElementById('filtro-localizacao');

    if (btnBuscar) {
        btnBuscar.addEventListener('click', () => {
            executarBusca();
        });
    }

    function executarBusca() {
        const params = new URLSearchParams();
        
        // Buscas globais da home devem procurar em toda a base (Venda e Locação)
        params.set('ambos', 'true');

        const tipo = filtroTipo.value;
        if (tipo) params.set('tipo', tipo);

        const preco = filtroPreco.value;
        if (preco) {
            const [min, max] = preco.split('-');
            if (min) params.set('preco_min', min);
            if (max) params.set('preco_max', max);
        }

        const localizacao = filtroLocalizacao.value;
        if (localizacao) params.set('bairro', localizacao);

        window.location.href = `imoveis.html?${params.toString()}`;
    }

    // ==========================================
    // 2. IMÓVEIS QUE PODEM TE INTERESSAR
    //    Ordenados do maior para o menor valor
    // ==========================================
    carregarImoveisDestaque();
    carregarImoveisLocacao();

    async function carregarImoveisDestaque() {
        const container = document.getElementById('imoveis-destaque');
        if (!container) return;

        try {
            const { data: imoveis, error } = await sb
                .from('imoveis')
                .select('*')
                .neq('status', 'Pausado')
                .gt('valor_venda', 0)
                .order('valor_venda', { ascending: false }) // maior valor primeiro
                .limit(6); // mostra até 6 imóveis

            if (error) {
                if (typeof console !== 'undefined') console.warn('Falha ao buscar destaques.');
                container.innerHTML = '<p class="text-red-500 col-span-3">Erro ao carregar os imóveis.</p>';
                return;
            }

            if (!imoveis || imoveis.length === 0) {
                container.innerHTML = '<p class="text-zinc-400 font-light col-span-3 text-center">Nenhum imóvel disponível no momento.</p>';
                return;
            }

            container.innerHTML = '';

            const formatter = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0
            });

            imoveis.forEach(imovel => {
                const fotoUrl = (imovel.imagens && imovel.imagens.length > 0)
                    ? imovel.imagens[0]
                    : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80&blur=50';

                const precoFormatado = formatter.format(imovel.valor_venda);

                const card = document.createElement('a');
                card.href = `imovel-detalhe.html?id=${imovel.id}`;
                card.className = 'group cursor-pointer block';
                card.innerHTML = `
                    <div class="relative overflow-hidden rounded-lg aspect-[4/5] mb-8 bg-zinc-100">
                        <img src="${sanitizeHTML(fotoUrl)}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="${sanitizeHTML(imovel.titulo)}">
                        <button class="absolute top-6 right-6 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-tertiary transition-all" onclick="event.preventDefault(); event.stopPropagation();">
                            <span class="material-symbols-outlined">favorite</span>
                        </button>
                        <div class="absolute top-6 left-6 bg-white/90 px-3 py-1 rounded-sm text-[10px] font-bold tracking-widest uppercase">${sanitizeHTML(imovel.status)}</div>
                    </div>
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-xl font-headline font-bold truncate pr-4">${sanitizeHTML(imovel.titulo)}</h3>
                        <span class="text-xl font-headline font-bold shrink-0">${precoFormatado}</span>
                    </div>
                    <p class="text-zinc-400 font-body font-light text-sm">${sanitizeHTML(imovel.bairro)} • ${imovel.suites} Suíte${imovel.suites !== 1 ? 's' : ''} • ${imovel.area_m2}m²</p>
                `;

                container.appendChild(card);
            });

        } catch (err) {
            if (typeof console !== 'undefined') console.warn('Falha nos destaques.');
            container.innerHTML = '<p class="text-red-500 col-span-3">Falha de conexão com o banco de dados.</p>';
        }
    }

    async function carregarImoveisLocacao() {
        const container = document.getElementById('imoveis-locacao');
        if (!container) return;

        try {
            const { data: imoveis, error } = await sb
                .from('imoveis')
                .select('*')
                .neq('status', 'Pausado')
                .gt('valor_aluguel', 0) // Tem que ter valor de aluguel preenchido e > 0
                .order('created_at', { ascending: false }) // ordenado pelos mais recentes
                .limit(6);

            if (error) {
                if (typeof console !== 'undefined') console.warn('Falha ao buscar locação.');
                container.innerHTML = '<p class="text-red-500 col-span-3">Erro ao carregar os imóveis para locação.</p>';
                return;
            }

            if (!imoveis || imoveis.length === 0) {
                container.innerHTML = '<p class="text-zinc-400 font-light col-span-3 text-center">Nenhum imóvel disponível para locação no momento.</p>';
                return;
            }

            container.innerHTML = '';

            const formatter = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0
            });

            imoveis.forEach(imovel => {
                const fotoUrl = (imovel.imagens && imovel.imagens.length > 0)
                    ? imovel.imagens[0]
                    : 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80&blur=50';

                const precoFormatado = formatter.format(imovel.valor_aluguel) + '/mês';

                const card = document.createElement('a');card.href = `imovel-detalhe.html?id=${imovel.id}`;card.className = 'group cursor-pointer block';
                card.innerHTML = `
                    <div class="relative overflow-hidden rounded-lg aspect-[4/5] mb-8 bg-zinc-100">
                        <img src="${sanitizeHTML(fotoUrl)}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="${sanitizeHTML(imovel.titulo)}">
                        <button class="absolute top-6 right-6 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-tertiary transition-all" onclick="event.preventDefault(); event.stopPropagation();">
                            <span class="material-symbols-outlined">favorite</span>
                        </button>
                        <div class="absolute top-6 left-6 bg-white/90 px-3 py-1 rounded-sm text-[10px] font-bold tracking-widest uppercase text-tertiary">Locação</div>
                    </div>
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="text-xl font-headline font-bold truncate pr-4">${sanitizeHTML(imovel.titulo)}</h3>
                        <span class="text-xl font-headline font-bold shrink-0 text-tertiary">${precoFormatado}</span>
                    </div>
                    <p class="text-zinc-400 font-body font-light text-sm">${sanitizeHTML(imovel.bairro)} • ${imovel.suites} Suíte${imovel.suites !== 1 ? 's' : ''} • ${imovel.area_m2}m²</p>
                `;

                container.appendChild(card);
            });

        } catch (err) {
            if (typeof console !== 'undefined') console.warn('Falha na locação.');
            container.innerHTML = '<p class="text-red-500 col-span-3">Falha de conexão com o banco de dados.</p>';
        }
    }

    // ==========================================
    // 3. EXPLORE OS BAIRROS DE ARACAJU
    //    Dinâmico: só mostra bairros com ≥ 1 imóvel
    //    Clique → redireciona para imoveis.html?bairro=<nome>
    // ==========================================
    carregarBairros();

    async function carregarBairros() {
        const container = document.getElementById('bairros-grid');
        if (!container) return;

        // Imagens curadas para bairros conhecidos de Aracaju
        // Se o bairro não estiver aqui, usa uma imagem genérica
        const imagensBairros = {
            'Atalaia':      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
            'Jardins':      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
            'Aruana':       'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
            '13 de Julho':  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
            'Luzia':        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
            'Grageru':      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
            'Farolândia':   'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
            'Coroa do Meio': 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
            'Suíssa':       'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
            'Salgado Filho': 'https://images.unsplash.com/photo-1600566753376-12c8ab7c5a38?auto=format&fit=crop&w=800&q=80',
        };

        const imagemGenerica = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

        try {
            // Busca todos os imóveis não-pausados
            const { data: imoveis, error } = await sb
                .from('imoveis')
                .select('bairro, valor_venda, valor_aluguel')
                .neq('status', 'Pausado');

            if (error) {
                if (typeof console !== 'undefined') console.warn('Falha ao buscar bairros.');
                container.innerHTML = '<p class="text-red-500 col-span-4">Erro ao carregar os bairros.</p>';
                return;
            }

            if (!imoveis || imoveis.length === 0) {
                container.innerHTML = '<p class="text-zinc-400 font-light col-span-4 text-center">Nenhum bairro com imóveis disponíveis.</p>';
                return;
            }

            // Agrupa e conta por bairro e analisa os tipos de propriedades
            const bairroStats = {};
            imoveis.forEach(i => {
                const b = i.bairro;
                if (!bairroStats[b]) {
                    bairroStats[b] = { count: 0, hasVenda: false, hasAluguel: false };
                }
                bairroStats[b].count++;
                if (i.valor_venda > 0) bairroStats[b].hasVenda = true;
                if (i.valor_aluguel > 0) bairroStats[b].hasAluguel = true;
            });

            // Ordena por quantidade de imóveis (decrescente)
            const bairrosOrdenados = Object.entries(bairroStats)
                .sort((a, b) => b[1].count - a[1].count);

            // Popula o dropdown da barra de busca principal com os bairros reais
            if (filtroLocalizacao && filtroLocalizacao.tagName === 'SELECT') {
                filtroLocalizacao.innerHTML = '<option value="">Todos os bairros</option>';
                // Ordena alfabeticamente para o dropdown
                const bairrosDropdown = Object.keys(bairroStats).sort((a, b) => a.localeCompare(b));
                bairrosDropdown.forEach(bairroNome => {
                    const op = document.createElement('option');
                    op.value = bairroNome;
                    op.innerText = bairroNome;
                    filtroLocalizacao.appendChild(op);
                });
            }

            container.innerHTML = '';

            // Ajusta grid conforme quantidade de bairros
            if (bairrosOrdenados.length <= 2) {
                container.className = 'grid grid-cols-1 md:grid-cols-2 gap-6';
            } else if (bairrosOrdenados.length === 3) {
                container.className = 'grid grid-cols-1 md:grid-cols-3 gap-6';
            } else {
                container.className = 'grid grid-cols-1 md:grid-cols-4 gap-6';
            }

            bairrosOrdenados.forEach(([bairro, stats]) => {
                const count = stats.count;
                const imagem = imagensBairros[bairro] || imagemGenerica;

                // Manda sempre para o modo misto que mostra vendas e aluguéis juntos
                const linkUrl = `imoveis.html?ambos=true&bairro=${encodeURIComponent(bairro)}`;

                const card = document.createElement('a');
                card.href = linkUrl;
                card.className = 'group relative aspect-square overflow-hidden rounded-lg block';
                card.innerHTML = `
                    <img src="${sanitizeHTML(imagem)}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Bairro ${sanitizeHTML(bairro)}">
                    <div class="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex flex-col justify-end p-8">
                        <h3 class="text-white text-2xl font-headline font-bold">${sanitizeHTML(bairro)}</h3>
                        <p class="text-white/80 font-body font-light text-xs mt-2 uppercase tracking-widest">${count} Imóve${count !== 1 ? 'is' : 'l'}</p>
                    </div>
                `;

                container.appendChild(card);
            });

        } catch (err) {
            if (typeof console !== 'undefined') console.warn('Falha nos bairros.');
            container.innerHTML = '<p class="text-red-500 col-span-4">Falha de conexão com o banco de dados.</p>';
        }
    }
});
