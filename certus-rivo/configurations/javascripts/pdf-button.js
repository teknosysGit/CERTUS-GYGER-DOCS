/* docs/assets/pdf-button.js */
(function () {
  "use strict";

  const LOG_PREFIX = "[pdf-btn]";

  // ─────────────────────────────────────────────────────────────────────────
  // CONFIG  — reads from window globals set in pdf-config.js
  // ─────────────────────────────────────────────────────────────────────────
  const w = typeof window !== "undefined" ? window : {};

  // Product list: [{label, docPath, pdfPath}, …]
  // Falls back to a single-product list built from legacy globals so existing
  // deployments that haven't updated pdf-config.js keep working.
  const PRODUCTS = Array.isArray(w.MANUAL_PRODUCTS) && w.MANUAL_PRODUCTS.length
    ? w.MANUAL_PRODUCTS
    : [
        {
          label:   "Manual",
          docPath: "",
          pdfPath: w.MANUAL_PDF_PATH || "pdf/User_Manual_CERTUS_FLEX_EN.pdf",
        },
      ];

  const UI = {
    placeholder:      w.MANUAL_PRODUCT_PLACEHOLDER  || "Select product…",
    dropdownTooltip:  w.MANUAL_PRODUCT_TOOLTIP       || "Switch product",
    pdfLabel:         w.MANUAL_PDF_LABEL             || "Download PDF",
    pdfTooltip:       w.MANUAL_PDF_TOOLTIP           || "Download the User Manual as PDF",
    icon:             w.MANUAL_PDF_ICON              || defaultDownloadIcon(),
    chevron:          w.MANUAL_DROPDOWN_CHEVRON      || defaultChevronIcon(),
    error:            w.MANUAL_PDF_ERROR             || {
      title:   "PDF not available",
      body:    "The user manual PDF could not be found.",
      okLabel: "OK",
    },
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STATE — which product is currently active
  // ─────────────────────────────────────────────────────────────────────────
  let activeProduct = null;   // will be resolved on first render

  // ─────────────────────────────────────────────────────────────────────────
  // LOGGING
  // ─────────────────────────────────────────────────────────────────────────
  function log(...a)  { try { console.log(LOG_PREFIX,  ...a); } catch {} }
  function warn(...a) { try { console.warn(LOG_PREFIX, ...a); } catch {} }

  // ─────────────────────────────────────────────────────────────────────────
  // DEFAULT ICON STRINGS (used when globals are absent)
  // ─────────────────────────────────────────────────────────────────────────
  function defaultDownloadIcon() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M7.5 10.5l4.5 4.5 4.5-4.5M12 3v12"
            fill="none" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }
  function defaultChevronIcon() {
    return `<svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 9l6 6 6-6"
            fill="none" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // URL HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Returns the true site root path (always ending with "/"), resolved once
   * and cached. Resolution order:
   *
   *  1. window.MANUAL_SITE_ROOT from pdf-config.js  — explicit, always correct.
   *  2. <link rel="canonical"> stripped to its root segment — reliable when
   *     MkDocs emits canonical tags (default in Material theme).
   *  3. Walk window.location.pathname upward, stripping the first segment that
   *     matches a configured docPath — finds the common ancestor automatically.
   *  4. Fall back to "/" so nothing breaks in unexpected environments.
   *
   * Strategy 1 is always used when MANUAL_SITE_ROOT is set in pdf-config.js,
   * which is the recommended approach for combined (multi-product) sites.
   */
  let _cachedSiteRoot = null;

  function getSiteRoot() {
    if (_cachedSiteRoot) return _cachedSiteRoot;

    // ── 1. Explicit config (most reliable) ──────────────────────────────
    if (w.MANUAL_SITE_ROOT) {
      let r = w.MANUAL_SITE_ROOT.trim();
      if (!r.endsWith("/")) r += "/";
      _cachedSiteRoot = r;
      log("Site root from MANUAL_SITE_ROOT:", _cachedSiteRoot);
      return _cachedSiteRoot;
    }

    // ── 2. <link rel="canonical"> ────────────────────────────────────────
    // MkDocs Material emits e.g.:
    //   <link rel="canonical" href="/docs/certus-flex/setup/">
    // Strip everything from the first product-folder segment onward.
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && canonical.href) {
      const cp = new URL(canonical.href).pathname;
      for (const product of PRODUCTS) {
        const detectPath = product.matchPath || product.docPath;
        if (!detectPath) continue;
        const seg = detectPath.replace(/^\/+|\/+$/g, ""); // e.g. "certus-flex"
        const idx = cp.indexOf("/" + seg + "/");
        if (idx !== -1) {
          _cachedSiteRoot = cp.slice(0, idx + 1);
          log("Site root from canonical tag:", _cachedSiteRoot);
          return _cachedSiteRoot;
        }
      }
    }

    // ── 3. Walk the current pathname upward ──────────────────────────────
    // Find the first product folder segment inside window.location.pathname
    // and treat everything before it as the site root.
    const loc = window.location.pathname;
    for (const product of PRODUCTS) {
      const detectPath = product.matchPath || product.docPath;
      if (!detectPath) continue;
      const seg = "/" + detectPath.replace(/^\/+|\/+$/g, "") + "/";
      const idx = loc.indexOf(seg);
      if (idx !== -1) {
        _cachedSiteRoot = loc.slice(0, idx + 1);
        log("Site root from pathname walk:", _cachedSiteRoot);
        return _cachedSiteRoot;
      }
    }

    // ── 4. Last resort ───────────────────────────────────────────────────
    _cachedSiteRoot = "/";
    log("Site root: fallback to /");
    return _cachedSiteRoot;
  }

  /**
   * Resolves a path from pdf-config.js (relative to the site root) to an
   * absolute URL pathname. Leading slashes in rootRelativePath are stripped
   * so both "certus-flex/" and "/certus-flex/" work identically.
   */
  function makeAbsoluteUrl(rootRelativePath) {
    const base  = getSiteRoot();
    const clean = (rootRelativePath || "").replace(/^\/+/, "");
    return base + clean;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRODUCT DETECTION — match the current page URL to a product entry
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Detects which product is active from the current URL.
   *
   * Uses `matchPath` (the product's top-level folder, e.g. "certus-flex/")
   * when available, falling back to `docPath` for backwards compatibility.
   *
   * matchPath MUST be the product folder root — not the entry page — so that
   * ANY page inside the product matches, not just the introduction page.
   * Set it in pdf-config.js alongside docPath:
   *
   *   matchPath: "certus-flex/",          // detects any page under certus-flex/
   *   docPath:   "certus-flex/introduction.html",  // navigation target
   */
  function detectActiveProduct() {
    const href = window.location.pathname;
    let best = null;
    let bestLen = -1;
    for (const p of PRODUCTS) {
      // Prefer matchPath for detection; fall back to docPath
      const detectPath = p.matchPath || p.docPath;
      if (!detectPath) continue;
      const absDoc = makeAbsoluteUrl(detectPath);
      if (href.startsWith(absDoc) && absDoc.length > bestLen) {
        best = p;
        bestLen = absDoc.length;
      }
    }
    return best;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DROPDOWN — custom widget (styled like the PDF button via shared tokens)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Build or refresh the product dropdown.
   * Returns the wrapper element (already inserted into the DOM by the caller).
   */
  function buildDropdown() {
    // If already in DOM, just update selection and return
    const existing = document.getElementById("pdf-product-switcher");
    if (existing) {
      syncDropdownSelection(existing);
      return existing;
    }

    // ── Wrapper ──────────────────────────────────────────────────────────
    const wrapper = document.createElement("div");
    wrapper.id = "pdf-product-switcher";
    wrapper.className = "pdf-product-switcher";
    wrapper.setAttribute("role", "combobox");
    wrapper.setAttribute("aria-haspopup", "listbox");
    wrapper.setAttribute("aria-expanded", "false");
    wrapper.setAttribute("title", UI.dropdownTooltip);

    // ── Trigger button ───────────────────────────────────────────────────
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "pdf-product-switcher__trigger md-header__button";
    trigger.setAttribute("aria-label", UI.dropdownTooltip);

    const labelSpan = document.createElement("span");
    labelSpan.className = "pdf-product-switcher__label";

    const chevronSpan = document.createElement("span");
    chevronSpan.className = "pdf-product-switcher__chevron";
    chevronSpan.innerHTML = UI.chevron;

    trigger.appendChild(labelSpan);
    trigger.appendChild(chevronSpan);
    wrapper.appendChild(trigger);

    // ── Menu (listbox) ───────────────────────────────────────────────────
    const menu = document.createElement("ul");
    menu.className = "pdf-product-switcher__menu";
    menu.setAttribute("role", "listbox");
    menu.setAttribute("aria-label", "Product list");

    PRODUCTS.forEach((product, idx) => {
      const item = document.createElement("li");
      item.className = "pdf-product-switcher__item";
      item.setAttribute("role", "option");
      item.setAttribute("data-idx", String(idx));

      // Icon (optional — omitted when product.icon is falsy)
      if (product.icon) {
        const iconSpan = document.createElement("span");
        iconSpan.className = "pdf-product-switcher__item-icon";
        iconSpan.innerHTML = product.icon;
        item.appendChild(iconSpan);
      }

      // Label text
      const textSpan = document.createElement("span");
      textSpan.className = "pdf-product-switcher__item-text";
      textSpan.textContent = product.label;
      item.appendChild(textSpan);

      item.addEventListener("click", (e) => {
        e.stopPropagation();
        selectProduct(product, wrapper);
        closeDropdown(wrapper);
      });

      // Keyboard: Enter / Space selects
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectProduct(product, wrapper);
          closeDropdown(wrapper);
          trigger.focus();
        }
        if (e.key === "Escape") {
          closeDropdown(wrapper);
          trigger.focus();
        }
        // Arrow navigation
        if (e.key === "ArrowDown") {
          e.preventDefault();
          const next = item.nextElementSibling;
          if (next) next.focus();
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          const prev = item.previousElementSibling;
          if (prev) prev.focus();
          else trigger.focus();
        }
      });

      item.setAttribute("tabindex", "-1");
      menu.appendChild(item);
    });

    wrapper.appendChild(menu);

    // ── Toggle open/close on trigger click ───────────────────────────────
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = wrapper.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        closeDropdown(wrapper);
      } else {
        openDropdown(wrapper);
      }
    });

    // ── Close on Escape key ──────────────────────────────────────────────
    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDropdown(wrapper);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        openDropdown(wrapper);
        const first = menu.querySelector("[role='option']");
        if (first) first.focus();
      }
    });

    // ── Close when clicking outside ──────────────────────────────────────
    document.addEventListener("click", () => closeDropdown(wrapper));
    wrapper.addEventListener("click", (e) => e.stopPropagation());

    syncDropdownSelection(wrapper);
    return wrapper;
  }

  function openDropdown(wrapper) {
    wrapper.setAttribute("aria-expanded", "true");
    wrapper.classList.add("is-open");
  }

  function closeDropdown(wrapper) {
    wrapper.setAttribute("aria-expanded", "false");
    wrapper.classList.remove("is-open");
  }

  /** Reflect activeProduct in the dropdown label and aria-selected states */
  function syncDropdownSelection(wrapper) {
    const labelSpan = wrapper.querySelector(".pdf-product-switcher__label");
    const items     = wrapper.querySelectorAll("[role='option']");

    const current      = activeProduct || detectActiveProduct();
    const displayLabel = current ? current.label : UI.placeholder;

    if (labelSpan) {
      // Rebuild trigger content: icon (if any) + text
      labelSpan.innerHTML = "";
      if (current && current.icon) {
        const iconSpan = document.createElement("span");
        iconSpan.className = "pdf-product-switcher__trigger-icon";
        iconSpan.innerHTML = current.icon;
        labelSpan.appendChild(iconSpan);
      }
      const textNode = document.createTextNode(displayLabel);
      labelSpan.appendChild(textNode);
    }

    items.forEach((item) => {
      const idx      = parseInt(item.getAttribute("data-idx"), 10);
      const isActive = current && PRODUCTS[idx] === current;
      item.setAttribute("aria-selected", isActive ? "true" : "false");
      item.classList.toggle("is-selected", isActive);
    });
  }

  /** Called when the user picks a product from the menu */
  function selectProduct(product, wrapper) {
    if (activeProduct === product) return;
    activeProduct = product;
    log("Product selected:", product.label);

    // Update dropdown label + selection state
    syncDropdownSelection(wrapper);

    // Update the PDF button tooltip / aria-label to reflect the new product
    updatePdfButton();

    // Navigate to the product's doc root
    const url = makeAbsoluteUrl(product.docPath);
    log("Navigating to:", url);
    window.location.href = url;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PDF BUTTON
  // ─────────────────────────────────────────────────────────────────────────
  function createPdfButton() {
    const a = document.createElement("a");
    a.id = "pdf-download-btn";
    a.href = "#";
    a.className = "pdf-download md-header__button";
    a.title = UI.pdfTooltip;
    a.setAttribute("aria-label", UI.pdfTooltip);
    a.innerHTML = `
      <span class="pdf-download__icon">${UI.icon}</span><span class="pdf-download__text">${UI.pdfLabel}</span>
    `;
    a.addEventListener("click", onDownloadClick);
    return a;
  }

  /** Refresh the PDF button's tooltip to reflect the active product (if desired) */
  function updatePdfButton() {
    const btn = document.getElementById("pdf-download-btn");
    if (!btn) return;
    if (activeProduct) {
      const tip = `${UI.pdfTooltip} — ${activeProduct.label}`;
      btn.title = tip;
      btn.setAttribute("aria-label", tip);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DOWNLOAD CLICK HANDLER
  // ─────────────────────────────────────────────────────────────────────────
  async function onDownloadClick(ev) {
    ev.preventDefault();

    // Resolve which product to use: explicit selection > URL detection > first
    const product = activeProduct || detectActiveProduct() || PRODUCTS[0];
    if (!product) { warn("No products configured"); return; }

    const url = makeAbsoluteUrl(product.pdfPath);
    log("Checking PDF at:", url);

    try {
      const res = await fetch(url, { method: "HEAD", cache: "no-store" });
      if (res.ok) {
        log("PDF found, opening:", url);
        window.open(url, "_blank", "noopener");
      } else {
        warn("PDF not found (status:", res.status, ")");
        showDialog();
      }
    } catch (e) {
      warn("Fetch failed:", e);
      showDialog();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ERROR DIALOG
  // ─────────────────────────────────────────────────────────────────────────
  function ensureDialog() {
    let backdrop = document.getElementById("pdf-missing-dialog");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "pdf-dialog-backdrop";
      backdrop.id = "pdf-missing-dialog";
      backdrop.innerHTML = `
        <div class="pdf-dialog" role="dialog" aria-modal="true" aria-labelledby="pdf-dialog-title">
          <div class="pdf-dialog__header">
            <span id="pdf-dialog-title"></span>
          </div>
          <div class="pdf-dialog__body"></div>
          <div class="pdf-dialog__actions">
            <button type="button" class="pdf-dialog__btn" id="pdf-dialog-ok"></button>
          </div>
        </div>
      `;
      const hide = () => {
        backdrop.classList.remove("is-open");
        backdrop.setAttribute("aria-hidden", "true");
        document.body.classList.remove("no-scroll");
      };
      backdrop.addEventListener("click", (e) => { if (e.target === backdrop) hide(); });
      document.body.appendChild(backdrop);
      backdrop.querySelector("#pdf-dialog-ok").addEventListener("click", hide);
    }
    // Sync content from config
    const t = backdrop.querySelector("#pdf-dialog-title");
    const b = backdrop.querySelector(".pdf-dialog__body");
    const o = backdrop.querySelector("#pdf-dialog-ok");
    if (t) t.textContent = UI.error.title;
    if (b) b.innerHTML   = UI.error.body;
    if (o) o.textContent = UI.error.okLabel;
  }

  function showDialog() {
    ensureDialog();
    const el = document.getElementById("pdf-missing-dialog");
    if (el) {
      el.classList.add("is-open");
      el.setAttribute("aria-hidden", "false");
      document.body.classList.add("no-scroll");
      const btn = document.getElementById("pdf-dialog-ok");
      if (btn) btn.focus();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HEADER INSERTION
  // ─────────────────────────────────────────────────────────────────────────
  function findHeaderInsertPoint() {
    const search = document.querySelector(
      ".md-header__inner .md-search, [data-md-component='search']"
    );
    if (search && search.parentElement) return { node: search, where: "afterend" };

    const headerInner = document.querySelector(".md-header__inner");
    if (headerInner) return { node: headerInner, where: "beforeend" };

    const header = document.querySelector("header.md-header");
    if (header) return { node: header, where: "beforeend" };

    return null;
  }

  function insertWidgetsOnce() {
    // Both widgets are inserted as a unit; skip if already present
    if (document.getElementById("pdf-product-switcher")) {
      log("Widgets already present; syncing state");
      // Re-detect product on navigation (MkDocs SPA behaviour)
      activeProduct = detectActiveProduct();
      const sw = document.getElementById("pdf-product-switcher");
      if (sw) syncDropdownSelection(sw);
      updatePdfButton();
      return true;
    }

    const target = findHeaderInsertPoint();
    if (!target) return false;

    // Build both widgets
    const dropdown  = buildDropdown();
    const pdfButton = createPdfButton();

    // Wrap in a flex group so they sit side-by-side with a consistent gap
    const group = document.createElement("div");
    group.className = "pdf-header-group";
    group.appendChild(dropdown);
    group.appendChild(pdfButton);

    target.node.insertAdjacentElement(target.where, group);

    // Detect which product is active based on the current URL
    activeProduct = detectActiveProduct();
    syncDropdownSelection(dropdown);
    updatePdfButton();

    log("Inserted product switcher + PDF button");
    return true;
  }

  function insertWithRetries(maxTries = 20, interval = 150) {
    let tries = 0;
    const tick = () => {
      tries++;
      if (insertWidgetsOnce()) return;
      if (tries < maxTries) setTimeout(tick, interval);
      else warn("Could not find header after retries");
    };
    tick();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * SPA navigation strategy (navigation.instant in mkdocs.base.yml):
   *
   * Material replaces the header DOM on each instant-navigation, destroying
   * our widgets. We solve this with two mechanisms:
   *
   *  1. document$.subscribe — fires after each SPA page swap.
   *     - Does NOT reset _cachedSiteRoot (it never changes mid-session).
   *     - Keeps activeProduct STICKY: if the user is browsing within a
   *       product, the dropdown keeps showing that product even as pages
   *       change. Only updates if the URL moves into a different product
   *       folder (e.g. user followed a cross-product link).
   *     - If widgets are still in the DOM: just syncs dropdown state.
   *     - If widgets were destroyed by the header swap: re-inserts them.
   *
   *  2. MutationObserver on <header> — catches header DOM replacements
   *     immediately and re-inserts widgets before the user sees them missing.
   */

  let _observer = null;

  function onNavigation() {
    log("Navigation event — syncing widgets");

    // Detect which product the current URL belongs to
    const detected = detectActiveProduct();

    if (detected) {
      // URL is inside a known product folder — make it sticky
      if (detected !== activeProduct) {
        activeProduct = detected;
        log("Active product updated by URL:", activeProduct.label);
      }
    }
    // If detected is null (e.g. portal/landing page), keep the last
    // activeProduct so the dropdown doesn't go blank mid-session.

    // Re-insert if header swap destroyed our widgets; otherwise just sync
    if (!document.getElementById("pdf-product-switcher")) {
      log("Widgets missing — re-inserting");
      insertWithRetries();
    } else {
      const sw = document.getElementById("pdf-product-switcher");
      if (sw) syncDropdownSelection(sw);
      updatePdfButton();
    }
  }

  function attachHeaderObserver() {
    const header = document.querySelector("header.md-header");
    if (!header || _observer) return;

    _observer = new MutationObserver(() => {
      if (!document.getElementById("pdf-product-switcher")) {
        log("MutationObserver: header changed, re-inserting widgets");
        // Preserve activeProduct across the re-insert
        const saved = activeProduct;
        insertWidgetsOnce();
        if (saved && !activeProduct) {
          activeProduct = saved;
          const sw = document.getElementById("pdf-product-switcher");
          if (sw) syncDropdownSelection(sw);
          updatePdfButton();
        }
      }
    });

    _observer.observe(header, { childList: true, subtree: true });
    log("MutationObserver attached to header");
  }

  function init() {
    ensureDialog();
    insertWithRetries();
    attachHeaderObserver();
  }

  // Support MkDocs Material's document$ observable (SPA navigation)
  if (w.document$ && typeof w.document$.subscribe === "function") {
    w.document$.subscribe(() => {
      log("document$ navigation event");
      onNavigation();
    });
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      log("DOMContentLoaded");
      init();
    });
  }
})();