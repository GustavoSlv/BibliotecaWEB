
const apiUrl = "https://localhost:7002/api/Livros";

let paginaAtual = 1;
const tamanhoPagina = 10;
let totalPaginas = 0;
let livroSelecionado = null;

const listaLivros = document.getElementById("lista-livros");
const btnAnterior = document.getElementById("btn-anterior");
const btnProximo = document.getElementById("btn-proximo");
const infoPagina = document.getElementById("info-pagina");

// ELEMENTOS DO MODAL
const modalExclusao = document.getElementById("modal-exclusao");
const textoExclusao = document.getElementById("texto-exclusao");
const btnCancelarExclusao = document.getElementById("btn-cancelar-exclusao");
const btnConfirmarExclusao = document.getElementById("btn-confirmar-exclusao");
const mensagemResultado = document.getElementById("mensagem-resultado");

// ==================================
// LISTAR LIVROS
// ==================================

async function buscarLivros() {

    try {
        const resposta = await fetch(
            `${apiUrl}?PageNumber=${paginaAtual}&PageSize=${tamanhoPagina}`
        );

        if (!resposta.ok) {
            throw new Error("Não foi possível buscar os livros.");
        }

        const dados = await resposta.json();

        // VOLTAR UMA PÁGINA SE A ATUAL FICAR VAZIA
        if (paginaAtual > 1 && paginaAtual > dados.totalPaginas) {
            paginaAtual--;
            return buscarLivros();
        }

        paginaAtual = dados.paginaAtual;
        totalPaginas = dados.totalPaginas;

        infoPagina.textContent =
            `Página ${paginaAtual} de ${Math.max(1, totalPaginas)}`;

        btnAnterior.disabled = paginaAtual <= 1;
        btnProximo.disabled = paginaAtual >= totalPaginas;

        listaLivros.innerHTML = "";

        // LISTA VAZIA
        if (dados.livros.length === 0) {

            const linha = document.createElement("tr");
            const coluna = document.createElement("td");

            coluna.colSpan = 6;
            coluna.textContent = "Nenhum livro encontrado.";

            linha.appendChild(coluna);
            listaLivros.appendChild(linha);

            return;
        }

        // PREENCHER TABELA
        dados.livros.forEach(livro => {

            const linha = document.createElement("tr");

            const colunaId = document.createElement("td");
            colunaId.textContent = livro.id;

            const colunaTitulo = document.createElement("td");
            colunaTitulo.textContent = livro.titulo;

            const colunaIsbn = document.createElement("td");
            colunaIsbn.textContent = livro.isbn;

            const colunaAno = document.createElement("td");
            colunaAno.textContent = livro.anoPublicacao;

            const colunaAutor = document.createElement("td");
            colunaAutor.textContent =
                livro.autor?.nome ?? "Não informado";

            const colunaAcoes = document.createElement("td");

            // BOTÃO ALTERAR
            const btnAlterar = document.createElement("button");

            btnAlterar.textContent = "Alterar";
            btnAlterar.className = "btn-alterar";

            btnAlterar.addEventListener("click", function () {
                window.location.href =
                    `LivroPost.html?id=${livro.id}`;
            });

            // BOTÃO EXCLUIR
            const btnExcluir = document.createElement("button");

            btnExcluir.textContent = "Excluir";
            btnExcluir.className = "btn-excluir";

            btnExcluir.addEventListener("click", function () {
                abrirModalExclusao(livro);
            });

            colunaAcoes.appendChild(btnAlterar);
            colunaAcoes.appendChild(btnExcluir);

            linha.appendChild(colunaId);
            linha.appendChild(colunaTitulo);
            linha.appendChild(colunaIsbn);
            linha.appendChild(colunaAno);
            linha.appendChild(colunaAutor);
            linha.appendChild(colunaAcoes);

            listaLivros.appendChild(linha);
        });

    } catch (erro) {
        console.error(erro);

        listaLivros.innerHTML = "";

        const linha = document.createElement("tr");
        const coluna = document.createElement("td");

        coluna.colSpan = 6;
        coluna.textContent = "Não foi possível carregar os livros.";

        linha.appendChild(coluna);
        listaLivros.appendChild(linha);
    }
}

// ==================================
// PAGINAÇÃO
// ==================================

btnAnterior.addEventListener("click", function () {

    if (paginaAtual > 1) {
        paginaAtual--;
        buscarLivros();
    }
});

btnProximo.addEventListener("click", function () {

    if (paginaAtual < totalPaginas) {
        paginaAtual++;
        buscarLivros();
    }
});

// ==================================
// ABRIR MODAL DE EXCLUSÃO
// ==================================

function abrirModalExclusao(livro) {

    livroSelecionado = livro;

    mensagemResultado.textContent = "";

    textoExclusao.textContent =
        `Tem certeza de que deseja excluir o livro "${livro.titulo}"? Esta ação não poderá ser desfeita.`;

    modalExclusao.showModal();
}

// ==================================
// CANCELAR EXCLUSÃO
// ==================================

btnCancelarExclusao.addEventListener("click", function () {
    modalExclusao.close();
});

// ==================================
// CONFIRMAR EXCLUSÃO
// ==================================

btnConfirmarExclusao.addEventListener("click", async function () {

    if (!livroSelecionado) return;

    const livro = livroSelecionado;

    btnConfirmarExclusao.disabled = true;
    btnCancelarExclusao.disabled = true;
    btnConfirmarExclusao.textContent = "Excluindo...";

    mensagemResultado.textContent = "";

    try {
        await excluirLivro(livro.id);

        modalExclusao.close();

        mensagemResultado.textContent =
            `Livro "${livro.titulo}" excluído com sucesso!`;

        mensagemResultado.className = "mensagem-sucesso";

        await buscarLivros();

    } catch (erro) {
        console.error(erro);

        modalExclusao.close();

        mensagemResultado.textContent = erro.message;
        mensagemResultado.className = "mensagem-erro";

    } finally {
        btnConfirmarExclusao.disabled = false;
        btnCancelarExclusao.disabled = false;
        btnConfirmarExclusao.textContent = "Sim, excluir";

        livroSelecionado = null;
    }
});

// LIMPAR SELEÇÃO AO FECHAR MODAL
modalExclusao.addEventListener("close", function () {
    livroSelecionado = null;
});

// ==================================
// DELETE NA API
// ==================================

async function excluirLivro(id) {

    const token = sessionStorage.getItem("token");
    const expiresAt = sessionStorage.getItem("expiresAt");

    if (
        !token ||
        !expiresAt ||
        !Number.isFinite(Date.parse(expiresAt)) ||
        Date.now() >= Date.parse(expiresAt)
    ) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("expiresAt");

        throw new Error(
            "Sua sessão expirou. Faça login novamente."
        );
    }

    const resposta = await fetch(`${apiUrl}/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (resposta.status === 401) {
        throw new Error(
            "Sessão inválida ou expirada. Faça login novamente."
        );
    }

    if (resposta.status === 403) {
        throw new Error(
            "Você não tem permissão para excluir livros."
        );
    }

    if (resposta.status === 404) {
        throw new Error("Livro não encontrado.");
    }

    if (!resposta.ok) {
        throw new Error("Não foi possível excluir o livro.");
    }
}

// ==================================
// INICIALIZAÇÃO
// ==================================

buscarLivros();
