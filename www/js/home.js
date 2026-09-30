// js/home.js

const HOME_HTML_ESCAPE = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};

function homeEscapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => HOME_HTML_ESCAPE[character]);
}

function homeImageUrl(value) {
  if (!value) return "";
  const source = String(value);
  if (source.startsWith("data:image/")) return source;
  try {
    const url = new URL(source, window.location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function homeImageMarkup(url, alt, className, placeholder = "🥬") {
  const safeUrl = homeImageUrl(url);
  return safeUrl
    ? `<img class="${className}" src="${homeEscapeHtml(safeUrl)}" alt="${homeEscapeHtml(alt)}" loading="lazy" />`
    : `<div class="${className} product-img-placeholder" aria-hidden="true">${placeholder}</div>`;
}

function homeMoney(value) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0,00";
}

function homeMessage(container, message, className = "home-empty") {
  if (!container) return;
  container.innerHTML = `<p class="${className}">${homeEscapeHtml(message)}</p>`;
}

window.HomePage = function () {
  const userName =
    (typeof window.Auth !== "undefined" &&
      window.Auth.user &&
      window.Auth.user.name) ||
    "usuário";
  const greetingElement = document.getElementById("user-greeting");
  if (greetingElement) {
    greetingElement.textContent = `Olá, ${userName} 👋`;
  }

  const isMerchant = window.Auth?.user?.type === "comerciante";
  const marketsContainer = document.querySelector("[data-markets]");
  const nearbyContainer = document.querySelector("[data-products-nearby]");
  const recentContainer = document.querySelector("[data-products-recent]");
  const searchInput = document.querySelector(".search-wrapper input");
  let homeOffers = [];
  const offersById = new Map();

  if (searchInput && typeof window.mountCartShortcut === "function") {
    window.mountCartShortcut(searchInput.parentElement);
  }

  document.querySelectorAll(".home-categories-section .category-item").forEach((item) => {
    item.tabIndex = 0;
    item.setAttribute("role", "button");
    const applyCategory = () => {
      const category = item.querySelector(".category-label")?.textContent?.trim();
      if (!category || !searchInput) return;
      searchInput.value = category;
      renderHomeOffers(category);
    };
    item.addEventListener("click", applyCategory);
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        applyCategory();
      }
    });
  });

  const notificationButton = document.querySelector(".bell-btn");
  if (notificationButton) {
    notificationButton.setAttribute("aria-label", "Ver pedidos");
    notificationButton.addEventListener("click", () => window.Router?.go("pedidos"));
    const badge = notificationButton.querySelector(".bell-badge");
    if (badge) badge.hidden = true;
  }

  const categoriesLink = document.querySelector(".home-categories-section .link-green");
  if (categoriesLink) {
    categoriesLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.Router?.go("ofertas");
    });
  }
  const storiesLink = document.querySelector(".home-markets-section .link-green");
  if (storiesLink) {
    storiesLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.Router?.go("feira");
    });
  }
  const moreOffersLink = document.querySelector(".home-recent-section .link-green");
  if (moreOffersLink) {
    moreOffersLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.Router?.go("ofertas");
    });
  }

  if (isMerchant) {
    document.body.classList.add("merchant-home");
    const title = document.querySelector("#home-products-title");
    const panelLink = document.querySelector(".home-products-section .link-green");
    if (title) title.textContent = "Minhas ofertas";
    if (panelLink) {
      panelLink.textContent = "Ver painel";
      panelLink.addEventListener("click", (event) => {
        event.preventDefault();
        window.Router?.go("minhasOfertas");
      });
    }
  }

  const productsLink = document.querySelector(".home-products-section .link-green");
  if (productsLink && !isMerchant) {
    productsLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.Router?.go("ofertas");
    });
  }

  if (!isMerchant) {
    homeMessage(marketsContainer, "Carregando novidades das feiras...", "loading-state home-empty");
    homeMessage(nearbyContainer, "Carregando ofertas...", "loading-state home-empty");
    homeMessage(recentContainer, "Carregando ofertas...", "loading-state home-empty");
  } else if (nearbyContainer) {
    homeMessage(nearbyContainer, "Carregando suas ofertas...", "loading-state home-empty");
  }

  function openOffer(offer) {
    if (!offer?.id || typeof window.Router?.go !== "function") return;
    sessionStorage.setItem("xepa-current-offer", offer.id);
    window.Router.go("produto");
  }

  function renderOfferCard(offer, withCart = true) {
    const id = homeEscapeHtml(offer.id);
    const name = homeEscapeHtml(offer.name || "Oferta");
    const unit = homeEscapeHtml(offer.unit || "unidade");
    const description = homeEscapeHtml(offer.desc || "Produto fresco à venda.");
    const image = homeImageMarkup(offer.image, offer.name || "Oferta", "product-img");
    const cartButton = withCart
      ? `<button class="add-btn" data-add-offer="${id}" type="button" aria-label="Adicionar ${name} ao carrinho">+</button>`
      : "";
    return `
      <article class="product-card" data-offer-id="${id}" tabindex="0" role="button" aria-label="Ver ${name}">
        ${image}
        <div class="product-info">
          <h4 class="product-name">${name}</h4>
          <p class="product-desc">${description}</p>
          <div class="product-bottom">
            <span class="new-price">R$ ${homeMoney(offer.price)}<span class="unit">/${unit}</span></span>
            ${cartButton}
          </div>
        </div>
      </article>
    `;
  }

  function bindOfferInteractions(container) {
    if (!container) return;
    container.querySelectorAll("[data-offer-id]").forEach((card) => {
      const open = () => openOffer(offersById.get(card.dataset.offerId));
      card.addEventListener("click", (event) => {
        if (event.target.closest("[data-add-offer]")) return;
        open();
      });
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });
    });
    container.querySelectorAll("[data-add-offer]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const offer = offersById.get(button.dataset.addOffer);
        if (offer && typeof window.Cart?.add === "function") window.Cart.add(offer);
      });
    });
  }

  function renderHomeOffers(searchTerm = "") {
    const normalizedTerm = searchTerm.trim().toLocaleLowerCase("pt-BR");
    const filteredOffers = homeOffers.filter((offer) => {
      if (!normalizedTerm) return true;
      return [offer.name, offer.desc, offer.category, offer.ownerName]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("pt-BR").includes(normalizedTerm));
    });

    if (!filteredOffers.length) {
      homeMessage(nearbyContainer, normalizedTerm ? "Nenhuma oferta encontrada." : "Nenhuma oferta disponível no momento.");
      homeMessage(recentContainer, normalizedTerm ? "Nenhuma oferta encontrada." : "Nenhuma oferta disponível no momento.");
      return;
    }

    const nearbyOffers = filteredOffers.slice(0, 4);
    const additionalOffers = filteredOffers.slice(4, 8);
    if (nearbyContainer) {
      nearbyContainer.innerHTML = nearbyOffers.map((offer) => renderOfferCard(offer)).join("");
      bindOfferInteractions(nearbyContainer);
    }
    if (recentContainer) {
      if (additionalOffers.length) {
        recentContainer.innerHTML = additionalOffers.map((offer) => renderOfferCard(offer)).join("");
        bindOfferInteractions(recentContainer);
      } else {
        homeMessage(
          recentContainer,
          normalizedTerm ? "Nenhuma outra oferta encontrada." : "Não há outras ofertas disponíveis no momento.",
        );
      }
    }
  }

  function renderStory(story) {
    const ownerName = homeEscapeHtml(story.ownerName || "Feira local");
    const text = homeEscapeHtml(story.text || "Confira as novidades desta feira.");
    const image = homeImageMarkup(story.image, story.ownerName || "Feira local", "market-img", "📸");
    return `
      <article class="market-card">
        <div class="market-img-wrap">
          ${image}
          <span class="market-badge">Novidade</span>
        </div>
        <div class="market-info">
          <h4>${ownerName}</h4>
          <p>${text}</p>
          <div class="rating"><span class="rating-count">Atualização recente</span></div>
        </div>
      </article>
    `;
  }

  function renderStories(stories) {
    if (!marketsContainer) return;
    if (!stories.length) {
      homeMessage(marketsContainer, "Nenhuma novidade publicada pelas feiras.");
      return;
    }
    marketsContainer.innerHTML = stories.slice(0, 8).map(renderStory).join("");
  }

  function loadMerchantOffers() {
    if (!nearbyContainer) return;
    if (typeof window.Backend?.getMyOffers !== "function") {
      homeMessage(nearbyContainer, "Não foi possível carregar suas ofertas.");
      return;
    }
    Promise.resolve()
      .then(() => window.Backend.getMyOffers())
      .then((offers) => {
        const availableOffers = Array.isArray(offers) ? offers : [];
        availableOffers.forEach((offer) => offersById.set(String(offer.id), offer));
        if (!availableOffers.length) {
          homeMessage(nearbyContainer, "Você ainda não publicou ofertas.");
          return;
        }
        nearbyContainer.innerHTML = availableOffers.map((offer) => renderOfferCard(offer, false)).join("");
        bindOfferInteractions(nearbyContainer);
      })
      .catch((error) => {
        console.error(error);
        homeMessage(nearbyContainer, "Não foi possível carregar suas ofertas.");
      });
  }

  function loadClientData() {
    const backend = window.Backend;
    if (typeof backend?.getOffers !== "function") {
      homeMessage(nearbyContainer, "Não foi possível carregar as ofertas.");
      homeMessage(recentContainer, "Não foi possível carregar as ofertas.");
    } else {
      Promise.resolve()
        .then(() => backend.getOffers())
        .then((offers) => {
          homeOffers = Array.isArray(offers) ? offers : [];
          homeOffers.forEach((offer) => offersById.set(String(offer.id), offer));
          renderHomeOffers(searchInput?.value || "");
        })
        .catch((error) => {
          console.error(error);
          homeMessage(nearbyContainer, "Não foi possível carregar as ofertas.");
          homeMessage(recentContainer, "Não foi possível carregar as ofertas.");
        });
    }

    if (typeof backend?.getStories !== "function") {
      homeMessage(marketsContainer, "Não foi possível carregar as novidades das feiras.");
    } else {
      Promise.resolve()
        .then(() => backend.getStories())
        .then((stories) => renderStories(Array.isArray(stories) ? stories : []))
        .catch((error) => {
          console.error(error);
          homeMessage(marketsContainer, "Não foi possível carregar as novidades das feiras.");
        });
    }
  }

  if (searchInput && !isMerchant) {
    searchInput.addEventListener("input", () => renderHomeOffers(searchInput.value));
  }

  if (isMerchant) loadMerchantOffers();
  else loadClientData();

  document.querySelectorAll(".bottom-nav .nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      const page = button.getAttribute("data-page");
      if (page && typeof window.Router?.go === "function") {
        page === "ofertas" ? window.Router.goOffers() : window.Router.go(page);
      }
    });
  });
};
