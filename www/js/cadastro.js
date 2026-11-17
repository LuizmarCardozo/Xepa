window.CadastroPage = function () {
  let selectedType = "cliente";

  // 1. Lógica dos novos cards de seleção (Step 1 -> Step 2)
  const options = document.querySelectorAll(".type-card");
  const step1 = document.getElementById("step-1");
  const step2 = document.getElementById("step-2");
  const formSubtitle = document.getElementById("form-subtitle");
  const formTitle = document.getElementById("cadastro-form-title");
  const submitButton = document.getElementById("cadastro-submit");
  const appContainer = document.querySelector(".cadastro-app");
  const documentInput = document.getElementById("document");
  const sellerRegistration = document.getElementById("seller-registration");
  const sellerForm = document.getElementById("seller-register-form");
  const sellerScreens = Array.from(
    document.querySelectorAll("[data-seller-screen]"),
  );
  const sellerCityInput = document.getElementById("seller-city");
  const sellerCityOptions = document.getElementById("seller-city-options");
  const sellerCityStatus = document.getElementById("seller-city-status");
  const sellerLocations = new Map();
  let sellerCitiesRequest = null;
  let sellerStep = 1;

  const loadSellerCities = () => {
    if (sellerLocations.size) return Promise.resolve();
    if (sellerCitiesRequest) return sellerCitiesRequest;

    sellerCityStatus.textContent = "Carregando cidades...";
    sellerCityInput.disabled = true;
    sellerCitiesRequest = fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome",
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`IBGE respondeu com status ${response.status}.`);
        }
        return response.json();
      })
      .then((municipalities) => {
        if (!Array.isArray(municipalities)) {
          throw new Error("A resposta do IBGE não contém uma lista de cidades.");
        }

        const options = document.createDocumentFragment();
        municipalities.forEach((municipality) => {
          const state = municipality.microrregiao?.mesorregiao?.UF?.sigla;
          if (!municipality.nome || !state) return;

          const label = `${municipality.nome} / ${state}`;
          sellerLocations.set(label, {
            city: municipality.nome,
            state,
          });
          const option = document.createElement("option");
          option.value = label;
          options.append(option);
        });

        if (!sellerLocations.size) {
          throw new Error("A resposta do IBGE não contém cidades válidas.");
        }

        sellerCityOptions.replaceChildren(options);
        sellerCityStatus.textContent = "Digite para buscar e selecione uma cidade.";
      })
      .catch((error) => {
        sellerLocations.clear();
        sellerCityStatus.textContent =
          "Não foi possível carregar as cidades. Toque no campo para tentar novamente.";
        console.error("Não foi possível carregar as cidades do IBGE:", error);
      })
      .finally(() => {
        sellerCityInput.disabled = false;
        sellerCitiesRequest = null;
      });

    return sellerCitiesRequest;
  };

  const showSellerStep = (step) => {
    sellerStep = step;
    sellerScreens.forEach((screen) => {
      screen.hidden = Number(screen.dataset.sellerScreen) !== step;
    });
    if (step === 3) void loadSellerCities();
    const activeScreen = sellerScreens.find(
      (screen) => Number(screen.dataset.sellerScreen) === step,
    );
    activeScreen?.querySelector(".seller-form-card")?.scrollTo(0, 0);
    sellerRegistration?.scrollTo(0, 0);
  };

  const updateDocumentField = () => {
    const isBuyer = selectedType === "cliente";
    if (!documentInput) return;

    documentInput.type = isBuyer ? "tel" : "text";
    documentInput.placeholder = isBuyer ? "Telefone" : "CPF ou CNPJ";
    documentInput.setAttribute(
      "aria-label",
      isBuyer ? "Telefone" : "CPF ou CNPJ",
    );
    documentInput.setAttribute("maxlength", isBuyer ? "11" : "14");
    documentInput.setAttribute("inputmode", isBuyer ? "tel" : "numeric");
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
      const isMerchant = selectedType === "comerciante";

      options.forEach((option) => {
        option.setAttribute("aria-pressed", String(option === this));
      });
      appContainer?.classList.toggle("cadastro-vendedor", isMerchant);
      if (step2) step2.dataset.accountType = selectedType;

      if (step1 && step2) {
        step1.style.display = "none";
        if (isMerchant) {
          step2.style.display = "none";
          if (sellerRegistration) sellerRegistration.hidden = false;
          showSellerStep(1);
          return;
        }

        if (sellerRegistration) sellerRegistration.hidden = true;
        step2.style.display = "flex";
        if (formTitle) formTitle.textContent = "Criar conta";
        if (submitButton) submitButton.textContent = "Criar conta";
        if (formSubtitle) {
          formSubtitle.textContent = "Você está se cadastrando como Comprador.";
        }
        updateDocumentField();
      }
    });
  });

  // 2. Lógica do botão Voltar
  const btnBack = document.getElementById("btn-back-step");
  if (btnBack) {
    btnBack.addEventListener("click", function () {
      if (step1 && step2) {
        if (sellerRegistration) sellerRegistration.hidden = true;
        step2.style.display = "none";
        step1.style.display = "flex";
        selectedType = "cliente";
        options.forEach((option) => option.setAttribute("aria-pressed", "false"));
        appContainer?.classList.remove("cadastro-vendedor");
        updateDocumentField();
      }
    });
  }

  sellerScreens.forEach((screen) => {
    const continueButton = screen.querySelector("[data-seller-continue]");
    const previousButton = screen.querySelector("[data-seller-previous]");
    const backButton = screen.querySelector("[data-seller-back]");

    continueButton?.addEventListener("click", () => {
      const fields = Array.from(
        screen.querySelectorAll("input[required], select[required]"),
      );
      const invalidField = fields.find((field) => !field.value.trim());
      if (invalidField) {
        invalidField.reportValidity();
        return;
      }

      if (sellerStep === 3 && sellerCityInput) {
        const location = sellerLocations.get(sellerCityInput.value.trim());
        if (!location) {
          sellerCityInput.setCustomValidity(
            "Selecione uma cidade e UF da lista de sugestões.",
          );
          sellerCityInput.reportValidity();
          sellerCityInput.setCustomValidity("");
          return;
        }
      }

      const cpfInput = document.getElementById("seller-responsible-cpf");
      if (sellerStep === 1 && cpfInput) {
        const digits = cpfInput.value.replace(/\D/g, "");
        if (digits.length !== 11) {
          cpfInput.setCustomValidity("Informe um CPF com 11 dígitos.");
          cpfInput.reportValidity();
          cpfInput.setCustomValidity("");
          return;
        }
      }

      if (sellerStep < 4) showSellerStep(sellerStep + 1);
    });

    previousButton?.addEventListener("click", () => {
      if (sellerStep > 1) showSellerStep(sellerStep - 1);
    });

    backButton?.addEventListener("click", () => {
      if (sellerRegistration) sellerRegistration.hidden = true;
      if (step1) step1.style.display = "flex";
      if (step2) step2.style.display = "none";
      selectedType = "cliente";
      options.forEach((option) => option.setAttribute("aria-pressed", "false"));
      appContainer?.classList.remove("cadastro-vendedor");
      updateDocumentField();
    });
  });

  sellerCityInput?.addEventListener("input", () => {
    sellerCityInput.setCustomValidity("");
    if (sellerLocations.has(sellerCityInput.value.trim())) {
      sellerCityStatus.textContent = "Cidade selecionada.";
    } else if (sellerLocations.size) {
      sellerCityStatus.textContent =
        "Digite para buscar e selecione uma cidade.";
    }
  });
  sellerCityInput?.addEventListener("focus", () => {
    if (!sellerLocations.size) void loadSellerCities();
  });

  const sellerCpfInput = document.getElementById("seller-responsible-cpf");
  sellerCpfInput?.addEventListener("input", () => {
    const digits = sellerCpfInput.value.replace(/\D/g, "").slice(0, 11);
    sellerCpfInput.value = digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  });

  document.querySelectorAll("[data-password-target]").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const input = document.getElementById(toggle.dataset.passwordTarget);
      if (!input) return;
      const shouldShow = input.type === "password";
      input.type = shouldShow ? "text" : "password";
      toggle.setAttribute("aria-label", shouldShow ? "Ocultar senha" : "Mostrar senha");
    });
  });

  if (sellerForm) {
    sellerForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const finalScreen = sellerScreens.find(
        (screen) => Number(screen.dataset.sellerScreen) === 4,
      );
      const incompleteField = Array.from(
        finalScreen?.querySelectorAll("input[required]") || [],
      ).find((field) => !field.value.trim() || !field.checkValidity());
      if (incompleteField) {
        incompleteField.reportValidity();
        return;
      }

      const name = document.getElementById("seller-full-name").value.trim();
      const stallName = document.getElementById("seller-stall-name").value.trim();
      const stallLocation = sellerLocations.get(sellerCityInput?.value.trim());
      const cpf = document
        .getElementById("seller-responsible-cpf")
        .value.replace(/\D/g, "");
      const contactInput = document.getElementById("seller-contact");
      const contact = contactInput.value.trim();
      const password = document.getElementById("seller-password").value;
      const passwordConfirm = document.getElementById(
        "seller-password-confirm",
      ).value;

      if (cpf.length !== 11) {
        showSellerStep(1);
        const cpfInput = document.getElementById("seller-responsible-cpf");
        cpfInput.setCustomValidity("Informe um CPF com 11 dígitos.");
        cpfInput.reportValidity();
        cpfInput.setCustomValidity("");
        return;
      }

      if (!stallLocation) {
        showSellerStep(3);
        sellerCityInput?.setCustomValidity(
          "Selecione uma cidade e UF da lista de sugestões.",
        );
        sellerCityInput?.reportValidity();
        sellerCityInput?.setCustomValidity("");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
        contactInput.setCustomValidity(
          "O cadastro atual precisa de um e-mail válido para criar o acesso.",
        );
        contactInput.reportValidity();
        contactInput.setCustomValidity("");
        return;
      }
      if (password !== passwordConfirm) {
        alert("As senhas não coincidem.");
        return;
      }

      const registerButton = document.getElementById("seller-register-submit");
      const registerButtonContent = registerButton?.innerHTML;
      if (registerButton) {
        registerButton.disabled = true;
        registerButton.textContent = "Concluindo cadastro...";
      }

      try {
        if (!window.Backend || !window.Backend.register) {
          throw new Error("Backend não inicializado");
        }
        await window.Backend.register(
          name,
          contact,
          password,
          "comerciante",
          cpf,
          stallName,
          stallLocation,
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
        if (registerButton) {
          registerButton.disabled = false;
          registerButton.innerHTML = registerButtonContent;
        }
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

window.CadastroPageInit = function () {
  const container = document.querySelector(".cadastro-app");
  const registration = document.getElementById("seller-registration");
  if (!container || !registration) return;

  // Preserve the Figma frame proportions on narrower phones. Short viewports
  // scroll the complete screen instead of squeezing the artwork and fields.
  const resize = () => {
    registration.style.setProperty("--seller-scale", container.clientWidth / 430);
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  return () => observer.disconnect();
};
