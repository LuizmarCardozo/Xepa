// ============================================================
//  COLE AQUI O LINK DE DOWNLOAD DO APP (Play Store, APK, etc.)
//  Exemplo: "https://play.google.com/store/apps/details?id=com.xepa.app"
// ============================================================
const LINK_DOWNLOAD = "";

const botoes = document.querySelectorAll("[data-download]");
const aviso = document.getElementById("aviso");

botoes.forEach((botao) => {
  if (LINK_DOWNLOAD) {
    botao.href = LINK_DOWNLOAD;
    botao.rel = "noopener";
  } else {
    botao.addEventListener("click", (evento) => {
      evento.preventDefault();
      aviso.hidden = false;
      clearTimeout(aviso.timer);
      aviso.timer = setTimeout(() => (aviso.hidden = true), 4500);
    });
  }
});

document.getElementById("ano").textContent = new Date().getFullYear();
