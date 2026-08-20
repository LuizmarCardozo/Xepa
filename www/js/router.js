const Router = {
  routes: {
    home: "pages/home.html",
    login: "pages/login.html",
    cadastro: "pages/cadastro.html",
    ofertas: "pages/ofertas.html",
    produto: "pages/produto.html",
    feira: "pages/feira.html",
    perfil: "pages/perfil.html",
    criarOferta: "pages/criar-oferta.html",
    criarStory: "pages/criar-story.html",
    minhasOfertas: "pages/minhas-ofertas.html",
  },
  async go(route) {
    const file = this.routes[route] || this.routes.home;
    try {
      const html = await fetch(file).then((r) => {
        if (!r.ok) throw new Error("Página não encontrada");
        return r.text();
      });
      const renderedHtml = html.replace(
        /\$\{Components\.bottomNav\("([^"]+)"\)\}/g,
        (_, active) => Components.bottomNav(active),
      );
      document.getElementById("app").innerHTML = renderedHtml;
      document.body.classList.toggle(
        "auth-mode",
        route === "login" || route === "cadastro",
      );
      const fn =
        window[
          route === "criarOferta" ||
          route === "criarStory" ||
          route === "minhasOfertas"
            ? "ComerciantePage"
            : route.charAt(0).toUpperCase() + route.slice(1) + "Page"
        ];
      if (typeof fn === "function") fn();
      window.scrollTo(0, 0);
    } catch (e) {
      document.getElementById("app").innerHTML =
        `<div class="page"><div class="card"><h2>Ops!</h2><p>${e.message}</p><button class="btn btn-primary" onclick="Router.go('home')">Voltar</button></div></div>`;
    }
  },
};
