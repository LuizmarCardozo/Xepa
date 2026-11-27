// Calcula e apresenta indicadores dos pedidos do vendedor.
// Tela "Meu Desempenho" do comerciante: indicadores, gráfico de vendas,
// mais vendidos, meta mensal e últimos pedidos, tudo calculado a partir dos
// pedidos reais (Backend.getOrders).
(() => {
  const COMPLETED = new Set(["completed", "delivered"]);
  const CANCELLED = new Set(["cancelled", "canceled", "rejected"]);
  const MONTHS = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const SELECT_PERIODS = new Set(["month", "days30", "year"]);

  // Estado que sobrevive às atualizações automáticas da tela.
  let period = "week";
  let selectedIndex = null;

  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );

  const money = (value) =>
    `R$ ${(Number(value) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const pad = (n) => String(n).padStart(2, "0");

  const orderDate = (order) => {
    const value = order?.createdAt;
    if (!value) return null;
    const date =
      typeof value.toDate === "function" ? value.toDate() : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const orderTotal = (order) => {
    const total = Number(order?.total);
    if (
      order?.total !== null &&
      order?.total !== undefined &&
      order?.total !== "" &&
      Number.isFinite(total)
    ) {
      return total;
    }
    if (!Array.isArray(order?.items)) return 0;
    return order.items.reduce(
      (sum, item) =>
        sum + (Number(item?.price) || 0) * (Number(item?.quantity) || 0),
      0,
    );
  };

  const status = (order) => String(order?.status || "pending").toLowerCase();

  // ---------- Períodos / baldes do gráfico ----------
  const startOfDay = (date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const addDays = (date, days) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

  function buildBuckets(key, now) {
    const today = startOfDay(now);
    const buckets = [];
    if (key === "today") {
      for (let i = 0; i < 12; i += 1) {
        const start = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          i * 2,
        );
        const end = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          i * 2 + 2,
        );
        buckets.push({
          label: `${i * 2}h`,
          start,
          end,
          title: `${pad(i * 2)}h–${pad(i * 2 + 2 === 24 ? 0 : i * 2 + 2)}h`,
        });
      }
    } else if (key === "week") {
      const monday = addDays(today, -((today.getDay() + 6) % 7));
      for (let i = 0; i < 7; i += 1) {
        const start = addDays(monday, i);
        buckets.push({
          label: WEEKDAYS[i],
          start,
          end: addDays(start, 1),
          title: `${WEEKDAYS[i]} ${pad(start.getDate())}/${pad(start.getMonth() + 1)}`,
        });
      }
    } else if (key === "month") {
      const days = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
      ).getDate();
      for (let i = 1; i <= days; i += 1) {
        const start = new Date(today.getFullYear(), today.getMonth(), i);
        buckets.push({
          label: String(i),
          start,
          end: addDays(start, 1),
          title: `${pad(i)}/${pad(today.getMonth() + 1)}`,
        });
      }
    } else if (key === "days30") {
      for (let i = 29; i >= 0; i -= 1) {
        const start = addDays(today, -i);
        const label = `${pad(start.getDate())}/${pad(start.getMonth() + 1)}`;
        buckets.push({ label, start, end: addDays(start, 1), title: label });
      }
    } else {
      for (let i = 0; i < 12; i += 1) {
        const start = new Date(today.getFullYear(), i, 1);
        buckets.push({
          label: MONTHS[i],
          start,
          end: new Date(today.getFullYear(), i + 1, 1),
          title: `${MONTHS[i]}/${today.getFullYear()}`,
        });
      }
    }
    return buckets;
  }

  // ---------- Cálculos ----------
  function compute(orders, now) {
    const buckets = buildBuckets(period, now);
    const rangeStart = buckets[0].start;
    const rangeEnd = buckets[buckets.length - 1].end;

    const dated = orders
      .map((order) => ({ order, date: orderDate(order) }))
      .filter((entry) => entry.date);
    const inRange = dated.filter(
      ({ date }) => date >= rangeStart && date < rangeEnd,
    );
    const sold = inRange.filter(({ order }) => COMPLETED.has(status(order)));

    const values = buckets.map((bucket) => {
      if (bucket.start > now) return null; // futuro: sem ponto
      return sold
        .filter(({ date }) => date >= bucket.start && date < bucket.end)
        .reduce((sum, { order }) => sum + orderTotal(order), 0);
    });

    const productMap = new Map();
    sold.forEach(({ order }) => {
      (order.items || []).forEach((item) => {
        const name = String(item?.name || "Produto").trim() || "Produto";
        const key = name.toLowerCase();
        const entry = productMap.get(key) || {
          name,
          unit: item?.unit || "",
          image: item?.image || "",
          quantity: 0,
          revenue: 0,
        };
        entry.quantity += Number(item?.quantity) || 0;
        entry.revenue +=
          (Number(item?.price) || 0) * (Number(item?.quantity) || 0);
        if (!entry.image && item?.image) entry.image = item.image;
        productMap.set(key, entry);
      });
    });
    const topProducts = [...productMap.values()]
      .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
      .slice(0, 3);

    const ratings = orders
      .map((order) => Number(order?.review?.rating))
      .filter((r) => Number.isInteger(r) && r >= 1 && r <= 5);

    const monthSales = (year, month) =>
      dated
        .filter(
          ({ order, date }) =>
            COMPLETED.has(status(order)) &&
            date.getFullYear() === year &&
            date.getMonth() === month,
        )
        .reduce((sum, { order }) => sum + orderTotal(order), 0);
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    return {
      buckets,
      values,
      ordersCount: inRange.filter(({ order }) => !CANCELLED.has(status(order)))
        .length,
      salesTotal: sold.reduce((sum, { order }) => sum + orderTotal(order), 0),
      topProducts,
      ratingAverage: ratings.length
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : null,
      ratingCount: ratings.length,
      currentMonthSales: monthSales(now.getFullYear(), now.getMonth()),
      previousMonthSales: monthSales(prev.getFullYear(), prev.getMonth()),
      latest: [...dated].sort((a, b) => b.date - a.date).slice(0, 3),
    };
  }

  // ---------- Meta mensal (guardada neste aparelho) ----------
  const goalKey = () => `xepa-meta-mensal:${window.Auth?.user?.uid || "anon"}`;
  const readGoal = () => {
    try {
      const value = Number(localStorage.getItem(goalKey()));
      return Number.isFinite(value) && value > 0 ? value : null;
    } catch {
      return null;
    }
  };
  const writeGoal = (value) => {
    try {
      if (value) localStorage.setItem(goalKey(), String(value));
      else localStorage.removeItem(goalKey());
    } catch (error) {
      console.warn("Não foi possível guardar a meta:", error);
    }
  };
  const parseMoney = (text) => {
    let clean = String(text || "").replace(/[^\d.,]/g, "");
    if (clean.includes(",")) clean = clean.replace(/\./g, "").replace(",", ".");
    const value = Number(clean);
    return Number.isFinite(value) && value > 0
      ? Math.round(value * 100) / 100
      : null;
  };

  // ---------- Gráfico ----------
  const niceStep = (raw) => {
    if (raw <= 0) return 50;
    const pow = 10 ** Math.floor(Math.log10(raw));
    const n = raw / pow;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow;
  };
  const tickLabel = (value) => {
    if (value >= 1000)
      return `${(value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`;
    return value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  };

  // Curva suave que não "estoura" entre os pontos (interpolação monotônica).
  function smoothPath(points) {
    const n = points.length;
    if (n < 2) return "";
    const dx = [];
    const m = [];
    for (let i = 0; i < n - 1; i += 1) {
      dx[i] = points[i + 1].x - points[i].x;
      m[i] = (points[i + 1].y - points[i].y) / dx[i];
    }
    const t = [m[0]];
    for (let i = 1; i < n - 1; i += 1)
      t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    t[n - 1] = m[n - 2];
    for (let i = 0; i < n - 1; i += 1) {
      if (m[i] === 0) {
        t[i] = 0;
        t[i + 1] = 0;
      } else {
        const a = t[i] / m[i];
        const b = t[i + 1] / m[i];
        const s = a * a + b * b;
        if (s > 9) {
          const k = 3 / Math.sqrt(s);
          t[i] = k * a * m[i];
          t[i + 1] = k * b * m[i];
        }
      }
    }
    let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for (let i = 0; i < n - 1; i += 1) {
      const c1x = points[i].x + dx[i] / 3;
      const c1y = points[i].y + (t[i] * dx[i]) / 3;
      const c2x = points[i + 1].x - dx[i] / 3;
      const c2y = points[i + 1].y - (t[i + 1] * dx[i]) / 3;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${points[i + 1].x.toFixed(1)},${points[i + 1].y.toFixed(1)}`;
    }
    return d;
  }

  function renderChart(container, data) {
    const W = 320;
    const H = 205;
    const left = 34;
    const right = 12;
    const top = 16;
    const bottom = 28;
    const plotW = W - left - right;
    const plotH = H - top - bottom;
    const n = data.buckets.length;
    const maxValue = Math.max(0, ...data.values.map((v) => v || 0));
    const step = niceStep(maxValue > 0 ? maxValue / 3 : 0);
    const yMax = step * 3;
    const x = (i) => left + ((i + 0.5) * plotW) / n;
    const y = (v) => top + plotH * (1 - v / yMax);
    const labelEvery = n <= 12 ? 1 : Math.ceil(n / 7);

    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de vendas por período">`;
    for (let i = 0; i <= 3; i += 1) {
      const value = step * i;
      svg += `<line class="grid-line" x1="${left}" x2="${W - right}" y1="${y(value).toFixed(1)}" y2="${y(value).toFixed(1)}"/>`;
      svg += `<text class="axis-text" x="${left - 6}" y="${(y(value) + 3).toFixed(1)}" text-anchor="end">${tickLabel(value)}</text>`;
    }
    data.buckets.forEach((bucket, i) => {
      svg += `<line class="grid-line" x1="${x(i).toFixed(1)}" x2="${x(i).toFixed(1)}" y1="${top}" y2="${top + plotH}"/>`;
      if (i % labelEvery === 0) {
        svg += `<text class="axis-text" x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle">${esc(bucket.label)}</text>`;
      }
    });

    const points = data.values
      .map((value, i) =>
        value === null ? null : { x: x(i), y: y(value), i, value },
      )
      .filter(Boolean);
    if (points.length >= 2) {
      const path = smoothPath(points);
      const base = (top + plotH).toFixed(1);
      svg += `<defs><linearGradient id="perf-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#1f9d36" stop-opacity=".22"/><stop offset="1" stop-color="#1f9d36" stop-opacity="0"/></linearGradient></defs>`;
      svg += `<path d="${path} L${points[points.length - 1].x.toFixed(1)},${base} L${points[0].x.toFixed(1)},${base} Z" fill="url(#perf-fill)"/>`;
      svg += `<path class="line" d="${path}"/>`;
    }
    points.forEach((p) => {
      svg += `<circle class="dot${p.i === selectedIndex ? " is-selected" : ""}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${n > 12 ? 3 : 4.5}"/>`;
    });

    if (
      selectedIndex !== null &&
      data.values[selectedIndex] !== null &&
      data.values[selectedIndex] !== undefined
    ) {
      const bucket = data.buckets[selectedIndex];
      const text = `${bucket.title} · ${money(data.values[selectedIndex])}`;
      const boxW = Math.max(90, text.length * 5.6 + 14);
      const px = x(selectedIndex);
      const py = y(data.values[selectedIndex]);
      const bx = Math.min(Math.max(px - boxW / 2, left), W - right - boxW);
      const by = py - 34 < 2 ? py + 10 : py - 34;
      svg += `<rect class="tip-box" x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${boxW.toFixed(1)}" height="22" rx="7"/>`;
      svg += `<text class="tip-text" x="${(bx + boxW / 2).toFixed(1)}" y="${(by + 14.5).toFixed(1)}" text-anchor="middle">${esc(text)}</text>`;
    }

    data.buckets.forEach((bucket, i) => {
      if (data.values[i] === null) return;
      svg += `<rect class="hit" data-perf-hit="${i}" x="${(x(i) - plotW / n / 2).toFixed(1)}" y="${top}" width="${(plotW / n).toFixed(1)}" height="${plotH}"/>`;
    });
    svg += "</svg>";
    container.innerHTML = svg;
  }

  // ---------- Demais blocos ----------
  const safeImage = (src) =>
    typeof src === "string" &&
    /^(https?:|data:image\/|assets\/|blob:)/i.test(src)
      ? src
      : "";

  const qtyText = (entry) =>
    `${entry.quantity.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ${esc(entry.unit || "un")} vendidos`;

  function renderTop(list, products) {
    if (!products.length) {
      list.innerHTML = `<li class="perf-empty" style="display:block;border:0">Sem vendas concluídas neste período.</li>`;
      return;
    }
    list.innerHTML = products
      .map((entry, index) => {
        const image = safeImage(entry.image);
        const thumb = image
          ? `<img class="perf-thumb" src="${esc(image)}" alt="" loading="lazy">`
          : `<span class="perf-thumb" aria-hidden="true">${esc(entry.name.charAt(0).toUpperCase())}</span>`;
        return `<li>${thumb}<span class="perf-top-name">${esc(entry.name)}<small>${qtyText(entry)}</small></span><span class="perf-rank">${index + 1}º</span></li>`;
      })
      .join("");
  }

  function renderGoal(container, data, editing) {
    const custom = readGoal();
    const goal =
      custom || (data.previousMonthSales > 0 ? data.previousMonthSales : null);
    const sales = data.currentMonthSales;

    if (editing) {
      container.innerHTML = `
        <form class="perf-goal-form" data-perf-goal-form>
          <label class="perf-goal-meta" for="perf-goal-input">Meta mensal (R$)</label>
          <input id="perf-goal-input" type="text" inputmode="decimal" autocomplete="off" placeholder="Ex.: 3000,00" value="${custom ? esc(custom.toFixed(2).replace(".", ",")) : ""}">
          <div class="row"><button type="button" data-perf-goal-cancel>Cancelar</button><button type="submit">Salvar</button></div>
          ${custom ? '<button type="button" data-perf-goal-reset>Usar mês anterior</button>' : ""}
        </form>`;
      container.querySelector("input")?.focus();
      return;
    }

    const percent = goal ? Math.round((sales / goal) * 100) : null;
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const filled = percent === null ? 0 : Math.min(percent, 100) / 100;
    const done = percent !== null && percent >= 100;
    const statusText =
      goal === null
        ? "Defina uma meta para acompanhar."
        : done
          ? "Superou a meta!"
          : `Faltam ${money(goal - sales)}`;
    const goalLabel = custom ? "Meta mensal" : "Meta (mês anterior)";
    container.innerHTML = `
      <div class="perf-donut" role="img" aria-label="${percent === null ? "Sem meta definida" : `${percent}% da meta mensal`}">
        <svg viewBox="0 0 112 112" aria-hidden="true">
          <circle class="track" cx="56" cy="56" r="${radius}"/>
          <circle class="progress" cx="56" cy="56" r="${radius}" stroke-dasharray="${circumference.toFixed(1)}" stroke-dashoffset="${(circumference * (1 - filled)).toFixed(1)}"/>
        </svg>
        <strong>${percent === null ? "—" : `${percent}%`}</strong>
      </div>
      <div class="perf-goal-meta">${goalLabel}<strong>${goal ? money(goal) : "Não definida"}</strong></div>
      <div class="perf-goal-status${done ? " is-done" : ""}">${statusText}</div>
      <button class="perf-link" type="button" data-perf-goal-edit>${custom ? "Editar meta" : "Definir meta"}</button>`;
  }

  const METHOD = {
    pix: {
      label: "Pix",
      icon: '<path d="M12 3 21 12l-9 9-9-9z"/><path d="m9 12 3-3 3 3-3 3z"/>',
    },
    dinheiro: {
      label: "Dinheiro",
      icon: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>',
    },
  };
  const OTHER_METHOD = {
    label: "A combinar",
    icon: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
  };
  const STATUS_LABEL = {
    pending: "Pendente",
    accepted: "Aceito",
    ready: "Pronto",
    completed: "Concluído",
    delivered: "Concluído",
    cancelled: "Cancelado",
    canceled: "Cancelado",
    rejected: "Cancelado",
  };

  function renderLatest(list, latest) {
    if (!latest.length) {
      list.innerHTML = `<li class="perf-empty" style="display:block;border:0">Você ainda não recebeu pedidos.</li>`;
      return;
    }
    list.innerHTML = latest
      .map(({ order, date }) => {
        const st = status(order);
        const method =
          METHOD[String(order.paymentMethod || "").toLowerCase()] ||
          OTHER_METHOD;
        const done = COMPLETED.has(st);
        const pillClass = done
          ? ""
          : CANCELLED.has(st)
            ? " is-cancelled"
            : " is-pending";
        const when = `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
        return `<li>
          <svg class="perf-latest-icon" viewBox="0 0 24 24" aria-hidden="true">${method.icon}</svg>
          <span class="perf-latest-name">${esc(method.label)}${done ? " recebido" : ""}<small>${esc(order.buyerName || "Cliente")} · ${when}</small></span>
          <span class="perf-latest-amount">${money(orderTotal(order))}</span>
          <span class="perf-pill${pillClass}">${STATUS_LABEL[st] || "Pendente"}</span>
        </li>`;
      })
      .join("");
  }

  // ---------- Página ----------
  function DesempenhoPageInit() {
    const root = document.querySelector(".perf-page");
    if (!root) {
      throw new Error(
        "A tela de desempenho (pages/desempenho.html) não foi encontrada. Publique esse arquivo junto com o resto do app.",
      );
    }
    if (window.Auth?.user?.type !== "comerciante") {
      window.Router.go("home", { replaceHistory: true });
      return;
    }
    const $ = (selector) => root.querySelector(selector);
    const setText = (selector, text) => {
      const node = $(selector);
      if (node) node.textContent = text;
    };
    const errorNode = $("[data-perf-error]");
    let orders = [];
    let editingGoal = false;

    const syncPeriodControls = () => {
      root.querySelectorAll("[data-perf-period]").forEach((button) => {
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.perfPeriod === period),
        );
      });
      const select = $("[data-perf-period-select]");
      if (!select) return;
      select.value = SELECT_PERIODS.has(period) ? period : "";
      select
        .closest(".perf-select")
        ?.classList.toggle("is-active", SELECT_PERIODS.has(period));
    };

    const render = () => {
      const data = compute(orders, new Date());
      setText('[data-perf-kpi="orders"]', String(data.ordersCount));
      setText('[data-perf-kpi="sales"]', money(data.salesTotal));
      setText(
        '[data-perf-kpi="rating"]',
        data.ratingAverage === null
          ? "—"
          : data.ratingAverage.toFixed(1).replace(".", ","),
      );
      const chart = $("[data-perf-chart]");
      if (chart) renderChart(chart, data);
      const top = $("[data-perf-top]");
      if (top) renderTop(top, data.topProducts);
      const goal = $("[data-perf-goal]");
      if (goal) renderGoal(goal, data, editingGoal);
      const latest = $("[data-perf-latest]");
      if (latest) renderLatest(latest, data.latest);
      setText(
        "[data-perf-chart-hint]",
        data.salesTotal > 0
          ? "Toque em um ponto para ver o valor."
          : "Sem vendas concluídas neste período.",
      );
      syncPeriodControls();
    };

    root.addEventListener("click", (event) => {
      const periodButton = event.target.closest("[data-perf-period]");
      if (periodButton) {
        period = periodButton.dataset.perfPeriod;
        selectedIndex = null;
        return render();
      }
      const hit = event.target.closest("[data-perf-hit]");
      if (hit) {
        const index = Number(hit.dataset.perfHit);
        selectedIndex = selectedIndex === index ? null : index;
        return render();
      }
      if (event.target.closest("[data-perf-goal-edit]")) {
        editingGoal = true;
        return render();
      }
      if (event.target.closest("[data-perf-goal-cancel]")) {
        editingGoal = false;
        return render();
      }
      if (event.target.closest("[data-perf-goal-reset]")) {
        writeGoal(null);
        editingGoal = false;
        render();
      }
    });
    $("[data-perf-period-select]")?.addEventListener("change", (event) => {
      period = event.target.value || "week";
      selectedIndex = null;
      render();
    });
    root.addEventListener("submit", (event) => {
      if (!event.target.closest("[data-perf-goal-form]")) return;
      event.preventDefault();
      const value = parseMoney(event.target.querySelector("input").value);
      if (!value) {
        event.target
          .querySelector("input")
          .setCustomValidity("Digite um valor maior que zero.");
        event.target.querySelector("input").reportValidity();
        event.target.querySelector("input").setCustomValidity("");
        return;
      }
      writeGoal(value);
      editingGoal = false;
      render();
    });

    // Mostra a estrutura já com zeros e preenche quando os pedidos chegarem.
    render();
    return Promise.resolve()
      .then(() => window.Backend.getOrders())
      .then((all) => {
        const uid = window.Auth?.user?.uid;
        orders = (Array.isArray(all) ? all : []).filter(
          (order) => order?.merchantUid === uid,
        );
        render();
      })
      .catch((error) => {
        console.error("Não foi possível carregar o desempenho:", error);
        if (errorNode) {
          errorNode.textContent =
            "Não foi possível carregar seus dados agora. Puxe a tela para baixo para tentar de novo.";
          errorNode.hidden = false;
        }
      });
  }

  // O card de desempenho da tela inicial do comerciante sempre abre esta tela,
  // qualquer que seja o onclick que esteja escrito no HTML dele.
  document.addEventListener(
    "click",
    (event) => {
      const card = event.target.closest?.(".merchant-summary-performance");
      if (!card || window.Auth?.user?.type !== "comerciante") return;
      event.preventDefault();
      event.stopPropagation();
      window.Router.go("desempenho");
    },
    true,
  );

  window.DesempenhoPageInit = DesempenhoPageInit;
})();
