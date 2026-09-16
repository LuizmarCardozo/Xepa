const Components = {
  bottomNav(active) {
    return `
      <nav class="bottom-nav">
        <button class="nav-item ${active === "home" ? "active" : ""}" onclick="Router.go('home')">
          ${active === "home" ? '<div class="active-circle">🏪</div>' : "🏪"}
          <span>Feira</span>
        </button>
        <button class="nav-item" onclick="Router.goOffers()">
          🏷️ <span>Ofertas</span>
        </button>
        <button class="nav-item" onclick="Router.go('pedidos')">
          🧺 <span>Pedidos</span>
        </button>
        <button class="nav-item" onclick="Router.go('perfil')">
          👤 <span>Perfil</span>
        </button>
      </nav>
    `;
  },
};
