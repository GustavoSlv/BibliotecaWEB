
const apiUrl = "https://localhost:7002/api/Autores";

let paginaAtual = 1;
const tamanhoPagina = 10;
let totalPaginas = 0;
let autorSelecionado = null;

// PESQUISA
let nomePesquisa = "";
let idPesquisa = "";

const tipoPesquisa = document.getElementById("tipo-pesquisa");
const inputPesquisa = document.getElementById("pesquisa-nome");
const btnPesquisar = document.getElementById("btn-pesquisar");
const btnLimpar = document.getElementById("btn-limpar");

const listaAutores = document.getElementById("lista-autores");
const btnAnterior = document.getElementById("btn-anterior");
const btnProximo = document.getElementById("btn-proximo");
const infoPagina = document.getElementById("info-pagina");

// ELEMENTOS DO MODAL
const modalExclusao = document.getElementById("modal-exclusao");
const textoExclusao = document.getElementById("texto-exclusao");
const btnCancelarExclusao = document.getElementById("btn-cancelar-exclusao");
const btnConfirmarExclusao = document.getElementById("btn-confirmar-exclusao");
const mensagemResultado = document.getElementById("mensagem-resultado");

// =============================
// EXIBIR AUTORES NA TABELA
// =============================

function exibirAutores(autores) {

    listaAutores.innerHTML = "";

    if (autores.length === 0) {
        const linha = document.createElement("tr");
        const coluna = document.createElement("td");

        coluna.colSpan = 3;
        coluna.textContent = "Nenhum autor encontrado.";

        linha.appendChild(coluna);
        listaAutores.appendChild(linha);
        return;
    }

    autores.forEach(autor => {

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
}

// =============================
// LISTAR E PESQUISAR AUTORES
// =============================

async function buscarAutores() {

    try {

        // PESQUISA POR ID
        if (idPesquisa) {

            const resposta = await fetch(
                `${apiUrl}/${idPesquisa}`
            );

            if (resposta.status === 404) {
                exibirAutores([]);
                atualizarPaginacao(1, 1);
                return;
            }

            if (!resposta.ok) {
                throw new Error("Erro ao buscar autor pelo ID.");
            }

            const autor = await resposta.json();

            exibirAutores([autor]);
            atualizarPaginacao(1, 1);

            return;
        }

        // LISTAGEM OU PESQUISA POR NOME
        const parametros = new URLSearchParams({
            PageNumber: paginaAtual,
            PageSize: tamanhoPagina
        });

        if (nomePesquisa) {
            parametros.append("Nome", nomePesquisa);
        }

        const resposta = await fetch(
            `${apiUrl}?${parametros}`
        );

        if (!resposta.ok) {
            throw new Error("Erro ao buscar autores.");
        }

        const dados = await resposta.json();

        // VOLTAR UMA PÁGINA APÓS EXCLUSÃO
        if (
            paginaAtual > 1 &&
            paginaAtual > dados.totalPaginas
        ) {
            paginaAtual--;
            return buscarAutores();
        }

        paginaAtual = dados.paginaAtual;

        atualizarPaginacao(
            paginaAtual,
            dados.totalPaginas
        );

        exibirAutores(dados.autores);

    } catch (erro) {
        console.error(erro);

        exibirAutores([]);

        mensagemResultado.textContent = erro.message;
        mensagemResultado.className = "mensagem-erro";
    }
}

// =============================
// ATUALIZAR PAGINAÇÃO
// =============================

function atualizarPaginacao(pagina, total) {

    paginaAtual = pagina;
    totalPaginas = total;

    infoPagina.textContent =
        `Página ${pagina} de ${Math.max(1, total)}`;

    btnAnterior.disabled = pagina <= 1;
    btnProximo.disabled = pagina >= total;
}

// =============================
// SELECIONAR TIPO DE PESQUISA
// =============================

tipoPesquisa.addEventListener("change", function () {

    inputPesquisa.value = "";

    if (tipoPesquisa.value === "id") {
        inputPesquisa.placeholder = "Digite o ID do autor...";
        inputPesquisa.inputMode = "numeric";
    } else {
        inputPesquisa.placeholder = "Pesquisar autor pelo nome...";
        inputPesquisa.inputMode = "text";
    }
});

// =============================
// PESQUISAR AUTOR
// =============================

btnPesquisar.addEventListener("click", function () {

    const valor = inputPesquisa.value.trim();

    mensagemResultado.textContent = "";

    // REINICIAR FILTROS
    nomePesquisa = "";
    idPesquisa = "";
    paginaAtual = 1;

    if (tipoPesquisa.value === "id") {

        if (valor && (!/^[1-9]\d*$/.test(valor) ||
            !Number.isSafeInteger(Number(valor)))) {

            mensagemResultado.textContent =
                "Informe um ID numérico inteiro e maior que zero.";

            mensagemResultado.className = "mensagem-erro";
            return;
        }

        idPesquisa = valor;

    } else {
        nomePesquisa = valor;
    }

    buscarAutores();
});

// PESQUISAR COM ENTER
inputPesquisa.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {
        event.preventDefault();
        btnPesquisar.click();
    }
});

// =============================
// LIMPAR PESQUISA
// =============================

btnLimpar.addEventListener("click", function () {

    tipoPesquisa.value = "nome";

    inputPesquisa.value = "";
    inputPesquisa.placeholder =
        "Pesquisar autor pelo nome...";
    inputPesquisa.inputMode = "text";

    nomePesquisa = "";
    idPesquisa = "";
    paginaAtual = 1;

    mensagemResultado.textContent = "";

    buscarAutores();
});

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

    const autor = autorSelecionado;

    btnConfirmarExclusao.disabled = true;
    btnCancelarExclusao.disabled = true;
    btnConfirmarExclusao.textContent = "Excluindo...";

    mensagemResultado.textContent = "";

    try {

        await excluirAutor(autor.id);

        modalExclusao.close();

        // ATUALIZAR RESULTADOS APÓS EXCLUSÃO
        await buscarAutores();

        mensagemResultado.textContent =
            `Autor ${autor.nome} excluído com sucesso!`;

        mensagemResultado.className = "mensagem-sucesso";

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

// LIMPAR SELEÇÃO
modalExclusao.addEventListener("close", function () {
    autorSelecionado = null;
});

// =============================
// DELETE NA API
// =============================

async function excluirAutor(id) {

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
            "Você não tem permissão para excluir autores."
        );
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
