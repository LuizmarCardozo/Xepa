window.LoginPage = function () {
  const form = document.getElementById("login-form");
  const btnGoogle = document.getElementById("btn-google");

  if (btnGoogle) {
    btnGoogle.addEventListener("click", () => {
      alert(
        "A integração com o Google será configurada via Firebase em breve!",
      );
    });
  }

  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      const btn = form.querySelector(".auth-btn-primary");
      let textOriginal = "Entrar";

      if (btn) {
        textOriginal = btn.innerHTML;
        btn.innerHTML = "Entrando...";
        btn.disabled = true;
      }

      try {
        if (!window.Backend || !window.Backend.login) {
          alert("⚠️ Erro de conexão com o servidor!");
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
