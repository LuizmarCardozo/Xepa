const CART_KEY_PREFIX = "xepa_cart_";

function cartKey() {
  const uid = window.Auth?.user?.uid;
  return uid ? `${CART_KEY_PREFIX}${uid}` : null;
}

function readCart() {
  const key = cartKey();
  if (!key) return [];
  try {
    const items = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function writeCart(items) {
  const key = cartKey();
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(items));
  document.querySelectorAll("[data-cart-count]").forEach((badge) => {
    badge.textContent = String(
      items.reduce((sum, item) => sum + item.quantity, 0),
    );
  });
}

let cartAddedToastTimer = null;

function hideCartAddedToast() {
  const toast = document.querySelector("[data-cart-added-toast]");
  if (!toast) return;

  window.clearTimeout(cartAddedToastTimer);
  toast.classList.remove("show");
  window.setTimeout(() => {
    if (!toast.classList.contains("show")) toast.hidden = true;
  }, 250);
}

function showCartAddedToast(offer) {
  let toast = document.querySelector("[data-cart-added-toast]");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "cart-added-toast";
    toast.dataset.cartAddedToast = "";
    toast.hidden = true;
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.setAttribute("aria-atomic", "true");
    toast.innerHTML = `
      <span class="cart-added-toast-check" aria-hidden="true">✓</span>
      <span class="cart-added-toast-copy">
        <strong>Adicionado ao carrinho</strong>
        <span data-cart-added-name></span>
      </span>
      <button class="cart-added-toast-link" type="button" data-cart-added-view>Ver carrinho</button>
      <button class="cart-added-toast-close" type="button" data-cart-added-close aria-label="Fechar">×</button>
    `;
    document.body.append(toast);
    toast
      .querySelector("[data-cart-added-view]")
      .addEventListener("click", () => {
        hideCartAddedToast();
        window.Router.go("carrinho");
      });
    toast
      .querySelector("[data-cart-added-close]")
      .addEventListener("click", hideCartAddedToast);
  }

  toast.querySelector("[data-cart-added-name]").textContent =
    offer.name || "Produto";
  toast.hidden = false;
  window.requestAnimationFrame(() => toast.classList.add("show"));
  window.clearTimeout(cartAddedToastTimer);
  cartAddedToastTimer = window.setTimeout(hideCartAddedToast, 4500);
}

window.formatMoney = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

window.Cart = {
  items: readCart,
  count: () => readCart().reduce((sum, item) => sum + item.quantity, 0),
  add(offer, quantity = 1, { silent = false } = {}) {
    if (!offer?.id || !offer.ownerUid) {
      alert("Esta oferta não está disponível para compra.");
      return;
    }
    if (offer.ownerUid === window.Auth?.user?.uid) {
      alert("Você não pode pedir uma oferta publicada pela sua conta.");
      return;
    }
    const items = readCart();
    const existing = items.find((item) => item.offerId === offer.id);
    if (existing) {
      existing.quantity += quantity;
      if (!existing.location) existing.location = offer.location || null;
      if (!existing.stallLocation)
        existing.stallLocation = offer.stallLocation || null;
      if (!existing.ownerName)
        existing.ownerName = offer.ownerName || "Comerciante";
      if (!existing.stallName) {
        existing.stallName = offer.stallName || "Banca com nome não cadastrado";
      }
    } else {
      items.push({
        offerId: offer.id,
        ownerUid: offer.ownerUid,
        ownerName: offer.ownerName || "Comerciante",
        stallName: offer.stallName || "Banca com nome não cadastrado",
        name: offer.name,
        unit: offer.unit || "unidade",
        price: Number(offer.price),
        image: offer.image || null,
        location: offer.location || null,
        stallLocation: offer.stallLocation || null,
        quantity,
      });
    }
    writeCart(items);
    if (!silent) showCartAddedToast(offer);
  },
  setQuantity(offerId, quantity) {
    const items = readCart();
    const item = items.find((entry) => entry.offerId === offerId);
    if (!item) return;
    if (quantity < 1) {
      window.Cart.remove(offerId);
      return;
    }
    item.quantity = Math.min(99, quantity);
    writeCart(items);
  },
  remove(offerId) {
    writeCart(readCart().filter((item) => item.offerId !== offerId));
  },
  clear() {
    writeCart([]);
  },
};

window.mountCartShortcut = function (referenceElement, placement = "after") {
  if (window.Auth?.user?.type === "comerciante") return;
  if (!referenceElement || document.querySelector("[data-cart-shortcut]"))
    return;
  const wrapper = document.createElement("div");
  wrapper.className = "cart-shortcut-wrap";
  wrapper.innerHTML =
    '<button class="cart-shortcut" type="button" data-cart-shortcut aria-label="Abrir carrinho"><img class="cart-shortcut-icon" src="assets/CARRINHO.png" alt=""><span class="cart-shortcut-label">Carrinho</span><span data-cart-count>' +
    window.Cart.count() +
    "</span></button>";
  wrapper
    .querySelector("button")
    .addEventListener("click", () => Router.go("carrinho"));
  if (placement === "prepend") {
    referenceElement.prepend(wrapper);
  } else {
    referenceElement.insertAdjacentElement("afterend", wrapper);
  }
};

function storyEscape(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character],
  );
}

function renderStallLocation(location, className) {
  const city = [location?.city, location?.state]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");
  const details = [
    ["Feira", location?.marketName],
    ["Cidade", city],
    ["Banca / referência", location?.reference],
  ].filter(([, value]) => String(value || "").trim());

  return `
    <section class="${className}">
      <strong>Localização da feira</strong>
      ${
        details.length
          ? details
              .map(
                ([label, value]) =>
                  `<span><b>${label}:</b> ${storyEscape(value)}</span>`,
              )
              .join("")
          : "<span>Não informada pelo vendedor.</span>"
      }
    </section>
  `;
}

window.FeiraPage = function () {
  return '<main class="page commerce-page"><header class="page-heading"><div><h1>Novidades das feiras</h1><p>Publicações recentes dos comerciantes.</p></div></header><div id="stories-list" class="story-list"><p class="loading-state">Carregando novidades...</p></div></main>';
};

window.FeiraPageInit = async function () {
  const list = document.getElementById("stories-list");
  if (!list) return;
  try {
    const stories = await window.Backend.getStories();
    if (!stories.length) {
      list.innerHTML =
        '<section class="empty-state card"><h2>Nenhuma novidade ainda</h2><p>As publicações dos comerciantes aparecerão aqui.</p></section>';
      return;
    }
    list.innerHTML = stories
      .map((story) => {
        const image = story.image
          ? '<img src="' +
            storyEscape(story.image) +
            '" alt="Novidade de ' +
            storyEscape(story.ownerName || "feira") +
            '">'
          : "";
        const date = story.createdAt
          ? new Date(story.createdAt).toLocaleString("pt-BR")
          : "";
        return (
          '<article class="story-card"><p class="eyebrow">' +
          storyEscape(story.ownerName || "Feira local") +
          "</p>" +
          image +
          "<p>" +
          storyEscape(story.text || "") +
          "</p><small>" +
          storyEscape(date) +
          "</small></article>"
        );
      })
      .join("");
  } catch (error) {
    console.error(error);
    list.innerHTML =
      '<section class="empty-state card"><h2>Não foi possível carregar as novidades</h2><button class="btn btn-outline" onclick="Router.go(\'feira\')">Tentar novamente</button></section>';
  }
};

window.ProdutoPage = function () {
  return `
    <main class="product-selection-page">
      <div id="product-detail">
        <p class="loading-state">Carregando produto...</p>
      </div>
      <section class="product-recommendations" aria-labelledby="product-recommendations-title">
        <h2 id="product-recommendations-title">Veja também</h2>
        <div class="product-recommendation-grid" data-product-recommendations>
          <p class="loading-state">Carregando produtos...</p>
        </div>
      </section>
      <section class="product-cart-summary" data-product-cart-summary aria-live="polite" hidden>
        <div class="product-cart-total">
          <strong>Total <span data-product-cart-total>R$ 0,00</span></strong>
          <small data-product-cart-count>0 itens</small>
        </div>
        <button class="btn btn-primary" type="button" data-view-cart>Ver sacola</button>
      </section>
    </main>`;
};

window.ProdutoPageInit = async function () {
  const container = document.getElementById("product-detail");
  const recommendationContainer = document.querySelector(
    "[data-product-recommendations]",
  );
  const offerId = sessionStorage.getItem("xepa-current-offer");
  if (!container || !offerId) {
    if (container)
      container.innerHTML = "<p>Escolha uma oferta para ver os detalhes.</p>";
    return;
  }

  const recommendations = new Map();
  const cartSummary = document.querySelector("[data-product-cart-summary]");
  const cartTotal = document.querySelector("[data-product-cart-total]");
  const cartCount = document.querySelector("[data-product-cart-count]");
  let draftQuantity = 1;

  const updateCartSummary = () => {
    const items = window.Cart.items();
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    if (cartSummary) cartSummary.hidden = count === 0;
    if (cartTotal) cartTotal.textContent = window.formatMoney(total);
    if (cartCount) {
      cartCount.textContent = `${count} ${count === 1 ? "item" : "itens"}`;
    }
  };

  const renderSelection = (offer) => {
    const cartItem = window.Cart.items().find(
      (item) => item.offerId === offer.id,
    );
    const selectedQuantity = cartItem?.quantity || 1;
    const selection = document.querySelector("[data-product-selection]");
    if (!selection) return;

    selection.innerHTML = `
      <div class="product-quantity-control" aria-label="Quantidade">
        <button type="button" data-quantity-change="-1" aria-label="Diminuir quantidade">−</button>
        <strong>${cartItem ? selectedQuantity : draftQuantity}</strong>
        <button type="button" data-quantity-change="1" aria-label="Aumentar quantidade">+</button>
      </div>
      ${cartItem ? "" : '<button class="btn btn-primary btn-full" type="button" data-reserve-product>Reservar</button>'}
    `;

    selection
      .querySelector("[data-reserve-product]")
      ?.addEventListener("click", () => {
        window.Cart.add(offer, draftQuantity, { silent: true });
        renderSelection(offer);
        updateCartSummary();
      });

    selection.querySelectorAll("[data-quantity-change]").forEach((button) => {
      button.addEventListener("click", () => {
        const change = Number(button.dataset.quantityChange);
        if (cartItem) {
          window.Cart.setQuantity(offer.id, selectedQuantity + change);
        } else {
          draftQuantity = Math.max(1, Math.min(99, draftQuantity + change));
        }
        renderSelection(offer);
        updateCartSummary();
      });
    });
  };

  const renderRecommendations = (offers, selectedOffer) => {
    if (!recommendationContainer) return;
    const relatedOffers = offers
      .filter(
        (offer) =>
          offer?.active &&
          offer.id !== selectedOffer.id &&
          offer.ownerUid !== window.Auth?.user?.uid,
      )
      .slice(0, 8);
    relatedOffers.forEach((offer) =>
      recommendations.set(String(offer.id), offer),
    );
    if (!relatedOffers.length) {
      recommendationContainer.innerHTML =
        '<p class="product-recommendation-empty">Não há outros produtos disponíveis no momento.</p>';
      return;
    }

    recommendationContainer.innerHTML = relatedOffers
      .map(
        (offer) => `
          <article class="product-recommendation-card">
            <button class="product-recommendation-open" type="button" data-open-recommendation="${storyEscape(offer.id)}" aria-label="Ver ${storyEscape(offer.name || "produto")}">
              ${offer.image ? `<img src="${storyEscape(offer.image)}" alt="">` : '<span class="product-recommendation-placeholder" aria-hidden="true">🥬</span>'}
              <strong>${storyEscape(offer.name || "Produto")}</strong>
              <small>${storyEscape(offer.ownerName || "Feira local")}</small>
              <b>${window.formatMoney(offer.price)}<small>/${storyEscape(offer.unit || "unidade")}</small></b>
            </button>
            <button class="product-recommendation-add" type="button" data-add-recommendation="${storyEscape(offer.id)}" aria-label="Adicionar ${storyEscape(offer.name || "produto")} ao carrinho">+</button>
          </article>
        `,
      )
      .join("");

    recommendationContainer
      .querySelectorAll("[data-open-recommendation]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          sessionStorage.setItem(
            "xepa-current-offer",
            button.dataset.openRecommendation,
          );
          window.Router.go("produto");
        });
      });
    recommendationContainer
      .querySelectorAll("[data-add-recommendation]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const recommendedOffer = recommendations.get(
            button.dataset.addRecommendation,
          );
          if (!recommendedOffer) return;
          window.Cart.add(recommendedOffer, 1, { silent: true });
          updateCartSummary();
          button.textContent = "✓";
          button.disabled = true;
          button.setAttribute("aria-label", "Adicionado ao carrinho");
        });
      });
  };

  try {
    const offer = await window.Backend.getOffer(offerId);
    if (!offer || !offer.active) {
      container.innerHTML = "<p>Esta oferta não está mais disponível.</p>";
      return;
    }
    container.innerHTML = `
      <section class="product-detail">
        <div class="product-detail-hero">
          ${offer.image ? `<img class="product-detail-image" src="${storyEscape(offer.image)}" alt="${storyEscape(offer.name || "Produto")}">` : '<div class="product-detail-image product-detail-placeholder" aria-hidden="true">🥬</div>'}
          <button class="product-detail-back" type="button" onclick="Router.back('ofertas')" aria-label="Voltar à tela anterior">‹</button>
        </div>
        <article class="product-detail-content">
          <p class="eyebrow">${storyEscape(offer.category || "Oferta")}</p>
          <h1>${storyEscape(offer.name || "Produto")}</h1>
          <p class="product-detail-description">${storyEscape(offer.desc || "Produto fresco à venda.")}</p>
          <p class="product-detail-seller">Vendido por ${offer.ownerUid ? `<button class="product-detail-stall-link" type="button" data-open-stall="${storyEscape(offer.ownerUid)}">${storyEscape(offer.stallName || offer.ownerName || "Comerciante")} ›</button>` : storyEscape(offer.ownerName || "Comerciante")}</p>
          ${renderStallLocation(offer.stallLocation, "product-detail-market")}
          <strong class="product-detail-price">${window.formatMoney(offer.price)}<span>/${storyEscape(offer.unit || "unidade")}</span></strong>
          <div data-product-selection></div>
        </article>
      </section>`;
    renderSelection(offer);
    updateCartSummary();

    document
      .querySelector("[data-open-stall]")
      ?.addEventListener("click", (event) =>
        window.openStall?.(event.currentTarget.dataset.openStall),
      );

    document
      .querySelector("[data-view-cart]")
      ?.addEventListener("click", () => window.Router.go("carrinho"));

    if (typeof window.Backend?.getOffers === "function") {
      const offers = await window.Backend.getOffers();
      renderRecommendations(Array.isArray(offers) ? offers : [], offer);
    } else if (recommendationContainer) {
      recommendationContainer.innerHTML =
        '<p class="product-recommendation-empty">Não foi possível carregar outros produtos.</p>';
    }
  } catch (error) {
    console.error(error);
    if (container.textContent.includes("Carregando produto")) {
      container.innerHTML =
        "<p>Não foi possível carregar este produto. Tente novamente.</p>";
    } else if (recommendationContainer) {
      recommendationContainer.innerHTML =
        '<p class="product-recommendation-empty">Não foi possível carregar outros produtos.</p>';
    }
  }
};

window.CarrinhoPage = function () {
  return `
    <main class="page commerce-page cart-page">
      <header class="page-heading cart-page-heading">
        <div><p class="eyebrow">Sua feira</p><h1>Meu carrinho</h1></div>
        <button class="text-button" data-clear-cart type="button">Limpar</button>
      </header>
      <div id="cart-items" class="commerce-list"></div>
      <section class="cart-recommendations" aria-labelledby="cart-recommendations-title">
        <div class="cart-section-heading">
          <h2 id="cart-recommendations-title">Precisa de mais alguma coisa?</h2>
          <button class="text-button" type="button" onclick="Router.go('ofertas')">Ver ofertas</button>
        </div>
        <div id="cart-recommendation-list" class="cart-recommendation-list">
          <p class="loading-state">Buscando produtos...</p>
        </div>
      </section>
      <section class="card checkout-card">
        <h2>Como receber?</h2>
        <label class="form-label" for="cart-fulfillment">Forma de recebimento</label>
        <select id="cart-fulfillment" class="form-input"><option value="pickup">Retirar com o comerciante</option></select>
        <div id="cart-address-group" hidden><label class="form-label" for="cart-address">Endereço para combinar a entrega</label><textarea id="cart-address" class="form-input" rows="2" placeholder="Rua, número, bairro"></textarea></div>
        <label class="form-label" for="cart-note">Observação para o comerciante</label>
        <textarea id="cart-note" class="form-input" rows="2" maxlength="300" placeholder="Ex.: prefiro bananas mais maduras"></textarea>
      </section>
      <section class="card cart-payment-card" aria-labelledby="cart-payment-title">
        <div class="cart-payment-heading">
          <h2 id="cart-payment-title">Pagamento</h2>
          <button class="text-button" data-toggle-payment-options type="button" aria-expanded="true">Ver menos ‹</button>
        </div>
        <div class="cart-payment-selected">
          <span class="cart-payment-icon" aria-hidden="true">▣</span>
          <span><strong data-selected-payment-label>Selecione uma forma de pagamento</strong><small data-selected-payment-description>O botão Reservar será liberado após a escolha.</small></span>
          <span class="cart-payment-check" data-payment-selected-indicator aria-hidden="true" hidden>●</span>
        </div>
        <fieldset class="cart-payment-options" data-payment-options>
          <legend>Escolha uma preferência</legend>
          <label class="cart-payment-unavailable-option"><input type="radio" name="cart-payment" value="credito" disabled> Cartão de crédito <small>Indisponível</small></label>
          <label class="cart-payment-unavailable-option"><input type="radio" name="cart-payment" value="debito" disabled> Cartão de débito <small>Indisponível</small></label>
          <label><input type="radio" name="cart-payment" value="pix"> Pix</label>
          <label><input type="radio" name="cart-payment" value="dinheiro"> Dinheiro</label>
        </fieldset>
        <p class="checkout-note cart-payment-unavailable" role="status">Cartão de crédito e cartão de débito ainda não estão disponíveis. Pix e dinheiro podem ser selecionados.</p>
      </section>
      <div class="cart-checkout-bar">
        <div class="cart-total-row"><strong>Total</strong><strong id="cart-total">R$ 0,00</strong></div>
        <button id="checkout-button" class="btn btn-primary btn-full" type="button" disabled>Reservar pedido</button>
        <p id="checkout-error" class="form-error" role="alert"></p>
      </div>
    </main>`;
};

window.CarrinhoPageInit = function () {
  const list = document.getElementById("cart-items");
  const recommendationList = document.getElementById(
    "cart-recommendation-list",
  );
  const total = document.getElementById("cart-total");
  const fulfillment = document.getElementById("cart-fulfillment");
  const addressGroup = document.getElementById("cart-address-group");
  const checkout = document.getElementById("checkout-button");
  const error = document.getElementById("checkout-error");
  const paymentOptions = document.querySelector("[data-payment-options]");
  const paymentToggle = document.querySelector("[data-toggle-payment-options]");
  const paymentLabels = {
    credito: "Crédito",
    debito: "Débito",
    pix: "Pix",
    dinheiro: "Dinheiro",
  };
  const recommendations = new Map();
  let isSubmitting = false;

  function updateSelectedPayment() {
    const selectedMethod = paymentOptions.querySelector(
      'input[name="cart-payment"]:checked',
    )?.value;
    const selectedLabel = document.querySelector(
      "[data-selected-payment-label]",
    );
    const description = document.querySelector(
      "[data-selected-payment-description]",
    );
    const indicator = document.querySelector(
      "[data-payment-selected-indicator]",
    );

    selectedLabel.textContent =
      paymentLabels[selectedMethod] || "Selecione uma forma de pagamento";
    description.textContent = selectedMethod
      ? "Forma de pagamento selecionada"
      : "O botão Reservar será liberado após a escolha.";
    indicator.hidden = !selectedMethod;
  }

  function updateCheckoutAvailability() {
    const selectedMethod = paymentOptions.querySelector(
      'input[name="cart-payment"]:checked',
    )?.value;
    checkout.disabled =
      isSubmitting ||
      readCart().length === 0 ||
      !["pix", "dinheiro"].includes(selectedMethod);
  }

  function render() {
    const items = readCart();
    if (!items.length) {
      list.innerHTML =
        '<section class="empty-state card"><h2> Seu carrinho está vazio</h2><p>Encontre uma oferta e adicione um produto.</p><button class="btn btn-primary" onclick="Router.go(\'ofertas\')">Ver ofertas</button></section>';
      updateCheckoutAvailability();
      total.textContent = window.formatMoney(0);
      document.querySelector(".cart-recommendations").hidden = true;
      document.querySelector(".cart-payment-card").hidden = true;
      document.querySelector(".cart-checkout-bar").hidden = true;
      return;
    }
    document.querySelector(".cart-recommendations").hidden = false;
    document.querySelector(".cart-payment-card").hidden = false;
    document.querySelector(".cart-checkout-bar").hidden = false;
    updateSelectedPayment();
    updateCheckoutAvailability();
    const groups = new Map();
    items.forEach((item) => {
      const group = groups.get(item.ownerUid) || [];
      group.push(item);
      groups.set(item.ownerUid, group);
    });
    list.innerHTML = Array.from(groups.values())
      .map((group) => {
        const firstItem = group[0];
        return `
          <section class="cart-vendor-card">
            <header class="cart-vendor-heading">
              <img src="assets/banca-figma.png" alt="" aria-hidden="true">
              <div>
                <strong>${storyEscape(firstItem.stallName || "Banca com nome não cadastrado")}</strong>
                <span>Vendedor: ${storyEscape(firstItem.ownerName || "Vendedor não cadastrado")}</span>
                ${renderStallLocation(firstItem.stallLocation, "cart-vendor-location")}
              </div>
            </header>
            <div class="cart-vendor-items">
              ${group
                .map(
                  (item) => `
                <article class="cart-item">
                  ${item.image ? `<img src="${storyEscape(item.image)}" alt="${storyEscape(item.name)}">` : '<div class="cart-item-placeholder" aria-hidden="true">🥬</div>'}
                  <div class="cart-item-info">
                    <strong>${storyEscape(item.name || "Produto")}</strong>
                    <span>${window.formatMoney(item.price)} / ${storyEscape(item.unit || "unidade")}</span>
                  </div>
                  <label class="quantity-label">Qtd.<input data-quantity="${storyEscape(item.offerId)}" type="number" min="1" max="99" value="${item.quantity}"></label>
                  <button class="text-button danger-text" data-remove-cart="${storyEscape(item.offerId)}" type="button">Remover</button>
                </article>`,
                )
                .join("")}
            </div>
          </section>`;
      })
      .join("");
    total.textContent = window.formatMoney(
      items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    );
    list.querySelectorAll("[data-quantity]").forEach((input) =>
      input.addEventListener("change", () => {
        const updated = readCart();
        const item = updated.find(
          (entry) => entry.offerId === input.dataset.quantity,
        );
        if (item)
          item.quantity = Math.max(1, Math.min(99, Number(input.value) || 1));
        writeCart(updated);
        render();
      }),
    );
    list.querySelectorAll("[data-remove-cart]").forEach((button) =>
      button.addEventListener("click", () => {
        window.Cart.remove(button.dataset.removeCart);
        render();
      }),
    );
    renderRecommendations();
  }

  function renderRecommendations() {
    const cartOfferIds = new Set(readCart().map((item) => item.offerId));
    const suggestions = Array.from(recommendations.values())
      .filter((offer) => !cartOfferIds.has(offer.id))
      .slice(0, 6);
    if (!suggestions.length) {
      recommendationList.innerHTML =
        '<p class="cart-recommendation-empty">Não há outros produtos disponíveis no momento.</p>';
      return;
    }
    recommendationList.innerHTML = suggestions
      .map(
        (offer) => `
      <article class="product-recommendation-card">
        <div class="product-recommendation-open">
          ${offer.image ? `<img src="${storyEscape(offer.image)}" alt="">` : '<span class="product-recommendation-placeholder" aria-hidden="true">🥬</span>'}
          <strong>${storyEscape(offer.name || "Produto")}</strong>
          <small>${storyEscape(offer.ownerName || "Vendedor")}</small>
          <b>${window.formatMoney(offer.price)}<small>/${storyEscape(offer.unit || "unidade")}</small></b>
        </div>
        <button class="product-recommendation-add" type="button" data-add-cart-recommendation="${storyEscape(offer.id)}" aria-label="Adicionar ${storyEscape(offer.name || "produto")} ao carrinho">+</button>
      </article>
    `,
      )
      .join("");
    recommendationList
      .querySelectorAll("[data-add-cart-recommendation]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const offer = recommendations.get(
            button.dataset.addCartRecommendation,
          );
          if (!offer) return;
          window.Cart.add(offer, 1, { silent: true });
          render();
        });
      });
  }

  fulfillment.addEventListener("change", () => {
    addressGroup.hidden = fulfillment.value !== "delivery";
  });
  document.querySelector("[data-clear-cart]").addEventListener("click", () => {
    if (
      !readCart().length ||
      !window.confirm("Deseja remover todos os itens do carrinho?")
    )
      return;
    window.Cart.clear();
    render();
  });
  paymentToggle.addEventListener("click", () => {
    paymentOptions.hidden = !paymentOptions.hidden;
    paymentToggle.setAttribute("aria-expanded", String(!paymentOptions.hidden));
    paymentToggle.textContent = paymentOptions.hidden
      ? "Ver tudo ›"
      : "Ver menos ‹";
  });
  paymentOptions.addEventListener("change", (event) => {
    if (event.target.name !== "cart-payment") return;
    updateSelectedPayment();
    updateCheckoutAvailability();
  });
  checkout.addEventListener("click", async () => {
    if (checkout.disabled) return;
    error.textContent = "";
    const items = readCart();
    if (!items.length) return;
    const address = document.getElementById("cart-address").value.trim();
    if (fulfillment.value === "delivery" && !address) {
      error.textContent = "Informe um endereço para combinar a entrega.";
      return;
    }
    isSubmitting = true;
    checkout.disabled = true;
    checkout.textContent = "Reservando pedido...";
    try {
      await window.Backend.createOrders(
        items,
        fulfillment.value,
        address,
        document.getElementById("cart-note").value,
        paymentOptions.querySelector('input[name="cart-payment"]:checked')
          .value,
      );
      window.Cart.clear();
      alert("Pedido reservado! Você pode acompanhar o status na aba Pedidos.");
      Router.go("pedidos");
    } catch (submitError) {
      console.error(submitError);
      error.textContent =
        submitError.message || "Não foi possível reservar o pedido.";
      isSubmitting = false;
      updateCheckoutAvailability();
      checkout.textContent = "Reservar pedido";
    }
  });
  render();
  if (typeof window.Backend?.getOffers === "function") {
    window.Backend.getOffers()
      .then((offers) => {
        offers
          .filter(
            (offer) =>
              offer?.active && offer.ownerUid !== window.Auth?.user?.uid,
          )
          .forEach((offer) => recommendations.set(String(offer.id), offer));
        renderRecommendations();
      })
      .catch((loadError) => {
        console.error(
          "Não foi possível carregar sugestões para a sacola:",
          loadError,
        );
        recommendationList.innerHTML =
          '<p class="cart-recommendation-empty" role="status">Não foi possível carregar sugestões agora.</p>';
      });
  } else {
    recommendationList.innerHTML =
      '<p class="cart-recommendation-empty" role="status">Sugestões indisponíveis no momento.</p>';
  }
};

window.CriarStoryPage = function () {
  return `
    <main class="page commerce-page">
      <header class="page-heading"><div><h1>Nova novidade</h1><p>Compartilhe uma atualização com seus clientes.</p></div></header>
      <form id="story-form" class="card commerce-form">
        <label class="form-label" for="story-text">Mensagem</label>
        <textarea id="story-text" class="form-input" maxlength="240" required placeholder="Ex.: Colheita fresca chegou hoje!"></textarea>
        <label class="form-label" for="story-image">Foto (opcional)</label>
        <input id="story-image" class="form-input" type="file" accept="image/*">
        <img id="story-preview" class="story-preview" alt="Prévia da foto" hidden>
        <button class="btn btn-primary btn-full" type="submit">Publicar novidade</button>
        <p id="story-error" class="form-error" role="alert"></p>
      </form>
    </main>`;
};

window.CriarStoryPageInit = function () {
  const form = document.getElementById("story-form");
  const input = document.getElementById("story-image");
  const preview = document.getElementById("story-preview");
  let imageData = null;
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    imageData = null;
    if (!file) {
      preview.hidden = true;
      return;
    }
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      input.value = "";
      document.getElementById("story-error").textContent =
        "Escolha uma imagem de até 5 MB.";
      preview.hidden = true;
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 1000 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas
          .getContext("2d")
          .drawImage(image, 0, 0, canvas.width, canvas.height);
        imageData = canvas.toDataURL("image/jpeg", 0.75);
        preview.src = imageData;
        preview.hidden = false;
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button[type=submit]");
    const error = document.getElementById("story-error");
    error.textContent = "";
    button.disabled = true;
    button.textContent = "Publicando...";
    try {
      await window.Backend.createStory({
        text: document.getElementById("story-text").value,
        image: imageData,
      });
      alert("Novidade publicada.");
      Router.go("home");
    } catch (submitError) {
      console.error(submitError);
      error.textContent = submitError.message || "Não foi possível publicar.";
      button.disabled = false;
      button.textContent = "Publicar novidade";
    }
  });
};
