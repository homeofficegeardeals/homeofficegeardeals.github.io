// On-site advisor: matches a plain-English request to real products in the shortlist.
// No API, no cost: everything runs from assets/products.json in the browser.
(function () {
  var script = document.currentScript;
  var base = script ? new URL(".", script.src).pathname : "/assets/";
  var root = base.replace(/assets\/$/, "");

  var STOP = new Set(("a an the for with and or to of in on at is are my me i want need best good cheap " +
    "under over around about something that which what do you recommend pick picks help please looking").split(" "));

  var CSS = "" +
    ".advisor{border:1px solid #d8dee6;border-radius:14px;padding:18px 18px 14px;margin:26px 0;background:#fbfcfe}" +
    ".advisor h2{margin:0 0 6px;font-size:1.05rem}" +
    ".advisor p.advisor-hint{margin:0 0 12px;color:#5b6472;font-size:.92rem}" +
    ".advisor form{display:flex;gap:8px;flex-wrap:wrap}" +
    ".advisor input[type=search]{flex:1 1 260px;min-width:0;padding:11px 12px;border:1px solid #c7d0da;border-radius:10px;font:inherit}" +
    ".advisor button{padding:11px 16px;border:0;border-radius:10px;background:#111827;color:#fff;font:inherit;cursor:pointer}" +
    ".advisor button:hover{background:#1f2937}" +
    ".advisor .advisor-out{margin-top:14px;display:grid;gap:10px}" +
    ".advisor .advisor-card{border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;background:#fff}" +
    ".advisor .advisor-card strong{display:block;margin-bottom:4px}" +
    ".advisor .advisor-card span{display:block;color:#5b6472;font-size:.9rem;margin-bottom:8px}" +
    ".advisor .advisor-card a{font-size:.9rem;margin-right:14px}" +
    ".advisor .advisor-empty{color:#5b6472;font-size:.92rem}";

  function tokenize(s) {
    return s.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(function (w) {
      return w && w.length > 2 && !STOP.has(w);
    });
  }

  function score(item, words) {
    var name = item.name.toLowerCase();
    var feats = (item.features || []).join(" ").toLowerCase();
    var page = (item.pageTitle || "").toLowerCase();
    var s = 0;
    words.forEach(function (w) {
      if (name.indexOf(w) >= 0) s += 4;
      if (feats.indexOf(w) >= 0) s += 1.5;
      if (page.indexOf(w) >= 0) s += 2;
    });
    if (item.pick) s += 0.75;
    if (item.rating) s += Math.min(Number(item.rating), 5) * 0.15;
    return s;
  }

  function why(item, words) {
    var feats = item.features || [];
    for (var i = 0; i < feats.length; i++) {
      var f = feats[i].toLowerCase();
      for (var j = 0; j < words.length; j++) if (f.indexOf(words[j]) >= 0) return feats[i];
    }
    return feats[0] || "Matched on the product name";
  }

  function render(box, data, query) {
    var out = box.querySelector(".advisor-out");
    var words = tokenize(query);
    out.innerHTML = "";
    if (!words.length) {
      out.innerHTML = '<div class="advisor-empty">Add a few words, e.g. "quiet keyboard for calls".</div>';
      return;
    }
    var ranked = data.items
      .map(function (it) { return { it: it, s: score(it, words) }; })
      .filter(function (x) { return x.s >= 4; })
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, 3);

    if (!ranked.length) {
      out.innerHTML = '<div class="advisor-empty">Nothing matches that yet. <a href="' + root + 'categories.html">Browse the categories</a>.</div>';
      return;
    }

    ranked.forEach(function (r) {
      var it = r.it;
      var card = document.createElement("div");
      card.className = "advisor-card";
      card.innerHTML =
        "<strong>" + it.name + "</strong>" +
        "<span>" + why(it, words) + (it.rating ? " · " + it.rating + "/5" + (it.reviews ? " (" + it.reviews.toLocaleString() + " reviews)" : "") : "") + "</span>" +
        '<a href="' + root + it.page + '">See it in the guide</a>' +
        (it.asin ? '<a href="https://www.amazon.com/dp/' + it.asin + '?tag=homeoffic049c-20" target="_blank" rel="nofollow sponsored">Check price</a>' : "");
      out.appendChild(card);
    });
  }

  function build(box, data) {
    if (!document.getElementById("advisor-style")) {
      var st = document.createElement("style");
      st.id = "advisor-style";
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    box.innerHTML =
      '<h2>Tell us what you need</h2>' +
      '<p class="advisor-hint">Describe the job ("quiet keyboard for calls", "chair for lower back pain") and we match it to the shortlist.</p>' +
      '<form role="search"><input type="search" placeholder="e.g. chair for a bad back, under $300" aria-label="Describe what you need"><button type="submit">Find a pick</button></form>' +
      '<div class="advisor-out" aria-live="polite"></div>';
    var form = box.querySelector("form");
    var input = box.querySelector("input");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      render(box, data, input.value);
    });
  }

  function init() {
    var boxes = document.querySelectorAll("[data-advisor]");
    if (!boxes.length) return;
    fetch(base + "products.json", { cache: "force-cache" })
      .then(function (r) { return r.json(); })
      .then(function (data) { boxes.forEach(function (b) { build(b, data); }); })
      .catch(function () { boxes.forEach(function (b) { b.hidden = true; }); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
