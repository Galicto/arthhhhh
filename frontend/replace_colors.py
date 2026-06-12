import os
import re

def replace_colors_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    new_content = content
    
    # Generic regex replacements to catch all variants of white opacities
    # Match strings like 'bg-white/5', 'bg-white/[0.04]', 'bg-white/100', etc.
    new_content = re.sub(r'\bbg-white/([0-9]+|\[[0-9\.]+\])', r'bg-on-surface/\1', new_content)
    new_content = re.sub(r'\bborder-white/([0-9]+|\[[0-9\.]+\])', r'border-on-surface/\1', new_content)
    new_content = re.sub(r'\btext-white/([0-9]+|\[[0-9\.]+\])', r'text-on-surface/\1', new_content)
    new_content = re.sub(r'\bfrom-white/([0-9]+|\[[0-9\.]+\])', r'from-on-surface/\1', new_content)
    new_content = re.sub(r'\bto-white/([0-9]+|\[[0-9\.]+\])', r'to-on-surface/\1', new_content)
    new_content = re.sub(r'\bvia-white/([0-9]+|\[[0-9\.]+\])', r'via-on-surface/\1', new_content)

    # Finally, replace exact 'text-white' without opacity
    # Note: we already replaced the opacity ones, so now it's safe to do this
    new_content = re.sub(r'\btext-white\b(?!/)', r'text-on-surface', new_content)

    # Note: bg-white is often used intentionally for light components, so we only replace bg-white/[opacity] which are used for glassmorphism.

    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

def main():
    src_dir = '/Users/rajaryan/Desktop/ARTH/frontend/src'
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                replace_colors_in_file(os.path.join(root, file))

if __name__ == '__main__':
    main()
