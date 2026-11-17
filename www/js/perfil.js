window.PerfilPage = function () {
  if (window.Auth?.user?.type === "comerciante")
    return `
    <main class="seller-account seller-profile">
      <div class="seller-profile-banner" data-seller-banner>
        <img class="seller-profile-banner-image" data-seller-banner-image alt="" hidden>
        <button class="seller-banner-edit" type="button" data-edit-seller-banner aria-label="Alterar banner da banca">
          <img src="assets/perfil-lapis-grande.svg" alt="" aria-hidden="true">
        </button>
      </div>
      <div class="seller-profile-heading">
        <div class="seller-avatar-wrap">
          <img id="seller-profile-avatar" class="seller-profile-avatar" src="assets/banca-figma.png" alt="Foto da banca">
          <button class="seller-edit-mark seller-avatar-edit" type="button" data-edit-seller-photo aria-label="Alterar foto da banca"><img src="assets/perfil-lapis-grande.svg" alt="" aria-hidden="true"></button>
        </div>
        <div class="seller-name-wrap">
          <h1 id="seller-profile-name">Banca com nome não cadastrado</h1>
          <button class="seller-edit-mark seller-name-edit" type="button" data-edit-seller-name aria-label="Alterar nome da banca"><img src="assets/perfil-lapis-pequeno.svg" alt="" aria-hidden="true"></button>
        </div>

      </div>
      <form id="seller-details-form" class="seller-details-form" hidden>
        <label for="seller-stall-name">Nome da banca</label>
        <input id="seller-stall-name" type="text" maxlength="80">
        <input id="seller-photo-input" type="file" accept="image/jpeg,image/png,image/webp" hidden>
        <input id="seller-banner-input" type="file" accept="image/jpeg,image/png,image/webp" hidden>
        <p id="seller-details-message" role="status"></p>
        <div class="seller-details-actions">
          <button type="button" class="seller-edit-cancel" data-cancel-seller-edit>Cancelar</button>
          <button type="submit">Salvar alterações</button>
        </div>
      </form>
      <div class="seller-image-editor" data-seller-image-editor hidden>
        <div class="seller-image-editor-backdrop" data-cancel-image-crop></div>
        <section class="seller-image-editor-dialog" role="dialog" aria-modal="true" aria-labelledby="seller-image-editor-title">
          <h2 id="seller-image-editor-title" data-image-editor-title>Recortar foto da banca</h2>
          <p>Arraste a imagem e ajuste o zoom para escolher o enquadramento.</p>
          <div class="seller-image-crop-stage" data-seller-crop-stage>
            <img data-seller-crop-preview alt="">
          </div>
          <p class="seller-image-editor-error" data-image-editor-error role="alert" hidden></p>
          <label class="seller-image-zoom">
            <span>Zoom</span>
            <input type="range" min="1" max="3" step="0.01" value="1" data-seller-crop-zoom>
          </label>
          <div class="seller-image-editor-actions">
            <button type="button" class="seller-image-crop-cancel" data-cancel-image-crop>Cancelar</button>
            <button type="button" class="seller-image-crop-apply" data-apply-image-crop>Usar imagem</button>
          </div>
        </section>
      </div>
      <section class="seller-account-menu" aria-label="Configurações da banca">
        <details id="seller-personal"><summary><span class="seller-menu-icon">${sellerProfileIcon("document")}</span><div><strong>Dados da Pessoais</strong><small>Nome, telefone e endereço</small></div><i></i></summary>
          <form id="profile-form" class="seller-profile-form"><label for="profile-name">Nome</label><input id="profile-name" required maxlength="80"><label for="profile-email">E-mail</label><input id="profile-email" type="email" disabled><label for="profile-document">Telefone ou documento</label><input id="profile-document" maxlength="14"><button type="submit">Salvar perfil</button><p id="profile-message" role="status"></p></form>
        </details>
        ${sellerProfileRow("pin", "Endereço de entrega", "Gerencia seus endereços")}
        ${sellerProfileRow("card", "Formas de pagamento", "Cartões, Pix e carteiras digitais")}
        ${sellerProfileRow("bell", "Notificações", "Promoçoes, pedidos e novidades")}
        ${sellerProfileRow("shield", "Privacidade e segurança", "Seus dados protegidos")}
        ${sellerProfileRow("support", "Ajuda e suporte", "Fale conosco")}
      </section>
      <button id="profile-logout" class="btn btn-outline btn-full seller-profile-logout" type="button">Sair da conta</button>
      <span id="profile-type" hidden></span>
    </main>`;
  return `
    <main class="buyer-profile-page">
      <header class="buyer-profile-hero">
        <div class="buyer-profile-identity">
          <div class="buyer-profile-avatar" data-buyer-avatar aria-hidden="true"></div>
          <h1 data-buyer-name></h1>
          <button class="buyer-profile-edit" type="button" data-buyer-profile-edit>
            <span aria-hidden="true">✎</span> Alterar
          </button>
        </div>
      </header>
      <section class="buyer-profile-metrics" aria-label="Resumo da sua conta">
        <button class="buyer-profile-metric buyer-profile-orders" type="button" onclick="Router.go('pedidos')">
          <span class="buyer-metric-icon" aria-hidden="true"><img src="assets/CARRINHO.png" alt=""></span>
          <span class="buyer-metric-title">Pedidos</span>
          <span class="buyer-metric-description">Quantidade de pedidos feitos</span>
          <strong data-buyer-order-count>—</strong>
          <span class="buyer-metric-unit">pedidos</span>
        </button>
        <button class="buyer-profile-metric buyer-profile-offers" type="button" onclick="Router.goOffers()">
          <span class="buyer-metric-icon" aria-hidden="true"><img src="assets/iconeBanca.png" alt=""></span>
          <span class="buyer-metric-title">Ofertas ativas</span>
          <span class="buyer-metric-description">Produtos disponíveis na Xepa</span>
          <strong data-buyer-offer-count>—</strong>
          <span class="buyer-metric-unit">produtos</span>
        </button>
      </section>
      <button class="buyer-profile-promo" type="button" onclick="Router.goOffers()" aria-label="Ver ofertas da sua região">
        <img src="assets/XeppaPErfil.png" alt="Juntos por uma alimentação mais saudável. O campo direto na sua mesa." />
      </button>
      <section class="seller-account-menu buyer-profile-menu" aria-label="Configurações da conta">
        <details id="buyer-personal">
          <summary><span class="seller-menu-icon">${sellerProfileIcon("document")}</span><div><strong>Dados Pessoais</strong><small>Nome, telefone e endereço</small></div><i></i></summary>
          <form id="profile-form" class="seller-profile-form buyer-profile-form">
            <label for="profile-name">Nome</label><input id="profile-name" required maxlength="80">
            <label for="profile-email">E-mail</label><input id="profile-email" type="email" disabled>
            <label for="profile-document">Telefone ou documento</label><input id="profile-document" maxlength="14">
            <button type="submit">Salvar perfil</button><p id="profile-message" role="status"></p>
          </form>
        </details>
        ${sellerProfileRow("pin", "Endereço de entrega", "Gerencie seus endereços")}
        ${sellerProfileRow("card", "Formas de pagamento", "Cartões, Pix e carteiras digitais")}
        ${sellerProfileRow("bell", "Notificações", "Promoções, pedidos e novidades")}
        ${sellerProfileRow("shield", "Privacidade e segurança", "Seus dados protegidos")}
        ${sellerProfileRow("support", "Ajuda e suporte", "Fale conosco")}
      </section>
      <button id="profile-logout" class="buyer-profile-logout" type="button">Sair da conta</button>
      <span id="profile-type" hidden></span>
    </main>`;
};

function sellerProfileIcon(name) {
  const names = {
    document: "document",
    pin: "pin",
    card: "card",
    bell: "bell",
    shield: "shield",
    support: "support",
  };
  return `<img src="assets/perfil-${names[name]}.svg" alt="" aria-hidden="true">`;
}
function sellerProfileRow(icon, title, subtitle) {
  return `<div class="seller-menu-row" aria-disabled="true"><span class="seller-menu-icon">${sellerProfileIcon(icon)}</span><div><strong>${title}</strong><small>${subtitle}</small></div><i></i></div>`;
}

function loadSellerProfileImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("A imagem selecionada é inválida."));
    };
    image.onload = () => resolve({ image, objectUrl });
    image.src = objectUrl;
  });
}

window.PerfilPageInit = function () {
  const user = window.Auth?.user;
  const form = document.getElementById("profile-form");
  if (!user || !form) return;
  document.getElementById("profile-name").value = user.name || "";
  document.getElementById("profile-email").value = user.email || "";
  document.getElementById("profile-document").value = user.document || "";
  document.getElementById("profile-type").textContent =
    user.type === "comerciante" ? "Comerciante" : "Cliente";
  const buyerName = document.querySelector("[data-buyer-name]");
  const buyerAvatar = document.querySelector("[data-buyer-avatar]");
  const buyerPersonalDetails = document.getElementById("buyer-personal");
  if (buyerName) buyerName.textContent = user.name || "Cliente Xepa";
  if (buyerAvatar) {
    const initials = String(user.name || "Xepa")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toLocaleUpperCase("pt-BR");
    buyerAvatar.textContent = initials;
  }
  document
    .querySelector("[data-buyer-profile-edit]")
    ?.addEventListener("click", () => {
      if (!buyerPersonalDetails) return;
      buyerPersonalDetails.open = true;
      buyerPersonalDetails.scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById("profile-name").focus();
    });
  const orderCount = document.querySelector("[data-buyer-order-count]");
  const offerCount = document.querySelector("[data-buyer-offer-count]");
  if (orderCount && typeof window.Backend?.getOrders === "function") {
    window.Backend.getOrders()
      .then((orders) => {
        orderCount.textContent = String(
          orders.filter((order) => order.buyerUid === user.uid).length,
        );
      })
      .catch((error) => {
        console.error("Não foi possível carregar os pedidos do perfil:", error);
        orderCount.textContent = "—";
      });
  }
  if (offerCount && typeof window.Backend?.getOffers === "function") {
    window.Backend.getOffers()
      .then((offers) => {
        offerCount.textContent = String(offers.length);
      })
      .catch((error) => {
        console.error("Não foi possível carregar as ofertas do perfil:", error);
        offerCount.textContent = "—";
      });
  }
  const sellerName = document.getElementById("seller-profile-name");
  const sellerAvatar = document.getElementById("seller-profile-avatar");
  const sellerBannerImage = document.querySelector(
    "[data-seller-banner-image]",
  );
  const sellerDetailsForm = document.getElementById("seller-details-form");
  const stallNameInput = document.getElementById("seller-stall-name");
  const sellerPhotoInput = document.getElementById("seller-photo-input");
  const sellerBannerInput = document.getElementById("seller-banner-input");
  const sellerDetailsMessage = document.getElementById(
    "seller-details-message",
  );
  const imageEditor = document.querySelector("[data-seller-image-editor]");
  const cropStage = document.querySelector("[data-seller-crop-stage]");
  const cropPreview = document.querySelector("[data-seller-crop-preview]");
  const cropZoom = document.querySelector("[data-seller-crop-zoom]");
  const cropTitle = document.querySelector("[data-image-editor-title]");
  const cropError = document.querySelector("[data-image-editor-error]");
  const fallbackStallName = "Banca com nome não cadastrado";
  let selectedProfileImage = null;
  let selectedBannerImage = null;
  let cropImage = null;
  let cropObjectUrl = null;
  let cropMode = null;
  let cropScale = 1;
  let cropOffsetX = 0;
  let cropOffsetY = 0;
  let cropDrag = null;

  if (sellerName) {
    sellerName.textContent = user.stallName || fallbackStallName;
  }
  if (sellerAvatar) {
    sellerAvatar.src = user.stallImage || "assets/banca-figma.png";
  }
  if (sellerBannerImage && user.stallBanner) {
    sellerBannerImage.src = user.stallBanner;
    sellerBannerImage.hidden = false;
  }
  if (stallNameInput) stallNameInput.value = user.stallName || "";

  const openSellerDetails = (focusName = false) => {
    if (!sellerDetailsForm) return;
    sellerDetailsForm.hidden = false;
    if (sellerDetailsMessage) sellerDetailsMessage.textContent = "";
    if (focusName) stallNameInput?.focus();
  };
  const updateCropLayout = () => {
    if (!cropImage || !cropStage || !cropPreview) return;
    const { width, height } = cropStage.getBoundingClientRect();
    if (!width || !height) return;
    cropScale = Math.max(
      width / cropImage.naturalWidth,
      height / cropImage.naturalHeight,
    );
    const imageWidth = cropImage.naturalWidth * cropScale;
    const imageHeight = cropImage.naturalHeight * cropScale;
    const zoom = Number(cropZoom?.value || 1);
    const maxOffsetX = Math.max(0, (imageWidth * zoom - width) / 2);
    const maxOffsetY = Math.max(0, (imageHeight * zoom - height) / 2);
    cropOffsetX = Math.min(maxOffsetX, Math.max(-maxOffsetX, cropOffsetX));
    cropOffsetY = Math.min(maxOffsetY, Math.max(-maxOffsetY, cropOffsetY));
    cropPreview.style.width = `${imageWidth}px`;
    cropPreview.style.height = `${imageHeight}px`;
    cropPreview.style.left = `${width / 2 + cropOffsetX}px`;
    cropPreview.style.top = `${height / 2 + cropOffsetY}px`;
    cropPreview.style.transform = `translate(-50%, -50%) scale(${zoom})`;
  };
  const closeImageEditor = (clearInput = false) => {
    if (clearInput) {
      const input =
        cropMode === "banner" ? sellerBannerInput : sellerPhotoInput;
      if (input) input.value = "";
    }
    if (cropObjectUrl) URL.revokeObjectURL(cropObjectUrl);
    cropObjectUrl = null;
    cropImage = null;
    cropMode = null;
    cropDrag = null;
    if (cropPreview) cropPreview.removeAttribute("src");
    if (imageEditor) imageEditor.hidden = true;
    document.body.classList.remove("seller-image-editing");
  };
  const openImageEditor = async (file, mode) => {
    const { image, objectUrl } = await loadSellerProfileImage(file);
    if (cropObjectUrl) URL.revokeObjectURL(cropObjectUrl);
    cropImage = image;
    cropObjectUrl = objectUrl;
    cropMode = mode;
    cropOffsetX = 0;
    cropOffsetY = 0;
    if (cropZoom) cropZoom.value = "1";
    if (cropTitle) {
      cropTitle.textContent =
        mode === "banner" ? "Ajustar banner da banca" : "Recortar foto da banca";
    }
    if (cropStage) cropStage.classList.toggle("is-banner", mode === "banner");
    if (cropPreview) {
      cropPreview.src = objectUrl;
      cropPreview.alt =
        mode === "banner" ? "Prévia do banner" : "Prévia da foto de perfil";
    }
    if (cropError) {
      cropError.hidden = true;
      cropError.textContent = "";
    }
    if (imageEditor) imageEditor.hidden = false;
    document.body.classList.add("seller-image-editing");
    requestAnimationFrame(() => {
      updateCropLayout();
      cropZoom?.focus();
    });
  };
  const handleImageSelection = async (input, mode) => {
    const file = input?.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      openSellerDetails();
      sellerDetailsMessage.textContent = "Escolha uma imagem JPG, PNG ou WEBP.";
      input.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      openSellerDetails();
      sellerDetailsMessage.textContent = "A imagem deve ter no máximo 5 MB.";
      input.value = "";
      return;
    }
    try {
      await openImageEditor(file, mode);
    } catch (error) {
      console.error("Não foi possível abrir a imagem selecionada:", error);
      openSellerDetails();
      sellerDetailsMessage.textContent =
        error.message || "Não foi possível abrir essa imagem.";
      input.value = "";
    }
  };
  const applyImageCrop = () => {
    if (!cropImage || !cropStage || !cropMode) return;
    try {
      const { width, height } = cropStage.getBoundingClientRect();
      if (!width || !height || !cropScale) {
        throw new Error("Não foi possível calcular o enquadramento.");
      }
      const scale = cropScale * Number(cropZoom?.value || 1);
      const sourceWidth = width / scale;
      const sourceHeight = height / scale;
      const centerX = cropImage.naturalWidth / 2 - cropOffsetX / scale;
      const centerY = cropImage.naturalHeight / 2 - cropOffsetY / scale;
      const sourceX = Math.max(
        0,
        Math.min(cropImage.naturalWidth - sourceWidth, centerX - sourceWidth / 2),
      );
      const sourceY = Math.max(
        0,
        Math.min(cropImage.naturalHeight - sourceHeight, centerY - sourceHeight / 2),
      );
      const outputWidth = cropMode === "banner" ? 1440 : 640;
      const outputHeight =
        cropMode === "banner"
          ? Math.round((outputWidth * height) / width)
          : outputWidth;
      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Não foi possível processar a imagem.");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, outputWidth, outputHeight);
      context.drawImage(
        cropImage,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight,
      );
      const croppedImage = canvas.toDataURL("image/jpeg", 0.84);
      openSellerDetails();
      if (cropMode === "banner") {
        selectedBannerImage = croppedImage;
        if (sellerBannerImage) {
          sellerBannerImage.src = croppedImage;
          sellerBannerImage.hidden = false;
        }
        sellerDetailsMessage.textContent =
          "Prévia do banner atualizada. Salve para aplicar.";
      } else {
        selectedProfileImage = croppedImage;
        if (sellerAvatar) sellerAvatar.src = croppedImage;
        sellerDetailsMessage.textContent =
          "Prévia da foto atualizada. Salve para aplicar.";
      }
      closeImageEditor(true);
    } catch (error) {
      console.error("Não foi possível recortar a imagem:", error);
      if (cropError) {
        cropError.textContent =
          error.message || "Não foi possível processar a imagem.";
        cropError.hidden = false;
      }
    }
  };
  document
    .getElementById("seller-profile-edit")
    ?.addEventListener("click", () => openSellerDetails(true));
  document
    .querySelector("[data-edit-seller-name]")
    ?.addEventListener("click", () => openSellerDetails(true));
  document
    .querySelector("[data-edit-seller-photo]")
    ?.addEventListener("click", () => sellerPhotoInput.click());
  document
    .querySelector("[data-edit-seller-banner]")
    ?.addEventListener("click", () => sellerBannerInput.click());
  document
    .querySelector("[data-cancel-seller-edit]")
    ?.addEventListener("click", () => {
      sellerDetailsForm.hidden = true;
      sellerDetailsMessage.textContent = "";
      selectedProfileImage = null;
      selectedBannerImage = null;
      sellerPhotoInput.value = "";
      sellerBannerInput.value = "";
      stallNameInput.value = window.Auth.user?.stallName || "";
      sellerAvatar.src =
        window.Auth.user?.stallImage || "assets/banca-figma.png";
      if (sellerBannerImage) {
        const bannerUrl = window.Auth.user?.stallBanner || "";
        sellerBannerImage.src = bannerUrl;
        sellerBannerImage.hidden = !bannerUrl;
      }
    });

  sellerPhotoInput?.addEventListener("change", () =>
    handleImageSelection(sellerPhotoInput, "avatar"),
  );
  sellerBannerInput?.addEventListener("change", () =>
    handleImageSelection(sellerBannerInput, "banner"),
  );
  cropZoom?.addEventListener("input", updateCropLayout);
  cropStage?.addEventListener("pointerdown", (event) => {
    if (!cropImage) return;
    cropDrag = {
      x: event.clientX,
      y: event.clientY,
      offsetX: cropOffsetX,
      offsetY: cropOffsetY,
    };
    cropStage.setPointerCapture(event.pointerId);
  });
  cropStage?.addEventListener("pointermove", (event) => {
    if (!cropDrag) return;
    cropOffsetX = cropDrag.offsetX + event.clientX - cropDrag.x;
    cropOffsetY = cropDrag.offsetY + event.clientY - cropDrag.y;
    updateCropLayout();
  });
  cropStage?.addEventListener("pointerup", () => {
    cropDrag = null;
  });
  cropStage?.addEventListener("pointercancel", () => {
    cropDrag = null;
  });
  imageEditor?.querySelectorAll("[data-cancel-image-crop]").forEach((button) =>
    button.addEventListener("click", () => closeImageEditor(true)),
  );
  imageEditor
    ?.querySelector("[data-apply-image-crop]")
    ?.addEventListener("click", applyImageCrop);
  imageEditor?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeImageEditor(true);
  });
  window.addEventListener("resize", updateCropLayout);

  sellerDetailsForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const saveButton = sellerDetailsForm.querySelector('button[type="submit"]');
    saveButton.disabled = true;
    sellerDetailsMessage.textContent = "Salvando alterações...";
    try {
      const updated = await window.Backend.updateSellerProfile({
        stallName: stallNameInput.value,
        profileImage: selectedProfileImage,
        bannerImage: selectedBannerImage,
      });
      if (sellerName) {
        sellerName.textContent = updated.stallName || fallbackStallName;
      }
      if (sellerAvatar && updated.stallImage) {
        sellerAvatar.src = updated.stallImage;
      }
      if (sellerBannerImage && updated.stallBanner) {
        sellerBannerImage.src = updated.stallBanner;
        sellerBannerImage.hidden = false;
      }
      selectedProfileImage = null;
      selectedBannerImage = null;
      sellerPhotoInput.value = "";
      sellerBannerInput.value = "";
      sellerDetailsMessage.textContent = "Dados da banca atualizados.";
      sellerDetailsForm.hidden = true;
    } catch (error) {
      console.error(error);
      sellerDetailsMessage.textContent =
        error.message || "Não foi possível atualizar os dados da banca.";
    } finally {
      saveButton.disabled = false;
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.getElementById("profile-message");
    const button = form.querySelector("button[type=submit]");
    message.textContent = "Salvando...";
    button.disabled = true;
    try {
      const updated = await window.Backend.updateProfile({
        name: document.getElementById("profile-name").value.trim(),
        document: document.getElementById("profile-document").value.trim(),
      });
      window.Auth.user = updated;
      message.textContent = "Perfil atualizado.";
      if (buyerName) buyerName.textContent = updated.name || "Cliente Xepa";
      if (buyerAvatar) {
        buyerAvatar.textContent = String(updated.name || "Xepa")
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part.charAt(0))
          .join("")
          .toLocaleUpperCase("pt-BR");
      }
      if (buyerPersonalDetails) buyerPersonalDetails.open = false;
      document.getElementById("profile-type").textContent =
        updated.type === "comerciante" ? "Comerciante" : "Cliente";
    } catch (error) {
      console.error(error);
      message.textContent =
        "O perfil não foi salvo no Firebase. Verifique a conexão ou peça ao responsável pelo projeto para conferir o Firestore.";
    } finally {
      button.disabled = false;
    }
  });
  document
    .getElementById("profile-logout")
    .addEventListener("click", async () => {
      await window.Backend.logout();
      Router.go("login");
    });

  return () => {
    window.removeEventListener("resize", updateCropLayout);
    if (cropObjectUrl) URL.revokeObjectURL(cropObjectUrl);
    document.body.classList.remove("seller-image-editing");
  };
};
