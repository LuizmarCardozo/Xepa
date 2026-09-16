// js/home.js

window.HomePage = function () {
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

  const isMerchant = window.Auth?.user?.type === "comerciante";
  if (isMerchant) {
    document.body.classList.add("merchant-home");
    document.querySelector("#home-products-title").textContent =
      "Minhas ofertas";
    document.querySelector(".home-products-section .link-green").textContent =
      "Ver painel";
    document
      .querySelector(".home-products-section .link-green")
      .addEventListener("click", (event) => {
        event.preventDefault();
        Router.go("minhasOfertas");
      });
  }

  // Injeta os itens no HTML
  const marketsContainer = document.querySelector("[data-markets]");
  if (marketsContainer) {
    marketsContainer.innerHTML = "";
  }

  const nearbyContainer = document.querySelector("[data-products-nearby]");
  if (nearbyContainer) {
    nearbyContainer.innerHTML = "";
  }

  const recentContainer = document.querySelector("[data-products-recent]");
  if (recentContainer) {
    recentContainer.innerHTML = "";
  }

  if (isMerchant && window.Backend?.getMyOffers) {
    window.Backend.getMyOffers()
      .then((offers) => {
        if (!nearbyContainer) return;
        if (offers.length === 0) {
          nearbyContainer.innerHTML =
            '<p class="home-empty">Você ainda não publicou ofertas.</p>';
          return;
        }
        nearbyContainer.innerHTML = offers.map(renderOfferCard).join("");
      })
      .catch((error) => {
        console.error(error);
        if (nearbyContainer) {
          nearbyContainer.innerHTML =
            '<p class="home-empty">Não foi possível carregar suas ofertas.</p>';
        }
      });
  }

  function renderOfferCard(offer) {
    const image = offer.image
      ? `<img class="product-img" src="${offer.image}" alt="${offer.name}" />`
      : '<div class="product-img product-img-placeholder">📦</div>';
    const price = Number(offer.price).toFixed(2).replace(".", ",");
    return `
      <article class="product-card">
        ${image}
        <div class="product-info">
          <h4 class="product-name">${offer.name}</h4>
          <p class="product-desc">${offer.desc || ""}</p>
          <span class="new-price">R$ ${price}<span class="unit">/${offer.unit}</span></span>
        </div>
      </article>
    `;
  }

  // LIGA OS BOTÕES DO MENU INFERIOR (Onde a mágica da navegação acontece)
  document.querySelectorAll(".bottom-nav .nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = btn.getAttribute("data-page");
      if (page && typeof Router !== "undefined") {
        page === "ofertas" ? Router.goOffers() : Router.go(page);
      }
    });
  });
};
