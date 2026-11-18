function sair() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("expiresAt");
    window.location.href = "UsuarioLogin.html";
}