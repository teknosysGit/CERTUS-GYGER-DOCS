// docs/configurations/javascripts/pdf-config.js
// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT SWITCHER CONFIGURATION
// Controls dropdown items, navigation targets, and PDF links
// ─────────────────────────────────────────────────────────────────────────────

window.MANUAL_PRODUCTS = [
  {
    // Display name in dropdown
    label: "Certus Flex",

    // Icon shown in dropdown and button
    icon: `<svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
            fill="none" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,

    // Used to detect active product based on URL
    matchPath: "certus-flex/",

    // Page to open when selected (relative to MANUAL_SITE_ROOT)
    docPath: "/certus-flex/common_content/introduction/",

    // PDF file path (relative to MANUAL_SITE_ROOT)
    pdfPath: "certus-flex/pdf/User_Manual_CERTUS_FLEX_EN.pdf",
  },

  {
    label: "Certus Rivo",

    icon: `<svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 7.5l-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
            fill="none" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,

    matchPath: "certus-rivo/",

    docPath: "/certus-rivo/common_content/introduction/",

    pdfPath: "certus-rivo/pdf/User_Manual_CERTUS_RIVO_EN.pdf",
  },
];


// ─────────────────────────────────────────────────────────────────────────────
// SITE ROOT CONFIGURATION (CRITICAL FIX)
// ─────────────────────────────────────────────────────────────────────────────
//
// This defines the base path where your site is hosted.
//
// GitHub Pages URL:
// https://teknosysgit.github.io/CERTUS-GYGER-DOCS/
//
// Therefore ALL links must start from:
// /CERTUS-GYGER-DOCS/
//
// This fixes broken links like:
// ❌ /certus-rivo/
// ✅ /CERTUS-GYGER-DOCS/certus-rivo/
//
window.MANUAL_SITE_ROOT = "/CERTUS-GYGER-DOCS/";


// ─────────────────────────────────────────────────────────────────────────────
// DROPDOWN UI TEXT
// ─────────────────────────────────────────────────────────────────────────────
window.MANUAL_PRODUCT_PLACEHOLDER = "Select product…";
window.MANUAL_PRODUCT_TOOLTIP = "Switch product documentation";


// ─────────────────────────────────────────────────────────────────────────────
// PDF BUTTON CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
window.MANUAL_PDF_LABEL = "Download PDF";
window.MANUAL_PDF_TOOLTIP = "Download the User Manual as PDF";

window.MANUAL_PDF_ICON = `
<svg viewBox="0 0 24 24" aria-hidden="true">
  <path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M7.5 10.5l4.5 4.5 4.5-4.5M12 3v12"
        fill="none" stroke="currentColor" stroke-width="1.5"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;


// Dropdown arrow icon
window.MANUAL_DROPDOWN_CHEVRON = `
<svg viewBox="0 0 24 24" aria-hidden="true">
  <path d="M6 9l6 6 6-6"
        fill="none" stroke="currentColor" stroke-width="1.5"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;


// ─────────────────────────────────────────────────────────────────────────────
// PDF ERROR DIALOG
// ─────────────────────────────────────────────────────────────────────────────
window.MANUAL_PDF_ERROR = {
  title: "PDF not available",
  body:
    "The user manual PDF could not be found in <code>/pdf</code>. " +
    "Please ensure the <code>with-pdf</code> plugin generated it and that " +
    "<code>output_path</code> matches the configured file name.",
  okLabel: "OK"
};
