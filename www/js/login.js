window.LoginPage = function () {
  const form = document.getElementById("login-form");
  const btnGoogle = document.getElementById("btn-google");
  const resetLink = document.querySelector(".forgot-password");
  const feedback = document.getElementById("login-feedback");

  const showFeedback = (message, state = "error") => {
    if (!feedback) return;
    feedback.textContent = message;
    feedback.dataset.state = state;
    feedback.setAttribute("role", state === "error" ? "alert" : "status");
    feedback.setAttribute("aria-live", state === "error" ? "assertive" : "polite");
    feedback.hidden = false;
  };

  const clearFeedback = () => {
    if (!feedback) return;
    feedback.hidden = true;
    feedback.textContent = "";
    delete feedback.dataset.state;
  };

  for (const input of form?.querySelectorAll("input") || []) {
    input.addEventListener("input", clearFeedback);
  }

  if (btnGoogle) {
    btnGoogle.addEventListener("click", async () => {
      btnGoogle.disabled = true;
      try {
        await window.Backend.loginWithGoogle();
      } catch (error) {
        console.error(error);
        showFeedback(error.code === "auth/operation-not-allowed"
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
        showFeedback("Digite seu e-mail para receber o link de recuperação.");
        document.getElementById("email").focus();
        return;
      }
      if (!document.getElementById("email").checkValidity()) {
        showFeedback("Digite um endereço de e-mail válido.");
        document.getElementById("email").focus();
        return;
      }
      try {
        await window.Backend.resetPassword(email);
        showFeedback("Enviamos um link de redefinição para seu e-mail.", "success");
      } catch (error) {
        console.error(error);
        showFeedback("Não foi possível enviar o link. Confira o e-mail e tente novamente.");
      }
    });
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const button = form.querySelector(".auth-btn-primary");
      const original = button?.innerHTML || "Entrar";
      clearFeedback();

      if (!email) {
        showFeedback("Digite seu e-mail para entrar.");
        emailInput.focus();
        return;
      }
      if (!emailInput.checkValidity()) {
        showFeedback("Digite um endereço de e-mail válido.");
        emailInput.focus();
        return;
      }
      if (!password) {
        showFeedback("Digite sua senha para entrar.");
        passwordInput.focus();
        return;
      }

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
          "auth/invalid-email": "Digite um endereço de e-mail válido.",
          "auth/invalid-credential": "E-mail ou senha incorretos.",
          "auth/wrong-password": "E-mail ou senha incorretos.",
          "auth/user-disabled": "Esta conta está desativada. Fale com o suporte.",
          "auth/too-many-requests": "Muitas tentativas. Aguarde e tente novamente.",
          "auth/network-request-failed": "Sem conexão. Verifique sua internet e tente novamente.",
        };
        showFeedback(messages[error.code] || "Não foi possível entrar. Verifique sua conexão e os dados.");
        if (button) {
          button.disabled = false;
          button.innerHTML = original;
        }
      }
    });
  }
};
