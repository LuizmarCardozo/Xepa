let navigationSequence = 0;
let activePageCleanup = null;
let currentRoute = null;
let currentHistoryIndex = 0;

const Router = {
  routes: {
    home: "pages/home.html",
    login: "pages/login.html",
    cadastro: "pages/cadastro.html",
    ofertas: "pages/ofertas.html",
    pedidos: "pages/pedidos.html",
    produto: "pages/produto.html",
    feira: "pages/feira.html",
    perfil: "pages/perfil.html",
    criarOferta: "pages/criar-oferta.html",
    criarStory: "pages/criar-story.html",
    minhasOfertas: "pages/minhas-ofertas.html",
    carrinho: "pages/carrinho.html",
  },

  goOffers() {
    this.go(window.Auth?.user?.type === "comerciante" ? "minhasOfertas" : "ofertas");
  },

  back(fallbackRoute = "home") {
    if (currentHistoryIndex > 0) {
      window.history.back();
      return;
    }
    return this.go(fallbackRoute, { replaceHistory: true });
  },

  async go(route, options = {}) {
    const navigationId = ++navigationSequence;
    const app = document.getElementById("app");
    const publicRoutes = new Set(["login", "cadastro"]);
    const merchantRoutes = new Set(["criarOferta", "criarStory", "minhasOfertas"]);
    if (!app) return;

    if (!publicRoutes.has(route) && !window.Auth?.user) {
      if (route !== "login") {
        return this.go(
          "login",
          options.skipHistory ? { ...options, replaceHistory: true } : {},
        );
      }
    }
    if (publicRoutes.has(route) && window.Auth?.user) {
      return this.go(
        "home",
        options.skipHistory ? { ...options, replaceHistory: true } : {},
      );
    }
    if (merchantRoutes.has(route) && window.Auth?.user?.type !== "comerciante") {
      return this.go(
        "home",
        options.skipHistory ? { ...options, replaceHistory: true } : {},
      );
    }

    const file = this.routes[route];
    if (!file) {
      app.innerHTML = `<main class="page"><section class="card"><h2>Tela ainda não disponível</h2><p>Volte para a feira e continue navegando.</p><button class="btn btn-primary" onclick="Router.go('home')">Ir para a feira</button></section></main>`;
      return;
    }

    if (options.replaceHistory) {
      window.history.replaceState(
        { xepaRoute: route, xepaIndex: currentHistoryIndex },
        "",
        window.location.href,
      );
    } else if (!options.skipHistory && currentRoute && currentRoute !== route) {
      currentHistoryIndex += 1;
      window.history.pushState(
        { xepaRoute: route, xepaIndex: currentHistoryIndex },
        "",
        window.location.href,
      );
    } else if (!currentRoute) {
      currentHistoryIndex = 0;
      window.history.replaceState(
        { xepaRoute: route, xepaIndex: currentHistoryIndex },
        "",
        window.location.href,
      );
    }
    currentRoute = route;

    if (typeof activePageCleanup === "function") {
      activePageCleanup();
      activePageCleanup = null;
    }

    app.innerHTML = '<main class="page"><p class="loading-state">Carregando...</p></main>';
    try {
      const response = await fetch(file);
      if (navigationId !== navigationSequence) return;
      if (!response.ok) throw new Error(`Não foi possível abrir a tela (${response.status}).`);
      const html = await response.text();
      if (navigationId !== navigationSequence) return;
      const renderedHtml = html
        .replace(/\$\{Components\.bottomNav\("([^"]+)"\)\}/g, (_, active) =>
          Components.bottomNav(active),
        )
        .replace(/<link\s+rel=["']stylesheet["'][^>]*>/gi, "")
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
      app.innerHTML = renderedHtml;
      document.body.classList.toggle(
        "auth-mode",
        route === "login" || route === "cadastro",
      );
      document.body.classList.toggle(
        "merchant-mode",
        window.Auth?.user?.type === "comerciante",
      );
      document.body.classList.toggle(
        "merchant-home",
        route === "home" && window.Auth?.user?.type === "comerciante",
      );

      const pageNames = {
        criarStory: "CriarStoryPage",
        minhasOfertas: "ComerciantePage",
        carrinho: "CarrinhoPage",
      };
      const pageName = pageNames[route] || `${route.charAt(0).toUpperCase()}${route.slice(1)}Page`;
      const pageFunction = window[pageName];
      if (typeof pageFunction === "function") {
        const pageHtml = await pageFunction();
        if (navigationId !== navigationSequence) return;
        if (typeof pageHtml === "string" && pageHtml.trim()) app.innerHTML = pageHtml;
      }

      const initName = pageNames[route]
        ? `${pageNames[route]}Init`
        : `${route.charAt(0).toUpperCase()}${route.slice(1)}PageInit`;
      const initFunction = window[initName];
      const cleanup = typeof initFunction === "function"
        ? await initFunction()
        : null;
      if (navigationId !== navigationSequence) {
        if (typeof cleanup === "function") cleanup();
        return;
      }
      if (typeof cleanup === "function") activePageCleanup = cleanup;

      const activeRoute = route === "carrinho" || route === "produto" ? "ofertas" : route;
      const nav = app.querySelector(".bottom-nav");
      if (nav) nav.outerHTML = Components.bottomNav(activeRoute);
      else if (!publicRoutes.has(route)) app.insertAdjacentHTML("beforeend", Components.bottomNav(activeRoute));

      window.scrollTo(0, 0);
    } catch (error) {
      if (navigationId !== navigationSequence) return;
      console.error(error);
      app.innerHTML = `<main class="page"><section class="card error-state"><h2>Não foi possível abrir esta tela</h2><p>${error.message}</p><button class="btn btn-primary" onclick="Router.go('home')">Tentar novamente</button></section></main>`;
    }
  },
};

window.Router = Router;

window.addEventListener("popstate", (event) => {
  const { xepaRoute, xepaIndex } = event.state || {};
  if (!Router.routes[xepaRoute]) return;

  currentHistoryIndex = Number.isInteger(xepaIndex) ? xepaIndex : 0;
  Router.go(xepaRoute, { skipHistory: true });
});
