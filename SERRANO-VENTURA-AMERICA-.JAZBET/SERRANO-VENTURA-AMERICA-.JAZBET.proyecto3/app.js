 /* =====================================================
   Tienda Avanzada - sin servidor
   Este archivo hace que la tienda funcione:
   - Muestra los productos que están guardados en otro archivo.
   - Permite buscar y filtrar productos por categoría.
   - Tiene un carrito que recuerda lo que agregaste,
     incluso si cierras la página y vuelves.
   - Puedes sumar, restar, quitar productos y ver el total.
   - Muestra avisos rápidos cuando agregas algo.
   ===================================================== */
(function(){
  'use strict';

  // Cuando la página ya está lista, se arranca todo
  document.addEventListener('DOMContentLoaded', init);

  // ==== Atajos para escribir menos ====
  // $ busca un solo elemento en la página
  function $(s,root){ return (root||document).querySelector(s); }
  // $all busca varios elementos a la vez
  function $all(s,root){ return (root||document).querySelectorAll(s); }
  // money convierte números en dinero con formato mexicano
  const money = (n)=> Number(n||0).toLocaleString('es-MX',{style:'currency',currency:'MXN'});

  // Aquí guardamos el "estado" de la tienda, como una libreta
  let state = {
    catalog: [],   // todos los productos disponibles
    filtered: [],  // los productos que se muestran según búsqueda/filtro
    cart: [],      // lo que el cliente ha agregado al carrito
    category: 'all', // categoría seleccionada
    search: ''       // texto que el cliente escribió para buscar
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
    const notifyEl       = $('#notify'); // cajita de mensajes rápidos

    if(!productsEl || !categoryNav || !cartPanel) return;

    // --- 1) Cargar catálogo ---
    // Aquí intentamos leer la lista de productos desde catalog.js
    try{
      state.catalog = Array.isArray(window.catalogData?.products)
        ? window.catalogData.products : [];
    }catch{
      productsEl.innerHTML = '<p>No se pudo cargar el catálogo.</p>';
      return;
    }

    // --- 2) Recuperar carrito guardado ---
    // Si el cliente ya había agregado cosas antes, las recordamos
    try{
      const saved = localStorage.getItem('cart');
      if(saved) state.cart = JSON.parse(saved);
    }catch{ /* si falla, no pasa nada */ }

    // --- 3) Mostrar todo al inicio ---
    buildCategories(categoryNav, state.catalog);
    state.filtered = state.catalog.slice();
    renderProducts(productsEl, state.filtered);
    renderCart(cartItemsEl, cartCountEl, cartSubtotalEl);

    // --- 4) Búsqueda ---
    // Cada vez que el cliente escribe algo, filtramos los productos
    if(searchEl){
      searchEl.addEventListener('input', ()=>{
        state.search = (searchEl.value||'').trim().toLowerCase();
        applyFilters(productsEl);
      });
    }

    // --- 5) Categorías ---
    // Cuando el cliente hace clic en una categoría, mostramos solo esos productos
    categoryNav.addEventListener('click', (e)=>{
      const btn = e.target.closest('.nav-btn');
      if(!btn) return;
      state.category = btn.dataset.filter || 'all';
      $all('.nav-btn', categoryNav).forEach(el=>el.classList.remove('active'));
      btn.classList.add('active');
      applyFilters(productsEl);
    });

    // --- 6) Agregar al carrito ---
    // Si el cliente da clic en "Agregar", metemos ese producto al carrito
    productsEl.addEventListener('click', (e)=>{
      const btn = e.target.closest('.add-btn');
      if(!btn) return;
      const card = btn.closest('.card');
      const id   = card.dataset.id;
      const found = state.catalog.find(p=>p.id===id);
      if(found){ addToCart(found); openCart(); showNotify(`Agregado: ${found.name}`); }
    });

    // --- 7) Panel carrito ---
    // Abrir y cerrar el carrito como una ventana lateral
    function openCart(){ cartPanel.classList.add('open'); }
    function closeCart(){ cartPanel.classList.remove('open'); }
    cartToggleBtn?.addEventListener('click', ()=> cartPanel.classList.toggle('open'));
    closeCartBtn?.addEventListener('click', closeCart);

    // --- 8) Controles dentro del carrito ---
    // Aquí se manejan los botones de +, -, y quitar
    cartItemsEl.addEventListener('click', (e)=>{
      const btn = e.target.closest('button'); if(!btn) return;
      const {id, action} = btn.dataset;
      if(action==='inc') changeQty(id,+1);
      else if(action==='dec') changeQty(id,-1);
      else if(action==='remove') removeFromCart(id);
      renderCart(cartItemsEl, cartCountEl, cartSubtotalEl);
    });

    // --- 9) Pagar ---
    // Cuando el cliente da clic en pagar, mostramos el total y vaciamos el carrito
    checkoutBtn?.addEventListener('click', ()=>{
      if(!state.cart.length){ alert('Tu carrito está vacío.'); return; }
      const total = state.cart.reduce((s,it)=>s+it.price*it.qty,0);
      alert('Gracias por tu compra!\nTotal: ' + money(total));
      state.cart = [];
      saveCart();
      renderCart(cartItemsEl, cartCountEl, cartSubtotalEl);
      closeCart();
    });

    // ====== Funciones ======

    // Crear los botones de categorías
    function buildCategories(container, catalog){
      const cats = Array.from(new Set(catalog.map(p=>p.category))).sort();
      container.innerHTML='';
      const allBtn = document.createElement('button');
      allBtn.className='nav-btn active'; allBtn.dataset.filter='all'; allBtn.textContent='Todo';
      container.appendChild(allBtn);
      cats.forEach(cat=>{
        const b=document.createElement('button');
        b.className='nav-btn'; b.dataset.filter=cat; b.textContent=capitalize(cat);
        container.appendChild(b);
      });
    }

    // Mostrar los productos en la página
    function renderProducts(container, list){
      container.innerHTML='';
      list.forEach(p=>{
        const card=document.createElement('article');
        card.className='card'; card.dataset.id=p.id;
        card.innerHTML=`
          <img src="${p.image}" alt="${escapeHtml(p.name)}">
          <div class="card-body">
            <h3>${escapeHtml(p.name)}</h3>
            <p class="price">${money(p.price)}</p>
            <button class="add-btn">Agregar</button>
          </div>`;
        container.appendChild(card);
      });
      if(!list.length) container.innerHTML='<p>No hay productos para mostrar.</p>';
    }

    // Aplicar filtros de categoría y búsqueda
    function applyFilters(container){
      const byCat = state.category==='all' ? state.catalog : state.catalog.filter(p=>p.category===state.category);
      const byText = state.search ? byCat.filter(p=>(p.name||'').toLowerCase().includes(state.search)) : byCat;
      state.filtered = byText;
      renderProducts(container, state.filtered);
    }

    // Agregar producto al carrito
    function addToCart(prod){
      const f = state.cart.find(i=>i.id===prod.id);
      if(f) f.qty += 1; else state.cart.push({id:prod.id,name:prod.name,price:prod.price,qty:1});
      saveCart();
      renderCart(cartItemsEl, cartCountEl, cartSubtotalEl);
    }

    // Quitar producto del carrito
    function removeFromCart(id){ state.cart = state.cart.filter(i=>i.id!=id); saveCart(); }

    // Cambiar cantidad de un producto
    function changeQty(id,delta){ 
      const it=state.cart.find(i=>i.id==id); 
      if(!it) return; 
      it.qty+=delta; 
      if(it.qty<=0) removeFromCart(id); 
      saveCart(); 
    }

         // Mostrar el carrito en pantalla
    function renderCart(container,countEl,subtotalEl){
      container.innerHTML='';
      let subtotal=0;

      // Recorremos cada producto que está en el carrito
      state.cart.forEach(it=>{
        subtotal+=it.price*it.qty; // sumamos el precio por la cantidad

        // Creamos la fila que se verá en el carrito
        const row=document.createElement('div');
        row.className='cart-item';
        row.innerHTML=`
          <div>
            <p class="item-title">${escapeHtml(it.name)}</p>
            <small>${money(it.price)} c/u</small>
          </div>
          <div class="item-controls">
            <button class="qty-btn" data-action="dec" data-id="${it.id}">−</button>
            <span class="qty">${it.qty}</span>
            <button class="qty-btn" data-action="inc" data-id="${it.id}">+</button>
            <button class="remove-btn" data-action="remove" data-id="${it.id}">Quitar</button>
          </div>`;
        container.appendChild(row);
      });

      // Actualizamos el número de productos y el total
      countEl.textContent=String(state.cart.reduce((a,b)=>a+b.qty,0));
      subtotalEl.textContent=money(subtotal);
    }

    // Guardar carrito en la memoria del navegador
    // (esto hace que aunque cierres la página, al volver siga tu carrito)
    function saveCart(){ 
      try{ localStorage.setItem('cart', JSON.stringify(state.cart)); }
      catch{} 
    }

    // Mostrar un aviso rápido (ejemplo: "Agregado: Producto X")
    function showNotify(msg){
      if(!notifyEl) return;
      notifyEl.textContent=msg;
      notifyEl.classList.add('show');
      setTimeout(()=>notifyEl.classList.remove('show'),2000);
    }

    // Poner la primera letra en mayúscula
    function capitalize(s){ 
      return (s||'').charAt(0).toUpperCase()+(s||'').slice(1); 
    }

    // Evitar que se metan caracteres raros en los textos
    function escapeHtml(str){ 
      return String(str||'')
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#39;'); 
    }
  }
})();