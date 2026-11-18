const apiLivros = 'https://localhost:7002/api/Livros';
const apiAutores = 'https://localhost:7002/api/Autores';

const formLivro = document.getElementById('form-livro');
const mensagemLivro = document.getElementById('mensagem-livro');
const selectAutores = document.getElementById('autorId');
const btnSalvar = document.getElementById('btn-salvar-livro');
const livroId = new URLSearchParams(window.location.search).get('id');
let formularioCarregado = false;

const validacao = criarValidacao(formLivro, mensagemLivro, {
    titulo: 'titulo',
    isbn: 'isbn',
    anopublicacao: 'anoPublicacao',
    autorid: 'autorId'
});

async function carregarAutores() {
    let pagina = 1;
    let totalPaginas = 1;
    selectAutores.innerHTML = '<option value="">Selecione um autor</option>';

    do {
        const resposta = await fetch(`${apiAutores}?PageNumber=${pagina}&PageSize=10`);
        if (!resposta.ok) throw new Error('Não foi possível carregar os autores.');
        const dados = await resposta.json();
        dados.autores.forEach(autor => {
            const opcao = document.createElement('option');
            opcao.value = autor.id;
            opcao.textContent = autor.nome;
            selectAutores.appendChild(opcao);
        });
        totalPaginas = dados.totalPaginas;
        pagina++;
    } while (pagina <= totalPaginas);

    if (selectAutores.options.length === 1) {
        throw new Error('Nenhum autor encontrado. Cadastre um autor primeiro.');
    }
}

async function carregarLivro() {
    if (!livroId) return;
    const resposta = await fetch(`${apiLivros}/${livroId}`);
    if (!resposta.ok) throw new Error('Não foi possível carregar o livro.');
    const livro = await resposta.json();

    document.getElementById('campo-id').hidden = false;
    document.getElementById('livroId').value = livro.id;
    document.getElementById('titulo').value = livro.titulo;
    document.getElementById('isbn').value = livro.isbn;
    document.getElementById('anoPublicacao').value = livro.anoPublicacao;
    selectAutores.value = String(livro.autorId ?? livro.autor?.id ?? '');
    if (!selectAutores.value) throw new Error('O autor vinculado ao livro não foi encontrado.');

    document.getElementById('titulo-form-livro').textContent = 'Alterar Livro';
    btnSalvar.textContent = 'Salvar Alterações';
}

formLivro.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!formularioCarregado) return;
    validacao.limpar();

    const titulo = document.getElementById('titulo').value.trim();
    const isbn = document.getElementById('isbn').value.trim();
    const anoTexto = document.getElementById('anoPublicacao').value.trim();
    const anoPublicacao = Number(anoTexto);
    const autorId = Number(selectAutores.value);

    let primeiroCampoInvalido = null;
    function erroCampo(id, texto) {
        validacao.mostrar(id, texto);
        primeiroCampoInvalido ??= document.getElementById(id);
    }

    // Regras iguais no LivroCreateDto e no LivroUpdateDto.
    if (!titulo) erroCampo('titulo', 'O título é obrigatório.');
    else if (titulo.length < 2 || titulo.length > 200) {
        erroCampo('titulo', 'O título deve ter entre 2 e 200 caracteres.');
    }
    if (!isbn) erroCampo('isbn', 'O ISBN é obrigatório.');
    else if (isbn.length < 10 || isbn.length > 20) {
        erroCampo('isbn', 'O ISBN deve ter entre 10 e 20 caracteres.');
    }
    if (!anoTexto || !Number.isInteger(anoPublicacao) ||
        anoPublicacao < 1 || anoPublicacao > 2200) {
        erroCampo('anoPublicacao', 'Informe um ano válido (entre 1 e 2200).');
    }
    if (!Number.isInteger(autorId) || autorId < 1) {
        erroCampo('autorId', 'Selecione um autor válido.');
    }
    if (primeiroCampoInvalido) {
        primeiroCampoInvalido.focus();
        return;
    }

    const token = sessionStorage.getItem('token');
    const expiresAt = sessionStorage.getItem('expiresAt');
    if (!token || !expiresAt || !Number.isFinite(Date.parse(expiresAt)) ||
        Date.now() >= Date.parse(expiresAt)) {
        validacao.geral('Sua sessão expirou. Faça login novamente.');
        return;
    }

    const livro = { titulo, isbn, anoPublicacao, autorId };
    btnSalvar.disabled = true;

    try {
        const resposta = await fetch(livroId ? `${apiLivros}/${livroId}` : apiLivros, {
            method: livroId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(livro)
        });

        if (resposta.status === 400) {
            await validacao.mostrarErroApi(resposta);
            return;
        }
        if (resposta.status === 401) throw new Error('Sessão inválida ou expirada. Faça login novamente.');
        if (resposta.status === 403) throw new Error('Você não tem permissão para realizar esta operação.');
        if (resposta.status === 404) throw new Error('Livro ou autor não encontrado.');
        if (!resposta.ok) throw new Error('Não foi possível salvar o livro.');

        window.location.href = 'LivroGet.html';
    } catch (erro) {
        console.error(erro);
        validacao.geral(erro.message);
    } finally {
        btnSalvar.disabled = false;
    }
});

async function iniciarFormulario() {
    btnSalvar.disabled = true;
    try {
        await carregarAutores();
        await carregarLivro();
        formularioCarregado = true;
        btnSalvar.disabled = false;
    } catch (erro) {
        console.error(erro);
        validacao.geral(erro.message);
    }
}

iniciarFormulario();
