const Components = {
  bottomNav(active) {
    return `
      <nav class="bottom-nav" aria-label="Navegação principal">
        <button class="nav-item ${active === "home" ? "active" : ""}" onclick="Router.go('home')" aria-label="Feira">🏪<span>Feira</span></button>
        <button class="nav-item ${active === "ofertas" ? "active" : ""}" onclick="Router.goOffers()" aria-label="Ofertas">🏷️<span>Ofertas</span></button>
        <button class="nav-item ${active === "pedidos" ? "active" : ""}" onclick="Router.go('pedidos')" aria-label="Pedidos">🧺<span>Pedidos</span></button>
        <button class="nav-item ${active === "perfil" ? "active" : ""}" onclick="Router.go('perfil')" aria-label="Perfil">👤<span>Perfil</span></button>
      </nav>
    `;
  },
};

window.Components = Components;
