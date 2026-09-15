// js/ofertas.js

// Array gerando 16 itens para montar a grade certinha da imagem
const mockOffers = Array.from({ length: 16 }).map((_, index) => ({
  id: index + 1,
  name: "Tomate organico",
  desc: "So folha",
  price: 8.0,
  oldPrice: 12.0,
  unit: "KG",
  icon: "../assets/imagem tomate.png",
}));

const formatPrice = (value) => value.toFixed(2).replace(".", ",");

function renderOfferCard(offer) {
  const oldPriceHTML = offer.oldPrice
    ? `<span class="old-price">R$ ${formatPrice(offer.oldPrice)}/${offer.unit}</span>`
    : "";

  return `
    <div class="offer-card" data-id="${offer.id}">
      <img class="offer-img" src="${offer.icon}" alt="${offer.name}" />
      <div class="offer-info">
        <h4 class="offer-name">${offer.name}</h4>
        <p class="offer-desc">${offer.desc}</p>
        <div class="offer-bottom">
          <div class="price-container">
            ${oldPriceHTML}
            <span class="new-price">R$ ${formatPrice(offer.price)}<span class="unit">/${offer.unit}</span></span>
          </div>
          <button class="add-btn" data-action="add-to-cart">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

function OfertasPageInit() {
  // Encontra o container dos produtos e injeta os 16 cards lá dentro
  const list = document.querySelector("[data-offers]");
  if (list && !list.children.length) {
    list.innerHTML = mockOffers.map(renderOfferCard).join("");
  }

  // Navegação visual do menu inferior
  document.querySelectorAll(".bottom-nav .nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = btn.getAttribute("data-page");
      if (page && typeof navigateTo === "function") {
        navigateTo(page);
      } else {
        document
          .querySelectorAll(".bottom-nav .nav-item")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      }
    });
  });
}

// Inicia assim que o HTML carregar
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", OfertasPageInit);
  } else {
    OfertasPageInit();
  }
}
