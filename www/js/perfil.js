window.PerfilPage = function () {
  if (window.Auth?.user?.type === "comerciante") return `
    <main class="seller-account seller-profile">
      <div class="seller-profile-banner">banner exemplo</div>
      <div class="seller-profile-heading"><div class="seller-avatar-wrap"><img class="seller-profile-avatar" src="assets/banca-figma.png" alt=""><img class="seller-edit-mark" src="assets/perfil-lapis-grande.svg" alt=""></div><div class="seller-name-wrap"><img class="seller-edit-mark" src="assets/perfil-lapis-pequeno.svg" alt=""><h1 id="seller-profile-name">Banca exemplo</h1></div><button type="button" id="seller-profile-edit"><span>⌄</span> Alterar</button></div>
      <section class="seller-account-menu" aria-label="Configurações da banca">
        <details id="seller-personal"><summary><span class="seller-menu-icon">${sellerProfileIcon('document')}</span><div><strong>Dados da Pessoais</strong><small>Nome, telefone e endereço</small></div><i></i></summary>
          <form id="profile-form" class="seller-profile-form"><label for="profile-name">Nome</label><input id="profile-name" required maxlength="80"><label for="profile-email">E-mail</label><input id="profile-email" type="email" disabled><label for="profile-document">Telefone ou documento</label><input id="profile-document" maxlength="14"><button type="submit">Salvar perfil</button><p id="profile-message" role="status"></p><button id="profile-logout" class="seller-logout" type="button">Sair da conta</button></form>
        </details>
        ${sellerProfileRow('pin','Endereço de entrega','Gerencia seus endereços')}
        ${sellerProfileRow('card','Formas de pagamento','Cartões, Pix e carteiras digitais')}
        ${sellerProfileRow('bell','Notificações','Promoçoes, pedidos e novidades')}
        ${sellerProfileRow('shield','Privacidade e segurança','Seus dados protegidos')}
        ${sellerProfileRow('support','Ajuda e suporte','Fale conosco')}
      </section><span id="profile-type" hidden></span>
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
  const names = { document: 'document', pin: 'pin', card: 'card', bell: 'bell', shield: 'shield', support: 'support' };
  return `<img src="assets/perfil-${names[name]}.svg" alt="" aria-hidden="true">`;
}
function sellerProfileRow(icon, title, subtitle) {
  return `<div class="seller-menu-row" aria-disabled="true"><span class="seller-menu-icon">${sellerProfileIcon(icon)}</span><div><strong>${title}</strong><small>${subtitle}</small></div><i></i></div>`;
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
  if (sellerName) sellerName.textContent = user.name || "Minha banca";
  document.getElementById("seller-profile-edit")?.addEventListener("click", () => {
    document.getElementById("seller-personal").open = true;
    document.getElementById("profile-name").focus();
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
      if (sellerName) sellerName.textContent = updated.name || "Minha banca";
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
  document.getElementById("profile-logout").addEventListener("click", async () => {
    await window.Backend.logout();
    Router.go("login");
  });
};
