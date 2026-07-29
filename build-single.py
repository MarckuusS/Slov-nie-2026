#!/usr/bin/env python3
"""
Fabrique carnet.html : une version en un seul fichier de l'application,
utile pour l'envoyer par message, la garder hors ligne, où la publier
là où l'on ne peut pas deposer un dossier entier.

L'application de référence reste index.html plus le dossier assets/.
Ce script ne fait que recopier les feuilles de style et les scripts
à l'intérieur du HTML. Il n'y a donc jamais deux versions à maintenir.

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
        "<title>Slovénie 2026 - tableau de bord</title>",
        "<title>Slovénie 2026 - tableau de bord</title>\n"
        "<!-- Fichier généré par build-single.py. Ne pas editer à la main :\n"
        "     modifiez index.html et assets/, puis relancez le script. -->",
    )

    OUT.write_text(html, encoding="utf-8")
    print(f"carnet.html écrit : {n_css} feuille(s) de style et {n_js} script(s) intégrés, "
          f"{len(html) // 1024} Ko")
    return 0


if __name__ == "__main__":
    sys.exit(main())
