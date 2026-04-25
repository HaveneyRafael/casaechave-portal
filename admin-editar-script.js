const formEditar = document.getElementById('form-editar');
const btnPublicar = document.getElementById('btn-publicar');

// Pegar ID da URL
const params = new URLSearchParams(window.location.search);
const imovelId = params.get('id');

let imagensAntigas = []; // Imagens que já existiam
let imagensSelecionadas = []; // Novas imagens para subir

document.addEventListener('DOMContentLoaded', carregarDadosImovel);

async function carregarDadosImovel() {
    if (!imovelId) {
        alert("ID de imóvel não encontrado!");
        window.location.href = 'admin-portfolio.html';
        return;
    }

    try {
        const { data, error } = await sb
            .from('imoveis')
            .select('*')
            .eq('id', imovelId)
            .single();

        if (error) throw error;

        // Preencher form
        document.getElementById('titulo').value = data.titulo || '';
        document.getElementById('bairro').value = data.bairro || '';
        document.getElementById('tipo').value = data.tipo || 'Apartamento';
        document.getElementById('valor_venda').value = data.valor_venda || '';
        document.getElementById('valor_aluguel').value = data.valor_aluguel || '';
        document.getElementById('status').value = data.status || 'Lançamento';
        document.getElementById('area_m2').value = data.area_m2 || '';
        document.getElementById('quartos').value = data.quartos || '';
        document.getElementById('suites').value = data.suites || '';
        document.getElementById('banheiros').value = data.banheiros || '';
        document.getElementById('vagas').value = data.vagas || '';
        document.getElementById('valor_condominio').value = data.valor_condominio || '';
        document.getElementById('valor_iptu').value = data.valor_iptu || '';
        document.getElementById('descricao').value = data.descricao || '';
        
        if (data.infraestrutura) {
            document.getElementById('infraestrutura').value = data.infraestrutura.join(', ');
        }

        // Renderizar fotos antigas
        imagensAntigas = data.imagens || [];
        renderizarFotosAntigas();

    } catch (error) {
        if (typeof console !== 'undefined') console.warn('Erro ao carregar dados do imóvel.');
        alert("Erro ao carregar dados do imóvel.");
    }
}

// =============================================
// DRAG-AND-DROP: Reordenação de fotos antigas
// =============================================
let dragSrcAntigaIndex = null;

function renderizarFotosAntigas() {
    const container = document.getElementById('fotos-antigas');
    container.innerHTML = '';

    if (imagensAntigas.length === 0) {
        container.innerHTML = '<span class="italic">Nenhuma foto salva anteriormente.</span>';
        return;
    }

    imagensAntigas.forEach((url, i) => {
        const imgDiv = document.createElement('div');
        imgDiv.className = 'relative w-28 h-28 m-1 rounded-lg overflow-hidden border-2 border-zinc-200 cursor-grab group transition-all duration-200';
        imgDiv.draggable = true;
        imgDiv.dataset.index = i;
        imgDiv.innerHTML = `
            <img src="${sanitizeHTML(url)}" class="w-full h-full object-cover pointer-events-none" />
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none"></div>
            <span class="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded pointer-events-none">${i + 1}</span>
            <button type="button" class="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold pb-0.5 transition-colors" onclick="removerFotoAntiga(${i})">✕</button>
            <span class="material-symbols-outlined absolute bottom-1.5 left-1/2 -translate-x-1/2 text-white/70 text-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">drag_indicator</span>
        `;

        // Eventos de drag para fotos antigas
        imgDiv.addEventListener('dragstart', (ev) => {
            dragSrcAntigaIndex = parseInt(ev.currentTarget.dataset.index);
            ev.currentTarget.style.opacity = '0.4';
            ev.currentTarget.classList.add('border-[#ff291b]');
            ev.dataTransfer.effectAllowed = 'move';
        });

        imgDiv.addEventListener('dragend', (ev) => {
            ev.currentTarget.style.opacity = '1';
            ev.currentTarget.classList.remove('border-[#ff291b]');
            container.querySelectorAll('[draggable]').forEach(el => {
                el.classList.remove('border-[#ff291b]', 'border-dashed', 'scale-105');
            });
        });

        imgDiv.addEventListener('dragover', (ev) => {
            ev.preventDefault();
            ev.dataTransfer.dropEffect = 'move';
            ev.currentTarget.classList.add('border-[#ff291b]', 'border-dashed', 'scale-105');
        });

        imgDiv.addEventListener('dragleave', (ev) => {
            ev.currentTarget.classList.remove('border-[#ff291b]', 'border-dashed', 'scale-105');
        });

        imgDiv.addEventListener('drop', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const dropIndex = parseInt(ev.currentTarget.dataset.index);
            if (dragSrcAntigaIndex !== null && dragSrcAntigaIndex !== dropIndex) {
                const [moved] = imagensAntigas.splice(dragSrcAntigaIndex, 1);
                imagensAntigas.splice(dropIndex, 0, moved);
                renderizarFotosAntigas();
            }
            dragSrcAntigaIndex = null;
        });

        container.appendChild(imgDiv);
    });
}

window.removerFotoAntiga = function(index) {
    if(confirm("Tem certeza que deseja apagar essa foto?")) {
        imagensAntigas.splice(index, 1);
        renderizarFotosAntigas();
    }
}

// ==========================
// Logica das Novas Imagens
// ==========================
const imagensUpload = document.getElementById('imagens_upload');
const previewContainer = document.getElementById('preview-imagens');

let dragSrcNovaIndex = null;

imagensUpload.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    
    // Validar cada arquivo antes de adicionar
    const arquivosValidos = [];
    const erros = [];
    files.forEach(file => {
        const validacao = window.validarArquivoUpload(file);
        if (validacao.valido) {
            arquivosValidos.push(file);
        } else {
            erros.push(`${file.name}: ${validacao.erro}`);
        }
    });
    
    if (erros.length > 0) {
        alert('Arquivos rejeitados:\n' + erros.join('\n'));
    }
    
    imagensSelecionadas = [...imagensSelecionadas, ...arquivosValidos];
    atualizarPreviewNovas();
});

function criarItemDraggableNova(file, index) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement('div');
            div.className = 'relative w-28 h-28 m-1 rounded-lg overflow-hidden border-2 border-blue-200 cursor-grab group transition-all duration-200';
            div.draggable = true;
            div.dataset.index = index;
            div.innerHTML = `
                <img src="${e.target.result}" class="w-full h-full object-cover pointer-events-none" />
                <div class="absolute inset-0 bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors pointer-events-none flex items-center justify-center">
                    <span class="text-white text-xs bg-black/50 px-2 rounded font-bold pointer-events-none">NOVA</span>
                </div>
                <span class="absolute top-1.5 left-1.5 bg-blue-600/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded pointer-events-none">${index + 1}</span>
                <button type="button" class="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold transition-colors" onclick="removerFotoNova(${index})">✕</button>
                <span class="material-symbols-outlined absolute bottom-1.5 left-1/2 -translate-x-1/2 text-white/70 text-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">drag_indicator</span>
            `;

            // Eventos de drag para fotos novas
            div.addEventListener('dragstart', (ev) => {
                dragSrcNovaIndex = parseInt(ev.currentTarget.dataset.index);
                ev.currentTarget.style.opacity = '0.4';
                ev.currentTarget.classList.add('border-[#ff291b]');
                ev.dataTransfer.effectAllowed = 'move';
            });

            div.addEventListener('dragend', (ev) => {
                ev.currentTarget.style.opacity = '1';
                ev.currentTarget.classList.remove('border-[#ff291b]');
                previewContainer.querySelectorAll('[draggable]').forEach(el => {
                    el.classList.remove('border-[#ff291b]', 'border-dashed', 'scale-105');
                });
            });

            div.addEventListener('dragover', (ev) => {
                ev.preventDefault();
                ev.dataTransfer.dropEffect = 'move';
                ev.currentTarget.classList.add('border-[#ff291b]', 'border-dashed', 'scale-105');
            });

            div.addEventListener('dragleave', (ev) => {
                ev.currentTarget.classList.remove('border-[#ff291b]', 'border-dashed', 'scale-105');
            });

            div.addEventListener('drop', (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const dropIndex = parseInt(ev.currentTarget.dataset.index);
                if (dragSrcNovaIndex !== null && dragSrcNovaIndex !== dropIndex) {
                    const [moved] = imagensSelecionadas.splice(dragSrcNovaIndex, 1);
                    imagensSelecionadas.splice(dropIndex, 0, moved);
                    atualizarPreviewNovas();
                }
                dragSrcNovaIndex = null;
            });

            resolve(div);
        };
        reader.readAsDataURL(file);
    });
}

async function atualizarPreviewNovas() {
    previewContainer.innerHTML = '';
    for (let i = 0; i < imagensSelecionadas.length; i++) {
        const item = await criarItemDraggableNova(imagensSelecionadas[i], i);
        previewContainer.appendChild(item);
    }
}

window.removerFotoNova = function(index) {
    imagensSelecionadas.splice(index, 1);
    atualizarPreviewNovas();
};

function formatParaNomeArquivo(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "_");
}

async function subirNovasFotos(titulo) {
    const urls = [];
    const baseName = formatParaNomeArquivo(titulo);

    for (let i = 0; i < imagensSelecionadas.length; i++) {
        const file = imagensSelecionadas[i];
        const fileExt = file.name.split('.').pop();
        const filePath = `${baseName}_NOVA_${Date.now()}_${i}.${fileExt}`;

        const { error } = await sb.storage.from('imoveis_imagens').upload(filePath, file);
        if (error) throw error;

        const { data: publicUrlData } = sb.storage.from('imoveis_imagens').getPublicUrl(filePath);
        urls.push(publicUrlData.publicUrl);
    }
    return urls;
}

// ==========================
// Logica de Atualização
// ==========================
formEditar.addEventListener('submit', async (e) => {
    e.preventDefault();

    const titulo = document.getElementById('titulo').value;
    const bairro = document.getElementById('bairro').value;
    const tipo = document.getElementById('tipo').value;
    const valor_venda = document.getElementById('valor_venda').value ? parseFloat(document.getElementById('valor_venda').value) : null;
    const valor_aluguel = document.getElementById('valor_aluguel').value ? parseFloat(document.getElementById('valor_aluguel').value) : null;
    const status = document.getElementById('status').value;
    const area_m2 = parseFloat(document.getElementById('area_m2').value);
    const quartos = document.getElementById('quartos').value ? parseInt(document.getElementById('quartos').value) : 0;
    const suites = parseInt(document.getElementById('suites').value);
    const banheiros = document.getElementById('banheiros').value ? parseInt(document.getElementById('banheiros').value) : 0;
    const vagas = parseInt(document.getElementById('vagas').value);
    const valor_condominio = document.getElementById('valor_condominio').value ? parseFloat(document.getElementById('valor_condominio').value) : null;
    const valor_iptu = document.getElementById('valor_iptu').value ? parseFloat(document.getElementById('valor_iptu').value) : null;
    const descricao = document.getElementById('descricao').value;
    
    const infraTexto = document.getElementById('infraestrutura').value;
    const infraestrutura = infraTexto ? infraTexto.split(',').map(i => i.trim()).filter(i => i !== '') : [];

    try {
        btnPublicar.innerText = 'Salvando Alterações...';
        btnPublicar.disabled = true;

        // Sobem as novas se tiver
        let novasUrls = [];
        if (imagensSelecionadas.length > 0) {
            btnPublicar.innerText = 'Subindo Fotos Novas...';
            novasUrls = await subirNovasFotos(titulo);
        }

        // Junta as antigas (que restaram) com as novas
        const arrayImagensUrls = [...imagensAntigas, ...novasUrls];

        btnPublicar.innerText = 'Atualizando BD...';

        // Gerar campos SEO automaticamente
        const dadosImovel = { titulo, bairro, tipo, valor_venda, valor_aluguel, status, area_m2, quartos, suites, banheiros, vagas, valor_condominio, valor_iptu, descricao };
        const seoData = SEO.gerarCamposSEO(dadosImovel);

        const obJAtualizar = {
            titulo, bairro, tipo, valor_venda, valor_aluguel, status, 
            area_m2, quartos, suites, banheiros, vagas, valor_condominio, valor_iptu,
            descricao, infraestrutura, imagens: arrayImagensUrls,
            slug: seoData.slug,
            seo_titulo: seoData.seo_titulo,
            seo_descricao: seoData.seo_descricao
        };
        const { error } = await sb
            .from('imoveis')
            .update(obJAtualizar)
            .eq('id', imovelId);

        if (error) throw error;

        alert('Imóvel atualizado com sucesso!');
        window.location.href = 'admin-portfolio.html';

    } catch (err) {
        if (typeof console !== 'undefined') console.warn('Erro na edição de imóvel.');
        alert('Erro ao atualizar. Verifique sua conexão e tente novamente.');
    } finally {
        btnPublicar.innerText = 'Salvar Alterações';
        btnPublicar.disabled = false;
    }
});
