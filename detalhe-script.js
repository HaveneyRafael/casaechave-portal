// Script para a listagem da página de detalhes do imóvel
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Pega o ID na URL
    const urlParams = new URLSearchParams(window.location.search);
    const imovelId = urlParams.get('id');

    if (!imovelId) {
        document.getElementById('detalhe-titulo').innerText = "Imóvel não encontrado";
        return;
    }

    try {
        // 2. Busca o imóvel com esse ID no banco
        const { data: imovel, error } = await sb
            .from('imoveis')
            .select('*')
            .eq('id', imovelId)
            .single();

        if (error || !imovel) {
            if (typeof console !== 'undefined') console.warn('Falha ao carregar detalhe.');
            document.getElementById('detalhe-titulo').innerText = "Imóvel não encontrado ou removido";
            return;
        }

        const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

        // 3. Preenche as informações na tela + SEO automático
        SEO.aplicarSEONaPagina(imovel); // Title, Meta, OG, JSON-LD
        document.getElementById('bc-titulo').innerText = imovel.titulo;
        document.getElementById('detalhe-titulo').innerText = SEO.gerarH1(imovel);
        document.getElementById('detalhe-bairro').innerText = `Bairro ${imovel.bairro}`;

        // Exibir preço correto: aluguel ou venda
        const precoLabelEl = document.querySelector('#detalhe-preco').previousElementSibling;
        if (imovel.valor_aluguel && !imovel.valor_venda) {
            // Imóvel somente para locação
            document.getElementById('detalhe-preco').innerText = formatter.format(imovel.valor_aluguel) + '/mês';
            if (precoLabelEl) precoLabelEl.textContent = 'Aluguel Mensal';
        } else if (imovel.valor_aluguel && imovel.valor_venda) {
            // Imóvel com ambos — mostra venda e aluguel abaixo
            document.getElementById('detalhe-preco').innerHTML = `${formatter.format(imovel.valor_venda)}<br><span class="text-lg text-tertiary font-semibold">${formatter.format(imovel.valor_aluguel)}/mês</span>`;
            if (precoLabelEl) precoLabelEl.textContent = 'Venda / Aluguel';
        } else if (imovel.valor_venda) {
            document.getElementById('detalhe-preco').innerText = formatter.format(imovel.valor_venda);
        } else {
            document.getElementById('detalhe-preco').innerText = 'Consulte';
        }
        document.getElementById('detalhe-area').innerText = `${imovel.area_m2} m²`;
        document.getElementById('detalhe-quartos').innerText = imovel.quartos ? `${imovel.quartos} Quarto(s)` : '—';
        document.getElementById('detalhe-suites').innerText = `${imovel.suites} Suíte(s)`;
        document.getElementById('detalhe-banheiros').innerText = imovel.banheiros ? `${imovel.banheiros} Banheiro(s)` : '—';
        document.getElementById('detalhe-vagas').innerText = `${imovel.vagas} Vaga(s)`;
        
        if(imovel.valor_condominio) {
            document.getElementById('detalhe-condominio').innerText = formatter.format(imovel.valor_condominio);
        }

        if(imovel.valor_iptu) {
            document.getElementById('detalhe-iptu').innerText = formatter.format(imovel.valor_iptu);
        } else {
            document.getElementById('detalhe-iptu').innerText = '—';
        }

        // Descrição suportando quebra de linha (sanitizada contra XSS)
        document.getElementById('detalhe-descricao').innerHTML = `<p>${sanitizeHTML(imovel.descricao || '').replace(/\n/g, '<br>')}</p>`;

        // SEO Description (usa do banco se tiver, senão gera ao vivo)
        const seoTexto = imovel.seo_descricao || SEO.gerarDescricaoSEO(imovel);
        if (seoTexto) {
            document.getElementById('seo-secao').classList.remove('hidden');
            document.getElementById('seo-descricao-texto').innerHTML = `<p>${sanitizeHTML(seoTexto).replace(/\n/g, '<br>')}</p>`;
        }

        // Renderizar Dados do Corretor Atrelado
        const corretorNome = imovel.corretor || 'Consultor Imobiliário';
        const corretorFoto = imovel.corretor_foto || 'https://ui-avatars.com/api/?name='+corretorNome+'&background=333&color=fff';
        document.getElementById('corretor-nome').innerText = corretorNome;
        document.getElementById('corretor-foto').src = corretorFoto;
        
        // Corretor info (foto e nome apenas)
        if (imovel.corretor_whatsapp) {
            // Guardamos o número caso precise no futuro, mas não exibimos botão de WhatsApp
        }

        // Infraestrutura (Opcional)
        if (imovel.infraestrutura && imovel.infraestrutura.length > 0) {
            document.getElementById('infra-secao').classList.remove('hidden');
            const infraContainer = document.getElementById('detalhe-infra');
            
            imovel.infraestrutura.forEach(item => {
                const div = document.createElement('div');
                div.className = 'flex items-center gap-3';
                div.innerHTML = `<span class="material-symbols-outlined text-zinc-300">check</span> ${sanitizeHTML(item)}`;
                infraContainer.appendChild(div);
            });
        }

        // 4. Montar a Grade de Fotos
        const gallery = document.getElementById('gallery-container');
        gallery.innerHTML = ''; // limpa placeholders

        if (imovel.imagens && imovel.imagens.length > 0) {
            
            // Variável global temporária para o carrossel ter acesso direto às fotos desse imóvel
            window.fotosCarrossel = imovel.imagens;
            
            // Função para gerar a tag da imagem com evento de clique
            const imgTag = (idx, extClass = "") => `<img src="${sanitizeHTML(imovel.imagens[idx])}" onclick="abrirLightbox(${idx})" class="w-full h-full object-cover cursor-pointer ${extClass}">`;

            // Se tiver 1 imagem, ela ocupa tudo. Se tiver +, cria layout de grid.
            if (imovel.imagens.length === 1) {
                gallery.innerHTML = `
                    <div class="col-span-4 row-span-2">
                        ${imgTag(0)}
                    </div>`;
            } else if (imovel.imagens.length === 2) {
                gallery.innerHTML = `
                    <div class="col-span-2 row-span-2">${imgTag(0)}</div>
                    <div class="col-span-2 row-span-2">${imgTag(1)}</div>`;
            } else {
                // Layout bonito pra mais de 3
                gallery.innerHTML = `
                    <div class="col-span-3 row-span-2">
                        ${imgTag(0)}
                    </div>
                    <div class="col-span-1 row-span-1">
                        ${imgTag(1)}
                    </div>
                    <div class="col-span-1 row-span-1 relative">
                        ${imgTag(2)}
                        ${imovel.imagens.length > 3 ? `
                        <div onclick="abrirLightbox(3)" class="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer hover:bg-black/20 transition-colors">
                            <span class="text-white font-label font-bold tracking-widest uppercase text-sm">+${imovel.imagens.length - 3} Fotos</span>
                        </div>` : ''}
                    </div>
                `;
            }
        } else {
            // Sem foto
            gallery.innerHTML = `
                <div class="col-span-4 row-span-2 bg-zinc-200 flex items-center justify-center text-zinc-400">
                    Nenhuma foto disponível
                </div>`;
        }

    } catch (err) {
        if (typeof console !== 'undefined') console.warn('Erro ao carregar detalhes do imóvel.');
    }

    // 5. Configurar Formulário de Leads (simplificado: Nome, WhatsApp, Imóvel de Interesse)
    const formLead = document.getElementById('form-lead');
    const btnLead = document.getElementById('btn-enviar-lead');
    const leadMsgSucesso = document.getElementById('lead-msg-sucesso');
    const leadMsgErro = document.getElementById('lead-msg-erro');

    // Máscara de telefone brasileiro no campo WhatsApp
    const leadWpp = document.getElementById('lead-wpp');
    leadWpp.addEventListener('input', function(e) {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 11) v = v.substring(0, 11);
        if (v.length > 6) {
            v = `(${v.substring(0,2)}) ${v.substring(2,7)}-${v.substring(7)}`;
        } else if (v.length > 2) {
            v = `(${v.substring(0,2)}) ${v.substring(2)}`;
        } else if (v.length > 0) {
            v = `(${v}`;
        }
        e.target.value = v;
    });

    // Pré-preenche o campo "Imóvel de Interesse" com o título do imóvel da página
    const leadImovelField = document.getElementById('lead-imovel');
    const tituloImovel = document.getElementById('detalhe-titulo').innerText;
    if (tituloImovel && tituloImovel !== 'Carregando...') {
        leadImovelField.value = tituloImovel;
    }

    formLead.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Esconde mensagens anteriores
        leadMsgSucesso.classList.add('hidden');
        leadMsgErro.classList.add('hidden');

        btnLead.innerText = "Enviando...";
        btnLead.disabled = true;

        const nome = document.getElementById('lead-nome').value.trim();
        const telefone = document.getElementById('lead-wpp').value.trim();
        const imovelInteresse = document.getElementById('lead-imovel').value.trim();

        try {
            const { error } = await sb
                .from('leads')
                .insert([{ 
                    nome, 
                    telefone, 
                    mensagem: imovelInteresse,
                    imovel_id: imovelId,
                    origem: 'Interessado'
                }]);

            if (error) throw error;

            leadMsgSucesso.classList.remove('hidden');
            formLead.reset();
            // Re-preenche o campo com o título, já que resetou
            if (tituloImovel && tituloImovel !== 'Carregando...') {
                leadImovelField.value = tituloImovel;
            }

        } catch (error) {
            if (typeof console !== 'undefined') console.warn('Falha ao enviar lead.');
            leadMsgErro.classList.remove('hidden');
        } finally {
            btnLead.innerText = "Agendar Visita";
            btnLead.disabled = false;
        }
    });

    // 6. Botões de Compartilhamento
    const btnShareWpp = document.getElementById('btn-share-whatsapp');
    const btnCopyLink = document.getElementById('btn-copy-link');
    const tooltipCopiado = document.getElementById('tooltip-copiado');

    btnShareWpp.addEventListener('click', () => {
        const titulo = document.getElementById('detalhe-titulo').innerText;
        const precoEl = document.getElementById('detalhe-preco');
        const preco = precoEl ? precoEl.innerText : '';
        const url = window.location.href;

        // Detectar se é venda ou locação
        const precoLabel = document.querySelector('.text-sm.font-label.uppercase.text-zinc-400');
        const isLocacao = precoLabel && precoLabel.textContent.toLowerCase().includes('aluguel');
        const tipoNegocio = isLocacao ? 'Aluguel' : 'Venda';

        const mensagem = `🏠 ${titulo}\n💰 ${preco} (${tipoNegocio})\n\nVeja mais detalhes: ${url}`;
        const urlWpp = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
        window.open(urlWpp, '_blank', 'noopener,noreferrer');
    });

    btnCopyLink.addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            tooltipCopiado.style.opacity = '1';
            setTimeout(() => {
                tooltipCopiado.style.opacity = '0';
            }, 2000);
        }).catch(() => {
            // Fallback para navegadores antigos
            const input = document.createElement('input');
            input.value = window.location.href;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            tooltipCopiado.style.opacity = '1';
            setTimeout(() => { tooltipCopiado.style.opacity = '0'; }, 2000);
        });
    });

});

// ==== LÓGICA DO LIGHTBOX (CARROSSEL TELA CHEIA) ====
document.body.insertAdjacentHTML('beforeend', `
    <div id="lightbox" class="fixed inset-0 z-[100] bg-black/95 hidden flex-col items-center justify-center backdrop-blur-md">
        <button onclick="fecharLightbox()" class="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full transition"><span class="material-symbols-outlined text-4xl">close</span></button>
        <div class="flex items-center w-full justify-between px-8">
            <button onclick="mudarFoto(-1)" class="text-white p-2 sm:p-4 hover:bg-white/10 rounded-full transition"><span class="material-symbols-outlined text-4xl">chevron_left</span></button>
            <img id="lightbox-img" src="" class="max-w-[75vw] max-h-[85vh] object-contain rounded drop-shadow-2xl transition-opacity duration-300">
            <button onclick="mudarFoto(1)" class="text-white p-2 sm:p-4 hover:bg-white/10 rounded-full transition"><span class="material-symbols-outlined text-4xl">chevron_right</span></button>
        </div>
        <p id="lightbox-counter" class="text-white/50 text-sm mt-6 font-label tracking-widest uppercase">1 / 1</p>
    </div>
`);

let fotoIndexAtual = 0;

window.abrirLightbox = function(index) {
    if (!window.fotosCarrossel || window.fotosCarrossel.length === 0) return;
    fotoIndexAtual = index;
    atualizarLightbox();
    document.getElementById('lightbox').classList.remove('hidden');
    document.getElementById('lightbox').classList.add('flex');
    document.body.style.overflow = 'hidden'; // trava o scroll da página
}

window.fecharLightbox = function() {
    document.getElementById('lightbox').classList.add('hidden');
    document.getElementById('lightbox').classList.remove('flex');
    document.body.style.overflow = 'auto'; // destrava
}

window.mudarFoto = function(direcao) {
    fotoIndexAtual += direcao;
    const max = window.fotosCarrossel.length - 1;
    if (fotoIndexAtual < 0) fotoIndexAtual = max;
    if (fotoIndexAtual > max) fotoIndexAtual = 0;
    
    atualizarLightbox();
}

function atualizarLightbox() {
    const imgEl = document.getElementById('lightbox-img');
    const counterEl = document.getElementById('lightbox-counter');
    
    // Efeito de fade
    imgEl.style.opacity = 0;
    setTimeout(() => {
        imgEl.src = window.fotosCarrossel[fotoIndexAtual];
        counterEl.innerText = `${fotoIndexAtual + 1} / ${window.fotosCarrossel.length}`;
        imgEl.style.opacity = 1;
    }, 150);
}
