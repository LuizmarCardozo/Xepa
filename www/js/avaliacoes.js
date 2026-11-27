// Exibe avaliações dos pedidos e permite ao vendedor responder.
(() => {
  const escapeReviewHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return entities[character];
    });

  const reviewPhotos = (review) => {
    if (!Array.isArray(review?.photos)) return [];
    return review.photos.filter((photo) => {
      if (typeof photo !== "string") return false;
      try {
        const url = new URL(photo, window.location.href);
        return ["https:", "http:"].includes(url.protocol);
      } catch {
        return false;
      }
    });
  };

  const reviewTimestamp = (order) => {
    const value = order?.review?.createdAt || order?.updatedAt || order?.createdAt;
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? 0 : timestamp;
  };

  const reviewDate = (timestamp) => {
    if (!timestamp) return "Data indisponível";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(timestamp));
  };

  const ratingStars = (rating) => {
    const filled = "★".repeat(rating);
    const empty = "☆".repeat(5 - rating);
    return `<span class="seller-review-stars" role="img" aria-label="${rating} de 5 estrelas"><span class="seller-review-stars-filled">${filled}</span><span class="seller-review-stars-empty">${empty}</span></span>`;
  };

  const getReviewItems = (orders, merchantUid) =>
    orders
      .filter(
        (order) =>
          order?.merchantUid === merchantUid &&
          Number.isInteger(Number(order?.review?.rating)) &&
          Number(order.review.rating) >= 1 &&
          Number(order.review.rating) <= 5,
      )
      .map((order) => ({
        order,
        rating: Number(order.review.rating),
        timestamp: reviewTimestamp(order),
        photos: reviewPhotos(order.review),
      }));

  const renderReviewCard = ({ order, rating, timestamp, photos }) => {
    const buyerName = String(order.buyerName || "Cliente").trim() || "Cliente";
    const comment =
      String(order.review.comment || "").trim() ||
      "O cliente não deixou um comentário.";
    const response = order.review.sellerResponse;
    const responseText =
      typeof response?.comment === "string" ? response.comment.trim() : "";
    const photoMarkup = photos.length
      ? `<div class="seller-review-photos">${photos
          .map(
            (photo) =>
              `<img src="${escapeReviewHtml(photo)}" alt="Foto enviada na avaliação" loading="lazy">`,
          )
          .join("")}</div>`
      : "";
    const responseMarkup = responseText
      ? `<div class="seller-review-response"><strong>Sua resposta</strong><p>${escapeReviewHtml(responseText)}</p></div>`
      : "";
    const replyLabel = responseText ? "Editar resposta" : "Responder";

    return `
      <article class="seller-review-card" data-review-card="${escapeReviewHtml(order.id)}">
        <div class="seller-review-card-heading">
          <span class="seller-review-avatar" aria-hidden="true">${escapeReviewHtml(buyerName.charAt(0).toUpperCase())}</span>
          <div class="seller-review-buyer">
            <strong>${escapeReviewHtml(buyerName)}</strong>
            ${ratingStars(rating)}
          </div>
          <time class="seller-review-date" datetime="${timestamp ? new Date(timestamp).toISOString() : ""}">${reviewDate(timestamp)}</time>
        </div>
        <p class="seller-review-comment">${escapeReviewHtml(comment)}</p>
        ${photoMarkup}
        ${responseMarkup}
        <button class="seller-review-reply-button" type="button" data-review-reply="${escapeReviewHtml(order.id)}">${replyLabel}</button>
      </article>
    `;
  };

  function AvaliacoesPageInit() {
    const page = document.querySelector(".seller-reviews-page");
    const list = page?.querySelector("[data-review-list]");
    if (!page || !list) return;

    let reviews = [];
    let activeFilter = "all";
    let activeRating = "all";

    const renderDistribution = () => {
      const total = reviews.length;
      const average = total
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / total
        : null;
      const averageNode = page.querySelector("[data-reviews-average]");
      const averageStars = page.querySelector("[data-reviews-average-stars]");
      const totalNode = page.querySelector("[data-reviews-total]");
      if (averageNode) averageNode.textContent = average ? average.toFixed(1) : "—";
      if (averageStars) {
        const filled = Math.round(average || 0);
        averageStars.setAttribute(
          "aria-label",
          average ? `${average.toFixed(1)} de 5 estrelas` : "Sem avaliações",
        );
        averageStars.innerHTML = `<span class="seller-review-stars-filled">${"★".repeat(filled)}</span><span class="seller-review-stars-empty">${"☆".repeat(5 - filled)}</span>`;
      }
      if (totalNode) {
        totalNode.textContent = `${total} ${total === 1 ? "avaliação" : "avaliações"}`;
      }

      for (let rating = 1; rating <= 5; rating += 1) {
        const count = reviews.filter((review) => review.rating === rating).length;
        const row = page.querySelector(`[data-rating-row="${rating}"]`);
        const bar = row?.querySelector(".seller-reviews-bar > span");
        if (bar) {
          bar.style.width = total ? `${(count / total) * 100}%` : "0%";
        }
        row?.setAttribute(
          "aria-label",
          `${rating} estrelas: ${count} ${count === 1 ? "avaliação" : "avaliações"}`,
        );
      }
    };

    const renderList = () => {
      let filtered = [...reviews];
      if (activeFilter === "photos") {
        filtered = filtered.filter((review) => review.photos.length > 0);
      }
      if (activeRating !== "all") {
        filtered = filtered.filter(
          (review) => review.rating === Number(activeRating),
        );
      }
      if (activeFilter === "recent") {
        filtered.sort((a, b) => b.timestamp - a.timestamp);
      }

      if (!filtered.length) {
        const message =
          reviews.length === 0
            ? "Ainda não há avaliações dos clientes."
            : "Nenhuma avaliação corresponde a esse filtro.";
        list.innerHTML = `<p class="seller-reviews-message">${message}</p>`;
        return;
      }
      list.innerHTML = filtered.map(renderReviewCard).join("");
    };

    const refresh = () => {
      renderDistribution();
      renderList();
    };

    page.querySelectorAll("[data-review-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.reviewFilter;
        page.querySelectorAll("[data-review-filter]").forEach((filter) => {
          const isActive = filter === button;
          filter.classList.toggle("is-active", isActive);
          filter.setAttribute("aria-pressed", String(isActive));
        });
        refresh();
      });
    });

    page
      .querySelector("[data-review-rating-filter]")
      ?.addEventListener("change", (event) => {
        activeRating = event.currentTarget.value;
        renderList();
      });

    list.addEventListener("click", (event) => {
      const replyButton = event.target.closest("[data-review-reply]");
      if (!replyButton) return;
      const card = replyButton.closest("[data-review-card]");
      if (!card) return;

      const existingForm = card.querySelector("[data-review-reply-form]");
      if (existingForm) {
        existingForm.remove();
        return;
      }
      const order = reviews.find(
        (review) => review.order.id === replyButton.dataset.reviewReply,
      )?.order;
      if (!order) return;

      const form = document.createElement("form");
      form.className = "seller-review-reply-form";
      form.dataset.reviewReplyForm = order.id;
      const existingResponse = order.review.sellerResponse?.comment || "";
      form.innerHTML = `
        <label>
          <span class="visually-hidden">Sua resposta para ${escapeReviewHtml(order.buyerName || "cliente")}</span>
          <textarea name="response" maxlength="500" required placeholder="Escreva sua resposta...">${escapeReviewHtml(existingResponse)}</textarea>
        </label>
        <p class="seller-review-reply-error" role="alert"></p>
        <div class="seller-review-reply-actions">
          <button type="button" data-review-reply-cancel>Cancelar</button>
          <button type="submit">Salvar resposta</button>
        </div>
      `;
      card.append(form);
      form.querySelector("textarea")?.focus();
    });

    list.addEventListener("click", (event) => {
      if (!event.target.closest("[data-review-reply-cancel]")) return;
      event.target.closest("[data-review-reply-form]")?.remove();
    });

    list.addEventListener("submit", async (event) => {
      const form = event.target.closest("[data-review-reply-form]");
      if (!form) return;
      event.preventDefault();
      const submitButton = form.querySelector('[type="submit"]');
      const errorNode = form.querySelector(".seller-review-reply-error");
      const comment = new FormData(form).get("response");
      submitButton.disabled = true;
      if (errorNode) errorNode.textContent = "";
      try {
        await window.Backend.submitReviewResponse(form.dataset.reviewReplyForm, comment);
        const review = reviews.find(
          (item) => item.order.id === form.dataset.reviewReplyForm,
        );
        if (review) {
          review.order.review = {
            ...review.order.review,
            sellerResponse: {
              comment: String(comment).trim(),
              createdAt: new Date().toISOString(),
            },
          };
        }
        renderList();
      } catch (error) {
        console.error("Não foi possível salvar a resposta à avaliação:", error);
        if (errorNode) {
          errorNode.textContent =
            error instanceof Error ? error.message : "Não foi possível salvar a resposta.";
        }
        submitButton.disabled = false;
      }
    });

    Promise.resolve()
      .then(() => window.Backend.getOrders())
      .then((orders) => {
        if (!Array.isArray(orders)) {
          throw new TypeError("A consulta de avaliações retornou dados inválidos.");
        }
        const merchantUid = window.Auth?.user?.uid;
        reviews = getReviewItems(orders, merchantUid);
        refresh();
      })
      .catch((error) => {
        console.error("Não foi possível carregar as avaliações:", error);
        list.innerHTML =
          '<p class="seller-reviews-message seller-reviews-error">Não foi possível carregar as avaliações. Tente novamente mais tarde.</p>';
      });
  }

  window.AvaliacoesPageInit = AvaliacoesPageInit;
})();
