// Controla o formulário de criação e edição de ofertas.
// js/criar_oferta.js
// Tela "Nova oferta": upload de imagem, máscara de preço, validação
// e persistência das ofertas no Firebase.

window.CriarOfertaPage = async function () {
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
  const submitStatus = document.getElementById("coSubmitStatus");
  const locationButton = document.getElementById("btnSetOfferLocation");
  const clearLocationButton = document.getElementById("btnClearOfferLocation");
  const locationStatus = document.getElementById("offerLocationStatus");
  const formTitle = document.getElementById("offerFormTitle");
  const formSubtitle = document.getElementById("offerFormSubtitle");

  let currentImageData = null; // dataURL da imagem escolhida
  let toastTimer = null;
  let offerLocation = null;
  const editingOfferId = sessionStorage.getItem("xepa-edit-offer-id");
  let offerReady = !editingOfferId;

  function updateLocationUi() {
    if (locationStatus) {
      locationStatus.textContent = offerLocation
        ? "Localização marcada. Clientes poderão ordenar esta oferta pela distância."
        : "Marque a localização para aparecer no filtro “Perto de você”.";
    }
    clearLocationButton?.classList.toggle("hidden", !offerLocation);
  }

  // ---------------------------------------------------------
  // TOAST
  // ---------------------------------------------------------
  function showToast(message, isError) {
    if (toast) {
      toast.textContent = message;
      toast.classList.toggle("co-toast-error", !!isError);
      toast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
    }
  }

  function showSubmitStatus(message, type = "success") {
    if (!submitStatus) return;
    submitStatus.textContent = message;
    submitStatus.classList.remove("success", "error");
    submitStatus.classList.add(type === "error" ? "error" : "success");
    submitStatus.classList.add("show");
  }

  // ---------------------------------------------------------
  // VOLTAR
  // ---------------------------------------------------------
  if (btnBack) {
    btnBack.addEventListener("click", () => {
      if (editingOfferId) sessionStorage.removeItem("xepa-edit-offer-id");
      if (typeof Router !== "undefined" && Router.go) {
        Router.go(editingOfferId ? "minhasOfertas" : "ofertas");
      } else if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "ofertas.html";
      }
    });
  }

  locationButton?.addEventListener("click", () => {
    if (!navigator.geolocation) {
      locationStatus.textContent =
        "Este navegador não disponibiliza localização.";
      return;
    }
    if (!window.isSecureContext) {
      locationStatus.textContent =
        "A localização exige que o app seja aberto por HTTPS ou localhost.";
      return;
    }
    locationButton.disabled = true;
    locationStatus.textContent = "Aguardando a permissão e a localização...";
    navigator.geolocation.getCurrentPosition(
      (position) => {
        offerLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        locationButton.disabled = false;
        updateLocationUi();
      },
      (error) => {
        locationButton.disabled = false;
        locationStatus.textContent =
          error.code === 1
            ? "Permissão negada. Você pode publicar sem localização ou liberar o acesso no navegador."
            : "Não foi possível obter a localização. Tente novamente ou publique sem ela.";
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 12000 },
    );
  });

  clearLocationButton?.addEventListener("click", () => {
    offerLocation = null;
    updateLocationUi();
  });

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

  // Reúne as validações do nome e do preço antes de publicar.
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

  function formatPriceInput(value) {
    if (value === null || value === undefined || value === "") return "";
    const amount = Number(value);
    return Number.isFinite(amount)
      ? amount.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "";
  }

  async function loadOfferForEditing() {
    if (!editingOfferId) return;
    offerReady = false;
    btnSubmit.disabled = true;
    btnSubmit.textContent = "Carregando oferta...";
    try {
      const offer = await window.Backend.getOffer(editingOfferId);
      if (!offer || offer.ownerUid !== window.Auth?.user?.uid) {
        throw new Error(
          "Não foi possível localizar uma oferta sua para editar.",
        );
      }
      fieldNome.value = offer.name || "";
      fieldCategoria.value = offer.category || "Outros";
      fieldUnidade.value = offer.unit || "unidade";
      fieldPreco.value = formatPriceInput(offer.price);
      fieldPrecoAntigo.value = formatPriceInput(offer.oldPrice);
      fieldDescricao.value = offer.desc || "";
      offerLocation = offer.location || null;
      if (offer.image) setImagePreview(offer.image);
      updateDescCount();
      updateLocationUi();
      if (formTitle) formTitle.textContent = "Editar oferta";
      if (formSubtitle)
        formSubtitle.textContent = "Atualize as informações desta oferta.";
      btnSubmit.textContent = "Salvar alterações";
      offerReady = true;
    } catch (error) {
      console.error(error);
      showToast(error.message || "Não foi possível carregar a oferta.", true);
      sessionStorage.removeItem("xepa-edit-offer-id");
    } finally {
      btnSubmit.disabled = !offerReady;
    }
  }

  // ---------------------------------------------------------
  // SUBMIT
  // ---------------------------------------------------------
  // Valida os campos e encaminha a oferta para criação ou edição.
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!offerReady) {
      showToast("Aguarde a oferta terminar de carregar.", true);
      return;
    }

    if (!validate()) {
      showToast("Verifique os campos destacados.", true);
      showSubmitStatus(
        "Verifique os campos destacados antes de publicar.",
        "error",
      );
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
      location: offerLocation,
      createdAt: new Date().toISOString(),
      active: true,
    };

    btnSubmit.disabled = true;
    btnSubmit.textContent = editingOfferId
      ? "Salvando alterações..."
      : "Publicando...";

    try {
      const saveOffer = editingOfferId
        ? window.Backend?.updateOffer
        : window.Backend?.createOffer;
      if (typeof saveOffer !== "function") {
        throw new Error("Backend não inicializado");
      }

      if (editingOfferId) {
        await window.Backend.updateOffer(editingOfferId, offer);
        sessionStorage.removeItem("xepa-edit-offer-id");
        showToast("Oferta atualizada com sucesso!");
        showSubmitStatus("Oferta atualizada com sucesso!", "success");
      } else {
        await window.Backend.createOffer(offer);
        showToast("Oferta publicada com sucesso!");
        showSubmitStatus("Oferta publicada com sucesso!", "success");
      }

      form.reset();
      clearImagePreview();
      updateDescCount();
      setFieldError(fieldNome, errNome, "");
      setFieldError(fieldPreco, errPreco, "");

      btnSubmit.disabled = false;
      btnSubmit.textContent = editingOfferId
        ? "Salvar alterações"
        : "Publicar oferta";

      setTimeout(() => {
        if (typeof Router !== "undefined" && Router.go) {
          Router.go("minhasOfertas");
        } else {
          window.location.href = "ofertas.html";
        }
      }, 1200);
    } catch (error) {
      console.error(error);
      const message = error?.message || "Não foi possível salvar a oferta.";
      showToast(message, true);
      showSubmitStatus(message, "error");
      btnSubmit.disabled = false;
      btnSubmit.textContent = editingOfferId
        ? "Salvar alterações"
        : "Publicar oferta";
    }
  });

  await loadOfferForEditing();
};

// Executa automaticamente quando a página é aberta de forma independente
// (fora de um router de SPA).
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("offerForm")) {
    window.CriarOfertaPage();
  }
});
