const Components = {
  topbar(title = "Xepa") {
    return `<header class="topbar"><img class="logo-image" src="assets/XEPPPA.png" alt="Xepa"><div style="display:flex;gap:8px"><button class="icon-btn" onclick="Router.go('perfil')">👤</button></div></header>`;
  },
  bottomNav(active = "home") {
    const items = [
      ["home", "⌂", "Início"],
      ["ofertas", "🛍️", "Ofertas"],
      ["feira", "📍", "Feiras"],
      ["perfil", "👤", "Perfil"],
    ];
    return `<nav class="bottom-nav"><div class="bottom-nav-inner">${items.map((i) => `<button class="nav-item ${active === i[0] ? "active" : ""}" onclick="Router.go('${i[0]}')"><span class="nav-icon">${i[1]}</span>${i[2]}</button>`).join("")}</div></nav>`;
  },
  story(name, icon) {
    return `<div class="story"><div class="story-avatar"><div>${icon}</div></div>${name}</div>`;
  },
  offer(o) {
    return `<article class="card offer-card"><div class="offer-image">${o.icon}</div><div class="offer-info"><div class="offer-name">${o.name}</div><div class="offer-meta">${o.unit} • ${o.feira}</div><div class="price">R$ ${o.price}</div></div></article>`;
  },
};
