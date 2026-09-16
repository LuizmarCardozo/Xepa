// js/criar_oferta.js
// Tela "Nova oferta": upload de imagem, máscara de preço, validação
// e persistência das ofertas no Firebase.

window.CriarOfertaPage = function () {
  const MAX_IMAGE_MB = 5;

  const form = document.getElementById("offerForm");
  if (!form) return; // segurança caso a função seja chamada na página errada

  const btnBack = document.getElementById("btnBack");
  const btnSubmit = document.getElementById("btnSubmit");

  const imageDrop = document.getElementById("imageDrop");
  const imageInput = document.getElementById("offerImageInput");
  const imagePlaceholder = document.getElementById("imagePlaceholder");
  const imagePreviewImg = document.getElementById("imagePreviewImg");
  const btnRemoveImage = document.getElementById("btnRemoveImage");
  const errImagem = document.getElementById("errImagem");

  const fieldNome = document.getElementById("fieldNome");
  const fieldCategoria = document.getElementById("fieldCategoria");
  const fieldUnidade = document.getElementById("fieldUnidade");
  const fieldPreco = document.getElementById("fieldPreco");
  const fieldPrecoAntigo = document.getElementById("fieldPrecoAntigo");
  const fieldDescricao = document.getElementById("fieldDescricao");
  const descCount = document.getElementById("descCount");

  const errNome = document.getElementById("errNome");
  const errPreco = document.getElementById("errPreco");

  const toast = document.getElementById("toast");

  let currentImageData = null; // dataURL da imagem escolhida
  let toastTimer = null;

  // ---------------------------------------------------------
  // TOAST
  // ---------------------------------------------------------
  function showToast(message, isError) {
    toast.textContent = message;
    toast.classList.toggle("co-toast-error", !!isError);
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  // ---------------------------------------------------------
  // VOLTAR
  // ---------------------------------------------------------
  if (btnBack) {
    btnBack.addEventListener("click", () => {
      if (typeof Router !== "undefined" && Router.go) {
        Router.go("ofertas");
      } else if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "ofertas.html";
      }
    });
  }

  // ---------------------------------------------------------
  // UPLOAD DE IMAGEM
  // ---------------------------------------------------------
  function setImagePreview(dataUrl) {
    currentImageData = dataUrl;
    imagePreviewImg.src = dataUrl;
    imagePreviewImg.classList.remove("hidden");
    imagePlaceholder.classList.add("hidden");
    btnRemoveImage.classList.remove("hidden");
    imageDrop.classList.remove("is-invalid");
    errImagem.textContent = "";
  }

  function clearImagePreview() {
    currentImageData = null;
    imagePreviewImg.src = "";
    imagePreviewImg.classList.add("hidden");
    imagePlaceholder.classList.remove("hidden");
    btnRemoveImage.classList.add("hidden");
    imageInput.value = "";
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          const maxSize = 800;
          const scale = Math.min(
            1,
            maxSize / Math.max(image.width, image.height),
          );
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          canvas
            .getContext("2d")
            .drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.68));
        };
        image.onerror = reject;
        image.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function handleFile(file) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      errImagem.textContent =
        "Selecione um arquivo de imagem (PNG, JPG ou WEBP).";
      imageDrop.classList.add("is-invalid");
      return;
    }

    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_IMAGE_MB) {
      errImagem.textContent = `A imagem deve ter até ${MAX_IMAGE_MB}MB.`;
      imageDrop.classList.add("is-invalid");
      return;
    }

    compressImage(file)
      .then(setImagePreview)
      .catch(() => {
        errImagem.textContent =
          "Não foi possível processar a imagem. Tente novamente.";
        imageDrop.classList.add("is-invalid");
      });
  }

  imageDrop.addEventListener("click", () => imageInput.click());
  imageDrop.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      imageInput.click();
    }
  });

  imageInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

  btnRemoveImage.addEventListener("click", (e) => {
    e.stopPropagation();
    clearImagePreview();
  });

  ["dragenter", "dragover"].forEach((evt) =>
    imageDrop.addEventListener(evt, (e) => {
      e.preventDefault();
      imageDrop.classList.add("is-dragover");
    }),
  );
  ["dragleave", "drop"].forEach((evt) =>
    imageDrop.addEventListener(evt, (e) => {
      e.preventDefault();
      imageDrop.classList.remove("is-dragover");
    }),
  );
  imageDrop.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    handleFile(file);
  });

  // ---------------------------------------------------------
  // MÁSCARA DE PREÇO (R$ 0,00)
  // ---------------------------------------------------------
  function maskPrice(input) {
    input.addEventListener("input", () => {
      let digits = input.value.replace(/\D/g, "");
      if (!digits) {
        input.value = "";
        return;
      }
      digits = digits.replace(/^0+(?=\d)/, "");
      while (digits.length < 3) digits = "0" + digits;
      const cents = digits.slice(-2);
      const intPart = digits.slice(0, -2).replace(/^0+(?=\d)/, "");
      const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      input.value = `${withThousands},${cents}`;
    });
  }
  maskPrice(fieldPreco);
  maskPrice(fieldPrecoAntigo);

  function priceToNumber(value) {
    if (!value) return NaN;
    return Number(value.replace(/\./g, "").replace(",", "."));
  }

  // ---------------------------------------------------------
  // CONTADOR DE CARACTERES DA DESCRIÇÃO
  // ---------------------------------------------------------
  function updateDescCount() {
    descCount.textContent = `${fieldDescricao.value.length}/${fieldDescricao.maxLength}`;
  }
  fieldDescricao.addEventListener("input", updateDescCount);
  updateDescCount();

  // ---------------------------------------------------------
  // VALIDAÇÃO
  // ---------------------------------------------------------
  function setFieldError(input, errorEl, message) {
    if (message) {
      input.classList.add("is-invalid");
      if (errorEl) errorEl.textContent = message;
      return false;
    }
    input.classList.remove("is-invalid");
    if (errorEl) errorEl.textContent = "";
    return true;
  }

  function validate() {
    let valid = true;

    const nomeOk = fieldNome.value.trim().length >= 2;
    valid =
      setFieldError(
        fieldNome,
        errNome,
        nomeOk ? "" : "Informe o nome do produto.",
      ) && valid;

    const precoNumber = priceToNumber(fieldPreco.value);
    const precoOk =
      fieldPreco.value.trim() !== "" && !isNaN(precoNumber) && precoNumber > 0;
    valid =
      setFieldError(
        fieldPreco.parentElement.classList.contains("co-price-input")
          ? fieldPreco.parentElement
          : fieldPreco,
        errPreco,
        precoOk ? "" : "Informe um preço válido.",
      ) && valid;

    return valid;
  }

  // ---------------------------------------------------------
  // SUBMIT
  // ---------------------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validate()) {
      showToast("Verifique os campos destacados.", true);
      return;
    }

    const precoAntigoNumber = priceToNumber(fieldPrecoAntigo.value);

    const offer = {
      id: Date.now(),
      name: fieldNome.value.trim(),
      category: fieldCategoria.value,
      unit: fieldUnidade.value.trim() || "unidade",
      price: priceToNumber(fieldPreco.value),
      oldPrice:
        !isNaN(precoAntigoNumber) && precoAntigoNumber > 0
          ? precoAntigoNumber
          : null,
      desc: fieldDescricao.value.trim(),
      image: currentImageData, // dataURL (ou null, caso sem foto)
      createdAt: new Date().toISOString(),
      active: true,
    };

    btnSubmit.disabled = true;
    btnSubmit.textContent = "Publicando...";

    try {
      if (!window.Backend || !window.Backend.createOffer) {
        throw new Error("Backend não inicializado");
      }

      await window.Backend.createOffer(offer);
      showToast("Oferta publicada com sucesso!");

      form.reset();
      clearImagePreview();
      updateDescCount();
      setFieldError(fieldNome, errNome, "");
      setFieldError(fieldPreco, errPreco, "");

      btnSubmit.disabled = false;
      btnSubmit.textContent = "Publicar oferta";

      setTimeout(() => {
        if (typeof Router !== "undefined" && Router.go) {
          Router.go("minhasOfertas");
        } else {
          window.location.href = "ofertas.html";
        }
      }, 900);
    } catch (error) {
      console.error(error);
      showToast("Não foi possível publicar a oferta.", true);
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Publicar oferta";
    }
  });
};

// Executa automaticamente quando a página é aberta de forma independente
// (fora de um router de SPA).
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("offerForm")) {
    window.CriarOfertaPage();
  }
});
