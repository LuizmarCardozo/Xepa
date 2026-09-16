// js/ofertas.js

window.OfertasPage = async function () {
  const list = document.querySelector("[data-offers]");
  if (!list) return;

  list.innerHTML = "";
  if (!window.Backend || !window.Backend.getOffers) return;

  try {
    const offers = await window.Backend.getOffers();
    list.innerHTML = offers.map(renderOfferCard).join("");
  } catch (error) {
    console.error(error);
    list.innerHTML = "";
  }

  function renderOfferCard(offer) {
    const image = offer.image
      ? `<img class="product-img" src="${offer.image}" alt="${offer.name}" />`
      : "";
    const oldPrice = offer.oldPrice
      ? `<span class="old-price">R$ ${Number(offer.oldPrice).toFixed(2).replace(".", ",")}/${offer.unit}</span>`
      : "";

    return `
      <div class="product-card" data-id="${offer.id}">
        ${image}
        <div class="product-info">
          <h4 class="product-name">${offer.name}</h4>
          <p class="product-desc">${offer.desc || ""}</p>
          <div class="product-bottom">
            <div class="price-container">
              ${oldPrice}
              <span class="new-price">R$ ${Number(offer.price).toFixed(2).replace(".", ",")}<span class="unit">/${offer.unit}</span></span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // LIGA OS BOTÕES DO MENU INFERIOR
  document.querySelectorAll(".bottom-nav .nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = btn.getAttribute("data-page");
      if (page && typeof Router !== "undefined") {
        page === "ofertas" ? Router.goOffers() : Router.go(page);
      }
    });
  });
};
