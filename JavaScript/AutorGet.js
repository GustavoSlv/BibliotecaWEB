
const apiUrl = "https://localhost:7002/api/Autores";

let paginaAtual = 1;
const tamanhoPagina = 10;
let totalPaginas = 0;
let autorSelecionado = null;

const listaAutores = document.getElementById("lista-autores");
const btnAnterior = document.getElementById("btn-anterior");
const btnProximo = document.getElementById("btn-proximo");
const infoPagina = document.getElementById("info-pagina");

// Elementos do modal
const modalExclusao = document.getElementById("modal-exclusao");
const textoExclusao = document.getElementById("texto-exclusao");
const btnCancelarExclusao = document.getElementById("btn-cancelar-exclusao");
const btnConfirmarExclusao = document.getElementById("btn-confirmar-exclusao");
const mensagemResultado = document.getElementById("mensagem-resultado");

// =============================
// LISTAR AUTORES
// =============================

async function buscarAutores() {

    try {
        const resposta = await fetch(
            `${apiUrl}?PageNumber=${paginaAtual}&PageSize=${tamanhoPagina}`
        );

        if (!resposta.ok) {
            throw new Error("Erro ao buscar autores.");
        }

        const dados = await resposta.json();

        // Voltar uma página se a atual ficar vazia após exclusão
        if (paginaAtual > 1 && paginaAtual > dados.totalPaginas) {
            paginaAtual--;
            return buscarAutores();
        }

        paginaAtual = dados.paginaAtual;
        totalPaginas = dados.totalPaginas;

        infoPagina.textContent =
            `Página ${paginaAtual} de ${Math.max(1, totalPaginas)}`;

        btnAnterior.disabled = paginaAtual <= 1;
        btnProximo.disabled = paginaAtual >= totalPaginas;

        listaAutores.innerHTML = "";

        // Nenhum autor cadastrado
        if (dados.autores.length === 0) {
            const linha = document.createElement("tr");
            const coluna = document.createElement("td");

            coluna.colSpan = 3;
            coluna.textContent = "Nenhum autor encontrado.";

            linha.appendChild(coluna);
            listaAutores.appendChild(linha);

            return;
        }

        // Criar linhas da tabela
        dados.autores.forEach(autor => {

            const linha = document.createElement("tr");

            const colunaId = document.createElement("td");
            colunaId.textContent = autor.id;

            const colunaNome = document.createElement("td");
            colunaNome.textContent = autor.nome;

            const colunaAcoes = document.createElement("td");

            // BOTÃO ALTERAR
            const btnAlterar = document.createElement("button");
            btnAlterar.textContent = "Alterar";
            btnAlterar.className = "btn-alterar";

            btnAlterar.addEventListener("click", function () {
                window.location.href =
                    `AutorPost.html?id=${autor.id}`;
            });

            // BOTÃO EXCLUIR
            const btnExcluir = document.createElement("button");
            btnExcluir.textContent = "Excluir";
            btnExcluir.className = "btn-excluir";

            btnExcluir.addEventListener("click", function () {
                abrirModalExclusao(autor);
            });

            colunaAcoes.appendChild(btnAlterar);
            colunaAcoes.appendChild(btnExcluir);

            linha.appendChild(colunaId);
            linha.appendChild(colunaNome);
            linha.appendChild(colunaAcoes);

            listaAutores.appendChild(linha);
        });

    } catch (erro) {
        console.error(erro);

        listaAutores.innerHTML = "";

        const linha = document.createElement("tr");
        const coluna = document.createElement("td");

        coluna.colSpan = 3;
        coluna.textContent = "Não foi possível carregar os autores.";

        linha.appendChild(coluna);
        listaAutores.appendChild(linha);
    }
}

// =============================
// PAGINAÇÃO
// =============================

btnAnterior.addEventListener("click", function () {
    if (paginaAtual > 1) {
        paginaAtual--;
        buscarAutores();
    }
});

btnProximo.addEventListener("click", function () {
    if (paginaAtual < totalPaginas) {
        paginaAtual++;
        buscarAutores();
    }
});

// =============================
// ABRIR MODAL DE EXCLUSÃO
// =============================

function abrirModalExclusao(autor) {

    autorSelecionado = autor;

    mensagemResultado.textContent = "";

    textoExclusao.textContent =
        `Tem certeza de que deseja excluir o autor ${autor.nome}? Esta ação não poderá ser desfeita.`;

    modalExclusao.showModal();
}

// =============================
// CANCELAR EXCLUSÃO
// =============================

btnCancelarExclusao.addEventListener("click", function () {
    modalExclusao.close();
});

// =============================
// CONFIRMAR EXCLUSÃO
// =============================

btnConfirmarExclusao.addEventListener("click", async function () {

    if (!autorSelecionado) return;

    btnConfirmarExclusao.disabled = true;
    btnCancelarExclusao.disabled = true;
    btnConfirmarExclusao.textContent = "Excluindo...";

    mensagemResultado.textContent = "";

    try {
        const autor = autorSelecionado;

        await excluirAutor(autor.id);

        modalExclusao.close();

        mensagemResultado.textContent =
            `Autor ${autor.nome} excluído com sucesso!`;

        mensagemResultado.className = "mensagem-sucesso";

        await buscarAutores();

    } catch (erro) {
        console.error(erro);

        modalExclusao.close();

        mensagemResultado.textContent = erro.message;
        mensagemResultado.className = "mensagem-erro";

    } finally {
        btnConfirmarExclusao.disabled = false;
        btnCancelarExclusao.disabled = false;
        btnConfirmarExclusao.textContent = "Sim, excluir";

        autorSelecionado = null;
    }
});

// Limpar autor selecionado ao fechar o modal
modalExclusao.addEventListener("close", function () {
    autorSelecionado = null;
});

// =============================
// DELETE NA API
// =============================

async function excluirAutor(id) {

    const token = sessionStorage.getItem("token");
    const expiresAt = sessionStorage.getItem("expiresAt");

    if (!token || !expiresAt || Date.now() >= Date.parse(expiresAt)) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("expiresAt");

        throw new Error("Sua sessão expirou. Faça login novamente.");
    }

    const resposta = await fetch(`${apiUrl}/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (resposta.status === 401) {
        throw new Error("Sessão inválida ou expirada. Faça login novamente.");
    }

    if (resposta.status === 403) {
        throw new Error("Você não tem permissão para excluir autores.");
    }

    if (resposta.status === 404) {
        throw new Error("Autor não encontrado.");
    }

    if (!resposta.ok) {
        throw new Error(
            "Não foi possível excluir o autor. Verifique se existem livros vinculados."
        );
    }
}

// =============================
// INICIALIZAÇÃO
// =============================

buscarAutores();
