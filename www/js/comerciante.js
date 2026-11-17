window.ComerciantePage = async function () {
  const list = document.querySelector("[data-my-offers]");
  const offerCount = document.querySelector("[data-offer-count]");
  const searchInput = document.querySelector("[data-my-offers-search]");
  const reservations = document.querySelector("[data-merchant-orders]");
  if (!list || !window.Backend || !window.Backend.getMyOffers) return;

  let offers = [];
  let offersLoaded = false;
  const normalizeSearch = (value) =>
    String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .trim();

  const renderOffers = () => {
    if (!offersLoaded) return;
    const searchTerm = normalizeSearch(searchInput?.value);
    const matchingOffers = offers.filter((offer) =>
      [offer.name, offer.category, offer.desc, offer.unit]
        .filter(Boolean)
        .some((value) => normalizeSearch(value).includes(searchTerm)),
    );
    if (offerCount) offerCount.textContent = `(${offers.length})`;
    if (!offers.length) {
      list.innerHTML =
        '<p class="merchant-products-message">Você ainda não publicou produtos. Toque em “Adicionar” para começar.</p>';
      return;
    }
    if (!matchingOffers.length) {
      list.innerHTML =
        '<p class="merchant-products-message">Nenhum produto encontrado.</p>';
      return;
    }
    list.innerHTML = matchingOffers.map(renderMerchantOffer).join("");
  };

  searchInput?.addEventListener("input", renderOffers);
  list.addEventListener("click", async (event) => {
    const editButton = event.target.closest("[data-edit-offer]");
    if (editButton) {
      sessionStorage.setItem("xepa-edit-offer-id", editButton.dataset.editOffer);
      window.Router?.go("criarOferta");
      return;
    }

    const deleteButton = event.target.closest("[data-delete-offer]");
    if (!deleteButton || !window.confirm("Excluir esta oferta?")) return;
    deleteButton.disabled = true;
    try {
      await window.Backend.deleteOffer(deleteButton.dataset.deleteOffer);
      offers = offers.filter(
        (offer) => offer.id !== deleteButton.dataset.deleteOffer,
      );
      renderOffers();
    } catch (error) {
      console.error(error);
      renderOffers();
      window.alert("Não foi possível excluir a oferta.");
    }
  });

  try {
    offers = await window.Backend.getMyOffers();
    offersLoaded = true;
    renderOffers();
  } catch (error) {
    console.error(error);
    if (searchInput) searchInput.disabled = true;
    list.innerHTML =
      '<p class="merchant-products-message" role="alert">Não foi possível carregar seus produtos.</p>';
  }

  if (reservations) {
    reservations.innerHTML =
      '<p class="merchant-empty">Carregando pedidos reservados...</p>';
    try {
      const orders = (await window.Backend.getOrders?.()) || [];
      const merchantOrders = orders.filter((order) => {
        const status = String(order?.status || "pending").toLowerCase();
        return (
          order?.merchantUid === window.Auth?.user?.uid &&
          ["pending", "accepted", "ready"].includes(status)
        );
      });

      if (!merchantOrders.length) {
        reservations.innerHTML =
          '<p class="merchant-empty">Ainda não há pedidos reservados dos seus produtos.</p>';
        return;
      }

      reservations.innerHTML = merchantOrders
        .map((order) => renderMerchantReservation(order))
        .join("");
    } catch (error) {
      console.error(error);
      reservations.innerHTML =
        '<p class="merchant-empty">Não foi possível carregar os pedidos reservados.</p>';
    }
  }

  function renderMerchantOffer(offer) {
    const name = escapeOfferHtml(offer.name || "Produto");
    const category = escapeOfferHtml(offer.category || "Categoria não informada");
    const unit = escapeOfferHtml(offer.unit || "unidade");
    const offerId = escapeOfferHtml(offer.id);
    const imageSource = safeOfferImage(offer.image);
    const price = Number(offer.price);
    const formattedPrice = Number.isFinite(price)
      ? price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
      : "Preço indisponível";
    const image = imageSource
      ? `<img src="${imageSource}" alt="${name}" class="merchant-offer-image">`
      : `<div class="merchant-offer-image merchant-offer-placeholder" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M24 39V19M24 28c-9 0-13-5-13-12 8 0 13 4 13 12Zm0-5c0-8 5-13 13-13 0 8-5 13-13 13Z" />
            <path d="M13 38h22M17 34h14" />
          </svg>
        </div>`;
    const status = offer.active
      ? '<span class="merchant-offer-status is-active"><i aria-hidden="true"></i>Anunciado</span>'
      : '<span class="merchant-offer-status is-paused"><i aria-hidden="true"></i>Pausado</span>';

    return `
      <article class="merchant-offer">
        ${image}
        <div class="merchant-offer-info">
          <h3>${name}</h3>
          <p class="merchant-offer-category">${category}</p>
          <p class="merchant-offer-price">${Number.isFinite(price) ? `R$ ${formattedPrice}/${unit}` : formattedPrice}</p>
          ${status}
        </div>
        <div class="merchant-offer-actions">
          <button class="merchant-edit" type="button" data-edit-offer="${offerId}" aria-label="Editar ${name}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5 4 4M4 20l4-.8L19.5 7.7a2.1 2.1 0 0 0-3-3L5 16.2 4 20Z" /></svg><span>Editar</span>
          </button>
          <button class="merchant-delete" type="button" data-delete-offer="${offerId}" aria-label="Apagar ${name}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" /></svg><span>Apagar</span>
          </button>
        </div>
      </article>
    `;
  }

  function escapeOfferHtml(value) {
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

  function safeOfferImage(value) {
    const image = String(value || "").trim();
    return /^(https?:|data:image\/)/i.test(image)
      ? escapeOfferHtml(image)
      : "";
  }

  function renderMerchantReservation(order) {
    const itemSummary = Array.isArray(order.items)
      ? order.items
          .map((item) => `${item.quantity || 0}x ${item.name || "Produto"}`)
          .join(", ")
      : "Produtos reservados";
    const total = Number(order.total || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    const createdAt = new Date(
      order.createdAt || Date.now(),
    ).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const status = String(order.status || "pending").toLowerCase();
    const statusLabel =
      {
        pending: "Aguardando",
        accepted: "Aceito",
        ready: "Pronto",
        completed: "Concluído",
      }[status] || "Em andamento";

    return `
      <article class="pedido-card merchant-order-card">
        <header class="pedido-header">
          <div class="shop-info">
            <div class="shop-icon" aria-hidden="true">👤</div>
            <div class="shop-text">
              <h4>${order.buyerName || "Cliente"}</h4>
              <p>Reserva feita · ${createdAt}</p>
            </div>
          </div>
          <span class="status-badge status-${status}">${statusLabel}</span>
        </header>
        <p class="pedido-items-summary">${itemSummary}</p>
        <div class="pedido-info">
          <div class="info-block"><span class="info-label">Recebimento</span><strong class="info-value">${order.fulfillment === "delivery" ? "Entrega" : "Retirada"}</strong></div>
          <div class="info-block right"><span class="info-label">Total</span><strong class="info-value price">${total}</strong></div>
        </div>
      </article>
    `;
  }
};
