window.PerfilPage = function () {
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

window.PerfilPageInit = function () {
  const user = window.Auth?.user;
  const form = document.getElementById("profile-form");
  if (!user || !form) return;
  document.getElementById("profile-name").value = user.name || "";
  document.getElementById("profile-email").value = user.email || "";
  document.getElementById("profile-document").value = user.document || "";
  document.getElementById("profile-type").textContent =
    user.type === "comerciante" ? "Comerciante" : "Cliente";
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
  document.getElementById("profile-logout").addEventListener("click", async () => {
    await window.Backend.logout();
    Router.go("login");
  });
};
