/*document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("figcaption").forEach(function (caption) {
    const prev = caption.previousElementSibling;

    // If figcaption is directly after a <ul>, find the last <figure> inside that <ul>
    if (prev && prev.tagName === "UL") {
      const lastFigure = prev.querySelector("figure:last-of-type");
      if (lastFigure) {
        lastFigure.appendChild(caption);
      }
    }
  });
});*/

document.addEventListener("DOMContentLoaded", function () {

  function fixCaption(caption) {
    const figure = caption.closest("figure");
    if (figure) {
      const img = figure.querySelector("img");
      if (img) {
        // Match figure width to the image's actual rendered width
        const imgWidth = img.getAttribute("width") || img.offsetWidth;
        if (imgWidth) {
          figure.style.setProperty("width", imgWidth + (String(imgWidth).includes("px") ? "" : "px"), "important");
        }
      }
    }

    // Force override Material's max-width and margin inline
    caption.style.setProperty("max-width", "100%", "important");
    caption.style.setProperty("width", "100%", "important");
    caption.style.setProperty("margin", "0.25em 0 0 0", "important");
    caption.style.setProperty("padding-left", "0", "important");
    caption.style.setProperty("text-align", "left", "important");
    caption.style.setProperty("box-sizing", "border-box", "important");
  }

  document.querySelectorAll("figcaption").forEach(function (caption) {
    const prev = caption.previousElementSibling;

    if (prev && prev.tagName === "UL") {
      const lastFigure = prev.querySelector("figure:last-of-type");
      if (lastFigure) {
        lastFigure.appendChild(caption);
        fixCaption(caption);
      }
    }

    if (prev && prev.tagName === "FIGURE") {
      prev.appendChild(caption);
      fixCaption(caption);
    }
  });

  // Re-run after images finish loading in case offsetWidth was 0 initially
  window.addEventListener("load", function () {
    document.querySelectorAll("li figure figcaption").forEach(fixCaption);
  });

});



