// js/router.js
const Router = {
  routes: {
    home: "pages/home.html",
    login: "pages/login.html",
    cadastro: "pages/cadastro.html",
    ofertas: "pages/ofertas.html",
    pedidos: "pages/pedidos.html", // ROTA DE PEDIDOS ADICIONADA AQUI!
    produto: "pages/produto.html",
    feira: "pages/feira.html",
    perfil: "pages/perfil.html",
    criarOferta: "pages/criar-oferta.html",
    criarStory: "pages/criar-story.html",
    minhasOfertas: "pages/minhas-ofertas.html",
  },
  goOffers() {
    const userType = window.Auth && window.Auth.user && window.Auth.user.type;
    this.go(userType === "comerciante" ? "criarOferta" : "ofertas");
  },
  async go(route) {
    const file = this.routes[route];

    // Se a página não existir, mostra um aviso em vez de travar o app
    if (!file) {
      document.getElementById("app").innerHTML =
        `<div class="page" style="padding: 40px 20px; text-align: center;"><h2 style="color: #219653;">Página em construção 🚧</h2><p style="color: #777; margin-top: 10px;">A tela de <b>${route}</b> estará disponível em breve!</p><br><button style="padding: 10px 20px; background: #219653; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;" onclick="Router.go('home')">Voltar para o Início</button></div>`;
      return;
    }

    try {
      const html = await fetch(file).then((r) => {
        if (!r.ok) throw new Error("Página não encontrada");
        return r.text();
      });
      const renderedHtml = html
        .replace(/\$\{Components\.bottomNav\("([^"]+)"\)\}/g, (_, active) =>
          Components.bottomNav(active),
        )
        .replace(/<link\s+rel=["']stylesheet["'][^>]*>/gi, "");
      document.getElementById("app").innerHTML = renderedHtml;

      document.body.classList.toggle(
        "auth-mode",
        route === "login" || route === "cadastro",
      );

      const fn =
        window[
          route === "criarStory" || route === "minhasOfertas"
            ? "ComerciantePage"
            : route.charAt(0).toUpperCase() + route.slice(1) + "Page"
        ];

      if (typeof fn === "function") {
        const pageHtml = fn();
        if (typeof pageHtml === "string" && pageHtml.trim()) {
          document.getElementById("app").innerHTML = pageHtml;
        }
      }

      const initFn =
        window[route.charAt(0).toUpperCase() + route.slice(1) + "PageInit"];
      if (typeof initFn === "function") {
        initFn();
      }
      window.scrollTo(0, 0);
    } catch (e) {
      document.getElementById("app").innerHTML =
        `<div class="page" style="padding: 40px 20px; text-align: center;"><div class="card"><h2 style="color: #c63c3c;">Ops! 🚧</h2><p style="color: #777; margin-top: 10px;">${e.message}</p><br><button style="padding: 10px 20px; background: #219653; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;" onclick="Router.go('home')">Voltar para o Início</button></div></div>`;
    }
  },
};
