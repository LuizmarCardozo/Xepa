window.CadastroPage = function () {
  // Estado da seleção
  let selectedType = "cliente";

  // Botões de tipo
  const options = document.querySelectorAll(".account-option");
  options.forEach((btn) => {
    btn.addEventListener("click", function () {
      options.forEach((b) => b.classList.remove("selected"));
      this.classList.add("selected");
      selectedType = this.dataset.type;
    });
  });

  // Formulário de cadastro
  const form = document.getElementById("cad-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      Auth.register({
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        type: selectedType,
      });
    });
  }
};
