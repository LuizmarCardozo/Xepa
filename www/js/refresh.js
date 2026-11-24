// Atualização dos dados: puxar para atualizar + atualização automática.
(function () {
  const NO_PULL = new Set([
    "login",
    "cadastro",
    "criarOferta",
    "criarStory",
    "resgatar",
  ]);
  // Telas com dados que mudam sozinhos -> intervalo da atualização automática (ms).
  // "pedidos" não entra: já usa onSnapshot (tempo real).
  const AUTO = {
    home: 60000,
    ofertas: 60000,
    feiras: 60000,
    feira: 60000,
    minhasOfertas: 60000,
    avaliacoes: 60000,
    desempenho: 60000,
    carteira: 30000,
  };
  const IDLE_MS = 10000; // só atualiza sozinho se a pessoa estiver parada
  const AWAY_MS = 15000; // ao voltar para o app depois disso, atualiza
  const THRESHOLD = 64;
  const MAX_PULL = 110;

  let refreshing = false;
  let lastActivity = Date.now();
  let lastRefresh = Date.now();
  let hiddenAt = 0;

  async function refresh(options = {}) {
    if (refreshing || !window.Router?.current?.()) return false;
    refreshing = true;
    try {
      try {
        await window.Backend?.refreshUser?.();
      } catch (error) {
        console.warn("Não foi possível atualizar o perfil:", error);
      }
      await window.Router.refresh(options);
      lastRefresh = Date.now();
      return true;
    } finally {
      refreshing = false;
    }
  }
  window.XepaRefresh = { refresh };

  // ---------- Atualização automática ----------
  ["touchstart", "touchmove", "scroll", "keydown", "click"].forEach((evt) =>
    window.addEventListener(evt, () => (lastActivity = Date.now()), {
      passive: true,
      capture: true,
    }),
  );

  function userIsBusy() {
    const el = document.activeElement;
    if (el && el.matches?.("input, textarea, select, [contenteditable='true']"))
      return true;
    if (document.querySelector("dialog[open]")) return true;
    return /seller-image-editing|pix-withdraw-mode/.test(
      document.body.className,
    );
  }

  function autoRefresh(force) {
    const route = window.Router?.current?.();
    if (!route || !(route in AUTO)) return;
    if (document.visibilityState !== "visible" || !navigator.onLine) return;
    if (refreshing || userIsBusy()) return;
    if (!force && Date.now() - lastActivity < IDLE_MS) return;
    refresh({ silent: true }).catch((error) => console.warn(error));
  }

  setInterval(() => {
    const route = window.Router?.current?.();
    if (route in AUTO && Date.now() - lastRefresh >= AUTO[route])
      autoRefresh(false);
  }, 5000);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      hiddenAt = Date.now();
    } else if (hiddenAt && Date.now() - hiddenAt >= AWAY_MS) {
      hiddenAt = 0;
      autoRefresh(true);
    }
  });
  window.addEventListener("online", () => autoRefresh(true));

  // ---------- Puxar para atualizar ----------
  const ICON_ARROW = '<path d="M12 5v13M6 13l6 6 6-6"/>';
  const ICON_SPIN = '<path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"/>';
  const ICON_OK = '<path d="M5 13l4 4L19 7"/>';
  let indicator = null;

  function getIndicator() {
    if (!indicator) {
      indicator = document.createElement("div");
      indicator.className = "ptr";
      indicator.setAttribute("aria-hidden", "true");
      indicator.innerHTML = `<svg viewBox="0 0 24 24">${ICON_ARROW}</svg>`;
      document.body.appendChild(indicator);
    }
    return indicator;
  }
  function setIcon(el, svgPath) {
    el.querySelector("svg").innerHTML = svgPath;
  }
  function show(el, dist, ready) {
    el.classList.remove("ptr-animate");
    el.style.opacity = Math.min(1, dist / 40);
    el.style.transform = `translateY(${dist - 70}px) rotate(${ready ? 180 : (dist / THRESHOLD) * 120}deg)`;
    if (ready !== el._ready) {
      el._ready = ready;
      setIcon(el, ready ? ICON_ARROW : ICON_ARROW);
    }
  }
  function hide(el) {
    el.classList.add("ptr-animate");
    el.classList.remove("ptr-loading");
    el.style.opacity = "0";
    el.style.transform = "translateY(-70px)";
  }

  function scrollAtTop() {
    return (window.scrollY || document.documentElement.scrollTop || 0) <= 0;
  }
  function blocked(target) {
    const route = window.Router?.current?.();
    if (!route || NO_PULL.has(route)) return true;
    if (/seller-image-editing|pix-withdraw-mode/.test(document.body.className))
      return true;
    for (let el = target; el && el !== document.body; el = el.parentElement) {
      if (el.matches?.("input, textarea, select, [data-no-pull]")) return true;
      const style = getComputedStyle(el);
      if (
        /(auto|scroll)/.test(style.overflowY) &&
        el.scrollHeight > el.clientHeight &&
        el.scrollTop > 0
      ) {
        return true;
      }
    }
    return false;
  }

  let startX = 0;
  let startY = 0;
  let pulling = false;
  let armed = false;
  let dist = 0;

  document.addEventListener(
    "touchstart",
    (event) => {
      pulling = false;
      armed = false;
      if (refreshing || event.touches.length !== 1) return;
      if (!scrollAtTop() || blocked(event.target)) return;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      pulling = true;
    },
    { passive: true },
  );

  document.addEventListener(
    "touchmove",
    (event) => {
      if (!pulling) return;
      const dx = event.touches[0].clientX - startX;
      const dy = event.touches[0].clientY - startY;
      if (!armed) {
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8)
          return void (pulling = false);
        if (dy < -6) return void (pulling = false);
        if (dy < 8) return;
        armed = true;
      }
      if (!scrollAtTop()) {
        pulling = false;
        armed = false;
        hide(getIndicator());
        return;
      }
      if (event.cancelable) event.preventDefault();
      dist = Math.min(dy * 0.5, MAX_PULL);
      show(getIndicator(), dist, dist >= THRESHOLD);
    },
    { passive: false },
  );

  async function release() {
    if (!pulling || !armed) {
      pulling = false;
      return;
    }
    pulling = false;
    armed = false;
    const el = getIndicator();
    if (dist < THRESHOLD) return hide(el);

    // segura o indicador no topo enquanto atualiza
    setIcon(el, ICON_SPIN);
    el.classList.add("ptr-animate", "ptr-loading");
    el.style.opacity = "1";
    el.style.transform = "translateY(8px)";
    let ok = false;
    try {
      ok = navigator.onLine ? await refresh({ silent: false }) : false;
    } catch (error) {
      console.error(error);
    }
    el.classList.remove("ptr-loading");
    setIcon(el, ok ? ICON_OK : ICON_ARROW);
    setTimeout(() => {
      hide(el);
      setTimeout(() => setIcon(el, ICON_ARROW), 300);
    }, 450);
  }
  document.addEventListener("touchend", release, { passive: true });
  document.addEventListener("touchcancel", release, { passive: true });
})();
