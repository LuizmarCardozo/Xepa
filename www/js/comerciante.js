window.ComerciantePage = async function () {
  const list = document.querySelector("[data-my-offers]");
  const reservations = document.querySelector("[data-merchant-orders]");
  if (!list || !window.Backend || !window.Backend.getMyOffers) return;

  list.innerHTML = '<p class="merchant-empty">Carregando suas ofertas...</p>';

  try {
    const offers = await window.Backend.getMyOffers();
    if (offers.length === 0) {
      list.innerHTML =
        '<p class="merchant-empty">Você ainda não publicou ofertas.</p>';
    } else {
      list.innerHTML = offers.map(renderMerchantOffer).join("");
      list.querySelectorAll("[data-edit-offer]").forEach((button) => {
        button.addEventListener("click", () => {
          sessionStorage.setItem(
            "xepa-edit-offer-id",
            button.dataset.editOffer,
          );
          window.Router?.go("criarOferta");
        });
      });
      list.querySelectorAll("[data-delete-offer]").forEach((button) => {
        button.addEventListener("click", async () => {
          if (!window.confirm("Excluir esta oferta?")) return;
          button.disabled = true;
          try {
            await window.Backend.deleteOffer(button.dataset.deleteOffer);
            button.closest(".merchant-offer")?.remove();
            if (!list.querySelector(".merchant-offer")) {
              list.innerHTML =
                '<p class="merchant-empty">Você ainda não publicou ofertas.</p>';
            }
          } catch (error) {
            console.error(error);
            button.disabled = false;
            alert("Não foi possível excluir a oferta.");
          }
        });
      });
    }
  } catch (error) {
    console.error(error);
    list.innerHTML =
      '<p class="merchant-empty">Não foi possível carregar suas ofertas.</p>';
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
    const image = offer.image
      ? `<img src="${offer.image}" alt="${offer.name}" class="merchant-offer-image">`
      : '<div class="merchant-offer-image merchant-offer-placeholder">📦</div>';
    const price = Number(offer.price).toFixed(2).replace(".", ",");

    return `
      <article class="merchant-offer">
        ${image}
        <div class="merchant-offer-info">
          <h3>${offer.name}</h3>
          <p>R$ ${price} / ${offer.unit}</p>
          <span>${offer.active ? "Ativa" : "Inativa"}</span>
        </div>
        <div class="merchant-offer-actions">
          <button class="merchant-edit" type="button" data-edit-offer="${offer.id}" aria-label="Editar ${offer.name}">Editar</button>
          <button class="merchant-delete" type="button" data-delete-offer="${offer.id}" aria-label="Excluir ${offer.name}">Excluir</button>
        </div>
      </article>
    `;
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
