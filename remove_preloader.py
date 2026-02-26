import os
import re

for root, dirs, files in os.walk('.'):
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            # Skip the main index.html
            if filepath == '.\\index.html' or filepath == './index.html':
                continue
            
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Remove the preloader block
            # <body>
            #     <!-- Preloader --> ... </div>\n    </div>
            new_content = re.sub(r'\s*<!-- Preloader -->\s*<div id="preloader">\s*<div class="loader-logo">\s*<img[^>]+>\s*</div>\s*</div>', '', content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Removed preloader from {filepath}")
