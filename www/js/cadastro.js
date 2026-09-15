window.CadastroPage = function () {
  let selectedType = "cliente";
  const options = document.querySelectorAll(".account-option");

  // Controle dos botões de Cliente / Comerciante
  options.forEach((btn) => {
    btn.addEventListener("click", function () {
      options.forEach((b) => b.classList.remove("selected"));
      this.classList.add("selected");
      selectedType = this.dataset.type;
    });
  });

  const form = document.getElementById("cad-form");
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault(); // Impede a tela de piscar

      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      // CORREÇÃO: Procura o botão de forma mais abrangente e segura
      const btn =
        form.querySelector('button[type="submit"]') ||
        form.querySelector("button.btn-primary") ||
        form.querySelector("button");
      let textOriginal = "Criar conta";

      if (btn) {
        textOriginal = btn.innerHTML;
        btn.innerHTML = "Criando conta...";
        btn.disabled = true;
      }

      try {
        if (!window.Backend || !window.Backend.register) {
          alert(
            "⚠️ Erro de conexão: O Firebase não carregou! Certifique-se de estar usando o Live Server.",
          );
          throw new Error("Backend não inicializado");
        }

        await window.Backend.register(name, email, password, selectedType);
        Router.go("home");
      } catch (error) {
        console.error(error);
        if (error.code === "auth/email-already-in-use") {
          alert("Este e-mail já está cadastrado! Tente fazer login.");
        } else if (error.code === "auth/weak-password") {
          alert("A senha é muito fraca. Use pelo menos 6 caracteres.");
        } else {
          alert("Ocorreu um erro ao criar a conta. Tente novamente.");
        }

        // Restaura o botão se der erro
        if (btn) {
          btn.innerHTML = textOriginal;
          btn.disabled = false;
        }
      }
    });
  }
};
