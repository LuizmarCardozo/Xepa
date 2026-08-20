const Auth = {
  user: JSON.parse(localStorage.getItem("xepa_user") || "null"),

  login(email, password) {
    if (!email || !password) return alert("Preencha e-mail e senha.");
    this.user = { name: "Usuário Xepa", email, type: "cliente" };
    localStorage.setItem("xepa_user", JSON.stringify(this.user));
    Router.go("home");
  },

  register(data) {
    this.user = data;
    localStorage.setItem("xepa_user", JSON.stringify(data));
    Router.go("home");
  },

  logout() {
    localStorage.removeItem("xepa_user");
    this.user = null;
    Router.go("login");
  },
};
