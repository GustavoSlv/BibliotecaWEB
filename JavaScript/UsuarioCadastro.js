
const formCadastro = document.getElementById("form-cadastro");
const mensagemCadastro = document.getElementById("mensagem-cadastro");

formCadastro.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;

    // Validar confirmação da senha
    if (senha !== confirmarSenha) {
        mensagemCadastro.textContent = "As senhas não coincidem.";
        return;
    }

    const usuario = {
        email: email,
        password: senha
    };

    try {
        const resposta = await fetch("https://localhost:7002/api/Auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(usuario)
        });

        if (!resposta.ok) {
            if (resposta.status === 400) {
                throw new Error("Dados inválidos. Verifique o e-mail e a senha.");
            }

            throw new Error("Erro ao cadastrar usuário.");
        }

        mensagemCadastro.textContent = "Usuário cadastrado com sucesso!";
        mensagemCadastro.style.color = "green";

        formCadastro.reset();

        // Redirecionar para o login
        window.location.href = "UsuarioLogin.html";

    } catch (erro) {
        mensagemCadastro.textContent = erro.message;
        mensagemCadastro.style.color = "red";
        console.error(erro);
    }
});
