const mockOffers = [
  {
    name: "Tomate",
    unit: "1 kg",
    price: "3,99",
    feira: "Feira Central",
    icon: "🍅",
  },
  {
    name: "Banana",
    unit: "1 kg",
    price: "4,50",
    feira: "Feira do João",
    icon: "🍌",
  },
  {
    name: "Alface",
    unit: "unidade",
    price: "2,00",
    feira: "Feira São José",
    icon: "🥬",
  },
  {
    name: "Carne bovina",
    unit: "1 kg",
    price: "24,90",
    feira: "Açougue da Feira",
    icon: "🥩",
  },
];
const HomePage = () => {
  const stories = [
    ["Ana", "👩"],
    ["João", "👨"],
    ["Central", "🏪"],
    ["Maria", "👩‍🌾"],
    ["Pedro", "👨‍🌾"],
    ["Xepa", "🥕"],
  ];
  document
    .querySelectorAll("[data-stories]")
    .forEach(
      (el) =>
        (el.innerHTML = stories
          .map((s) => Components.story(s[0], s[1]))
          .join("")),
    );
  const list = document.querySelector("[data-home-offers]");
  if (list)
    list.innerHTML = mockOffers
      .slice(0, 4)
      .map((o) => Components.offer(o))
      .join("");
};
const mockOffers = [
  {
    name: "Tomate",
    unit: "1 kg",
    price: "3,99",
    feira: "Feira Central",
    icon: "🍅",
  },
  {
    name: "Banana",
    unit: "1 kg",
    price: "4,50",
    feira: "Feira do João",
    icon: "🍌",
  },
  {
    name: "Alface",
    unit: "unidade",
    price: "2,00",
    feira: "Feira São José",
    icon: "🥬",
  },
  {
    name: "Carne bovina",
    unit: "1 kg",
    price: "24,90",
    feira: "Açougue da Feira",
    icon: "🥩",
  },
];

const HomePage = () => {
  const stories = [
    ["Ana", "👩"],
    ["João", "👨"],
    ["Central", "🏪"],
    ["Maria", "👩‍🌾"],
    ["Pedro", "👨‍🌾"],
    ["Xepa", "🥕"],
  ];
  document
    .querySelectorAll("[data-stories]")
    .forEach(
      (el) =>
        (el.innerHTML = stories
          .map((s) => Components.story(s[0], s[1]))
          .join("")),
    );

  const list = document.querySelector("[data-home-offers]");
  if (list)
    list.innerHTML = mockOffers
      .slice(0, 4)
      .map((o) => Components.offer(o))
      .join("");

  // Mostrar botão "Criar Story" apenas para comerciantes
  const user = Auth.user;
  if (user && user.type === "comerciante") {
    const btn = document.getElementById("criar-story-btn");
    if (btn) btn.style.display = "inline-block";
  }
};
