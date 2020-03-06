/*
 * Authors : Thomas Andre, Victor Bonnin, Pierre Niogret, Bénédicte Thomas
 * Licence: GPLv3 or later
 */

var map;
var osm_lg;
var osm;

var osm_ids = [];
var osm_xml = [];
var osm_mod = [];

var xml;
var xui = [];

api = new Osmapi(
  "https://osm.anatidaepho.be:3000/",
  osmAuth({
    url: "https://osm.anatidaepho.be:3000",
    oauth_secret: "x5IZIEgVETkl1Yd9nHxgvS2RkAjor6nca9N8dVHN",
    oauth_consumer_key: "GVsqdgYgHP8NOERhsvCOLq6Wnx7XWXjynIHJFe0E"
  }),
  "OSCO"
);

init = function() {
  map = L.map("map", { attributionControl: true, zoomControl: false });
  osm_lg = L.layerGroup().addTo(map);
  var osmUrl =
    "https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png?apikey=e66bf088531a49c694116e61095854a1";

  var osmAttrib = "Map data © OpenStreetMap Contributeur";

  // Lien vers la légende
  L.tileLayer(osmUrl, {
    attribution:
      ' Map data © OpenStreetMap Contributeur - Carte OpenCycleMap <a href="https://www.opencyclemap.org/docs/">Légende</a>',
    opacity: 0.5
  }).addTo(map);

  // Création de la vue selon les paramètres en url
  params = window.location.search.substring(1);
  coords = params.split(",");
  if (coords.length == 4) {
    map.fitBounds([
      [coords[3], coords[2]],
      [coords[1], coords[0]]
    ]);
  } else {
    map.setView([45.76, 4.85], 12);
  }

  // Zoom à droite
  L.control
    .zoom({
      position: "topright"
    })
    .addTo(map);

  L.easyButton(
    '<img src="img/red_flag.png" style="width:16px">',
    function() {
      location.href = "index.html";
    },
    { position: "topright" }
  ).addTo(map);

  var sidebar = L.control.sidebar("sidebar", {
    position: "left"
  });
  map.addControl(sidebar);
  sidebar.show();

  update();
};

function login() {
  api.login(update);
}

function logout() {
  api.logout(update);
}

function commitChanges() {
  api.createChangeset("Modification OSCO", function(err, xhr) {
    if (err) {
      showMessage(
        "❌ Erreur",
        "Impossible d'envoyer les modifications."
      );
      logout();
      return;
    } else {
      id_changeset = xhr;
      ways = [];
      for (i = 0; i < osm_mod.length; i++) {
        if (osm_mod[i] == true) {
          osm_xml[i]
            .getElementsByTagName("way")[0]
            .setAttribute("changeset", id_changeset);
          ways.push(osm_xml[i]);
        }
      }
      api.updateWays(id_changeset, ways, function(err, xhr) {
        if (err) {
          showMessage(
            "❌ Erreur",
            "Impossible d'envoyer les modifications."
          );
          logout();
          return;
        } else {
          api.closeChangeset(id_changeset, function(err, xhr) {
            showMessage(
              "✅ Contribution envoyée",
              "Merci de votre contribution à OpenStreetMap.<br/>Vous pouvez contribuer sur les nouvelles routes affichées."
            );
            update();
          });
        }
      });
    }
  });
}

// Mise à jour de l'affichage à la connexion/déconnexion
function update() {
  if (api.auth.authenticated()) {
    api.getUserDetails(function(err, xhr) {
      if (err) {
        document.getElementById("logged").style.display = "none";
        document.getElementById("unlogged").style.display = "block";
        showMessage(
          "Erreur ❌",
          "Impossible de se connecter. Veuillez réessayer ultérieurement."
        );
      } else {
        document.getElementById("logged").style.display = "block";
        document.getElementById("unlogged").style.display = "none";
        document.getElementById(
          "username"
        ).innerHTML = xhr
          .getElementsByTagName("user")[0]
          .getAttribute("display_name");
        updateContribUI(null);
        getMapEntities();
      }
    });
  } else {
    document.getElementById("logged").style.display = "none";
    document.getElementById("unlogged").style.display = "block";
    osm_lg.clearLayers();
  }
}

// Fonction de génération de l'interface HTML de contribution
// On ajoute l'interface si l'attribut n'existe pas
function generateXUI(id, xml) {
  html = `<strong>id OSM</strong><br/>` + id + `<br/><br/>`;
  if (!api.getWayTag(xml, "maxspeed")) {
    html += `<strong>Vitesse max.</strong><br/>
      <select id="maxspeed" style="width: 200px">
        <option></option>
        <option>5</option>
        <option>10</option>
        <option>20</option>
        <option>30</option>
        <option>50</option>
        <option>70</option>
        <option>80</option>
        <option>90</option>
      </select><br/><br/>
    `;
  }
  if (!api.getWayTag(xml, "surface")) {
    html += `<strong>Type de revêtement</strong><br/>
      <select id="surface" style="width: 200px">
        <option></option>
        <option value="asphalt">Asphalte</option>
        <option value="paved">Pavé</option>
        <option value="concrete">Béton</option>
        <option value="compacted">Matériaux compactés</option>
        <option value="ground">Pas de revêtement</option>
      </select><br/><br/>
    `;
  }
  return html;
}

function updateContribUI(id) {
  // Si l'on a sélectionné une entité
  if (id) {
    // On récupère les entités liées à la contribution (osmxml et interface html)
    xml = osm_xml[osm_ids.indexOf(id)];
    document.getElementById("contribution").innerHTML =
      xui[osm_ids.indexOf(id)];

    // Au changement de sélection, on définit l'attribut selected à l'option choisie pour la conserverx
    document.getElementById("contribution").onchange = function() {
      maxspeed = document.getElementById("maxspeed");
      surface = document.getElementById("surface");
      osm_mod[osm_ids.indexOf(id)] = false;
      ms_i = 0;
      surf_i = 0;
      if (maxspeed) {
        ms_i = maxspeed.selectedIndex;
        for (i = 0; i < maxspeed.children.length; i++) {
          maxspeed.children[i].removeAttribute("selected");
        }
        maxspeed[ms_i].setAttribute("selected", "");
        // Mis à jour des tags sur le osmxml et du flag de màj
        if (ms_i > 0) {
          api.editWayTag(xml, "maxspeed", maxspeed.value);
          osm_mod[osm_ids.indexOf(id)] = true;
        } else {
          api.removeWayTag(xml, "maxspeed");
        }
      }
      if (surface) {
        surf_i = surface.selectedIndex;
        for (i = 0; i < surface.children.length; i++) {
          surface.children[i].removeAttribute("selected");
        }
        surface[surf_i].setAttribute("selected", "");
        // Mis à jour des tags sur le osmxml et du flag de màj
        if (surf_i > 0) {
          api.editWayTag(xml, "surface", surface.value);
          osm_mod[osm_ids.indexOf(id)] = true;
        } else {
          api.removeWayTag(xml, "surface");
        }
      }
      xui[osm_ids.indexOf(id)] = document.getElementById(
        "contribution"
      ).innerHTML;
    };
  } else {
    document.getElementById("contribution").innerHTML =
      "Aucune entité sélectionnée pour le moment.";
  }
}

function showMessage(title, message) {
  document.getElementById("message_title").innerHTML = title;
  document.getElementById("message_content").innerHTML = message;
  $("#message").modal("show");
}

// Fonction pour récupérer les entités à compléter depuis l'API OSCO
// Récupère 20 éléments aléatoirement dans la bbox de la carte
function getMapEntities() {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "https://osco.anatidaepho.be/api/contribution", true);
  xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhr.onreadystatechange = function() {
    if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
      json = JSON.parse(this.response);
      osm_ids = [];
      osm_xml = [];
      osm_mod = [];
      xui = [];
      osm_lg.clearLayers();
      osm = L.geoJson(null, {
        onEachFeature: function(feature, layer) {
          x = feature.geometry.coordinates[0][1];
          y = feature.geometry.coordinates[0][0];
          marker = L.marker([x, y]).addTo(osm_lg);
          marker.on("click", function(e) {
            id = feature.properties.osm_id;
            if (!osm_ids.includes(id)) {
              api.getWay(id, function(err, xhr) {
                if (err) {
                  showMessage(
                    "❌ Erreur",
                    "Impossible de joindre OpenStreetMap. Veuillez réessayer ultérieurement."
                  );
                  logout();
                  return;
                } else {
                  osm_ids.push(id);
                  osm_xml.push(xhr);
                  osm_mod.push(false);
                  xui.push(generateXUI(id, xhr));
                  updateContribUI(id);
                }
              });
            } else {
              updateContribUI(id);
            }
          });
        }
      }).addTo(osm_lg);
      osm.addData(json);
    }
    if (this.status != 200) {
      showMessage(
        "❌ Erreur",
        "Impossible de joindre l'API. Veuillez réessayer ultérieurement."
      );
    }
  };
  bbox =
    map.getBounds().getWest() +
    "," +
    map.getBounds().getNorth() +
    "," +
    map.getBounds().getEast() +
    "," +
    map.getBounds().getSouth();
  data =
    `json=[{"tags" : ["maxspeed","surface"], "bbox" : [` +
    bbox +
    `], "nelt":20}]`;
  xhr.send(data);
}

cheet("↑ ↑ ↓ ↓ ← → ← → b a", function() {
  showMessage(
    "OSCO",
    `<iframe width="560" height="315" src="https://www.youtube.com/embed/yeyXSVyjRoc?start=14&autoplay=1";"></iframe>`,
    true
  );
});
