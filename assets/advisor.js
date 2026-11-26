// On-site advisor: matches a plain-English request to real products in the shortlist.
// Runs entirely in the browser from assets/products.json - no API, no per-query cost.
(function () {
  var script = document.currentScript;
  var base = script ? new URL(".", script.src).pathname : "/assets/";
  var root = base.replace(/assets\/$/, "");

  var STOP = new Set(("a an the for with and or to of in on at is are my me i want need best good cheap " +
    "under over around about something that which what do you recommend pick picks help please looking " +
    "some any really very would could should get got buy").split(" "));

  // Words people use mapped onto words the catalogue uses.
  var SYN = {
    chair: ["ergonomic", "lumbar", "mesh", "seat", "back", "posture", "office chair", "armrest"],
    desk: ["standing", "sit-stand", "height", "table", "frame"],
    keyboard: ["keys", "typing", "mechanical", "membrane", "keycaps", "keypad"],
    mouse: ["vertical", "trackball", "wrist", "grip", "pointer", "scroll"],
    webcam: ["camera", "1080p", "4k", "shutter", "video call", "zoom", "stream"],
    headphones: ["headset", "anc", "noise", "earcups", "mic", "calls", "audio", "bluetooth"],
    monitor: ["display", "screen", "qhd", "1440p", "ips", "hz", "4k"],
    ssd: ["storage", "nvme", "disk", "drive", "tb", "hard drive"],
    router: ["wifi", "mesh", "band", "signal", "coverage", "ethernet"],
    dock: ["docking", "usb-c", "ports", "hub", "displaylink"],
    gpu: ["graphics", "card", "vram", "gaming"],
    cpu: ["processor", "ryzen", "intel", "cores", "socket"],
    bag: ["backpack", "laptop bag", "travel", "commute"],
    sock: ["socks", "wool", "crew", "feet"],
    vacuum: ["hoover", "cleaning", "pet", "hepa", "dust"],
    humidifier: ["humidity", "mist", "air", "dry air"],
    knife: ["chef", "kitchen", "blade", "cutting"],
    coffee: ["brewer", "drip", "pods", "espresso", "caffeine"],
    light: ["lamp", "lighting", "bright", "glare"],
    mic: ["microphone", "recording", "podcast", "voice"]
  };

  // Problem statements route to a category even when no product keyword is used.
  var INTENT = [
    { re: /back pain|posture|lumbar|spine|sit all day|sitting all day/i, page: /chair/i, why: "back support" },
    { re: /wrist|rsi|carpal|hand pain|mouse arm/i, page: /mouse|keyboard|accessor/i, why: "wrist comfort" },
    { re: /neck|eye strain|tired eyes|headache|screen height/i, page: /monitor|desk|chair/i, why: "screen height" },
    { re: /zoom|teams|meeting|call|webinar|presentation/i, page: /webcam|headphone/i, why: "looking and sounding clear on calls" },
    { re: /noisy|noise|quiet|hear the fan|open office/i, page: /headphone/i, why: "cutting background noise" },
    { re: /small room|tiny|studio|bedroom|corner/i, page: /desk/i, why: "fitting a small room" },
    { re: /wifi|wi-fi|signal|drops|dead zone|upstairs/i, page: /router/i, why: "covering the whole place" },
    { re: /storage|full disk|backup|photos|large files/i, page: /hard-drive|storage/i, why: "more space for files" },
    { re: /gaming|fps|frame rate/i, page: /gpu|cpu|monitor/i, why: "frame rate" },
    { re: /coffee|espresso|brew|morning/i, page: /kitchen|small-appliance/i, why: "the morning routine" },
    { re: /clean|dust|pet hair|hoover|vacuum/i, page: /home-goods/i, why: "cleaning up" },
    { re: /dry air|humidity|static|congestion/i, page: /health-household/i, why: "air quality" }
  ];

  var CSS = "" +
    ".advisor{max-width:1180px;margin:0 auto 2.5rem;padding:18px 1.5rem 0;box-sizing:border-box}" +
    ".advisor-inner{border:1px solid #d8dee6;border-radius:14px;padding:20px 20px 16px;background:#fbfcfe}" +
    ".advisor h2{margin:0 0 6px;font-size:1.05rem}" +
    ".advisor p.advisor-hint{margin:0 0 12px;color:#5b6472;font-size:.92rem}" +
    ".advisor form{display:flex;gap:8px;flex-wrap:wrap}" +
    ".advisor input[type=search]{flex:1 1 260px;min-width:0;padding:11px 12px;border:1px solid #c7d0da;border-radius:10px;font:inherit}" +
    ".advisor button{padding:11px 16px;border:0;border-radius:10px;background:#111827;color:#fff;font:inherit;cursor:pointer}" +
    ".advisor button:hover{background:#1f2937}" +
    ".advisor .advisor-out{margin-top:14px;display:grid;gap:10px}" +
    ".advisor .advisor-note{margin-top:10px;color:#5b6472;font-size:.86rem}" +
    ".advisor .advisor-card{border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;background:#fff}" +
    ".advisor .advisor-card strong{display:block;margin-bottom:4px}" +
    ".advisor .advisor-card span{display:block;color:#5b6472;font-size:.9rem;margin-bottom:8px}" +
    ".advisor .advisor-card a{font-size:.9rem;margin-right:14px}" +
    ".advisor .advisor-empty{color:#5b6472;font-size:.92rem}";

  function stem(w) { return w.replace(/(ies)$/, "y").replace(/(es|s)$/, ""); }

  function tokenize(s) {
    return s.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).filter(function (w) {
      return w && w.length > 2 && !STOP.has(w);
    }).map(stem);
  }

  function expand(words) {
    var set = new Set(words);
    words.forEach(function (w) {
      Object.keys(SYN).forEach(function (k) {
        var list = SYN[k];
        var hit = stem(k) === w || list.some(function (s) { return s.indexOf(w) >= 0 || w.indexOf(stem(s)) >= 0; });
        if (hit) { set.add(stem(k)); list.forEach(function (s) { s.split(" ").forEach(function (p) { if (p.length > 2) set.add(stem(p)); }); }); }
      });
    });
    return Array.from(set);
  }

  function score(item, words, raw) {
    var name = item.name.toLowerCase();
    var feats = (item.features || []).join(" ").toLowerCase();
    var page = (item.pageTitle || "").toLowerCase();
    var s = 0;
    words.forEach(function (w) {
      if (name.indexOf(w) >= 0) s += 4;
      if (feats.indexOf(w) >= 0) s += 1.5;
      if (page.indexOf(w) >= 0) s += 2;
    });
    // Whole phrase in the name is a strong signal.
    var cleaned = raw.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
    if (cleaned.length > 8 && name.indexOf(cleaned.trim()) >= 0) s += 8;
    INTENT.forEach(function (r) {
      if (r.re.test(raw) && r.page.test(item.page + " " + page)) s += 4;
    });
    if (item.pick) s += 0.75;
    if (item.rating) s += Math.min(Number(item.rating), 5) * 0.15;
    return s;
  }

  function why(item, words, raw) {
    for (var r = 0; r < INTENT.length; r++) {
      if (INTENT[r].re.test(raw) && INTENT[r].page.test(item.page + " " + (item.pageTitle || ""))) return "Good for " + INTENT[r].why;
    }
    var feats = item.features || [];
    for (var i = 0; i < feats.length; i++) {
      var f = feats[i].toLowerCase();
      for (var j = 0; j < words.length; j++) if (f.indexOf(words[j]) >= 0) return feats[i];
    }
    return feats[0] || "Matched on the product name";
  }

  function render(box, data, query) {
    var out = box.querySelector(".advisor-out");
    var raw = query;
    var words = tokenize(query);
    out.innerHTML = "";
    if (!words.length) {
      out.innerHTML = '<div class="advisor-empty">Add a few words, e.g. "quieter keyboard for calls" or "chair for a bad back".</div>';
      return;
    }
    var expanded = expand(words);
    // If the request names a product type, only that type is eligible - "quiet keyboard" should
    // return keyboards, not the quietest headphones.
    var types = Object.keys(SYN).filter(function (k) {
      return words.indexOf(stem(k)) >= 0 || words.some(function (w) { return stem(k) === w || (stem(k).length > 3 && w.indexOf(stem(k)) === 0); });
    });
    var pool = data.items;
    if (types.length) {
      pool = data.items.filter(function (it) {
        var hay = (it.name + " " + (it.pageTitle || "") + " " + (it.page || "")).toLowerCase();
        return types.some(function (t) {
          if (hay.indexOf(t) >= 0) return true;
          return (SYN[t] || []).some(function (s) { return hay.indexOf(s) >= 0; });
        });
      });
      if (!pool.length) pool = data.items;
    }
    var ranked = pool
      .map(function (it) { return { it: it, s: score(it, expanded, raw) }; })
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
        "<span>" + why(it, expanded, raw) + (it.rating ? " · " + it.rating + "/5" + (it.reviews ? " (" + it.reviews.toLocaleString() + " reviews)" : "") : "") + "</span>" +
        '<a href="' + root + it.page + '">See it in the guide</a>' +
        (it.asin ? '<a href="https://www.amazon.com/dp/' + it.asin + '?tag=homeoffic049c-20" target="_blank" rel="nofollow sponsored">Check price</a>' : "");
      out.appendChild(card);
    });

    if (/\$|under \d+|budget|cheap/i.test(raw)) {
      var note = document.createElement("div");
      note.className = "advisor-note";
      note.textContent = "We don't quote prices - Amazon changes them. Each card links to the live listing so you see the current price.";
      out.appendChild(note);
    }
  }

  function build(box, data) {
    if (!document.getElementById("advisor-style")) {
      var st = document.createElement("style");
      st.id = "advisor-style";
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    box.innerHTML =
      '<div class="advisor-inner">' +
      '<h2>Tell us what you need</h2>' +
      '<p class="advisor-hint">Describe the job - "quieter keyboard for calls", "chair for a bad back", "wifi drops upstairs" - and we match it to the shortlist.</p>' +
      '<form role="search"><input type="search" placeholder="e.g. chair for a bad back, small room desk" aria-label="Describe what you need"><button type="submit">Find a pick</button></form>' +
      '<div class="advisor-out" aria-live="polite"></div>' +
      '</div>';
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
