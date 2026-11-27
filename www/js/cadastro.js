// Controla as etapas e validações do cadastro de comprador e vendedor.
const VALID_BRAZILIAN_DDDS = new Set([
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "21",
  "22",
  "24",
  "27",
  "28",
  "31",
  "32",
  "33",
  "34",
  "35",
  "37",
  "38",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
  "47",
  "48",
  "49",
  "51",
  "53",
  "54",
  "55",
  "61",
  "62",
  "63",
  "64",
  "65",
  "66",
  "67",
  "68",
  "69",
  "71",
  "73",
  "74",
  "75",
  "77",
  "79",
  "81",
  "82",
  "83",
  "84",
  "85",
  "86",
  "87",
  "88",
  "89",
  "91",
  "92",
  "93",
  "94",
  "95",
  "96",
  "97",
  "98",
  "99",
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
  if (!digits)
    return { valid: false, message: "Informe seu telefone com DDD." };
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

// Verifica o formato e os dígitos verificadores; não consulta a titularidade do CPF.
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
  let sellerCityActiveIndex = -1;
  let sellerCityRenderedLabels = [];

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
          throw new Error(
            "A resposta do IBGE não contém uma lista de cidades.",
          );
        }

        municipalities.forEach((municipality) => {
          const state = municipality.microrregiao?.mesorregiao?.UF?.sigla;
          if (!municipality.nome || !state) return;

          const label = `${municipality.nome} / ${state}`;
          sellerLocations.set(label, {
            city: municipality.nome,
            state,
          });
        });

        if (!sellerLocations.size) {
          throw new Error("A resposta do IBGE não contém cidades válidas.");
        }

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
        sellerCitiesRequest = null;
      });

    return sellerCitiesRequest;
  };

  const normalizeCitySearch = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const closeSellerCityOptions = () => {
    if (!sellerCityOptions) return;
    sellerCityOptions.hidden = true;
    sellerCityOptions.replaceChildren();
    sellerCityOptions.closest(".seller-field")?.classList.remove("city-options-open");
    sellerCityInput?.setAttribute("aria-expanded", "false");
    sellerCityActiveIndex = -1;
    sellerCityRenderedLabels = [];
  };

  const selectSellerCity = (label) => {
    if (!sellerCityInput || !sellerLocations.has(label)) return;
    sellerCityInput.value = label;
    sellerCityValidation?.refresh();
    closeSellerCityOptions();
    sellerCityInput.focus();
  };

  const renderSellerCityOptions = () => {
    if (!sellerCityInput || !sellerCityOptions) return;

    if (!sellerLocations.size) {
      closeSellerCityOptions();
      void loadSellerCities();
      return;
    }

    const query = normalizeCitySearch(sellerCityInput.value);
    const matches = [];

    for (const label of sellerLocations.keys()) {
      if (!query || normalizeCitySearch(label).includes(query)) {
        matches.push(label);
        if (matches.length >= 60) break;
      }
    }

    sellerCityOptions.replaceChildren();
    sellerCityRenderedLabels = matches;
    sellerCityActiveIndex = -1;
    sellerCityOptions.closest(".seller-field")?.classList.add("city-options-open");
    sellerCityInput.setAttribute("aria-expanded", "true");

    if (!matches.length) {
      const empty = document.createElement("div");
      empty.className = "seller-city-option-empty";
      empty.textContent = "Nenhuma cidade encontrada";
      sellerCityOptions.append(empty);
      sellerCityOptions.hidden = false;
      return;
    }

    matches.forEach((label, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "seller-city-option";
      button.setAttribute("role", "option");
      button.dataset.cityIndex = String(index);
      button.textContent = label;
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        selectSellerCity(label);
      });
      button.addEventListener("click", () => selectSellerCity(label));
      sellerCityOptions.append(button);
    });

    sellerCityOptions.hidden = false;
  };

  if (sellerCityInput) {
    sellerCityInput.addEventListener("focus", () => {
      void loadSellerCities().finally(() => renderSellerCityOptions());
    });
    sellerCityInput.addEventListener("input", () => {
      sellerCityValidation?.refresh();
      renderSellerCityOptions();
    });
    sellerCityInput.addEventListener("click", renderSellerCityOptions);
    sellerCityInput.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        renderSellerCityOptions();
        const buttons = Array.from(
          sellerCityOptions?.querySelectorAll(".seller-city-option") || [],
        );
        if (!buttons.length) return;
        const direction = event.key === "ArrowDown" ? 1 : -1;
        sellerCityActiveIndex =
          (sellerCityActiveIndex + direction + buttons.length) %
          buttons.length;
        buttons.forEach((button, index) => {
          button.classList.toggle(
            "is-active",
            index === sellerCityActiveIndex,
          );
        });
        buttons[sellerCityActiveIndex]?.scrollIntoView({ block: "nearest" });
        return;
      }
      if (event.key === "Enter" && sellerCityActiveIndex >= 0) {
        event.preventDefault();
        const label =
          sellerCityRenderedLabels[sellerCityActiveIndex];
        if (label) selectSellerCity(label);
        return;
      }
      if (event.key === "Escape") closeSellerCityOptions();
    });
  }

  document.addEventListener("pointerdown", (event) => {
    if (
      sellerCityOptions &&
      !sellerCityOptions.hidden &&
      !sellerCityInput?.contains(event.target) &&
      !sellerCityOptions.contains(event.target)
    ) {
      closeSellerCityOptions();
    }
  });

  const showSellerStep = (step) => {
    sellerStep = step;
    closeSellerCityOptions();
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
  const buyerGoogleButton = document.getElementById("buyer-google-signup");
  const sellerGoogleButton = document.getElementById("seller-google-signup");
  const sellerGoogleStartButton = document.getElementById(
    "seller-google-start",
  );
  // true quando o vendedor voltou do Google pelo passo 1 e só falta
  // completar CPF, banca e localização (nome e e-mail já vieram do Google).
  let sellerCompletionMode = false;

  const getGoogleSignupErrorMessage = (error) => {
    if (error.code === "auth/operation-not-allowed") {
      return "Ative o provedor Google no Firebase Authentication para usar esta opção.";
    }
    if (error.code === "auth/unauthorized-domain") {
      return "Adicione o domínio deste site aos domínios autorizados do Firebase Authentication.";
    }
    if (error.code === "auth/invalid-oauth-client-id") {
      return "Confira a configuração do provedor Google no Firebase Authentication.";
    }
    if (error.code === "auth/account-type-mismatch") {
      return error.message;
    }
    if (error.code === "auth/redirect-cancelled-by-user") {
      return "O cadastro com Google foi cancelado.";
    }
    return error.code
      ? `Não foi possível criar a conta com Google (${error.code}).`
      : "Não foi possível criar a conta com Google. Tente novamente.";
  };

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
          formSubtitle.textContent =
            "Informe seu telefone e senha ou use Google para preencher nome e e-mail.";
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

  buyerGoogleButton?.addEventListener("click", async () => {
    if (!validateField(documentInput)) {
      documentInput.focus();
      return;
    }

    buyerGoogleButton.disabled = true;
    try {
      if (!window.Backend?.registerWithGoogle) {
        throw new Error("Backend não inicializado");
      }
      const digits = documentInput.value.replace(/\D/g, "");
      await window.Backend.registerWithGoogle({
        type: "cliente",
        document: digits,
      });
    } catch (error) {
      console.error(error);
      alert(getGoogleSignupErrorMessage(error));
    } finally {
      buyerGoogleButton.disabled = false;
    }
  });

  sellerScreens.forEach((screen) => {
    const continueButton = screen.querySelector("[data-seller-continue]");
    const previousButton = screen.querySelector("[data-seller-previous]");
    const backButton = screen.querySelector("[data-seller-back]");

    continueButton?.addEventListener("click", async () => {
      const fields = Array.from(screen.querySelectorAll("input, select"));
      const results = fields.map((field) => ({
        field,
        valid:
          field === sellerFullNameInput && !field.value.trim()
            ? true
            : validateField(field),
      }));
      const invalidField = results.find((result) => !result.valid)?.field;
      if (invalidField) {
        invalidField.focus();
        return;
      }
      if (sellerCompletionMode && sellerStep === 3) {
        await completeGoogleSeller(continueButton);
        return;
      }
      if (sellerStep < 4) showSellerStep(sellerStep + 1);
    });

    previousButton?.addEventListener("click", () => {
      if (sellerStep > 1) showSellerStep(sellerStep - 1);
    });

    backButton?.addEventListener("click", async () => {
      if (!sellerCompletionMode) {
        returnToAccountType();
        return;
      }
      // Entrou com a conta Google errada? Sai e volta para o login.
      try {
        await window.Backend?.logout?.();
      } catch (error) {
        console.error(error);
      }
      Router.go("login");
    });
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
      toggle.setAttribute(
        "aria-label",
        shouldShow ? "Ocultar senha" : "Mostrar senha",
      );
    });
  });

  if (sellerForm) {
    sellerGoogleButton?.addEventListener("click", async () => {
      const sellerFields = sellerScreens
        .filter((screen) => Number(screen.dataset.sellerScreen) < 4)
        .flatMap((screen) =>
          Array.from(screen.querySelectorAll("input, select")),
        );
      const invalidField = sellerFields.find(
        (field) => field !== sellerFullNameInput && !validateField(field),
      );
      if (invalidField) {
        const invalidScreen = invalidField.closest("[data-seller-screen]");
        if (invalidScreen) {
          showSellerStep(Number(invalidScreen.dataset.sellerScreen));
        }
        invalidField.focus();
        return;
      }

      sellerGoogleButton.disabled = true;
      try {
        if (!window.Backend?.registerWithGoogle) {
          throw new Error("Backend não inicializado");
        }
        const selectedLocation = sellerLocations.get(
          sellerCityInput.value.trim(),
        );
        const stallLocation = {
          ...selectedLocation,
          marketName: sellerMarketNameInput.value.trim(),
          reference: sellerReferenceInput.value.trim(),
        };
        await window.Backend.registerWithGoogle({
          type: "comerciante",
          document: sellerCpfInput.value.replace(/\D/g, ""),
          stallName: sellerStallNameInput.value.trim(),
          stallLocation,
        });
      } catch (error) {
        console.error(error);
        alert(getGoogleSignupErrorMessage(error));
      } finally {
        sellerGoogleButton.disabled = false;
      }
    });

    sellerForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (sellerCompletionMode) {
        sellerScreens
          .find((screen) => Number(screen.dataset.sellerScreen) === sellerStep)
          ?.querySelector("[data-seller-continue]")
          ?.click();
        return;
      }

      const sellerFields = Array.from(
        sellerForm.querySelectorAll("input, select"),
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
      const selectedLocation = sellerLocations.get(
        sellerCityInput.value.trim(),
      );
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

  // Botão Google do passo 1: não exige nada preenchido. Nome e e-mail vêm
  // da conta Google; o restante é pedido quando o usuário voltar do login.
  sellerGoogleStartButton?.addEventListener("click", async () => {
    sellerGoogleStartButton.disabled = true;
    try {
      if (!window.Backend?.registerWithGoogle) {
        throw new Error("Backend não inicializado");
      }
      await window.Backend.registerWithGoogle({ type: "comerciante" });
    } catch (error) {
      console.error(error);
      alert(getGoogleSignupErrorMessage(error));
    } finally {
      sellerGoogleStartButton.disabled = false;
    }
  });

  async function completeGoogleSeller(button) {
    const originalContent = button?.innerHTML;
    if (button) {
      button.disabled = true;
      button.textContent = "Concluindo...";
    }
    try {
      if (!window.Backend?.completeSellerProfile) {
        throw new Error("Backend não inicializado");
      }
      await window.Backend.completeSellerProfile({
        name: sellerFullNameInput.value.trim(),
        document: sellerCpfInput.value.replace(/\D/g, ""),
        stallName: sellerStallNameInput.value.trim(),
        stallLocation: {
          ...sellerLocations.get(sellerCityInput.value.trim()),
          marketName: sellerMarketNameInput.value.trim(),
          reference: sellerReferenceInput.value.trim(),
        },
      });
      Router.go("home");
    } catch (error) {
      console.error(error);
      alert("Erro ao concluir o cadastro. Tente novamente.");
      if (button) {
        button.disabled = false;
        button.innerHTML = originalContent;
      }
    }
  }

  const enterGoogleCompletionMode = (user) => {
    sellerCompletionMode = true;
    selectedType = "comerciante";
    appContainer?.classList.add("cadastro-vendedor");
    appContainer?.classList.remove("cadastro-comprador");
    if (step1) step1.style.display = "none";
    if (step2) step2.style.display = "none";
    if (sellerRegistration) sellerRegistration.hidden = false;

    // Nome já preenchido (continua editável); e-mail aparece na descrição.
    if (sellerFullNameInput) {
      sellerFullNameInput.value = user.name || "";
      fieldValidations.get(sellerFullNameInput)?.refresh();
    }
    const description = document.querySelector(
      ".seller-screen-1 .seller-card-description",
    );
    if (description && user.email) {
      description.textContent = `Conectado como ${user.email}`;
      description.title = user.email;
      description.classList.add("is-google");
    }
    if (sellerGoogleStartButton) sellerGoogleStartButton.hidden = true;

    // Sem etapa de senha: o fluxo termina no passo 3.
    sellerScreens.forEach((screen) => {
      const stepNumber = Number(screen.dataset.sellerScreen);
      if (stepNumber > 3) return;
      const track = screen.querySelector(".seller-progress-track");
      track
        ?.querySelector("span")
        ?.style.setProperty("width", `${(stepNumber / 3) * 100}%`);
      track?.setAttribute("aria-valuemax", "3");
      track?.setAttribute("aria-label", `Etapa ${stepNumber} de 3`);
      const label = screen.querySelector(".seller-card-progress small");
      if (label) label.textContent = `Passo ${stepNumber} de 3`;
    });
    const lastStepLabel = sellerScreens
      .find((screen) => Number(screen.dataset.sellerScreen) === 3)
      ?.querySelector("[data-seller-continue] span");
    if (lastStepLabel) lastStepLabel.textContent = "Concluir";

    showSellerStep(1);
  };

  const pendingUser = window.Auth?.user;
  if (pendingUser?.type === "comerciante" && pendingUser.needsCompletion) {
    enterGoogleCompletionMode(pendingUser);
  }

  const form = document.getElementById("cad-form");
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const buyerFields = [
        buyerNameInput,
        buyerEmailInput,
        documentInput,
        buyerPasswordInput,
        buyerPasswordConfirmInput,
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
      const password = buyerPasswordInput.value;

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
    registration.style.setProperty(
      "--seller-scale",
      container.clientWidth / 430,
    );
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  return () => observer.disconnect();
};
