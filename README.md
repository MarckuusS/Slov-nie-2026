# Carnet de voyage - Slovénie 2026

**Du lundi 7 au dimanche 13 septembre 2026** - 7 jours, 6 nuits - 2 personnes - voiture de location - budget cible 600 € / personne hors vol.

---

## L'application

Le coeur du projet est un **tableau de bord de voyage** : `index.html` plus le dossier `assets/`.
Il se consulte au téléphone, pendant le voyage.

- **Carte** avec le tracé de la journée, les étapes numérotées et le circuit complet des 7 jours.
  Quatre fonds au choix : Plan (OpenStreetMap), Relief (OpenTopoMap), Satellite (Esri) et Fond uni.
  La carte se replié pour lire l'itinéraire en plein écran, et s'ouvre en plein écran pour lire la carte.
- **Itinéraires routiers réels** : le tracé suit les vraies routes, pas une ligne droite. La géométrie
  vient d'OSRM, le moteur d'itinéraire d'OpenStreetMap. Elle est calculée une fois puis gardée sur
  l'appareil, donc ça marché ensuite sans reseau. Un tronçon en pointille n'a pas encore été calculé.
  Le bouton "Exporter les tracés" de l'onglet Carte permet de les figer dans `assets/routes.js` :
  une fois ce fichier commite, l'application ne fait plus aucun appel reseau pour les routes.
- **Horaire calculé** : heure d'arrivée, temps sur place, temps de route vers l'étape suivante. Changez l'heure de départ, toute la journée se recalculé
- **Liens directs** vers la fiche Google Maps, la navigation Waze, les avis Tripadvisor et le site officiel de chaque étape
- **Simulateur de budget** et **suivi des dépenses** face à la cible de 600 €
- **Guide** (randonnées, hébergements, conduite, météo, plan B pluie, slovène) et **valise** à cocher
- **Carte hors ligne** : les tuiles déjà affichées sont gardées automatiquement, et un bouton
  télécharge d'un coup tout le corridor du voyage. À faire en wifi avant de partir, pour ne pas
  être aveugle dans la vallée de la Soca ou sur le Vrsic.
- **Installable** : bouton Partager sur iPhone, puis "Sur l'écran d'accueil". L'application s'ouvre
  alors en plein écran, avec son icône, sans la barre Safari.
- Le jour en cours s'ouvre tout seul pendant le voyage, avec un compte à rebours avant le départ

### Publier l'application sur GitHub Pages

Un site web n'a pas de fichier "main" : son point d'entrée est **`index.html`**, à la racine.
GitHub Pages le sert automatiquement. Il n'y a donc rien à renommer ni à ajouter pour cela.

Le fichier qui déclenche la publication, lui, est **`.github/workflows/pages.yml`**. Il est déjà la.

1. Dans le dépôt : **Settings** puis **Pages**
2. Dans **Source**, choisissez **GitHub Actions** (et non "Deploy from à branch")
3. C'est tout. Le prochain push publié le site.

Pour publier sans attendre un push : onglet **Actions**, workflow **Publier sur GitHub Pages**,
bouton **Run workflow**. L'adresse du site s'affiche à la fin du job, et vaut

```
https://marckuuss.github.io/Slov-nie-2026/
```

Le dépôt ne contient que des fichiers statiques : ni build, ni dépendance, ni compte à créer.
Le fichier `.nojekyll` évite que GitHub ne retraite le dossier `assets/`.

**Variante sans workflow.** Si vous préférez le mode classique : **Settings** puis **Pages**,
**Source** sur **Deploy from à branch**, branche `claude/slovenie-travel-itinerary-krkcha`
(c'est la branche par défaut du dépôt), dossier `/ (root)`. Le résultat est le même, mais la
publication n'est plus automatique à chaque push.

### Lancer l'application en local

```
python3 main.py
```

Le script sert le dossier et ouvre le navigateur. Il affiche aussi une adresse reseau
du type `http://192.168.x.x:8080/` : tapez-la dans Safari sur l'iPhone, connecte au même
wifi, pour essayer l'application sur le téléphone avant le départ. Aucune dépendance,
uniquement la bibliotheque standard de Python.

Ouvrir `index.html` par un double clic fonctionne aussi, mais passer par `main.py` est plus
fidèle à ce que fera GitHub Pages.

### La version en un seul fichier

`carnet.html` est la même application avec les styles et les scripts intégrés, pratique pour
l'envoyer par message ou la garder hors ligne. Elle est **générée**, ne la modifiez pas à la main :

```
python3 build-single.py
```

Modifiez `index.html` et `assets/`, relancez le script, et les deux versions restent identiques.

---

## Le voyage en un coup d'oeil

Une boucle de 611 km au départ de Ljubljana qui enchaîne exactement ce que vous vouliez :
la rivière et les cascades, la ville, la grotte, la montagne.

```
                    Kranjska Gora
                         |
   Bled --- Bohinj       | col du Vrsic (1611 m)
     \        \          |
      \        \      Trenta / source de la Soca
       \        \        |
        \        \    Bovec --- Kobarid --- Tolmin
         \                                    \
      LJUBLJANA <--- Skocjan (grotte) <--- Idrija
       (retour)
```

| Jour | Date | Programme | Nuit |
|---|---|---|---|
| J1 | lun 7 sept | Arrivée, prise de voiture, lac de Bled, coucher de soleil à Ojstrica | Bled / Bohinjska Bistrica |
| J2 | mar 8 sept | Gorges de Vintgar (rivière), Radovljica, lac de Bohinj, gorge de Mostnica | idem |
| J3 | mer 9 sept | Montagne : Vogel ou rando, cascade de Savica | idem |
| J4 | jeu 10 sept | Lac de Jasna, col du Vrsic, source de la Soca, Velika korita, Boka | Kobarid |
| J5 | ven 11 sept | Cascade de Kozjak, Kobarid, gorges de Tolmin, baignade dans la Soca | Kobarid |
| J6 | sam 12 sept | Idrija, **grottes de Skocjan**, château de Predjama, arrivée à Ljubljana | Ljubljana |
| J7 | dim 13 sept | **Ljubljana** à pied, restitution voiture, vol retour | - |

3 bases seulement, donc 3 valises defaites au lieu de 6.

---

## Sommaire du carnet

La version longue, en markdown, lisible directement sur GitHub. L'application reprend l'essentiel,
ces fichiers gardent le détail.

| Fichier | Contenu |
|---|---|
| [01-avant-le-départ.md](01-avant-le-depart.md) | Retroplanning J-45 à J-1, papiers, vols, location de voiture, ce qu'il faut réserver à l'avance |
| [02-budget.md](02-budget.md) | Budget détaillé à 600 €, tableau des prix réels 2026, leviers d'économie |
| [03-itinéraire.md](03-itineraire.md) | Le jour par jour heure par heure, avec les km et les temps de route |
| [04-bled-et-vintgar.md](04-bled-et-vintgar.md) | Fiche zone : Bled, Vintgar, Radovljica, Pokljuka |
| [05-bohinj-et-montagne.md](05-bohinj-et-montagne.md) | Fiche zone : lac de Bohinj, Savica, Mostnica, Vogel |
| [06-vrsic-et-soca.md](06-vrsic-et-soca.md) | Fiche zone : col du Vrsic, Trenta, Bovec, Kobarid, Tolmin |
| [07-grottes-et-karst.md](07-grottes-et-karst.md) | Fiche zone : Skocjan, Postojna, Predjama, Idrija, variante mer |
| [08-ljubljana.md](08-ljubljana.md) | Fiche ville : parcours à pied, marchés, bons plans |
| [09-randonnées.md](09-randonnees.md) | 12 randos classées par durée et difficulté, avec dénivelés |
| [10-conduite-et-logistique.md](10-conduite-et-logistique.md) | Vignette, code de la route, parkings, carburant, GPS |
| [11-manger-et-courses.md](11-manger-et-courses.md) | Spécialités à goûter, supermarches, budget repas, adresses |
| [12-hébergements.md](12-hebergements.md) | Où dormir dans chaque base, fourchettes de prix, plateformes |
| [13-valise-et-santé.md](13-valise-et-sante.md) | Liste de valise complète, météo de septembre, santé, urgences |
| [14-plan-b-météo.md](14-plan-b-meteo.md) | Que faire s'il pleut, journée par journée |
| [15-slovène-de-survie.md](15-slovene-de-survie.md) | Prononciation et 80 mots utiles |
| [16-carnet-de-bord.md](16-carnet-de-bord.md) | Pages à remplir sur place : journal, dépenses, souvenirs |

| Fichier de l'application | Role |
|---|---|
| `index.html` | **Le point d'entrée.** C'est ce que GitHub Pages sert à la racine. |
| `.github/workflows/pages.yml` | Publié le site à chaque push, une fois Pages règle sur GitHub Actions |
| `main.py` | Lance le site en local et donne l'adresse à ouvrir sur l'iPhone |
| `assets/data.js` | Toutes les données du voyage : étapes, coordonnées, temps de route, prix |
| `assets/map.js` | Le moteur de carte : tuiles, fonds, tracé, marqueurs, gestes tactiles |
| `assets/router.js` | Récupération et mise en cache des itinéraires routiers réels |
| `assets/routes.js` | Tracés figés. Vide au départ, à remplacer par l'export de l'onglet Carte. |
| `sw.js` | Service worker : cache de l'application et des tuiles de carte |
| `manifest.webmanifest` | Nom, icônes et couleurs quand l'application est installée |
| `assets/icon-*.png` | Icônes. Safari sur iPhone n'accepte que du PNG pour l'écran d'accueil. |
| `tools/make-icons.py` | Régénère les icônes, sans dépendance |
| `tools/accents.py` | Restaure les accents français dans tout le dépôt |
| `assets/app.js` | Le calcul des horaires, le budget, le rendu |
| `assets/app.css` | La feuille de style |
| `carnet.html` | Version en un seul fichier, générée par `build-single.py` |

---

## Les 10 règles d'or de ce voyage

1. **Réservez la voiture maintenant.** C'est le seul poste qui double si vous attendez. Une petite citadine suffit largement.
2. **Vérifiez que la vignette autoroute est incluse** dans la location. Sur une voiture louee en Slovénie, elle l'est presque toujours. Si ce n'est pas le cas : 16 € pour 7 jours sur evinjeta.dars.si, sinon 300 € d'amende.
3. **Partez tôt.** 8h sur un site slovène, c'est le calme. 11h, c'est la foule. Vous gagnerez plus en vous levant à 7h qu'en depensant 100 €.
4. **Vintgar se réservé en ligne** avec un créneau horaire. C'est la seule réservation vraiment indispensable du séjour.
5. **Skocjan plutôt que Postojna.** Moins cher (24 € contre 30,90 €), infiniment plus spectaculaire, et pas de petit train touristique.
6. **Payez en carte partout**, gardez 50 € en especes pour les parkings de vallée, les fermés et les refuges.
7. **L'eau du robinet est excellente** dans tout le pays. Deux gourdes = 40 € economises sur la semaine.
8. **Les magasins ferment le dimanche.** Faites vos courses le samedi 12 avant d'arriver à Ljubljana.
9. **La météo alpine change en 2 heures.** Consultez l'appli ARSO Vreme chaque soir et gardez le [plan B](14-plan-b-meteo.md) sous la main.
10. **Ne surchargez pas.** Ce carnet propose plus que ce que vous ferez. Choisissez 2 choses par jour, pas 5.

---

## Contacts et numéros d'urgence

| Quoi | Numéro |
|---|---|
| Urgences européennes (SAMU, pompiers, secours en montagne) | **112** |
| Police | **113** |
| Depannage routier AMZS | **1987** |
| Ambassade de France en Slovénie (Ljubljana) | **+386 1 479 04 00** |
| Info routière DARS | **1970** |

---

## Note sur l'écriture des noms

Les noms de lieux sont écrits **sans les accents slovènes** (Skocjan, Soca, Vrsic, Ceska koca...)
pour que vous puissiez les taper directement dans un GPS ou un moteur de recherche sans galerer.
Sur place, vous les verrez écrits avec des accents sur les panneaux : c'est bien le même endroit.
