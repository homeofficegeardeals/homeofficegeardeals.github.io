// Subcategory toggles for the guide pages: chips that filter the cards in place.
// Config is keyed by page path; a chip only appears when it matches at least two products.
(function () {
  var script = document.currentScript;
  var base = script ? new URL(".", script.src).pathname : "/assets/";
  var path = location.pathname.replace(/^\/+/, "").replace(/\/$/, "/index.html");
  var slug = path.replace(/\/index\.html$/, "/").replace(/\.html$/, "");

  var CONFIG = {
    "monitors": [["Gaming", /gaming|hz|freesync|g-sync/i], ["4K", /\b4k\b|uhd/i], ["QHD", /qhd|1440/i], ["24-inch", /23\.8|24\.1|24mh|24 inch|24-inch/i], ["USB-C", /usb-c/i]],
    "chairs/ergonomic-chairs": [["Mesh", /mesh/i], ["Ergonomic", /ergonomic|lumbar/i], ["Premium", /herman|steelcase|aeron|leap/i]],
    "desks/standing-desks": [["Standing", /standing|sit-stand/i], ["Converters", /converter|riser/i], ["Dual motor", /dual motor|frame/i]],
    "webcams/webcams": [["1080p", /1080/i], ["4K", /\b4k\b/i], ["Privacy shutter", /shutter/i], ["Streaming", /brio|stream/i]],
    "headphones/headphones": [["Noise cancelling", /anc|noise/i], ["Calls", /mic|call|multipoint/i], ["Wired", /wired|studio/i]],
    "accessories/accessories": [["Mice", /mouse|mice/i], ["Keyboards", /keyboard/i], ["Monitor arms", /arm|mount/i], ["Hubs", /hub|dock|usb/i]],
    "laptops": [["Gaming", /gaming|rtx|strix/i], ["Budget", /celeron|stream|ideapad|aspire 3/i], ["2-in-1", /2-in-1|touch|convertible/i]],
    "pcs": [["Mini PCs", /mini/i], ["Towers", /tower|desktop/i]],
    "hard-drives": [["SSD", /ssd|nvme/i], ["Portable", /portable|external/i]],
    "routers": [["WiFi 6", /wifi 6|ax/i], ["Mesh", /mesh|deco/i], ["Gaming", /gaming|rt-ax/i]],
    "gpu": [["NVIDIA", /geforce|rtx|gtx/i], ["AMD", /radeon|\brx\b/i]],
    "cpu": [["AMD", /ryzen/i], ["Intel", /intel|core i/i]],
    "docking-stations": [["Dual display", /dual|2x hdmi/i], ["Triple display", /triple/i]],
    "beauty": [["Brushes", /toothbrush|sonicare|oral-b/i], ["Hair", /dryer|clipper|trimmer|shaver/i]],
    "health-household": [["Humidifiers", /humidif/i], ["Air quality", /purifier|air/i], ["Cleaning", /vacuum|mop|clean/i]],
    "home-goods": [["Vacuums", /vacuum/i], ["Cleaning", /clean|mop|spray/i], ["Storage", /storage|bin|organis/i]],
    "small-appliances": [["Coffee", /coffee|espresso|brewer/i], ["Air fryers", /air fryer/i], ["Blenders", /blender/i]],
    "kitchen": [["Knives", /knife|knives/i], ["Pans", /pan|skillet|cast iron/i], ["Coffee", /coffee|espresso/i]],
    "clothing": [["Men", /\bmen['â€™]?s\b|\bmens\b/i], ["Women", /\bwomen['â€™]?s\b|\bwomens\b|\bwoman\b/i], ["Unisex", /backpack|merino|darn tough/i], ["Boys", /\bboys?['â€™]?\b/i], ["Girls", /\bgirls?['â€™]?\b/i], ["Socks", /sock/i], ["Bags", /backpack|bag/i], ["Tops", /shirt|tee\b|top/i]],
    "components": [["Coolers", /cooler|nh-d15/i], ["Power supplies", /psu|power supply/i], ["Cases", /\bcase\b/i]]
  };

  var rules = CONFIG[slug] || null;
  if (!rules) return;

  var CSS = "" +
    ".picks-filters{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:14px 16px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;margin:18px 0 20px}" +
    ".picks-filters::before{content:'Filter by';font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:#64748b;margin-right:4px}" +
    ".picks-filters button{border:1px solid #d7dee8;background:#fff;color:#1f2937;border-radius:999px;padding:7px 14px;font:inherit;font-size:.9rem;cursor:pointer;transition:background .15s,color .15s,border-color .15s}" +
    ".picks-filters button:hover{border-color:#94a3b8}" +
    ".picks-filters button[aria-pressed=true]{background:#111827;color:#fff;border-color:#111827}" +
    ".picks-filters button span{margin-left:6px;font-size:.8em;opacity:.65}" +
    ".picks-filters .filter-toggle{width:100%;padding:9px 12px;border:1px solid #d7dee8;border-radius:10px;background:#fff;color:#33475f;font:inherit;font-size:.9rem;cursor:pointer;margin-bottom:4px;order:-2}" +
    ".picks-filters::before{order:-1}" +
    ".picks-filters[data-collapsed=true] button:not(.filter-toggle){display:none}" +
    ".picks-filters[data-collapsed=true]::before{display:none}";

  function init() {
    var box = document.querySelector("[data-filters]");
    var grid = document.querySelector("[data-pick-grid]");
    if (!box || !grid) return;
    if (!document.getElementById("filters-style")) {
      var st = document.createElement("style");
      st.id = "filters-style";
      st.textContent = CSS;
      document.head.appendChild(st);
    }

    var cards = Array.prototype.slice.call(grid.querySelectorAll("section.top-pick"));
    // The hero "Our pick" sits outside the grid but should count and filter too.
    var allCards = Array.prototype.slice.call(document.querySelectorAll("section.top-pick"));
    var countEl = document.querySelector(".pick-count");
    var baseCount = cards.length;

    var chips = [["All", null]];
    rules.forEach(function (r) {
      var n = allCards.filter(function (c) { return r[1].test(c.textContent); }).length;
      // Audience chips (Men/Women/Boys/Girls) are useful even with a single item.
      var min = /^(Men|Women|Boys|Girls)$/.test(r[0]) ? 1 : 2;
      if (n >= min) chips.push([r[0], r[1], n]);
    });
    if (chips.length < 2) return;

    function apply(re) {
      var shownAll = 0, shownGrid = 0;
      allCards.forEach(function (c) {
        var hit = !re || re.test(c.textContent);
        c.style.display = hit ? "" : "none";
        if (hit) { shownAll++; if (grid.contains(c)) shownGrid++; }
      });
      if (countEl) countEl.textContent = "Showing " + shownAll + " of " + allCards.length;
    }

    // "Hide filters" toggle sits above the chips, like the reference layout.
    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "filter-toggle";
    toggle.textContent = "Hide filters";
    toggle.setAttribute("aria-expanded", "true");
    toggle.addEventListener("click", function () {
      var collapsed = box.getAttribute("data-collapsed") === "true";
      box.setAttribute("data-collapsed", collapsed ? "false" : "true");
      toggle.textContent = collapsed ? "Hide filters" : "Show filters";
      toggle.setAttribute("aria-expanded", collapsed ? "true" : "false");
    });
    box.appendChild(toggle);

    chips.forEach(function (c, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      b.innerHTML = c[0] + (c[2] ? "<span>" + c[2] + "</span>" : "");
      b.addEventListener("click", function () {
        box.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        if (c[1]) apply(c[1]);
        else { allCards.forEach(function (x) { x.style.display = ""; }); if (countEl) countEl.textContent = "Showing " + allCards.length + " of " + allCards.length; }
      });
      box.appendChild(b);
    });

    // Initial state: everything shown, counter reads "Showing N of N".
    apply(null);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
