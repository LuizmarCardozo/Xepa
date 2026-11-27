// Controla a tela e a validação dos dados de retirada Pix.
function isValidPixCpf(value) {
  const digits = String(value).replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

  const checkDigit = (length) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      sum += Number(digits[index]) * (length + 1 - index);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return (
    checkDigit(9) === Number(digits[9]) &&
    checkDigit(10) === Number(digits[10])
  );
}

window.ResgatarPage = function () {
  return `
    <main class="pix-withdraw-page">
      <section class="pix-withdraw-content" aria-label="Retirada via Pix">
        <div class="pix-withdraw-logo" role="img" aria-label="Pix">
          <img src="assets/pay-pix.svg" alt="" aria-hidden="true">
          <span aria-hidden="true">pix</span>
        </div>
        <form id="pix-withdraw-form" class="pix-withdraw-form" novalidate>
          <div class="pix-withdraw-fields">
            <label class="pix-sr-only" for="pix-key-type">Tipo da chave Pix</label>
            <select id="pix-key-type" class="pix-withdraw-control" required>
              <option value="" selected disabled>Selecione a chave pix</option>
              <option value="cpf">CPF</option>
              <option value="email">E-mail</option>
              <option value="phone">Telefone</option>
              <option value="random">Chave aleatória</option>
            </select>
            <label class="pix-sr-only" for="pix-withdraw-name">Nome</label>
            <input id="pix-withdraw-name" class="pix-withdraw-control" type="text" placeholder="Nome" autocomplete="given-name" maxlength="80" required>
            <label class="pix-sr-only" for="pix-withdraw-surname">Sobrenome</label>
            <input id="pix-withdraw-surname" class="pix-withdraw-control" type="text" placeholder="Sobrenome" autocomplete="family-name" maxlength="80" required>
            <label class="pix-sr-only" for="pix-withdraw-key">Chave Pix</label>
            <input id="pix-withdraw-key" class="pix-withdraw-control" type="text" placeholder="Insira o número do seu CPF" maxlength="14" autocomplete="off" required>
          </div>
          <div class="pix-withdraw-amount" aria-labelledby="pix-withdraw-amount-label">
            <label class="pix-withdraw-amount-label" id="pix-withdraw-amount-label" for="pix-withdraw-value">Valor</label>
            <div class="pix-withdraw-money">
              <span aria-hidden="true">R$</span>
              <input id="pix-withdraw-value" type="number" min="5" max="15000" step="0.01" value="75" inputmode="decimal" aria-label="Valor para retirar em reais" required>
            </div>
          </div>
          <small class="pix-withdraw-limits">De R$ 5 até R$ 15.000</small>
          <div class="pix-withdraw-actions">
            <button class="pix-withdraw-back" type="button" data-pix-withdraw-back>Voltar</button>
            <button class="pix-withdraw-submit" type="submit">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-6M3 12h12m-5-5 5 5-5 5"/></svg>
              <span>Retirar</span>
            </button>
          </div>
          <p id="pix-withdraw-message" class="pix-withdraw-message" role="status" aria-live="polite"></p>
        </form>
      </section>
    </main>`;
};

window.ResgatarPageInit = function () {
  document.body.classList.add("pix-withdraw-mode");

  const form = document.getElementById("pix-withdraw-form");
  const keyType = document.getElementById("pix-key-type");
  const keyInput = document.getElementById("pix-withdraw-key");
  const message = document.getElementById("pix-withdraw-message");
  const cleanup = () => document.body.classList.remove("pix-withdraw-mode");

  document
    .querySelector("[data-pix-withdraw-back]")
    ?.addEventListener("click", () => Router.go("carteira"));

  if (!form || !keyType || !keyInput || !message) return cleanup;

  const keySettings = {
    cpf: {
      type: "text",
      inputMode: "numeric",
      maxLength: 11,
      placeholder: "Insira o número do seu CPF",
    },
    email: {
      type: "email",
      inputMode: "email",
      maxLength: 254,
      placeholder: "Insira seu e-mail",
    },
    phone: {
      type: "tel",
      inputMode: "tel",
      maxLength: 13,
      placeholder: "Insira seu telefone com DDD",
    },
    random: {
      type: "text",
      inputMode: "text",
      maxLength: 77,
      placeholder: "Insira sua chave aleatória",
    },
  };

  const setMessage = (text, state = "") => {
    message.textContent = text;
    if (state) message.dataset.state = state;
    else message.removeAttribute("data-state");
  };

  const updateKeyInput = () => {
    const settings = keySettings[keyType.value] || keySettings.cpf;
    keyInput.type = settings.type;
    keyInput.inputMode = settings.inputMode;
    keyInput.maxLength = settings.maxLength;
    keyInput.placeholder = settings.placeholder;
    keyInput.value = "";
    keyInput.removeAttribute("aria-invalid");
    keyType.removeAttribute("aria-invalid");
    setMessage("");
  };

  keyType.addEventListener("change", updateKeyInput);
  keyInput.addEventListener("input", () => {
    if (keyType.value === "cpf" || keyType.value === "phone") {
      keyInput.value = keyInput.value
        .replace(/\D/g, "")
        .slice(0, keyType.value === "cpf" ? 11 : 13);
    }
  });

  form.addEventListener("input", (event) => {
    event.target.removeAttribute("aria-invalid");
    setMessage("");
  });
  form.addEventListener("change", (event) => {
    event.target.removeAttribute("aria-invalid");
    setMessage("");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("pix-withdraw-name");
    const surname = document.getElementById("pix-withdraw-surname");
    const amount = document.getElementById("pix-withdraw-value");
    const keyValue = keyInput.value.trim();
    const digits = keyValue.replace(/\D/g, "");
    let keyIsValid = false;

    if (keyType.value === "cpf") {
      keyIsValid = isValidPixCpf(keyValue);
    } else if (keyType.value === "email") {
      keyIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(keyValue);
    } else if (keyType.value === "phone") {
      keyIsValid =
        digits.length === 10 ||
        digits.length === 11 ||
        (digits.startsWith("55") &&
          (digits.length === 12 || digits.length === 13));
    } else if (keyType.value === "random") {
      keyIsValid = keyValue.length >= 16;
    }

    const amountValue = Number(amount.value);
    const checks = [
      [keyType, Boolean(keyType.value)],
      [name, Boolean(name.value.trim())],
      [surname, Boolean(surname.value.trim())],
      [keyInput, keyIsValid],
      [amount, Number.isFinite(amountValue) && amountValue >= 5 && amountValue <= 15000],
    ];
    checks.forEach(([field, valid]) => {
      field.setAttribute("aria-invalid", String(!valid));
    });

    const invalidField = checks.find(([, valid]) => !valid)?.[0];
    if (invalidField) {
      setMessage("Confira a chave Pix, os dados do titular e o valor.", "error");
      invalidField.focus();
      return;
    }

    setMessage(
      "Dados válidos. A retirada via Pix ainda não está disponível no app.",
      "notice",
    );
  });

  return cleanup;
};
