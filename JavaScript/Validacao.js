// Funções compartilhadas pelos formulários de autores e livros.
function criarValidacao(formulario, mensagemGeral, mapaCampos) {
    const campos = Object.values(mapaCampos);

    function limpar() {
        campos.forEach(id => {
            const campo = document.getElementById(id);
            const erro = document.getElementById(`erro-${id}`);
            if (campo) {
                campo.classList.remove('input-invalido');
                campo.removeAttribute('aria-invalid');
            }
            if (erro) erro.textContent = '';
        });
        mensagemGeral.textContent = '';
    }

    function mostrar(campoId, texto) {
        const campo = document.getElementById(campoId);
        const erro = document.getElementById(`erro-${campoId}`);
        if (!campo || !erro) return false;
        campo.classList.add('input-invalido');
        campo.setAttribute('aria-invalid', 'true');
        erro.textContent = texto;
        return true;
    }

    function geral(texto) {
        mensagemGeral.textContent = texto;
        mensagemGeral.style.color = '#dc2626';
    }

    async function mostrarErroApi(resposta) {
        let conteudo;
        const texto = await resposta.text();
        try { conteudo = JSON.parse(texto); } catch { conteudo = texto; }

        if (conteudo && typeof conteudo === 'object' && conteudo.errors) {
            let primeiroCampo = null;
            const outrasMensagens = [];
            for (const [propriedade, mensagens] of Object.entries(conteudo.errors)) {
                const chave = propriedade.split('.').pop().toLowerCase();
                const id = mapaCampos[chave];
                const mensagem = (Array.isArray(mensagens) ? mensagens : [mensagens])
                    .filter(Boolean).join(' ');
                if (id && mostrar(id, mensagem)) {
                    primeiroCampo ??= document.getElementById(id);
                } else if (mensagem) {
                    outrasMensagens.push(mensagem);
                }
            }
            if (outrasMensagens.length) geral(outrasMensagens.join(' '));
            if (primeiroCampo) primeiroCampo.focus();
            if (primeiroCampo || outrasMensagens.length) return;
        }

        // Respostas de regras de negócio podem ter outros formatos.
        if (typeof conteudo === 'string' && conteudo.trim()) {
            geral(conteudo);
        } else if (conteudo && typeof conteudo === 'object') {
            const msg = conteudo.mensagem || conteudo.message || conteudo.detail;
            geral(msg || 'Não foi possível salvar. Confira os dados informados.');
        } else {
            geral('Não foi possível salvar. Confira os dados informados.');
        }
    }

    // Remove o erro de um campo enquanto o usuário o corrige.
    campos.forEach(id => {
        const campo = document.getElementById(id);
        if (!campo) return;
        const removerErro = () => {
            campo.classList.remove('input-invalido');
            campo.removeAttribute('aria-invalid');
            const erro = document.getElementById(`erro-${id}`);
            if (erro) erro.textContent = '';
        };
        campo.addEventListener('input', removerErro);
        campo.addEventListener('change', removerErro);
    });

    return { limpar, mostrar, geral, mostrarErroApi };
}
