window.LoginPage = function () {
  const form = document.getElementById("login-form");
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      // CORREÇÃO do Botão
      const btn =
        form.querySelector('button[type="submit"]') ||
        form.querySelector("button.btn-primary") ||
        form.querySelector("button");
      let textOriginal = "Entrar";

      if (btn) {
        textOriginal = btn.innerHTML;
        btn.innerHTML = "Entrando...";
        btn.disabled = true;
      }

      try {
        if (!window.Backend || !window.Backend.login) {
          alert("⚠️ Erro de conexão: O Firebase não carregou!");
          throw new Error("Backend não inicializado");
        }

        await window.Backend.login(email, password);
        Router.go("home");
      } catch (error) {
        console.error(error);
        alert("E-mail ou senha incorretos.");
        if (btn) {
          btn.innerHTML = textOriginal;
          btn.disabled = false;
        }
      }
    });
  }
};
