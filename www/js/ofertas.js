// Exibe ofertas e aplica os filtros da tela de produtos.
// js/ofertas.js

const OFFERS_HTML_ESCAPE = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};

function offersEscapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => OFFERS_HTML_ESCAPE[character]);
}

function offersImageUrl(value) {
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

function offersImageMarkup(url, alt) {
  const safeUrl = offersImageUrl(url);
  return safeUrl
    ? `<img class="product-img" src="${offersEscapeHtml(safeUrl)}" alt="${offersEscapeHtml(alt)}" loading="lazy" />`
    : '<div class="product-img product-img-placeholder" aria-hidden="true">🥬</div>';
}

function offersMoney(value) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0,00";
}

function offersNormalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

window.OfertasPage = async function () {
  const list = document.querySelector("[data-offers]");
  if (!list) return;

  const searchInput =
    document.querySelector(".search-wrapper-ofertas input") ||
    document.querySelector("[data-offers] input");
  if (searchInput && typeof window.mountCartShortcut === "function") {
    window.mountCartShortcut(searchInput.parentElement);
  }
  const filterButtons = Array.from(document.querySelectorAll(".filters .filter"));
  const categoryItems = Array.from(document.querySelectorAll(".categories-scroll .category-item"));
  const offersById = new Map();
  let allOffers = [];
  let query = "";
  let activeFilter = "recommended";
  let selectedCategory = "";
  let buyerLocation = null;
  let locationError = "";
  let locationRequestActive = false;

  function setListMessage(message, className = "home-empty") {
    list.innerHTML = `<p class="${className}">${offersEscapeHtml(message)}</p>`;
  }

  function openOffer(offerId) {
    const offer = offersById.get(offerId);
    if (!offer || typeof window.Router?.go !== "function") return;
    sessionStorage.setItem("xepa-current-offer", offer.id);
    window.Router.go("produto");
  }

  function renderOfferCard(offer) {
    const id = offersEscapeHtml(offer.id);
    const name = offersEscapeHtml(offer.name || "Oferta");
    const unit = offersEscapeHtml(offer.unit || "unidade");
    const distance = activeFilter === "nearby" ? distanceOf(offer) : null;
    const distanceLabel = distance === null
      ? ""
      : distance < 1
        ? ` · ${Math.round(distance * 1000)} m de você`
        : ` · ${distance.toFixed(1).replace(".", ",")} km de você`;
    const description = offersEscapeHtml(
      `${offer.desc || "Produto fresco à venda."}${distanceLabel}`,
    );
    const seller = offer.ownerName ? ` · ${offersEscapeHtml(offer.ownerName)}` : "";
    const stallLocation = offer.stallLocation || {};
    const city = [stallLocation.city, stallLocation.state]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join(", ");
    const marketLocation = [
      stallLocation.marketName,
      city,
      stallLocation.reference,
    ]
      .filter((value) => String(value || "").trim())
      .map(offersEscapeHtml)
      .join(" · ");
    const hasOldPrice =
      offer.oldPrice !== null && offer.oldPrice !== undefined && offer.oldPrice !== "";
    const oldPriceNumber = hasOldPrice ? Number(offer.oldPrice) : NaN;
    const oldPrice = Number.isFinite(oldPriceNumber)
      ? `<span class="old-price">R$ ${offersMoney(oldPriceNumber)}/${unit}</span>`
      : "";
    return `
      <article class="product-card" data-offer-id="${id}" tabindex="0" role="button" aria-label="Ver ${name}">
        ${offersImageMarkup(offer.image, offer.name || "Oferta")}
        <div class="product-info">
          <h4 class="product-name">${name}</h4>
          <p class="product-desc">${description}${seller}</p>
          ${marketLocation ? `<p class="product-market-location">${marketLocation}</p>` : ""}
          <div class="product-bottom">
            <div class="price-container">
              ${oldPrice}
              <span class="new-price">R$ ${offersMoney(offer.price)}<span class="unit">/${unit}</span></span>
            </div>
            <button class="add-btn" data-add-offer="${id}" type="button" aria-label="Adicionar ${name} ao carrinho">+</button>
          </div>
        </div>
      </article>
    `;
  }

  function distanceOf(offer) {
    const latitude = offer.location?.latitude;
    const longitude = offer.location?.longitude;
    if (
      !buyerLocation ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180
    ) {
      return null;
    }

    const radians = (degrees) => degrees * (Math.PI / 180);
    const latitudeDelta = radians(latitude - buyerLocation.latitude);
    const longitudeDelta = radians(longitude - buyerLocation.longitude);
    const haversine = Math.min(1,
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(radians(buyerLocation.latitude)) *
        Math.cos(radians(latitude)) *
        Math.sin(longitudeDelta / 2) ** 2,
    );
    return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  }

  function filteredOffers() {
    const normalizedQuery = offersNormalize(query);
    const normalizedCategory = offersNormalize(selectedCategory);
    const matches = allOffers.filter((offer) => {
      const categoryMatches =
        !normalizedCategory || offersNormalize(offer.category) === normalizedCategory;
      if (!categoryMatches) return false;
      if (!normalizedQuery) return true;
      return [offer.name, offer.desc, offer.category, offer.ownerName]
        .filter(Boolean)
        .some((value) => offersNormalize(value).includes(normalizedQuery));
    });

    if (activeFilter === "price") {
      return matches.sort((first, second) => Number(first.price) - Number(second.price));
    }
    if (activeFilter === "nearby") {
      return matches
        .map((offer) => ({ offer, distance: distanceOf(offer) }))
        .filter((entry) => entry.distance !== null)
        .sort((first, second) => first.distance - second.distance)
        .map((entry) => entry.offer);
    }
    return matches;
  }

  function renderOffers() {
    if (activeFilter === "nearby" && !buyerLocation) {
      setListMessage(
        locationRequestActive
          ? "Obtendo sua localização..."
          : locationError || "Toque em “Perto de você” para ordenar as ofertas pela distância.",
        locationRequestActive ? "loading-state home-empty" : "home-empty",
      );
      return;
    }
    const matches = filteredOffers();
    if (!matches.length) {
      setListMessage(
        activeFilter === "nearby" && allOffers.length
          ? "Não encontramos ofertas com localização para esta busca. Comerciantes podem marcar a localização ao publicar ou editar."
          : allOffers.length
          ? "Nenhuma oferta encontrada para os filtros selecionados."
          : "Nenhuma oferta disponível no momento.",
      );
      return;
    }
    list.innerHTML = matches.map(renderOfferCard).join("");
  }

  function updateFilterButtons() {
    filterButtons.forEach((button) => {
      const key = button.dataset.offerFilter;
      button.classList.toggle("active", key === activeFilter);
      button.setAttribute("aria-pressed", String(key === activeFilter));
    });
    categoryItems.forEach((item) => {
      const category = item.querySelector(".category-label")?.textContent || "";
      item.setAttribute("aria-pressed", String(offersNormalize(category) === offersNormalize(selectedCategory)));
    });
  }

  function selectFilter(filter, button) {
    activeFilter = filter;
    locationError = "";
    locationRequestActive = false;
    updateFilterButtons();
    if (filter !== "nearby" || buyerLocation) {
      renderOffers();
      return;
    }

    if (!navigator.geolocation) {
      locationError = "Este navegador não disponibiliza localização.";
      renderOffers();
      return;
    }
    if (!window.isSecureContext) {
      locationError = "A localização exige que o app seja aberto por HTTPS ou localhost.";
      renderOffers();
      return;
    }

    locationRequestActive = true;
    if (button) button.disabled = true;
    renderOffers();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        buyerLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        locationRequestActive = false;
        if (button) button.disabled = false;
        renderOffers();
      },
      (error) => {
        locationRequestActive = false;
        locationError = error.code === 1
          ? "Localização não permitida. Libere a permissão no navegador para usar este filtro."
          : "Não foi possível obter sua localização. Tente novamente.";
        if (button) button.disabled = false;
        renderOffers();
      },
      { enableHighAccuracy: false, maximumAge: 120000, timeout: 12000 },
    );
  }

  function bindOfferInteractions() {
    if (list.dataset.interactionsBound === "true") return;
    list.dataset.interactionsBound = "true";
    list.addEventListener("click", (event) => {
      const addButton = event.target.closest("[data-add-offer]");
      if (addButton) {
        event.stopPropagation();
        const offer = offersById.get(addButton.dataset.addOffer);
        if (offer && typeof window.Cart?.add === "function") window.Cart.add(offer);
        return;
      }
      const card = event.target.closest("[data-offer-id]");
      if (card) openOffer(card.dataset.offerId);
    });
    list.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = event.target.closest("[data-offer-id]");
      if (!card) return;
      event.preventDefault();
      openOffer(card.dataset.offerId);
    });
  }

  function bindNavigation() {
    document.querySelectorAll(".bottom-nav .nav-item").forEach((button) => {
      button.addEventListener("click", () => {
        const page = button.getAttribute("data-page");
        if (page && typeof window.Router?.go === "function") {
          page === "ofertas" ? window.Router.goOffers() : window.Router.go(page);
        }
      });
    });
  }

  async function loadOffers() {
    setListMessage("Carregando ofertas...", "loading-state home-empty");
    if (typeof window.Backend?.getOffers !== "function") {
      setListMessage("Não foi possível conectar ao catálogo.");
      return;
    }
    try {
      const offers = await window.Backend.getOffers();
      allOffers = Array.isArray(offers) ? offers : [];
      offersById.clear();
      allOffers.forEach((offer) => offersById.set(String(offer.id), offer));
      renderOffers();
    } catch (error) {
      console.error(error);
      setListMessage("Não foi possível carregar as ofertas. Tente novamente.");
      const retryButton = document.createElement("button");
      retryButton.className = "btn btn-outline";
      retryButton.type = "button";
      retryButton.textContent = "Tentar novamente";
      retryButton.addEventListener("click", loadOffers);
      list.appendChild(retryButton);
    }
  }

  filterButtons.forEach((button) => {
    const label = offersNormalize(button.textContent);
    button.dataset.offerFilter = label.includes("preco")
      ? "price"
      : label.includes("perto")
        ? "nearby"
        : label.includes("recomend")
          ? "recommended"
          : "recommended";
    button.addEventListener("click", () => {
      selectFilter(button.dataset.offerFilter, button);
    });
  });

  categoryItems.forEach((item) => {
    item.setAttribute("role", "button");
    item.tabIndex = 0;
    const selectCategory = () => {
      const category = item.querySelector(".category-label")?.textContent || "";
      selectedCategory = offersNormalize(selectedCategory) === offersNormalize(category) ? "" : category;
      updateFilterButtons();
      renderOffers();
    };
    item.addEventListener("click", selectCategory);
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectCategory();
      }
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      query = searchInput.value;
      renderOffers();
    });
  }

  updateFilterButtons();
  bindOfferInteractions();
  bindNavigation();
  await loadOffers();
};
