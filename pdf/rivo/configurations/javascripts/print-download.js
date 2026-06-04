(function () {
  function getMeta(name) {
    const el = document.querySelector(`meta[name="${name}"]`);
    return el ? el.getAttribute("content") : "";
  }

  function createSvgIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("download-icon");
    svg.innerHTML =
      '<path fill="currentColor" d="M5 20h14a1 1 0 1 0 0-2H5a1 1 0 1 0 0 2zm7-18a1 1 0 0 1 1 1v8.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.42L11 11.59V3a1 1 0 0 1 1-1z"/>';
    return svg;
  }

  function buildButton(label) {
    const btn = document.createElement("button");
    btn.id = "download-pdf";
    btn.type = "button";
    btn.className = "md-button md-header__button md-download-button";
    btn.setAttribute("aria-label", label);
    btn.appendChild(createSvgIcon());

    const span = document.createElement("span");
    span.className = "md-button__label";
    span.textContent = label;
    btn.appendChild(span);

    return btn;
  }

  function insertButtonNearSearch(btn) {
    const header = document.querySelector(".md-header__inner");
    if (!header) return;

    const search = header.querySelector('[data-md-component="search"]');
    const actions = header.querySelector(".md-header__actions");

    if (search && search.parentNode) {
      search.parentNode.insertBefore(btn, search.nextSibling);
    } else if (actions) {
      actions.appendChild(btn);
    } else {
      header.appendChild(btn);
    }
  }

  function showErrorDialog(message) {
    let overlay = document.getElementById("pdf-missing-dialog");
    if (overlay) overlay.remove();

    overlay = document.createElement("div");
    overlay.id = "pdf-missing-dialog";
    overlay.className = "md-dialog__overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "pdf-missing-title");

    overlay.innerHTML = `
      <div class="md-dialog">
        <div class="md-dialog__header">
          <span id="pdf-missing-title" class="md-dialog__title">PDF not available</span>
        </div>
        <div class="md-dialog__content">
          <p>${message}</p>
        </div>
        <div class="md-dialog__actions">
          <button type="button" class="md-button md-button--primary" data-close-dialog>
            OK
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closer = overlay.querySelector("[data-close-dialog]");
    closer?.addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

    document.addEventListener("keydown", function onEsc(ev) {
      if (ev.key === "Escape") {
        overlay.remove();
        document.removeEventListener("keydown", onEsc);
      }
    }, { once: true });
  }

  async function headExists(url) {
    try {
      const res = await fetch(url, { method: "HEAD", cache: "no-store" });
      return res.ok;
    } catch (e) {
      console.error("[Download PDF] HEAD failed:", e);
      return false;
    }
  }

  function startDownload(url) {
    // Prefer a direct download; fallback to opening in a new tab
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", decodeURIComponent(url.split("/").pop() || "manual.pdf"));
    document.body.appendChild(a);
    a.click();
    a.remove();

    // Some browsers ignore download if cross-origin; fallback
    setTimeout(() => {
      window.open(url, "_blank", "noopener,noreferrer");
    }, 300);
  }

  function normalizePath(rawPath) {
    // Ensure absolute path against current origin, and safely encode spaces, etc.
    const encoded = encodeURI(rawPath);
    return new URL(encoded.replace(/^\//, "/"), window.location.origin).href;
  }

  function enhance() {
    const rawPath = getMeta("pdf-path") || "pdf/document.pdf";
    const label = (getMeta("pdf-label") || "Download PDF").trim();

    
    const pdfUrl = new URL(rawPath, window.location.href).href;
    console.debug("[Download PDF] Probing:", pdfUrl);

    const btn = buildButton(label);
    insertButtonNearSearch(btn);

    btn.addEventListener("click", async () => {
      const exists = await headExists(pdfUrl);
      if (exists) {
        startDownload(pdfUrl);
      } else {
        // Helpful message shows the exact URL being probed
        showErrorDialog(
          `We couldn't find the PDF at <code>${pdfUrl}</code>.<br>
           Please verify the file was generated (plugin <em>with-pdf</em>) and deployed to <code>/pdf/</code>, 
           or try again later.`
        );
      }
    });
  }

  // Support Material instant loading
  if (window.document$) {
    document$.subscribe(enhance);  // Material for MkDocs guidance
  } else {
    document.addEventListener("DOMContentLoaded", enhance);
  }
})();