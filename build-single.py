#!/usr/bin/env python3
"""
Fabrique carnet.html : une version en un seul fichier de l'application,
utile pour l'envoyer par message, la garder hors ligne, ou la publier
la ou l'on ne peut pas deposer un dossier entier.

L'application de reference reste index.html plus le dossier assets/.
Ce script ne fait que recopier les feuilles de style et les scripts
a l'interieur du HTML. Il n'y a donc jamais deux versions a maintenir.

    python3 build-single.py
"""

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "index.html"
OUT = ROOT / "carnet.html"


def read(p):
    return (ROOT / p).read_text(encoding="utf-8")


def main():
    html = read("index.html")

    # feuilles de style
    def css(m):
        return "<style>\n" + read(m.group(1)) + "\n</style>"

    html, n_css = re.subn(
        r'<link rel="stylesheet" href="([^"]+)">', css, html
    )

    # scripts
    def js(m):
        return "<script>\n" + read(m.group(1)) + "\n</script>"

    html, n_js = re.subn(
        r'<script src="([^"]+)"></script>', js, html
    )

    html = html.replace(
        "<title>Slovenie 2026 - tableau de bord</title>",
        "<title>Slovenie 2026 - tableau de bord</title>\n"
        "<!-- Fichier genere par build-single.py. Ne pas editer a la main :\n"
        "     modifiez index.html et assets/, puis relancez le script. -->",
    )

    OUT.write_text(html, encoding="utf-8")
    print(f"carnet.html ecrit : {n_css} feuille(s) de style et {n_js} script(s) integres, "
          f"{len(html) // 1024} Ko")
    return 0


if __name__ == "__main__":
    sys.exit(main())
