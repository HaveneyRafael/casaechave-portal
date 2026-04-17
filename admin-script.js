// Lógica para upload de imagens e cadastro no Supabase
const formCadastrar = document.getElementById('form-cadastrar');
const imagensUpload = document.getElementById('imagens_upload');
const previewContainer = document.getElementById('preview-imagens');
const btnPublicar = document.getElementById('btn-publicar');

let imagensSelecionadas = [];

// Preview de imagens ao selecionar arquivos
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
    
    // Adicionar apenas os válidos ao array
    imagensSelecionadas = [...imagensSelecionadas, ...arquivosValidos];
    
    // Atualizar preview
    atualizarPreview();
});

function atualizarPreview() {
    previewContainer.innerHTML = '';
    imagensSelecionadas.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement('div');
            div.className = 'relative w-24 h-24 m-1 rounded overflow-hidden border border-zinc-200';
            div.innerHTML = `
                <img src="${e.target.result}" class="w-full h-full object-cover" />
                <button type="button" class="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold" onclick="removerImagem(${index})">X</button>
            `;
            previewContainer.appendChild(div);
        }
        reader.readAsDataURL(file);
    });
}

// Global function to remove an image from the preview
window.removerImagem = function(index) {
    imagensSelecionadas.splice(index, 1);
    atualizarPreview();
};

// Formatar string para ser usada como path (ex: Mansao -> mansao)
function formatParaNomeArquivo(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "_");
}

// Upload imagens pro Storage
async function fazerUploadImagens(titulo) {
    const urls = [];
    const baseName = formatParaNomeArquivo(titulo);

    for (let i = 0; i < imagensSelecionadas.length; i++) {
        const file = imagensSelecionadas[i];
        const fileExt = file.name.split('.').pop();
        const nomeArquivo = `${baseName}_${Date.now()}_${i}.${fileExt}`;
        const filePath = `${nomeArquivo}`;

        const { data, error } = await sb.storage
            .from('imoveis_imagens')
            .upload(filePath, file);

        if (error) {
            if (typeof console !== 'undefined') console.warn('Falha no upload de imagem.');
            throw error;
        }

        // Pega a URL publica da imagem inserida
        const { data: publicUrlData } = sb.storage
            .from('imoveis_imagens')
            .getPublicUrl(filePath);

        urls.push(publicUrlData.publicUrl);
    }
    
    return urls;
}

// Handler de envio (submit)
formCadastrar.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Pegar dados do formulario
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
    
    // Processar Infraestrutura de string separada por virgula para Array
    const infraTexto = document.getElementById('infraestrutura').value;
    const infraestrutura = infraTexto ? infraTexto.split(',').map(i => i.trim()).filter(i => i !== '') : [];

    try {
        btnPublicar.innerText = 'Salvando...';
        btnPublicar.disabled = true;

        // 2. Subir Imagens (se tiver)
        let arrayImagensUrls = [];
        if (imagensSelecionadas.length > 0) {
            btnPublicar.innerText = 'Subindo Fotos...';
            arrayImagensUrls = await fazerUploadImagens(titulo);
        }

        // 3. Gerar campos SEO automaticamente
        btnPublicar.innerText = 'Gerando SEO...';
        const dadosImovel = { titulo, bairro, tipo, valor_venda, valor_aluguel, status, area_m2, suites, vagas, valor_condominio, descricao };
        const seoData = SEO.gerarCamposSEO(dadosImovel);

        // 4. Inserir no Banco de Dados usando o perfil autenticado da base
        btnPublicar.innerText = 'Criando Imóvel...';
        const { data: { session } } = await sb.auth.getSession();
        const meta = session?.user?.user_metadata || {};
        
        const corretor = meta.perfil_nome || localStorage.getItem('perfil_atual_nome') || 'Corretor';
        const corretor_foto = meta.perfil_foto || localStorage.getItem('perfil_atual_foto') || '';
        const corretor_whatsapp = meta.perfil_wpp || localStorage.getItem('perfil_atual_wpp') || '';

        const { data, error } = await sb
            .from('imoveis')
            .insert([{
                titulo, corretor, corretor_foto, corretor_whatsapp, bairro, tipo, valor_venda, valor_aluguel, status, 
                area_m2, suites, vagas, valor_condominio, 
                descricao, infraestrutura, imagens: arrayImagensUrls,
                slug: seoData.slug,
                seo_titulo: seoData.seo_titulo,
                seo_descricao: seoData.seo_descricao
            }]);

        if (error) throw error;

        // 4. Sucesso
        alert('Imóvel cadastrado com sucesso!');
        formCadastrar.reset();
        imagensSelecionadas = [];
        atualizarPreview();

    } catch (err) {
        if (typeof console !== 'undefined') console.warn('Erro no cadastro de imóvel.');
        alert('Erro ao cadastrar imóvel. Verifique sua conexão e tente novamente.');
    } finally {
        btnPublicar.innerText = 'Publicar Imóvel';
        btnPublicar.disabled = false;
    }
});
