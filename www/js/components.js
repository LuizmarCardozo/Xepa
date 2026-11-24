const Components = {
  bottomNav(active) {
    if (window.Auth?.user?.type === "comerciante") {
      const activeTab =
        active === "minhasOfertas" || active === "ofertas"
          ? "products"
          : active === "perfil"
            ? "stall"
            : active === "carteira" || active === "resgatar"
              ? "wallet"
              : "home";
      return `
        <nav class="bottom-nav wallet-nav" aria-label="Navegação da banca">
          <button class="nav-item ${activeTab === "home" ? "active" : ""}" onclick="Router.go('home')" aria-label="Início">
            <img src="assets/nav-inicio.svg" alt=""><span>Início</span>
          </button>
          <button class="nav-item ${activeTab === "products" ? "active" : ""}" onclick="Router.goOffers()" aria-label="Produtos">
            <img src="assets/nav-produtos.svg" alt=""><span>Produtos</span>
          </button>
          <button class="nav-item ${activeTab === "stall" ? "active" : ""}" onclick="Router.go('perfil')" aria-label="Banca">
            <img src="assets/nav-banca.svg" alt=""><span>Banca</span>
          </button>
          <button class="nav-item ${activeTab === "wallet" ? "active" : ""}" onclick="Router.go('carteira')" aria-label="Xepa pay">
            <img src="assets/nav-xepapay.svg" alt=""><span>Xepa pay</span>
          </button>
        </nav>`;
    }

    const activeTab = active === "feira" ? "home" : active;
    return `
      <nav class="bottom-nav buyer-bottom-nav" aria-label="Navegação principal">
        <button class="nav-item ${activeTab === "home" ? "active" : ""}" onclick="Router.go('home')" aria-label="Feira">
          <span class="nav-icon-wrap"><img src="assets/icone%20feira.png" alt="" /></span>
          <span class="nav-label">Início</span>
        </button>
        <button class="nav-item ${activeTab === "ofertas" ? "active" : ""}" onclick="Router.goOffers()" aria-label="Ofertas">
          <span class="nav-icon-wrap"><img src="assets/icone%20ofertas.png" alt="" /></span>
          <span class="nav-label">Ofertas</span>
        </button>
        <button class="nav-item ${activeTab === "pedidos" ? "active" : ""}" onclick="Router.go('pedidos')" aria-label="Pedidos">
          <span class="nav-icon-wrap"><img src="assets/icone%20pedidos.png" alt="" /></span>
          <span class="nav-label">Pedidos</span>
        </button>
        <button class="nav-item ${activeTab === "perfil" ? "active" : ""}" onclick="Router.go('perfil')" aria-label="Perfil">
          <span class="nav-icon-wrap"><img src="assets/icoen%20perfil.png" alt="" /></span>
          <span class="nav-label">Perfil</span>
        </button>
      </nav>`;
  },
};

window.Components = Components;

// Quanto da parte de baixo do WebView fica escondido atrás da barra do
// sistema do Android (botões voltar/início). O Kodular não repassa o
// safe-area para o WebView, então env(safe-area-inset-bottom) vem 0 e o menu
// fixo cai atrás da barra. Se o app tiver esse problema e o valor real for
// diferente, defina window.XEPA_BOTTOM_INSET (em px) no js/config.js.
function readSafeAreaBottom() {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;left:0;bottom:0;width:0;height:0;visibility:hidden;" +
    "padding-bottom:env(safe-area-inset-bottom,0px)";
  document.body.appendChild(probe);
  const value = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
  probe.remove();
  return value;
}

function systemBottomInset() {
  if (typeof window.XEPA_BOTTOM_INSET === "number") {
    return Math.max(0, window.XEPA_BOTTOM_INSET);
  }
  const real = readSafeAreaBottom();
  if (real > 0) return real;
  const isAndroidWebView = /; wv\)/.test(navigator.userAgent);
  return isAndroidWebView ? 44 : 0;
}

function syncMobileNavigationViewport() {
  const viewport = window.visualViewport;
  const root = document.documentElement;
  // Se o WebView redimensiona o layout com o teclado, o inset é 0 (o menu já
  // sobe junto); se só o visual viewport encolher, o inset empurra o menu.
  const layoutHeight = root.clientHeight || window.innerHeight;
  const inset = viewport
    ? Math.max(
        0,
        Math.round(layoutHeight - viewport.height - viewport.offsetTop),
      )
    : 0;
  root.style.setProperty("--xepa-keyboard-inset", `${inset}px`);
  root.style.setProperty("--xepa-app-height", `${window.innerHeight}px`);
  // com o teclado aberto o menu já fica acima dele: não soma a barra do sistema
  root.style.setProperty(
    "--xepa-system-bottom",
    `${inset > 80 ? 0 : systemBottomInset()}px`,
  );
}

// ---- Menu persistente -------------------------------------------------
// O menu fica em #nav-root, irmão do #app. Assim nenhuma tela que faça
// app.innerHTML = ... (erro, "Carregando...", re-render) apaga o menu, e
// ancestrais com transform/animation não quebram o position: fixed.
Components.navRoot = function () {
  let root = document.getElementById("nav-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "nav-root";
    document.body.appendChild(root);
  }
  return root;
};

Components.mountNav = function (active, visible = true) {
  const root = Components.navRoot();
  root.innerHTML = visible ? Components.bottomNav(active) : "";
  Components.lastActive = active;
};

// Remove qualquer menu duplicado que uma tela escreva dentro do #app.
function removeStrayNavs() {
  const app = document.getElementById("app");
  if (app) app.querySelectorAll(".bottom-nav").forEach((n) => n.remove());
}

function startNavGuard() {
  const app = document.getElementById("app");
  if (!app) return;
  Components.navRoot();
  new MutationObserver(removeStrayNavs).observe(app, {
    childList: true,
    subtree: true,
  });
}
if (document.body) startNavGuard();
else document.addEventListener("DOMContentLoaded", startNavGuard);

if (window.visualViewport) {
  window.visualViewport.addEventListener(
    "resize",
    syncMobileNavigationViewport,
  );
  window.visualViewport.addEventListener(
    "scroll",
    syncMobileNavigationViewport,
  );
}
window.addEventListener("resize", syncMobileNavigationViewport);
window.addEventListener("orientationchange", () =>
  setTimeout(syncMobileNavigationViewport, 300),
);
// Teclado abrindo/fechando: a animação leva tempo, então reajusta algumas vezes.
["focusin", "focusout"].forEach((evt) => {
  document.addEventListener(evt, () => {
    [0, 100, 300, 600].forEach((t) =>
      setTimeout(syncMobileNavigationViewport, t),
    );
  });
});
syncMobileNavigationViewport();

// ---- Esconde o menu inferior enquanto o teclado está aberto -----------
(function setupKeyboardNavHide() {
  let baseline = 0;
  const vh = () =>
    (window.visualViewport && window.visualViewport.height) ||
    window.innerHeight;
  const isEditable = (el) => {
    if (!el) return false;
    if (el.isContentEditable) return true;
    const tag = el.tagName;
    if (tag === "TEXTAREA" || tag === "SELECT") return true;
    if (tag !== "INPUT") return false;
    return !/^(button|checkbox|radio|submit|reset|file|image|range|color)$/i.test(
      el.type,
    );
  };
  function update() {
    const h = vh();
    if (h > baseline) baseline = h;
    const shrunk = baseline - h > 120;
    const open = shrunk && isEditable(document.activeElement);
    document.body.classList.toggle("keyboard-open", open);
  }
  const burst = () =>
    [0, 100, 250, 500, 800].forEach((t) => setTimeout(update, t));
  document.addEventListener("focusin", burst);
  document.addEventListener("focusout", burst);
  window.addEventListener("resize", update);
  if (window.visualViewport)
    window.visualViewport.addEventListener("resize", update);
  window.addEventListener("orientationchange", () =>
    setTimeout(() => {
      baseline = 0;
      update();
    }, 400),
  );
  if (document.body) update();
  else document.addEventListener("DOMContentLoaded", update);
})();
