# Client OSCO

Partie cliente de l'application OSCO, développée en HTML/CSS/JS. Elle effectue des requêtes vers [l'API](https://github.com/osco-lyon/osco-server) et affiche le résultat.

## Dépendences

Le projet s'appuie sur plusieurs bibliothèques, toutes fournies dans le dossier lib :

* [Bootstrap](https://getbootstrap.com/) + [Slider for Bootstrap](https://seiyria.com/bootstrap-slider/)
* [Leaflet](https://leafletjs.com/) + [Leaflet.EasyButton](https://github.com/CliffCloud/Leaflet.EasyButton) + [leaflet-sidebar](https://github.com/Turbo87/leaflet-sidebar) + [Leaflet Control Geocoder](https://github.com/perliedman/leaflet-control-geocoder)
* [jQuery](https://jquery.com/)
* [osm-auth](https://github.com/osmlab/osm-auth)
* [cheet](https://github.com/namuol/cheet.js/)

## Configuration

Selon la configuration de déploiement, il sera nécessaire de modifier les adresses de référence à OpenStreetMap dans les fichiers `index.js` et `contribution.js`. Il est également nécessaire de renseigner les clés Oauth associées à l'application dans le fichier `contribution.js`.

## ⚠ Précautions d'emploi

L'application n'a été testée que sur une instance de développement d'OpenStreetMap, elle ne devrait pas être utilisée sur l'instance officielle pour le moment !
