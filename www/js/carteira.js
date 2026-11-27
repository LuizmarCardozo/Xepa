// Monta a interface da carteira do vendedor.
window.CarteiraPage = function () {
  const pix = '<img src="assets/pay-pix.svg" alt="">';
  const card = '<img src="assets/pay-card.svg" alt="">';
  const row = (icon, label, amount, time) => `<div class="wallet-transaction"><span class="wallet-transaction-icon">${icon}</span><span class="wallet-transaction-label">${label}<small>${time}</small></span><strong>R$${amount}</strong><span class="wallet-arrow"></span></div>`;
  return `<main class="seller-account seller-wallet">
    <header class="seller-wallet-header"><div class="seller-wallet-logo"><img src="assets/xepa-pay-logo.png" alt="Xepa"><small>pay</small></div><div class="seller-wallet-owner"><img id="wallet-owner-image" src="assets/banca-figma.png" alt="Foto da banca"><strong id="wallet-owner">Banca com nome não cadastrado</strong></div></header>
    <section class="seller-balance"><p>Saldo Disponível</p><strong>R$ 1.000.00</strong><button id="wallet-withdraw" type="button">Resgatar</button></section>
    <div class="seller-activity-title"><h1>Suas ultimas atividades</h1><span>Ver mais</span></div>
    <section class="seller-activity" aria-label="Exemplos de movimentações"><div class="wallet-day">Hoje</div>
      ${row(pix,'Pix recebido','54,00','15:12')}${row(pix,'Pix recebido','32,87','15:08')}${row(card,'Cartão/Debito','68,22','15:02')}
      <div class="wallet-day">Ontem</div>${row(pix,'Pix recebido','10,50','15:20')}${row(card,'Cartão/Credito','22,57','15:17')}
    </section>
  </main>`;
};
window.CarteiraPageInit = function () {
  const owner = document.getElementById("wallet-owner");
  const ownerImage = document.getElementById("wallet-owner-image");
  if (owner) {
    owner.textContent =
      window.Auth?.user?.stallName || "Banca com nome não cadastrado";
  }
  if (ownerImage && window.Auth?.user?.stallImage) {
    ownerImage.src = window.Auth.user.stallImage;
  }
  document
    .getElementById("wallet-withdraw")
    ?.addEventListener("click", () => Router.go("resgatar"));
};
