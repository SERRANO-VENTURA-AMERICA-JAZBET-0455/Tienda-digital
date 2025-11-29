 /* =====================================================
   Tienda Nova Estrella - Versión optimizada
   ===================================================== */

(function () {
    "use strict";
  
    document.addEventListener("DOMContentLoaded", init);
  
    const $ = (s, r = document) => r.querySelector(s);
    const $all = (s, r = document) => r.querySelectorAll(s);
    const money = (n) =>
      Number(n || 0).toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN",
      });
  
    let state = {
      catalog: [],
      filtered: [],
      cart: [],
      category: "all",
      search: "",
    };
  
    function init() {
      const productsEl = $("#products");
      const searchEl = $("#search");
      const categoryNav = $("#categoryNav");
      const cartToggleBtn = $("#cartToggle");
      const cartPanel = $("#cartPanel");
      const closeCartBtn = $("#closeCart");
      const cartItemsEl = $("#cartItems");
      const cartCountEl = $("#cartCount");
      const cartSubtotalEl = $("#cartSubtotal");
      const checkoutBtn = $("#checkoutBtn");
  
      /* =====================================================
         1. Cargar catálogo
         ===================================================== */
      if (!window.catalogData) {
        productsEl.innerHTML = "<p>No se pudo cargar el catálogo.</p>";
        return;
      }
  
      state.catalog = Array.isArray(window.catalogData.products)
        ? window.catalogData.products
        : [];
  
      /* =====================================================
         2. Inicializar categorías y productos
         ===================================================== */
      buildCategories(categoryNav, state.catalog);
      state.filtered = [...state.catalog];
      renderProducts(productsEl, state.filtered);
      renderCart(cartItemsEl, cartCountEl, cartSubtotalEl);
  
      /* =====================================================
         3. Búsqueda
         ===================================================== */
      searchEl?.addEventListener("input", () => {
        state.search = searchEl.value.trim().toLowerCase();
        applyFilters(productsEl);
      });
  
      /* =====================================================
         4. Categorías
         ===================================================== */
      categoryNav.addEventListener("click", (e) => {
        const btn = e.target.closest(".nav-btn");
        if (!btn) return;
  
        state.category = btn.dataset.filter;
        $all(".nav-btn", categoryNav).forEach((b) =>
          b.classList.remove("active")
        );
        btn.classList.add("active");
  
        applyFilters(productsEl);
      });
  
      /* =====================================================
         5. Agregar al carrito
         ===================================================== */
      productsEl.addEventListener("click", (e) => {
        const btn = e.target.closest(".add-btn");
        if (!btn) return;
  
        const card = btn.closest(".card");
        const id = Number(card.dataset.id);
  
        const prod = state.catalog.find((p) => p.id === id || p.id === String(id));
        // Note: si tus IDs siguen siendo strings, podrías hacer la comparación con == o convertir ambos lados a string
        if (!prod) return console.error("Producto no encontrado:", card.dataset.id);
  
        addToCart(prod);
        openCart();
      });
  
      /* =====================================================
         6. Abrir / cerrar carrito
         ===================================================== */
      function openCart() {
        cartPanel.classList.add("open");
        cartToggleBtn?.setAttribute("aria-expanded", "true");
      }
  
      function closeCartFn() {
        cartPanel.classList.remove("open");
        cartToggleBtn?.setAttribute("aria-expanded", "false");
      }
  
      cartToggleBtn?.addEventListener("click", () =>
        cartPanel.classList.toggle("open")
      );
      closeCartBtn?.addEventListener("click", closeCartFn);
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeCartFn();
      });
  
      /* =====================================================
         7. Manejo interno del carrito
         ===================================================== */
      cartItemsEl.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
  
        const id = btn.dataset.id;
        const action = btn.dataset.action;
  
        if (!id) return;
  
        const pid = typeof state.catalog[0].id === "string" ? String(id) : Number(id);
  
        if (action === "inc") changeQty(pid, 1);
        if (action === "dec") changeQty(pid, -1);
        if (action === "remove") removeFromCart(pid);
  
        renderCart(cartItemsEl, cartCountEl, cartSubtotalEl);
      });
  
      /* =====================================================
         8. Finalizar compra
         ===================================================== */
      checkoutBtn?.addEventListener("click", () => {
        if (!state.cart.length) return alert("Carrito vacío.");
  
        const total = state.cart.reduce((t, i) => t + i.price * i.qty, 0);
  
        alert("Gracias por tu compra!\nTotal: " + money(total));
  
        state.cart = [];
        renderCart(cartItemsEl, cartCountEl, cartSubtotalEl);
        closeCartFn();
      });
  
      /* =====================================================
         FUNCIONES
         ===================================================== */
  
      function buildCategories(nav, catalog) {
        const cats = [...new Set(catalog.map((p) => p.category))].sort();
  
        nav.innerHTML = `<button class="nav-btn active" data-filter="all">Todo</button>`;
  
        cats.forEach((c) => {
          nav.innerHTML += `<button class="nav-btn" data-filter="${c}">${cap(
            c
          )}</button>`;
        });
      }
  
      function renderProducts(container, list) {
        if (!list.length) {
          container.innerHTML = "<p>No hay productos.</p>";
          return;
        }
  
        container.innerHTML = list
          .map(
            (p) => `
          <article class="card" data-id="${p.id}">
            <img src="${p.image}" alt="${esc(p.name)}" onerror="this.src='placeholder.png'">
            <div class="card-body">
              <h3>${esc(p.name)}</h3>
              <p class="price">${money(p.price)}</p>
              <button class="add-btn">Agregar</button>
            </div>
          </article>
        `
          )
          .join("");
      }
  
      function applyFilters(container) {
        let list = [...state.catalog];
  
        if (state.category !== "all") {
          list = list.filter((p) => p.category === state.category);
        }
  
        if (state.search) {
          list = list.filter((p) =>
            p.name.toLowerCase().includes(state.search)
          );
        }
  
        state.filtered = list;
        renderProducts(container, list);
      }
  
      function addToCart(p) {
        let item = state.cart.find((i) => i.id === p.id);
  
        if (item) item.qty++;
        else state.cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 });
  
        renderCart(cartItemsEl, cartCountEl, cartSubtotalEl);
      }
  
      function removeFromCart(id) {
        state.cart = state.cart.filter((i) => i.id !== id);
      }
  
      function changeQty(id, delta) {
        const it = state.cart.find((i) => i.id === id);
        if (!it) return;
  
        it.qty += delta;
        if (it.qty <= 0) removeFromCart(id);
      }
  
      function renderCart(container, countEl, subtotalEl) {
        container.innerHTML = "";
        let subtotal = 0;
  
        state.cart.forEach((it) => {
          subtotal += it.price * it.qty;
  
          container.innerHTML += `
            <div class="cart-item">
              <div>
                <p class="item-title">${esc(it.name)}</p>
                <small>${money(it.price)} c/u</small>
              </div>
              <div class="item-controls">
                <button data-action="dec" data-id="${it.id}">−</button>
                <span class="qty">${it.qty}</span>
                <button data-action="inc" data-id="${it.id}">+</button>
                <button data-action="remove" data-id="${it.id}">Quitar</button>
              </div>
            </div>
          `;
        });
  
        countEl.textContent = state.cart.reduce((a, b) => a + b.qty, 0);
        subtotalEl.textContent = money(subtotal);
      }
  
      const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
      const esc = (s) =>
        String(s).replace(/[&<>"]/g, (m) => {
          return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m];
        });
    }
  })();
  