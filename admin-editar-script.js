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
        document.getElementById('suites').value = data.suites || '';
        document.getElementById('vagas').value = data.vagas || '';
        document.getElementById('valor_condominio').value = data.valor_condominio || '';
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

function renderizarFotosAntigas() {
    const container = document.getElementById('fotos-antigas');
    container.innerHTML = '';

    if (imagensAntigas.length === 0) {
        container.innerHTML = '<span class="italic">Nenhuma foto salva anteriormente.</span>';
        return;
    }

    imagensAntigas.forEach((url, i) => {
        const imgDiv = document.createElement('div');
        imgDiv.className = 'relative w-24 h-24 m-1 rounded overflow-hidden border border-zinc-200';
        imgDiv.innerHTML = `
            <img src="${sanitizeHTML(url)}" class="w-full h-full object-cover" />
            <button type="button" class="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold pb-0.5" onclick="removerFotoAntiga(${i})">x</button>
        `;
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

function atualizarPreviewNovas() {
    previewContainer.innerHTML = '';
    imagensSelecionadas.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement('div');
            div.className = 'relative w-24 h-24 m-1 rounded overflow-hidden border border-blue-200 opacity-80';
            div.innerHTML = `
                <img src="${e.target.result}" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-blue-500/20 flex items-center justify-center"><span class="text-white text-xs bg-black/50 px-2 rounded font-bold">NOVA</span></div>
                <button type="button" class="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold" onclick="removerFotoNova(${index})">X</button>
            `;
            previewContainer.appendChild(div);
        }
        reader.readAsDataURL(file);
    });
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
    const suites = parseInt(document.getElementById('suites').value);
    const vagas = parseInt(document.getElementById('vagas').value);
    const valor_condominio = document.getElementById('valor_condominio').value ? parseFloat(document.getElementById('valor_condominio').value) : null;
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
        const dadosImovel = { titulo, bairro, tipo, valor_venda, valor_aluguel, status, area_m2, suites, vagas, valor_condominio, descricao };
        const seoData = SEO.gerarCamposSEO(dadosImovel);

        const obJAtualizar = {
            titulo, bairro, tipo, valor_venda, valor_aluguel, status, 
            area_m2, suites, vagas, valor_condominio, 
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
