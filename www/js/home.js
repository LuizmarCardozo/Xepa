// js/home.js

window.HomePage = function () {
  const formatPrice = (value) => value.toFixed(2).replace(".", ",");

  const mockTomatoes = Array.from({ length: 4 }).map((_, index) => ({
    id: index + 1,
    name: "Tomate organico",
    desc: "So folha",
    price: 8.0,
    unit: "KG",
    icon: "assets/imagem tomate.png",
  }));

  const mockMarkets = [
    {
      id: 1,
      name: "Feira exemplo",
      distance: "2,3 km de você",
      status: "Aberto · 07h às 13h",
      ratingCount: "+24",
      img: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: 2,
      name: "Feira exemplo",
      distance: "2,3 km de você",
      status: "Aberto · 07h às 13h",
      ratingCount: "+24",
      img: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: 3,
      name: "Feira exemplo",
      distance: "2,3 km de você",
      status: "Aberto · 07h às 13h",
      ratingCount: "+24",
      img: "https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&q=80&w=400",
    },
  ];

  function renderProductCard(product) {
    return `
      <div class="product-card" data-id="${product.id}">
        <img class="product-img" src="${product.icon}" alt="${product.name}" />
        <div class="product-info">
          <h4 class="product-name">${product.name}</h4>
          <p class="product-desc">${product.desc}</p>
          <div class="product-bottom">
            <div class="price-container">
              <span class="new-price">R$ ${formatPrice(product.price)}<span class="unit">/${product.unit}</span></span>
            </div>
            <button class="add-btn" data-action="add-to-cart">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderMarketCard(market) {
    return `
      <div class="market-card">
        <div class="market-img-wrap">
          <img class="market-img" src="${market.img}" alt="Feira">
          <span class="market-badge">${market.status}</span>
        </div>
        <div class="market-info">
          <h4>${market.name}</h4>
          <p>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            ${market.distance}
          </p>
          <div class="rating">
            <div class="rating-dots">
              <span></span><span></span><span></span><span></span>
            </div>
            <span class="rating-count">${market.ratingCount}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Puxa o nome do Firebase
  const userName =
    (typeof window.Auth !== "undefined" &&
      window.Auth.user &&
      window.Auth.user.name) ||
    "usuário";
  const greetingElement = document.getElementById("user-greeting");
  if (greetingElement && !greetingElement.innerText.includes(userName)) {
    greetingElement.innerHTML = `Olá, ${userName} 👋`;
  }

  // Injeta os itens no HTML
  const marketsContainer = document.querySelector("[data-markets]");
  if (marketsContainer) {
    marketsContainer.innerHTML = mockMarkets.map(renderMarketCard).join("");
  }

  const nearbyContainer = document.querySelector("[data-products-nearby]");
  if (nearbyContainer) {
    nearbyContainer.innerHTML = mockTomatoes.map(renderProductCard).join("");
  }

  const recentContainer = document.querySelector("[data-products-recent]");
  if (recentContainer) {
    recentContainer.innerHTML = mockTomatoes.map(renderProductCard).join("");
  }

  // LIGA OS BOTÕES DO MENU INFERIOR (Onde a mágica da navegação acontece)
  document.querySelectorAll(".bottom-nav .nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = btn.getAttribute("data-page");
      if (page && typeof Router !== "undefined") {
        Router.go(page);
      }
    });
  });
};
