/* =============================================================
   Traces routiers figes.

   Ce fichier est vide pour l'instant : l'application calcule les
   itineraires au premier affichage, en interrogeant OSRM, puis les
   garde dans le stockage local du telephone.

   Pour les figer ici et rendre l'application totalement autonome :
   ouvrez l'onglet Carte, laissez le calcul se terminer, appuyez sur
   "Exporter les traces", et remplacez ce fichier par celui qui est
   telecharge. Un commit plus tard, plus aucun appel reseau n'est
   necessaire pour dessiner les routes.

   Geometrie OSRM, donnees OpenStreetMap, licence ODbL.
   ============================================================= */

window.ROUTES = {};
