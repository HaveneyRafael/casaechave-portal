const formLogin = document.getElementById('form-login');
const btnEntrar = document.getElementById('btn-entrar');
const btnTexto = document.getElementById('btn-texto');
const msgErro = document.getElementById('msg-erro');
const msgBlock = document.getElementById('msg-block');

// Alternar visualização da senha
const btnToggleSenha = document.getElementById('btn-toggle-senha');
const inputSenha = document.getElementById('senha');
if(btnToggleSenha && inputSenha) {
    btnToggleSenha.addEventListener('click', () => {
        if(inputSenha.type === 'password') {
            inputSenha.type = 'text';
            btnToggleSenha.innerText = 'visibility_off';
        } else {
            inputSenha.type = 'password';
            btnToggleSenha.innerText = 'visibility';
        }
    });
}

let timerBloqueio;
const BLOQUEIO_MINUTOS = 15;
const MAX_TENTATIVAS = 3;

function verificarBloqueio() {
    const lockTime = localStorage.getItem('login_lock_time');
    if (lockTime) {
        const diffMs = Date.now() - parseInt(lockTime);
        const diffMinutos = diffMs / 1000 / 60;
        
        if (diffMinutos < BLOQUEIO_MINUTOS) {
            iniciarContagemRegressiva(BLOQUEIO_MINUTOS * 60 * 1000 - diffMs);
            return true;
        } else {
            localStorage.removeItem('login_lock_time');
            localStorage.removeItem('login_tentativas');
        }
    }
    return false;
}

function iniciarContagemRegressiva(milissegundos) {
    btnEntrar.disabled = true;
    msgErro.classList.add('hidden');
    msgBlock.classList.remove('hidden');
    msgBlock.classList.add('flex');
    btnTexto.innerText = "Acesso Bloqueado";
    
    let faltamMs = milissegundos;
    
    if (timerBloqueio) clearInterval(timerBloqueio);
    
    timerBloqueio = setInterval(() => {
        faltamMs -= 1000;
        if (faltamMs <= 0) {
            clearInterval(timerBloqueio);
            localStorage.removeItem('login_lock_time');
            localStorage.removeItem('login_tentativas');
            btnEntrar.disabled = false;
            msgBlock.classList.add('hidden');
            msgBlock.classList.remove('flex');
            btnTexto.innerText = "Autenticar Sessão";
        } else {
            const min = Math.floor(faltamMs / 60000);
            const sec = Math.floor((faltamMs % 60000) / 1000);
            document.getElementById('tempo-restante').innerText = `${min}:${sec.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

// Se vier de um logout (parâmetro ?logout=1), garante que a sessão foi limpa
document.addEventListener('DOMContentLoaded', async () => {
    verificarBloqueio();
    
    const params = new URLSearchParams(window.location.search);
    if (params.get('logout') === '1') {
        await sb.auth.signOut();
        localStorage.clear();
        sessionStorage.clear();
        return; // Fica na tela de login sem redirecionar
    }

    // Redireciona pro painel se já estiver logado (e não bloqueado)
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
        window.location.href = 'admin-cadastrar.html';
    }
});

formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (verificarBloqueio()) return;
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('senha').value;
    
    btnTexto.innerText = "Verificando...";
    btnEntrar.disabled = true;
    msgErro.classList.add('hidden');

    try {
        const { data, error } = await sb.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            throw error;
        }

        // Sucesso
        localStorage.removeItem('login_tentativas');
        localStorage.removeItem('login_lock_time');
        window.location.href = 'admin-cadastrar.html';

    } catch (error) {
        let tentativas = parseInt(localStorage.getItem('login_tentativas') || '0');
        tentativas++;
        localStorage.setItem('login_tentativas', tentativas);
        
        btnTexto.innerText = "Autenticar Sessão";
        btnEntrar.disabled = false;
        
        if (tentativas >= MAX_TENTATIVAS) {
            localStorage.setItem('login_lock_time', Date.now().toString());
            verificarBloqueio();
        } else {
            msgErro.classList.remove('hidden');
            msgErro.innerText = `Credenciais inválidas. Restam ${MAX_TENTATIVAS - tentativas} tentativa(s).`;
        }
        
        if (typeof console !== 'undefined') console.warn('Tentativa de login falhou.');
    }
});
