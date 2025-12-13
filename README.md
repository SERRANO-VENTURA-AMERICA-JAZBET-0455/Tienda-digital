Tienda Virtual Avanzada

Proyecto de **tienda virtual en JavaScript con diseño moderno, modo oscuro / claro, carrito persistente y filtrado avanzado de productos. No usa frameworks ni backend.

---

 Características principales

* 📦 Catálogo dinámico de productos
* 🔍 Búsqueda en tiempo real
* 🗂️ Filtro por categorías
* ↕️ Ordenar productos (precio y nombre)
* 🛒 Carrito de compras
* ❤️ Sistema de favoritos
* 💾 Persistencia con `localStorage`
* 🌙☀️ Modo oscuro y modo claro
* 📱 Diseño responsive

---

 Tecnologías usadas

* **HTML5**
* **CSS3** (variables CSS + glassmorphism)
* **JavaScript (ES6+)**
* **LocalStorage** para guardar datos

>  Sin frameworks
>  Sin librerías externas
>  Sin backend

---

## ⚙️ Funcionamiento general

### 📦 Catálogo

Los productos se cargan desde un archivo `catalog.js` con una estructura como:

```js
window.catalogData = {
  products: [
    {
      id: "1",
      name: "Producto",
      price: 199,
      category: "ropa",
      image: "img/producto.jpg",
      description: "Descripción del producto"
    }
  ]
};
```

---

### 🔍 Búsqueda y filtros

* El input de búsqueda filtra por nombre
* Las categorías se generan automáticamente
* El select permite ordenar por:

  * Precio ascendente / descendente
  * Nombre A–Z / Z–A

---

### 🛒 Carrito de compras

* Agregar productos desde cards o modal
* Incrementar / reducir cantidades
* Eliminar productos
* Cálculo automático del subtotal
* Persistencia con `localStorage`

---

### ❤️ Favoritos

* Marcar productos como favoritos
* Se guardan en `localStorage`
* Se reflejan visualmente en las cards

---

### 🌙☀️ Modo oscuro / claro

* Modo oscuro por defecto
* Botón para alternar tema
* Preferencia guardada en `localStorage`

```js
document.body.classList.toggle("light");
```

---

### 🪟 Modal de detalles

* Vista detallada del producto
* Imagen, descripción y precio
* Botón para agregar al carrito

---

## 🚀 Cómo usar el proyecto

1. Descarga o clona el repositorio
2. Abre `index.html` en tu navegador
3. ¡Listo! No requiere servidor

---

## 🧩 Buenas prácticas aplicadas

* Código modular
* Estado centralizado (`state`)
* Funciones reutilizables
* Escape de HTML (seguridad básica)
* Manejo de errores con `try/catch`

---

## 📌 Próximas mejoras (ideas)

* 🔐 Login de usuario
* 💳 Integración de pagos reales
* 🧾 Historial de compras
* 🧑‍💻 Panel de administración
* 🌐 Backend con API

---

HECHO POR SERRANO VENTURA AMERICCA JAZBET

Proyecto desarrollado como práctica de **JavaScript y desarrollo web**.

> Hecho con 💙 y mucho aprendizaje.

---

✨ ¡Gracias por revisar este proyecto!
