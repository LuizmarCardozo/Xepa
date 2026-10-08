const Components = {
  bottomNav(active) {
    if (window.Auth?.user?.type === "comerciante") {
      const activeTab =
        active === "minhasOfertas" || active === "ofertas"
          ? "products"
          : active === "perfil"
            ? "stall"
            : "home";
      return `
        <nav class="bottom-nav merchant-bottom-nav" aria-label="Navegação da banca">
          <button class="nav-item ${activeTab === "home" ? "active" : ""}" onclick="Router.go('home')" aria-label="Feira">
            <span class="nav-icon-wrap"><img src="assets/icone%20feira.png" alt="" /></span>
            <span class="nav-label">Feira</span>
          </button>
          <button class="nav-item ${activeTab === "products" ? "active" : ""}" onclick="Router.go('minhasOfertas')" aria-label="Produtos">
            <span class="nav-icon-wrap"><img src="assets/icone%20produtos.png" alt="" /></span>
            <span class="nav-label">Produtos</span>
          </button>
          <button class="nav-item ${activeTab === "stall" ? "active" : ""}" onclick="Router.go('perfil')" aria-label="Banca">
            <span class="nav-icon-wrap">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 10h18l-1.5-6h-15L3 10Z" />
                <path d="M5 10v10h14V10M9 20v-6h6v6M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
              </svg>
            </span>
            <span class="nav-label">Banca</span>
          </button>
        </nav>
      `;
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
      </nav>
    `;
  },
};

window.Components = Components;
