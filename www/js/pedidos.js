// js/pedidos.js

window.PedidosPage = function () {
  return `
    <main class="page pedidos-page">
      <!-- ============ HERO BANNER ============ -->
      <div class="pedidos-hero">
        <div class="pedidos-hero-text">
          <h1>Meus pedidos</h1>
          <p>Acompanhe seus pedidos e histórico</p>
        </div>
        <!-- Imagem corrigida via CSS (largura em % para não quebrar a tela) -->
        <img src="assets/cesta.png" class="pedidos-hero-img" alt="Cesta" />
      </div>

      <!-- ============ TABS ============ -->
      <div class="pedidos-tabs-wrapper">
        <div class="pedidos-tabs">
          <button class="tab-btn active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            Pedidos Ativos
          </button>
          <button class="tab-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Histórico
          </button>
        </div>
      </div>

      <!-- ============ LISTA DE PEDIDOS (VAZIA NO MOMENTO) ============ -->
      <div class="pedidos-list" data-pedidos>
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

window.PedidosPageInit = function () {
  // Array de pedidos vazio no momento, como solicitado
  const mockPedidos = [];

  const container = document.querySelector("[data-pedidos]");
  if (container) {
    if (mockPedidos.length === 0) {
      // ESTADO VAZIO BONITINHO
      container.innerHTML = `
        <div class="empty-state">
          <h3>Nenhum pedido ativo</h3>
          <p>Você ainda não tem pedidos em andamento.<br>Que tal dar uma olhada nas ofertas?</p>
        </div>
      `;
    } else {
      // Futuramente, a função de renderizar os cards entra aqui
      container.innerHTML = "";
    }
  }

  // Lógica de navegação do Menu Inferior
  document.querySelectorAll(".bottom-nav .nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = btn.getAttribute("data-page");
      if (page && typeof Router !== "undefined") {
        page === "ofertas" ? Router.goOffers() : Router.go(page);
      }
    });
  });
};
