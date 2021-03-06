/*
 * Authors : Thomas Andre, Victor Bonnin, Pierre Niogret, Bénédicte Thomas
 * Licence: GPLv3 or later
 */

// Déclaration Carte OSM Cycle
var map = L.map("map", { attributionControl: true, zoomControl: false });
var osmUrl =
  "https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=e66bf088531a49c694116e61095854a1";
var osmAttrib = "Map data © OpenStreetMap Contributeur";
var api_url = window.location.origin + "/api"

// Lien vers la légende
L.tileLayer(osmUrl, {
  opacity: 0.5,
  attribution:
    ' Map data © OpenStreetMap Contributeur - Carte OpenCycleMap <a href="https://www.opencyclemap.org/docs/">Légende</a>'
}).addTo(map);

map.setView([45.76, 4.85], 12);

// Zoom à droite
L.control
  .zoom({
    position: "topright"
  })
  .addTo(map);

function showMessage(title, message, closable) {
  title =
    `<h4 class="modal-title" id="message_title" style="text-align: center;">` +
    title +
    `</h4>`;
  document.getElementById("message_content").innerHTML = message;
  if (closable) {
    document.getElementById("message_header").innerHTML =
      `
      <button id="message_button" type="button" class="close" data-dismiss="modal">
        &times;
      </button>
      ` + title;
  } else {
    document.getElementById("message_header").innerHTML = title;
  }
  $("#message").modal("show");
}

function closeMessage() {
  $("#message").modal("hide");
}

var bbox = [45.5497, 4.714508, 45.95473, 5.07019];

var geocoder = new L.Control.Geocoder.Nominatim({
  geocodingQueryParams: {
    viewbox: "4.714508,45.5497,5.07019,45.95473",
    bounded: "1"
  },
  reverseQueryParams: {
    viewbox: "4.714508,45.5497,5.07019,45.95473",
    bounded: "1"
  }
});

// Définition des coordonnées des points de départ et d'arrivée
xdep = null;
ydep = null;
xarr = null;
yarr = null;

// Définition des critères pour les valeurs des sliders (paramètres utilisateur)
c1 = null;
c2 = null;
c3 = null;
c4 = null;

function inBbox(latlng, bbox) {
  return (
    latlng.lat > bbox[0] &&
    latlng.lat < bbox[2] &&
    latlng.lng > bbox[1] &&
    latlng.lng < bbox[3]
  );
}

//Search geocoding: starting point geocoder control + parsing coordinates to get lat/lng with GeocodingResult
var markerDepGrp = L.layerGroup().addTo(map);
var geocoderDep = L.Control.geocoder({
  collapsed: false,
  position: "topleft",
  placeholder: "Votre adresse de départ",
  errorMessage: "Aucun résultat trouvé :(",
  geocoder: geocoder,
  defaultMarkGeocode: false
})
  .on("markgeocode", function (event) {
    var nom = event.geocode.name;
    geocoderDep.setQuery(
      nom.length > 20 ? nom.substring(0, 20) + "(...)" : nom.substring(0, 20)
    );
    var center = event.geocode.center;
    var y1 = center
      .toString()
      .substring(
        center.toString().lastIndexOf("(") + 1,
        center.toString().lastIndexOf(",")
      );
    var x1 = center
      .toString()
      .substring(
        center.toString().lastIndexOf(",") + 1,
        center.toString().lastIndexOf(")")
      );
    markerDepGrp.clearLayers();
    var markerDep = new L.marker(center, {
      icon: L.icon({
        iconUrl: "img/green_flag.png",
        iconSize: [41, 41],
        iconAnchor: [0, 41]
      }),
      draggable: true
    })
      .addTo(markerDepGrp)
      .on("dragend", function (e) {
        var latlng = e.target.getLatLng();
        if (inBbox(latlng, bbox)) {
          geocoder.reverse(
            latlng,
            map.options.crs.scale(map.getZoom()),
            function (addr) {
              if (addr.length > 0) {
                nom = addr[0].name;
                geocoderDep.setQuery(
                  nom.length > 20
                    ? nom.substring(0, 20) + "(...)"
                    : nom.substring(0, 20)
                );
                xdep = latlng.lng;
                ydep = latlng.lat;
                if (itineraire.getLayers().length > 0) {
                  createItineraire();
                }
              } else {
                markerDepGrp.clearLayers();
                geocoderDep.setQuery("Aucune adresse trouvée");
                xdep = "";
                ydep = "";
              }
            },
            this
          );
        } else {
          /*
           * En dehors de la zone
           */
          showMessage(
            "❌ Erreur",
            "Le marqueur est placé en dehors de la zone autorisée.",
            true
          );
          geocoderDep.setQuery("");
          markerDepGrp.clearLayers();
          xdep = "";
          ydep = "";
        }
      });
    map.setView(center, map.getZoom());
    xdep = x1;
    ydep = y1;
  })
  .addTo(map);

//Search geocoding: arrival point geocoder control + parsing coordinates to get lat/lng with GeocodingResult
var markerArrGrp = L.layerGroup().addTo(map);
var geocoderArr = L.Control.geocoder({
  collapsed: false,
  position: "topleft",
  placeholder: "Votre adresse d'arrivée",
  errorMessage: "Aucun résultat trouvé :(",
  geocoder: geocoder,
  defaultMarkGeocode: false
})
  .on("markgeocode", function (event) {
    var nom = event.geocode.name;
    geocoderArr.setQuery(
      nom.length > 20 ? nom.substring(0, 20) + "(...)" : nom.substring(0, 20)
    );
    var center = event.geocode.center;
    var y2 = center
      .toString()
      .substring(
        center.toString().lastIndexOf("(") + 1,
        center.toString().lastIndexOf(",")
      );
    var x2 = center
      .toString()
      .substring(
        center.toString().lastIndexOf(",") + 1,
        center.toString().lastIndexOf(")")
      );
    markerArrGrp.clearLayers();
    var markerArr = new L.marker(center, {
      icon: L.icon({
        iconUrl: "img/red_flag.png",
        iconSize: [40, 43],
        iconAnchor: [0, 43]
      }),
      draggable: true
    })
      .addTo(markerArrGrp)
      .on("dragend", function (e) {
        var latlng = e.target.getLatLng();
        if (inBbox(latlng, bbox)) {
          geocoder.reverse(
            latlng,
            map.options.crs.scale(map.getZoom()),
            function (addr) {
              if (addr.length > 0) {
                nom = addr[0].name;
                geocoderArr.setQuery(
                  nom.length > 20
                    ? nom.substring(0, 20) + "(...)"
                    : nom.substring(0, 20)
                );
                xarr = latlng.lng;
                yarr = latlng.lat;
                if (itineraire.getLayers().length > 0) {
                  createItineraire();
                }
              } else {
                markerArrGrp.clearLayers();
                geocoderArr.setQuery("Aucune adresse trouvée");
                xarr = "";
                yarr = "";
              }
            },
            this
          );
        } else {
          /*
           * En dehors de la zone
           */
          showMessage(
            "❌ Erreur",
            "Le marqueur est placé en dehors de la zone autorisée.",
            true
          );
          geocoderArr.setQuery("");
          markerArrGrp.clearLayers();
          xarr = "";
          yarr = "";
        }
      });
    map.setView(center, map.getZoom());
    xarr = x2;
    yarr = y2;
  })
  .addTo(map);

// EasyButton Information

L.easyButton(
  '<img src="img/information.png" style="width:16px";position: topright >',
  function () {
    $("#myModal").modal("show");
  },
  { position: "topright" }
).addTo(map);

// EasyButton Aide : information sur le type de revêtement des routes

var aide_revetement = L.easyButton(
  '<img src="img/aide.png" style="width:16px">',
  function () {
    $("#myModalAide").modal("show");
  }
).addTo(map);

aide_revetement.button.style.marginTop = "-207px";
aide_revetement.button.style.marginLeft = "150px";

// EasyButton Aide aménagemment : information sur le type des aménagements cyclables

var aide_amenagement = L.easyButton(
  '<img src="img/aide.png" style="width:16px">',
  function () {
    $("#myModalAideAmenagement").modal("show");
  }
).addTo(map);

aide_amenagement.button.style.marginTop = "-107px";
aide_amenagement.button.style.marginLeft = "150px";

// EasyButton Aide vitesse : information sur la vitesse autorisée sur une route

var aide_vitesse = L.easyButton(
  '<img src="img/aide.png" style="width:16px">',
  function () {
    $("#myModalAideVitesse").modal("show");
  }
).addTo(map);

aide_vitesse.button.style.marginTop = "-157px";
aide_vitesse.button.style.marginLeft = "150px";

var itineraire = L.geoJSON(null, {
  style: function (feature, layer) {
    return style(feature);
  }
}).addTo(map);

displayPanneau = function () {
  $("#BGDep").hide();
  $("#BGArr").hide();
  $("#BCP").hide();
  $("#BRI").show();
  $("#aide_revetement_paragraphe").hide();
  $("#aide_vitesse_paragraphe").hide();
  $("#aide_amenagement_paragraphe").hide();
  $("#slider1").hide();
  $("#slider2").hide();
  $("#slider3").hide();
  $("#slider4").hide();
  $("#dropdownMenu1").hide();
  $("#T_iti").hide();
  $("#T_res").show();
  $("#resnote").show();
  $("#restime").show();
  $("#reslen").show();
  $("#restimeX").show();
  $("#reslenX").show();
  $("#imgnote").show();
  $("#Legende").show();
};

var choix_itineraire = null;
//On récupère le type d'itinéraire choisi par l'utilisateur
$(".type-itineraire li").on("click", function () {
  choix_itineraire = $(this)[0].id;
});

createItineraire = function () {
  /*
   * Si les deux adresses ne sont pas renseignées
   */
  if (!xdep || !xarr) {
    showMessage(
      "❌ Erreur",
      "Veuillez renseigner correctement les adresses de départ et d'arrivée.",
      true
    );
    return;
  }

  showMessage(
    "Recherche d'un itinéraire...",
    '<img src="img/loading.gif"><br/><p align="right">© Nintendo</p>',
    false
  );

  url = null;
  dataAPI = null;

  //recours aux coordonnées et critères définis préalablement

  if (choix_itineraire == "personnalisation") {
    url = api_url+"/perso";
    document.getElementById("type_itineraire").innerHTML = "personnalisé";
    dataAPI =
      'json=[{"critere":{"surface":' +
      $("#SL1").val() +
      ',"amenagement":' +
      $("#SL2").val() +
      ',"vitesse":' +
      $("#SL3").val() +
      '}, "geometry":[{"x":' +
      xdep +
      ',"y":' +
      ydep +
      '},{"x":' +
      xarr +
      ',"y":' +
      yarr +
      "}]}]";
  } else if (choix_itineraire == "TYPEcourt") {
    url = api_url+"/rapide";
    document.getElementById("type_itineraire").innerHTML = "rapide";
    dataAPI =
      'json=[{"geometry":[{"x":' +
      xdep +
      ',"y":' +
      ydep +
      '},{"x":' +
      xarr +
      ',"y":' +
      yarr +
      "}]}]";
  } else if (choix_itineraire == "TYPEamenage") {
    url = api_url+"/amenagement";
    document.getElementById("type_itineraire").innerHTML = "aménagé";
    dataAPI =
      'json=[{"geometry":[{"x":' +
      xdep +
      ',"y":' +
      ydep +
      '},{"x":' +
      xarr +
      ',"y":' +
      yarr +
      "}]}]";
  } else {
    url = api_url+"/recommande";
    document.getElementById("type_itineraire").innerHTML = "recommandé";
    dataAPI =
      'json=[{"geometry":[{"x":' +
      xdep +
      ',"y":' +
      ydep +
      '},{"x":' +
      xarr +
      ',"y":' +
      yarr +
      "}]}]";
  }
  $.ajax({
    url: url,
    type: "POST",
    data: dataAPI,
    dataType: "json",
    success: function (json, statut) {
      /*
       * Si l'itinéraire retourné est nul
       */
      if (!json.features) {
        showMessage("❌ Erreur", "Aucun itinéraire trouvé.", true);
        return;
      }
      /*
       * Affichage du trajet
       */
      itineraire.clearLayers();
      itineraire.addData(json);
      map.fitBounds(itineraire.getBounds());

      /*
       * Calcul des indices à afficher
       */
      note = 0;
      distance = 0;
      json.features.forEach(feature => {
        note += feature.properties.ida;
        distance += feature.properties.length;
      });
      note /= json.features.length;
      distance /= 1000;

      // Affichage de la note
      document.getElementById("imgnote").src =
        "img/score_OSCO/" + getLettreNote(note) + ".png";

      // Affichage de la distance et du temps de trajet
      document.getElementById("reslenX").innerHTML =
        distance.toFixed(2) + " kilomètres";
      document.getElementById("restimeX").innerHTML =
        Math.round((distance / 16) * 60) + " minutes";

      // Affichage de la légende
      legend.addTo(map);

      // Affichage du panneau
      displayPanneau();

      // Fermeture de la fenêtre de chargement
      closeMessage();
    },

    error: function (resultat, statut, erreur) {
      /*
       * Afficher un message d'erreur :(
       */
      showMessage(
        "❌ Erreur",
        "Le serveur est injoignable, veuillez réessayer plus tard.",
        true
      );
    }
  });
};

// EasyButton Validation itinéraire
var validate = L.easyButton(
  '<strong style="color: white">C\'est parti !</strong>',
  createItineraire
);

// Style du bouton "C'est parti !"
validate.button.style.width = "200px";
validate.button.style.backgroundColor = "red";
validate.button.style.marginTop = "230px";
validate.button.title = "Z'êtes sûr ?";
validate.addTo(map);

function getColor(d) {
  return d >= 3
    ? "#BD0026"
    : d >= 2
      ? "#F03B20"
      : d >= 1.25
        ? "#FD8D3C"
        : d >= 0.8
          ? "#FEB24C"
          : d >= 0.5
            ? "#FED976"
            : "#FFFFB2";
}

getLettreNote = function (note) {
  return note >= 3
    ? "F"
    : note >= 2
      ? "E"
      : note >= 1.25
        ? "D"
        : note >= 0.8
          ? "C"
          : note >= 0.5
            ? "B"
            : "A";
};

function style(feature) {
  return {
    color: getColor(feature.properties.ida),
    weight: 5,
    opacity: 1
  };
}

var legend = L.control({ position: "bottomright" });
legend.onAdd = function (map) {
  var div = L.DomUtil.create("div", "info legend"),
    grades = [0, 0.5, 0.8, 1.25, 2, 3],
    labels = ["A", "B", "C", "D", "E", "F"];

  //loop through our density intervals and generate a label with a colored square for each interval
  div.innerHTML += "<p><b>Note du<br/>tronçon</b></p>";
  for (var i = 0; i < grades.length; i++) {
    div.innerHTML +=
      labels[i] + '<i style="background:' + getColor(grades[i]) + '"></i><br/>';
  }

  return div;
};

// EasyButton Retour configuration initiale
var configInit = L.easyButton(
  '<strong style="color: white">Retour</strong>',
  function () {
    $("#BGDep").show();
    $("#BGArr").show();
    $("#BCP").show();
    $("#dropdownMenu1").show();
    $("#BRI").hide();
    $("#T_iti").show();
    $("#T_res").hide();
    $("#resnote").hide();
    $("#reslen").hide();
    $("#reslenX").hide();
    $("#restime").hide();
    $("#restimeX").hide();
    $("#imgnote").hide();
    $("#Legende").hide();
    itineraire.clearLayers();
    map.removeControl(legend);
  }
);

// Style du bouton Retour à la configuration initiale
configInit.button.style.width = "200px";
configInit.button.style.backgroundColor = "red";
configInit.button.style.marginTop = "50px";
configInit.button.title = "Machine arrière !";
configInit.addTo(map);

// Sidebar
var sidebar = L.control.sidebar("sidebar", {
  position: "left"
});

map.addControl(sidebar);

setTimeout(function () {
  sidebar.show();
}, 500);

// Change parent node of element from the map to elements include in the sidebar
// Call the getContainer routine.
var htmlObject = geocoderDep.getContainer();
var htmlObject1 = geocoderArr.getContainer();
var htmlObject2 = validate.getContainer();
var htmlObject3 = configInit.getContainer();
var htmlObject4 = legend.getContainer();
var htmlObject5 = aide_revetement.getContainer();
var htmlObject6 = aide_vitesse.getContainer();
var htmlObject7 = aide_amenagement.getContainer();

// Get the desired parent node.
var a = document.getElementById("BGDep");
var b = document.getElementById("BGArr");
var c = document.getElementById("BCP");
var d = document.getElementById("BRI");
//var e = document.getElementById("Legende");
var f = document.getElementById("aide_revetement_paragraphe");
var g = document.getElementById("aide_vitesse_paragraphe");
var h = document.getElementById("aide_amenagement_paragraphe");

// Finally append that node to the new parent, recursively searching out and re-parenting nodes.
function setParent(el, newParent) {
  newParent.appendChild(el);
}
setParent(htmlObject, a);
setParent(htmlObject1, b);
setParent(htmlObject2, c);
setParent(htmlObject3, d);
//setParent(htmlObject4, e);
setParent(htmlObject5, f);
setParent(htmlObject6, g);
setParent(htmlObject7, h);

// Sliders
var slider1 = new Slider("#SL1", {
  formatter: function (value) {
    return value + "/5";
  }
});

var slider2 = new Slider("#SL2", {
  formatter: function (value) {
    return value + "/5";
  }
});

var slider3 = new Slider("#SL3", {
  formatter: function (value) {
    return value + "/5";
  }
});

$(".dropdown-menu li a").click(function () {
  $(this)
    .parents(".dropdown")
    .find(".btn")
    .html($(this).text() + ' <span class="caret"></span>');
  $(this)
    .parents(".dropdown")
    .find(".btn")
    .val($(this).data("value"));
});

cheet("o s c o f o r e v e r", function () {
  showMessage(
    "OSCO",
    `<iframe width="560" height="315" src="https://www.youtube.com/embed/yeyXSVyjRoc?start=14&autoplay=1";"></iframe>`,
    true
  );
});
