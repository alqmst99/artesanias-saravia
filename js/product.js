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
    const clean = src.replace(/^\.?\/+/, "");
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
    window.dispatchEvent(new Event("cart-updated"));
    const count = cart.reduce((s, l) => s + l.qty, 0);
    document.querySelectorAll(".cart-badge").forEach((el) => {
      el.textContent = count;
      el.classList.toggle("show", count > 0);
    });
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
      cart.push({
        id: product.id,
        qty,
        name: product.name,
        price: product.price,
        image: product.image || (product.images && product.images[0]) || "",
        category: product.category,
      });
    }
    setCart(cart);
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
          Pedir por WhatsApp 📲
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
      document.getElementById("cart-drawer")?.classList.add("open");
      document.getElementById("overlay")?.classList.add("open");
    });
    document.getElementById("fab-cart")?.addEventListener("click", () => {
      document.getElementById("cart-drawer")?.classList.add("open");
      document.getElementById("overlay")?.classList.add("open");
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
