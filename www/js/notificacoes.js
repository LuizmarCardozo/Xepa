// js/notificacoes.js
// Sininho de notificações do cliente: mostra o status dos pedidos em tempo real.
// Não precisa de coleção nova no Firebase: as notificações vêm dos próprios pedidos.

(function () {
  const SEEN_PREFIX = "xepa_notif_seen_";
  const MAX_ITEMS = 30;

  function esc(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c],
    );
  }

  function seenKey() {
    const uid = window.Auth?.user?.uid;
    return uid ? `${SEEN_PREFIX}${uid}` : null;
  }

  function readSeen() {
    const key = seenKey();
    if (!key) return new Set();
    try {
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      return new Set(Array.isArray(list) ? list : []);
    } catch {
      return new Set();
    }
  }

  function writeSeen(set) {
    const key = seenKey();
    if (!key) return;
    try {
      // guarda só os mais recentes para não crescer para sempre
      localStorage.setItem(key, JSON.stringify([...set].slice(-300)));
    } catch {
      /* sem armazenamento: ignora */
    }
  }

  function describe(order) {
    const status = String(order?.status || "pending").toLowerCase();
    const seller = order?.stallName || order?.merchantName || "O vendedor";
    const code = /^\d{6}$/.test(String(order?.orderCode ?? ""))
      ? ` Código: ${order.orderCode}.`
      : "";
    switch (status) {
      case "accepted":
        return {
          icon: "✅",
          title: "Pedido aceito",
          text: `${seller} aceitou seu pedido e está preparando.`,
        };
      case "ready":
        return {
          icon: "🛍️",
          title: "Pedido separado",
          text: `Seu pedido está separado e pronto para retirar.${code}`,
        };
      case "delivered":
      case "completed":
        return {
          icon: "🎉",
          title: "Pedido entregue",
          text: `Seu pedido com ${seller} foi concluído.`,
        };
      case "cancelled":
        return {
          icon: "❌",
          title: "Pedido cancelado",
          text: `O pedido com ${seller} foi cancelado.`,
        };
      case "rejected":
        return {
          icon: "❌",
          title: "Pedido recusado",
          text: `${seller} recusou seu pedido.`,
        };
      default:
        return {
          icon: "🕒",
          title: "Pedido enviado",
          text: `Aguardando ${seller} confirmar seu pedido.`,
        };
    }
  }

  function timeAgo(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const minutes = Math.round((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return "agora";
    if (minutes < 60) return `há ${minutes} min`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `há ${hours} h`;
    return date.toLocaleDateString("pt-BR");
  }

  function buildItems(orders, uid) {
    return orders
      .filter((order) => order?.buyerUid === uid)
      .map((order) => {
        const status = String(order.status || "pending").toLowerCase();
        return {
          id: `${order.id}:${status}`,
          orderId: order.id,
          when: order.updatedAt || order.createdAt || "",
          ...describe(order),
        };
      })
      .sort((a, b) => String(b.when).localeCompare(String(a.when)))
      .slice(0, MAX_ITEMS);
  }

  window.mountNotificationBell = function (container) {
    if (!container || window.Auth?.user?.type === "comerciante") return null;
    if (container.querySelector("[data-notification-bell]")) return null;
    const uid = window.Auth?.user?.uid;
    if (!uid || typeof window.Backend?.watchOrders !== "function") return null;

    const wrap = document.createElement("div");
    wrap.className = "notification-bell-wrap";
    wrap.innerHTML = `
      <button class="notification-bell" type="button" data-notification-bell aria-label="Notificações" aria-haspopup="dialog">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
        <span class="notification-badge" data-notification-badge hidden>0</span>
      </button>`;
    container.appendChild(wrap);

    const button = wrap.querySelector("[data-notification-bell]");
    const badge = wrap.querySelector("[data-notification-badge]");
    let items = [];
    let panel = null;

    function unreadCount() {
      const seen = readSeen();
      return items.filter((item) => !seen.has(item.id)).length;
    }

    function updateBadge() {
      const count = unreadCount();
      badge.hidden = count === 0;
      badge.textContent = count > 9 ? "9+" : String(count);
      button.setAttribute(
        "aria-label",
        count ? `Notificações (${count} novas)` : "Notificações",
      );
    }

    function closePanel() {
      panel?.remove();
      panel = null;
    }

    function renderPanel() {
      if (!panel) return;
      const seen = readSeen();
      const list = panel.querySelector("[data-notification-list]");
      list.innerHTML = items.length
        ? items
            .map(
              (item) => `
          <button type="button" class="notification-item${seen.has(item.id) ? "" : " is-unread"}" data-notification-order="${esc(item.orderId)}">
            <span class="notification-item-icon" aria-hidden="true">${item.icon}</span>
            <span class="notification-item-copy">
              <strong>${esc(item.title)}</strong>
              <span>${esc(item.text)}</span>
              <small>${esc(timeAgo(item.when))}</small>
            </span>
          </button>`,
            )
            .join("")
        : '<p class="notification-empty">Você ainda não tem notificações.</p>';
      list.querySelectorAll("[data-notification-order]").forEach((el) => {
        el.addEventListener("click", () => {
          closePanel();
          window.Router?.go("pedidos");
        });
      });
    }

    function openPanel() {
      if (panel) return closePanel();
      panel = document.createElement("div");
      panel.className = "notification-overlay";
      panel.innerHTML = `
        <div class="notification-backdrop" data-notification-close></div>
        <section class="notification-panel" role="dialog" aria-label="Notificações">
          <header>
            <h2>Notificações</h2>
            <button type="button" class="notification-close" data-notification-close aria-label="Fechar">×</button>
          </header>
          <div class="notification-list" data-notification-list></div>
        </section>`;
      document.body.appendChild(panel);
      panel
        .querySelectorAll("[data-notification-close]")
        .forEach((el) => el.addEventListener("click", closePanel));
      renderPanel();
      // abrir o painel marca tudo como lido (o destaque some na próxima abertura)
      const seen = readSeen();
      const before = seen.size;
      items.forEach((item) => seen.add(item.id));
      if (seen.size !== before) writeSeen(seen);
      updateBadge();
    }

    button.addEventListener("click", openPanel);

    let stop = null;
    try {
      stop = window.Backend.watchOrders(
        (orders) => {
          items = buildItems(orders, uid);
          updateBadge();
          renderPanel();
        },
        (error) => console.warn("Notificações indisponíveis:", error),
      );
    } catch (error) {
      console.warn("Não foi possível iniciar as notificações:", error);
    }

    return function cleanup() {
      if (typeof stop === "function") stop();
      closePanel();
      wrap.remove();
    };
  };
})();
