(function () {
  const CART_KEY = "artesanias_saravia_cart_v1";
  let activeCategory = "all";
  let searchQuery = "";
  let visibleCount = 24;
  const PAGE_SIZE = 24;
  let CFG = Store.getConfig();

  const CATEGORY_ICONS = {
    materos: "🧉",
    bandoleras: "👜",
    organizadores: "📦",
    decoracion: "✨",
    mobiliario: "🪑",
    personalizados: "✏️",
  };

  function paintConfig() {
    const brand = document.getElementById("brand-name");
    if (brand) brand.textContent = CFG.businessName;
    const footerBrand = document.getElementById("footer-brand");
    if (footerBrand) footerBrand.textContent = CFG.businessName;
    const topbar = document.getElementById("topbar-hours");
    if (topbar) topbar.textContent = CFG.hours;
    const addr = document.getElementById("contact-address");
    if (addr) addr.textContent = CFG.address;
    const hours = document.getElementById("contact-hours");
    if (hours) hours.textContent = CFG.hours;
    const email = document.getElementById("contact-email");
    if (email) email.textContent = CFG.email;
    const ig = document.getElementById("contact-ig");
    if (ig) ig.href = CFG.instagram;
    const fb = document.getElementById("contact-fb");
    if (fb) fb.href = CFG.facebook || "#";
    const footerEmail = document.getElementById("footer-email");
    if (footerEmail) footerEmail.textContent = CFG.email;
    const footerAddr = document.getElementById("footer-address");
    if (footerAddr) footerAddr.textContent = CFG.address;
    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
    document.title = CFG.businessName + " — Fibras naturales tejidas a mano";
  }

  function money(n) {
    if (n === 0) return "Consultar";
    return CFG.currency + Number(n).toLocaleString("es-AR");
  }

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
      return [];
    }
  }
  function setCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCartBadge();
    renderDrawer();
  }
  function addToCart(productId) {
    const product = Store.getProduct(productId);
    if (!product) return;
    if (product.stock <= 0 && product.price > 0) return;
    const cart = getCart();
    const line = cart.find((i) => i.id === productId);
    const currentQty = line ? line.qty : 0;
    if (product.price > 0 && currentQty >= product.stock) {
      showToast("No hay más stock disponible de este producto");
      return;
    }
    if (line) {
      line.qty += 1;
    } else {
      cart.push({ id: productId, qty: 1 });
    }
    setCart(cart);
    showToast(`Agregado: ${product.name}`);
  }
  function changeQty(productId, delta) {
    const product = Store.getProduct(productId);
    const cart = getCart();
    const line = cart.find((i) => i.id === productId);
    if (!line) return;
    line.qty += delta;
    if (line.qty <= 0) {
      setCart(cart.filter((i) => i.id !== productId));
    } else if (product && product.price > 0 && line.qty > product.stock) {
      showToast("No hay más stock disponible");
    } else {
      setCart(cart);
    }
  }
  function removeFromCart(productId) {
    setCart(getCart().filter((i) => i.id !== productId));
  }
  function cartTotal(cart) {
    return cart.reduce((sum, line) => {
      const p = Store.getProduct(line.id);
      return sum + (p && p.price ? p.price * line.qty : 0);
    }, 0);
  }

  function placeholderImage(cat, name) {
    // SVG placeholder con tonos naturales de mimbre
    const colors = {
      canastos: "#C4A574",
      cestos: "#D4B896",
      decoracion: "#B8956A",
    organizadores: "📦",
      mobiliario: "#A67C52",
      personalizados: "#8B7355",
    };
    const bg = colors[cat] || "#C4A574";
    const label = (name || "Mimbre").slice(0, 18);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect fill="${bg}" width="400" height="400"/>
      <rect fill="rgba(255,255,255,0.15)" x="40" y="40" width="320" height="320" rx="8"/>
      <text x="200" y="195" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="Georgia,serif" font-size="22">${label}</text>
      <text x="200" y="230" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="sans-serif" font-size="14">Artesanías Saravia</text>
    </svg>`;
    return "data:image/svg+xml," + encodeURIComponent(svg);
  }

  function renderCategories() {
    const wrap = document.getElementById("cat-scroll");
    if (!wrap) return;
    const cats = Store.getCategories();
    wrap.innerHTML =
      `<button class="cat-chip active" data-cat="all">Todos</button>` +
      cats
        .map(
          (c) =>
            `<button class="cat-chip" data-cat="${c.id}"><span class="emoji">${CATEGORY_ICONS[c.id] || "🌿"}</span>${c.name}</button>`
        )
        .join("");

    wrap.querySelectorAll(".cat-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeCategory = btn.dataset.cat;
        visibleCount = PAGE_SIZE;
        wrap.querySelectorAll(".cat-chip").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderProducts();
      });
    });
  }

  function filteredProducts() {
    let products = Store.getProducts();
    if (activeCategory !== "all") products = products.filter((p) => p.category === activeCategory);
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      products = products.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)
      );
    }
    return products;
  }

  function renderProducts() {
    const grid = document.getElementById("product-grid");
    if (!grid) return;
    const products = filteredProducts();
    const countEl = document.getElementById("product-count");
    if (countEl) countEl.textContent = products.length + " producto" + (products.length === 1 ? "" : "s");

    if (products.length === 0) {
      grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--ink-soft)">No hay productos con ese filtro.</p>`;
      return;
    }

    const slice = products.slice(0, visibleCount);
    grid.innerHTML = slice
      .map((p) => {
        const img = p.image || placeholderImage(p.category, p.name);
        const out = p.stock <= 0 && p.price > 0;
        const safeName = (p.name || "").replace(/"/g, "&quot;");
        return `
      <article class="card reveal in">
        <div class="card-media">
          <img src="${img}" alt="${safeName}" loading="lazy">
          <span class="badge-stock ${out ? "badge-out" : ""}">${out ? "Sin stock" : p.price === 0 ? "A medida" : "Disponible"}</span>
        </div>
        <div class="card-body">
          <span class="card-cat">${Store.getCategoryName(p.category)}</span>
          <h3 class="card-title">${p.name}</h3>
          <p class="card-desc">${p.description || ""}</p>
          <div class="card-footer">
            <span class="card-price">${money(p.price)}</span>
            <button class="add-btn" data-add="${p.id}" ${out ? "disabled" : ""} aria-label="Agregar al carrito">+</button>
          </div>
        </div>
      </article>`;
      })
      .join("");

    if (products.length > visibleCount) {
      grid.innerHTML += `<div class="load-more-wrap" style="grid-column:1/-1;text-align:center;margin-top:12px"><button class="btn btn-secondary" id="load-more-btn">Ver más (${products.length - visibleCount} restantes)</button></div>`;
      document.getElementById("load-more-btn").addEventListener("click", () => {
        visibleCount += PAGE_SIZE;
        renderProducts();
      });
    }

    grid.querySelectorAll("[data-add]").forEach((btn) => {
      btn.addEventListener("click", () => addToCart(btn.dataset.add));
    });
  }

  function renderCartBadge() {
    const cart = getCart();
    const count = cart.reduce((s, l) => s + l.qty, 0);
    [document.getElementById("cart-badge"), document.getElementById("cart-badge-2")].forEach((el) => {
      if (!el) return;
      el.textContent = count;
      el.classList.toggle("show", count > 0);
    });
  }

  function renderDrawer() {
    const cart = getCart();
    const wrap = document.getElementById("drawer-items");
    if (!wrap) return;
    if (cart.length === 0) {
      wrap.innerHTML = `<div class="drawer-empty"><span class="emoji">🌿</span>Tu carrito está vacío.<br>¡Agregá piezas del catálogo!</div>`;
    } else {
      wrap.innerHTML = cart
        .map((line) => {
          const p = Store.getProduct(line.id);
          if (!p) return "";
          const img = p.image || placeholderImage(p.category, p.name);
          return `
        <div class="cart-item">
          <img src="${img}" alt="${p.name}">
          <div class="ci-info">
            <div class="ci-title">${p.name}</div>
            <div class="ci-price">${money(p.price)} c/u</div>
            <div class="qty-control">
              <button data-dec="${p.id}" aria-label="Restar">−</button>
              <span>${line.qty}</span>
              <button data-inc="${p.id}" aria-label="Sumar">+</button>
              <button class="remove-item" data-remove="${p.id}">Quitar</button>
            </div>
          </div>
        </div>`;
        })
        .join("");

      wrap.querySelectorAll("[data-inc]").forEach((b) => b.addEventListener("click", () => changeQty(b.dataset.inc, 1)));
      wrap.querySelectorAll("[data-dec]").forEach((b) => b.addEventListener("click", () => changeQty(b.dataset.dec, -1)));
      wrap.querySelectorAll("[data-remove]").forEach((b) => b.addEventListener("click", () => removeFromCart(b.dataset.remove)));
    }
    const totalEl = document.getElementById("drawer-total");
    if (totalEl) totalEl.textContent = money(cartTotal(cart));
  }

  function waLink(message) {
    return `https://wa.me/${CFG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  }

  function buildOrderMessage() {
    const cart = getCart();
    const lines = cart.map((line) => {
      const p = Store.getProduct(line.id);
      const priceStr = p.price === 0 ? "Consultar precio" : money(p.price * line.qty);
      return `• ${line.qty} x ${p.name} — ${priceStr}`;
    });
    const total = cartTotal(cart);
    const totalStr = total > 0 ? money(total) : "A consultar";
    return [CFG.orderMessagePrefix, "", ...lines, "", `Total estimado: ${totalStr}`, "", "¿Me confirmás disponibilidad y forma de entrega?"].join("\n");
  }

  function openDrawer() {
    document.getElementById("cart-drawer")?.classList.add("open");
    document.getElementById("overlay")?.classList.add("open");
  }
  function closeDrawer() {
    document.getElementById("cart-drawer")?.classList.remove("open");
    document.getElementById("overlay")?.classList.remove("open");
  }

  let toastTimer;
  function showToast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
  }

  function setupReveal() {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => obs.observe(el));
  }

  function setupHeroCarousel() {
    const carousel = document.getElementById("hero-carousel");
    if (!carousel) return;
    const slides = [...carousel.querySelectorAll(".hero-slide")];
    let current = 0;
    let timer;

    slides.forEach((slide) => {
      const product = Store.getProduct(slide.dataset.heroProduct);
      if (!product) return;
      const image = slide.querySelector("img");
      const title = slide.querySelector("strong");
      if (image) {
        image.src = product.image || placeholderImage(product.category, product.name);
        image.alt = product.name;
      }
      if (title) title.textContent = product.name;
    });

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle("active", i === current));
    }
    timer = setInterval(() => show(current + 1), 5200);
  }

  async function init() {
    const loading = document.getElementById("catalog-loading");
    const grid = document.getElementById("product-grid");
    try {
      await Store.init();
    } finally {
      if (loading) loading.style.display = "none";
      if (grid) grid.style.display = "";
    }
    CFG = Store.getConfig();
    paintConfig();
    renderCategories();
    renderProducts();
    setupHeroCarousel();
    renderCartBadge();
    renderDrawer();
    setupReveal();

    const searchInput = document.getElementById("product-search");
    if (searchInput) {
      let t;
      searchInput.addEventListener("input", () => {
        clearTimeout(t);
        t = setTimeout(() => {
          searchQuery = searchInput.value;
          visibleCount = PAGE_SIZE;
          renderProducts();
        }, 200);
      });
    }

    document.getElementById("cart-open-btn")?.addEventListener("click", openDrawer);
    document.getElementById("fab-cart")?.addEventListener("click", openDrawer);
    document.getElementById("drawer-close")?.addEventListener("click", closeDrawer);
    document.getElementById("overlay")?.addEventListener("click", closeDrawer);

    document.getElementById("fab-whatsapp")?.addEventListener("click", () => {
      window.open(waLink(CFG.contactMessagePrefix + " Quiero más información sobre tus trabajos en mimbre."), "_blank");
    });

    document.getElementById("checkout-btn")?.addEventListener("click", () => {
      const cart = getCart();
      if (cart.length === 0) {
        showToast("Tu carrito está vacío");
        return;
      }
      window.open(waLink(buildOrderMessage()), "_blank");
    });

    document.getElementById("contact-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("cf-name").value.trim();
      const msg = document.getElementById("cf-msg").value.trim();
      const full = `${CFG.contactMessagePrefix}\n\nNombre: ${name}\nMensaje: ${msg}`;
      window.open(waLink(full), "_blank");
    });

    const menuToggle = document.getElementById("menu-toggle");
    const navLinks = document.getElementById("nav-links");
    menuToggle?.addEventListener("click", () => navLinks?.classList.toggle("open"));
    navLinks?.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => navLinks.classList.remove("open")));
  }

  document.addEventListener("DOMContentLoaded", init);
})();
