window.ComerciantePage = async function () {
  const list = document.querySelector("[data-my-offers]");
  if (!list || !window.Backend || !window.Backend.getMyOffers) return;

  list.innerHTML = '<p class="merchant-empty">Carregando suas ofertas...</p>';

  try {
    const offers = await window.Backend.getMyOffers();
    if (offers.length === 0) {
      list.innerHTML =
        '<p class="merchant-empty">Você ainda não publicou ofertas.</p>';
      return;
    }

    list.innerHTML = offers.map(renderMerchantOffer).join("");
    list.querySelectorAll("[data-edit-offer]").forEach((button) => {
      button.addEventListener("click", () => {
        sessionStorage.setItem("xepa-edit-offer-id", button.dataset.editOffer);
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
  } catch (error) {
    console.error(error);
    list.innerHTML =
      '<p class="merchant-empty">Não foi possível carregar suas ofertas.</p>';
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
};
