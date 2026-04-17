// admin-corretores-script.js

document.addEventListener('DOMContentLoaded', () => {
    // Verificar sessão ativa (opcional, já que admin deve estar logado)
    verificarSessao();

    const formCorretor = document.getElementById('form-corretor');
    if(formCorretor) {
        formCorretor.addEventListener('submit', cadastrarCorretor);
    }
});

async function verificarSessao() {
    const { data, error } = await window.sb.auth.getSession();
    if (error || !data.session) {
        window.location.href = 'login.html';
    }
}

async function cadastrarCorretor(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const btnCadastrar = document.getElementById('btn-cadastrar');

    if(!email || !senha) {
        alert('Por favor, preencha todos os campos!');
        return;
    }

    if(senha.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres.');
        return;
    }

    try {
        btnCadastrar.disabled = true;
        btnCadastrar.innerHTML = 'Cadastrando... <span class="material-symbols-outlined animate-spin text-sm align-middle ml-2">sync</span>';

        // O signUp pelo cliente JS padrão vai logar o novo usuário e deslogar o atual (admin)
        const { data, error } = await window.sb.auth.signUp({
            email: email,
            password: senha,
            options: {
                data: {
                    role: 'corretor'
                }
            }
        });

        if (error) {
            if (typeof console !== 'undefined') console.warn('Falha ao cadastrar corretor.');
            alert('Erro ao cadastrar corretor. Verifique se o e-mail é válido e tente novamente.');
            btnCadastrar.disabled = false;
            btnCadastrar.innerHTML = 'Criar Acesso do Corretor';
            return;
        }

        alert('Corretor cadastrado com sucesso! Você será redirecionado para a tela de login pois a sessão foi atualizada.');
        window.location.href = 'login.html';
        
    } catch (err) {
        if (typeof console !== 'undefined') console.warn('Erro inesperado no cadastro.');
        alert('Ocorreu um erro inesperado.');
        btnCadastrar.disabled = false;
        btnCadastrar.innerHTML = 'Criar Acesso do Corretor';
    }
}
