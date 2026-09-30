window.CadastroPage = function () {
  let selectedType = "cliente";

  // 1. Lógica dos novos cards de seleção (Step 1 -> Step 2)
  const options = document.querySelectorAll(".type-card");
  const step1 = document.getElementById("step-1");
  const step2 = document.getElementById("step-2");
  const formSubtitle = document.getElementById("form-subtitle");
  const documentInput = document.getElementById("document");

  const updateDocumentField = () => {
    const isBuyer = selectedType === "cliente";
    if (!documentInput) return;

    documentInput.placeholder = isBuyer ? "Telefone" : "CPF ou CNPJ";
    documentInput.setAttribute(
      "aria-label",
      isBuyer ? "Telefone" : "CPF ou CNPJ",
    );
    documentInput.setAttribute("maxlength", isBuyer ? "11" : "14");
    documentInput.setAttribute("inputmode", "numeric");
  };

  updateDocumentField();

  if (documentInput) {
    documentInput.addEventListener("input", () => {
      documentInput.value = documentInput.value.replace(/\D/g, "");
    });
  }

  options.forEach((card) => {
    card.addEventListener("click", function () {
      selectedType = this.dataset.type; // Pega 'cliente' ou 'comerciante' do HTML

      // Muda o subtítulo sutilmente
      if (formSubtitle) {
        formSubtitle.innerText =
          selectedType === "cliente"
            ? "Você está se cadastrando como Comprador."
            : "Você está se cadastrando como Vendedor.";
      }
      if (documentInput) {
        updateDocumentField();
      }

      // Oculta Step 1 e exibe o formulário
      if (step1 && step2) {
        step1.style.display = "none";
        step2.style.display = "flex";
      }
    });
  });

  // 2. Lógica do botão Voltar
  const btnBack = document.getElementById("btn-back-step");
  if (btnBack) {
    btnBack.addEventListener("click", function () {
      if (step1 && step2) {
        step2.style.display = "none";
        step1.style.display = "flex";
      }
    });
  }

  // 3. Lógica original de envio do Formulário
  const form = document.getElementById("cad-form");
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const documentNumber = document.getElementById("document").value.trim();
      const password = document.getElementById("password").value;
      const passwordConfirm = document.getElementById("password-confirm").value;

      if (password !== passwordConfirm) {
        alert("As senhas não coincidem.");
        return;
      }

      const digits = documentNumber.replace(/\D/g, "");
      const isBuyer = selectedType === "cliente";
      const isValidDocument = isBuyer
        ? digits.length === 10 || digits.length === 11
        : digits.length === 11 || digits.length === 14;
      if (!isValidDocument) {
        alert(
          isBuyer
            ? "Informe um telefone válido com 10 ou 11 dígitos."
            : "Informe um CPF com 11 ou um CNPJ com 14 dígitos.",
        );
        return;
      }

      // Busca pelo botão com a classe btn-primary nova
      const btn = form.querySelector(".btn-primary");
      let textOriginal = "Criar conta";

      if (btn) {
        textOriginal = btn.innerHTML;
        btn.innerHTML = "Criando conta...";
        btn.disabled = true;
      }

      try {
        if (!window.Backend || !window.Backend.register) {
          alert("⚠️ Erro de conexão com o servidor!");
          throw new Error("Backend não inicializado");
        }

        // Dispara sua API normalmente
        await window.Backend.register(
          name,
          email,
          password,
          selectedType,
          digits,
        );
        Router.go("home");
      } catch (error) {
        console.error(error);
        if (error.code === "auth/email-already-in-use") {
          alert("Este e-mail já está cadastrado!");
        } else if (error.code === "auth/weak-password") {
          alert("A senha deve ter pelo menos 6 caracteres.");
        } else {
          alert("Erro ao criar conta. Tente novamente.");
        }

        if (btn) {
          btn.innerHTML = textOriginal;
          btn.disabled = false;
        }
      }
    });
  }
};
