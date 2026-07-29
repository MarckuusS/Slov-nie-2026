#!/usr/bin/env python3
"""
Restaure les accents français dans tout le dépôt.

    python3 tools/accents.py --check     liste ce qui serait changé
    python3 tools/accents.py --fix       applique

Pourquoi ce script existe : la première version du carnet avait été
écrite sans accents, ce qui n'a jamais été demandé et fait amateur.

Le point délicat est de ne toucher qu'au texte lisible, jamais au code.
Un identifiant comme `off-etat`, une classe `mm-line` ou une variable
`a` doivent rester tels quels, sinon l'application casse. La protection
se fait par type de fichier :

  .md    tout le texte, sauf les blocs de code, le code en ligne,
         les cibles de liens et les URL
  .js    seulement l'intérieur des chaînes et des commentaires, et
         dans les chaînes, hors valeurs d'attributs HTML, sélecteurs
         CSS et URL
  .css   seulement les commentaires
  .py    seulement les commentaires, docstrings et chaînes affichées
  .html  seulement le texte entre balises, plus quelques attributs
         explicitement lisibles (title, content, aria-label, alt)
"""

import argparse
import pathlib
import re
import sys

RACINE = pathlib.Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------- mots
# Formes non ambiguës : le mot sans accent n'existe pas en français,
# ou pas dans ce corpus.
MOTS = {
    "antipaludeen": "antipaludéen", "bapteme": "baptême", "biere": "bière",
    "bieres": "bières", "blesses": "blessés", "cavite": "cavité",
    "cavites": "cavités", "centimetre": "centimètre", "comite": "comité",
    "complement": "complément", "concernes": "concernés", "concretement": "concrètement",
    "concret": "concret", "concrete": "concrète", "contrariete": "contrariété",
    "crete": "crête", "cretes": "crêtes", "creme": "crème", "cremes": "crèmes",
    "accoles": "accolés", "affiches": "affichés", "coinces": "coincés",
    "calcules": "calculés", "calcule": "calculé", "extreme": "extrême",
    "extremes": "extrêmes", "discrete": "discrète", "reglee": "réglée",
    "matiere": "matière", "carriere": "carrière", "cimetiere": "cimetière",
    "modele": "modèle", "modeles": "modèles", "celebration": "célébration",
    "deuxieme": "deuxième", "troisieme": "troisième", "quatrieme": "quatrième",
    "cinquieme": "cinquième", "sixieme": "sixième", "douzieme": "douzième",
    "systemes": "systèmes", "acheve": "achevé", "achevee": "achevée",
    "pietonne": "piétonne", "piete": "piété", "sculptee": "sculptée",
    "reveil": "réveil", "sechee": "séchée", "trempe": "trempé",
    "amenagement": "aménagement", "amenagements": "aménagements",
    "hectare": "hectare", "hectares": "hectares", "orage": "orage",
    "orages": "orages", "elan": "élan", "eventail": "éventail",
    "etriers": "étriers", "eveille": "éveillé", "epais": "épais",
    "arrivees": "arrivées", "departs": "départs", "reparti": "réparti",
    "ferre": "ferré", "ferree": "ferrée", "gele": "gelé", "gelee": "gelée",
    "slovenie": "Slovénie", "slovene": "slovène", "slovenes": "slovènes",
    "europeen": "européen", "europeenne": "européenne",
    "europeennes": "européennes", "europeens": "européens",
    "mediterranee": "Méditerranée", "hongroise": "hongroise",
    "autrichienne": "autrichienne", "genes": "Gênes",
    "abimee": "abîmée", "activite": "activité", "activites": "activités",
    "adaptee": "adaptée", "adaptes": "adaptés", "affichee": "affichée",
    "affichees": "affichées", "ajoutee": "ajoutée", "ajoutees": "ajoutées",
    "ajoutes": "ajoutés", "aout": "août", "appele": "appelé", "appelee": "appelée",
    "appreciee": "appréciée", "assiegee": "assiégée", "assurez": "assurez",
    "beaute": "beauté", "brulant": "brûlant", "brule": "brûlé",
    "capacite": "capacité", "chaine": "chaîne", "chaines": "chaînes",
    "charge": "chargé", "chargee": "chargée", "chargees": "chargées",
    "chauffee": "chauffée", "chauffees": "chauffées", "cite": "cité",
    "commande": "commande", "commandee": "commandée", "conseillee": "conseillée",
    "conserve": "conservé", "consideree": "considérée", "couverte": "couverte",
    "creneau": "créneau", "creneaux": "créneaux", "curiosite": "curiosité",
    "debut": "début", "debuts": "débuts", "declaree": "déclarée",
    "declare": "déclaré", "decoupe": "découpé", "dedie": "dédié",
    "dediee": "dédiée", "degre": "degré", "degres": "degrés",
    "demarrent": "démarrent", "depassement": "dépassement", "deposee": "déposée",
    "desservie": "desservie", "detruit": "détruit", "developpement": "développement",
    "dispersee": "dispersée", "dresse": "dressé", "eau": "eau",
    "economie": "économie", "economies": "économies", "economique": "économique",
    "economiser": "économiser", "economisees": "économisées",
    "electricite": "électricité", "eloignee": "éloignée", "emmene": "emmène",
    "empruntee": "empruntée", "encadre": "encadré", "encadree": "encadrée",
    "endemique": "endémique", "enterre": "enterré", "envoyee": "envoyée",
    "epuise": "épuisé", "esperer": "espérer", "etendu": "étendu",
    "etudier": "étudier", "evacuation": "évacuation", "evenement": "événement",
    "evenements": "événements", "evitent": "évitent", "exploitee": "exploitée",
    "facilite": "facilité", "faconnee": "façonnée", "fatiguee": "fatiguée",
    "fatiguees": "fatiguées", "ferry": "ferry", "financee": "financée",
    "fondee": "fondée", "francais": "français", "francaise": "française",
    "francaises": "françaises", "fusionne": "fusionné", "fusionnes": "fusionnés",
    "generation": "génération", "gere": "géré", "geree": "gérée",
    "gerees": "gérées", "gerer": "gérer", "glissee": "glissée",
    "humidite": "humidité", "identite": "identité", "illimite": "illimité",
    "illimitee": "illimitée", "immensite": "immensité", "installe": "installé",
    "intensite": "intensité", "interessee": "intéressée", "invitee": "invitée",
    "isolee": "isolée", "isolees": "isolées", "journee": "journée",
    "journees": "journées", "liberte": "liberté", "limite": "limité",
    "majorite": "majorité", "marquee": "marquée", "marquees": "marquées",
    "mediocre": "médiocre", "mele": "mêlé", "melee": "mêlée",
    "mentionnee": "mentionnée", "meritee": "méritée", "modifiee": "modifiée",
    "montagne": "montagne", "nettoyee": "nettoyée", "nommee": "nommée",
    "nouveaute": "nouveauté", "obscurite": "obscurité", "occupee": "occupée",
    "ordonnee": "ordonnée", "organisation": "organisation", "orientee": "orientée",
    "ouverte": "ouverte", "peage": "péage", "peages": "péages",
    "penetrer": "pénétrer", "percee": "percée", "perchee": "perchée",
    "perchees": "perchées", "placee": "placée", "plutot": "plutôt",
    "portee": "portée", "possibilite": "possibilité", "poussee": "poussée",
    "prepayee": "prépayée", "prepaye": "prépayé", "presentee": "présentée",
    "prive": "privé", "privee": "privée", "prolongee": "prolongée",
    "proposee": "proposée", "protegee": "protégée", "proximite": "proximité",
    "publiques": "publiques", "rapidite": "rapidité", "rarete": "rareté",
    "recolte": "récolté", "recompensee": "récompensée", "redigee": "rédigée",
    "reduites": "réduites", "regulee": "régulée", "relevee": "relevée",
    "rempli": "rempli", "remplie": "remplie", "renouvelee": "renouvelée",
    "reparee": "réparée", "repartie": "répartie", "respectee": "respectée",
    "responsabilite": "responsabilité", "reveille": "réveillé",
    "sacree": "sacrée", "salee": "salée", "sculpte": "sculpté",
    "signalement": "signalement", "simplicite": "simplicité", "situe": "situé",
    "soignee": "soignée", "sonorite": "sonorité", "sortie": "sortie",
    "specialisee": "spécialisée", "suffisamment": "suffisamment",
    "surcout": "surcoût", "suspendue": "suspendue", "tete": "tête",
    "tetes": "têtes", "tot": "tôt", "traversee": "traversée",
    "utilite": "utilité", "validite": "validité", "video": "vidéo",
    "videos": "vidéos", "visibilite": "visibilité", "visitee": "visitée",
    "voila": "voilà", "yougoslave": "yougoslave",
    "acces": "accès", "accrochee": "accrochée", "accrochees": "accrochées",
    "accroches": "accrochés", "achete": "acheté", "achetee": "achetée",
    "adherence": "adhérence", "aeroport": "aéroport",
    "agglomeration": "agglomération", "agreable": "agréable",
    "alcoolemie": "alcoolémie", "alcoolise": "alcoolisé",
    "alcoolisee": "alcoolisée", "allee": "allée", "amenage": "aménagé",
    "amenagee": "aménagée", "amenagees": "aménagées", "amenages": "aménagés",
    "annee": "année", "annees": "années", "annoncee": "annoncée",
    "apres": "après", "arretez": "arrêtez", "arret": "arrêt",
    "arrets": "arrêts", "arrete": "arrêté", "arreter": "arrêter",
    "arrivee": "arrivée", "assiegeants": "assiégeants", "assurez": "assurez",
    "atteler": "atteler", "authentique": "authentique",
    "batie": "bâtie", "bati": "bâti", "beton": "béton",
    "bles": "blés", "boulangerie": "boulangerie",
    "cablees": "câblées", "cables": "câbles", "calcaire": "calcaire",
    "capitale": "capitale", "carniole": "Carniole", "categorie": "catégorie",
    "cathedrale": "cathédrale", "celebre": "célèbre", "celebres": "célèbres",
    "cerne": "cerné", "cernee": "cernée", "chataigne": "châtaigne",
    "chateau": "château", "chateaux": "châteaux", "chere": "chère",
    "cheres": "chères", "cle": "clé", "cles": "clés",
    "climatisee": "climatisée", "coeur": "coeur", "coincee": "coincée",
    "coince": "coincé", "colle": "collé", "collee": "collée",
    "commence": "commence", "commencent": "commencent",
    "complet": "complet", "complete": "complète", "completement": "complètement",
    "comprend": "comprend", "concu": "conçu", "concue": "conçue",
    "confiance": "confiance", "considere": "considéré",
    "consideree": "considérée", "controle": "contrôle", "controles": "contrôles",
    "controler": "contrôler", "conservee": "conservée",
    "cout": "coût", "couts": "coûts", "coute": "coûte", "coutent": "coûtent",
    "coutera": "coûtera", "couterait": "coûterait", "couteux": "coûteux",
    "creee": "créée", "cree": "créé", "creer": "créer", "creuse": "creusé",
    "creusee": "creusée", "critere": "critère", "criteres": "critères",
    "declenche": "déclenche", "declenchement": "déclenchement",
    "declencher": "déclencher", "decouvre": "découvre",
    "decouverte": "découverte", "decrit": "décrit", "decrivez": "décrivez",
    "decu": "déçu", "dedans": "dedans", "defaire": "défaire",
    "defaut": "défaut", "definie": "définie", "definies": "définies",
    "definir": "définir", "defiler": "défiler", "degage": "dégagé",
    "degagee": "dégagée", "degradee": "dégradée", "degradees": "dégradées",
    "dehors": "dehors", "dejeuner": "déjeuner", "deja": "déjà",
    "delai": "délai", "delicieux": "délicieux", "demandee": "demandée",
    "demande": "demande", "demarrage": "démarrage", "demarrer": "démarrer",
    "denivele": "dénivelé", "deniveles": "dénivelés", "depart": "départ",
    "departs": "départs", "depasse": "dépassé", "depassez": "dépassez",
    "depend": "dépend", "dependante": "dépendante", "dependance": "dépendance",
    "dependances": "dépendances", "dependre": "dépendre",
    "depense": "dépense", "depenses": "dépenses", "depenser": "dépenser",
    "depensees": "dépensées", "deplacement": "déplacement",
    "deploiement": "déploiement", "deployer": "déployer", "depot": "dépôt",
    "derapez": "dérapez", "derniere": "dernière",
    "dernieres": "dernières", "deroute": "déroute", "desactiver": "désactiver",
    "desature": "désature", "desaturation": "désaturation",
    "desaturee": "désaturée", "descendez": "descendez",
    "desesperez": "désespérez", "desormais": "désormais",
    "detail": "détail", "details": "détails", "detaille": "détaillé",
    "detaillee": "détaillée", "determine": "détermine", "developpe": "développé",
    "differe": "diffère", "different": "différent", "differente": "différente",
    "differentes": "différentes", "differents": "différents",
    "difficulte": "difficulté", "difficultes": "difficultés",
    "diner": "dîner", "diners": "dîners", "discretion": "discrétion",
    "distancie": "distancié", "donnee": "donnée", "donnees": "données",
    "duree": "durée", "durees": "durées", "ecart": "écart", "ecarts": "écarts",
    "ecarte": "écarté", "ecartees": "écartées", "ecartes": "écartés",
    "echange": "échange", "echec": "échec", "echecs": "échecs",
    "echelle": "échelle", "echantillon": "échantillon",
    "echantillonne": "échantillonné", "eclairage": "éclairage",
    "eclaires": "éclairés", "ecole": "école", "ecologique": "écologique",
    "ecran": "écran", "ecrans": "écrans", "ecrire": "écrire", "ecrit": "écrit",
    "ecrite": "écrite", "ecrites": "écrites", "ecrits": "écrits",
    "ecriture": "écriture", "ecrivez": "écrivez", "edifice": "édifice",
    "egalement": "également", "eglise": "église", "eglises": "églises",
    "elargir": "élargir", "electrique": "électrique",
    "electriques": "électriques", "element": "élément", "elements": "éléments",
    "elephant": "éléphant", "eleve": "élevé", "elevee": "élevée",
    "eleves": "élevés", "eloignes": "éloignés", "emblematique": "emblématique",
    "embleme": "emblème", "emergence": "émergence", "emeraude": "émeraude",
    "emouvant": "émouvant", "emporte": "emporté", "emportez": "emportez",
    "encaissees": "encaissées", "enchainement": "enchaînement",
    "enchainez": "enchaînez", "enchaine": "enchaîne", "encombrante": "encombrante",
    "energie": "énergie", "enorme": "énorme", "enseigne": "enseigne",
    "ensevelis": "ensevelis", "entierement": "entièrement",
    "entiere": "entière", "entree": "entrée", "entrees": "entrées",
    "epais": "épais", "epaisse": "épaisse", "epicea": "épicéa",
    "epoque": "époque", "epure": "épuré", "epuree": "épurée",
    "equipe": "équipé", "equipee": "équipée", "equipement": "équipement",
    "equipements": "équipements", "equilibre": "équilibre",
    "equivalent": "équivalent", "equivalente": "équivalente",
    "eloigne": "éloigné", "escalier": "escalier", "escaliers": "escaliers",
    "essayez": "essayez", "etaient": "étaient", "etait": "était",
    "etant": "étant", "etape": "étape", "etapes": "étapes", "etat": "état",
    "etats": "états", "ete": "été", "eteindre": "éteindre",
    "etendue": "étendue", "etoile": "étoile", "etoiles": "étoiles",
    "etrange": "étrange", "etranger": "étranger", "etrangers": "étrangers",
    "etre": "être", "etroit": "étroit", "etroite": "étroite",
    "etroites": "étroites", "etroits": "étroits", "etudiant": "étudiant",
    "etudiants": "étudiants", "etude": "étude", "evacuee": "évacuée",
    "eventuellement": "éventuellement", "evidence": "évidence",
    "evident": "évident", "evidente": "évidente", "evite": "évite",
    "eviter": "éviter", "evitez": "évitez", "evoque": "évoque",
    "exigee": "exigée", "experience": "expérience", "exposee": "exposée",
    "exposition": "exposition", "extremement": "extrêmement",
    "extremite": "extrémité", "facade": "façade", "facades": "façades",
    "facon": "façon", "facons": "façons", "faconne": "façonné",
    "federation": "fédération", "fee": "fée", "fer": "fer",
    "ferme": "fermé", "fermee": "fermée", "fermees": "fermées",
    "fermes": "fermés", "fermeture": "fermeture", "fete": "fête",
    "fetes": "fêtes", "fevrier": "février", "fideles": "fidèles",
    "fidele": "fidèle", "figes": "figés", "fige": "figé", "figee": "figée",
    "financer": "financer", "fixee": "fixée", "fixees": "fixées",
    "forcement": "forcément", "foret": "forêt", "forets": "forêts",
    "formee": "formée", "fourchette": "fourchette", "frequentation": "fréquentation",
    "frequente": "fréquenté", "frequentee": "fréquentée",
    "frequentes": "fréquentes", "frequent": "fréquent", "frequente_": "fréquente",
    "frontiere": "frontière", "frontieres": "frontières", "gardee": "gardée",
    "gardees": "gardées", "generalement": "généralement",
    "genere": "généré", "generee": "générée", "generees": "générées",
    "generer": "générer", "genereuses": "généreuses", "genereux": "généreux",
    "generique": "générique", "geographique": "géographique",
    "geographiquement": "géographiquement", "geologie": "géologie",
    "geometrie": "géométrie", "geometrique": "géométrique",
    "glace": "glacé", "glacee": "glacée", "glaciaire": "glaciaire",
    "gouter": "goûter", "goutez": "goûtez", "gout": "goût", "gouts": "goûts",
    "gracieusement": "gracieusement", "guere": "guère", "hebergement": "hébergement",
    "hebergements": "hébergements", "heberge": "héberge", "hesiter": "hésiter",
    "heritee": "héritée", "herite": "hérité", "hetre": "hêtre",
    "hopital": "hôpital", "hopitaux": "hôpitaux", "horaire": "horaire",
    "horaires": "horaires", "hotel": "hôtel", "hotels": "hôtels",
    "hote": "hôte", "hotes": "hôtes", "ideal": "idéal", "ideale": "idéale",
    "identique": "identique", "immatricule": "immatriculé",
    "immatriculee": "immatriculée", "impermeable": "imperméable",
    "impressionnante": "impressionnante", "imprevu": "imprévu",
    "imprevus": "imprévus", "incoherences": "incohérences",
    "inclus": "inclus", "incluse": "incluse", "incrustee": "incrustée",
    "indication": "indication", "indispensable": "indispensable",
    "inferieur": "inférieur", "inferieure": "inférieure",
    "informations": "informations", "inseree": "insérée", "inserer": "insérer",
    "installee": "installée", "instantane": "instantané",
    "integre": "intégré", "integree": "intégrée", "integres": "intégrés",
    "interet": "intérêt", "interets": "intérêts", "interieur": "intérieur",
    "interieure": "intérieure", "interessant": "intéressant",
    "interessante": "intéressante", "interesse": "intéressé",
    "interieurs": "intérieurs", "interroge": "interrogé",
    "interrogee": "interrogée", "invente": "inventé", "inventee": "inventée",
    "irreel": "irréel", "irreelle": "irréelle", "irregulier": "irrégulier",
    "irreguliere": "irrégulière", "itineraire": "itinéraire",
    "itineraires": "itinéraires", "jusqu": "jusqu", "kilometre": "kilomètre",
    "kilometres": "kilomètres", "kilometrage": "kilométrage",
    "legende": "légende", "legendes": "légendes", "leger": "léger",
    "legere": "légère", "legerement": "légèrement", "legeres": "légères",
    "legers": "légers", "legumes": "légumes", "levee": "levée",
    "libere": "libère", "limitee": "limitée", "lisibilite": "lisibilité",
    "litige": "litige", "litteralement": "littéralement",
    "litteraire": "littéraire", "localite": "localité", "logee": "logée",
    "longee": "longée", "lumiere": "lumière", "lumieres": "lumières",
    "maniere": "manière", "manieres": "manières", "marche": "marche",
    "materiel": "matériel", "materiels": "matériels", "matinee": "matinée",
    "medecin": "médecin", "medicament": "médicament",
    "medicaments": "médicaments", "medieval": "médiéval",
    "medievale": "médiévale", "medievales": "médiévales",
    "mediterraneen": "méditerranéen", "meilleur": "meilleur",
    "melange": "mélange", "meme": "même", "memes": "mêmes",
    "memoire": "mémoire", "memorise": "mémorisé", "memorisee": "mémorisée",
    "menage": "ménage", "mene": "mène", "menee": "menée", "mercure": "mercure",
    "meridien": "méridien", "merite": "mérite", "meteo": "météo",
    "metre": "mètre", "metres": "mètres", "methode": "méthode",
    "methodologique": "méthodologique", "metier": "métier", "metiers": "métiers",
    "millefeuille": "millefeuille", "minere": "minère", "modere": "modéré",
    "moderee": "modérée", "moitie": "moitié", "montee": "montée",
    "montees": "montées", "musee": "musée", "musees": "musées",
    "necessaire": "nécessaire", "necessaires": "nécessaires",
    "necessite": "nécessite", "negligeable": "négligeable", "neige": "neige",
    "nettete": "netteté", "niveau": "niveau", "nomme": "nommé",
    "nommee": "nommée", "numerique": "numérique", "numerote": "numéroté",
    "numerotee": "numérotée", "numerotees": "numérotées",
    "numerotes": "numérotés", "numero": "numéro", "numeros": "numéros",
    "operateur": "opérateur", "operation": "opération", "opere": "opère",
    "ordonnance": "ordonnance", "organisee": "organisée",
    "originalite": "originalité", "ossuaire": "ossuaire", "ou_": "où",
    "paien": "païen", "paiement": "paiement", "panoramique": "panoramique",
    "parametre": "paramètre", "parametres": "paramètres",
    "particuliere": "particulière", "particulierement": "particulièrement",
    "passee": "passée", "paves": "pavés", "pave": "pavé", "pavee": "pavée",
    "pavees": "pavées", "penible": "pénible", "penibles": "pénibles",
    "peripherie": "périphérie", "periode": "période", "periodes": "périodes",
    "perimetre": "périmètre", "perime": "périmé", "perimes": "périmés",
    "petrole": "pétrole", "phenomene": "phénomène", "photogenique": "photogénique",
    "pietonnier": "piétonnier", "pietonniere": "piétonnière", "piege": "piège",
    "pieges": "pièges", "pied": "pied", "pierre": "pierre", "piece": "pièce",
    "pieces": "pièces", "plafonne": "plafonné", "plafonnee": "plafonnée",
    "plein": "plein", "poele": "poêle", "poesie": "poésie", "poete": "poète",
    "police": "police", "portee": "portée", "possede": "possède",
    "poste": "poste", "potentiel": "potentiel", "precedent": "précédent",
    "precedente": "précédente", "precis": "précis", "precise": "précise",
    "precisement": "précisément", "precision": "précision",
    "preconise": "préconisé", "prefere": "préfère", "preferez": "préférez",
    "premiere": "première", "premieres": "premières", "prend": "prend",
    "prenez": "prenez", "prepare": "préparé", "preparee": "préparée",
    "preparation": "préparation", "preparatifs": "préparatifs",
    "preparer": "préparer", "prerequis": "prérequis", "presence": "présence",
    "present": "présent", "presente": "présente", "presentes": "présentes",
    "presents": "présents", "presentation": "présentation",
    "presenter": "présenter", "presque": "presque", "pret": "prêt",
    "prete": "prête", "pretes": "prêtes", "prevoir": "prévoir",
    "prevoyez": "prévoyez", "prevu": "prévu", "prevue": "prévue",
    "prevues": "prévues", "prevus": "prévus", "prevision": "prévision",
    "previsions": "prévisions", "priere": "prière", "priorite": "priorité",
    "prisonniers": "prisonniers", "probleme": "problème",
    "problemes": "problèmes", "procedure": "procédure", "proche": "proche",
    "profondeur": "profondeur", "programme": "programme", "prononce": "prononcé",
    "prononcee": "prononcée", "prononciation": "prononciation",
    "propriete": "propriété", "protege": "protégé", "protegee": "protégée",
    "proteges": "protégés", "publiee": "publiée", "publie": "publié",
    "publier": "publier", "publique": "publique", "publiques": "publiques",
    "qualite": "qualité", "quantite": "quantité", "quasiment": "quasiment",
    "quete": "quête", "raide": "raide", "rassemble": "rassemblé",
    "realiste": "réaliste", "realistes": "réalistes", "realise": "réalisé",
    "realisee": "réalisée", "realite": "réalité", "recalcule": "recalculé",
    "recalculee": "recalculée", "recemment": "récemment", "recent": "récent",
    "recente": "récente", "recentes": "récentes", "recents": "récents",
    "recette": "recette", "recherche": "recherche", "recherches": "recherches",
    "recolte": "récolte", "recommande": "recommandé",
    "recommandee": "recommandée", "recompense": "récompense",
    "reconnait": "reconnaît", "reconnaissable": "reconnaissable",
    "recuperation": "récupération", "recuperee": "récupérée", "recuperees": "récupérées",
    "recuperer": "récupérer", "recuperez": "récupérez", "recu": "reçu",
    "recus": "reçus", "redescendre": "redescendre", "redescendues": "redescendues",
    "redige": "rédigé", "redigee": "rédigée", "reduction": "réduction",
    "reductions": "réductions", "reduire": "réduire", "reduit": "réduit",
    "reduite": "réduite", "reel": "réel", "reelle": "réelle",
    "reelles": "réelles", "reels": "réels", "reference": "référence",
    "references": "références", "reflexe": "réflexe", "refuge": "refuge",
    "refuges": "refuges", "regenere": "régénère", "regime": "régime",
    "region": "région", "regions": "régions", "regle": "règle",
    "regles": "règles", "reglage": "réglage", "reglages": "réglages",
    "reglez": "réglez", "regle_": "réglé", "reguliere": "régulière",
    "regulierement": "régulièrement", "regulier": "régulier",
    "regulierement_": "régulièrement", "rejoindre": "rejoindre",
    "releve": "relevé", "relevee": "relevée", "releves": "relevés",
    "remarque": "remarque", "remarques": "remarques", "remboursement": "remboursement",
    "renommee": "renommée", "renonce": "renoncé", "renoncer": "renoncer",
    "renouvelees": "renouvelées", "repaint": "repaint", "repartir": "repartir",
    "repere": "repère", "reperee": "repérée", "repartis": "répartis",
    "repete": "répète", "replie": "replié", "repliee": "repliée",
    "reponde": "réponde", "repondre": "répondre", "repond": "répond",
    "reponse": "réponse", "reponses": "réponses", "reputation": "réputation",
    "repute": "réputé", "reputee": "réputée", "reputees": "réputées",
    "reputes": "réputés", "marche": "marché", "marches": "marchés", "retiree": "retirée",
    "reservation": "réservation",
    "reservations": "réservations", "reserve": "réservé", "reservee": "réservée",
    "reserver": "réserver", "reservez": "réservez", "reserves": "réservés",
    "residentielle": "résidentielle", "residentielles": "résidentielles",
    "resistance": "résistance", "resolution": "résolution", "respecte": "respecté",
    "respectee": "respectée", "resserrees": "resserrées", "restauration": "restauration",
    "restitue": "restitué", "restitution": "restitution", "resultant": "résultant",
    "resultat": "résultat", "resultats": "résultats", "resume": "résumé",
    "resumee": "résumée", "retenu": "retenu", "retenue": "retenue",
    "retiree": "retirée", "retirees": "retirées",
    "retires": "retirés", "retrecit": "rétrécit", "reussi": "réussi",
    "reveil": "réveil", "revele": "révélé", "revelee": "révélée",
    "reverse": "reverse", "revoyez": "revoyez", "rivere": "rivière",
    "riviere": "rivière", "rivieres": "rivières", "rocheuse": "rocheuse",
    "rythme": "rythme", "sante": "santé", "sauvage": "sauvage",
    "sechage": "séchage", "seche": "sèche", "second": "second",
    "secours": "secours", "securite": "sécurité", "sejour": "séjour",
    "sejours": "séjours", "selection": "sélection", "selectionne": "sélectionné",
    "selectionnee": "sélectionnée", "semaine": "semaine", "separe": "séparé",
    "separee": "séparée", "separees": "séparées", "separes": "séparés",
    "septembre": "septembre", "serie": "série", "serree": "serrée",
    "serrees": "serrées", "severe": "sévère", "signale": "signalé",
    "signalee": "signalée", "signalees": "signalées", "signales": "signalés",
    "similaire": "similaire", "simplifie": "simplifié",
    "simplifiee": "simplifiée", "simplifiees": "simplifiées",
    "situee": "située", "situees": "situées", "situe": "situé",
    "societe": "société", "solidarite": "solidarité", "sommee": "sommée",
    "sortee": "sortie", "souterrain": "souterrain", "souterraine": "souterraine",
    "specialement": "spécialement", "specialite": "spécialité",
    "specialites": "spécialités", "specifique": "spécifique",
    "specifiques": "spécifiques", "spectaculaire": "spectaculaire",
    "sperme": "sperme", "stabilite": "stabilité", "stationnement": "stationnement",
    "stockee": "stockée", "strategie": "stratégie", "strategies": "stratégies",
    "successivement": "successivement", "supplement": "supplément",
    "supprime": "supprimé", "supprimee": "supprimée", "supprimer": "supprimer",
    "surelevee": "surélevée", "surechantillonnage": "suréchantillonnage",
    "surechantillonne": "suréchantillonné", "systeme": "système",
    "systemes": "systèmes", "systematique": "systématique",
    "systematiquement": "systématiquement", "taille": "taille",
    "telecabine": "télécabine", "telecharge": "téléchargé",
    "telechargee": "téléchargée", "telechargement": "téléchargement",
    "telecharger": "télécharger", "telechargez": "téléchargez",
    "telephone": "téléphone", "telephones": "téléphones",
    "telepherique": "téléphérique", "telesiege": "télésiège",
    "temperature": "température", "temperatures": "températures",
    "temoin": "témoin", "tenu": "tenu", "tenue": "tenue", "terminee": "terminée",
    "termine": "terminé", "terrasse": "terrasse", "terrasses": "terrasses",
    "territoire": "territoire", "theatre": "théâtre", "theme": "thème",
    "themes": "thèmes", "thermale": "thermale", "thermique": "thermique",
    "tolere": "toléré", "toleree": "tolérée", "totalite": "totalité",
    "traite": "traité", "traitement": "traitement", "trajectoire": "trajectoire",
    "transfere": "transféré", "transmis": "transmis", "transporte": "transporté",
    "traversee": "traversée", "traverse": "traversé", "trempees": "trempées",
    "tres": "très", "troncon": "tronçon", "troncons": "tronçons",
    "trouvee": "trouvée", "unite": "unité", "urgence": "urgence",
    "urgences": "urgences", "utilise": "utilisé", "utilisee": "utilisée",
    "utilisees": "utilisées", "utilises": "utilisés", "vallee": "vallée",
    "vallees": "vallées", "variete": "variété", "vegetarien": "végétarien",
    "vegetarienne": "végétarienne", "vehicule": "véhicule",
    "vehicules": "véhicules", "venitien": "vénitien", "venitienne": "vénitienne",
    "verifie": "vérifié", "verifiee": "vérifiée", "verifiees": "vérifiées",
    "verifies": "vérifiés", "verifier": "vérifier", "verifiez": "vérifiez",
    "verification": "vérification", "veritable": "véritable",
    "verite": "vérité", "vertige": "vertige", "vertigineux": "vertigineux",
    "vetement": "vêtement", "vetements": "vêtements", "vetu": "vêtu",
    "videe": "vidée", "vide": "vide", "vieille": "vieille", "vigilance": "vigilance",
    "visitee": "visitée", "vitesse": "vitesse", "vitesses": "vitesses",
    "voie": "voie", "voies": "voies", "volontairement": "volontairement",
    "zone": "zone", "zones": "zones",
}

# quelques entrées ci-dessus sont des repères sans accent : on les retire
MOTS = {k: v for k, v in MOTS.items() if k != v and not k.endswith("_")}

# --------------------------------------------------- mots ambigus
# "a" est une préposition dans l'immense majorité des cas de ce corpus,
# mais c'est aussi le verbe avoir. On ne convertit pas quand un sujet
# le précède, ni quand un participe passé le suit.
SUJETS_AVANT_A = r"(?:y|il|elle|on|qui|n'y|ca|cela|ce|c'est|qu'il|qu'elle)"
PARTICIPES_APRES_A = (
    r"(?:ete|recu|obtenu|donne|fait|faite|ouvert|change|appartenu|dure|coute|"
    r"atteint|permis|servi|connu|vecu|valu|pris|mis|construit|batie|bati|"
    r"soutenu|recu|inspire|tire|marque|cede|fini|commence|remporte|invente)"
)

# "ou" est "où" quand il introduit un lieu ou un moment.
OU_LIEU = r"(?=\s+(?:dormir|manger|boire|acheter|chercher|se|l'on|le|la|les|il|elle|vous|nous|ca|c'est|est|sont|trouver|aller|passer|garer|faire|loger|voir|j'en|la\b))"

# --------------------------------------------------- application

def remplacer_mots(txt):
    """Ordre important : les mots ambigus se decident sur le texte brut,
    avant que la table generale n'ait accentue leur voisinage."""

    # --- 1. "a" isole : preposition par defaut, verbe si un sujet
    #        precede ou si un participe passe suit ---
    def sub_a(m):
        avant = txt[max(0, m.start() - 24):m.start()]
        apres = txt[m.end():m.end() + 24]
        av = re.findall(r"[\w']+", avant)
        ap = re.findall(r"[\w']+", apres)
        if av and re.fullmatch(SUJETS_AVANT_A, av[-1].lower()):
            return "a"
        if ap and re.fullmatch(PARTICIPES_APRES_A, ap[0].lower()):
            return "a"
        return "à"

    txt = re.sub(r"(?<![\w'\-])a(?![\w\-])", sub_a, txt)
    txt = re.sub(r"jusqu'a\b", "jusqu'à", txt)

    # --- 2. autres mots a deux visages ---
    def garde_casse(rep, orig):
        return rep[0].upper() + rep[1:] if orig[0].isupper() else rep

    # "ou" devient "ou" (lieu) devant un verbe ou un sujet
    txt = re.sub(r"(?<![\w'\-])([Oo]u)(?=\s+(?:dormir|manger|boire|acheter|chercher|"
                 r"trouver|aller|passer|garer|loger|se garer|l'on\b|il y a\b|elle\b))",
                 lambda m: garde_casse("où", m.group(1)), txt)
    txt = re.sub(r"(?<![\w'\-])([Oo]u) est\b", lambda m: garde_casse("où", m.group(1)) + " est", txt)
    txt = re.sub(r"(?<![\w'\-])([Ll]a) où", lambda m: garde_casse("là", m.group(1)) + " où", txt)

    # "cote" : le cote (direction) ou la cote (littoral)
    txt = re.sub(r"\b(la|La|sur la|de la|une) cote\b", lambda m: m.group(1) + " côte", txt)
    txt = re.sub(r"\bcotes\b", "côtes", txt)
    txt = re.sub(r"(?<![\w'\-])([Cc]ote)(?![\w\-])", lambda m: garde_casse("côté", m.group(1)), txt)
    txt = re.sub(r"\bla côté\b", "la côte", txt)

    # "trace" designe toujours le trace dessine sur la carte
    txt = re.sub(r"(?<![\w'\-])([Tt]races?)(?![\w\-])",
                 lambda m: garde_casse("tracés" if m.group(1).lower().endswith("s") else "tracé", m.group(1)), txt)

    # participes passes courants derriere l'auxiliaire
    for verbe, part in [("mange", "mangé"), ("classe", "classé"), ("donne", "donné"),
                        ("passe", "passé"), ("garde", "gardé"), ("change", "changé"),
                        ("laisse", "laissé"), ("trouve", "trouvé"), ("coute", "coûté")]:
        txt = re.sub(r"\b(a|ont|avez|avons|est|sont|ete|été)\s+" + verbe + r"\b",
                     lambda m, p=part: m.group(1) + " " + p, txt)
    txt = re.sub(r"\bclasse (UNESCO|au patrimoine)\b", r"classé \1", txt)
    txt = re.sub(r"\bclassees\b", "classées", txt)

    txt = re.sub(r"\bdes que\b", "dès que", txt)
    txt = re.sub(r"\bdes le\b", "dès le", txt)
    txt = re.sub(r"\b([Dd])es maintenant\b", lambda m: m.group(1) + "ès maintenant", txt)
    txt = re.sub(r"\betre surs?\b", lambda m: m.group(0).replace("etre", "être").replace("sur", "sûr"), txt)
    txt = re.sub(r"\bbien sur\b", "bien sûr", txt)
    txt = re.sub(r"(?<![\w'\-])([Cc]a)(?![\w\-])", lambda m: garde_casse("ça", m.group(1)), txt)

    # --- 3. morphologie reguliere ---
    # -ee / -ees : participes passes feminins, sans exception utile ici
    txt = re.sub(r"(?<![\wÀ-ÿ])([a-zA-Z]{2,}?[bcdfglmnprstvz])ees(?![\wÀ-ÿ])",
                 lambda m: m.group(1) + "ées", txt)
    txt = re.sub(r"(?<![\wÀ-ÿ])([a-zA-Z]{2,}?[bcdfglmnprstvz])ee(?![\wÀ-ÿ])",
                 lambda m: m.group(1) + "ée", txt)
    # -iere / -ieres
    txt = re.sub(r"(?<![\wÀ-ÿ])([a-zA-Z]{2,})ieres?(?![\wÀ-ÿ])",
                 lambda m: m.group(0)[:-len("ieres") if m.group(0).endswith("ieres") else -len("iere")]
                           + ("ières" if m.group(0).endswith("ieres") else "ière"), txt)

    # --- 4. table generale, sans ambiguite ---
    def sub(m):
        mot = m.group(0)
        bas = mot.lower()
        if bas not in MOTS:
            return mot
        rep = MOTS[bas]
        if mot.isupper() and len(mot) > 1:
            return mot            # constante de code, on ne touche pas
        if mot[0].isupper():
            return rep[0].upper() + rep[1:]
        return rep

    txt = re.sub(r"(?<![\w])[A-Za-z]{2,}(?![\w])", sub, txt)
    return txt


# ----------------------------------------------- protection par type

def proteger(txt, motifs):
    """Remplace les zones a proteger par des jetons, et rend la carte."""
    coffre = {}
    def prendre(m):
        cle = "\x00%d\x00" % len(coffre)
        coffre[cle] = m.group(0)
        return cle
    for mo in motifs:
        txt = re.sub(mo, prendre, txt, flags=re.S)
    return txt, coffre


def rendre(txt, coffre):
    for cle, val in coffre.items():
        txt = txt.replace(cle, val)
    return txt


MOTIFS_MD = [
    r"```.*?```",                 # blocs de code
    r"`[^`\n]+`",                 # code en ligne
    r"\]\([^)]*\)",               # cibles de liens
    r"https?://\S+",
    r"^\s*\|?\s*[-: |]+\|[-: |]*$",   # separateurs de tableaux
]

MOTIFS_CODE_DANS_CHAINE = [
    r"</?[a-zA-Z][a-zA-Z0-9]*",   # noms de balises HTML : <a>, <details>...
    r'class="[^"]*"', r"class='[^']*'",
    r'id="[^"]*"', r"id='[^']*'",
    r'data-[\w-]+="[^"]*"',
    r'aria-controls="[^"]*"',
    r"https?://[^\s'\"<>]+",
    r"[#.][A-Za-z][\w-]*",        # selecteurs CSS
    r"\b[a-z]+-[a-z][\w-]*\b",    # noms en tirets : classes, identifiants
    r"\b[a-z]+[A-Z]\w*\b",        # camelCase
]


def traiter_md(txt):
    txt, coffre = proteger(txt, MOTIFS_MD)
    txt = remplacer_mots(txt)
    return rendre(txt, coffre)


def zones_js(txt):
    """Retourne les intervalles (debut, fin) des chaines et commentaires."""
    zones, i, n = [], 0, len(txt)
    while i < n:
        c = txt[i]
        if c in "'\"`":
            j, q = i + 1, c
            while j < n:
                if txt[j] == "\\":
                    j += 2; continue
                if txt[j] == q:
                    break
                if q != "`" and txt[j] == "\n":
                    break
                j += 1
            zones.append((i + 1, min(j, n)))
            i = j + 1
        elif c == "/" and i + 1 < n and txt[i + 1] == "*":
            j = txt.find("*/", i + 2)
            j = n if j < 0 else j
            zones.append((i + 2, j))
            i = j + 2
        elif c == "/" and i + 1 < n and txt[i + 1] == "/":
            j = txt.find("\n", i)
            j = n if j < 0 else j
            zones.append((i + 2, j))
            i = j
        else:
            i += 1
    return zones


def traiter_js(txt):
    zones = zones_js(txt)
    out, pos = [], 0
    for a, b in zones:
        if a > pos:
            out.append(txt[pos:a])
        frag = txt[a:b]
        frag, coffre = proteger(frag, MOTIFS_CODE_DANS_CHAINE)
        frag = remplacer_mots(frag)
        out.append(rendre(frag, coffre))
        pos = b
    out.append(txt[pos:])
    return "".join(out)


def traiter_css(txt):
    def f(m):
        return "/*" + remplacer_mots(m.group(1)) + "*/"
    return re.sub(r"/\*(.*?)\*/", f, txt, flags=re.S)


def _py(txt):
    # docstrings, chaines et commentaires
    out = txt
    out = re.sub(r'"""(.*?)"""', lambda m: '"""' + remplacer_mots(m.group(1)) + '"""', out, flags=re.S)
    out = re.sub(r"#(.*)", lambda m: "#" + remplacer_mots(m.group(1)), out)
    def chaine(m):
        frag, coffre = proteger(m.group(2), MOTIFS_CODE_DANS_CHAINE)
        return m.group(1) + rendre(remplacer_mots(frag), coffre) + m.group(1)
    out = re.sub(r"(['\"])([^'\"\n]{3,})\1", chaine, out)
    return out


MOTIFS_HTML = [
    r"</?[a-zA-Z][a-zA-Z0-9]*",
    r"<script.*?</script>",
    r"<style.*?</style>",
    r"<!--.*?-->",
    r'\b(?:class|id|href|src|data-[\w-]+|rel|type|name|viewBox|d|role)="[^"]*"',
]


def traiter_html(txt):
    # on protege tout ce qui n'est pas du texte lisible, mais on garde
    # les attributs volontairement lisibles
    lisibles = {}
    def garder(m):
        cle = "\x01%d\x01" % len(lisibles)
        lisibles[cle] = m.group(0)
        return cle
    txt = re.sub(r'\b(?:content|aria-label|alt|title)="[^"]*"', garder, txt)
    txt, coffre = proteger(txt, MOTIFS_HTML)
    txt = remplacer_mots(txt)
    txt = rendre(txt, coffre)
    for cle, val in lisibles.items():
        txt = txt.replace(cle, remplacer_mots(val))
    return txt


TRAITEURS = {
    ".md": traiter_md, ".js": traiter_js, ".css": traiter_css,
    ".py": _py, ".html": traiter_html, ".webmanifest": traiter_js,
    ".yml": lambda t: re.sub(r"#(.*)", lambda m: "#" + remplacer_mots(m.group(1)), t),
}

IGNORE = {"carnet.html", "accents.py", "routes.js"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fix", action="store_true")
    args = ap.parse_args()

    total = 0
    for f in sorted(RACINE.rglob("*")):
        if not f.is_file() or ".git" in f.parts or f.name in IGNORE:
            continue
        fn = TRAITEURS.get(f.suffix)
        if not fn:
            continue
        avant = f.read_text(encoding="utf-8")
        apres = fn(avant)
        if avant != apres:
            n = sum(1 for a, b in zip(avant, apres) if a != b)
            total += 1
            print(f"  {f.relative_to(RACINE)}")
            if args.fix:
                f.write_text(apres, encoding="utf-8")
    print(("Modifie" if args.fix else "A modifier") + f" : {total} fichiers")
    return 0


if __name__ == "__main__":
    sys.exit(main())
