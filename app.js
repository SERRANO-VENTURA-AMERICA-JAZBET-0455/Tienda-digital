  /* =====================================================
   Tienda Nova Estrella
   - Muestra productos y categorías desde un catálogo
   - Permite buscar y filtrar
   - Incluye un carrito básico para simular compras
   ===================================================== */

(function(){
    'use strict';
  
    // Esperamos a que la página esté lista antes de empezar
    document.addEventListener('DOMContentLoaded', init);
  
    // Atajos para encontrar elementos en la página
    const $ = (s,r=document)=>r.querySelector(s);
    const $all = (s,r=document)=>r.querySelectorAll(s);

    // Convierte números en formato de dinero mexicano
    const money = n => Number(n||0).toLocaleString('es-MX',{style:'currency',currency:'MXN'});
  
    // Aquí guardamos todo lo que la tienda necesita recordar
    let state = {
      catalog: [],   // Lista completa de productos
      filtered: [],  // Lista filtrada (según búsqueda/categoría)
      cart: [],      // Carrito con productos elegidos
      category: 'all', // Categoría seleccionada
      search: ''       // Texto de búsqueda
    };
  
    function init(){
      // Guardamos referencias a las partes importantes de la página
      const productsEl     = $('#products');
      const searchEl       = $('#search');
      const categoryNav    = $('#categoryNav');
      const cartToggleBtn  = $('#cartToggle');
      const cartPanel      = $('#cartPanel');
      const closeCartBtn   = $('#closeCart');
      const cartItemsEl    = $('#cartItems');
      const cartCountEl    = $('#cartCount');
      const cartSubtotalEl = $('#cartSubtotal');
      const checkoutBtn    = $('#checkoutBtn');
  
      // Revisamos si existe el catálogo de productos
      if(!window.catalogData){
        productsEl.innerHTML = '<p>No se pudo cargar el catálogo.</p>';
        return;
      }
      state.catalog = window.catalogData.products || [];
  
      // Mostramos categorías y productos al inicio
      buildCategories(categoryNav, state.catalog);
      state.filtered = [...state.catalog];
      renderProducts(productsEl, state.filtered);
      renderCart(cartItemsEl, cartCountEl, cartSubtotalEl);
  
      // Cuando alguien escribe en la búsqueda, filtramos productos
      searchEl?.addEventListener('input', ()=>{
        state.search = searchEl.value.trim().toLowerCase();
        applyFilters(productsEl);
      });
  
      // Cuando alguien hace clic en una categoría, filtramos productos
      categoryNav.addEventListener('click', e=>{
        const btn = e.target.closest('.nav-btn');
        if(!btn) return;
        state.category = btn.dataset.filter;
        $all('.nav-btn', categoryNav).forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        applyFilters(productsEl);
      });
  
      // Cuando alguien da clic en "Agregar", metemos el producto al carrito
      productsEl.addEventListener('click', e=>{
        const btn = e.target.closest('.add-btn');
        if(!btn) return;
        const card = btn.closest('.card');
        addToCart(state.catalog.find(p=>p.id === card.dataset.id));
        openCart();
      });
  
      // Funciones para abrir y cerrar el carrito
      function openCart(){
        cartPanel.classList.add('open');
        cartToggleBtn?.setAttribute('aria-expanded','true');
      }
      function closeCartFn(){
        cartPanel.classList.remove('open');
        cartToggleBtn?.setAttribute('aria-expanded','false');
      }
      cartToggleBtn?.addEventListener('click', ()=> cartPanel.classList.toggle('open'));
      closeCartBtn?.addEventListener('click', closeCartFn);
      document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeCartFn(); });
  
      // Dentro del carrito: botones para sumar, restar o quitar productos
      cartItemsEl.addEventListener('click', e=>{
        const btn = e.target.closest('button');
        if(!btn) return;
        const {id,action} = btn.dataset;
  
        if(action==='inc')  changeQty(id,1);   // sumar cantidad
        if(action==='dec')  changeQty(id,-1);  // restar cantidad
        if(action==='remove') removeFromCart(id); // quitar producto
  
        renderCart(cartItemsEl, cartCountEl, cartSubtotalEl);
      });
  
      // Botón de pagar (solo muestra un mensaje y limpia el carrito)
      checkoutBtn?.addEventListener('click', ()=>{
        if(!state.cart.length) return alert('Carrito vacío.');
        const total = state.cart.reduce((t,i)=>t+i.price*i.qty,0);
        alert('Gracias por tu compra!\nTotal: '+money(total));
        state.cart = [];
        renderCart(cartItemsEl, cartCountEl, cartSubtotalEl);
        closeCartFn();
      });
  
      /* ====== Funciones ====== */
  
      // Crear botones de categorías según el catálogo
      function buildCategories(nav, catalog){
        const cats = [...new Set(catalog.map(p=>p.category))].sort();
        nav.innerHTML = `<button class="nav-btn active" data-filter="all">Todo</button>`;
        cats.forEach(c=>{
          nav.innerHTML += `<button class="nav-btn" data-filter="${c}">${cap(c)}</button>`;
        });
      }
  
      // Mostrar productos en la página
      function renderProducts(container, list){
        if(!list.length){
          container.innerHTML = '<p>No hay productos.</p>';
          return;
        }
        container.innerHTML = list.map(p=>`
          <article class="card" data-id="${p.id}">
            <img src="${p.image}" alt="${esc(p.name)}">
            <div class="card-body">
              <h3>${esc(p.name)}</h3>
              <p class="price">${money(p.price)}</p>
              <button class="add-btn">Agregar</button>
            </div>
          </article>
        `).join('');
      }
  
      // Filtrar productos según categoría y texto de búsqueda
      function applyFilters(container){
        let list = state.catalog;
  
        if(state.category !== 'all')
          list = list.filter(p=>p.category===state.category);
  
        if(state.search)
          list = list.filter(p=>p.name.toLowerCase().includes(state.search));
  
        state.filtered = list;
        renderProducts(container, list);
      }
  
      // Carrito: agregar producto
      function addToCart(p){
        let item = state.cart.find(i=>i.id===p.id);
        if(item) item.qty++;
        else state.cart.push({id:p.id,name:p.name,price:p.price,qty:1});
        renderCart(cartItemsEl, cartCountEl, cartSubtotalEl);
      }
  
      // Carrito: quitar producto
      function removeFromCart(id){
        state.cart = state.cart.filter(i=>i.id!=id);
      }
  
      // Carrito: cambiar cantidad
      function changeQty(id, d){
        const it = state.cart.find(i=>i.id==id);
        if(!it) return;
        it.qty += d;
        if(it.qty<=0) removeFromCart(id);
      }
  
      // Mostrar carrito y subtotal
      function renderCart(container, countEl, subtotalEl){
        container.innerHTML = '';
        let subtotal = 0;
  
        state.cart.forEach(it=>{
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
  
        // Actualizamos número de productos y total
        countEl.textContent = state.cart.reduce((a,b)=>a+b.qty,0);
        subtotalEl.textContent = money(subtotal);
      }
  
      // Funciones pequeñas de ayuda
      const cap = s => s.charAt(0).toUpperCase()+s.slice(1); // poner mayúscula inicial
      const esc = s => String(s).replace(/[&<>"]/g, m=>({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'
      }[m])); // evitar caracteres raros
    }
  })();

  
