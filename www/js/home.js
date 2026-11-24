// js/home.js

const HOME_HTML_ESCAPE = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};

function homeEscapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) => HOME_HTML_ESCAPE[character],
  );
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

function homeOrderDate(value) {
  if (!value) return null;
  const date =
    typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function homeDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function homeOrderTotal(order) {
  const hasTotal =
    order?.total !== null &&
    order?.total !== undefined &&
    (typeof order.total !== "string" || order.total.trim() !== "");
  if (hasTotal && Number.isFinite(Number(order.total))) {
    return Number(order.total);
  }

  if (!Array.isArray(order?.items) || !order.items.length) return null;
  const itemTotals = order.items.map((item) => {
    const hasPrice =
      item?.price !== null &&
      item?.price !== undefined &&
      (typeof item.price !== "string" || item.price.trim() !== "");
    const hasQuantity =
      item?.quantity !== null &&
      item?.quantity !== undefined &&
      (typeof item.quantity !== "string" || item.quantity.trim() !== "");
    const price = Number(item?.price);
    const quantity = Number(item?.quantity);
    return hasPrice &&
      hasQuantity &&
      Number.isFinite(price) &&
      Number.isFinite(quantity)
      ? price * quantity
      : null;
  });
  return itemTotals.every((total) => total !== null)
    ? itemTotals.reduce((sum, total) => sum + total, 0)
    : null;
}

function homeMessage(container, message, className = "home-empty") {
  if (!container) return;
  container.innerHTML = `<p class="${className}">${homeEscapeHtml(message)}</p>`;
}

function homeRenderMarket(market) {
  const stallName = homeEscapeHtml(market.stallName || "Banca cadastrada");
  const marketName = homeEscapeHtml(
    market.marketName || market.stallName || "Feira cadastrada",
  );
  const reference = String(market.reference || "").trim();
  const location = [market.city, market.state]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .map(homeEscapeHtml)
    .join(", ");
  const image = homeImageMarkup(
    market.image,
    market.stallName || "Feira cadastrada",
    "market-img",
    "🏪",
  );
  return `
    <article class="market-card market-card-link" data-market-id="${homeEscapeHtml(market.id || "")}" tabindex="0" role="button" aria-label="Ver a banca ${stallName}">
      <div class="market-img-wrap">
        ${image}
        <span class="market-badge">Feira cadastrada</span>
      </div>
      <div class="market-info">
        <h4>${marketName}</h4>
        <p>${location || "Localização não informada"}</p>
        <p class="market-reference"><strong>Banca:</strong> ${stallName}${reference ? ` · ${homeEscapeHtml(reference)}` : ""}</p>
      </div>
    </article>
  `;
}

function homeRenderStories(container, stories) {
  if (!container) return;
  if (!stories.length) {
    homeMessage(container, "Nenhuma novidade publicada pelas feiras.");
    return;
  }
  container.innerHTML = stories
    .slice(0, 8)
    .map((story) => {
      const ownerName = homeEscapeHtml(story.ownerName || "Feira local");
      const text = homeEscapeHtml(
        story.text || "Confira as novidades desta feira.",
      );
      const image = homeImageMarkup(
        story.image,
        story.ownerName || "Feira local",
        "market-img",
        "📸",
      );
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
    })
    .join("");
}

function homeLoadMarkets(container, maxItems, emptyMessage) {
  if (!container) return;
  const backend = window.Backend;
  if (typeof backend?.getMarkets !== "function") {
    homeMessage(container, "Não foi possível carregar as feiras.");
    console.error(new Error("A consulta de feiras não está disponível."));
    return;
  }

  Promise.resolve()
    .then(() => backend.getMarkets())
    .then((markets) => {
      if (!Array.isArray(markets)) {
        throw new TypeError("A consulta de feiras retornou dados inválidos.");
      }
      if (!markets.length) {
        homeMessage(container, emptyMessage);
        return;
      }
      container.innerHTML = markets
        .slice(0, maxItems)
        .map(homeRenderMarket)
        .join("");
      container.querySelectorAll("[data-market-id]").forEach((card) => {
        const open = () => window.openStall?.(card.dataset.marketId);
        card.addEventListener("click", open);
        card.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            open();
          }
        });
      });
    })
    .catch((error) => {
      console.error("Não foi possível carregar as feiras:", error);
      homeMessage(container, "Não foi possível carregar as feiras.");
    });
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
  const fairsContainer = document.querySelector("[data-fairs]");
  const nearbyContainer = document.querySelector("[data-products-nearby]");
  const recentContainer = document.querySelector("[data-products-recent]");
  const searchInput = document.querySelector(".search-wrapper input");
  const headerActions = document.querySelector("[data-home-header-actions]");
  let homeOffers = [];
  const offersById = new Map();

  if (
    !isMerchant &&
    headerActions &&
    typeof window.mountCartShortcut === "function"
  ) {
    window.mountCartShortcut(headerActions, "prepend");
  }

  document
    .querySelectorAll(".home-categories-section .category-item")
    .forEach((item) => {
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      const applyCategory = () => {
        const category = item
          .querySelector(".category-label")
          ?.textContent?.trim();
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

  const categoriesLink = document.querySelector(
    ".home-categories-section .link-green",
  );
  if (categoriesLink) {
    categoriesLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.Router?.go("ofertas");
    });
  }
  const storiesLink = document.querySelector(
    ".home-markets-section .link-green",
  );
  if (storiesLink) {
    storiesLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.Router?.go("feira");
    });
  }
  const fairsLink = document.querySelector(".home-fairs-section .link-green");
  if (fairsLink) {
    fairsLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.Router?.go("feiras");
    });
  }
  const moreOffersLink = document.querySelector(
    ".home-recent-section .link-green",
  );
  if (moreOffersLink) {
    moreOffersLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.Router?.go("ofertas");
    });
  }

  if (isMerchant) {
    document.body.classList.add("merchant-home");
    const title = document.querySelector("#home-products-title");
    const panelLink = document.querySelector(
      ".home-products-section .link-green",
    );
    if (title) title.textContent = "Minhas ofertas";
    if (panelLink) {
      panelLink.textContent = "Ver painel";
      panelLink.addEventListener("click", (event) => {
        event.preventDefault();
        window.Router?.go("minhasOfertas");
      });
    }
  }

  const productsLink = document.querySelector(
    ".home-products-section .link-green",
  );
  if (productsLink && !isMerchant) {
    productsLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.Router?.go("ofertas");
    });
  }

  if (!isMerchant) {
    homeMessage(
      fairsContainer,
      "Carregando feiras cadastradas...",
      "loading-state home-empty",
    );
    homeMessage(
      marketsContainer,
      "Carregando novidades das feiras...",
      "loading-state home-empty",
    );
    homeMessage(
      nearbyContainer,
      "Carregando ofertas...",
      "loading-state home-empty",
    );
    homeMessage(
      recentContainer,
      "Carregando ofertas...",
      "loading-state home-empty",
    );
  } else if (nearbyContainer) {
    homeMessage(
      nearbyContainer,
      "Carregando suas ofertas...",
      "loading-state home-empty",
    );
  }

  function openOffer(offer) {
    if (!offer?.id || typeof window.Router?.go !== "function") return;
    sessionStorage.setItem("xepa-current-offer", offer.id);
    window.Router.go("produto");
  }

  function renderOfferLocation(offer) {
    const location = offer.stallLocation || {};
    const city = [location.city, location.state]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .join(", ");
    const details = [location.marketName, city, location.reference].filter(
      (value) => String(value || "").trim(),
    );
    if (!details.length) return "";
    return `<p class="product-market-location">${details.map(homeEscapeHtml).join(" · ")}</p>`;
  }

  function renderOfferCard(offer, withCart = true) {
    const id = homeEscapeHtml(offer.id);
    const name = homeEscapeHtml(offer.name || "Oferta");
    const unit = homeEscapeHtml(offer.unit || "unidade");
    const description = homeEscapeHtml(offer.desc || "Produto fresco à venda.");
    const image = homeImageMarkup(
      offer.image,
      offer.name || "Oferta",
      "product-img",
    );
    const cartButton = withCart
      ? `<button class="add-btn" data-add-offer="${id}" type="button" aria-label="Adicionar ${name} ao carrinho">+</button>`
      : "";
    return `
      <article class="product-card" data-offer-id="${id}" tabindex="0" role="button" aria-label="Ver ${name}">
        ${image}
        <div class="product-info">
          <h4 class="product-name">${name}</h4>
          <p class="product-desc">${description}</p>
          ${renderOfferLocation(offer)}
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
        if (offer && typeof window.Cart?.add === "function")
          window.Cart.add(offer);
      });
    });
  }

  function renderHomeOffers(searchTerm = "") {
    const normalizedTerm = searchTerm.trim().toLocaleLowerCase("pt-BR");
    const filteredOffers = homeOffers.filter((offer) => {
      if (!normalizedTerm) return true;
      return [offer.name, offer.desc, offer.category, offer.ownerName]
        .filter(Boolean)
        .some((value) =>
          String(value).toLocaleLowerCase("pt-BR").includes(normalizedTerm),
        );
    });

    if (!filteredOffers.length) {
      homeMessage(
        nearbyContainer,
        normalizedTerm
          ? "Nenhuma oferta encontrada."
          : "Nenhuma oferta disponível no momento.",
      );
      homeMessage(
        recentContainer,
        normalizedTerm
          ? "Nenhuma oferta encontrada."
          : "Nenhuma oferta disponível no momento.",
      );
      return;
    }

    const nearbyOffers = filteredOffers.slice(0, 4);
    const additionalOffers = filteredOffers.slice(4, 8);
    if (nearbyContainer) {
      nearbyContainer.innerHTML = nearbyOffers
        .map((offer) => renderOfferCard(offer))
        .join("");
      bindOfferInteractions(nearbyContainer);
    }
    if (recentContainer) {
      if (additionalOffers.length) {
        recentContainer.innerHTML = additionalOffers
          .map((offer) => renderOfferCard(offer))
          .join("");
        bindOfferInteractions(recentContainer);
      } else {
        homeMessage(
          recentContainer,
          normalizedTerm
            ? "Nenhuma outra oferta encontrada."
            : "Não há outras ofertas disponíveis no momento.",
        );
      }
    }
  }

  function setMerchantMetricsUnavailable() {
    const todayOrders = document.querySelector(
      '[data-merchant-metric="today-orders"]',
    );
    const ordersChange = document.querySelector(
      '[data-merchant-metric="orders-change"]',
    );
    const ordersComparison = document.querySelector(
      '[data-merchant-metric="orders-comparison"]',
    );
    const monthlySales = document.querySelector(
      '[data-merchant-metric="monthly-sales"]',
    );
    const salesPeriod = document.querySelector(
      '[data-merchant-metric="sales-period"]',
    );

    if (todayOrders) todayOrders.textContent = "—";
    if (ordersChange) ordersChange.textContent = "Indisponível";
    if (ordersChange) ordersChange.style.color = "#777";
    if (ordersComparison) {
      ordersComparison.textContent = "Não foi possível carregar os pedidos";
    }
    if (monthlySales) monthlySales.textContent = "—";
    if (salesPeriod) {
      salesPeriod.textContent = "Não foi possível carregar as vendas";
    }
    const reviewRating = document.querySelector(
      '[data-merchant-metric="review-rating"]',
    );
    const reviewCount = document.querySelector(
      '[data-merchant-metric="review-count"]',
    );
    if (reviewRating) reviewRating.textContent = "—";
    if (reviewCount) reviewCount.textContent = "Não foi possível carregar";
    document
      .querySelector(".merchant-summary-orders")
      ?.setAttribute("aria-label", "Pedidos de hoje indisponíveis");
    document
      .querySelector(".merchant-summary-performance")
      ?.setAttribute("aria-label", "Vendas concluídas indisponíveis");
    document
      .querySelector(".merchant-summary-reviews")
      ?.setAttribute("aria-label", "Avaliações indisponíveis");
  }

  function loadMerchantDashboardMetrics() {
    const backend = window.Backend;
    if (typeof backend?.getOrders !== "function") {
      console.error(new Error("A consulta de pedidos não está disponível."));
      setMerchantMetricsUnavailable();
      return;
    }

    Promise.resolve()
      .then(() => backend.getOrders())
      .then((orders) => {
        if (!Array.isArray(orders)) {
          throw new TypeError(
            "A consulta de pedidos retornou dados inválidos.",
          );
        }

        const userId = window.Auth?.user?.uid;
        const merchantOrders = orders.filter(
          (order) => order?.merchantUid === userId,
        );
        const ratings = merchantOrders
          .map((order) => Number(order?.review?.rating))
          .filter(
            (rating) => Number.isInteger(rating) && rating >= 1 && rating <= 5,
          );
        const reviewRatingNode = document.querySelector(
          '[data-merchant-metric="review-rating"]',
        );
        const reviewCountNode = document.querySelector(
          '[data-merchant-metric="review-count"]',
        );
        if (reviewRatingNode) {
          reviewRatingNode.textContent = ratings.length
            ? (
                ratings.reduce((sum, rating) => sum + rating, 0) /
                ratings.length
              ).toFixed(1)
            : "—";
        }
        if (reviewCountNode) {
          reviewCountNode.textContent = ratings.length
            ? `${ratings.length} ${ratings.length === 1 ? "avaliação" : "avaliações"}`
            : "Ainda sem avaliações";
        }
        document
          .querySelector(".merchant-summary-reviews")
          ?.setAttribute(
            "aria-label",
            ratings.length
              ? `Ver ${ratings.length} avaliações dos clientes`
              : "Ver avaliações dos clientes",
          );
        const datedOrders = merchantOrders.map((order) => {
          const date = homeOrderDate(order.createdAt);
          if (!date) {
            throw new TypeError("Um pedido não possui uma data válida.");
          }
          return { order, date };
        });
        const today = new Date();
        const todayKey = homeDateKey(today);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = homeDateKey(yesterday);
        const todayOrders = datedOrders.filter(
          ({ date }) => homeDateKey(date) === todayKey,
        ).length;
        const yesterdayOrders = datedOrders.filter(
          ({ date }) => homeDateKey(date) === yesterdayKey,
        ).length;
        const monthlyOrders = datedOrders.filter(({ order, date }) => {
          return (
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            ["completed", "delivered"].includes(
              String(order.status || "").toLowerCase(),
            )
          );
        });
        const monthlyOrderTotals = monthlyOrders.map(({ order }) =>
          homeOrderTotal(order),
        );
        const hasCompleteMonthlySales = monthlyOrderTotals.every(
          (total) => total !== null,
        );
        const monthlySalesTotal = hasCompleteMonthlySales
          ? monthlyOrderTotals.reduce(
              (total, orderTotal) => total + orderTotal,
              0,
            )
          : null;

        const todayOrdersNode = document.querySelector(
          '[data-merchant-metric="today-orders"]',
        );
        const ordersChangeNode = document.querySelector(
          '[data-merchant-metric="orders-change"]',
        );
        const ordersComparisonNode = document.querySelector(
          '[data-merchant-metric="orders-comparison"]',
        );
        const monthlySalesNode = document.querySelector(
          '[data-merchant-metric="monthly-sales"]',
        );
        const salesPeriodNode = document.querySelector(
          '[data-merchant-metric="sales-period"]',
        );

        if (todayOrdersNode) todayOrdersNode.textContent = String(todayOrders);
        if (yesterdayOrders > 0) {
          const percentage = Math.round(
            ((todayOrders - yesterdayOrders) / yesterdayOrders) * 100,
          );
          if (ordersChangeNode) {
            const arrow = percentage > 0 ? "↑ " : percentage < 0 ? "↓ " : "";
            ordersChangeNode.textContent = `${arrow}${Math.abs(percentage)}%`;
            ordersChangeNode.style.color = percentage < 0 ? "#c0392b" : "";
          }
          if (ordersComparisonNode) {
            ordersComparisonNode.textContent = "Em relação a ontem";
          }
        } else {
          if (ordersChangeNode) {
            ordersChangeNode.textContent = "Sem comparação";
            ordersChangeNode.style.color = "";
          }
          if (ordersComparisonNode) {
            ordersComparisonNode.textContent = "Sem pedidos ontem";
          }
        }

        if (monthlySalesNode) {
          monthlySalesNode.textContent =
            monthlySalesTotal === null
              ? "—"
              : `R$ ${homeMoney(monthlySalesTotal)}`;
          monthlySalesNode.style.fontSize = "clamp(20px, 7vw, 31px)";
        }
        if (salesPeriodNode) {
          salesPeriodNode.textContent = hasCompleteMonthlySales
            ? `Neste mês · ${monthlyOrders.length} pedido${monthlyOrders.length === 1 ? "" : "s"} concluído${monthlyOrders.length === 1 ? "" : "s"}`
            : "Dados incompletos para calcular as vendas";
        }

        const ordersCard = document.querySelector(".merchant-summary-orders");
        if (ordersCard) {
          ordersCard.setAttribute(
            "aria-label",
            `Pedidos recebidos hoje: ${todayOrders}${yesterdayOrders > 0 ? `, ${Math.abs(Math.round(((todayOrders - yesterdayOrders) / yesterdayOrders) * 100))}% em relação a ontem` : ""}`,
          );
        }
        const salesCard = document.querySelector(
          ".merchant-summary-performance",
        );
        if (salesCard) {
          salesCard.setAttribute(
            "aria-label",
            monthlySalesTotal === null
              ? "Não foi possível calcular as vendas concluídas neste mês"
              : `Vendas concluídas neste mês: R$ ${homeMoney(monthlySalesTotal)}`,
          );
        }
      })
      .catch((error) => {
        console.error(
          "Não foi possível carregar os indicadores da banca:",
          error,
        );
        setMerchantMetricsUnavailable();
      });
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
        availableOffers.forEach((offer) =>
          offersById.set(String(offer.id), offer),
        );
        if (!availableOffers.length) {
          homeMessage(nearbyContainer, "Você ainda não publicou ofertas.");
          return;
        }
        nearbyContainer.innerHTML = availableOffers
          .map((offer) => renderOfferCard(offer, false))
          .join("");
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
          homeOffers.forEach((offer) =>
            offersById.set(String(offer.id), offer),
          );
          renderHomeOffers(searchInput?.value || "");
        })
        .catch((error) => {
          console.error(error);
          homeMessage(nearbyContainer, "Não foi possível carregar as ofertas.");
          homeMessage(recentContainer, "Não foi possível carregar as ofertas.");
        });
    }

    homeLoadMarkets(
      fairsContainer,
      8,
      "Ainda não há feiras cadastradas na Xepa.",
    );
    if (typeof backend?.getStories !== "function") {
      homeMessage(
        marketsContainer,
        "Não foi possível carregar as novidades das feiras.",
      );
    } else {
      Promise.resolve()
        .then(() => backend.getStories())
        .then((stories) =>
          homeRenderStories(
            marketsContainer,
            Array.isArray(stories) ? stories : [],
          ),
        )
        .catch((error) => {
          console.error(error);
          homeMessage(
            marketsContainer,
            "Não foi possível carregar as novidades das feiras.",
          );
        });
    }
  }

  if (searchInput && !isMerchant) {
    searchInput.addEventListener("input", () =>
      renderHomeOffers(searchInput.value),
    );
  }

  if (isMerchant) {
    loadMerchantDashboardMetrics();
    loadMerchantOffers();
  } else loadClientData();

  document.querySelectorAll(".bottom-nav .nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      const page = button.getAttribute("data-page");
      if (page && typeof window.Router?.go === "function") {
        page === "ofertas" ? window.Router.goOffers() : window.Router.go(page);
      }
    });
  });
};

window.FeirasPageInit = function () {
  homeLoadMarkets(
    document.querySelector("[data-fairs-directory]"),
    Number.POSITIVE_INFINITY,
    "Ainda não há feiras cadastradas na Xepa.",
  );
};
