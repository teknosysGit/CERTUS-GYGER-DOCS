
# Gyger Documentation — Complete Project README (Enhanced)

This README provides full documentation for the Gyger MKDocs-based documentation portal, including:
- Environment setup
- Complete folder structure
- Plugin and extension details
- How to define and use variables
- PDF generation using *mkdocs-with-pdf*
- Editing and maintenance workflow

---

## 1. 📦 Overview
This project converts a PDF-based user manual into a modern, searchable documentation website built using **MKDocs** and the **Material for MKDocs** theme. The site supports:
- Clean Markdown-based documentation
- Light/dark theme
- Image zooming
- PDF export
- Automatic navigation structure
- Reusable variables
- Enhanced formatting through Markdown extensions

---

## 2. ✅ Prerequisites

### Install Python
Download Python (3.10+ recommended): https://www.python.org/downloads/

> On Windows, select **Add Python to PATH** during installation.

### Install Git
Download Git from: https://git-scm.com/

### Install MKDocs + Required Plugins
Run the following:
```
pip install --upgrade pip
pip install mkdocs mkdocs-material mkdocs-glightbox mkdocs-macros-plugin mkdocs-with-pdf "mkdocstrings[python]" pymdown-extensions
```
All required packages in this list match the plugins defined in `mkdocs.yaml`.

---

## 3. 📂 Project Folder Structure

```
docs/
  _shared_assets/ (Shared icons, images, videos, and screenshots across the site and products)

  common_content/
    glossary.md

  configurations/
    javascripts/
      pdf-button.js
      pdf-config.js
      print-download.js

    stylesheets/
      faq-admonition.css
      pdf-button.css
      style.css
      typography-home-page.css
      typography.css

    templates/
      (custom Material overrides and PDF templates)

  data/
    variables.yaml

  en/
    common_topics/
      legal.md
      faqs.md
      glossary.md
      index.md

    products/
      certus-flex/
        _assets/
        release_notes/
        about_this_document.md
        assembly_and_operation.md
        certus_controls.md
        decommissioning.md
        disposal.md
        getting-started.md
        index.md
        installation.md
        introduction.md
        maintenance.md
        operations.md
        references.md
        safety.md
        specifications_device_data.md
        specifications_dimensions.md
        start_up.md
        transportation_storage.md
        troubleshooting.md
        web_control.md

      certus-rivo/ (placeholder)

  about.md
  index.md  (Home Page)
  license.md

mkdocs.yaml
site/ (auto-generated)
```

---

## 4. 🧩 Plugins & Extensions Used in This Project
This project uses several MKDocs plugins and Markdown extensions that greatly improve the functionality of the site.

### ### 🔌 **1. Material for MKDocs Theme**
Provides modern user interface, search, navigation, light/dark mode, icons, and content formatting.

### 🔌 **2. mkdocs-glightbox**
Adds zoomable, responsive image popups.
Example:
```md
![Zoomable Image](path/to/image.png)
```

### 🔌 **3. mkdocs-macros-plugin**
Allows defining reusable variables and content blocks.
Variables are defined in:
```
docs/data/variables.yaml
```
Example variable entry:
```yaml
product_name: "CERTUS FLEX"
version: "v12.0"
```
Use in Markdown:
```md
# Welcome to {{ product_name }} Documentation
Version: **{{ version }}**
```

### 🔌 **4. mkdocstrings**
Used for API/documentation extraction (optional for your project).

### 🔌 **5. mkdocs-with-pdf** (PDF Generator)
This plugin generates a **single PDF manual** of the entire documentation structure.

**Configuration:**
Located inside `mkdocs.yaml`:
```yaml
with-pdf:
  cover: true
  toc_level: 3
  output_path: "pdf/User_Manual_CERTUS_FLEX_EN.pdf"
  custom_template_path: docs/configurations/templates/pdf/
```
**Generate PDF:**
```
mkdocs build
```
The PDF will appear in:
```
docs/pdf/User_Manual_CERTUS_FLEX_EN.pdf
```

### 🔌 **6. Search Plugin**
Enhances navigation with advanced search suggestions and highlighting.

### 🔌 **7. Markdown Extensions**
Includes Pymdown Extensions for:
- Collapsible sections
- Syntax highlighting
- Callouts/admonitions
- Smart typography
- Tabs
- Task lists

Examples:
```md
!!! note
    This is an annotated note.
```
```md
=== "Windows"
    Instructions...
=== "Mac"
    Instructions...
```

---

## 5. 🧬 Defining & Using Variables
Variables make your documentation consistent and easy to update.
All variables are stored in:
```
docs/data/variables.yaml
```
Example content:
```yaml
company: "Fritz Gyger AG"
flex_version: "v12.0"
publish_date: "February 2026"
```

### How to Use Variables in Markdown
Use this syntax inside `.md` files:
```md
Product Version: **{{ flex_version }}**
Published on: {{ publish_date }}
```
Automatically updates everywhere when changed in `variables.yaml`.

### How Variables Work
The `macros` plugin loads variables via:
```yaml
include_yaml:
  - variables: docs/data/variables.yaml
```

---

## 6. ▶️ Running the Documentation Locally
```
mkdocs serve
```
Then open:
```
http://127.0.0.1:8000
```
Auto-refresh enabled.

---

## 7. ✏️ Editing & Maintaining Documentation
- Edit Home → `docs/index.md`
- Edit Product Pages → `docs/en/products/certus-flex/`
- Add Images → `docs/_shared_assets/`
- Edit Variables → `docs/data/variables.yaml`
- Add Pages → Update `mkdocs.yaml` under `nav`

---

## 8. 📄 Generating a Full PDF Manual
Run:
```
mkdocs build
```
Your PDF appears at:
```
docs/pdf/User_Manual_CERTUS_FLEX_EN.pdf
```

---

## 9. ➕ Adding Languages or Products
- New Product → Add folder in `docs/en/products/`
- New Language → Add folder `docs/<lang-code>/`

---

## 10. © License
Content is © Fritz Gyger AG.

---
