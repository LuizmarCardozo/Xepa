window.LoginPage = function () {
  const form = document.getElementById("login-form");
  const btnGoogle = document.getElementById("btn-google");
  const resetLink = document.querySelector(".forgot-password");

  if (btnGoogle) {
    btnGoogle.addEventListener("click", async () => {
      btnGoogle.disabled = true;
      try {
        await window.Backend.loginWithGoogle();
      } catch (error) {
        console.error(error);
        alert(error.code === "auth/operation-not-allowed"
          ? "Ative o provedor Google no Firebase Authentication para usar esta opção."
          : "Não foi possível entrar com Google. Tente entrar com e-mail e senha.");
      } finally {
        btnGoogle.disabled = false;
      }
    });
  }

  if (resetLink) {
    resetLink.addEventListener("click", async (event) => {
      event.preventDefault();
      const email = document.getElementById("email").value.trim();
      if (!email) {
        alert("Digite seu e-mail para receber o link de recuperação.");
        document.getElementById("email").focus();
        return;
      }
      try {
        await window.Backend.resetPassword(email);
        alert("Enviamos um link de redefinição para seu e-mail.");
      } catch (error) {
        console.error(error);
        alert("Não foi possível enviar o link. Confira o e-mail e tente novamente.");
      }
    });
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const button = form.querySelector(".auth-btn-primary");
      const original = button?.innerHTML || "Entrar";
      if (button) {
        button.disabled = true;
        button.textContent = "Entrando...";
      }
      try {
        await window.Backend.login(email, password);
        Router.go("home");
      } catch (error) {
        console.error(error);
        const messages = {
          "auth/user-not-found": "Não encontramos uma conta com esse e-mail.",
          "auth/invalid-credential": "E-mail ou senha incorretos.",
          "auth/wrong-password": "E-mail ou senha incorretos.",
          "auth/too-many-requests": "Muitas tentativas. Aguarde e tente novamente.",
        };
        alert(messages[error.code] || "Não foi possível entrar. Verifique sua conexão e os dados.");
        if (button) {
          button.disabled = false;
          button.innerHTML = original;
        }
      }
    });
  }
};
