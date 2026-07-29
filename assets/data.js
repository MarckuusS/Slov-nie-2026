/* =============================================================
   Slovenie 2026 - donnees du voyage
   7 au 13 septembre 2026, 2 personnes, voiture de location.

   Coordonnees : indicatives, a quelques centaines de metres pres.
   Elles servent a tracer la carte et a lancer la navigation.
   Les liens Google Maps et Tripadvisor partent du nom du lieu,
   pour tomber sur la bonne fiche.

   stay  = minutes prevues sur place
   leg   = trajet vers l'etape suivante { km, min, via: [[lat,lon], ...] }
   cost  = euros par personne
   ============================================================= */

const PALETTE = ['#147C7C', '#0F8F7A', '#3D9A57', '#96983B', '#C48A2E', '#C05F2C', '#B03A2E'];

const TRIP = {
  title: 'Slovenie',
  from: '2026-09-07',
  to: '2026-09-13',
  people: 2,
  target: 600,
  days: [

    /* ---------------------------------------------------- J1 */
    {
      n: 1, date: '2026-09-07', wd: 'lundi 7 septembre',
      title: 'Arrivee et premier lac',
      base: 'Bled ou Bohinjska Bistrica',
      start: '11:30',
      color: PALETTE[0],
      brief: 'Prise de voiture, ravitaillement, et le lac de Bled a pied. On finit sur le point de vue d\'Ojstrica au coucher du soleil.',
      stops: [
        {
          name: 'Aeroport de Ljubljana', sub: 'Joze Pucnik, Brnik', kind: 'transport',
          lat: 46.2237, lon: 14.4576, stay: 40, cost: 0,
          tip: 'Filmez la voiture en tournant autour avant de partir, jantes et pare-brise compris. Demandez si la vignette autoroute est incluse.',
          leg: { km: 22, min: 22, via: [[46.2389, 14.3556], [46.3100, 14.2400]] }
        },
        {
          name: 'Lidl Lesce', sub: 'Le gros ravitaillement', kind: 'courses',
          lat: 46.3617, lon: 14.1550, stay: 35, cost: 18,
          tip: 'Pain, fruits, fromage, jambon, cafe, eau. 30 a 40 € pour deux, ca tient trois jours.',
          leg: { km: 7, min: 10, via: [[46.3660, 14.1250]] }
        },
        {
          name: 'Lac de Bled', sub: 'Le tour du lac a pied, 6 km', kind: 'lac',
          lat: 46.3625, lon: 14.0936, stay: 110, cost: 0, free: true,
          tip: 'Dans le sens des aiguilles d\'une montre pour garder l\'ile en face de vous. Plat, praticable en baskets. Baignade possible, l\'eau est a 20-22 °C.',
          site: 'https://www.bled.si/fr/',
          leg: { km: 2, min: 6, via: [] }
        },
        {
          name: 'Park Hotel Bled', sub: 'La kremsnita d\'origine', kind: 'repas',
          lat: 46.3644, lon: 14.0994, stay: 40, cost: 6,
          tip: 'Le millefeuille creme-vanille invente ici en 1953. Il est enorme : un pour deux.',
          leg: { km: 3, min: 8, via: [] }
        },
        {
          name: 'Ojstrica', sub: 'Le point de vue, depart de Velika Zaka', kind: 'montagne',
          lat: 46.3607, lon: 14.0817, stay: 100, cost: 0, free: true,
          tip: '25 min de montee raide, cordes fixes sur la fin. Le lac, l\'ile et le chateau dans le meme cadre. Coucher de soleil vers 19h30. Enchainez sur Mala Osojnica, 15 min plus haut.',
          leg: { km: 20, min: 25, via: [[46.3400, 14.0700], [46.3000, 14.0300]] }
        },
        {
          name: 'Bohinjska Bistrica', sub: 'Base des trois premieres nuits', kind: 'nuit',
          lat: 46.2775, lon: 14.0064, stay: 0, cost: 0,
          tip: '45 a 65 € la chambre double, contre 60 a 110 € a Bled. Demandez la Bohinj Card a l\'arrivee : elle est comprise dans la taxe de sejour et rend Mostnica gratuite.'
        }
      ]
    },

    /* ---------------------------------------------------- J2 */
    {
      n: 2, date: '2026-09-08', wd: 'mardi 8 septembre',
      title: 'La riviere et les cascades',
      base: 'Bohinjska Bistrica',
      start: '07:30',
      color: PALETTE[1],
      brief: 'Vintgar au premier creneau, puis on bascule sur Bohinj, plus sauvage et beaucoup plus calme que Bled.',
      stops: [
        {
          name: 'Bohinjska Bistrica', sub: 'Depart de la base', kind: 'depart',
          lat: 46.2775, lon: 14.0064, stay: 0, cost: 0,
          tip: 'Petit dejeuner rapide et route vers Vintgar. Le creneau de 8h est celui ou vous serez presque seules.',
          leg: { km: 30, min: 35, via: [[46.3100, 14.0300], [46.3683, 14.1146]] }
        },
        {
          name: 'Gorges de Vintgar', sub: 'Parking central VINTGAR LIP', kind: 'gorge',
          lat: 46.3739, lon: 14.0917, stay: 115, cost: 15,
          tip: 'Reservez le creneau de 8h en ligne : on ne vend plus de billet a l\'entree de la gorge. Le pass comprend le parking, la navette electrique et le casque obligatoire. 1,6 km de passerelles au-dessus de la Radovna, jusqu\'a la cascade de Sum.',
          site: 'https://www.vintgar.si/en/',
          booking: true,
          leg: { km: 9, min: 15, via: [[46.3800, 14.0700]] }
        },
        {
          name: 'Gorge de Pokljuka', sub: 'Canyon sec, gratuit, personne', kind: 'gorge',
          lat: 46.3667, lon: 14.0556, stay: 80, cost: 0, free: true, optional: true,
          tip: 'Le contraire de Vintgar : pas d\'eau, pas de billet, pas de monde. Arche naturelle et grotte. Boucle de 1h a 1h30.',
          leg: { km: 16, min: 22, via: [[46.3550, 14.1100]] }
        },
        {
          name: 'Radovljica', sub: 'Place medievale et musee de l\'apiculture', kind: 'ville',
          lat: 46.3442, lon: 14.1731, stay: 75, cost: 5,
          tip: 'Une seule rue pavee bordee de maisons peintes, et presque personne. On y mange deux fois moins cher qu\'a Bled. Le musee de l\'apiculture (5 €) est court et charmant.',
          leg: { km: 32, min: 40, via: [[46.3200, 14.1000], [46.2900, 13.9500]] }
        },
        {
          name: 'Lac de Bohinj', sub: 'Ribcev Laz, le pont de pierre', kind: 'lac',
          lat: 46.2775, lon: 13.8875, stay: 60, cost: 0, free: true,
          tip: 'Pique-nique au bord de l\'eau, avec l\'eglise Saint-Jean-Baptiste et son clocher blanc. C\'est la carte postale de Bohinj.',
          leg: { km: 2, min: 5, via: [] }
        },
        {
          name: 'Gorge de Mostnica', sub: 'Depart de Stara Fuzina', kind: 'gorge',
          lat: 46.2894, lon: 13.8894, stay: 135, cost: 3,
          tip: 'Cherchez l\'Elephant, la roche qui en dessine un exactement. Jusqu\'a la cascade de Voje, comptez 3h et une buvette d\'alpage a l\'arrivee. Gratuit avant 8h, apres 17h, ou avec la Bohinj Card.',
          leg: { km: 3, min: 7, via: [] }
        },
        {
          name: 'Baignade au lac de Bohinj', sub: 'Rive nord, sur les galets', kind: 'lac',
          lat: 46.2800, lon: 13.8700, stay: 60, cost: 0, free: true,
          tip: '18 a 20 °C en septembre. L\'eau est si claire qu\'on voit le fond a 4 m.',
          leg: { km: 8, min: 12, via: [] }
        },
        {
          name: 'Bohinjska Bistrica', sub: 'Nuit 2', kind: 'nuit',
          lat: 46.2775, lon: 14.0064, stay: 0, cost: 0
        }
      ]
    },

    /* ---------------------------------------------------- J3 */
    {
      n: 3, date: '2026-09-09', wd: 'mercredi 9 septembre',
      title: 'La montagne',
      base: 'Bohinjska Bistrica',
      start: '08:00',
      color: PALETTE[2],
      brief: 'La journee la plus dependante du ciel. Regardez la webcam de Vogel le matin : par nuages bas, prenez la version gratuite au sol.',
      choice: {
        label: 'Version du jour',
        options: [
          { key: 'B', title: 'Rando du Vogar', detail: 'Gratuit, 550 m de denivele, 3h30, la meme vue plongeante sur le lac. C\'est la version retenue dans le budget.' },
          { key: 'A', title: 'Telecabine de Vogel', detail: '33 € par personne, 1535 m en 4 minutes, vue frontale sur le Triglav. Seulement si le ciel est degage.' }
        ]
      },
      stops: [
        {
          name: 'Bohinjska Bistrica', sub: 'Depart de la base', kind: 'depart',
          lat: 46.2775, lon: 14.0064, stay: 0, cost: 0,
          tip: 'Journee sans route. Verifiez la webcam de Vogel avant de choisir la version du jour.',
          leg: { km: 10, min: 16, via: [[46.2800, 13.9300]] }
        },
        {
          name: 'Telecabine de Vogel', sub: 'Version A, depuis Ukanc', kind: 'montagne',
          lat: 46.2814, lon: 13.8383, stay: 270, cost: 33, variant: 'A',
          tip: 'Parking gratuit et telesiege vers Orlova Glava compris. En haut, rando facile vers Sija (1880 m, 1h30 aller-retour). Verifiez la webcam avant de monter : par nuages bas vous payez 33 € pour du brouillard.',
          site: 'https://vogel.si/en/',
          leg: { km: 4, min: 9, via: [] }
        },
        {
          name: 'Rando du Vogar', sub: 'Version B, depuis Stara Fuzina', kind: 'montagne',
          lat: 46.2894, lon: 13.8894, stay: 300, cost: 0, free: true, variant: 'B',
          tip: '1h45 de montee, 550 m de denivele, et une vue plongeante sur tout le lac de Bohinj. Retour en boucle possible par la Planina Blato et la vallee de Voje.',
          leg: { km: 8, min: 15, via: [] }
        },
        {
          name: 'Cascade de Savica', sub: 'Au fond de la vallee d\'Ukanc', kind: 'cascade',
          lat: 46.2942, lon: 13.8003, stay: 90, cost: 6.5,
          tip: '4 € d\'entree plus 5 € de parking a partager. 500 marches, 25 min de montee. 78 m qui jaillissent de la paroi en forme de A : c\'est la source de la Sava.',
          leg: { km: 12, min: 20, via: [[46.2800, 13.8600]] }
        },
        {
          name: 'Bohinjska Bistrica', sub: 'Nuit 3, courses pour le lendemain', kind: 'nuit',
          lat: 46.2775, lon: 14.0064, stay: 0, cost: 0,
          tip: 'Le Vodni park de Bohinjska Bistrica (piscines et saunas, ~15 € les 3h) sauve une fin d\'apres-midi pluvieuse.'
        }
      ]
    },

    /* ---------------------------------------------------- J4 */
    {
      n: 4, date: '2026-09-10', wd: 'jeudi 10 septembre',
      title: 'Le col et la source de la Soca',
      base: 'Kobarid',
      start: '07:30',
      color: PALETTE[3],
      brief: 'La journee du voyage. 50 lacets, une chapelle de bois, et la riviere la plus verte d\'Europe qui sort de la montagne.',
      warn: 'Verifiez l\'ouverture du col sur promet.si le matin meme. Faites le plein a Kranjska Gora : il n\'y a plus rien pendant 60 km.',
      stops: [
        {
          name: 'Bohinjska Bistrica', sub: 'Depart de la base', kind: 'depart',
          lat: 46.2775, lon: 14.0064, stay: 0, cost: 0,
          tip: 'Il faut redescendre par Bled et Jesenice pour rejoindre la vallee de la Sava. C\'est le plus long transfert de la semaine : partez a 7h30, le parking du sommet est plein a 9h30.',
          leg: { km: 65, min: 75, via: [[46.3683, 14.1146], [46.4364, 14.0525], [46.4614, 13.9425], [46.4847, 13.7856]] }
        },
        {
          name: 'Lac de Jasna', sub: 'Entree de Kranjska Gora', kind: 'lac',
          lat: 46.4747, lon: 13.7856, stay: 30, cost: 0, free: true,
          tip: 'Bleu irreel et la statue du bouquetin dore, le Zlatorog de la legende. Dernier plein d\'essence avant le col, juste a cote.',
          leg: { km: 6, min: 18, via: [[46.4700, 13.7750], [46.4600, 13.7700]] }
        },
        {
          name: 'Chapelle russe', sub: 'Lacet n°8, 1100 m', kind: 'culture',
          lat: 46.4442, lon: 13.7639, stay: 25, cost: 0, free: true,
          tip: 'Batie en 1916 par des prisonniers de guerre russes en memoire de leurs 300 camarades ensevelis par une avalanche pendant la construction de la route. L\'endroit le plus emouvant du col.',
          leg: { km: 5, min: 20, via: [[46.4390, 13.7520]] }
        },
        {
          name: 'Sommet du Vrsic', sub: '1611 m, le plus haut col du pays', kind: 'montagne',
          lat: 46.4328, lon: 13.7469, stay: 165, cost: 6,
          tip: 'Parking ~3 €/h, plein a partir de 9h30. Si vous avez de l\'energie : Slemenova Spica, 2h30 aller-retour, 300 m de denivele, une prairie d\'altitude face au Jalovec. La plus belle balade facile des Alpes juliennes.',
          leg: { km: 13, min: 32, via: [[46.4200, 13.7350], [46.4120, 13.7300]] }
        },
        {
          name: 'Source de la Soca', sub: 'Izvir Soce, Trenta', kind: 'riviere',
          lat: 46.4067, lon: 13.7256, stay: 60, cost: 0, free: true,
          tip: '15 min de marche, et les 50 derniers metres sur cables fixes dans la roche. Rangez le telephone, il faut les deux mains. L\'eau sort de la montagne dans une vasque emeraude.',
          leg: { km: 13, min: 20, via: [[46.3722, 13.7392], [46.3500, 13.6900]] }
        },
        {
          name: 'Velika korita de la Soca', sub: 'Pont de Kraselnica', kind: 'riviere',
          lat: 46.3339, lon: 13.6636, stay: 75, cost: 0, free: true,
          tip: '750 m de faille, 15 m de profondeur, parfois 2 m de large. Pont suspendu au-dessus. Ce vert n\'existe nulle part ailleurs : c\'est le moment photo du voyage. Baignade possible dans les vasques en aval, 11 °C.',
          leg: { km: 13, min: 18, via: [[46.3383, 13.5522]] }
        },
        {
          name: 'Cascade de Boka', sub: '106 m, la plus haute de Slovenie', kind: 'cascade',
          lat: 46.3131, lon: 13.5606, stay: 40, cost: 0, free: true,
          tip: 'Le belvedere a 5 min du pont donne deja la cascade entiere. La montee au pied prend 1h et c\'est raide : en septembre le debit est faible, le belvedere suffit.',
          leg: { km: 12, min: 16, via: [[46.2800, 13.5700]] }
        },
        {
          name: 'Kobarid', sub: 'Base des deux nuits suivantes', kind: 'nuit',
          lat: 46.2472, lon: 13.5789, stay: 0, cost: 0,
          tip: 'Petite ville gastronomique. Gouter les kobariski struklji, roules aux noix et cannelle. Hisa Polonka et Picerija Fedrig sont les bonnes adresses accessibles.'
        }
      ]
    },

    /* ---------------------------------------------------- J5 */
    {
      n: 5, date: '2026-09-11', wd: 'vendredi 11 septembre',
      title: 'La vallee de la Soca a fond',
      base: 'Kobarid',
      start: '08:00',
      color: PALETTE[4],
      brief: 'Peu de route, beaucoup d\'eau. La plus belle cascade du pays au reveil, un canyon l\'apres-midi, et un bain glace entre les deux.',
      stops: [
        {
          name: 'Kobarid', sub: 'Depart de la base', kind: 'depart',
          lat: 46.2472, lon: 13.5789, stay: 0, cost: 0,
          tip: 'Tout est a moins de 16 km aujourd\'hui. Le seul horaire qui compte est celui de Kozjak : y etre a 8h.',
          leg: { km: 2, min: 5, via: [] }
        },
        {
          name: 'Cascade de Kozjak', sub: 'Depart du camping Kamp Koren', kind: 'cascade',
          lat: 46.2528, lon: 13.5825, stay: 105, cost: 5,
          tip: '30 min de marche facile. Elle tombe de 15 m dans une chambre de pierre presque fermee, ou la lumiere entre par le haut. Y etre a 8h fait toute la difference : apres 10h il y a la queue sur la passerelle finale, qui ne laisse passer qu\'une personne.',
          leg: { km: 1, min: 4, via: [] }
        },
        {
          name: 'Pont Napoleon', sub: 'Sur la Soca turquoise', kind: 'riviere',
          lat: 46.2531, lon: 13.5847, stay: 25, cost: 0, free: true,
          tip: 'Beaucoup de gens sautent depuis le pont. Ce n\'est pas balise et l\'eau est a 11 °C : a vous de voir.',
          leg: { km: 1, min: 4, via: [] }
        },
        {
          name: 'Kobarid', sub: 'Musee, ossuaire, sentier historique', kind: 'culture',
          lat: 46.2464, lon: 13.5786, stay: 150, cost: 8,
          tip: 'Le front de l\'Isonzo, douze batailles entre 1915 et 1917, 300 000 morts dans cette vallee. Le musee (8 €) a recu le prix du musee europeen. Le sentier historique, gratuit, fait 5 km par l\'ossuaire italien, les tranchees et Kozjak.',
          site: 'https://www.kobariski-muzej.si/',
          leg: { km: 16, min: 21, via: [[46.2200, 13.6300]] }
        },
        {
          name: 'Gorges de Tolmin', sub: 'Zatolmin, point le plus bas du parc', kind: 'gorge',
          lat: 46.1878, lon: 13.7311, stay: 105, cost: 8,
          tip: 'La Tete d\'ours, un rocher coince entre les deux parois. Le pont du Diable a 60 m au-dessus de l\'eau. Et la seule source thermale du parc national. Plus sauvage que Vintgar.',
          site: 'https://www.soca-valley.com/',
          leg: { km: 16, min: 21, via: [[46.2200, 13.6300]] }
        },
        {
          name: 'Baignade dans la Soca', sub: 'Sous le pont Napoleon', kind: 'riviere',
          lat: 46.2531, lon: 13.5847, stay: 70, cost: 0, free: true,
          tip: '11 a 13 °C. Un choc, puis une euphorie. Entrez progressivement, ne plongez jamais sans avoir verifie le fond, le courant est plus fort qu\'il n\'y parait.',
          leg: { km: 2, min: 5, via: [] }
        },
        {
          name: 'Kobarid', sub: 'Nuit 5, courses du week-end', kind: 'nuit',
          lat: 46.2472, lon: 13.5789, stay: 0, cost: 0,
          tip: 'Faites les courses ce soir ou demain avant 17h. Dimanche, tous les supermarches slovenes sont fermes.'
        }
      ]
    },

    /* ---------------------------------------------------- J6 */
    {
      n: 6, date: '2026-09-12', wd: 'samedi 12 septembre',
      title: 'La grotte, puis la ville',
      base: 'Ljubljana',
      start: '08:00',
      color: PALETTE[5],
      brief: 'On quitte les Alpes pour le Karst, ce plateau calcaire qui a donne son nom au relief karstique dans le monde entier. Puis Ljubljana le soir.',
      stops: [
        {
          name: 'Kobarid', sub: 'Depart de la base', kind: 'depart',
          lat: 46.2472, lon: 13.5789, stay: 0, cost: 0,
          tip: 'La plus longue journee de route de la semaine. Faites le plein a Kobarid ou Tolmin avant de partir.',
          leg: { km: 20, min: 25, via: [[46.1836, 13.7317]] }
        },
        {
          name: 'Most na Soci', sub: 'Le lac emeraude du barrage', kind: 'riviere',
          lat: 46.1450, lon: 13.7433, stay: 25, cost: 0, free: true,
          tip: 'Arret photo au confluent de la Soca et de l\'Idrijca.',
          leg: { km: 42, min: 55, via: [[46.1000, 13.8500], [46.0300, 13.9500]] }
        },
        {
          name: 'Idrija', sub: 'Ville UNESCO du mercure', kind: 'ville',
          lat: 46.0022, lon: 14.0286, stay: 75, cost: 0, optional: true,
          tip: 'Deuxieme mine de mercure du monde, exploitee de 1490 a 1995. Meme sans visiter la mine (12 €), arretez-vous manger des zlikrofi, les raviolis de pomme de terre en forme de petit chapeau, premier plat slovene protege par l\'UE. Comptez 8 a 10 € l\'assiette.',
          site: 'https://www.visit-idrija.si/en/',
          leg: { km: 88, min: 80, via: [[45.9000, 13.9000], [45.8000, 13.9200], [45.7200, 13.9600]] }
        },
        {
          name: 'Grottes de Skocjan', sub: 'Le plus grand canyon souterrain du monde', kind: 'grotte',
          lat: 45.6636, lon: 13.9903, stay: 180, cost: 24,
          tip: 'Une salle de 146 m de haut, traversee sur une passerelle a 45 m au-dessus du torrent. Classe UNESCO. Il fait 12 °C : prenez un pull. Chaussures fermees, ca ruisselle. Photos interdites pendant la visite. Departs a l\'heure ronde de 10h a 17h. A la sortie, faites le sentier du canyon exterieur, gratuit, que presque personne ne fait.',
          site: 'https://www.park-skocjanske-jame.si/en/',
          booking: true,
          leg: { km: 30, min: 30, via: [[45.7200, 14.0500]] }
        },
        {
          name: 'Chateau de Predjama', sub: 'Encastre dans 123 m de falaise', kind: 'culture',
          lat: 45.8156, lon: 14.1272, stay: 40, cost: 0, free: true,
          tip: 'Le plus grand chateau troglodyte du monde. La facade se voit entierement depuis la route et le parking : inutile de payer les 16,90 € d\'entree. Le brigand Erasme y a soutenu un siege d\'un an, ravitaille par un tunnel secret.',
          leg: { km: 52, min: 45, via: [[45.8600, 14.2200], [45.9500, 14.3500]] }
        },
        {
          name: 'Ljubljana', sub: 'Les quais de la Ljubljanica', kind: 'ville',
          lat: 46.0514, lon: 14.5061, stay: 0, cost: 0,
          tip: 'Garez-vous au P+R Dolgi most ou Stozice : 1,20 € la journee, ticket de bus compris. Le centre est entierement pietonnier. C\'est le soir que la ville est la meilleure, sur les terrasses au bord de l\'eau.'
        }
      ]
    },

    /* ---------------------------------------------------- J7 */
    {
      n: 7, date: '2026-09-13', wd: 'dimanche 13 septembre',
      title: 'Ljubljana et retour',
      base: 'Vol du soir',
      start: '09:00',
      color: PALETTE[6],
      brief: 'Tout se fait a pied dans un carre de 800 m. Attention : dimanche, les magasins sont fermes, mais restaurants, cafes et musees sont ouverts.',
      stops: [
        {
          name: 'Chateau de Ljubljana', sub: 'A pied, 15 min de montee', kind: 'culture',
          lat: 46.0489, lon: 14.5083, stay: 90, cost: 0, free: true,
          tip: 'La cour, les remparts et la vue sont gratuits : seuls le musee et la tour sont payants. Le funiculaire a 4 € ne sert a rien, la montee est agreable.',
          site: 'https://www.ljubljanskigrad.si/en/',
          leg: { km: 1, min: 12, via: [] }
        },
        {
          name: 'Marche aux puces de Breg', sub: 'Uniquement le dimanche', kind: 'ville',
          lat: 46.0497, lon: 14.5039, stay: 60, cost: 0, free: true,
          tip: 'Le marche alimentaire est ferme le dimanche, mais les quais de Breg accueillent les antiquaires. Le bon endroit pour un souvenir qui ne soit pas un aimant de frigo.',
          leg: { km: 1, min: 10, via: [] }
        },
        {
          name: 'Centre historique', sub: 'Place Preseren et les trois ponts', kind: 'ville',
          lat: 46.0514, lon: 14.5061, stay: 120, cost: 0, free: true,
          tip: 'Le Triple Pont et le marche couvert de Plecnik, classes UNESCO. Le pont des Dragons. Les portes de bronze de la cathedrale, polies par des milliers de mains. Les ruelles de Stari trg et Gornji trg.',
          leg: { km: 2, min: 18, via: [] }
        },
        {
          name: 'Parc Tivoli ou Metelkova', sub: 'Au choix : le calme ou les fresques', kind: 'ville',
          lat: 46.0556, lon: 14.4964, stay: 75, cost: 0, free: true,
          tip: 'Tivoli : 5 km² de parc et l\'allee Jakopic bordee de photos geantes en plein air. Metelkova : l\'ancienne caserne de l\'armee yougoslave squattee par des artistes depuis 1993, couverte de fresques du sol au toit. C\'est l\'autre visage de la ville.',
          leg: { km: 26, min: 28, via: [[46.1000, 14.5000], [46.1700, 14.4800]] }
        },
        {
          name: 'Aeroport de Ljubljana', sub: 'Restitution et vol retour', kind: 'transport',
          lat: 46.2237, lon: 14.4576, stay: 0, cost: 0,
          tip: 'Refaites le plein a Vodice ou Brnik juste avant. Comptez 30 min pour l\'etat des lieux, et refilmez la voiture. Arrivez 2h avant le vol.'
        }
      ]
    }
  ]
};

/* ============================================================
   Fiches pratiques
   ============================================================ */

const GUIDE = {
  urgences: [
    { n: '112', l: 'Urgences, secours en montagne', tel: '112' },
    { n: '113', l: 'Police', tel: '113' },
    { n: '1987', l: 'Depannage routier AMZS', tel: '1987' },
    { n: '1970', l: 'Info routiere DARS', tel: '1970' }
  ],

  conduite: [
    { k: 'Vignette autoroute', v: 'Demandez au loueur si elle est incluse, puis verifiez la plaque sur evinjeta.dars.si. Sinon 16 € pour 7 jours. Amende de 300 a 800 €.' },
    { k: 'Feux de croisement', v: 'Obligatoires jour et nuit, toute l\'annee.' },
    { k: 'Alcool', v: '0,5 g/L, et 0,0 g/L si moins de 21 ans ou moins de 3 ans de permis.' },
    { k: 'Vitesses', v: '50 en ville, 90 sur route, 110 sur voie rapide, 130 sur autoroute.' },
    { k: 'Obligatoire dans la voiture', v: 'Gilet jaune et triangle. Verifiez qu\'ils sont dans le coffre a la prise en charge.' },
    { k: 'Carburant', v: 'SP95 environ 1,56 €/L, diesel 1,63 €/L. Reseau Petrol partout. Rien entre Kranjska Gora et Bovec.' },
    { k: 'Lacets de montagne', v: 'La voiture qui monte a la priorite. En descente, passez en 2e et laissez le frein moteur travailler.' },
    { k: 'Caution du loueur', v: '800 a 1500 € bloques sur une carte de credit au nom de la conductrice. C\'est le motif numero 1 de refus au comptoir.' }
  ],

  randos: [
    { nom: 'Ojstrica', lieu: 'Bled', duree: '45 min A/R', deniv: '130 m', diff: 'Raide, cordes sur la fin', prix: 'gratuit', note: 'Le point de vue le plus celebre du pays.' },
    { nom: 'Gorges de Vintgar', lieu: 'Bled', duree: '1h30', deniv: 'nul', diff: 'Facile, glissant sous la pluie', prix: '15 €', note: 'Passerelles au-dessus de la Radovna.' },
    { nom: 'Gorge de Mostnica', lieu: 'Bohinj', duree: '2h a 3h30', deniv: '150 m', diff: 'Facile', prix: '3 €', note: 'Jusqu\'a l\'Elephant, ou jusqu\'a la cascade de Voje.' },
    { nom: 'Cascade de Savica', lieu: 'Bohinj', duree: '50 min A/R', deniv: '130 m', diff: '500 marches', prix: '9,50 €', note: 'La source de la Sava.' },
    { nom: 'Vogar', lieu: 'Bohinj', duree: '3h30 A/R', deniv: '550 m', diff: 'Moyenne', prix: 'gratuit', note: 'L\'alternative gratuite a Vogel, meme vue plongeante.' },
    { nom: 'Sija depuis Vogel', lieu: 'Bohinj', duree: '1h30 A/R', deniv: '350 m', diff: 'Facile a moyenne', prix: '33 € (telecabine)', note: '1880 m, face au Triglav.' },
    { nom: 'Slemenova Spica', lieu: 'Vrsic', duree: '2h30 A/R', deniv: '300 m', diff: 'Moyenne, sans exposition', prix: 'gratuit', note: 'La plus belle balade facile des Alpes juliennes. Prairie d\'altitude face au Jalovec.' },
    { nom: 'Source de la Soca', lieu: 'Trenta', duree: '40 min A/R', deniv: '100 m', diff: 'Cables sur la fin', prix: 'gratuit', note: 'Les deux mains libres sur les derniers metres.' },
    { nom: 'Velika korita', lieu: 'Soca', duree: '1h', deniv: 'nul', diff: 'Facile', prix: 'gratuit', note: 'La faille de 15 m et le pont suspendu.' },
    { nom: 'Cascade de Kozjak', lieu: 'Kobarid', duree: '1h A/R', deniv: '100 m', diff: 'Facile', prix: '5 €', note: 'La chambre de pierre. Y etre a 8h.' },
    { nom: 'Sentier historique de Kobarid', lieu: 'Kobarid', duree: '3h boucle', deniv: '250 m', diff: 'Facile', prix: 'gratuit', note: 'Ossuaire, tranchees de 14-18 et Kozjak.' },
    { nom: 'Gorges de Tolmin', lieu: 'Tolmin', duree: '1h30 boucle', deniv: '200 m', diff: 'Escaliers', prix: '8 €', note: 'Tete d\'ours, pont du Diable, source thermale.' },
    { nom: 'Debela Pec', lieu: 'Pokljuka', duree: '4h A/R', deniv: '600 m', diff: 'Moyenne', prix: 'gratuit', note: '2014 m sans materiel, face nord du Triglav.' }
  ],

  hebergements: [
    { base: 'Bohinjska Bistrica', nuits: '1, 2, 3', prix: '45 a 65 €', note: 'Le meilleur rapport qualite-prix. 10 min du lac, supermarche, parking souvent gratuit. Preferez un logement avec kitchenette : c\'est 10 a 15 € par jour et par personne d\'economises.' },
    { base: 'Bled', nuits: 'alternative 1, 2, 3', prix: '60 a 110 €', note: 'Plus cher et plus touristique, mais on va au lac a pied le soir. Parking payant partout.' },
    { base: 'Kobarid', nuits: '4, 5', prix: '40 a 60 €', note: 'Plus central que Bovec pour Kozjak et Tolmin, et plus agreable le soir. Kamp Koren est au depart exact du sentier de Kozjak.' },
    { base: 'Ljubljana', nuits: '6', prix: '25 a 35 € en dortoir, 60 a 90 € en double', note: 'La nuit la plus chere de la semaine. Pour une seule nuit, une auberge du centre suffit. Verifiez le parking ou la proximite d\'un P+R.' }
  ],

  manger: [
    { p: 'Burek', d: 'Chausson feuillete a la viande ou au fromage. Un burek vaut un repas.', prix: '3 a 4 €' },
    { p: 'Kranjska klobasa', d: 'La saucisse de Carniole, AOP, avec moutarde et raifort. Le plat national.', prix: '6 a 9 €' },
    { p: 'Dnevno kosilo', d: 'Le plat du jour du midi en semaine, souvent soupe et plat. La meilleure affaire du pays.', prix: '8 a 12 €' },
    { p: 'Kremsnita', d: 'Le millefeuille creme-vanille de Bled, invente au Park Hotel en 1953.', prix: '6 a 7 €' },
    { p: 'Kobariski struklji', d: 'Petits roules aux noix, cannelle et raisins, avec chapelure beurree. A Kobarid.', prix: '5 a 7 €' },
    { p: 'Zlikrofi', d: 'Raviolis d\'Idrija en forme de petit chapeau, pomme de terre et lard.', prix: '8 a 10 €' },
    { p: 'Jota', d: 'Soupe epaisse de choucroute, haricots et lard.', prix: '5 a 8 €' },
    { p: 'Bezgov sok', d: 'Sirop de fleur de sureau. La boisson nationale non alcoolisee.', prix: '2 a 3 €' },
    { p: 'Lasko et Union', d: 'Les deux bieres nationales, rivalite historique.', prix: '3 a 4 € la pression' },
    { p: 'Teran', d: 'Le rouge tres sombre du Karst, acide, cultive sur la terre rouge.', prix: '3 a 5 € le verre' }
  ],

  meteo: [
    { z: 'Ljubljana, Bled', j: '21 °C', n: '11 °C', e: '20-22 °C' },
    { z: 'Alpes, Vrsic, Bohinj', j: '17-19 °C', n: '8-10 °C', e: '18-20 °C' },
    { z: 'Karst, cote', j: '23-25 °C', n: '14-16 °C', e: '23 °C' },
    { z: 'La Soca', j: '-', n: '-', e: '10-13 °C' }
  ],

  pluie: [
    { v: 'Brouillard en fond de vallee, bleu au-dessus', f: 'Ne changez rien. Ca se leve entre 9h et 11h, et c\'est le plus beau moment sur les lacs.' },
    { v: 'Nuages accroches aux sommets', f: 'Abandonnez l\'altitude. Gorges, cascades, fonds de vallee. Surtout, ne payez pas Vogel.' },
    { v: 'Pluie fine continue', f: 'Les gorges sont meilleures sous la pluie : plus de debit, moins de monde. Attention, ca glisse.' },
    { v: 'Pluie forte et vent', f: 'Skocjan, le musee de Kobarid, Idrija, Radovljica, les musees de Ljubljana, le Vodni park de Bohinjska Bistrica.' },
    { v: 'Orage annonce l\'apres-midi', f: 'Rando le matin, redescendues a 15h. Sans discussion.' },
    { v: 'Col du Vrsic ferme', f: 'Le train-navette de Bohinjska Bistrica passe le tunnel avec la voiture a bord jusqu\'a Most na Soci. Sinon, par Idrija, 2h15.' }
  ],

  mots: [
    ['Dober dan', 'dober dane', 'Bonjour'],
    ['Hvala', 'hvala', 'Merci'],
    ['Prosim', 'prossim', 'S\'il vous plait, ou pardon ?'],
    ['Oprostite', 'oprostité', 'Excusez-moi'],
    ['Nasvidenje', 'nasvidenié', 'Au revoir'],
    ['Govorite anglesko?', 'govorité angléchko', 'Parlez-vous anglais ?'],
    ['Koliko stane?', 'koliko stané', 'Combien ca coute ?'],
    ['Racun, prosim', 'ratchoun prossim', 'L\'addition'],
    ['Brez mesa, prosim', 'brez messa', 'Sans viande'],
    ['Na zdravje!', 'na zdravié', 'Sante, en se regardant dans les yeux'],
    ['Slap', '', 'Cascade'],
    ['Korita, soteska', '', 'Gorges'],
    ['Jama', '', 'Grotte'],
    ['Jezero', '', 'Lac'],
    ['Izvir', '', 'Source'],
    ['Koca, dom', '', 'Refuge de montagne'],
    ['Planina', '', 'Alpage'],
    ['Vstopnina', '', 'Droit d\'entree'],
    ['Odprto, zaprto', '', 'Ouvert, ferme'],
    ['Pitna voda', '', 'Eau potable'],
    ['Pozor', '', 'Attention'],
    ['Prepovedano', '', 'Interdit'],
    ['Lekarna', '', 'Pharmacie'],
    ['Pekarna', '', 'Boulangerie'],
    ['Sobe, apartma', '', 'Chambres, appartement'],
    ['Gostilna', '', 'Auberge-restaurant']
  ],

  prononciation: [
    ['Le c', 'se dit ts, et avec son accent tch. Soca se dit So-tcha, Skocjan Chkotch-yan.'],
    ['Le s accentue', 'se dit ch. Vrsic se dit Veur-chitch.'],
    ['Le j', 'se dit y. Ljubljana se dit Lyou-blia-na, Bohinj se dit Bo-hine.']
  ]
};

/* ============================================================
   Valise et preparatifs
   ============================================================ */

const PACK = [
  {
    titre: 'A faire avant de partir', items: [
      ['a1', 'Reserver la voiture : le poste qui double si on attend'],
      ['a2', 'Reserver le creneau de Vintgar sur vintgar.si, premier creneau du matin'],
      ['a3', 'Commander la CEAM sur ameli, une chacune, 15 jours de delai'],
      ['a4', 'Verifier que la carte bancaire couvre la franchise de location'],
      ['a5', 'Telecharger les cartes hors ligne de la Slovenie'],
      ['a6', 'Installer ARSO Vreme pour la meteo de montagne']
    ]
  },
  {
    titre: 'Indispensable', items: [
      ['p1', 'Chaussures de randonnee ou bonnes baskets de trail'],
      ['p2', 'Veste impermeable avec capuche'],
      ['p3', 'Polaire ou doudoune fine : grottes, matins, altitude'],
      ['p4', 'Sandales de riviere ou vieilles baskets pour la Soca'],
      ['p5', 'Maillot de bain et serviette microfibre'],
      ['p6', 'Sac a dos 20-25 L et deux gourdes'],
      ['p7', 'Batterie externe et cables'],
      ['p8', 'Creme solaire, lunettes, casquette'],
      ['p9', 'Pansements anti-ampoules, paracetamol, anti-nauseeux pour les 50 lacets'],
      ['p10', 'Bonnet leger ou buff : 6 °C possibles au Vrsic le matin'],
      ['p11', 'Couteau pliant et petite planche pour les pique-niques, en soute'],
      ['p12', 'Tote bag pliable : les sacs sont payants en supermarche']
    ]
  },
  {
    titre: 'Papiers', items: [
      ['d1', 'Carte d\'identite ou passeport'],
      ['d2', 'Permis de conduire'],
      ['d3', 'Carte de credit au nom de la conductrice, pour la caution'],
      ['d4', 'CEAM, une chacune'],
      ['d5', 'Voucher de location, billets, reservation Vintgar en PDF'],
      ['d6', '50 a 80 € en especes']
    ]
  },
  {
    titre: 'Inutile d\'emporter', items: [
      ['n1', 'Adaptateur de prise : les prises sont les memes qu\'en France'],
      ['n2', 'Devises : c\'est l\'euro'],
      ['n3', 'Grande valise rigide : penible dans une petite voiture']
    ]
  }
];

/* ============================================================
   Budget
   ============================================================ */

const BUDGET = {
  cible: 600,
  fixe: [
    ['Essence, 700 km', 35],
    ['Vignette 7 jours', 8],
    ['Parkings hors etapes', 10],
    ['Taxe de sejour', 15],
    ['Imprevu', 30]
  ],
  extras: [
    ['x-vogel', 'Telecabine de Vogel', 33],
    ['x-raft', 'Rafting sur la Soca', 70],
    ['x-grad', 'Chateau de Bled', 19],
    ['x-pletna', 'Barque pletna', 20],
    ['x-mine', 'Mine d\'Idrija', 12],
    ['x-predjama', 'Predjama interieur', 17],
    ['x-postojna', 'Grotte de Postojna', 31]
  ],
  ecartes: [
    ['Telecabine de Vogel', '33 €', 'La rando du Vogar donne la meme vue pour 0 €'],
    ['Chateau de Bled', '19 €', 'La vue sur le chateau vaut mieux que la vue depuis'],
    ['Barque pletna', '20 €', 'Une barque a rames a deux revient a 12,50 € chacune'],
    ['Grotte de Postojna', '30,90 €', 'Skocjan est moins cher, plus rare et plus fort'],
    ['Predjama interieur', '16,90 €', 'La facade se voit entierement du parking']
  ],
  reference: [
    ['Vignette 7 jours', '16 €'],
    ['Essence SP95 / diesel', '1,56 / 1,63 €/L'],
    ['Parking Savica', '5 € les 3h'],
    ['Parking sommet du Vrsic', '3 €/h'],
    ['Parking Skocjan', 'gratuit'],
    ['P+R Ljubljana, bus compris', '1,20 € la journee'],
    ['Taxe de sejour, Ljubljana', '3,91 € par nuit'],
    ['Taxe de sejour, Bled', '3,13 € par nuit'],
    ['Biere pression 0,5 L', '3 a 4 €'],
    ['Plat du jour, midi en semaine', '8 a 12 €']
  ]
};
