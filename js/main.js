/**
 * UI + carrito + WhatsApp — Artesanías Saravia
 * Mejorado con patrones de Mundo Bebé SF:
 * - resolveImage + placeholders
 * - carrito con snapshot del producto
 * - filtros + búsqueda + paginación
 * - featured / hero
 * - mensajes de pedido más ricos
 */
(function () {
  const CART_KEY = "artesanias_saravia_cart_v2";
  let activeCategory = "all";
  let searchQuery = "";
  let visibleCount = 12;
  const PAGE_SIZE = 12;
  let CFG = {};

  function isInPages() {
    return typeof location !== "undefined" && location.pathname.includes("/pages/");
  }

  function basePath() {
    return isInPages() ? "../" : "./";
  }

  function productUrl(id) {
    return basePath() + "pages/producto.html?id=" + encodeURIComponent(id);
  }

  function catalogUrl() {
    return basePath() + "pages/catalogo.html";
  }

  function paintConfig() {
    CFG = Store.getConfig();
    const set = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    set("brand-name", CFG.businessName);
    set("footer-brand", CFG.businessName);
    set("topbar-hours", CFG.hours);
    set("contact-address", CFG.address);
    set("contact-hours", CFG.hours);
    set("contact-email", CFG.email);
    set("footer-email", CFG.email);
    set("footer-address", CFG.address);
    set("year", new Date().getFullYear());

    const ig = document.getElementById("contact-ig");
    if (ig && CFG.instagram) ig.href = CFG.instagram;
    const fb = document.getElementById("contact-fb");
    if (fb) fb.href = CFG.facebook || "#";

    if (!document.body.dataset.keepTitle) {
      document.title = CFG.businessName + " — Fibras naturales tejidas a mano";
    }
  }

  function money(n) {
    if (n === 0 || n == null) return "Consultar";
    return (CFG.currency || "$") + Number(n).toLocaleString("es-AR");
  }

  function resolveImage(src, product) {
    if (src && typeof src === "string" && src.trim()) {
      if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
        return src;
      }
      let clean = String(src).replace(/^(\.\/|\/)+/, "");
      while (clean.startsWith("../")) clean = clean.slice(3);
      return basePath() + clean;
    }
    if (product) {
      return Store.placeholderImage(product.category, product.name);
    }
    return Store.placeholderImage("decoracion", "Foto próximamente");
  }

  // ——— Carrito ———
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
    window.dispatchEvent(new Event("cart-updated"));
  }

  function addToCart(productId) {
    const product = Store.getProduct(productId);
    if (!product) return;
    if (product.stock <= 0 && product.price > 0) {
      showToast("Sin stock disponible");
      return;
    }
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
      // Snapshot para que el carrito no se rompa si cambia el catálogo
      const rawImg = product.image || (product.images && product.images[0]) || "";
      cart.push({
        id: productId,
        qty: 1,
        name: product.name,
        price: product.price,
        image: String(rawImg || "").replace(/^(\.\/|\/)+/, "").replace(/^(\.\.\/)+/, ""),
        category: product.category,
      });
    }
    setCart(cart);
    showToast(`Agregado: ${product.name}`);
  }

  function changeQty(productId, delta) {
    const cart = getCart();
    const line = cart.find((i) => i.id === productId);
    if (!line) return;
    const product = Store.getProduct(productId);
    line.qty += delta;
    if (line.qty <= 0) {
      setCart(cart.filter((i) => i.id !== productId));
      return;
    }
    if (product && product.price > 0 && line.qty > product.stock) {
      line.qty = product.stock;
      showToast("Stock máximo alcanzado");
    }
    setCart(cart);
  }

  function removeFromCart(productId) {
    setCart(getCart().filter((i) => i.id !== productId));
  }

  function cartTotal(cart) {
    // Si todos son "consultar", no mostramos número
    const hasPriced = cart.some((line) => {
      const p = Store.getProduct(line.id);
      const price = line.price != null ? line.price : p ? p.price : 0;
      return price > 0;
    });
    if (!hasPriced) return null;
    return cart.reduce((sum, line) => {
      const p = Store.getProduct(line.id);
      const price = line.price != null ? line.price : p ? p.price : 0;
      return sum + price * line.qty;
    }, 0);
  }

  // ——— Render ———
  function renderCategories() {
    const wrap = document.getElementById("cat-scroll");
    if (!wrap) return;
    const cats = Store.getCategories();
    const allBtn = `<button type="button" class="cat-chip ${activeCategory === "all" ? "active" : ""}" data-cat="all">Todos</button>`;
    const chips = cats
      .map((c) => {
        const icon = Store.getCategoryIcon(c.id);
        return `<button type="button" class="cat-chip ${activeCategory === c.id ? "active" : ""}" data-cat="${c.id}">${icon} ${c.name}</button>`;
      })
      .join("");
    wrap.innerHTML = allBtn + chips;
    wrap.querySelectorAll("[data-cat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeCategory = btn.dataset.cat;
        visibleCount = PAGE_SIZE;
        renderCategories();
        renderProducts();
      });
    });
  }

  function filteredProducts() {
    let products = Store.getProducts();
    if (activeCategory !== "all") {
      products = products.filter((p) => p.category === activeCategory);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          Store.getCategoryName(p.category).toLowerCase().includes(q)
      );
    }
    return products;
  }

  function renderProducts() {
    const grid = document.getElementById("product-grid");
    if (!grid) return;

    const products = filteredProducts();
    const countEl = document.getElementById("product-count");
    if (countEl) {
      countEl.textContent =
        products.length + " producto" + (products.length === 1 ? "" : "s");
    }

    if (products.length === 0) {
      grid.innerHTML =
        '<p style="grid-column:1/-1;text-align:center;color:var(--ink-soft);padding:40px 0">No hay productos con ese filtro.</p>';
      return;
    }

    const slice = products.slice(0, visibleCount);
    grid.innerHTML = slice
      .map((p) => {
        const img = resolveImage(p.image || (p.images && p.images[0]), p);
        const out = p.stock <= 0 && p.price > 0;
        let badgeText = "Disponible";
        let badgeClass = "badge-stock";
        if (out) {
          badgeText = "Sin stock";
          badgeClass = "badge-stock badge-out";
        } else if (p.price === 0) {
          badgeText = p.featured ? "Destacado" : "A medida";
        } else if (p.featured) {
          badgeText = "Destacado";
        }
        const safeName = escapeHtml(p.name);
        const href = productUrl(p.id);
        return `
      <article class="card reveal in" data-id="${p.id}">
        <a class="card-link" href="${href}">
          <div class="card-media">
            <img src="${img}" alt="${safeName}" loading="lazy"
                 onerror="this.onerror=null;this.src='${Store.placeholderImage(p.category, p.name)}'">
            <span class="${badgeClass}">${badgeText}</span>
          </div>
          <div class="card-body">
            <span class="card-cat">${Store.getCategoryIcon(p.category)} ${Store.getCategoryName(p.category)}</span>
            <h3 class="card-title">${safeName}</h3>
            <p class="card-desc">${escapeHtml(p.description || "")}</p>
            <div class="card-footer">
              <span class="card-price">${money(p.price)}</span>
              <button class="add-btn" data-add="${p.id}" ${out ? "disabled" : ""} aria-label="${p.price === 0 ? "Consultar" : "Agregar al carrito"}">+</button>
            </div>
          </div>
        </a>
      </article>`;
      })
      .join("");

    if (products.length > visibleCount) {
      grid.innerHTML += `<div class="load-more-wrap" style="grid-column:1/-1;text-align:center;margin-top:12px">
        <button class="btn btn-secondary" id="load-more-btn">Ver más (${products.length - visibleCount} restantes)</button>
      </div>`;
      document.getElementById("load-more-btn")?.addEventListener("click", () => {
        visibleCount += PAGE_SIZE;
        renderProducts();
      });
    }

    grid.querySelectorAll("[data-add]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(btn.dataset.add);
      });
    });
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderCartBadge() {
    const cart = getCart();
    const count = cart.reduce((s, l) => s + l.qty, 0);
    ["cart-badge", "cart-badge-2"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = count;
      el.classList.toggle("show", count > 0);
    });
  }

  function renderDrawer() {
    const wrap = document.getElementById("drawer-items");
    const totalEl = document.getElementById("drawer-total");
    if (!wrap) return;
    const cart = getCart();

    if (!cart.length) {
      wrap.innerHTML = `<div class="drawer-empty"><span class="emoji">🌿</span>Tu carrito está vacío.<br>¡Agregá piezas del catálogo!</div>`;
      if (totalEl) totalEl.textContent = "—";
      return;
    }

    wrap.innerHTML = cart
      .map((line) => {
        const p = Store.getProduct(line.id);
        const name = line.name || (p && p.name) || "Producto";
        const price = line.price != null ? line.price : p ? p.price : 0;
        const img = resolveImage(
          line.image || (p && p.image),
          p || { category: line.category, name }
        );
        return `
        <div class="cart-item">
          <img src="${img}" alt="${escapeHtml(name)}">
          <div class="ci-info">
            <div class="ci-title">${escapeHtml(name)}</div>
            <div class="ci-price">${money(price)} c/u</div>
            <div class="qty-control">
              <button data-dec="${line.id}" aria-label="Restar">−</button>
              <span>${line.qty}</span>
              <button data-inc="${line.id}" aria-label="Sumar">+</button>
              <button class="remove-item" data-remove="${line.id}">Quitar</button>
            </div>
          </div>
        </div>`;
      })
      .join("");

    wrap.querySelectorAll("[data-inc]").forEach((b) =>
      b.addEventListener("click", () => changeQty(b.dataset.inc, 1))
    );
    wrap.querySelectorAll("[data-dec]").forEach((b) =>
      b.addEventListener("click", () => changeQty(b.dataset.dec, -1))
    );
    wrap.querySelectorAll("[data-remove]").forEach((b) =>
      b.addEventListener("click", () => removeFromCart(b.dataset.remove))
    );

    const total = cartTotal(cart);
    if (totalEl) totalEl.textContent = total == null ? "A consultar" : money(total);
  }

  function waLink(message) {
    const num = (CFG.whatsappNumber || "").replace(/\D/g, "");
    return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
  }

  function buildOrderMessage() {
    const cart = getCart();
    const lines = cart.map((line) => {
      const p = Store.getProduct(line.id);
      const name = line.name || (p && p.name) || "Producto";
      const price = line.price != null ? line.price : p ? p.price : 0;
      const priceStr = price > 0 ? money(price) : "Consultar precio";
      return `• ${name} × ${line.qty} (${priceStr})`;
    });
    const total = cartTotal(cart);
    const totalLine = total == null ? "\nTotal: a consultar según pieza" : `\nTotal estimado: ${money(total)}`;
    return `${CFG.orderMessagePrefix || "¡Hola! Quiero este pedido:"}\n\n${lines.join("\n")}${totalLine}\n\n¿Me confirmás disponibilidad y forma de entrega?`;
  }

  function openDrawer() {
    renderCartBadge();
    renderDrawer();
    document.getElementById("cart-drawer")?.classList.add("open");
    document.getElementById("overlay")?.classList.add("open");
  }

  function closeDrawer() {
    document.getElementById("cart-drawer")?.classList.remove("open");
    document.getElementById("overlay")?.classList.remove("open");
  }

  function showToast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 2600);
  }


  function renderFeatured() {
    const grid = document.getElementById("featured-grid");
    if (!grid) return;
    const items = Store.getFeatured(6);
    if (!items.length) {
      grid.closest("section")?.style && (grid.closest("section").style.display = "none");
      return;
    }
    grid.innerHTML = items
      .map((p) => {
        const img = resolveImage(p.image || (p.images && p.images[0]), p);
        const href = productUrl(p.id);
        const safeName = escapeHtml(p.name);
        return `
      <article class="card reveal in">
        <a class="card-link" href="${href}">
          <div class="card-media">
            <img src="${img}" alt="${safeName}" loading="lazy">
            <span class="badge-stock">Destacado</span>
          </div>
          <div class="card-body">
            <span class="card-cat">${Store.getCategoryIcon(p.category)} ${Store.getCategoryName(p.category)}</span>
            <h3 class="card-title">${safeName}</h3>
            <div class="card-footer">
              <span class="card-price">${money(p.price)}</span>
              <button class="add-btn" data-add="${p.id}" aria-label="Agregar">+</button>
            </div>
          </div>
        </a>
      </article>`;
      })
      .join("");

    grid.querySelectorAll("[data-add]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(btn.dataset.add);
      });
    });
  }

  function setupReveal() {
    const els = document.querySelectorAll(".reveal:not(.in)");
    if (!els.length || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
  }

  function setupHeroCarousel() {
    const carousel = document.getElementById("hero-carousel");
    if (!carousel) return;
    const slides = [...carousel.querySelectorAll(".hero-slide")];
    if (slides.length < 2) return;

    // Enriquecer captions desde el catálogo si hay data-hero-product
    slides.forEach((slide) => {
      const pid = slide.dataset.heroProduct;
      if (!pid) return;
      const product = Store.getProduct(pid);
      if (!product) return;
      const img = slide.querySelector("img");
      if (img && product.image) {
        img.src = resolveImage(product.image, product);
        img.alt = product.name;
      }
      const cap = slide.querySelector(".hero-slide-caption strong");
      if (cap) cap.textContent = product.name;
    });

    let current = 0;
    let timer;
    function show(index) {
      current = ((index % slides.length) + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle("active", i === current));
    }
    function start() {
      clearInterval(timer);
      timer = setInterval(() => show(current + 1), 5200);
    }
    start();
    carousel.addEventListener("mouseenter", () => clearInterval(timer));
    carousel.addEventListener("mouseleave", start);
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

    paintConfig();
    renderCategories();
    renderProducts();
    renderFeatured();
    setupHeroCarousel();

    // CTA a catálogo multi-página
    document.querySelectorAll("[data-catalog-link]").forEach((a) => {
      a.setAttribute("href", catalogUrl());
    });
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
      window.open(
        waLink(
          (CFG.contactMessagePrefix || "¡Hola!") +
            " Quiero más información sobre tus trabajos en mimbre y fibras naturales."
        ),
        "_blank"
      );
    });

    document.getElementById("checkout-btn")?.addEventListener("click", () => {
      const cart = getCart();
      if (!cart.length) {
        showToast("Tu carrito está vacío");
        return;
      }
      window.open(waLink(buildOrderMessage()), "_blank");
    });

    document.getElementById("contact-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("cf-name")?.value.trim() || "";
      const msg = document.getElementById("cf-msg")?.value.trim() || "";
      const full = `${CFG.contactMessagePrefix || "¡Hola!"}\n\nNombre: ${name}\nMensaje: ${msg}`;
      window.open(waLink(full), "_blank");
    });

    const menuToggle = document.getElementById("menu-toggle");
    const navLinks = document.getElementById("nav-links");
    menuToggle?.addEventListener("click", () => navLinks?.classList.toggle("open"));
    navLinks?.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => navLinks.classList.remove("open"))
    );

    window.addEventListener("cart-updated", () => {
      renderCartBadge();
      renderDrawer();
    });
    window.addEventListener("storage", (e) => {
      if (e.key === CART_KEY) {
        renderCartBadge();
        renderDrawer();
      }
    });
  }

  function setupEntryScreen() {
    const screen = document.getElementById("entry-screen");
    const enterButton = document.getElementById("entry-enter");
    if (!screen || !enterButton) return;

    const storageKey = "artesanias_saravia_entry_seen_v1";
    try {
      if (sessionStorage.getItem(storageKey)) {
        screen.hidden = true;
        return;
      }
    } catch (error) {}

    document.body.classList.add("entry-open");
    enterButton.focus();
    enterButton.addEventListener(
      "click",
      () => {
        screen.classList.add("is-leaving");
        screen.setAttribute("aria-hidden", "true");
        try {
          sessionStorage.setItem(storageKey, "true");
        } catch (error) {}
        setTimeout(() => {
          screen.hidden = true;
          document.body.classList.remove("entry-open");
        }, 550);
      },
      { once: true }
    );
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupEntryScreen();
    init();
  });
})();
