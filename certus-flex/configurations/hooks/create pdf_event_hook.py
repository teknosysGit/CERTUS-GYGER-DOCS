def on_pdf_stylesheet(env, stylesheets):
    # Merge extra variables into Jinja2 environment globals
    env.globals.update(env.conf.get('extra', {}))
    return stylesheets