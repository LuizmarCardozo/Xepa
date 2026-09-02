// js/home.js — Tela inicial do app Xepa
// Requer: css/home.css carregado na página (link rel="stylesheet")

function HomePage() {
  const userName = (Auth.user && Auth.user.name) || "usuário";

  return `
    <div class="home-hero">
      <div class="top-bar">
        <div>
          <h1>Olá, ${userName} 👋</h1>
          <p>O que você procura hoje?</p>
        </div>
        <button class="icon-btn">🔔<span class="badge">1</span></button>
      </div>
      <div class="search-bar">
        <span>🔍</span>
        <input type="text" placeholder="Buscar produtos, produtores, feiras...">
      </div>
    </div>

    <section class="section">
      <div class="section-header">
        <h2>Categorias</h2>
        <a href="#">Ver todas</a>
      </div>
      <div class="cat-scroll hide-scrollbar">
        <div class="cat-item">
          <div class="cat-circle cat-hortifruti">🥬</div>
          <p>Hortifruti</p>
        </div>
        <div class="cat-item">
          <div class="cat-circle cat-laticinios">🥛</div>
          <p>Laticínios</p>
        </div>
        <div class="cat-item">
          <div class="cat-circle cat-carnes">🥩</div>
          <p>Carnes</p>
        </div>
        <div class="cat-item">
          <div class="cat-circle cat-padaria">🍞</div>
          <p>Padaria</p>
        </div>
        <div class="cat-item">
          <div class="cat-circle cat-artesanais">🌾</div>
          <p>Artesanais</p>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="banner">
        <div class="banner-text">
          <h2>Produtos frescos<br>da sua região</h2>
          <p>Direto de quem produz<br>para a sua mesa.</p>
          <button class="banner-btn">Ver feiras próximas</button>
        </div>
        <img class="banner-img" src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=300" alt="Cesta de vegetais">
        <div class="banner-dots">
          <span class="active"></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2>Feiras próximas</h2>
        <a href="#">Ver no mapa ⦿</a>
      </div>
      <div class="markets-scroll hide-scrollbar">
        ${renderMarketCard(
          "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=400",
        )}
        ${renderMarketCard(
          "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=400",
        )}
        ${renderMarketCard(
          "https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&q=80&w=400",
        )}
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2>Produtos perto de você</h2>
        <a href="#">Ver todas</a>
      </div>
      <div class="product-grid">
        ${renderProductCard("https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&q=80&w=300")}
        ${renderProductCard("https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&q=80&w=300")}
        ${renderProductCard("https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&q=80&w=300")}
        ${renderProductCard("https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=300")}
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2>Últimas compras</h2>
        <a href="#">Ver todas</a>
      </div>
      <div class="product-grid">
        ${renderProductCard("https://images.unsplash.com/photo-1571680322279-a226e6a4cc2a?auto=format&fit=crop&q=80&w=300")}
        ${renderProductCard("https://images.unsplash.com/photo-1607305387299-a3d9611cd469?auto=format&fit=crop&q=80&w=300")}
        ${renderProductCard("https://images.unsplash.com/photo-1596097635121-14b63b7a0c9d?auto=format&fit=crop&q=80&w=300")}
        ${renderProductCard("https://images.unsplash.com/photo-1546470427-e26264be0b0d?auto=format&fit=crop&q=80&w=300")}
      </div>
    </section>

    ${
      typeof Components !== "undefined" && Components.bottomNav
        ? Components.bottomNav("home")
        : renderBottomNav("home")
    }
  `;
}

// ---------- Helpers de renderização ----------

function renderMarketCard(imgUrl) {
  return `
    <div class="market-card">
      <div class="market-img-wrap">
        <img class="market-img" src="${imgUrl}" alt="Feira">
        <span class="market-badge">Aberto · 07h às 13h</span>
      </div>
      <div class="market-info">
        <h4>Feira exemplo</h4>
        <p>📍 2,3 km de você</p>
        <div class="rating">
          <div class="rating-dots">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <span class="rating-count">+24</span>
        </div>
      </div>
    </div>
  `;
}

function renderProductCard(
  imgUrl,
  name = "Tomate organico",
  desc = "Só folha",
  price = "8,00",
) {
  return `
    <div class="product-card">
      <img class="product-img" src="${imgUrl}" alt="${name}">
      <h4>${name}</h4>
      <p>${desc}</p>
      <div class="product-bottom">
        <span class="price">R$ ${price}<span style="font-size:10px">/KG</span></span>
        <button class="add-btn" data-action="add-to-cart">+</button>
      </div>
    </div>
  `;
}

// Fallback local caso Components.bottomNav ainda não exista no projeto.
// Assim que o componente compartilhado estiver disponível, esta função
// deixa de ser usada automaticamente (ver checagem acima em HomePage()).
function renderBottomNav(activePage) {
  const items = [
    { page: "home", icon: "🏬", label: "Feira" },
    { page: "ofertas", icon: "🏷️", label: "Ofertas" },
    { page: "pedidos", icon: "🛒", label: "Pedidos" },
    { page: "perfil", icon: "👤", label: "Perfil" },
  ];

  return `
    <nav class="bottom-nav">
      ${items
        .map(
          (item) => `
        <button class="nav-item ${item.page === activePage ? "active" : ""}" data-page="${item.page}">
          <span class="nav-icon">${item.icon}</span>
          <span class="nav-label">${item.label}</span>
        </button>
      `,
        )
        .join("")}
    </nav>
  `;
}

// ---------- Inicialização da página ----------

function HomePageInit() {
  // Navegação da barra inferior
  document.querySelectorAll(".bottom-nav .nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = btn.getAttribute("data-page");
      if (page && page !== "home" && typeof navigateTo === "function") {
        navigateTo(page); // ajuste para a função de roteamento do seu app
      }
    });
  });

  // Botões de adicionar produto ao carrinho
  document.querySelectorAll('[data-action="add-to-cart"]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const card = e.target.closest(".product-card");
      const name = card ? card.querySelector("h4").textContent : "Produto";
      console.log(`Adicionado ao carrinho: ${name}`);
      // TODO: integrar com o carrinho real do app
    });
  });

  // Exemplo: se os dados vierem de uma API, carregue-os aqui
  // e re-renderize as seções dinamicamente.
}
