const Components = {
  bottomNav(active) {
    if (window.Auth?.user?.type === "comerciante" && active === "carteira") {
      return `
        <nav class="bottom-nav wallet-nav" aria-label="Navegação principal">
          <button class="nav-item" onclick="Router.go('home')"><img src="assets/nav-inicio.svg" alt=""><span>Início</span></button>
          <button class="nav-item" onclick="Router.goOffers()"><img src="assets/nav-produtos.svg" alt=""><span>Produtos</span></button>
          <button class="nav-item" onclick="Router.go('perfil')"><img src="assets/nav-banca.svg" alt=""><span>Banca</span></button>
          <button class="nav-item active" onclick="Router.go('carteira')"><img src="assets/nav-xepapay.svg" alt=""><span>Xepa pay</span></button>
        </nav>`;
    }

    if (window.Auth?.user?.type === "comerciante") {
      const activeTab =
        active === "minhasOfertas" || active === "ofertas"
          ? "products"
          : active === "perfil"
            ? "stall"
            : active === "carteira"
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
