// supabase-config.js

// ==== CREDENCIAIS ====
const SUPABASE_URL = 'https://kzvdnoowgpqelzmdumsh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_boNdM7T2Kmghk51l9msFcg_MezvjfUm';

// Inicializa o cliente Supabase
window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =====================================================
// SEGURANÇA: Sanitização contra XSS
// =====================================================
window.sanitizeHTML = function(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// =====================================================
// SEGURANÇA: Validação de arquivos de upload
// =====================================================
const EXTENSOES_PERMITIDAS = ['jpg', 'jpeg', 'png', 'webp'];
const TAMANHO_MAX_BYTES = 5 * 1024 * 1024; // 5MB

window.validarArquivoUpload = function(file) {
    if (!file) return { valido: false, erro: 'Nenhum arquivo selecionado.' };
    
    const extensao = file.name.split('.').pop().toLowerCase();
    if (!EXTENSOES_PERMITIDAS.includes(extensao)) {
        return { valido: false, erro: `Formato "${extensao}" não permitido. Use: ${EXTENSOES_PERMITIDAS.join(', ')}.` };
    }
    
    if (file.size > TAMANHO_MAX_BYTES) {
        const mbAtual = (file.size / 1024 / 1024).toFixed(1);
        return { valido: false, erro: `Arquivo muito grande (${mbAtual}MB). Máximo permitido: 5MB.` };
    }
    
    // Verificar MIME type real
    const mimePermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!mimePermitidos.includes(file.type)) {
        return { valido: false, erro: `Tipo de arquivo inválido. Envie apenas imagens JPG, PNG ou WebP.` };
    }
    
    return { valido: true, erro: null };
};

// =====================================================
// LOGOUT
// =====================================================
window.fazerLogout = function(e) {
    if (e) e.preventDefault();
    window.sb.auth.signOut().then(function() {
        window.location.href = 'login.html';
    }).catch(function() {
        window.location.href = 'login.html';
    });
};

// =====================================================
// PREENCHE SIDEBAR E MODAL (GLOBAL)
// =====================================================
window.preencherSidebar = async function() {
    const { data } = await window.sb.auth.getSession();

    if (!data || !data.session) {
        if (window.location.pathname.includes('admin-')) {
            window.location.href = 'login.html';
        }
        return;
    }

    const user     = data.session.user;
    const email    = user.email || '';
    const meta     = user.user_metadata || {};
    const isCorretor = meta.role === 'corretor';

    // Ler do Supabase User Metadata (Fonte da verdade)
    const nomeSalvo  = meta.perfil_nome || '';
    const fotoSalva  = meta.perfil_foto || '';
    const wppSalvo   = meta.perfil_wpp || '';

    // Guardar retrocompatibilidade no LocalStorage (protegendo por UserID)
    localStorage.setItem('perfil_atual_nome', nomeSalvo);
    localStorage.setItem('perfil_atual_foto', fotoSalva);
    localStorage.setItem('perfil_atual_wpp', wppSalvo);

    const nomeExibir = nomeSalvo || email.split('@')[0];
    const nomeAvatar = encodeURIComponent(nomeExibir);
    const fotoUrl    = fotoSalva || `https://ui-avatars.com/api/?name=${nomeAvatar}&background=ff291b&color=fff&bold=true`;
    const roleTexto  = isCorretor ? 'Corretor' : 'Administrador Geral';

    // Preenche a sidebar
    const elNome = document.getElementById('sidebar-nome');
    const elFoto = document.getElementById('sidebar-foto');
    const elRole = document.getElementById('sidebar-role');

    if (elNome) elNome.innerText = nomeExibir.toUpperCase();
    if (elFoto) elFoto.src = fotoUrl;
    if (elRole) elRole.innerText = roleTexto;

    // Preenche input do modal (se existir)
    const iptNome = document.getElementById('perfil-nome-input');
    const iptWpp = document.getElementById('perfil-wpp-input');
    
    if (iptNome) iptNome.value = nomeSalvo;
    if (iptWpp) iptWpp.value = wppSalvo;

    // Controle de permissões para corretores (RBAC reforçado)
    if (isCorretor) {
        const leadsLink      = document.querySelector('a[href="admin-leads.html"]');
        const corretoresLink = document.querySelector('a[href="admin-corretores.html"]');
        if (leadsLink)       leadsLink.style.display      = 'none';
        if (corretoresLink)  corretoresLink.style.display = 'none';

        const path = window.location.pathname;
        if (path.includes('admin-leads') || path.includes('admin-corretores')) {
            // Limpa o conteúdo da página ANTES de redirecionar para evitar flash de dados
            document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><p>Acesso negado. Redirecionando...</p></div>';
            window.location.href = 'admin-dashboard.html';
            return; // Interrompe a execução
        }
    }
};

// =====================================================
// SALVAR PERFIL DO MODAL (GLOBAL)
// =====================================================
window.salvarPerfilCorretor = async function() {
    // Busca o botão dentro do modal para desativar e não depender de "event" implícito (que falha em alguns navegadores/scripts)
    const btnArr = Array.from(document.querySelectorAll('#modal-perfil button'));
    const btn = btnArr.find(b => b.innerText.includes('Salvar Meu Perfil') || b.innerText.includes('Salvando'));
    
    if(btn) {
        btn.innerText = "Salvando...";
        btn.disabled = true;
    }

    const iptNome = document.getElementById('perfil-nome-input');
    const iptWpp = document.getElementById('perfil-wpp-input');
    const uploadInput = document.getElementById('perfil-upload');

    const nome = iptNome ? iptNome.value : '';
    const wpp = iptWpp ? iptWpp.value : '';

    try {
        const { data: { session } } = await window.sb.auth.getSession();
        if(!session) throw new Error("Sem sessão ativa");
        const meta = session.user.user_metadata || {};
        let fotoUrl = meta.perfil_foto || '';

        // Se optou por foto nova (com validação de segurança)
        if (uploadInput && uploadInput.files.length > 0) {
            const file = uploadInput.files[0];
            const validacao = window.validarArquivoUpload(file);
            if (!validacao.valido) {
                alert(validacao.erro);
                if(btn) { btn.innerText = "Salvar Meu Perfil"; btn.disabled = false; }
                return;
            }
            const fileExt = file.name.split('.').pop().toLowerCase();
            const filePath = `perfil_${session.user.id}_${Date.now()}.${fileExt}`;
            
            const { error: errUp } = await window.sb.storage.from('imoveis_imagens').upload(filePath, file);
            if(errUp) throw errUp;
            
            const { data: publicData } = window.sb.storage.from('imoveis_imagens').getPublicUrl(filePath);
            fotoUrl = publicData.publicUrl;
        }

        // SALVA NA NUVEM PARA O USUÁRIO (persistente)
        const { error: errUpdate } = await window.sb.auth.updateUser({
            data: {
                perfil_nome: nome,
                perfil_wpp: wpp,
                perfil_foto: fotoUrl
            }
        });
        if(errUpdate) throw errUpdate;

        // Atualiza interface imediatamente
        await window.preencherSidebar();

        // Fecha Modal
        const modal = document.getElementById('modal-perfil');
        if(modal) modal.classList.add('hidden');

    } catch(err) {
        if (typeof console !== 'undefined') console.warn('Falha ao salvar perfil.');
        alert("Erro ao salvar perfil. Verifique sua conexão e tente novamente.");
    } finally {
        if(btn) {
            btn.innerText = "Salvar Meu Perfil";
            btn.disabled = false;
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const btnSair = document.getElementById('btn-sair');
    if (btnSair) {
        btnSair.addEventListener('click', window.fazerLogout);
    }
    if (window.location.pathname.includes('admin-')) {
        window.preencherSidebar();
    }
});
