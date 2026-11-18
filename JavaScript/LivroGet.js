
const apiUrl = "https://localhost:7002/api/Livros";

let paginaAtual = 1;
const tamanhoPagina = 10;
let totalPaginas = 0;
let livroSelecionado = null;

// FILTROS DA PESQUISA
let filtro = {
    tipo: "",
    valor: "",
    anoFinal: ""
};

// ELEMENTOS DA PESQUISA
const formPesquisa = document.getElementById("form-pesquisa-livros");
const tipoPesquisa = document.getElementById("tipo-pesquisa");
const valorPesquisa = document.getElementById("valor-pesquisa");
const campoAnoFinal = document.getElementById("campo-ano-final");
const inputAnoFinal = document.getElementById("ano-final");
const btnLimpar = document.getElementById("btn-limpar");

// ELEMENTOS DA LISTAGEM
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
// ATUALIZAR PAGINAÇÃO
// ==================================

function atualizarPaginacao(pagina, total) {

    paginaAtual = pagina;
    totalPaginas = total;

    infoPagina.textContent =
        `Página ${pagina} de ${Math.max(1, total)}`;

    btnAnterior.disabled = pagina <= 1;
    btnProximo.disabled = pagina >= total;
}

// ==================================
// EXIBIR LIVROS NA TABELA
// ==================================

function exibirLivros(livros) {

    listaLivros.innerHTML = "";

    if (livros.length === 0) {

        const linha = document.createElement("tr");
        const coluna = document.createElement("td");

        coluna.colSpan = 6;
        coluna.textContent = "Nenhum livro encontrado.";

        linha.appendChild(coluna);
        listaLivros.appendChild(linha);

        return;
    }

    livros.forEach(livro => {

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
}

// ==================================
// BUSCAR LIVROS
// ==================================

async function buscarLivros() {

    try {

        // PESQUISA POR ID
        if (filtro.tipo === "id" && filtro.valor) {

            const resposta = await fetch(
                `${apiUrl}/${filtro.valor}`
            );

            if (resposta.status === 404) {

                exibirLivros([]);
                atualizarPaginacao(1, 1);

                return;
            }

            if (!resposta.ok) {
                throw new Error(
                    "Não foi possível buscar o livro pelo ID."
                );
            }

            const livro = await resposta.json();

            // GET POR ID RETORNA UM OBJETO
            exibirLivros([livro]);

            atualizarPaginacao(1, 1);

            return;
        }

        // FILTROS DA QUERY STRING
        const parametros = new URLSearchParams({
            PageNumber: paginaAtual,
            PageSize: tamanhoPagina
        });

        if (filtro.tipo === "titulo" && filtro.valor) {
            parametros.append("Titulo", filtro.valor);
        }

        if (filtro.tipo === "autor" && filtro.valor) {
            parametros.append("AutorNome", filtro.valor);
        }

        if (filtro.tipo === "ano" && filtro.valor) {
            parametros.append("AnoInicial", filtro.valor);

            if (filtro.anoFinal) {
                parametros.append(
                    "AnoFinal",
                    filtro.anoFinal
                );
            }
        }

        const resposta = await fetch(
            `${apiUrl}?${parametros}`
        );

        if (!resposta.ok) {
            throw new Error(
                "Não foi possível buscar os livros."
            );
        }

        const dados = await resposta.json();

        // VOLTAR UMA PÁGINA SE NECESSÁRIO
        if (
            paginaAtual > 1 &&
            paginaAtual > dados.totalPaginas
        ) {
            paginaAtual--;
            return buscarLivros();
        }

        atualizarPaginacao(
            dados.paginaAtual,
            dados.totalPaginas
        );

        exibirLivros(dados.livros);

    } catch (erro) {
        console.error(erro);

        exibirLivros([]);
        atualizarPaginacao(1, 1);

        mensagemResultado.textContent = erro.message;
        mensagemResultado.className = "mensagem-erro";
    }
}

// ==================================
// ALTERAR TIPO DE PESQUISA
// ==================================

tipoPesquisa.addEventListener("change", function () {

    valorPesquisa.value = "";
    inputAnoFinal.value = "";

    campoAnoFinal.hidden = true;

    if (tipoPesquisa.value === "titulo") {

        valorPesquisa.type = "search";
        valorPesquisa.placeholder =
            "Pesquisar livro pelo título...";

    } else if (tipoPesquisa.value === "id") {

        valorPesquisa.type = "number";
        valorPesquisa.placeholder =
            "Digite o ID do livro...";

    } else if (tipoPesquisa.value === "autor") {

        valorPesquisa.type = "search";
        valorPesquisa.placeholder =
            "Pesquisar pelo nome do autor...";

    } else if (tipoPesquisa.value === "ano") {

        valorPesquisa.type = "number";
        valorPesquisa.placeholder =
            "Ano inicial...";

        campoAnoFinal.hidden = false;
    }
});

// ==================================
// VALIDAR NÚMERO POSITIVO
// ==================================

function numeroValido(valor) {

    const numero = Number(valor);

    return (
        /^[1-9]\d*$/.test(valor) &&
        Number.isSafeInteger(numero)
    );
}

// ==================================
// PESQUISAR LIVROS
// ==================================

formPesquisa.addEventListener("submit", function (event) {

    event.preventDefault();

    const tipo = tipoPesquisa.value;
    const valor = valorPesquisa.value.trim();
    const anoFinal = inputAnoFinal.value.trim();

    mensagemResultado.textContent = "";

    // NÃO ACEITAR ANO OU ID INVÁLIDO
    if (tipo === "id" && valor && !numeroValido(valor)) {

        mensagemResultado.textContent =
            "Informe um ID inteiro e maior que zero.";

        mensagemResultado.className = "mensagem-erro";
        return;
    }

    if (tipo === "ano") {

        if (!numeroValido(valor)) {

            mensagemResultado.textContent =
                "Informe um ano inicial válido.";

            mensagemResultado.className = "mensagem-erro";
            return;
        }

        if (anoFinal && !numeroValido(anoFinal)) {

            mensagemResultado.textContent =
                "Informe um ano final válido.";

            mensagemResultado.className = "mensagem-erro";
            return;
        }

        if (
            anoFinal &&
            Number(anoFinal) < Number(valor)
        ) {

            mensagemResultado.textContent =
                "O ano final não pode ser menor que o inicial.";

            mensagemResultado.className = "mensagem-erro";
            return;
        }
    }

    // SALVAR FILTRO ATUAL
    filtro = {
        tipo: tipo,
        valor: valor,
        anoFinal: tipo === "ano" ? anoFinal : ""
    };

    // NOVA PESQUISA COMEÇA NA PRIMEIRA PÁGINA
    paginaAtual = 1;

    buscarLivros();
});

// ==================================
// LIMPAR PESQUISA
// ==================================

btnLimpar.addEventListener("click", function () {

    tipoPesquisa.value = "titulo";

    valorPesquisa.type = "search";
    valorPesquisa.value = "";
    valorPesquisa.placeholder =
        "Pesquisar livro pelo título...";

    inputAnoFinal.value = "";
    campoAnoFinal.hidden = true;

    filtro = {
        tipo: "",
        valor: "",
        anoFinal: ""
    };

    paginaAtual = 1;

    mensagemResultado.textContent = "";

    buscarLivros();
});

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

        // ATUALIZAR A LISTAGEM COM O FILTRO ATUAL
        await buscarLivros();

        mensagemResultado.textContent =
            `Livro "${livro.titulo}" excluído com sucesso!`;

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

        livroSelecionado = null;
    }
});

// LIMPAR SELEÇÃO
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
        throw new Error(
            "Não foi possível excluir o livro."
        );
    }
}

// ==================================
// INICIALIZAÇÃO
// ==================================

buscarLivros();
