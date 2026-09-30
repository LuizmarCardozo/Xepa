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
    badge.textContent = String(items.reduce((sum, item) => sum + item.quantity, 0));
  });
}

window.formatMoney = (value) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

window.Cart = {
  items: readCart,
  count: () => readCart().reduce((sum, item) => sum + item.quantity, 0),
  add(offer, quantity = 1) {
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
    if (existing) existing.quantity += quantity;
    else {
      items.push({
        offerId: offer.id,
        ownerUid: offer.ownerUid,
        ownerName: offer.ownerName || "Comerciante",
        name: offer.name,
        unit: offer.unit || "unidade",
        price: Number(offer.price),
        image: offer.image || null,
        quantity,
      });
    }
    writeCart(items);
    alert(`${offer.name} foi adicionado ao carrinho.`);
  },
  remove(offerId) {
    writeCart(readCart().filter((item) => item.offerId !== offerId));
  },
  clear() {
    writeCart([]);
  },
};

window.mountCartShortcut = function (referenceElement) {
  if (!referenceElement?.parentElement || document.querySelector("[data-cart-shortcut]")) return;
  const wrapper = document.createElement("div");
  wrapper.className = "cart-shortcut-wrap";
  wrapper.innerHTML = '<button class="cart-shortcut" type="button" data-cart-shortcut>🧺 Carrinho <span data-cart-count>' + window.Cart.count() + '</span></button>';
  wrapper.querySelector("button").addEventListener("click", () => Router.go("carrinho"));
  referenceElement.insertAdjacentElement("afterend", wrapper);
};

function storyEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character],
  );
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
      list.innerHTML = '<section class="empty-state card"><h2>Nenhuma novidade ainda</h2><p>As publicações dos comerciantes aparecerão aqui.</p></section>';
      return;
    }
    list.innerHTML = stories.map((story) => {
      const image = story.image
        ? '<img src="' + storyEscape(story.image) + '" alt="Novidade de ' + storyEscape(story.ownerName || "feira") + '">'
        : "";
      const date = story.createdAt ? new Date(story.createdAt).toLocaleString("pt-BR") : "";
      return '<article class="story-card"><p class="eyebrow">' +
        storyEscape(story.ownerName || "Feira local") +
        '</p>' + image + '<p>' + storyEscape(story.text || "") +
        '</p><small>' + storyEscape(date) + '</small></article>';
    }).join("");
  } catch (error) {
    console.error(error);
    list.innerHTML = '<section class="empty-state card"><h2>Não foi possível carregar as novidades</h2><button class="btn btn-outline" onclick="Router.go(\'feira\')">Tentar novamente</button></section>';
  }
};

window.ProdutoPage = function () {
  return `<main class="page commerce-page"><div class="page-heading"><button class="text-button" onclick="Router.go('ofertas')">← Voltar às ofertas</button></div><div id="product-detail"><p class="loading-state">Carregando produto...</p></div></main>`;
};

window.ProdutoPageInit = async function () {
  const container = document.getElementById("product-detail");
  const offerId = sessionStorage.getItem("xepa-current-offer");
  if (!container || !offerId) {
    if (container) container.innerHTML = "<p>Escolha uma oferta para ver os detalhes.</p>";
    return;
  }
  try {
    const offer = await window.Backend.getOffer(offerId);
    if (!offer || !offer.active) {
      container.innerHTML = "<p>Esta oferta não está mais disponível.</p>";
      return;
    }
    container.innerHTML = `
      <article class="card product-detail-card">
        ${offer.image ? `<img class="product-detail-image" src="${offer.image}" alt="${offer.name}">` : ""}
        <p class="eyebrow">${offer.category || "Oferta"}</p>
        <h1>${offer.name}</h1>
        <p>${offer.desc || "Produto fresco à venda."}</p>
        <p class="product-detail-seller">Vendido por ${offer.ownerName || "Comerciante"}</p>
        <strong class="product-detail-price">${window.formatMoney(offer.price)} / ${offer.unit || "unidade"}</strong>
        <label class="form-label" for="detail-quantity">Quantidade</label>
        <input id="detail-quantity" class="form-input" type="number" min="1" max="99" value="1">
        <button id="detail-add-cart" class="btn btn-primary btn-full" type="button">Adicionar ao carrinho</button>
        <button class="btn btn-outline btn-full" type="button" onclick="Router.go('carrinho')">Ir para o carrinho (${window.Cart.count()})</button>
      </article>`;
    document.getElementById("detail-add-cart").addEventListener("click", () => {
      const quantity = Math.max(1, Math.min(99, Number(document.getElementById("detail-quantity").value) || 1));
      window.Cart.add(offer, quantity);
    });
  } catch (error) {
    console.error(error);
    container.innerHTML = "<p>Não foi possível carregar este produto. Tente novamente.</p>";
  }
};

window.CarrinhoPage = function () {
  return `
    <main class="page commerce-page">
      <header class="page-heading"><div><h1>Carrinho</h1><p>Confira os produtos antes de enviar o pedido.</p></div><button class="text-button" onclick="Router.go('ofertas')">Continuar comprando</button></header>
      <div id="cart-items" class="commerce-list"></div>
      <section class="card checkout-card">
        <h2>Como receber?</h2>
        <label class="form-label" for="cart-fulfillment">Forma de recebimento</label>
        <select id="cart-fulfillment" class="form-input"><option value="pickup">Retirar com o comerciante</option><option value="delivery">Combinar entrega</option></select>
        <div id="cart-address-group" hidden><label class="form-label" for="cart-address">Endereço para combinar a entrega</label><textarea id="cart-address" class="form-input" rows="2" placeholder="Rua, número, bairro"></textarea></div>
        <label class="form-label" for="cart-note">Observação para o comerciante</label>
        <textarea id="cart-note" class="form-input" rows="2" maxlength="300" placeholder="Ex.: prefiro bananas mais maduras"></textarea>
        <p class="checkout-note">Pagamento combinado diretamente com o comerciante na retirada ou entrega.</p>
        <div class="cart-total-row"><strong>Total</strong><strong id="cart-total">R$ 0,00</strong></div>
        <button id="checkout-button" class="btn btn-primary btn-full" type="button">Enviar pedido</button>
        <p id="checkout-error" class="form-error" role="alert"></p>
      </section>
    </main>`;
};

window.CarrinhoPageInit = function () {
  const list = document.getElementById("cart-items");
  const total = document.getElementById("cart-total");
  const fulfillment = document.getElementById("cart-fulfillment");
  const addressGroup = document.getElementById("cart-address-group");
  const checkout = document.getElementById("checkout-button");
  const error = document.getElementById("checkout-error");

  function render() {
    const items = readCart();
    if (!items.length) {
      list.innerHTML = '<section class="empty-state card"><h2>Seu carrinho está vazio</h2><p>Encontre uma oferta e adicione um produto.</p><button class="btn btn-primary" onclick="Router.go(\'ofertas\')">Ver ofertas</button></section>';
      checkout.disabled = true;
      total.textContent = window.formatMoney(0);
      return;
    }
    checkout.disabled = false;
    list.innerHTML = items.map((item) => `
      <article class="card cart-item">
        ${item.image ? `<img src="${item.image}" alt="${item.name}">` : '<div class="cart-item-placeholder">🥬</div>'}
        <div class="cart-item-info"><strong>${item.name}</strong><span>${item.ownerName}</span><span>${window.formatMoney(item.price)} / ${item.unit}</span></div>
        <label class="quantity-label">Qtd.<input data-quantity="${item.offerId}" type="number" min="1" max="99" value="${item.quantity}"></label>
        <button class="text-button danger-text" data-remove-cart="${item.offerId}" type="button">Remover</button>
      </article>`).join("");
    total.textContent = window.formatMoney(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
    list.querySelectorAll("[data-quantity]").forEach((input) => input.addEventListener("change", () => {
      const updated = readCart();
      const item = updated.find((entry) => entry.offerId === input.dataset.quantity);
      if (item) item.quantity = Math.max(1, Math.min(99, Number(input.value) || 1));
      writeCart(updated);
      render();
    }));
    list.querySelectorAll("[data-remove-cart]").forEach((button) => button.addEventListener("click", () => {
      window.Cart.remove(button.dataset.removeCart);
      render();
    }));
  }

  fulfillment.addEventListener("change", () => {
    addressGroup.hidden = fulfillment.value !== "delivery";
  });
  checkout.addEventListener("click", async () => {
    error.textContent = "";
    const items = readCart();
    if (!items.length) return;
    const address = document.getElementById("cart-address").value.trim();
    if (fulfillment.value === "delivery" && !address) {
      error.textContent = "Informe um endereço para combinar a entrega.";
      return;
    }
    checkout.disabled = true;
    checkout.textContent = "Enviando pedido...";
    try {
      await window.Backend.createOrders(
        items,
        fulfillment.value,
        address,
        document.getElementById("cart-note").value,
      );
      window.Cart.clear();
      alert("Pedido enviado! Você pode acompanhar o status na aba Pedidos.");
      Router.go("pedidos");
    } catch (submitError) {
      console.error(submitError);
      error.textContent = submitError.message || "Não foi possível enviar o pedido.";
      checkout.disabled = false;
      checkout.textContent = "Enviar pedido";
    }
  });
  render();
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
      document.getElementById("story-error").textContent = "Escolha uma imagem de até 5 MB.";
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
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
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
