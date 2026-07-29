#!/usr/bin/env python3
"""
Lance le tableau de bord du voyage en local.

    python3 main.py

Le script sert le dossier, ouvre le navigateur, et affiche en plus une
adresse reseau : tapez-la dans Safari sur l'iPhone, connecte au meme
wifi, pour essayer l'application sur le telephone avant le depart.

Aucune dependance : uniquement la bibliotheque standard de Python 3.

Rappel : ce fichier n'est pas necessaire pour publier sur GitHub Pages.
Un site web n'a pas de fichier "main", son point d'entree est index.html,
et le deploiement est fait par .github/workflows/pages.yml.
"""

import argparse
import contextlib
import functools
import http.server
import pathlib
import socket
import socketserver
import sys
import threading
import webbrowser

RACINE = pathlib.Path(__file__).parent.resolve()
PORT_DEFAUT = 8080


class Serveur(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


class Handler(http.server.SimpleHTTPRequestHandler):
    """Sert les fichiers sans cache, pour voir les modifications tout de suite."""

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def log_message(self, fmt, *args):
        code = args[1] if len(args) > 1 else ""
        chemin = args[0] if args else ""
        if str(code).startswith("4") or str(code).startswith("5"):
            print(f"  {code}  {chemin}")


def ip_locale():
    """Adresse du poste sur le reseau local, pour ouvrir depuis le telephone."""
    with contextlib.closing(socket.socket(socket.AF_INET, socket.SOCK_DGRAM)) as s:
        try:
            s.connect(("192.168.1.1", 1))
            return s.getsockname()[0]
        except OSError:
            return None


def port_libre(depart, essais=20):
    for p in range(depart, depart + essais):
        with contextlib.closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            if s.connect_ex(("127.0.0.1", p)) != 0:
                return p
    return None


def verifier():
    manquants = [
        f for f in ("index.html", "assets/app.js", "assets/app.css", "assets/data.js", "assets/map.js")
        if not (RACINE / f).exists()
    ]
    if manquants:
        print("Fichiers manquants : " + ", ".join(manquants))
        print("Lancez le script depuis la racine du depot.")
        return False
    return True


def main():
    ap = argparse.ArgumentParser(description="Lance le carnet de voyage en local.")
    ap.add_argument("-p", "--port", type=int, default=PORT_DEFAUT, help=f"port d'ecoute (defaut {PORT_DEFAUT})")
    ap.add_argument("-n", "--no-browser", action="store_true", help="ne pas ouvrir le navigateur")
    args = ap.parse_args()

    if not verifier():
        return 1

    port = port_libre(args.port)
    if port is None:
        print(f"Aucun port libre entre {args.port} et {args.port + 19}.")
        return 1
    if port != args.port:
        print(f"Le port {args.port} est occupe, on prend le {port}.")

    handler = functools.partial(Handler, directory=str(RACINE))

    with Serveur(("0.0.0.0", port), handler) as httpd:
        local = f"http://localhost:{port}/"
        ip = ip_locale()

        print()
        print("  Carnet de voyage Slovenie 2026")
        print("  " + "-" * 44)
        print(f"  Sur cet ordinateur : {local}")
        if ip:
            print(f"  Sur l'iPhone       : http://{ip}:{port}/")
            print("                       (meme wifi ; bouton Partager,")
            print("                        puis Sur l'ecran d'accueil)")
        print()
        print("  Ctrl+C pour arreter.")
        print()

        if not args.no_browser:
            threading.Timer(0.6, lambda: webbrowser.open(local)).start()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  Arret.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
