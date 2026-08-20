const App = {
  init() {
    Router.go(Auth.user ? "home" : "login");
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());
