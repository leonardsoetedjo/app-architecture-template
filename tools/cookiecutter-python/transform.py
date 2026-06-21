#!/usr/bin/env python3
"""Transform static boilerplate into Cookiecutter Jinja2 templates."""
import os
import re
import sys

SLUG = "order-service"
PKG = "order_service"

def transform(root: str):
    for dirpath, dirnames, filenames in os.walk(root):
        # Rename directories
        for d in list(dirnames):
            old = os.path.join(dirpath, d)
            new_d = d.replace(SLUG, "{{ cookiecutter.project_slug }}")
            new_d = new_d.replace(PKG, "{{ cookiecutter.package_name }}")
            if new_d != d:
                new = os.path.join(dirpath, new_d)
                os.rename(old, new)
                dirnames[dirnames.index(d)] = new_d

        for fname in filenames:
            fpath = os.path.join(dirpath, fname)
            new_fname = fname.replace(SLUG, "{{ cookiecutter.project_slug }}")
            new_fname = new_fname.replace(PKG, "{{ cookiecutter.package_name }}")

            # Transform file contents
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    content = f.read()
            except UnicodeDecodeError:
                continue

            # Replace occurrences
            content = content.replace(SLUG, "{{ cookiecutter.project_slug }}")
            content = content.replace(PKG, "{{ cookiecutter.package_name }}")
            # Python imports
            content = re.sub(rf"from\s+{re.escape(PKG)}\b", r"from {{ cookiecutter.package_name }}", content)
            content = re.sub(rf"import\s+{re.escape(PKG)}\b", r"import {{ cookiecutter.package_name }}", content)

            with open(fpath, "w", encoding="utf-8") as f:
                f.write(content)

            if new_fname != fname:
                os.rename(fpath, os.path.join(dirpath, new_fname))

if __name__ == "__main__":
    transform(sys.argv[1])
