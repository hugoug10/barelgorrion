import re

with open("menu/index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Replace .menu-grid with .premium-menu
html = html.replace('<div class="menu-grid">', '<div class="premium-menu">')

# Replace .menu-item with .menu-category
html = html.replace('<div class="menu-item">', '<div class="menu-category">')

# Replace ul.item-list with div.menu-items
html = html.replace('<ul class="item-list">', '<div class="menu-items">')
html = html.replace('</ul>', '</div>')

# Replace li items with menu-entry
def replace_li(match):
    inner = match.group(1)
    if 'Suplementos' in inner:
        return f'<div style="font-size: 0.8rem; color: var(--gold-solid); margin-top: 1rem;">*Suplementos: 0,50€</div>'
    if 'border-bottom: none' in inner:
        # Subheader
        text_match = re.search(r'>([^<]+)$', inner.strip())
        if text_match:
            text = text_match.group(1)
        else:
            text = inner.replace('<li style="border-bottom: none; font-weight: 700;">', '').replace('<li style="border-bottom: none; font-weight: 700; margin-top: 1rem;">', '').strip()
            # fallback removing tags
            text = re.sub('<[^<]+>', '', inner).strip()
        return f'<h4 style="color: var(--gold-solid); margin-top: 1rem; margin-bottom: 0.5rem; text-transform: uppercase; font-size: 0.9rem; letter-spacing: 1px;">{text}</h4>'
    
    # Normal item: <li><span>Name</span> <span class="price">Price</span></li>
    m = re.search(r'<span>(.*?)</span>\s*<span class="price">(.*?)</span>', inner, flags=re.DOTALL)
    if m:
        name = m.group(1).strip()
        price = m.group(2).strip()
        return f"""                            <div class="menu-entry">
                                <span class="menu-entry-name">{name}</span>
                                <div class="menu-entry-dots"></div>
                                <span class="menu-entry-price">{price}</span>
                            </div>"""
    return match.group(0)

html = re.sub(r'<li[^>]*>(.*?)</li>', replace_li, html, flags=re.DOTALL)

with open("menu/index.html", "w", encoding="utf-8") as f:
    f.write(html)
