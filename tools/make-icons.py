#!/usr/bin/env python3
"""
Génère les icônes de l'application, en PNG.

    python3 tools/make-icons.py

Pourquoi des PNG et pas un SVG : Safari sur iPhone n'accepte que du PNG
pour `apple-touch-icon`. Un SVG, même parfaitement valide, donne une
icône vide sur l'écran d'accueil. C'était le bug.

Le motif est la marque de Knafelc, le balisage des sentiers slovènes :
un anneau rouge à centre clair, peint sur chaque rocher du pays.

Aucune dépendance : l'encodeur PNG tient en une trentaine de lignes,
avec zlib de la bibliothèque standard.
"""

import pathlib
import struct
import sys
import zlib

RACINE = pathlib.Path(__file__).resolve().parent.parent
SORTIE = RACINE / "assets"

FOND = (0x12, 0x20, 0x1C)        # vert épicéa très sombre
ANNEAU = (0xC4, 0x40, 0x2F)      # le rouge du balisage
CENTRE = (0xF1, 0xF4, 0xEF)      # le calcaire

SS = 4                            # suréchantillonnage, pour lisser les bords


def png(pixels, w, h):
    """Encode une image RGB en PNG, sans dépendance."""
    brut = b"".join(
        b"\x00" + b"".join(bytes(pixels[y * w + x]) for x in range(w))
        for y in range(h)
    )

    def chunk(typ, data):
        c = typ + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(brut, 9))
        + chunk(b"IEND", b"")
    )


def dessiner(taille):
    """Le balisage, dessiné en suréchantillonné puis moyenné."""
    grand = taille * SS
    centre = grand / 2.0
    r_anneau = grand * 0.345
    r_centre = grand * 0.125

    # accumulateurs pour la moyenne
    acc = [[0, 0, 0] for _ in range(taille * taille)]

    for gy in range(grand):
        dy = gy + 0.5 - centre
        for gx in range(grand):
            dx = gx + 0.5 - centre
            d2 = dx * dx + dy * dy
            if d2 <= r_centre * r_centre:
                col = CENTRE
            elif d2 <= r_anneau * r_anneau:
                col = ANNEAU
            else:
                col = FOND
            i = (gy // SS) * taille + (gx // SS)
            acc[i][0] += col[0]
            acc[i][1] += col[1]
            acc[i][2] += col[2]

    n = SS * SS
    return [(a[0] // n, a[1] // n, a[2] // n) for a in acc]


def main():
    SORTIE.mkdir(exist_ok=True)
    for taille, nom in [(180, "icon-180.png"), (192, "icon-192.png"),
                        (512, "icon-512.png"), (32, "icon-32.png")]:
        data = png(dessiner(taille), taille, taille)
        (SORTIE / nom).write_bytes(data)
        print(f"  {nom:<16} {taille}x{taille}  {len(data) // 1024 or 1} Ko")
    return 0


if __name__ == "__main__":
    sys.exit(main())
