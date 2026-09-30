// js/auth.js
const Auth = {
  user: JSON.parse(localStorage.getItem("xepa_user") || "null"),
  users: JSON.parse(localStorage.getItem("xepa_users") || "[]"),

  login(email, password) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.users.find(
      (item) => item.email === normalizedEmail && item.password === password,
    );

    if (!user) {
      alert("E-mail ou senha incorretos.");
      return false;
    }

    this.user = { name: user.name, email: user.email, type: user.type };
    localStorage.setItem("xepa_user", JSON.stringify(this.user));
    Router.go("home");
    return true;
  },

  register(data) {
    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();

    if (!name || !email || !data.password || data.password.length < 6) {
      alert("Preencha os dados e use uma senha com pelo menos 6 caracteres.");
      return false;
    }

    if (this.users.some((item) => item.email === email)) {
      alert("Este e-mail já está cadastrado.");
      return false;
    }

    const newUser = { name, email, password: data.password, type: data.type };
    this.users.push(newUser);
    localStorage.setItem("xepa_users", JSON.stringify(this.users));
    this.user = { name, email, type: data.type };
    localStorage.setItem("xepa_user", JSON.stringify(this.user));
    Router.go("home");
    return true;
  },

  logout() {
    localStorage.removeItem("xepa_user");
    this.user = null;
    Router.go("login");
  },
};

/*
  Mantém a tela de login disponível mesmo se login.js não for incluído por
  alguma página antiga do projeto.
*/
function LoginPage() {
  return `
    <main class="auth-page">
      <div class="auth-brand">
        <img class="logo-image" src="assets/XEPPPA.png" alt="Xepa" />
        <p class="auth-brand-copy">Tudo o que você precisa,<br><strong>pertinho de você.</strong></p>
      </div>
      <img class="cesta-img" src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300" alt="Cesta" />

      <div class="auth-card">
        <h2>Bem-vindo de volta!</h2>
        <p class="sub">Entre na sua conta para continuar</p>
        <form id="login-form">
          <div class="input-group">
            <label>E-mail</label>
            <div class="input-wrapper">
              <span>✉️</span>
              <input type="email" id="email" placeholder="E-mail" required>
            </div>
          </div>
          <div class="input-group">
            <label>Senha</label>
            <div class="input-wrapper">
              <span>🔒</span>
              <input type="password" id="password" placeholder="Senha" required>
            </div>
          </div>
          <button type="submit" class="btn-primary">Entrar <span>→</span></button>
          <p class="register-link">Ainda não tem uma conta? <a href="#" onclick="event.preventDefault(); Router.go('cadastro')">criar conta</a></p>
        </form>
      </div>
    </main>
  `;
}
