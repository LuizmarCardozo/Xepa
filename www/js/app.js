document.addEventListener("DOMContentLoaded", async () => {
  const backendReady = window.Backend?.ready;
  if (typeof backendReady === "function") {
    try {
      await Promise.race([
        backendReady(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Tempo esgotado ao conectar ao Firebase.")), 10000),
        ),
      ]);
    } catch (error) {
      console.error(error);
    }
  }

  if (window.Auth?.user) {
    Router.go(
      sessionStorage.getItem("xepa-google-registration-type")
        ? "cadastro"
        : "home",
    );
  } else {
    Router.go("login");
  }
});
