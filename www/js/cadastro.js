const VALID_BRAZILIAN_DDDS = new Set([
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "21", "22", "24",
  "27", "28", "31", "32", "33", "34", "35", "37", "38", "41", "42", "43",
  "44", "45", "46", "47", "48", "49", "51", "53", "54", "55", "61", "62",
  "63", "64", "65", "66", "67", "68", "69", "71", "73", "74", "75", "77",
  "79", "81", "82", "83", "84", "85", "86", "87", "88", "89", "91", "92",
  "93", "94", "95", "96", "97", "98", "99",
]);

function validateFullName(value) {
  const name = String(value).trim();
  if (!name) return { valid: false, message: "Informe seu nome completo." };
  if (
    !/^[\p{L}][\p{L}\s.'’-]*$/u.test(name) ||
    (name.match(/\p{L}/gu) || []).length < 2
  ) {
    return {
      valid: false,
      message: "Use pelo menos 2 letras, sem números ou símbolos.",
    };
  }
  return { valid: true, message: "Nome válido." };
}

function validateRequiredText(value, label) {
  const text = String(value).trim();
  if (!text) return { valid: false, message: `Informe ${label}.` };
  if (text.length < 2) {
    return { valid: false, message: "Digite pelo menos 2 caracteres." };
  }
  return { valid: true, message: "Informação válida." };
}

function validateEmail(value) {
  const email = String(value).trim();
  if (!email) return { valid: false, message: "Informe seu e-mail." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { valid: false, message: "Digite um e-mail válido." };
  }
  return { valid: true, message: "E-mail válido." };
}

function validateBrazilianPhone(value) {
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return { valid: false, message: "Informe seu telefone com DDD." };
  if (digits.length !== 10 && digits.length !== 11) {
    return {
      valid: false,
      message: "Digite o DDD e o telefone (10 ou 11 números).",
    };
  }

  const ddd = digits.slice(0, 2);
  if (!VALID_BRAZILIAN_DDDS.has(ddd)) {
    return { valid: false, message: "Confira o DDD informado." };
  }

  const subscriber = digits.slice(2);
  const validNumber =
    (subscriber.length === 8 && /^[2-5]\d{7}$/.test(subscriber)) ||
    (subscriber.length === 9 && /^9\d{8}$/.test(subscriber));
  if (!validNumber) {
    return { valid: false, message: "Confira o número após o DDD." };
  }
  return { valid: true, message: "Telefone válido." };
}

function validateCpf(value) {
  const digits = String(value).replace(/\D/g, "");
  if (digits.length !== 11) {
    return { valid: false, message: "Informe os 11 dígitos do CPF." };
  }
  if (/^(\d)\1{10}$/.test(digits)) {
    return { valid: false, message: "Este CPF não é válido." };
  }

  const calculateDigit = (length) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      sum += Number(digits[index]) * (length + 1 - index);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  if (
    calculateDigit(9) !== Number(digits[9]) ||
    calculateDigit(10) !== Number(digits[10])
  ) {
    return { valid: false, message: "Confira os números do CPF." };
  }
  return { valid: true, message: "CPF válido." };
}

function attachLiveValidation(input, feedback, validator) {
  if (!input) return { validate: () => true, refresh: () => true };

  const wrapper = input.closest(".seller-input-wrap, .input-group");
  let touched = false;

  const update = (force = false) => {
    if (force) touched = true;
    const result = validator(input.value);
    const shouldShow = touched || input.value.trim().length > 0;

    if (!shouldShow) {
      input.setCustomValidity("");
      input.removeAttribute("aria-invalid");
      feedback?.replaceChildren();
      feedback?.removeAttribute("data-state");
      wrapper?.classList.remove("has-error", "has-valid");
      return result.valid;
    }

    input.setCustomValidity(result.valid ? "" : result.message);
    input.setAttribute("aria-invalid", String(!result.valid));
    if (feedback) {
      feedback.textContent = result.valid
        ? `✓ ${result.message}`
        : result.message;
      feedback.dataset.state = result.valid ? "valid" : "invalid";
    }
    wrapper?.classList.toggle("has-error", !result.valid);
    wrapper?.classList.toggle("has-valid", result.valid);
    return result.valid;
  };

  input.addEventListener("input", () => update(true));
  input.addEventListener("change", () => update(true));
  input.addEventListener("blur", () => update(true));

  return {
    validate: () => update(true),
    refresh: () => update(),
  };
}

window.CadastroPage = function () {
  let selectedType = "cliente";
  let googleUser = null;

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
  const fieldValidations = new Map();
  let sellerCitiesRequest = null;
  let sellerCityValidation = null;
  let sellerStep = 1;

  const registerValidation = (input, validator, feedbackId) => {
    const feedback = document.getElementById(feedbackId);
    const validation = attachLiveValidation(input, feedback, validator);
    fieldValidations.set(input, validation);
    return validation;
  };

  const validateField = (field) => {
    const validation = fieldValidations.get(field);
    return validation ? validation.validate() : field.checkValidity();
  };

  const setSellerCityStatus = (message, state = "neutral") => {
    if (!sellerCityStatus) return;
    sellerCityStatus.textContent = message;
    sellerCityStatus.dataset.state = state;
  };

  const loadSellerCities = () => {
    if (sellerLocations.size) return Promise.resolve();
    if (sellerCitiesRequest) return sellerCitiesRequest;

    setSellerCityStatus("Carregando cidades...");
    if (sellerCityInput) sellerCityInput.disabled = true;
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
        if (sellerCityInput?.value.trim()) {
          sellerCityValidation?.refresh();
        } else {
          setSellerCityStatus("Digite e selecione uma cidade / UF da lista.");
        }
      })
      .catch((error) => {
        sellerLocations.clear();
        sellerCityValidation?.refresh();
        if (!sellerCityInput?.value.trim()) {
          setSellerCityStatus(
            "Falha ao carregar cidades. Toque no campo para tentar novamente.",
          );
        }
        console.error("Não foi possível carregar as cidades do IBGE:", error);
      })
      .finally(() => {
        if (sellerCityInput) sellerCityInput.disabled = false;
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
    documentInput.placeholder = isBuyer ? "Telefone" : "CPF";
    documentInput.setAttribute("aria-label", isBuyer ? "Telefone" : "CPF");
    documentInput.setAttribute("maxlength", isBuyer ? "11" : "14");
    documentInput.setAttribute("inputmode", isBuyer ? "tel" : "numeric");
  };

  const buyerNameInput = document.getElementById("name");
  const buyerEmailInput = document.getElementById("email");
  const buyerPasswordInput = document.getElementById("password");
  const buyerPasswordConfirmInput = document.getElementById("password-confirm");
  const sellerFullNameInput = document.getElementById("seller-full-name");
  const sellerCpfInput = document.getElementById("seller-responsible-cpf");
  const sellerStallNameInput = document.getElementById("seller-stall-name");
  const sellerProductsInput = document.getElementById("seller-products");
  const sellerMarketNameInput = document.getElementById("seller-market-name");
  const sellerReferenceInput = document.getElementById("seller-reference");
  const sellerContactInput = document.getElementById("seller-contact");
  const sellerPasswordInput = document.getElementById("seller-password");
  const sellerPasswordConfirmInput = document.getElementById(
    "seller-password-confirm",
  );

  updateDocumentField();

  documentInput?.addEventListener("input", () => {
    documentInput.value = documentInput.value.replace(/\D/g, "");
  });

  sellerCpfInput?.addEventListener("input", () => {
    const digits = sellerCpfInput.value.replace(/\D/g, "").slice(0, 11);
    sellerCpfInput.value = digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  });

  registerValidation(buyerNameInput, validateFullName, "name-feedback");
  registerValidation(buyerEmailInput, validateEmail, "email-feedback");
  registerValidation(
    documentInput,
    (value) =>
      selectedType === "cliente"
        ? validateBrazilianPhone(value)
        : validateCpf(value),
    "document-feedback",
  );
  registerValidation(
    buyerPasswordInput,
    (value) => {
      if (!value) {
        return {
          valid: false,
          message: "Crie uma senha com pelo menos 6 caracteres.",
        };
      }
      if (value.length < 6) {
        return {
          valid: false,
          message: "A senha precisa ter pelo menos 6 caracteres.",
        };
      }
      return { valid: true, message: "Senha válida." };
    },
    "password-feedback",
  );
  const buyerPasswordConfirmValidation = registerValidation(
    buyerPasswordConfirmInput,
    (value) => {
      if (!value) {
        return { valid: false, message: "Confirme sua senha." };
      }
      if (value !== buyerPasswordInput.value) {
        return { valid: false, message: "As senhas ainda não coincidem." };
      }
      return { valid: true, message: "As senhas coincidem." };
    },
    "password-confirm-feedback",
  );
  registerValidation(
    sellerFullNameInput,
    validateFullName,
    "seller-full-name-feedback",
  );
  registerValidation(
    sellerCpfInput,
    validateCpf,
    "seller-responsible-cpf-feedback",
  );
  registerValidation(
    sellerStallNameInput,
    (value) => validateRequiredText(value, "o nome da banca"),
    "seller-stall-name-feedback",
  );
  registerValidation(
    sellerProductsInput,
    (value) =>
      [
        "Hortifruti",
        "Laticínios",
        "Carnes",
        "Padaria",
        "Artesanais",
        "Outros",
      ].includes(value)
        ? { valid: true, message: "Categoria selecionada." }
        : { valid: false, message: "Selecione o que sua banca vende." },
    "seller-products-feedback",
  );
  sellerCityValidation = registerValidation(
    sellerCityInput,
    (value) => {
      const location = String(value).trim();
      if (!location) {
        return { valid: false, message: "Informe a cidade e o estado." };
      }
      if (!sellerLocations.size) {
        return {
          valid: false,
          message: "Lista indisponível. Toque no campo para tentar novamente.",
        };
      }
      if (!sellerLocations.has(location)) {
        return {
          valid: false,
          message: "Escolha uma cidade / UF da lista.",
        };
      }
      return { valid: true, message: "Cidade / UF válida." };
    },
    "seller-city-status",
  );
  registerValidation(
    sellerMarketNameInput,
    (value) => validateRequiredText(value, "o nome da feira"),
    "seller-market-name-feedback",
  );
  registerValidation(
    sellerReferenceInput,
    (value) => {
      const reference = String(value).trim();
      if (!reference) return { valid: true, message: "Campo opcional." };
      if (reference.length > 200) {
        return { valid: false, message: "Use até 200 caracteres." };
      }
      return { valid: true, message: "Referência válida." };
    },
    "seller-reference-feedback",
  );
  registerValidation(
    sellerContactInput,
    validateEmail,
    "seller-contact-feedback",
  );
  registerValidation(
    sellerPasswordInput,
    (value) => {
      if (!value) {
        return {
          valid: false,
          message: "Crie uma senha com pelo menos 6 caracteres.",
        };
      }
      if (value.length < 6) {
        return {
          valid: false,
          message: "A senha precisa ter pelo menos 6 caracteres.",
        };
      }
      return { valid: true, message: "Senha válida." };
    },
    "seller-password-feedback",
  );
  const sellerPasswordConfirmValidation = registerValidation(
    sellerPasswordConfirmInput,
    (value) => {
      if (!value) {
        return { valid: false, message: "Confirme sua senha." };
      }
      if (value !== sellerPasswordInput.value) {
        return { valid: false, message: "As senhas ainda não coincidem." };
      }
      return { valid: true, message: "As senhas coincidem." };
    },
    "seller-password-confirm-feedback",
  );

  buyerPasswordInput?.addEventListener("input", () =>
    buyerPasswordConfirmValidation.refresh(),
  );
  sellerPasswordInput?.addEventListener("input", () =>
    sellerPasswordConfirmValidation.refresh(),
  );

  const applyGoogleAccount = (user, type) => {
    googleUser = user;
    selectedType = type;
    const name = user.displayName || user.name || "";
    const email = user.email || "";

    if (type === "cliente") {
      if (buyerNameInput) {
        buyerNameInput.value = name;
        buyerNameInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
      if (buyerEmailInput) {
        buyerEmailInput.value = email;
        buyerEmailInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
      buyerPasswordInput.closest(".input-group")?.remove();
      buyerPasswordConfirmInput.closest(".input-group")?.remove();
      document
        .getElementById("password-feedback")
        ?.remove();
      document
        .getElementById("password-confirm-feedback")
        ?.remove();
    } else {
      if (sellerFullNameInput) {
        sellerFullNameInput.value = name;
        sellerFullNameInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
      if (sellerContactInput) {
        sellerContactInput.value = email;
        sellerContactInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
      sellerPasswordInput.closest(".seller-field")?.remove();
      sellerPasswordConfirmInput.closest(".seller-field")?.remove();
    }
  };

  const pendingGoogleType = sessionStorage.getItem(
    "xepa-google-registration-type",
  );
  
  // Wait for auth to be ready before checking for pending Google registration
  const initGoogleRegistration = async () => {
    if (!pendingGoogleType) return;
    
    try {
      await window.Backend.ready(); // Wait for auth state to be fully restored
      if (window.Auth?.user) {
        applyGoogleAccount(window.Auth.user, pendingGoogleType);
        options.forEach((option) => {
          option.setAttribute(
            "aria-pressed",
            String(option.dataset.type === pendingGoogleType),
          );
        });
        appContainer?.classList.toggle(
          "cadastro-vendedor",
          pendingGoogleType === "comerciante",
        );
        appContainer?.classList.toggle(
          "cadastro-comprador",
          pendingGoogleType === "cliente",
        );
        if (step1) step1.style.display = "none";
        if (pendingGoogleType === "comerciante") {
          if (step2) step2.style.display = "none";
          if (sellerRegistration) sellerRegistration.hidden = false;
          showSellerStep(1);
        } else {
          if (sellerRegistration) sellerRegistration.hidden = true;
          if (step2) step2.style.display = "flex";
          if (formSubtitle) {
            formSubtitle.textContent =
              "Conta Google conectada. Complete seu telefone.";
          }
          updateDocumentField();
        }
      }
    } catch (error) {
      console.error("Erro ao restaurar registro Google:", error);
    }
  };
  
  initGoogleRegistration();

  document
    .getElementById("cadastro-google")
    ?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      button.textContent = "Conectando com Google...";
      try {
        const user = await window.Backend.registerWithGoogle("cliente");
        applyGoogleAccount(user, "cliente");
        button.innerHTML = "✓ Conta Google conectada";
      } catch (error) {
        console.error(error);
        button.disabled = false;
        button.innerHTML = "Criar conta com Google";
        alert(
          error.code === "auth/operation-not-allowed"
            ? "Ative o provedor Google no Firebase Authentication."
            : "Não foi possível conectar com o Google. Tente novamente.",
        );
      }
    });

  document
    .getElementById("seller-cadastro-google")
    ?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      button.textContent = "Conectando com Google...";
      try {
        const user = await window.Backend.registerWithGoogle("comerciante");
        applyGoogleAccount(user, "comerciante");
        button.innerHTML = "✓ Conta Google conectada";
      } catch (error) {
        console.error(error);
        button.disabled = false;
        button.innerHTML = "Criar conta com Google";
        alert(
          error.code === "auth/operation-not-allowed"
            ? "Ative o provedor Google no Firebase Authentication."
            : "Não foi possível conectar com o Google. Tente novamente.",
        );
      }
    });

  options.forEach((card) => {
    card.addEventListener("click", function () {
      selectedType = this.dataset.type;
      const isMerchant = selectedType === "comerciante";

      options.forEach((option) => {
        option.setAttribute("aria-pressed", String(option === this));
      });
      appContainer?.classList.toggle("cadastro-vendedor", isMerchant);
      appContainer?.classList.toggle("cadastro-comprador", !isMerchant);
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

  const returnToAccountType = () => {
    if (sellerRegistration) sellerRegistration.hidden = true;
    if (step2) step2.style.display = "none";
    if (step1) step1.style.display = "flex";
    selectedType = "cliente";
    options.forEach((option) => option.setAttribute("aria-pressed", "false"));
    appContainer?.classList.remove("cadastro-vendedor", "cadastro-comprador");
    updateDocumentField();
  };

  document
    .getElementById("btn-back-step")
    ?.addEventListener("click", returnToAccountType);

  sellerScreens.forEach((screen) => {
    const continueButton = screen.querySelector("[data-seller-continue]");
    const previousButton = screen.querySelector("[data-seller-previous]");
    const backButton = screen.querySelector("[data-seller-back]");

    continueButton?.addEventListener("click", () => {
      const fields = Array.from(screen.querySelectorAll("input, select"));
      const results = fields.map((field) => ({
        field,
        valid: validateField(field),
      }));
      const invalidField = results.find((result) => !result.valid)?.field;
      if (invalidField) {
        invalidField.focus();
        return;
      }
      if (sellerStep < 4) showSellerStep(sellerStep + 1);
    });

    previousButton?.addEventListener("click", () => {
      if (sellerStep > 1) showSellerStep(sellerStep - 1);
    });

    backButton?.addEventListener("click", returnToAccountType);
  });

  sellerCityInput?.addEventListener("focus", () => {
    if (!sellerLocations.size) void loadSellerCities();
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

      const sellerFields = Array.from(
        sellerForm.querySelectorAll("input, select"),
      ).filter(
        (field) =>
          !googleUser ||
          !["seller-password", "seller-password-confirm"].includes(field.id),
      );
      const results = sellerFields.map((field) => ({
        field,
        valid: validateField(field),
      }));
      const invalidField = results.find((result) => !result.valid)?.field;
      if (invalidField) {
        const invalidScreen = invalidField.closest("[data-seller-screen]");
        if (invalidScreen) {
          showSellerStep(Number(invalidScreen.dataset.sellerScreen));
        }
        invalidField.focus();
        return;
      }

      const name = sellerFullNameInput.value.trim();
      const stallName = sellerStallNameInput.value.trim();
      const selectedLocation = sellerLocations.get(sellerCityInput.value.trim());
      const marketName = sellerMarketNameInput.value.trim();
      const reference = sellerReferenceInput.value.trim();
      const cpf = sellerCpfInput.value.replace(/\D/g, "");
      const contact = sellerContactInput.value.trim();
      const password = sellerPasswordInput.value;
      const stallLocation = {
        ...selectedLocation,
        marketName,
        reference,
      };

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
        if (googleUser) {
          await window.Backend.updateProfile({
            name,
            email: contact,
            document: cpf,
            type: "comerciante",
            stallName,
            stallLocation,
          });
          await window.Backend.updateSellerProfile({
            stallName,
            stallLocation,
          });
        } else {
          await window.Backend.register(
            name,
            contact,
            password,
            "comerciante",
            cpf,
            stallName,
            stallLocation,
          );
        }
        sessionStorage.removeItem("xepa-google-registration-type");
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

  const form = document.getElementById("cad-form");
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const buyerFields = [
        buyerNameInput,
        buyerEmailInput,
        documentInput,
        ...(googleUser ? [] : [buyerPasswordInput, buyerPasswordConfirmInput]),
      ];
      const results = buyerFields.map((field) => ({
        field,
        valid: field ? validateField(field) : true,
      }));
      const invalidField = results.find((result) => !result.valid)?.field;
      if (invalidField) {
        invalidField.focus();
        return;
      }

      const name = buyerNameInput.value.trim();
      const email = buyerEmailInput.value.trim();
      const digits = documentInput.value.replace(/\D/g, "");
      const password = buyerPasswordInput?.value || "";

      const button = form.querySelector(".btn-primary");
      const originalContent = button?.innerHTML;
      if (button) {
        button.textContent = "Criando conta...";
        button.disabled = true;
      }

      try {
        if (!window.Backend || !window.Backend.register) {
          throw new Error("Backend não inicializado");
        }
        if (googleUser) {
          await window.Backend.updateProfile({
            name,
            email,
            document: digits,
            type: "cliente",
          });
        } else {
          await window.Backend.register(
            name,
            email,
            password,
            selectedType,
            digits,
          );
        }
        sessionStorage.removeItem("xepa-google-registration-type");
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

        if (button) {
          button.innerHTML = originalContent;
          button.disabled = false;
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
