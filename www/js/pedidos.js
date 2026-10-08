// js/pedidos.js

window.PedidosPage = function () {
  return `
    <main class="page pedidos-page">
      <!-- ============ HERO BANNER ============ -->
      <div class="pedidos-hero">
        <div class="pedidos-hero-text">
          <h1>Meus pedidos</h1>
          <p>Acompanhe seus pedidos em tempo real e consulte o histórico</p>
        </div>
        <!-- Imagem corrigida via CSS (largura em % para não quebrar a tela) -->
        <img src="assets/cesta.png" class="pedidos-hero-img" alt="Cesta" />
      </div>

      <!-- ============ TABS ============ -->
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

      <!-- ============ LISTA DE PEDIDOS (VAZIA NO MOMENTO) ============ -->
      <p class="pedidos-feedback" data-orders-feedback role="status" hidden></p>
      <div class="pedidos-list" data-pedidos aria-live="polite">
        <!-- Injetado pelo JS -->
      </div>
    </main>

    <!-- ============ NAV INFERIOR ============ -->
    <nav class="bottom-nav">
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
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const relationship = isReceived ? "Pedido recebido" : "Pedido enviado";
  const fulfillment =
    order.fulfillment === "delivery" ? "Entrega combinada" : "Retirada";
  const details = [];
  if (order.fulfillment === "delivery" && order.address)
    details.push(`Endereço: ${escapeOrderHtml(order.address)}`);
  if (order.note) details.push(`Observação: ${escapeOrderHtml(order.note)}`);
  const detailsHtml = details.length
    ? `<div class="pedido-details">${details.map((detail) => `<p>${detail}</p>`).join("")}</div>`
    : "";
  const canManageAsMerchant =
    isReceived &&
    order.merchantUid === userId &&
    ACTIVE_ORDER_STATUSES.has(status);
  const canCancelAsBuyer =
    !isReceived && order.buyerUid === userId && status === "pending";
  const actions = canManageAsMerchant
    ? `<div class="pedido-actions">
        ${statusInfo.next ? `<button class="btn-solid" type="button" data-order-id="${escapeOrderHtml(order.id)}" data-order-status="${escapeOrderHtml(statusInfo.next)}">${escapeOrderHtml(statusInfo.action)}</button>` : ""}
        <button class="btn-outline" type="button" data-order-id="${escapeOrderHtml(order.id)}" data-order-status="cancelled">${status === "pending" ? "Recusar" : "Cancelar"}</button>
      </div>`
    : canCancelAsBuyer
      ? `<div class="pedido-actions"><button class="btn-outline" type="button" data-order-id="${escapeOrderHtml(order.id)}" data-order-status="cancelled">Cancelar pedido</button></div>`
      : "";

  return `<article class="pedido-card" data-order-card="${escapeOrderHtml(order.id)}">
    <header class="pedido-header">
      <div class="shop-info">
        <div class="shop-icon" aria-hidden="true">${isReceived ? "👤" : "🏪"}</div>
        <div class="shop-text">
          <h4>${escapeOrderHtml(personName)}</h4>
          <p>${escapeOrderHtml(relationship)} · ${escapeOrderHtml(formatOrderDate(order.createdAt))}</p>
        </div>
      </div>
      <span class="status-badge status-${escapeOrderHtml(status)}">${escapeOrderHtml(statusInfo.label)}</span>
    </header>
    ${renderOrderItems(order.items)}
    ${detailsHtml}
    <div class="pedido-info">
      <div class="info-block"><span class="info-label">Recebimento</span><strong class="info-value">${escapeOrderHtml(fulfillment)}</strong></div>
      <div class="info-block right"><span class="info-label">Total</span><strong class="info-value price">${escapeOrderHtml(formatOrderMoney(order.total))}</strong></div>
    </div>
    ${actions}
  </article>`;
}

window.PedidosPageInit = async function () {
  const container = document.querySelector("[data-pedidos]");
  if (!container) return;

  const feedback = document.querySelector("[data-orders-feedback]");
  const userId = window.Auth?.user?.uid;
  let activeFilter = "active";
  let orders = [];

  const setFeedback = (message, isError = false) => {
    if (!feedback) return;
    feedback.textContent = message || "";
    feedback.hidden = !message;
    feedback.setAttribute("role", isError ? "alert" : "status");
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

  const render = () => {
    const buyerOrders = orders.filter((order) => order?.buyerUid === userId);
    const merchantOrders = orders.filter(
      (order) => order?.merchantUid === userId,
    );
    const visibleBuyerOrders = filterOrders(buyerOrders);
    const visibleMerchantOrders = filterOrders(merchantOrders);
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
        `<section class="orders-section"><h2>Pedidos recebidos</h2>${visibleMerchantOrders
          .map((order) => renderOrderCard(order, "merchant", userId))
          .join("")}</section>`,
      );
    }
    container.innerHTML = sections.length
      ? sections.join("")
      : `<div class="empty-state"><h3>${activeFilter === "active" ? "Nenhum pedido ativo" : "Nenhum pedido no histórico"}</h3><p>${activeFilter === "active" ? "Seus pedidos em andamento aparecerão aqui." : "Pedidos concluídos ou cancelados aparecerão aqui."}</p></div>`;

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
