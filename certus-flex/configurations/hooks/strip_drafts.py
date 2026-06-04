# docs/hooks/strip_drafts.py
"""
MkDocs build hook — strips !!! draft / ??? draft admonition blocks
from page source before rendering, so they are never published.

Works in two passes:

  Pass 1 — on_page_markdown
    Step A (both serve and build):
      mkdocs-table-of-figures is a plugin, so its on_page_markdown runs
      BEFORE this hook. It replaces indented image markdown with raw
      <figure> HTML blocks at column 0, which breaks them out of the
      admonition indentation. This step re-indents any such HTML blocks
      back to 4 spaces so Python-Markdown keeps them inside the admonition.

    Step B (build only):
      Strips the entire !!! draft / ??? draft block and all its content
      (including the now-correctly-indented figure blocks) so nothing
      inside a draft admonition is ever published.

  Pass 2 — on_page_content (build only)
    mkdocs-glightbox runs on_page_content and can still inject orphaned
    <p><a class="glightbox"> and <figcaption> siblings after the draft
    div in the final HTML. This pass removes any such orphaned nodes.

During `mkdocs serve` only Step A runs — drafts stay fully visible locally
with figures correctly rendered inside their admonition boxes.

No third-party libraries required — stdlib only.

To activate, add to mkdocs.yml:
    hooks:
      - docs/hooks/strip_drafts.py
"""

import re


# ---------------------------------------------------------------------------
# Compiled patterns
# ---------------------------------------------------------------------------

_ADMONITION_OPEN = re.compile(
    r'<div\s[^>]*class="[^"]*\badmonition\b[^"]*"[^>]*>',
    re.IGNORECASE,
)
_GLIGHTBOX_P = re.compile(
    r'\s*<p>\s*(?:<a\s[^>]*class="[^"]*\bglightbox\b[^"]*"[^>]*>.*?</a>\s*)+</p>',
    re.IGNORECASE | re.DOTALL,
)
_FIGCAPTION = re.compile(
    r'\s*<figcaption>.*?</figcaption>',
    re.IGNORECASE | re.DOTALL,
)
_TOF_FIGURE = re.compile(
    r'\s*<figure\b[^>]*class="[^"]*\bfigure\b[^"]*"[^>]*>.*?</figure>',
    re.IGNORECASE | re.DOTALL,
)


# ---------------------------------------------------------------------------
# Pass 1 — Markdown stage
# ---------------------------------------------------------------------------

def _fix_tof_indentation(markdown):
    """
    Re-indent raw HTML blocks that tof injected at column 0 back into the
    admonition they belong to.

    tof processes on_page_markdown before hooks and replaces image markdown
    inside admonitions with <figure> HTML at column 0.  Python-Markdown then
    treats those blocks as page-level content, rendering them outside the
    admonition box.  Adding 4 spaces of indentation restores the correct
    nesting for any admonition type (draft, note, warning, etc.).
    """
    lines = markdown.splitlines(keepends=True)
    result = []
    in_admonition = False
    indent_len = None
    in_html_block = False
    html_close_tag = None

    for line in lines:
        if not in_admonition:
            # Detect any admonition opener at column 0
            if re.match(r'^(?:!{3}|\?{3})\s+\w+\b', line, re.IGNORECASE):
                in_admonition = True
                indent_len = None
                in_html_block = False
            result.append(line)
            continue

        if not line.strip():
            result.append(line)
            continue

        if in_html_block:
            # Continue consuming and re-indenting a multi-line HTML block
            result.append('    ' + line)
            if re.search(re.escape(html_close_tag), line, re.IGNORECASE):
                in_html_block = False
                html_close_tag = None
            continue

        current_indent = len(line) - len(line.lstrip())

        if indent_len is None:
            # First non-blank line after the opener sets the indent level
            if current_indent > 0:
                indent_len = current_indent
            else:
                in_admonition = False   # empty admonition
            result.append(line)
            continue

        if current_indent >= indent_len:
            # Normally indented content — keep as-is
            result.append(line)
            continue

        # Dedented line — is it a raw HTML block injected by tof?
        stripped = line.lstrip()
        if stripped.startswith('<'):
            tag_m = re.match(r'<(\w+)', stripped)
            if tag_m:
                close = '</' + tag_m.group(1) + '>'
                # Multi-line block if the closing tag is not on this line
                if not re.search(re.escape(close), line, re.IGNORECASE):
                    in_html_block = True
                    html_close_tag = close
            result.append('    ' + line)
            continue

        # Truly dedented non-HTML line — admonition has ended
        in_admonition = False
        indent_len = None
        result.append(line)

    return ''.join(result)


def _strip_drafts(markdown):
    """Remove !!! draft / ??? draft blocks and all their indented content."""
    lines = markdown.splitlines(keepends=True)
    result = []
    skip = False
    indent_len = None

    for line in lines:
        if re.match(r'^(?:!{3}|\?{3})\s+draft\b', line, re.IGNORECASE):
            skip = True
            indent_len = None
            continue

        if skip:
            if not line.strip():
                continue
            current_indent = len(line) - len(line.lstrip())
            if indent_len is None:
                if current_indent > 0:
                    indent_len = current_indent
                    continue
                else:
                    skip = False
                    indent_len = None
                    result.append(line)
                    continue
            if current_indent >= indent_len:
                continue
            else:
                skip = False
                indent_len = None
                result.append(line)
                continue

        result.append(line)

    return ''.join(result)


def on_page_markdown(markdown, page, config, **kwargs):
    """
    Step A (always): re-indent tof-injected <figure> blocks into admonitions.
    Step B (build only): strip all !!! draft blocks entirely.
    """
    # Step A — fix tof indentation so figures render inside the admonition box
    markdown = _fix_tof_indentation(markdown)

    # Step B — on build, strip draft blocks; on serve, leave them visible
    if config.get('dev_addr') is None:
        markdown = _strip_drafts(markdown)

    return markdown


# ---------------------------------------------------------------------------
# Pass 2 — HTML stage (build only — cleans up any residual glightbox orphans)
# ---------------------------------------------------------------------------

def _find_closing_div(html, after):
    """
    Return the index just after the </div> that closes the <div> whose
    content starts at `after`.  Returns -1 on malformed HTML.
    """
    depth = 0
    i = after
    while i < len(html):
        open_m  = re.search(r'<div\b',  html[i:])
        close_m = re.search(r'</div>', html[i:])
        if not close_m:
            break
        open_pos  = (open_m.start() + i) if open_m else len(html)
        close_pos = close_m.start() + i
        if open_pos < close_pos:
            depth += 1
            i = open_pos + 4
        else:
            if depth == 0:
                return close_pos + len('</div>')
            depth -= 1
            i = close_pos + len('</div>')
    return -1


def on_page_content(html, page, config, **kwargs):
    """
    Remove any glightbox / tof artefacts that were orphaned outside
    .admonition.draft divs after the Markdown pass stripped the draft content.

    Skipped during `mkdocs serve`.
    """
    if config.get('dev_addr') is not None:
        return html

    result = []
    i = 0
    changed = False

    while i < len(html):
        m = _ADMONITION_OPEN.search(html, i)
        if not m:
            result.append(html[i:])
            break

        tag = m.group(0)
        cls_match = re.search(r'class="([^"]*)"', tag)
        if not cls_match or 'draft' not in cls_match.group(1).split():
            result.append(html[i:m.end()])
            i = m.end()
            continue

        result.append(html[i:m.start()])
        changed = True

        end = _find_closing_div(html, m.end())
        if end == -1:
            result.append(html[m.start():])
            break

        # Consume all orphaned artefact nodes immediately after the draft div
        j = end
        while True:
            consumed = False

            fm = _TOF_FIGURE.match(html, j)
            if fm:
                j = fm.end()
                consumed = True
                continue

            gm = _GLIGHTBOX_P.match(html, j)
            if gm:
                j = gm.end()
                consumed = True
                fcm = _FIGCAPTION.match(html, j)
                if fcm:
                    j = fcm.end()
                continue

            fcm = _FIGCAPTION.match(html, j)
            if fcm:
                j = fcm.end()
                consumed = True
                continue

            if not consumed:
                break

        i = j

    return ''.join(result) if changed else html