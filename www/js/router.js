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
    feiras: "pages/feiras.html",
    banca: "pages/banca.html",
    perfil: "pages/perfil.html",
    avaliacoes: "pages/avaliacoes.html",
    desempenho: "pages/desempenho.html",
    carteira: "pages/carteira.html",
    resgatar: "pages/resgatar.html",
    criarOferta: "pages/criar-oferta.html",
    criarStory: "pages/criar-story.html",
    minhasOfertas: "pages/minhas-ofertas.html",
    carrinho: "pages/carrinho.html",
  },

  current() {
    return currentRoute;
  },

  // Recarrega a tela atual (busca os dados de novo) sem mexer no histórico.
  // silent: mantém a posição da rolagem e não mostra "Carregando...".
  refresh(options = {}) {
    if (!currentRoute) return Promise.resolve();
    return this.go(currentRoute, { ...options, skipHistory: true });
  },

  goOffers() {
    this.go(
      window.Auth?.user?.type === "comerciante" ? "minhasOfertas" : "ofertas",
    );
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
    const merchantRoutes = new Set([
      "criarOferta",
      "criarStory",
      "minhasOfertas",
      "avaliacoes",
      "desempenho",
      "carteira",
      "resgatar",
    ]);
    if (!app) return;

    // Wait for auth to be ready before checking user state
    // This prevents redirect loops after Google OAuth redirect
    if (window.Backend?.ready) {
      try {
        await window.Backend.ready();
      } catch (error) {
        console.warn("Auth ready check failed:", error);
      }
    }

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
    if (
      merchantRoutes.has(route) &&
      window.Auth?.user?.type !== "comerciante"
    ) {
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

    // Ao trocar de tela, limpa estados de "tela cheia" que ficaram pendurados no
    // body (ex.: voltar pelo botão do Android com o detalhe do pedido aberto).
    // Eles escondem o menu e travam a rolagem; cada tela os liga de novo se precisar.
    document.body.classList.remove(
      "has-merchant-order-detail",
      "seller-image-editing",
    );

    const keepScroll = options.silent ? window.scrollY : null;
    if (options.silent) {
      app.style.minHeight = `${app.offsetHeight}px`;
    } else {
      app.innerHTML =
        '<main class="page"><p class="loading-state">Carregando...</p></main>';
    }
    try {
      const response = await fetch(file);
      if (navigationId !== navigationSequence) return;
      if (!response.ok)
        throw new Error(`Não foi possível abrir a tela (${response.status}).`);
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
      document.body.classList.toggle(
        "merchant-reviews",
        route === "avaliacoes",
      );

      const pageNames = {
        criarStory: "CriarStoryPage",
        minhasOfertas: "ComerciantePage",
        carrinho: "CarrinhoPage",
      };
      const pageName =
        pageNames[route] ||
        `${route.charAt(0).toUpperCase()}${route.slice(1)}Page`;
      const pageFunction = window[pageName];
      if (typeof pageFunction === "function") {
        const pageHtml = await pageFunction();
        if (navigationId !== navigationSequence) return;
        if (typeof pageHtml === "string" && pageHtml.trim())
          app.innerHTML = pageHtml;
      }

      const initName = pageNames[route]
        ? `${pageNames[route]}Init`
        : `${route.charAt(0).toUpperCase()}${route.slice(1)}PageInit`;
      const initFunction = window[initName];
      const cleanup =
        typeof initFunction === "function" ? await initFunction() : null;
      if (navigationId !== navigationSequence) {
        if (typeof cleanup === "function") cleanup();
        return;
      }
      if (typeof cleanup === "function") activePageCleanup = cleanup;

      const activeRoute =
        route === "carrinho" || route === "produto"
          ? "ofertas"
          : route === "banca"
            ? "home"
            : route;
      document.body.className = document.body.className
        .split(/\s+/)
        .filter((c) => c && !c.startsWith("route-"))
        .concat(`route-${route}`)
        .join(" ");
      app.querySelectorAll(".bottom-nav").forEach((n) => n.remove());
      Components.mountNav(activeRoute, !publicRoutes.has(route));

      app.style.minHeight = "";
      window.scrollTo(0, keepScroll ?? 0);
    } catch (error) {
      app.style.minHeight = "";
      if (navigationId !== navigationSequence) return;
      console.error(error);
      if (!publicRoutes.has(route)) {
        Components.mountNav(
          route === "carrinho" || route === "produto" ? "ofertas" : route,
          true,
        );
      }
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
