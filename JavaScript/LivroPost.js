
const apiLivros = "https://localhost:7002/api/Livros";
const apiAutores = "https://localhost:7002/api/Autores";

const formLivro = document.getElementById("form-livro");
const mensagemLivro = document.getElementById("mensagem-livro");
const selectAutores = document.getElementById("autorId");
const btnSalvar = document.getElementById("btn-salvar-livro");

const parametros = new URLSearchParams(window.location.search);
const livroId = parametros.get("id");

let formularioCarregado = false;

// ==================================
// BUSCAR AUTORES PARA O SELECT
// ==================================

async function carregarAutores() {

    let pagina = 1;
    let totalPaginas = 1;

    selectAutores.innerHTML =
        '<option value="">Selecione um autor</option>';

    do {
        const resposta = await fetch(
            `${apiAutores}?PageNumber=${pagina}&PageSize=10`
        );

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar os autores.");
        }

        const dados = await resposta.json();

        dados.autores.forEach(autor => {

            const option = document.createElement("option");

            option.value = autor.id;
            option.textContent = autor.nome;

            selectAutores.appendChild(option);
        });

        totalPaginas = dados.totalPaginas;
        pagina++;

    } while (pagina <= totalPaginas);

    if (selectAutores.options.length === 1) {
        throw new Error(
            "Nenhum autor encontrado. Cadastre um autor primeiro."
        );
    }
}

// ==================================
// CARREGAR LIVRO PARA EDIÇÃO
// ==================================

async function carregarLivro() {

    if (!livroId) return;

    const resposta = await fetch(`${apiLivros}/${livroId}`);

    if (!resposta.ok) {
        throw new Error("Não foi possível carregar o livro.");
    }

    const livro = await resposta.json();

    // PREENCHER CAMPOS
    document.getElementById("campo-id").hidden = false;
    document.getElementById("livroId").value = livro.id;

    document.getElementById("titulo").value = livro.titulo;
    document.getElementById("isbn").value = livro.isbn;

    document.getElementById("anoPublicacao").value =
        livro.anoPublicacao;

    // SELECIONAR AUTOR
    const autorId = livro.autorId ?? livro.autor?.id;

    selectAutores.value = String(autorId ?? "");

    if (!selectAutores.value) {
        throw new Error(
            "O autor vinculado ao livro não foi encontrado."
        );
    }

    // ALTERAR TEXTOS DA PÁGINA
    document.getElementById("titulo-form-livro").textContent =
        "Alterar Livro";

    btnSalvar.textContent = "Salvar Alterações";
}

// ==================================
// CADASTRAR OU ALTERAR LIVRO
// ==================================

formLivro.addEventListener("submit", async function (event) {

    event.preventDefault();

    if (!formularioCarregado) return;

    const titulo = document.getElementById("titulo").value.trim();
    const isbn = document.getElementById("isbn").value.trim();

    const anoPublicacao = Number(
        document.getElementById("anoPublicacao").value
    );

    const autorId = Number(selectAutores.value);

    const token = sessionStorage.getItem("token");
    const expiresAt = sessionStorage.getItem("expiresAt");

    mensagemLivro.textContent = "";

    // VALIDAR SESSÃO
    if (
        !token ||
        !expiresAt ||
        !Number.isFinite(Date.parse(expiresAt)) ||
        Date.now() >= Date.parse(expiresAt)
    ) {
        mensagemLivro.textContent =
            "Sua sessão expirou. Faça login novamente.";

        mensagemLivro.style.color = "red";
        return;
    }

    // VALIDAR CAMPOS
    if (!titulo || !isbn || !anoPublicacao || !autorId) {
        mensagemLivro.textContent =
            "Preencha todos os campos corretamente.";

        mensagemLivro.style.color = "red";
        return;
    }

    // OBJETO ENVIADO À API
    const livro = {
        titulo: titulo,
        isbn: isbn,
        anoPublicacao: anoPublicacao,
        autorId: autorId
    };

    // DEFINIR POST OU PUT
    const url = livroId
        ? `${apiLivros}/${livroId}`
        : apiLivros;

    const metodo = livroId ? "PUT" : "POST";

    btnSalvar.disabled = true;

    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(livro)
        });

        if (!resposta.ok) {

            const erroApi = await resposta.text();

            console.error("Status HTTP:", resposta.status);
            console.error("Resposta da API:", erroApi);

            if (resposta.status === 400) {
                throw new Error(
                    "Dados inválidos. Confira as informações do livro."
                );
            }

            if (resposta.status === 401) {
                throw new Error(
                    "Sessão inválida ou expirada. Faça login novamente."
                );
            }

            if (resposta.status === 403) {
                throw new Error(
                    "Você não tem permissão para realizar esta operação."
                );
            }

            if (resposta.status === 404) {
                throw new Error(
                    "Livro ou autor não encontrado."
                );
            }

            throw new Error(
                "Não foi possível salvar o livro."
            );
        }

        // SUCESSO
        mensagemLivro.textContent = livroId
            ? `Livro "${livro.titulo}" alterado com sucesso!`
            : `Livro "${livro.titulo}" cadastrado com sucesso!`;

        mensagemLivro.style.color = "green";

        window.location.href = "LivroGet.html";

    } catch (erro) {
        console.error(erro);

        mensagemLivro.textContent = erro.message;
        mensagemLivro.style.color = "red";

    } finally {
        btnSalvar.disabled = false;
    }
});

// ==================================
// INICIALIZAÇÃO DO FORMULÁRIO
// ==================================

async function iniciarFormulario() {

    btnSalvar.disabled = true;

    try {
        // Primeiro carrega os autores
        await carregarAutores();

        // Depois carrega o livro, se for edição
        await carregarLivro();

        formularioCarregado = true;
        btnSalvar.disabled = false;

    } catch (erro) {
        console.error(erro);

        mensagemLivro.textContent = erro.message;
        mensagemLivro.style.color = "red";
    }
}

iniciarFormulario();
