// Inicia a navegação depois da tentativa de carregar a sessão.
document.addEventListener("DOMContentLoaded", async () => {
  const backendReady = window.Backend?.ready;
  if (typeof backendReady === "function") {
    try {
      await Promise.race([
        backendReady(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Tempo esgotado ao conectar ao Firebase.")),
            10000,
          ),
        ),
      ]);
    } catch (error) {
      console.error(error);
    }
  }

  if (window.Auth?.user) {
    // Vendedor que voltou do Google no passo 1: falta CPF, banca e localização.
    Router.go(window.Auth.user.needsCompletion ? "cadastro" : "home");
  } else {
    Router.go("login");
  }
});
