
const apiUrl = "https://localhost:7002/api/Autores";

const formAutor = document.getElementById("form-autor");
const mensagemAutor = document.getElementById("mensagem-autor");

const parametros = new URLSearchParams(window.location.search);
const autorId = parametros.get("id");

// CARREGAR AUTOR PARA EDIÇÃO
async function carregarAutor() {

    if (!autorId) return;

    try {
        const resposta = await fetch(`${apiUrl}/${autorId}`);

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar o autor.");
        }

        const autor = await resposta.json();

        // Exibir ID e nome do autor
        document.getElementById("campo-id").hidden = false;
        document.getElementById("autorId").value = autor.id;
        document.getElementById("nomeAutor").value = autor.nome;

        // Alterar título e botão
        document.getElementById("titulo-form-autor").textContent =
            "Alterar Autor";

        document.getElementById("btn-salvar-autor").textContent =
            "Salvar Alterações";

    } catch (erro) {
        console.error(erro);

        mensagemAutor.textContent = erro.message;
        mensagemAutor.style.color = "red";

        document.getElementById("btn-salvar-autor").disabled = true;
    }
}

// CADASTRAR OU ALTERAR AUTOR
formAutor.addEventListener("submit", async function (event) {
    event.preventDefault();

    const nome = document.getElementById("nomeAutor").value.trim();

    const token = sessionStorage.getItem("token");
    const expiresAt = sessionStorage.getItem("expiresAt");

    mensagemAutor.textContent = "";

    if (!nome) {
        mensagemAutor.textContent = "Informe o nome do autor.";
        mensagemAutor.style.color = "red";
        return;
    }

    // VALIDAR SESSÃO
    if (!token || !expiresAt || Date.now() >= Date.parse(expiresAt)) {

        mensagemAutor.textContent =
            "Sua sessão expirou. Faça login novamente.";

        mensagemAutor.style.color = "red";

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("expiresAt");

        return;
    }

    const autor = {
        nome: nome
    };

    // DEFINIR POST OU PUT
    const url = autorId
        ? `${apiUrl}/${autorId}`
        : apiUrl;

    const metodo = autorId ? "PUT" : "POST";

    const btnSalvar = document.getElementById("btn-salvar-autor");
    btnSalvar.disabled = true;

    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(autor)
        });

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
            throw new Error("Autor não encontrado.");
        }

        if (!resposta.ok) {
            throw new Error(
                autorId
                    ? "Não foi possível alterar o autor."
                    : "Não foi possível cadastrar o autor."
            );
        }

        mensagemAutor.textContent = autorId
            ? `Autor ${autor.nome} alterado com sucesso!`
            : `Autor ${autor.nome} cadastrado com sucesso!`;

        mensagemAutor.style.color = "green";

        // Retornar à listagem
        window.location.href = "AutorGet.html";

    } catch (erro) {
        console.error(erro);

        mensagemAutor.textContent = erro.message;
        mensagemAutor.style.color = "red";

    } finally {
        btnSalvar.disabled = false;
    }
});

// VERIFICAR SE É EDIÇÃO AO ABRIR A PÁGINA
carregarAutor();
