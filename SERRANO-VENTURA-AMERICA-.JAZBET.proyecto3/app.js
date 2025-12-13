 /* =====================================================
   Tienda Avanzada — Lógica completa corregida y pulida
===================================================== */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", init);

  const $ = (s, root) => (root || document).querySelector(s);
  const $all = (s, root) => (root || document).querySelectorAll(s);
  const money = (n) =>
    Number(n || 0).toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });

  let state = {
    catalog: [],
    filtered: [],
    cart: [],
    favorites: [],
    category: "all",
    search: "",
    sort: "none",
  };

  /* ==========================
      INICIO
  ========================== */
  function init() {
    const productsEl = $("#products");
    if (!productsEl) return;

    const searchEl = $("#search");
    const categoryNav = $("#categoryNav");

    const cartToggleBtn = $("#cartToggle");
    const cartItemsEl = $("#cartItems");
    const cartCountEl = $("#cartCount");
    const cartSubtotalEl = $("#cartSubtotal");
    const checkoutBtn = $("#checkoutBtn");

    const cartModal = $("#cartModal");
    const cartModalClose = $("#cartModalClose");

    const sortSelect = $("#sortSelect");
    const themeToggle = $("#themeToggle");
    const modal = $("#modal");
    const modalBody = $("#modalBody");
    const modalClose = $("#modalClose");
    const notifyEl = $("#notify");

    /* ===== Cargar catálogo ===== */
    try {
      state.catalog = Array.isArray(window.catalogData?.products)
        ? window.catalogData.products
        : [];
    } catch {
      productsEl.textContent = "Error cargando catálogo";
      return;
    }

    /* ===== Recuperar carrito ===== */
    try {
      const saved = localStorage.getItem("cart");
      if (saved) state.cart = JSON.parse(saved);
    } catch {}

    /* ===== Recuperar favoritos ===== */
    try {
      const fav = localStorage.getItem("favorites");
      if (fav) state.favorites = JSON.parse(fav);
    } catch {}

    /* ===== Modo oscuro ===== */
    try {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark") document.body.classList.add("dark");
    } catch {}

    themeToggle?.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      localStorage.setItem(
        "theme",
        document.body.classList.contains("dark") ? "dark" : "light"
      );
    });

document.getElementById("themeToggle")?.addEventListener("click", () => {
  document.body.classList.toggle("light");
});

    /* ===== Inicialización UI ===== */
    buildCategories(categoryNav, state.catalog);
    state.filtered = state.catalog.slice();
    renderProducts(productsEl, state.filtered);
    renderCart(cartItemsEl, cartCountEl, cartSubtotalEl);

    /* ===== Búsqueda ===== */
    searchEl?.addEventListener("input", () => {
      state.search = searchEl.value.trim().toLowerCase();
      applyFilters(productsEl);
    });

    /* ===== Categorías ===== */
    categoryNav.addEventListener("click", (e) => {
      const btn = e.target.closest(".nav-btn");
      if (!btn) return;

      state.category = btn.dataset.filter || "all";

      $all(".nav-btn", categoryNav).forEach((b) =>
        b.classList.remove("active")
      );
      btn.classList.add("active");

      applyFilters(productsEl);
    });

    /* ===== Ordenar ===== */
    sortSelect?.addEventListener("change", () => {
      state.sort = sortSelect.value;
      applyFilters(productsEl);
    });

    /* ===== Eventos en productos ===== */
    productsEl.addEventListener("click", (e) => {
      const card = e.target.closest(".card");
      if (!card) return;

      const id = card.dataset.id;
      const product = state.catalog.find((p) => p.id === id);

      if (e.target.classList.contains("fav-btn")) {
        toggleFavorite(product);
        renderProducts(productsEl, state.filtered);
        showNotify(`${product.name} agregado a favoritos`);
        return;
      }

      if (e.target.classList.contains("details-btn")) {
        openModal(product);
        return;
      }

      if (e.target.classList.contains("add-btn")) {
        addToCart(product);
        openCartModal();
        showNotify(`Agregado: ${product.name}`);
      }
    });

    /* ===== Botón agregar dentro del modal ===== */
    modalBody.addEventListener("click", (e) => {
      if (!e.target.classList.contains("add-btn")) return;

      const id = e.target.dataset.id;
      const product = state.catalog.find((p) => p.id === id);

      if (product) {
        addToCart(product);
        showNotify(`Agregado: ${product.name}`);
        openCartModal();
      }
    });

    /* ===== Abrir / cerrar carrito ===== */
    function openCartModal() {
      cartModal.style.display = "flex";
    }
    function closeCartModal() {
      cartModal.style.display = "none";
    }

    cartToggleBtn?.addEventListener("click", openCartModal);
    cartModalClose?.addEventListener("click", closeCartModal);

    window.addEventListener("click", (e) => {
      if (e.target === cartModal) closeCartModal();
    });

    /* ===== Controles del carrito ===== */
    cartItemsEl.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;

      const id = btn.dataset.id;
      const action = btn.dataset.action;

      if (action === "inc") changeQty(id, +1);
      if (action === "dec") changeQty(id, -1);
      if (action === "remove") removeFromCart(id);

      renderCart(cartItemsEl, cartCountEl, cartSubtotalEl);
    });

    /* ===== Pagar ===== */
    checkoutBtn?.addEventListener("click", () => {
      if (!state.cart.length) return alert("Carrito vacío");

      const total = state.cart.reduce((s, it) => s + it.price * it.qty, 0);

      alert(`¡Gracias por tu compra!\nTotal: ${money(total)}`);

      state.cart = [];
      saveCart();
      renderCart(cartItemsEl, cartCountEl, cartSubtotalEl);
      closeCartModal();
    });

    /* ===== Modal de detalles ===== */
    modalClose?.addEventListener("click", () =>
      modal.classList.remove("open")
    );
    modal?.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("open");
    });
  }

  /* ==========================
      FUNCIONES
  ========================== */

  function buildCategories(container, catalog) {
    const cats = [...new Set(catalog.map((p) => p.category))].sort();
    container.innerHTML = "";

    const allBtn = document.createElement("button");
    allBtn.className = "nav-btn active";
    allBtn.dataset.filter = "all";
    allBtn.textContent = "Todo";
    container.appendChild(allBtn);

    cats.forEach((cat) => {
      const b = document.createElement("button");
      b.className = "nav-btn";
      b.dataset.filter = cat;
      b.textContent = capitalize(cat);
      container.appendChild(b);
    });
  }

  function renderProducts(container, list) {
    container.innerHTML = "";

    list.forEach((p) => {
      const isFav = state.favorites.includes(p.id);

      const card = document.createElement("article");
      card.className = "card";
      card.dataset.id = p.id;

      card.innerHTML = `
        <img src="${p.image}" alt="${escapeHtml(p.name)}">
        <div class="card-body">
          <h3>${escapeHtml(p.name)}</h3>
          <p class="price">${money(p.price)}</p>
          <div class="card-actions">
            <button class="add-btn">Agregar</button>
            <button class="details-btn">Detalles</button>
            <button class="fav-btn">${isFav ? "❤️" : "🤍"}</button>
          </div>
        </div>
      `;

      container.appendChild(card);
    });

    if (!list.length) container.innerHTML = "<p>No hay productos</p>";
  }

  function applyFilters(container) {
    let list = state.catalog;

    if (state.category !== "all")
      list = list.filter((p) => p.category === state.category);

    if (state.search)
      list = list.filter((p) =>
        p.name.toLowerCase().includes(state.search)
      );

    if (state.sort === "priceAsc")
      list = list.slice().sort((a, b) => a.price - b.price);
    if (state.sort === "priceDesc")
      list = list.slice().sort((a, b) => b.price - a.price);
    if (state.sort === "nameAsc")
      list = list.slice().sort((a, b) => a.name.localeCompare(b.name));
    if (state.sort === "nameDesc")
      list = list.slice().sort((a, b) => b.name.localeCompare(a.name));

    state.filtered = list;
    renderProducts(container, list);
  }

  function toggleFavorite(prod) {
    const i = state.favorites.indexOf(prod.id);
    if (i >= 0) state.favorites.splice(i, 1);
    else state.favorites.push(prod.id);
    saveFavorites();
  }

  function saveFavorites() {
    localStorage.setItem("favorites", JSON.stringify(state.favorites));
  }

  function openModal(prod) {
    const modal = $("#modal");
    const modalBody = $("#modalBody");

    modalBody.innerHTML = `
      <h2>${escapeHtml(prod.name)}</h2>
      <img src="${prod.image}" class="modal-img">
      <p><strong>Precio:</strong> ${money(prod.price)}</p>
      <p>${escapeHtml(prod.description || "Sin descripción")}</p>
      <button class="add-btn" data-id="${prod.id}">Agregar al carrito</button>
    `;

    modal.classList.add("open");
  }

  function addToCart(prod) {
    const f = state.cart.find((i) => i.id === prod.id);
    if (f) f.qty++;
    else
      state.cart.push({
        id: prod.id,
        name: prod.name,
        price: prod.price,
        qty: 1,
      });

    saveCart();
  }

  function removeFromCart(id) {
    state.cart = state.cart.filter((i) => i.id != id);
    saveCart();
  }

  function changeQty(id, delta) {
    const it = state.cart.find((i) => i.id == id);
    if (!it) return;

    it.qty += delta;
    if (it.qty <= 0) removeFromCart(id);

    saveCart();
  }

  function renderCart(container, countEl, subtotalEl) {
    container.innerHTML = "";

    let subtotal = 0;
    let count = 0;

    state.cart.forEach((it) => {
      subtotal += it.price * it.qty;
      count += it.qty;

      const row = document.createElement("div");
      row.className = "cart-item";

      row.innerHTML = `
        <div>
          <p class="item-title">${escapeHtml(it.name)}</p>
          <small>${money(it.price)} c/u</small>
        </div>

        <div class="item-controls">
          <button class="qty-btn" data-action="dec" data-id="${it.id}">−</button>
          <span class="qty">${it.qty}</span>
          <button class="qty-btn" data-action="inc" data-id="${it.id}">+</button>
          <button class="remove-btn" data-action="remove" data-id="${it.id}">Quitar</button>
        </div>
      `;

      container.appendChild(row);
    });

    countEl.textContent = count;
    subtotalEl.textContent = money(subtotal);
  }

  function saveCart() {
    localStorage.setItem("cart", JSON.stringify(state.cart));
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showNotify(msg) {
    const notifyEl = $("#notify");
    if (!notifyEl) return;

    notifyEl.textContent = msg;
    notifyEl.classList.add("show");

    setTimeout(() => notifyEl.classList.remove("show"), 2000);
  }
})();
