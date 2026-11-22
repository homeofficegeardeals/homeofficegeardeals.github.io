// Client-side search: loads search-index.json once, scores title/heading/body matches.
(function () {
  "use strict";
  var input = document.getElementById("q");
  var list = document.getElementById("search-results");
  var status = document.getElementById("search-status");
  if (!input || !list || !status) return;

  var index = [];
  var root = document.body.dataset.root || "";

  fetch(root + "assets/search-index.json")
    .then(function (r) { return r.json(); })
    .then(function (data) { index = data.pages || []; run(); })
    .catch(function () { status.textContent = "Search index could not be loaded."; });

  function score(page, terms) {
    var h = 0;
    terms.forEach(function (t) {
      if (page.title.toLowerCase().indexOf(t) > -1) h += 6;
      if ((page.headings || "").toLowerCase().indexOf(t) > -1) h += 3;
      if ((page.text || "").toLowerCase().indexOf(t) > -1) h += 1;
    });
    return h;
  }

  function run() {
    var q = (input.value || "").trim().toLowerCase();
    list.innerHTML = "";
    if (q.length < 2) { status.textContent = "Type at least two characters."; return; }
    var terms = q.split(/\s+/).filter(Boolean);
    var hits = index
      .map(function (p) { return { page: p, s: score(p, terms) }; })
      .filter(function (x) { return x.s > 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, 12);

    if (!hits.length) { status.textContent = "Nothing matched. Try a broader term."; return; }
    status.textContent = hits.length + " result" + (hits.length === 1 ? "" : "s");
    hits.forEach(function (hit) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = root + hit.page.url;
      a.textContent = hit.page.title;
      var p = document.createElement("p");
      p.textContent = (hit.page.summary || "").slice(0, 160);
      li.appendChild(a);
      li.appendChild(p);
      list.appendChild(li);
    });
  }

  input.addEventListener("input", run);
  var params = new URLSearchParams(location.search);
  if (params.get("q")) { input.value = params.get("q"); run(); }
})();
