const apiUrl = 'https://localhost:7002/api/Autores';

const formAutor = document.getElementById('form-autor');
const mensagemAutor = document.getElementById('mensagem-autor');
const btnSalvar = document.getElementById('btn-salvar-autor');
const inputNome = document.getElementById('nomeAutor');
const autorId = new URLSearchParams(window.location.search).get('id');

const validacao = criarValidacao(formAutor, mensagemAutor, {
    nome: 'nomeAutor'
});

async function carregarAutor() {
    if (!autorId) return;

    btnSalvar.disabled = true;
    try {
        const resposta = await fetch(`${apiUrl}/${autorId}`);
        if (!resposta.ok) throw new Error('Não foi possível carregar o autor.');

        const autor = await resposta.json();
        document.getElementById('campo-id').hidden = false;
        document.getElementById('autorId').value = autor.id;
        inputNome.value = autor.nome;
        document.getElementById('titulo-form-autor').textContent = 'Alterar Autor';
        btnSalvar.textContent = 'Salvar Alterações';
        btnSalvar.disabled = false;
    } catch (erro) {
        console.error(erro);
        validacao.geral(erro.message);
    }
}

formAutor.addEventListener('submit', async function (event) {
    event.preventDefault();
    validacao.limpar();

    const nome = inputNome.value.trim();
    if (!nome) {
        validacao.mostrar('nomeAutor', 'Informe o nome do autor.');
        inputNome.focus();
        return;
    }

    const token = sessionStorage.getItem('token');
    const expiresAt = sessionStorage.getItem('expiresAt');
    if (!token || !expiresAt || !Number.isFinite(Date.parse(expiresAt)) ||
        Date.now() >= Date.parse(expiresAt)) {
        validacao.geral('Sua sessão expirou. Faça login novamente.');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('expiresAt');
        return;
    }

    btnSalvar.disabled = true;
    try {
        const resposta = await fetch(autorId ? `${apiUrl}/${autorId}` : apiUrl, {
            method: autorId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nome })
        });

        if (resposta.status === 400) {
            await validacao.mostrarErroApi(resposta);
            return;
        }
        if (resposta.status === 401) throw new Error('Sessão inválida ou expirada. Faça login novamente.');
        if (resposta.status === 403) throw new Error('Você não tem permissão para realizar esta operação.');
        if (resposta.status === 404) throw new Error('Autor não encontrado.');
        if (!resposta.ok) throw new Error('Não foi possível salvar o autor.');

        window.location.href = 'AutorGet.html';
    } catch (erro) {
        console.error(erro);
        validacao.geral(erro.message);
    } finally {
        btnSalvar.disabled = false;
    }
});

carregarAutor();
