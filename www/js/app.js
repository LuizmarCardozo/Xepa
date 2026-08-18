/* =====================================================
   DADOS DAS OFERTAS
===================================================== */

/* =====================================================
   ELEMENTOS
===================================================== */

const offersList = document.getElementById("offersList");

const searchInput = document.getElementById("searchInput");

const offerCount = document.getElementById("offerCount");

const emptyMessage = document.getElementById("emptyMessage");

const menuButton = document.getElementById("menuButton");

const menuOverlay = document.getElementById("menuOverlay");

const closeMenu = document.getElementById("closeMenu");

const addButton = document.getElementById("addButton");

const addModal = document.getElementById("addModal");

const closeAddModal = document.getElementById("closeAddModal");

const modalOk = document.getElementById("modalOk");

const homeButton = document.getElementById("homeButton");

const profileButton = document.getElementById("profileButton");

/* =====================================================
   INICIALIZAÇÃO
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
  renderOffers(offers);

  setupEvents();
});

/* =====================================================
   RENDERIZAR OFERTAS
===================================================== */

function renderOffers(data) {
  offersList.innerHTML = "";

  if (data.length === 0) {
    emptyMessage.style.display = "block";

    offerCount.textContent = "0 ofertas";

    return;
  }

  emptyMessage.style.display = "none";

  offerCount.textContent = `${data.length} ${
    data.length === 1 ? "oferta" : "ofertas"
  }`;

  data.forEach((offer) => {
    const card = createOfferCard(offer);

    offersList.appendChild(card);
  });
}

/* =====================================================
   CRIAR CARD
===================================================== */

function createOfferCard(offer) {
  const card = document.createElement("article");

  card.className = "offer-card";

  card.dataset.id = offer.id;

  card.innerHTML = `

        <div class="offer-image">

            <img
                src="${offer.image}"
                alt="${offer.title}"
                loading="lazy"
            >

        </div>


        <div class="offer-info">

            <span class="offer-category">
                ${offer.category}
            </span>


            <h2 class="offer-title">
                ${offer.title}
            </h2>


            <p class="offer-description">
                ${offer.description}
            </p>


            <div class="offer-location">

                <span class="location-icon">
                    ●
                </span>

                <span>
                    ${offer.location}
                </span>

            </div>


            <div class="offer-price">
                ${offer.price}
            </div>

        </div>


        <button
            class="favorite-button"
            aria-label="Favoritar"
            data-id="${offer.id}"
        >
            ♡
        </button>

    `;

  const favoriteButton = card.querySelector(".favorite-button");

  favoriteButton.addEventListener("click", (event) => {
    event.stopPropagation();

    toggleFavorite(offer.id, favoriteButton);
  });

  card.addEventListener("click", () => {
    openOffer(offer);
  });

  return card;
}

/* =====================================================
   FAVORITOS
===================================================== */

function toggleFavorite(id, button) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  if (favorites.includes(id)) {
    favorites = favorites.filter((favoriteId) => favoriteId !== id);

    button.textContent = "♡";

    button.classList.remove("favorite");
  } else {
    favorites.push(id);

    button.textContent = "♥";

    button.classList.add("favorite");
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));
}

/* =====================================================
   CARREGAR FAVORITOS
===================================================== */

function loadFavorites() {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  document.querySelectorAll(".favorite-button").forEach((button) => {
    const id = Number(button.dataset.id);

    if (favorites.includes(id)) {
      button.textContent = "♥";

      button.classList.add("favorite");
    }
  });
}

/* =====================================================
   PESQUISA
===================================================== */

function searchOffers() {
  const search = searchInput.value.toLowerCase().trim();

  if (!search) {
    renderOffers(offers);

    loadFavorites();

    return;
  }

  const filteredOffers = offers.filter((offer) => {
    return (
      offer.title.toLowerCase().includes(search) ||
      offer.category.toLowerCase().includes(search) ||
      offer.description.toLowerCase().includes(search) ||
      offer.location.toLowerCase().includes(search)
    );
  });

  renderOffers(filteredOffers);

  loadFavorites();
}

/* =====================================================
   ABRIR OFERTA
===================================================== */

function openOffer(offer) {
  console.log("Oferta selecionada:", offer);

  /*
        Futuramente podemos fazer:

        router.navigate(
            "pages/oferta.html?id=" + offer.id
        );

        Por enquanto deixamos
        apenas o console.
    */
}

/* =====================================================
   MENU
===================================================== */

function openMenu() {
  menuOverlay.classList.add("open");
}

function closeSideMenu() {
  menuOverlay.classList.remove("open");
}

/* =====================================================
   MODAL ADICIONAR
===================================================== */

function openAddModal() {
  addModal.classList.add("open");
}

function closeModal() {
  addModal.classList.remove("open");
}

/* =====================================================
   NAVEGAÇÃO
===================================================== */

function activateHome() {
  homeButton.classList.add("active");

  profileButton.classList.remove("active");
}

function activateProfile() {
  profileButton.classList.add("active");

  homeButton.classList.remove("active");

  /*
        Futuramente:

        window.location.href =
            "pages/perfil.html";
    */

  console.log("Abrir perfil");
}

/* =====================================================
   EVENTOS
===================================================== */

function setupEvents() {
  /* Pesquisa */

  searchInput.addEventListener("input", searchOffers);

  /* Menu */

  menuButton.addEventListener("click", openMenu);

  closeMenu.addEventListener("click", closeSideMenu);

  menuOverlay.addEventListener("click", (event) => {
    if (event.target === menuOverlay) {
      closeSideMenu();
    }
  });

  /* Adicionar */

  addButton.addEventListener("click", openAddModal);

  closeAddModal.addEventListener("click", closeModal);

  modalOk.addEventListener("click", closeModal);

  addModal.addEventListener("click", (event) => {
    if (event.target === addModal) {
      closeModal();
    }
  });

  /* Navegação */

  homeButton.addEventListener("click", activateHome);

  profileButton.addEventListener("click", activateProfile);

  /* ESC */

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSideMenu();

      closeModal();
    }
  });
}
