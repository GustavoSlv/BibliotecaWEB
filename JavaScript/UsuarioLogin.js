
const formLogin = document.getElementById("form-login");
const mensagemLogin = document.getElementById("mensagem-login");

formLogin.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    const usuario = {
        email: email,
        password: senha
    };

    try {
        const resposta = await fetch("https://localhost:7002/api/Auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(usuario)
        });

        if (!resposta.ok) {
            if (resposta.status === 401) {
                throw new Error("E-mail ou senha inválidos.");
            }

            throw new Error("Não foi possível realizar o login.");
        }

        const dados = await resposta.json();

        sessionStorage.setItem("token", dados.token);
        sessionStorage.setItem("expiresAt", dados.expiresAt);

        window.location.href = "LivroGet.html";

        mensagemLogin.textContent = "Login realizado com sucesso!";
        console.log("Login realizado com sucesso.");

        // Na próxima etapa, vamos trabalhar com o JWT
        // retornado pela API.

    } catch (erro) {
        mensagemLogin.textContent = erro.message;
        console.error(erro);
    }
});
