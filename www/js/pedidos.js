// js/pedidos.js

window.PedidosPage = function () {
  const isMerchant = window.Auth?.user?.type === "comerciante";
  return `
    <main class="page pedidos-page${isMerchant ? " pedidos-page-merchant" : ""}">
      <!-- ============ HERO BANNER ============ -->
      <div class="pedidos-hero">
        <div class="pedidos-hero-text">
          <h1>${isMerchant ? "Ver pedidos" : "Meus pedidos"}</h1>
          <p>${isMerchant ? "Acompanhe seus pedidos e histórico" : "Acompanhe seus pedidos em tempo real e consulte o histórico"}</p>
        </div>
        <!-- Imagem corrigida via CSS (largura em % para não quebrar a tela) -->
        <img src="assets/cesta.png" class="pedidos-hero-img" alt="Cesta" />
      </div>

      <!-- ============ TABS ============ -->
      ${isMerchant ? `
      <div class="pedidos-merchant-toolbar">
        <button class="pedidos-back-button" type="button" data-orders-back aria-label="Voltar para o início">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <label class="pedidos-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m16 16 4 4"></path></svg>
          <input type="search" data-orders-search aria-label="Buscar pedidos" placeholder="Buscar produtos, produtores, feiras..." />
        </label>
      </div>
      ` : `
      <div class="pedidos-tabs-wrapper">
        <div class="pedidos-tabs">
          <button class="tab-btn active" type="button" data-orders-filter="active" aria-selected="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            Pedidos Ativos <span data-orders-count="active"></span>
          </button>
          <button class="tab-btn" type="button" data-orders-filter="history" aria-selected="false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Histórico <span data-orders-count="history"></span>
          </button>
        </div>
      </div>
      `}

      <!-- ============ LISTA DE PEDIDOS (VAZIA NO MOMENTO) ============ -->
      <p class="pedidos-feedback" data-orders-feedback role="status" hidden></p>
      <div class="pedidos-list" data-pedidos aria-live="polite">
        <!-- Injetado pelo JS -->
      </div>
      <section
        class="merchant-order-detail-screen"
        data-merchant-order-detail
        aria-live="polite"
        hidden
      ></section>
    </main>

    <!-- ============ NAV INFERIOR ============ -->
    <nav class="bottom-nav${isMerchant ? " pedidos-merchant-nav" : ""}">
      <button class="nav-item" data-page="home">
        <div class="nav-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        </div>
        <span class="nav-label">Feira</span>
      </button>
      
      <button class="nav-item" data-page="ofertas">
        <div class="nav-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 3.09L19.36 5l-.54 4.27L22 12l-3.18 2.73.54 4.27-4.27-.09L12 22l-3.09-3.09L4.64 19l.54-4.27L2 12l3.18-2.73-.54-4.27 4.27.09L12 2z"></path><path d="M9 15l6-6"></path><circle cx="9" cy="9" r="0.5" fill="currentColor"></circle><circle cx="15" cy="15" r="0.5" fill="currentColor"></circle></svg>
        </div>
        <span class="nav-label">Ofertas</span>
      </button>

      <button class="nav-item active" data-page="pedidos">
        <div class="nav-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
        </div>
        <span class="nav-label">Pedidos</span>
      </button>
      
      <button class="nav-item" data-page="perfil">
        <div class="nav-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </div>
        <span class="nav-label">Perfil</span>
      </button>
    </nav>
  `;
};

const ORDER_STATUS = {
  pending: {
    label: "Aguardando confirmação",
    next: "accepted",
    action: "Aceitar pedido",
  },
  accepted: { label: "Aceito", next: "ready", action: "Marcar como pronto" },
  ready: {
    label: "Pronto para retirar",
    next: "completed",
    action: "Concluir pedido",
  },
  completed: { label: "Concluído", terminal: true },
  delivered: { label: "Entregue", terminal: true },
  cancelled: { label: "Cancelado", terminal: true },
  rejected: { label: "Recusado", terminal: true },
};

const ACTIVE_ORDER_STATUSES = new Set(["pending", "accepted", "ready"]);

function escapeOrderHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeOrderSearchText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function orderStatus(order) {
  return String(order?.status || "pending").toLowerCase();
}

function orderStatusInfo(order) {
  const status = orderStatus(order);
  return (
    ORDER_STATUS[status] || {
      label: status || "Em andamento",
      terminal: !ACTIVE_ORDER_STATUSES.has(status),
    }
  );
}

function safeOrderImage(value) {
  const image = String(value || "").trim();
  if (!/^(https?:|data:image\/)/i.test(image)) return "";
  return escapeOrderHtml(image);
}

function formatOrderMoney(value) {
  if (typeof window.formatMoney === "function")
    return window.formatMoney(value);
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatOrderDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não informada";
  return date
    .toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(", ", " às ");
}

function orderMarketLocation(order) {
  const location =
    order?.marketLocation ||
    order?.items?.find((item) => item?.location)?.location;
  if (
    !location ||
    location.latitude === undefined ||
    location.longitude === undefined
  ) {
    return null;
  }
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }
  return { latitude, longitude };
}

function orderStallLocation(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  const location =
    order?.stallLocation ||
    items.find((item) => item?.stallLocation)?.stallLocation;
  if (!location || typeof location !== "object") return null;
  const normalized = {
    marketName: String(location.marketName || "").trim(),
    city: String(location.city || "").trim(),
    state: String(location.state || "").trim(),
    reference: String(location.reference || "").trim(),
  };
  return Object.values(normalized).some(Boolean) ? normalized : null;
}

function renderOrderTracking(order) {
  const status = orderStatus(order);
  if (status === "cancelled" || status === "rejected") {
    return `<p class="pedido-tracking-final">${escapeOrderHtml(orderStatusInfo(order).label)}.</p>`;
  }
  const stages = [
    ["pending", "Pedido enviado"],
    ["accepted", "Confirmado pelo vendedor"],
    ["ready", "Pronto para retirada/entrega"],
    ["completed", "Concluído"],
  ];
  const currentStage =
    status === "delivered" ? "completed" : status;
  const currentIndex = stages.findIndex(([stage]) => stage === currentStage);
  return `<ol class="pedido-tracking-steps">${stages
    .map(
      ([stage, label], index) => `
        <li class="${index <= currentIndex ? "is-complete" : ""}${stage === currentStage ? " is-current" : ""}">
          <span aria-hidden="true"></span>
          <div><strong>${label}</strong>${stage === currentStage ? `<small>${escapeOrderHtml(formatOrderDate(order.updatedAt || order.createdAt))}</small>` : ""}</div>
        </li>`,
    )
    .join("")}</ol>`;
}

function renderCustomerOrderReview(order) {
  const review = order.review;
  const rating = Number(review?.rating);
  const hasReview = Number.isInteger(rating) && rating >= 1 && rating <= 5;
  if (hasReview) {
    const stars = `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`;
    return `<section class="pedido-review-summary" aria-label="Avaliação enviada">
      <strong>Sua avaliação</strong>
      <span class="pedido-review-stars-display" aria-label="${rating} de 5 estrelas">${stars}</span>
      ${review.comment ? `<p>${escapeOrderHtml(review.comment)}</p>` : ""}
    </section>`;
  }

  const orderId = escapeOrderHtml(order.id);
  return `<button class="pedido-review-toggle" type="button" data-review-toggle="${orderId}" aria-expanded="false" aria-controls="pedido-review-form-${orderId}">Avaliar</button>
    <form class="pedido-review-form" id="pedido-review-form-${orderId}" data-review-form="${orderId}" hidden>
      <fieldset class="pedido-review-rating">
        <legend>Como foi sua experiência?</legend>
        <div class="pedido-review-stars">
          ${[1, 2, 3, 4, 5]
            .map(
              (value) => `<label data-review-star="${value}">
                <input type="radio" name="rating" value="${value}" required>
                <span aria-hidden="true">★</span>
                <span class="pedido-review-sr-only">${value} ${value === 1 ? "estrela" : "estrelas"}</span>
              </label>`,
            )
            .join("")}
        </div>
      </fieldset>
      <label class="pedido-review-comment">
        Comentário <span>(opcional)</span>
        <textarea name="comment" rows="3" maxlength="500" placeholder="Conte como foi sua experiência"></textarea>
      </label>
      <div class="pedido-review-actions">
        <button class="btn-outline" type="button" data-review-cancel>Cancelar</button>
        <button class="btn-solid" type="submit">Enviar avaliação</button>
      </div>
    </form>`;
}

function renderOrderDetails(
  order,
  fairSellerName,
  fulfillment,
  cancellationAction,
) {
  const items = Array.isArray(order.items) ? order.items : [];
  const location = orderMarketLocation(order);
  const stallLocation = orderStallLocation(order);
  const city = [stallLocation?.city, stallLocation?.state]
    .filter(Boolean)
    .join(", ");
  const stallLocationHtml = stallLocation
    ? [
        stallLocation.marketName
          ? `<p><strong>Feira:</strong> ${escapeOrderHtml(stallLocation.marketName)}</p>`
          : "",
        city ? `<p><strong>Cidade / UF:</strong> ${escapeOrderHtml(city)}</p>` : "",
        stallLocation.reference
          ? `<p><strong>Banca / referência:</strong> ${escapeOrderHtml(stallLocation.reference)}</p>`
          : "",
      ].join("")
    : "";
  const locationHtml = location
    ? `<a href="https://www.google.com/maps?q=${location.latitude},${location.longitude}" target="_blank" rel="noopener noreferrer">Ver localização da feira no mapa</a>`
    : `<span class="market-location-unavailable">${stallLocation ? "Ponto exato da feira não cadastrado no mapa" : "Localização da feira não cadastrada pelo vendedor"}</span>`;
  const deliveryDetails =
    order.fulfillment === "delivery" && order.address
      ? `<p><strong>Endereço combinado:</strong> ${escapeOrderHtml(order.address)}</p>`
      : "";
  const note = order.note
    ? `<p><strong>Observação:</strong> ${escapeOrderHtml(order.note)}</p>`
    : "";
  return `
    <div class="pedido-expanded" data-panel-content="details" hidden>
      <section class="pedido-detail-section">
        <h5>Produtos do pedido</h5>
        <ul class="pedido-detail-items">${items
          .map(
            (item) => `
              <li>
                <span>${escapeOrderHtml(item?.quantity || 0)} × ${escapeOrderHtml(item?.name || "Produto")}</span>
                <strong>${escapeOrderHtml(formatOrderMoney(Number(item?.price || 0) * Number(item?.quantity || 0)))}</strong>
              </li>`,
          )
          .join("")}</ul>
      </section>
      <section class="pedido-detail-section">
        <h5>Feira e vendedor</h5>
        <p><strong>${escapeOrderHtml(fairSellerName)}</strong></p>
        ${stallLocationHtml}
        ${locationHtml}
      </section>
      <section class="pedido-detail-section">
        <h5>Recebimento</h5>
        <p>${escapeOrderHtml(fulfillment)}</p>
        ${deliveryDetails}
        ${note}
      </section>
      ${cancellationAction}
    </div>
    <div class="pedido-expanded pedido-tracking" data-panel-content="tracking" hidden>
      <h5>Acompanhamento do pedido</h5>
      ${renderOrderTracking(order)}
    </div>`;
}

function renderOrderItems(items) {
  const safeItems = Array.isArray(items) ? items : [];
  const visibleItems = safeItems.slice(0, 4);
  const itemBoxes = visibleItems
    .map((item) => {
      const image = safeOrderImage(item?.image);
      return `<div class="item-box" title="${escapeOrderHtml(item?.name || "Produto")}">
        ${image ? `<img src="${image}" alt="${escapeOrderHtml(item?.name || "Produto")}">` : '<span aria-hidden="true">🥬</span>'}
        <span class="item-qtd">${escapeOrderHtml(item?.quantity || 0)}</span>
      </div>`;
    })
    .join("");
  const more =
    safeItems.length > 4
      ? `<div class="item-more"><strong>+${safeItems.length - 4}</strong><span>itens</span></div>`
      : "";
  const summary = safeItems.length
    ? safeItems
        .map((item) => `${item?.quantity || 0}x ${item?.name || "Produto"}`)
        .map(escapeOrderHtml)
        .join(", ")
    : "Nenhum item informado";

  return `<div class="pedido-items">${itemBoxes || '<div class="item-box" aria-hidden="true">🥬</div>'}${more}</div>
    <p class="pedido-items-summary">${summary}</p>`;
}

function renderOrderCard(order, role, userId) {
  const status = orderStatus(order);
  const statusInfo = orderStatusInfo(order);
  const isReceived = role === "merchant";
  const personName = isReceived
    ? order.buyerName || "Cliente"
    : order.merchantName || "Comerciante";
  const statusLabel =
    isReceived && status === "accepted"
      ? "Em preparação"
      : statusInfo.label;
  const fulfillment =
    order.fulfillment === "delivery" ? "Entrega combinada" : "Retirada";
  const canManageAsMerchant =
    isReceived &&
    order.merchantUid === userId &&
    ACTIVE_ORDER_STATUSES.has(status);
  const canCancelAsBuyer =
    !isReceived && order.buyerUid === userId && status === "pending";
  const orderIsDelivered = status === "delivered" || status === "completed";
  const customerOrderCode =
    !isReceived &&
    !orderIsDelivered &&
    /^\d{6}$/.test(String(order.orderCode ?? ""))
      ? `<p class="pedido-confirmation-code" aria-label="Código do pedido: ${escapeOrderHtml(order.orderCode)}">Codigo: <strong>${escapeOrderHtml(order.orderCode)}</strong></p>`
      : "";
  const customerReview =
    !isReceived && orderIsDelivered ? renderCustomerOrderReview(order) : "";
  const actions = canManageAsMerchant
    ? `<div class="pedido-actions pedido-actions-manage">
        ${statusInfo.next ? `<button class="btn-solid pedido-action-primary" type="button" data-order-id="${escapeOrderHtml(order.id)}" data-order-status="${escapeOrderHtml(statusInfo.next)}">${escapeOrderHtml(statusInfo.action)}</button>` : ""}
        <button class="btn-outline pedido-action-secondary" type="button" data-order-id="${escapeOrderHtml(order.id)}" data-order-status="cancelled">${status === "pending" ? "Recusar" : "Cancelar"}</button>
      </div>`
    : canCancelAsBuyer
      ? `<div class="pedido-actions"><button class="btn-outline" type="button" data-order-id="${escapeOrderHtml(order.id)}" data-order-status="cancelled">Cancelar pedido</button></div>`
      : "";
  const marketLocation = orderMarketLocation(order);
  const stallLocation = orderStallLocation(order);
  const city = [stallLocation?.city, stallLocation?.state]
    .filter(Boolean)
    .join(", ");
  const textualLocation = [
    stallLocation?.marketName,
    city,
    stallLocation?.reference,
  ]
    .filter(Boolean)
    .map(escapeOrderHtml)
    .join(" · ");
  const marketSubtitle = marketLocation
    ? `<a class="market-map-link" href="https://www.google.com/maps?q=${marketLocation.latitude},${marketLocation.longitude}" target="_blank" rel="noopener noreferrer">Ver ponto da feira no mapa</a>${textualLocation ? `<span> · ${textualLocation}</span>` : ""}`
    : textualLocation
      ? `<span>${textualLocation}</span>`
      : '<span class="market-location-unavailable">Localização da feira não cadastrada</span>';
  const cardHeader = `<header class="pedido-header">
    <div class="shop-info">
      <div class="shop-icon" aria-hidden="true">${isReceived
        ? '<svg class="pedido-buyer-avatar" viewBox="0 0 24 24"><path d="M12 12a4.25 4.25 0 1 0 0-8.5A4.25 4.25 0 0 0 12 12Zm0 2c-4.1 0-7.5 2.1-7.5 4.7V21h15v-2.3c0-2.6-3.4-4.7-7.5-4.7Z"/></svg>'
        : '<img src="assets/icone%20feira.png" alt="">'}</div>
      <div class="shop-text">
        <h4>${escapeOrderHtml(personName)}</h4>
        ${isReceived ? "" : `<p>${marketSubtitle}</p>`}
      </div>
    </div>
    <span class="status-badge status-${escapeOrderHtml(status)}">${escapeOrderHtml(statusLabel)}</span>
  </header>`;
  const cardSummary = isReceived
    ? `<div class="pedido-order-summary pedido-merchant-summary" role="button" tabindex="0" data-order-panel="details" aria-expanded="false" aria-label="Abrir detalhes do pedido de ${escapeOrderHtml(personName)}">
        ${cardHeader}
        ${renderOrderItems(order.items)}
        <div class="pedido-info">
          <div class="info-block"><span class="info-label">Pedido feito em:</span><strong class="info-value">${escapeOrderHtml(formatOrderDate(order.createdAt))}</strong></div>
          <div class="info-block right"><span class="info-label">Total do pedido:</span><strong class="info-value price">${escapeOrderHtml(formatOrderMoney(order.total))}</strong></div>
        </div>
      </div>`
    : `<div class="pedido-order-summary pedido-customer-summary" role="button" tabindex="0" data-order-panel="details" aria-expanded="false" aria-label="Abrir detalhes do pedido de ${escapeOrderHtml(personName)}">
      ${cardHeader}
      ${renderOrderItems(order.items)}
      <div class="pedido-info">
        <div class="info-block"><span class="info-label">Pedido feito em:</span><strong class="info-value">${escapeOrderHtml(formatOrderDate(order.createdAt))}</strong></div>
        <div class="info-block right"><span class="info-label">Total</span><strong class="info-value price">${escapeOrderHtml(formatOrderMoney(order.total))}</strong></div>
      </div>
      ${customerOrderCode}
    </div>`;
  return `<article class="pedido-card${isReceived ? " pedido-card-merchant" : ""}${status === "pending" && canManageAsMerchant ? " pedido-card-awaiting" : ""}" data-order-card="${escapeOrderHtml(order.id)}">
    ${cardSummary}
    ${customerReview}
    ${renderOrderDetails(
      order,
      order.merchantName || "Vendedor",
      fulfillment,
      isReceived ? actions : canCancelAsBuyer ? actions : "",
    )}
  </article>`;
}

function renderMerchantOrderDetail(order, userId) {
  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = Number(
    order.subtotal ??
      items.reduce(
        (sum, item) =>
          sum + Number(item?.price || 0) * Number(item?.quantity || 0),
        0,
      ),
  );
  const saleFee = Number(order.saleFee ?? order.deliveryFee ?? 0);
  const total = Number(order.total ?? subtotal + saleFee);
  const [orderDate, orderTime = "—"] = formatOrderDate(
    order.createdAt,
  ).split(" às ");
  const status = orderStatus(order);
  const statusInfo = orderStatusInfo(order);
  const canManage =
    order.merchantUid === userId && ACTIVE_ORDER_STATUSES.has(status);
  const itemCountLabel = `${items.length} ${
    items.length === 1 ? "item" : "itens"
  }`;

  return `<div class="merchant-order-detail-content" data-order-detail-id="${escapeOrderHtml(order.id)}">
    <header class="merchant-order-detail-header">
      <button type="button" class="merchant-order-back" data-order-detail-back aria-label="Voltar para os pedidos">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <h1>pedido</h1>
    </header>
    <div class="merchant-order-detail-body">
      <section class="merchant-order-detail-card merchant-order-items-card">
        <header class="merchant-order-section-header">
          <div>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L22 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>
            <h2>Itens do pedido</h2>
          </div>
          <span>${itemCountLabel}</span>
        </header>
        <ul class="merchant-order-items-list">${items
          .map((item) => {
            const name = item?.name || "Produto";
            const quantity = Number(item?.quantity || 0);
            const image = safeOrderImage(item?.image);
            return `<li>
              <span class="merchant-order-item-image">${image
                ? `<img src="${image}" alt="">`
                : '<span aria-hidden="true">🥬</span>'}</span>
              <span class="merchant-order-item-name">
                <strong>${escapeOrderHtml(name)}</strong>
                <small>${escapeOrderHtml(quantity)} ${escapeOrderHtml(item?.unit || "un")}</small>
              </span>
              <strong class="merchant-order-item-price">${escapeOrderHtml(formatOrderMoney(Number(item?.price || 0) * quantity))}</strong>
            </li>`;
          })
          .join("")}</ul>
      </section>
      <div class="merchant-order-bottom-section">
        <section class="merchant-order-detail-card merchant-order-summary-card">
          <header class="merchant-order-section-header">
            <div>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3v18M19 3v18M5 8h14M5 16h14M8 5h8M8 19h8"/></svg>
              <h2>Resumo do pedido</h2>
            </div>
          </header>
          <dl class="merchant-order-summary-lines">
            <div><dt>Data:</dt><dd>${escapeOrderHtml(orderDate)}</dd></div>
            <div><dt>Hora:</dt><dd>${escapeOrderHtml(orderTime)}</dd></div>
            <div><dt>Subtotal (${itemCountLabel})</dt><dd>${escapeOrderHtml(formatOrderMoney(subtotal))}</dd></div>
            <div><dt>Taxa de venda</dt><dd>${escapeOrderHtml(formatOrderMoney(saleFee))}</dd></div>
          </dl>
          <div class="merchant-order-summary-total">
            <strong>Total</strong>
            <strong>${escapeOrderHtml(formatOrderMoney(total))}</strong>
          </div>
        </section>
        ${canManage
          ? `<div class="merchant-order-actions">
            <div class="merchant-order-management-row">
              <label class="merchant-order-separated">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 20 6v5.3c0 5-3.4 8.5-8 10.2-4.6-1.7-8-5.2-8-10.2V6l8-3.5Z"/><path d="m8.5 12 2.2 2.2 4.8-4.8"/></svg>
                <span><strong>Pedido separado?</strong><small>Marque quando estiver separado</small></span>
                <input type="checkbox" data-order-separated="${escapeOrderHtml(order.id)}"${order.separated ? " checked" : ""}>
                <span class="merchant-order-switch" aria-hidden="true"></span>
              </label>
              <button type="button" class="merchant-order-cancel" data-detail-status="cancelled">
                <span aria-hidden="true">×</span>
                <span><strong>Cancelar pedido</strong><small>Cancelar esta compra</small></span>
              </button>
            </div>
            <button type="button" class="merchant-order-deliver" data-detail-status="delivered">Entregar pedido</button>
          </div>`
          : `<p class="merchant-order-final-status">${escapeOrderHtml(statusInfo.label)}</p>`}
        <p class="merchant-order-detail-feedback" data-order-detail-feedback role="status" hidden></p>
      </div>
      ${canManage
        ? `<div class="merchant-delivery-code-modal" data-delivery-code-modal hidden>
            <form class="merchant-delivery-code-dialog" data-delivery-code-form role="dialog" aria-modal="true" aria-labelledby="merchant-delivery-code-title">
              <button type="button" class="merchant-delivery-code-back" data-delivery-code-cancel aria-label="Voltar">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <h2 id="merchant-delivery-code-title">Digite seu código:</h2>
              <label class="merchant-delivery-code-label" for="merchant-delivery-code-input">Código do cliente</label>
              <input id="merchant-delivery-code-input" data-delivery-code-input type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="XXXXXX" aria-describedby="merchant-delivery-code-error">
              <p class="merchant-delivery-code-error" data-delivery-code-error role="alert" hidden></p>
              <button class="merchant-delivery-code-submit" type="submit">Continuar</button>
            </form>
          </div>`
        : ""}
    </div>
  </div>`;
}

window.PedidosPageInit = async function () {
  const container = document.querySelector("[data-pedidos]");
  if (!container) return;

  const page = container.closest(".pedidos-page-merchant");
  const detailContainer = document.querySelector(
    "[data-merchant-order-detail]",
  );
  const feedback = document.querySelector("[data-orders-feedback]");
  const userId = window.Auth?.user?.uid;
  const isMerchantView = window.Auth?.user?.type === "comerciante";
  const searchInput = document.querySelector("[data-orders-search]");
  let activeFilter = "active";
  let orderSearch = "";
  let orders = [];
  let selectedOrderId = null;

  const setFeedback = (message, isError = false) => {
    if (!feedback) return;
    feedback.textContent = message || "";
    feedback.hidden = !message;
    feedback.setAttribute("role", isError ? "alert" : "status");
  };

  const setDetailFeedback = (message, isError = false) => {
    const detailFeedback = detailContainer?.querySelector(
      "[data-order-detail-feedback]",
    );
    if (!detailFeedback) return;
    detailFeedback.textContent = message || "";
    detailFeedback.hidden = !message;
    detailFeedback.classList.toggle("is-error", isError);
  };

  const normalizePermissionMessage = (error) => {
    const message = String(error?.message || "");
    if (
      error?.code === "permission-denied" ||
      /permission|acesso/i.test(message)
    ) {
      return "Nenhum pedido foi reservado ainda.";
    }
    return error?.message || "Nenhum pedido foi reservado ainda.";
  };

  const filterOrders = (list) =>
    list.filter((order) =>
      activeFilter === "active"
        ? ACTIVE_ORDER_STATUSES.has(orderStatus(order))
        : !ACTIVE_ORDER_STATUSES.has(orderStatus(order)),
    );

  const matchesOrderSearch = (order) => {
    const searchText = [
      order?.buyerName,
      order?.merchantName,
      order?.stallName,
      formatOrderDate(order?.createdAt),
      ...(Array.isArray(order?.items)
        ? order.items.map((item) => item?.name)
        : []),
    ]
      .filter(Boolean)
      .join(" ");
    return normalizeOrderSearchText(searchText).includes(orderSearch);
  };

  const render = () => {
    if (isMerchantView && selectedOrderId && detailContainer) {
      const selectedOrder = orders.find(
        (order) => order?.id === selectedOrderId,
      );
      if (selectedOrder) {
        page?.classList.add("has-order-detail");
        document.body.classList.add("has-merchant-order-detail");
        detailContainer.hidden = false;
        detailContainer.innerHTML = renderMerchantOrderDetail(
          selectedOrder,
          userId,
        );

        detailContainer
          .querySelector("[data-order-detail-back]")
          ?.addEventListener("click", () => {
            selectedOrderId = null;
            render();
          });

        const deliveryCodeModal = detailContainer.querySelector(
          "[data-delivery-code-modal]",
        );
        const deliveryCodeForm = detailContainer.querySelector(
          "[data-delivery-code-form]",
        );
        const deliveryCodeInput = detailContainer.querySelector(
          "[data-delivery-code-input]",
        );
        const deliveryCodeError = detailContainer.querySelector(
          "[data-delivery-code-error]",
        );
        const closeDeliveryCodeModal = () => {
          if (deliveryCodeModal?.hidden === false) {
            deliveryCodeModal.hidden = true;
            deliveryCodeInput.value = "";
            deliveryCodeError.hidden = true;
            detailContainer
              .querySelector('[data-detail-status="delivered"]')
              ?.focus();
          }
        };

        deliveryCodeModal?.addEventListener("click", (event) => {
          if (event.target === deliveryCodeModal) closeDeliveryCodeModal();
        });
        deliveryCodeModal?.addEventListener("keydown", (event) => {
          if (event.key === "Escape") closeDeliveryCodeModal();
        });
        deliveryCodeModal
          ?.querySelector("[data-delivery-code-cancel]")
          ?.addEventListener("click", closeDeliveryCodeModal);
        deliveryCodeInput?.addEventListener("input", () => {
          deliveryCodeInput.value = deliveryCodeInput.value
            .replace(/\D/g, "")
            .slice(0, 6);
          deliveryCodeError.hidden = true;
        });
        deliveryCodeForm?.addEventListener("submit", async (event) => {
          event.preventDefault();
          if (!selectedOrderId) return;

          const enteredCode = deliveryCodeInput.value;
          const orderCode = String(selectedOrder.orderCode ?? "");
          if (
            !/^\d{6}$/.test(enteredCode) ||
            !/^\d{6}$/.test(orderCode) ||
            enteredCode !== orderCode
          ) {
            deliveryCodeError.textContent =
              "Código incorreto. Confira com o cliente.";
            deliveryCodeError.hidden = false;
            deliveryCodeInput.focus();
            deliveryCodeInput.select();
            return;
          }

          const formControls = deliveryCodeForm.querySelectorAll(
            "input, button",
          );
          formControls.forEach((control) => {
            control.disabled = true;
          });
          deliveryCodeError.textContent = "Validando código...";
          deliveryCodeError.hidden = false;

          try {
            if (typeof window.Backend?.deliverOrder !== "function") {
              throw new Error("Não foi possível validar o código do pedido.");
            }
            await window.Backend.deliverOrder(selectedOrderId, enteredCode);
            deliveryCodeModal.hidden = true;
            setDetailFeedback("Pedido marcado como entregue.");
          } catch (error) {
            console.error(error);
            formControls.forEach((control) => {
              control.disabled = false;
            });
            deliveryCodeError.textContent =
              error?.message || "Não foi possível validar o código do pedido.";
            deliveryCodeError.hidden = false;
            deliveryCodeInput.focus();
          }
        });

        detailContainer
          .querySelectorAll("[data-detail-status]")
          .forEach((button) => {
            button.addEventListener("click", async () => {
              const nextStatus = button.dataset.detailStatus;
              if (!selectedOrderId || !nextStatus) return;
              if (nextStatus === "delivered") {
                if (!deliveryCodeModal || !deliveryCodeInput) {
                  setDetailFeedback(
                    "Não foi possível solicitar o código de entrega.",
                    true,
                  );
                  return;
                }
                deliveryCodeInput.value = "";
                deliveryCodeError.hidden = true;
                deliveryCodeModal.hidden = false;
                deliveryCodeInput.focus();
                return;
              }
              const actionButtons = detailContainer.querySelectorAll(
                "[data-detail-status], [data-order-separated]",
              );
              actionButtons.forEach((action) => {
                action.disabled = true;
              });
              setDetailFeedback("Atualizando pedido...");
              try {
                if (
                  typeof window.Backend?.updateOrderStatus !== "function"
                ) {
                  throw new Error("Não foi possível atualizar o pedido.");
                }
                await window.Backend.updateOrderStatus(
                  selectedOrderId,
                  nextStatus,
                );
                setDetailFeedback(
                  nextStatus === "delivered"
                    ? "Pedido marcado como entregue."
                    : "Pedido cancelado.",
                );
              } catch (error) {
                console.error(error);
                detailContainer
                  .querySelectorAll(
                    "[data-detail-status], [data-order-separated]",
                  )
                  .forEach((action) => {
                    action.disabled = false;
                  });
                setDetailFeedback(
                  error?.message || "Não foi possível atualizar o pedido.",
                  true,
                );
              }
            });
          });

        detailContainer
          .querySelectorAll("[data-order-separated]")
          .forEach((checkbox) => {
            checkbox.addEventListener("change", async () => {
              const wasSeparated = !checkbox.checked;
              checkbox.disabled = true;
              setDetailFeedback("Atualizando separação do pedido...");
              try {
                if (
                  typeof window.Backend?.updateOrderPreparation !== "function"
                ) {
                  throw new Error(
                    "Não foi possível atualizar a separação do pedido.",
                  );
                }
                await window.Backend.updateOrderPreparation(
                  checkbox.dataset.orderSeparated,
                  checkbox.checked,
                );
                setDetailFeedback("Separação do pedido atualizada.");
              } catch (error) {
                console.error(error);
                if (checkbox.isConnected) {
                  checkbox.checked = wasSeparated;
                  checkbox.disabled = false;
                }
                setDetailFeedback(
                  error?.message ||
                    "Não foi possível atualizar a separação do pedido.",
                  true,
                );
              } finally {
                if (checkbox.isConnected) checkbox.disabled = false;
              }
            });
          });
        return;
      }
      selectedOrderId = null;
    }

    page?.classList.remove("has-order-detail");
    document.body.classList.remove("has-merchant-order-detail");
    if (detailContainer) {
      detailContainer.hidden = true;
      detailContainer.innerHTML = "";
    }

    const buyerOrders = orders.filter((order) => order?.buyerUid === userId);
    const merchantOrders = orders.filter(
      (order) => order?.merchantUid === userId,
    );
    const visibleBuyerOrders = isMerchantView ? [] : filterOrders(buyerOrders);
    const visibleMerchantOrders = isMerchantView
      ? merchantOrders.filter(matchesOrderSearch)
      : filterOrders(merchantOrders);
    const sections = [];

    if (visibleBuyerOrders.length) {
      sections.push(
        `<section class="orders-section"><h2>Pedidos que fiz</h2>${visibleBuyerOrders
          .map((order) => renderOrderCard(order, "buyer", userId))
          .join("")}</section>`,
      );
    }
    if (visibleMerchantOrders.length) {
      sections.push(
        `<section class="orders-section">${isMerchantView ? "" : "<h2>Pedidos recebidos</h2>"}${visibleMerchantOrders
          .map((order) => renderOrderCard(order, "merchant", userId))
          .join("")}</section>`,
      );
    }
    container.innerHTML = sections.length
      ? sections.join("")
      : `<div class="empty-state"><h3>${isMerchantView
        ? orderSearch ? "Nenhum pedido encontrado" : "Nenhum pedido recebido"
        : activeFilter === "active" ? "Nenhum pedido ativo" : "Nenhum pedido no histórico"}</h3><p>${isMerchantView
        ? orderSearch ? "Tente buscar por outro cliente, produto ou data." : "Os pedidos dos clientes aparecerão aqui assim que houver alguma reserva."
        : activeFilter === "active" ? "Seus pedidos em andamento aparecerão aqui." : "Pedidos concluídos ou cancelados aparecerão aqui."}</p></div>`;

    container.querySelectorAll("[data-order-panel]").forEach((control) => {
      const togglePanels = (event) => {
        if (event.target.closest("a, button, input, select, textarea")) return;
        const card = control.closest("[data-order-card]");
        if (isMerchantView) {
          if (card?.dataset.orderCard) {
            selectedOrderId = card.dataset.orderCard;
            render();
          }
          return;
        }
        const panelName = control.dataset.orderPanel;
        const panel = card?.querySelector(
          `[data-panel-content="${panelName}"]`,
        );
        if (!panel) return;
        const isOpening = panel.hidden;
        card
          .querySelectorAll("[data-panel-content]")
          .forEach((item) => (item.hidden = true));
        card
          .querySelectorAll("[data-order-panel]")
          .forEach((item) => item.setAttribute("aria-expanded", "false"));
        panel.hidden = !isOpening;
        if (panelName === "details" && !card.classList.contains("pedido-card-merchant")) {
          const trackingPanel = card.querySelector(
            '[data-panel-content="tracking"]',
          );
          if (trackingPanel) trackingPanel.hidden = !isOpening;
        }
        control.setAttribute("aria-expanded", String(isOpening));
      };

      control.addEventListener("click", togglePanels);
      if (control.getAttribute("role") === "button") {
        control.addEventListener("keydown", (event) => {
          if (event.target !== control) return;
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          togglePanels(event);
        });
      }
    });

    container.querySelectorAll("[data-review-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const form = button
          .closest("[data-order-card]")
          ?.querySelector("[data-review-form]");
        if (!form) return;
        const isOpening = form.hidden;
        form.hidden = !isOpening;
        button.setAttribute("aria-expanded", String(isOpening));
        button.textContent = isOpening ? "Fechar avaliação" : "Avaliar";
        if (isOpening) form.querySelector('input[name="rating"]')?.focus();
      });
    });

    container.querySelectorAll("[data-review-form]").forEach((form) => {
      form.querySelectorAll('input[name="rating"]').forEach((input) => {
        input.addEventListener("change", () => {
          const rating = Number(input.value);
          form.querySelectorAll("[data-review-star]").forEach((star) => {
            star.classList.toggle(
              "is-selected",
              Number(star.dataset.reviewStar) <= rating,
            );
          });
        });
      });

      form.querySelector("[data-review-cancel]")?.addEventListener("click", () => {
        form.hidden = true;
        const toggle = form
          .closest("[data-order-card]")
          ?.querySelector("[data-review-toggle]");
        toggle?.setAttribute("aria-expanded", "false");
        if (toggle) toggle.textContent = "Avaliar";
      });

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const orderId = form.dataset.reviewForm;
        const rating = Number(
          form.querySelector('input[name="rating"]:checked')?.value,
        );
        const comment = form.querySelector('[name="comment"]').value.trim();
        const submitButton = form.querySelector('[type="submit"]');
        if (!orderId || !Number.isInteger(rating) || rating < 1 || rating > 5)
          return;

        submitButton.disabled = true;
        setFeedback("Enviando avaliação...");
        try {
          if (typeof window.Backend?.submitOrderReview !== "function") {
            throw new Error("O serviço de avaliação não está disponível.");
          }
          await window.Backend.submitOrderReview(orderId, rating, comment);
          setFeedback("Avaliação enviada. Obrigado!");
        } catch (error) {
          console.error(error);
          if (submitButton.isConnected) submitButton.disabled = false;
          setFeedback(
            error?.code === "permission-denied"
              ? "Não foi possível enviar a avaliação. O pedido precisa estar entregue e ainda não ter sido avaliado."
              : error?.message || "Não foi possível enviar a avaliação.",
            true,
          );
        }
      });
    });

    const activeCount = orders.filter((order) =>
      ACTIVE_ORDER_STATUSES.has(orderStatus(order)),
    ).length;
    const historyCount = orders.length - activeCount;
    if (activeCountNode) activeCountNode.textContent = `(${activeCount})`;
    if (historyCountNode) historyCountNode.textContent = `(${historyCount})`;

    document.querySelectorAll("[data-order-status]").forEach((button) => {
      button.addEventListener("click", async () => {
        const orderId = button.dataset.orderId;
        const nextStatus = button.dataset.orderStatus;
        const card = button.closest("[data-order-card]");
        if (
          !orderId ||
          !nextStatus ||
          !card ||
          typeof window.Backend?.updateOrderStatus !== "function"
        )
          return;
        card.querySelectorAll("button").forEach((item) => {
          item.disabled = true;
        });
        setFeedback("Atualizando pedido...");
        try {
          await window.Backend.updateOrderStatus(orderId, nextStatus);
          setFeedback("Status do pedido atualizado.");
        } catch (error) {
          console.error(error);
          card.querySelectorAll("button").forEach((item) => {
            item.disabled = false;
          });
          setFeedback(normalizePermissionMessage(error), true);
        }
      });
    });
  };

  document.querySelectorAll("[data-orders-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter =
        button.dataset.ordersFilter === "history" ? "history" : "active";
      document.querySelectorAll("[data-orders-filter]").forEach((tab) => {
        const selected = tab === button;
        tab.classList.toggle("active", selected);
        tab.setAttribute("aria-selected", String(selected));
      });
      render();
    });
  });

  searchInput?.addEventListener("input", () => {
    orderSearch = normalizeOrderSearchText(searchInput.value.trim());
    render();
  });
  document.querySelector("[data-orders-back]")?.addEventListener("click", () => {
    window.Router?.back("home");
  });

  const activeCountNode = document.querySelector(
    '[data-orders-count="active"]',
  );
  const historyCountNode = document.querySelector(
    '[data-orders-count="history"]',
  );
  if (activeCountNode) activeCountNode.textContent = "";
  if (historyCountNode) historyCountNode.textContent = "";
  container.innerHTML =
    '<div class="empty-state"><p>Carregando pedidos...</p></div>';

  try {
    if (typeof window.Backend?.ready === "function")
      await window.Backend.ready();
  } catch (error) {
    console.warn("Auth ainda não foi inicializada:", error);
  }

  if (
    !window.Auth?.user?.uid ||
    typeof window.Backend?.watchOrders !== "function"
  ) {
    container.innerHTML =
      '<div class="empty-state"><h3>Ninguém reservou nenhum pedido</h3><p>Os pedidos dos clientes aparecerão aqui assim que houver alguma reserva.</p></div>';
    return;
  }

  try {
    return window.Backend.watchOrders(
      (nextOrders) => {
        orders = Array.isArray(nextOrders) ? nextOrders : [];
        render();
      },
      (error) => {
        console.error(error);
        const message = normalizePermissionMessage(error);
        setFeedback(message, false);
        if (!orders.length) {
          container.innerHTML =
            '<div class="empty-state"><h3>Ninguém reservou nenhum pedido</h3><p>Os pedidos dos clientes aparecerão aqui assim que houver alguma reserva.</p></div>';
        }
      },
    );
  } catch (error) {
    console.error(error);
    setFeedback(normalizePermissionMessage(error), false);
    container.innerHTML =
      '<div class="empty-state"><h3>Ninguém reservou nenhum pedido</h3><p>Os pedidos dos clientes aparecerão aqui assim que houver alguma reserva.</p></div>';
  }
};
