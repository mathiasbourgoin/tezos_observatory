# Frise Observatory — handoff Astra

14 octobre 2026. Description du dessin fourni, rapprochée de `research.md`, de l’intake validée et de `spec-draft.md` (US-2 à US-4). Ce handoff prépare le design ; aucune implémentation, modification de spécification ou validation de production n’est réalisée ici.

La frise forme un carrefour autour de l’instance réellement observée **niveau N, round R**. Le bloc précédent est à gauche. Deux possibilités restent visibles : **N / R+1 au-dessus**, **N+1 / R0 à droite, sur la même ligne que l’observation courante**. Les rectangles du dessin expriment cette relation spatiale ; ils peuvent devenir des repères compacts dans un navigateur pleine largeur, au-dessus de l’inspecteur.

Chaque bloc observé porte son vrai hash, abrégé si nécessaire avec accès au hash complet. Une instance connue uniquement par ses votes affiche explicitement « hash de proposition indisponible ». Les possibilités futures ne reçoivent aucun hash inventé. Le contour plein signale une observation ; le pointillé signale une possibilité. Un lien de parenté plein exige une parenté prouvée : l’ordre de réception, le voisinage graphique ou le passage au round suivant ne suffisent pas.

**Chacune des deux possibilités** montre son niveau/round, son proposant attendu issu des droits RPC et un timer conditionnel calculé à partir des paramètres et du contexte protocole. La source, le contexte de requête et les hypothèses sont accessibles. Le timer du prochain niveau explicite notamment son hypothèse de prédécesseur. Droits manquants et timing indisponible sont deux états distincts, indépendants pour chaque branche. À expiration : « échéance estimée dépassée — observation attendue ». Cela ne crée aucun bloc et ne déplace jamais la caméra.

En mode **Follow live**, le mouvement traduit uniquement une progression observée cohérente :

| Observation acceptée | Caméra |
| --- | --- |
| Même niveau, round adjacent supérieur | Monte uniquement ; X reste stable. |
| Niveau adjacent suivant, round 0 | Va à droite uniquement ; Y reste stable, même après un round 118. |
| Lacune, réorganisation, contexte différent ou candidat différent aux mêmes coordonnées | Replacement statique, avec qualification visible ; aucune progression intermédiaire inventée. |
| Horloge, expiration, doublon ou changement de puissance seul | Aucun déplacement de progression. |

Le changement de niveau ne doit donc jamais provoquer une descente ou une diagonale vers une prétendue ligne absolue « round 0 ». La caméra suit un chemin local qui peut continuer ; la scène se déplace visuellement en sens inverse de la caméra. Mouvement discret de 160 ms, plafond 200 ms, une seule transition à la fois ; arrivées rapides regroupées vers la destination cohérente finale. Reduced motion : changement statique.

Cette continuité donne la sensation d’une **frise infinie**, avec une conservation explicitement bornée : 150 instances de session, 100 candidats acceptés et 100 non résolus par réseau, plus une copie figée épinglée selon le contrat de rétention. Aucun immense canevas fondé sur les valeurs absolues des niveaux/rounds. Les lacunes restent visibles ; les portions condensées ne prétendent pas contenir des rounds jamais observés.

L’historique est sélectionnable et épinglable. L’inspection stabilise caméra, sélection, focus et lecture pendant la collecte. Les possibilités historiques conservent leurs valeurs capturées et leur date, sans faux compte à rebours actuel. **Follow live** reprend explicitement le suivi ; « Latest observed » sélectionne seulement la dernière observation une fois. La pause de collecte reste distincte.

Sur desktop, la frise exploite toute la largeur utile avec l’historique et un inspecteur lisible. Sur mobile, l’observation courante et **les deux branches, proposant/timer/état compris**, restent lisibles ensemble sans pan obligatoire ni divulgation préalable ; le défilement vertical ordinaire peut amener cette vue à l’écran. Navigation clavier et équivalent textuel complètent le dessin ; le hash intégral reste accessible.

Direction visuelle : professionnelle, sobre et originale, repères fins, typographie précise, surfaces minérales/ivoire, encre forêt et accent cuivre, déclinaison sombre cohérente. Éviter les grosses cards répétées, le ciel décoratif et les automatismes bleu/violet. Les deux thèmes devront être testés sur les rendus réels, états et tailles requis ; ce document ne revendique aucune QA de production.

**Compréhension confirmée :** la frise montre le passé observé, le présent sélectionné et deux futurs conditionnels simultanés ; sa caméra monte pour un round observé et avance à droite pour un niveau observé. Pièges prioritaires à éviter : animer sur le timer, confondre round estimé et round observé, inventer hashes/parentés/étapes, masquer une branche sur téléphone, ou faire descendre la caméra au retour à round 0.
