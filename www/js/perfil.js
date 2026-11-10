window.PerfilPage = function () {
  if (window.Auth?.user?.type === "comerciante")
    return `
    <main class="seller-account seller-profile">
      <div class="seller-profile-banner" aria-hidden="true"></div>
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
        <p id="seller-details-message" role="status"></p>
        <div class="seller-details-actions">
          <button type="button" class="seller-edit-cancel" data-cancel-seller-edit>Cancelar</button>
          <button type="submit">Salvar alterações</button>
        </div>
      </form>
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
    <main class="page commerce-page">
      <header class="page-heading"><div><h1>Meu perfil</h1><p>Seus dados no Xepa.</p></div></header>
      <section class="card profile-card">
        <div class="profile-avatar">👤</div>
        <p class="eyebrow">Conta <span id="profile-type"></span></p>
        <form id="profile-form" class="commerce-form">
          <label class="form-label" for="profile-name">Nome</label>
          <input id="profile-name" class="form-input" type="text" required maxlength="80">
          <label class="form-label" for="profile-email">E-mail</label>
          <input id="profile-email" class="form-input" type="email" disabled>
          <label class="form-label" for="profile-document">Telefone ou documento</label>
          <input id="profile-document" class="form-input" type="text" maxlength="14">
          <button class="btn btn-primary btn-full" type="submit">Salvar perfil</button>
          <p id="profile-message" role="status"></p>
        </form>
        <button id="profile-logout" class="btn btn-outline btn-full" type="button">Sair da conta</button>
      </section>
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

function compressSellerProfileImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () =>
        reject(new Error("A imagem selecionada é inválida."));
      image.onload = () => {
        const maxSize = 800;
        const scale = Math.min(
          1,
          maxSize / Math.max(image.width, image.height),
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Não foi possível processar a imagem."));
          return;
        }
        try {
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        } catch (error) {
          reject(error);
        }
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
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
  const sellerName = document.getElementById("seller-profile-name");
  const sellerAvatar = document.getElementById("seller-profile-avatar");
  const sellerDetailsForm = document.getElementById("seller-details-form");
  const stallNameInput = document.getElementById("seller-stall-name");
  const sellerPhotoInput = document.getElementById("seller-photo-input");
  const sellerDetailsMessage = document.getElementById(
    "seller-details-message",
  );
  const fallbackStallName = "Banca com nome não cadastrado";
  let selectedProfileImage = null;

  if (sellerName) {
    sellerName.textContent = user.stallName || fallbackStallName;
  }
  if (sellerAvatar && user.stallImage) sellerAvatar.src = user.stallImage;
  if (stallNameInput) stallNameInput.value = user.stallName || "";

  const openSellerDetails = (focusName = false) => {
    if (!sellerDetailsForm) return;
    sellerDetailsForm.hidden = false;
    sellerDetailsMessage.textContent = "";
    if (focusName) stallNameInput.focus();
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
    .querySelector("[data-cancel-seller-edit]")
    ?.addEventListener("click", () => {
      sellerDetailsForm.hidden = true;
      sellerDetailsMessage.textContent = "";
      selectedProfileImage = null;
      sellerPhotoInput.value = "";
      stallNameInput.value = window.Auth.user?.stallName || "";
      sellerAvatar.src =
        window.Auth.user?.stallImage || "assets/banca-figma.png";
    });

  sellerPhotoInput?.addEventListener("change", async () => {
    const file = sellerPhotoInput.files?.[0];
    if (!file) return;
    openSellerDetails();
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      sellerDetailsMessage.textContent = "Escolha uma imagem JPG, PNG ou WEBP.";
      sellerPhotoInput.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      sellerDetailsMessage.textContent = "A imagem deve ter no máximo 5 MB.";
      sellerPhotoInput.value = "";
      return;
    }

    try {
      selectedProfileImage = await compressSellerProfileImage(file);
      sellerAvatar.src = selectedProfileImage;
      sellerDetailsMessage.textContent =
        "Prévia da foto atualizada. Salve para aplicar.";
      openSellerDetails();
    } catch (error) {
      console.error(error);
      sellerDetailsMessage.textContent =
        "Não foi possível abrir essa imagem. Tente escolher outra.";
      sellerPhotoInput.value = "";
    }
  });

  sellerDetailsForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const saveButton = sellerDetailsForm.querySelector('button[type="submit"]');
    saveButton.disabled = true;
    sellerDetailsMessage.textContent = "Salvando alterações...";
    try {
      const updated = await window.Backend.updateSellerProfile({
        stallName: stallNameInput.value,
        profileImage: selectedProfileImage,
      });
      if (sellerName) {
        sellerName.textContent = updated.stallName || fallbackStallName;
      }
      if (sellerAvatar && updated.stallImage) {
        sellerAvatar.src = updated.stallImage;
      }
      selectedProfileImage = null;
      sellerPhotoInput.value = "";
      sellerDetailsMessage.textContent = "Dados da banca atualizados.";
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
};
