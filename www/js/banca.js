// Monta a página pública da banca e seus produtos.
// js/banca.js — tela da banca vista pelo cliente
// Mostra banner, foto de perfil, dados da banca, produtos e se o cliente
// já comprou ali. Abra com: window.openStall(uidDoComerciante)

const STALL_SESSION_KEY = "xepa-current-stall";
const STALL_CANCELLED = new Set(["cancelled", "rejected"]);
const STALL_DONE = new Set(["completed", "delivered"]);

window.openStall = function (stallId) {
  if (!stallId) return;
  try {
    sessionStorage.setItem(STALL_SESSION_KEY, String(stallId));
  } catch (error) {
    console.warn("Não foi possível guardar a banca selecionada:", error);
  }
  window.Router?.go("banca");
};

function stallEscape(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[c],
  );
}

function stallSafeImage(value) {
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

function stallDate(value) {
  if (!value) return null;
  const date =
    typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function stallLocationText(market) {
  const city = [market?.city, market?.state]
    .map((v) => String(v || "").trim())
    .filter(Boolean)
    .join(", ");
  return {
    marketName: String(market?.marketName || "").trim(),
    city,
    reference: String(market?.reference || "").trim(),
  };
}

// Pedidos do cliente nesta banca (ignora cancelados/recusados).
function stallPurchaseSummary(orders, stallId, userId) {
  const mine = (Array.isArray(orders) ? orders : []).filter(
    (order) =>
      order?.buyerUid === userId &&
      order?.merchantUid === stallId &&
      !STALL_CANCELLED.has(String(order.status || "pending").toLowerCase()),
  );
  const done = mine.filter((order) =>
    STALL_DONE.has(String(order.status || "").toLowerCase()),
  );
  const boughtOfferIds = new Set();
  let spent = 0;
  mine.forEach((order) => {
    (order.items || []).forEach((item) => {
      if (item?.offerId) boughtOfferIds.add(String(item.offerId));
    });
  });
  done.forEach((order) => {
    const total = Number(order.total);
    if (Number.isFinite(total)) spent += total;
  });
  const lastOrder = [...mine].sort((a, b) =>
    String(b.createdAt).localeCompare(String(a.createdAt)),
  )[0];
  return {
    total: mine.length,
    completed: done.length,
    active: mine.length - done.length,
    spent,
    boughtOfferIds,
    lastDate: stallDate(lastOrder?.createdAt),
  };
}

function stallRenderPurchase(summary) {
  if (!summary) return "";
  if (!summary.total) {
    return `
      <section class="stall-purchase stall-purchase-none" aria-label="Seu histórico nesta banca">
        <span class="stall-purchase-icon" aria-hidden="true">🛍️</span>
        <div>
          <strong>Você ainda não comprou aqui</strong>
          <p>Escolha um produto abaixo e faça seu primeiro pedido.</p>
        </div>
      </section>`;
  }
  const lastDate = summary.lastDate
    ? summary.lastDate.toLocaleDateString("pt-BR")
    : "";
  const title = summary.completed
    ? "Você já comprou nesta banca"
    : "Você tem um pedido em andamento";
  const parts = [];
  if (summary.completed) {
    parts.push(
      `${summary.completed} ${summary.completed === 1 ? "compra concluída" : "compras concluídas"}`,
    );
  }
  if (summary.completed && summary.active) {
    parts.push(`${summary.active} em andamento`);
  }
  if (!summary.completed) {
    parts.push(
      `${summary.active} ${summary.active === 1 ? "pedido" : "pedidos"}`,
    );
  }
  if (lastDate) parts.push(`último em ${lastDate}`);
  return `
    <section class="stall-purchase stall-purchase-yes" aria-label="Seu histórico nesta banca">
      <span class="stall-purchase-icon" aria-hidden="true">✓</span>
      <div>
        <strong>${title}</strong>
        <p>${stallEscape(parts.join(" · "))}</p>
      </div>
      <button class="stall-purchase-link" type="button" data-stall-orders>Ver pedidos</button>
    </section>`;
}

function stallRenderProduct(offer, bought) {
  const id = stallEscape(offer.id);
  const name = stallEscape(offer.name || "Produto");
  const unit = stallEscape(offer.unit || "unidade");
  const image = stallSafeImage(offer.image);
  const media = image
    ? `<img class="product-img" src="${stallEscape(image)}" alt="${name}" loading="lazy" />`
    : '<div class="product-img product-img-placeholder" aria-hidden="true">🥬</div>';
  const oldPrice =
    Number(offer.oldPrice) > Number(offer.price)
      ? `<span class="old-price">${window.formatMoney(offer.oldPrice)}</span>`
      : "";
  return `
    <article class="product-card stall-product" data-offer-id="${id}" tabindex="0" role="button" aria-label="Ver ${name}">
      <div class="stall-product-media">
        ${media}
        ${bought ? '<span class="stall-bought-badge">Já comprou</span>' : ""}
      </div>
      <div class="product-info">
        <h4 class="product-name">${name}</h4>
        <p class="product-desc">${stallEscape(offer.desc || "Produto fresco à venda.")}</p>
        <div class="product-bottom">
          <span class="price-container">
            ${oldPrice}
            <span class="new-price">${window.formatMoney(offer.price)}<span class="unit">/${unit}</span></span>
          </span>
          <button class="add-btn" data-add-offer="${id}" type="button" aria-label="Adicionar ${name} ao carrinho">+</button>
        </div>
      </div>
    </article>`;
}

window.BancaPage = function () {
  return `
    <main class="page stall-page">
      <p class="loading-state">Carregando banca...</p>
    </main>`;
};

window.BancaPageInit = async function () {
  const page = document.querySelector(".stall-page");
  if (!page) return;

  let stallId = null;
  try {
    stallId = sessionStorage.getItem(STALL_SESSION_KEY);
  } catch {
    stallId = null;
  }
  const backButton = `<button class="stall-back" type="button" onclick="Router.back('home')" aria-label="Voltar">‹</button>`;
  if (!stallId) {
    page.innerHTML = `${backButton}<section class="empty-state card"><h2>Escolha uma banca</h2><p>Toque em uma banca na tela inicial para ver os produtos dela.</p><button class="btn btn-primary" onclick="Router.go('home')">Ir para a feira</button></section>`;
    return;
  }

  const userId = window.Auth?.user?.uid;
  const isOwner = userId === stallId;
  const backend = window.Backend || {};

  try {
    const [market, offers, orders] = await Promise.all([
      // dados da banca são um extra: se falhar, os produtos continuam abrindo
      backend.getMarket(stallId).catch((error) => {
        console.warn("Não foi possível carregar os dados da banca:", error);
        return null;
      }),
      backend.getStallOffers(stallId),
      // o histórico é um extra: se falhar, a banca continua abrindo
      isOwner || typeof backend.getOrders !== "function"
        ? Promise.resolve(null)
        : backend.getOrders().catch((error) => {
            console.warn("Não foi possível carregar seu histórico:", error);
            return null;
          }),
    ]);

    if (!market && !offers.length) {
      page.innerHTML = `${backButton}<section class="empty-state card"><h2>Banca não encontrada</h2><p>Esta banca não está mais disponível.</p><button class="btn btn-primary" onclick="Router.go('home')">Voltar para a feira</button></section>`;
      return;
    }

    const stallName =
      market?.stallName || offers[0]?.stallName || "Banca cadastrada";
    const ownerName = offers[0]?.ownerName || "";
    const location = stallLocationText(market || offers[0]?.stallLocation);
    const banner = stallSafeImage(market?.banner);
    const avatar = stallSafeImage(market?.image) || "assets/banca-figma.png";
    const summary =
      orders === null ? null : stallPurchaseSummary(orders, stallId, userId);
    const offersById = new Map(offers.map((o) => [String(o.id), o]));
    const categories = [
      ...new Set(offers.map((o) => o.category).filter(Boolean)),
    ];
    let activeCategory = "";

    const locationLines = [
      location.marketName && `📍 ${stallEscape(location.marketName)}`,
      location.city && stallEscape(location.city),
      location.reference && `Banca ${stallEscape(location.reference)}`,
    ].filter(Boolean);

    page.innerHTML = `
      <header class="stall-hero">
        <div class="stall-banner${banner ? "" : " stall-banner-empty"}">
          ${banner ? `<img src="${stallEscape(banner)}" alt="Banner da banca ${stallEscape(stallName)}" />` : ""}
          ${backButton}
        </div>
        <div class="stall-identity">
          <img class="stall-avatar" src="${stallEscape(avatar)}" alt="Foto de perfil de ${stallEscape(stallName)}" />
          <div class="stall-identity-text">
            <h1>${stallEscape(stallName)}</h1>
            ${ownerName ? `<p class="stall-owner">por ${stallEscape(ownerName)}</p>` : ""}
          </div>
        </div>
        ${locationLines.length ? `<p class="stall-location">${locationLines.join(" · ")}</p>` : ""}
      </header>

      ${isOwner ? "" : stallRenderPurchase(summary)}

      <section class="section stall-products-section" aria-labelledby="stall-products-title">
        <div class="section-header">
          <h2 id="stall-products-title">Produtos da banca</h2>
          <span class="stall-count">${offers.length} ${offers.length === 1 ? "produto" : "produtos"}</span>
        </div>
        ${
          categories.length > 1
            ? `<div class="stall-chips hide-scrollbar" role="tablist" aria-label="Categorias">
                <button class="stall-chip active" type="button" data-category="">Todos</button>
                ${categories.map((c) => `<button class="stall-chip" type="button" data-category="${stallEscape(c)}">${stallEscape(c)}</button>`).join("")}
              </div>`
            : ""
        }
        <div class="product-grid" data-stall-products></div>
      </section>`;

    const grid = page.querySelector("[data-stall-products]");

    const renderProducts = () => {
      const visible = activeCategory
        ? offers.filter((o) => o.category === activeCategory)
        : offers;
      if (!visible.length) {
        grid.innerHTML = `<p class="home-empty">${offers.length ? "Nenhum produto nesta categoria." : "Esta banca ainda não publicou produtos."}</p>`;
        return;
      }
      grid.innerHTML = visible
        .map((offer) =>
          stallRenderProduct(
            offer,
            summary?.boughtOfferIds.has(String(offer.id)),
          ),
        )
        .join("");
    };
    renderProducts();

    grid.addEventListener("click", (event) => {
      const addButton = event.target.closest("[data-add-offer]");
      if (addButton) {
        event.stopPropagation();
        const offer = offersById.get(addButton.dataset.addOffer);
        if (offer) window.Cart?.add(offer);
        return;
      }
      const card = event.target.closest("[data-offer-id]");
      if (!card) return;
      sessionStorage.setItem("xepa-current-offer", card.dataset.offerId);
      window.Router.go("produto");
    });
    grid.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = event.target.closest("[data-offer-id]");
      if (!card || event.target !== card) return;
      event.preventDefault();
      sessionStorage.setItem("xepa-current-offer", card.dataset.offerId);
      window.Router.go("produto");
    });

    page.querySelectorAll("[data-category]").forEach((chip) => {
      chip.addEventListener("click", () => {
        activeCategory = chip.dataset.category;
        page
          .querySelectorAll("[data-category]")
          .forEach((c) => c.classList.toggle("active", c === chip));
        renderProducts();
      });
    });

    page
      .querySelector("[data-stall-orders]")
      ?.addEventListener("click", () => window.Router.go("pedidos"));
  } catch (error) {
    console.error("Não foi possível carregar a banca:", error);
    page.innerHTML = `${backButton}<section class="empty-state card"><h2>Não foi possível abrir a banca</h2><p>Verifique sua conexão e tente de novo.</p><button class="btn btn-primary" onclick="Router.refresh()">Tentar novamente</button></section>`;
  }
};
