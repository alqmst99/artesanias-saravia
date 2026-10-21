/**
 * Ficha de producto — Artesanías Saravia
 * Galería multi-foto, agregar al carrito, pedido directo WhatsApp, relacionados.
 */
(function () {
  if (!document.getElementById("pdp-root")) return;

  const CART_KEY = "artesanias_saravia_cart_v2";
  const params = new URLSearchParams(location.search);
  const productId = params.get("id");
  let qty = 1;
  let currentImg = 0;
  let product = null;

  function getImageBase() {
    const path = location.pathname;
    if (
      path === "/" ||
      path.endsWith("/") ||
      path.endsWith("/index.html") ||
      path.endsWith("index.html")
    ) {
      return "./";
    }
    return "../";
  }

  function resolveImage(src) {
    if (!src) return "";
    if (
      src.startsWith("http://") ||
      src.startsWith("https://") ||
      src.startsWith("data:")
    ) {
      return src;
    }
    let clean = String(src).replace(/^(\.\/|\/)+/, "");
    while (clean.startsWith("../")) clean = clean.slice(3);
    return getImageBase() + clean;
  }

  function money(n) {
    const CFG = Store.getConfig();
    if (n === 0 || n == null) return "Consultar";
    return (CFG.currency || "$") + Number(n).toLocaleString("es-AR");
  }

  function waLink(message) {
    const CFG = Store.getConfig();
    const num = (CFG.whatsappNumber || "").replace(/\D/g, "");
    return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
  }

  function showToast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 2400);
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
    const count = cart.reduce((s, l) => s + l.qty, 0);
    document.querySelectorAll(".cart-badge").forEach((el) => {
      el.textContent = count;
      el.classList.toggle("show", count > 0);
    });
    window.dispatchEvent(new Event("cart-updated"));
  }

  function addToCart() {
    if (!product) return;
    if (product.stock <= 0 && product.price > 0) {
      showToast("Sin stock disponible");
      return;
    }
    const cart = getCart();
    const line = cart.find((i) => i.id === product.id);
    const currentQty = line ? line.qty : 0;
    if (product.price > 0 && currentQty + qty > product.stock) {
      showToast("No hay más stock disponible");
      return;
    }
    if (line) {
      line.qty += qty;
    } else {
      const rawImg = product.image || (product.images && product.images[0]) || "";
      cart.push({
        id: product.id,
        qty,
        name: product.name,
        price: product.price,
        image: String(rawImg || "").replace(/^(\.\/|\/)+/, "").replace(/^(\.\.\/)+/, ""),
        category: product.category,
      });
    }
    setCart(cart);
    renderDrawerLite();
    showToast(`Agregado: ${product.name}${qty > 1 ? " ×" + qty : ""}`);
  }

  function orderWhatsApp() {
    if (!product) return;
    const CFG = Store.getConfig();
    const priceStr =
      product.price > 0 ? money(product.price) + " c/u" : "Consultar precio";
    const lines = [
      CFG.orderMessagePrefix || "¡Hola! Quiero este pedido:",
      "",
      `• ${product.name} × ${qty} (${priceStr})`,
      "",
      product.price > 0
        ? `Total estimado: ${money(product.price * qty)}`
        : "Total: a consultar",
      "",
      "¿Me confirmás disponibilidad y forma de entrega?",
    ];
    window.open(waLink(lines.join("\n")), "_blank");
  }

  function galleryImages(p) {
    const list = [...new Set([...(p.images || []), p.image].filter(Boolean))].map(
      resolveImage
    );
    if (!list.length) {
      list.push(resolveImage(Store.placeholderImage(p.category, p.name)));
    }
    return list;
  }

  function renderGallery(p) {
    const imgs = galleryImages(p);
    currentImg = Math.min(currentImg, imgs.length - 1);
    const main = imgs[currentImg];
    return `
    <div class="pdp-gallery">
      <div class="pdp-main-img">
        <img id="pdp-main-photo" src="${main}" alt="${escapeHtml(p.name)}">
        ${
          imgs.length > 1
            ? `
        <button type="button" class="pdp-gallery-nav prev" data-gallery-step="-1" aria-label="Foto anterior">‹</button>
        <button type="button" class="pdp-gallery-nav next" data-gallery-step="1" aria-label="Foto siguiente">›</button>
        <span class="pdp-gallery-count" id="pdp-gallery-count">${currentImg + 1} / ${imgs.length}</span>`
            : ""
        }
      </div>
      ${
        imgs.length > 1
          ? `
      <div class="pdp-thumbs">
        ${imgs
          .map(
            (src, i) => `
          <button type="button" class="pdp-thumb ${i === currentImg ? "active" : ""}" data-thumb="${i}" aria-label="Foto ${i + 1}">
            <img src="${src}" alt="">
          </button>`
          )
          .join("")}
      </div>`
          : ""
      }
    </div>`;
  }

  function renderInfo(p) {
    const out = p.stock <= 0 && p.price > 0;
    return `
    <div class="pdp-info">
      <div class="pdp-cat">${Store.getCategoryIcon(p.category)} ${Store.getCategoryName(p.category)}</div>
      <h1>${escapeHtml(p.name)}</h1>
      <div class="pdp-price-row">
        <span class="pdp-price">${money(p.price)}</span>
      </div>
      <div class="pdp-stock ${out ? "out" : ""}">${
        out
          ? "Sin stock"
          : p.price === 0
            ? "Precio a consultar · Trabajo artesanal"
            : "Disponible · " + p.stock + " en stock"
      }</div>
      <p class="pdp-desc">${escapeHtml(p.description || "")}</p>

      <div class="pdp-qty" ${out ? 'style="opacity:0.5;pointer-events:none"' : ""}>
        <button type="button" id="pdp-qty-minus" aria-label="Menos">−</button>
        <span id="pdp-qty-val">${qty}</span>
        <button type="button" id="pdp-qty-plus" aria-label="Más">+</button>
      </div>

      <div class="pdp-actions">
        <button type="button" class="btn btn-primary" id="pdp-add" ${out ? "disabled" : ""}>
          ${p.price === 0 ? "Agregar para consultar" : "Agregar al carrito"}
        </button>
        <button type="button" class="btn btn-whatsapp" id="pdp-wa">
          Pedir por WhatsApp <div><svg xmlns="http://w3.org" viewBox="0 0 448 512" width="24" height="24" fill="currentColor">
    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
  </svg> </div>
        </button>
      </div>

      <dl class="pdp-meta">
        <div class="pdp-meta-row"><dt>Material</dt><dd>${escapeHtml(p.material || "Mimbre y fibras naturales")}</dd></div>
        <div class="pdp-meta-row"><dt>Categoría</dt><dd>${Store.getCategoryName(p.category)}</dd></div>
        <div class="pdp-meta-row"><dt>Elaboración</dt><dd>Tejido a mano en Santa Fe</dd></div>
        ${p.details ? `<div class="pdp-meta-row"><dt>Detalle</dt><dd>${escapeHtml(p.details)}</dd></div>` : ""}
      </dl>
    </div>`;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function bindPdpEvents(p) {
    const imgs = galleryImages(p);

    document.querySelectorAll("[data-gallery-step]").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentImg = (currentImg + Number(btn.dataset.galleryStep) + imgs.length) % imgs.length;
        updateGallery(imgs);
      });
    });
    document.querySelectorAll("[data-thumb]").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentImg = Number(btn.dataset.thumb);
        updateGallery(imgs);
      });
    });

    document.getElementById("pdp-qty-minus")?.addEventListener("click", () => {
      if (qty > 1) {
        qty--;
        document.getElementById("pdp-qty-val").textContent = qty;
      }
    });
    document.getElementById("pdp-qty-plus")?.addEventListener("click", () => {
      const max = p.price > 0 ? p.stock : 99;
      if (qty < max) {
        qty++;
        document.getElementById("pdp-qty-val").textContent = qty;
      } else {
        showToast("Stock máximo");
      }
    });

    document.getElementById("pdp-add")?.addEventListener("click", addToCart);
    document.getElementById("pdp-wa")?.addEventListener("click", orderWhatsApp);
  }

  function updateGallery(imgs) {
    const photo = document.getElementById("pdp-main-photo");
    if (photo) photo.src = imgs[currentImg];
    const count = document.getElementById("pdp-gallery-count");
    if (count) count.textContent = `${currentImg + 1} / ${imgs.length}`;
    document.querySelectorAll("[data-thumb]").forEach((btn, i) => {
      btn.classList.toggle("active", i === currentImg);
    });
  }

  function renderRelated(p) {
    const section = document.getElementById("pdp-related");
    const grid = document.getElementById("related-grid");
    if (!section || !grid) return;

    const related = Store.getProducts()
      .filter((x) => x.id !== p.id && (x.category === p.category || x.featured))
      .slice(0, 4);

    if (!related.length) {
      section.style.display = "none";
      return;
    }

    const base = getImageBase();
    grid.innerHTML = related
      .map((r) => {
        const img = resolveImage(r.image || (r.images && r.images[0]) || "");
        const href = `${base}pages/producto.html?id=${encodeURIComponent(r.id)}`;
        return `
      <article class="card">
        <a class="card-link" href="${href}">
          <div class="card-media">
            <img src="${img || Store.placeholderImage(r.category, r.name)}" alt="${escapeHtml(r.name)}" loading="lazy">
          </div>
          <div class="card-body">
            <span class="card-cat">${Store.getCategoryName(r.category)}</span>
            <h3 class="card-title">${escapeHtml(r.name)}</h3>
            <div class="card-footer">
              <span class="card-price">${money(r.price)}</span>
            </div>
          </div>
        </a>
      </article>`;
      })
      .join("");
    section.style.display = "";
  }

  function paintChrome() {
    const CFG = Store.getConfig();
    const brand = document.getElementById("brand-name");
    if (brand) brand.textContent = CFG.businessName;
    const topbar = document.getElementById("topbar-hours");
    if (topbar) topbar.textContent = CFG.hours;
    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
    const fBrand = document.getElementById("footer-brand");
    if (fBrand) fBrand.textContent = CFG.businessName;
    const fEmail = document.getElementById("footer-email");
    if (fEmail) fEmail.textContent = CFG.email;
    const fAddr = document.getElementById("footer-address");
    if (fAddr) fAddr.textContent = CFG.address;

    // cart badge
    const cart = getCart();
    const count = cart.reduce((s, l) => s + l.qty, 0);
    document.querySelectorAll(".cart-badge").forEach((el) => {
      el.textContent = count;
      el.classList.toggle("show", count > 0);
    });

    // drawer minimal open/close (main.js may also handle on index)
    document.getElementById("cart-open-btn")?.addEventListener("click", () => {
      renderDrawerLite();
      document.getElementById("cart-drawer")?.classList.add("open");
      document.getElementById("overlay")?.classList.add("open");
    });
    document.getElementById("fab-cart")?.addEventListener("click", () => {
      renderDrawerLite();
      document.getElementById("cart-drawer")?.classList.add("open");
      document.getElementById("overlay")?.classList.add("open");
    });
    window.addEventListener("cart-updated", () => {
      renderDrawerLite();
      const cart = getCart();
      const count = cart.reduce((s, l) => s + l.qty, 0);
      document.querySelectorAll(".cart-badge").forEach((el) => {
        el.textContent = count;
        el.classList.toggle("show", count > 0);
      });
    });
    document.getElementById("drawer-close")?.addEventListener("click", () => {
      document.getElementById("cart-drawer")?.classList.remove("open");
      document.getElementById("overlay")?.classList.remove("open");
    });
    document.getElementById("overlay")?.addEventListener("click", () => {
      document.getElementById("cart-drawer")?.classList.remove("open");
      document.getElementById("overlay")?.classList.remove("open");
    });
    document.getElementById("fab-whatsapp")?.addEventListener("click", () => {
      window.open(
        waLink(
          (CFG.contactMessagePrefix || "¡Hola!") +
            " Quiero más información sobre tus trabajos en mimbre."
        ),
        "_blank"
      );
    });

    // simple drawer render
    renderDrawerLite();
    document.getElementById("checkout-btn")?.addEventListener("click", () => {
      const cart = getCart();
      if (!cart.length) {
        showToast("Tu carrito está vacío");
        return;
      }
      const CFG = Store.getConfig();
      const lines = cart.map((line) => {
        const priceStr = line.price > 0 ? money(line.price) : "Consultar";
        return `• ${line.name || line.id} × ${line.qty} (${priceStr})`;
      });
      const msg = [CFG.orderMessagePrefix || "¡Hola! Quiero este pedido:", "", ...lines, "", "¿Me confirmás disponibilidad y forma de entrega?"].join("\n");
      window.open(waLink(msg), "_blank");
    });

    const menuToggle = document.getElementById("menu-toggle");
    const navLinks = document.getElementById("nav-links");
    menuToggle?.addEventListener("click", () => navLinks?.classList.toggle("open"));
    navLinks?.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => navLinks.classList.remove("open"))
    );
  }

  function renderDrawerLite() {
    const wrap = document.getElementById("drawer-items");
    const totalEl = document.getElementById("drawer-total");
    if (!wrap) return;
    const cart = getCart();
    if (!cart.length) {
      wrap.innerHTML = `<div class="drawer-empty"><span class="emoji">🌿</span>Tu carrito está vacío.</div>`;
      if (totalEl) totalEl.textContent = "—";
      return;
    }
    wrap.innerHTML = cart
      .map((line) => {
        const img = resolveImage(line.image || "");
        return `
        <div class="cart-item">
          <img src="${img}" alt="">
          <div class="ci-info">
            <div class="ci-title">${escapeHtml(line.name || line.id)}</div>
            <div class="ci-price">${money(line.price)} × ${line.qty}</div>
          </div>
        </div>`;
      })
      .join("");
    const hasPrice = cart.some((l) => l.price > 0);
    if (totalEl) {
      if (!hasPrice) totalEl.textContent = "A consultar";
      else
        totalEl.textContent = money(
          cart.reduce((s, l) => s + (l.price || 0) * l.qty, 0)
        );
    }
  }

  async function init() {
    await Store.init();
    paintChrome();

    const loading = document.getElementById("pdp-loading");
    const root = document.getElementById("pdp-root");
    product = productId ? Store.getProduct(productId) : null;

    if (!product) {
      if (loading) loading.textContent = "Producto no encontrado.";
      return;
    }

    const CFG = Store.getConfig();
    document.title = product.name + " — " + CFG.businessName;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = product.description || product.name;

    const bc = document.getElementById("bc-name");
    if (bc) bc.textContent = product.name;

    root.innerHTML = `
      <div class="pdp-grid">
        ${renderGallery(product)}
        ${renderInfo(product)}
      </div>
    `;
    if (loading) loading.style.display = "none";
    root.style.display = "";
    bindPdpEvents(product);
    renderRelated(product);
  }

  document.addEventListener("DOMContentLoaded", () => setTimeout(init, 30));
})();
