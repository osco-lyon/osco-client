/*
 * Authors : Thomas Andre, Victor Bonnin, Pierre Niogret, Bénédicte Thomas
 * Licence: GPLv3 or later
 */

function Osmapi(url, auth, tool) {
  this.url = url;
  this.auth = auth;
  this.tool = tool;

  this.login = function(callback) {
    auth.authenticate(function() {
      callback();
    });
  };

  this.logout = function(callback) {
    auth.logout();
    callback();
  };

  this._get = function(uri, callback) {
    auth.xhr(
      {
        method: "GET",
        path: uri
      },
      callback
    );
  };

  this._put = function(uri, data, callback) {
    xhr = auth.xhr(
      {
        method: "PUT",
        path: uri,
        content: data,
        options: { header: Object({ "Content-Type": "application/xml" }) }
      },
      callback
    );
  };

  this._post = function(uri, data, callback) {
    xhr = auth.xhr(
      {
        method: "POST",
        path: uri,
        content: data,
        options: { header: Object({ "Content-Type": "application/xml" }) }
      },
      callback
    );
  };

  this.createChangeset = function(comment, callback) {
    uri = "/api/0.6/changeset/create";
    xml =
      `
            <osm>
                <changeset>
                    <tag k="created_by" v="` +
      this.tool +
      `"/>
                    <tag k="comment" v="` +
      comment +
      `"/>
                </changeset>
            </osm>`;
    this._put(uri, xml, callback);
  };

  this.closeChangeset = function(id, callback) {
    uri = "/api/0.6/changeset/" + id + "/close";
    this._put(uri, "", callback);
  };

  this.getUserDetails = function(callback) {
    this._get("/api/0.6/user/details", callback);
  };

  this.updateWays = function(id, ways, callback) {
    uri = "/api/0.6/changeset/" + id + "/upload";
    xml =
      `<osmChange version="0.6" generator="` +
      this.tool +
      `">
            <modify>`;
    ways.forEach(way => {
      xml += way.children[0].innerHTML;
    });
    xml += `    </modify>
        </osmChange>
        `;
    this._post(uri, xml, callback);
  };

  this.getWay = function(id, callback) {
    this._get("/api/0.6/way/" + id, callback);
  };

  this.getFullWay = function(id, callback) {
    this._get("/api/0.6/way/" + id + "/full", callback);
  };

  this.getWays = function(ids, callback) {
    this._get("/api/0.6/ways?ways=" + ids.join(","), callback);
  };

  this.getWayTag = function(xml, key) {
    var tags = xml.documentElement.getElementsByTagName("tag");
    for (var i = 0; i < tags.length; i++) {
      if (tags[i].getAttribute("k") === key) {
        return tags[i].getAttribute("v");
      }
    }
    return null;
  };

  this.editWayTag = function(xml, key, value) {
    var tags = xml.documentElement.getElementsByTagName("tag");
    for (var i = 0; i < tags.length; i++) {
      if (tags[i].getAttribute("k") === key) {
        tags[i].setAttribute("v", value);
        return;
      }
    }
    var newTag = xml.createElement("tag");
    newTag.setAttribute("k", key);
    newTag.setAttribute("v", value);
    var parentNode = xml.getElementsByTagName("way")[0];
    parentNode.appendChild(newTag);
  };

  this.removeWayTag = function(xml, key) {
    var tags = xml.documentElement.getElementsByTagName("tag");
    for (var i = 0; i < tags.length; i++) {
      if (tags[i].getAttribute("k") === key) {
        xml.getElementsByTagName("way")[0].removeChild(tags[i]);
        return;
      }
    }
  };
}
