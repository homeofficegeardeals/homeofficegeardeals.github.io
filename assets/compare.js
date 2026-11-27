// Two-dropdown product comparison (Apple-style). Reads the JSON block that
// enhance-cards.mjs writes above each product grid.
(function () {
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render(root, items, a, b) {
    var out = root.querySelector(".cmp-out");
    if (!out) return;
    var pa = items[a];
    var pb = items[b];
    function col(p) {
      if (!p) return "";
      return (
        '<div class="cmp-col">' +
          (p.tier ? '<span class="cmp-pill">' + esc(p.tier) + "</span>" : '<span class="cmp-pill cmp-pill-empty">In the guide</span>') +
          "<b>" + esc(p.name) + "</b>" +
          "<dl>" +
            "<dt>Best for</dt><dd>" + (p.bestFor ? esc(p.bestFor) : "&mdash;") + "</dd>" +
            "<dt>Warranty</dt><dd>" + esc(p.warranty || "Not stated") + "</dd>" +
            "<dt>Standout</dt><dd>" + esc(p.standout || "&mdash;") + "</dd>" +
          "</dl>" +
          (p.href
            ? '<a class="affiliate-link cmp-cta" href="' + esc(p.href) + '" target="_blank" rel="nofollow sponsored">Check Today&#8217;s Price on Amazon</a>'
            : "") +
        "</div>"
      );
    }
    out.innerHTML = col(pa) + col(pb);
  }

  var widgets = document.querySelectorAll("[data-compare]");
  Array.prototype.forEach.call(widgets, function (root) {
    var holder = document.getElementById(root.getAttribute("data-compare"));
    if (!holder) return;
    var items;
    try { items = JSON.parse(holder.textContent); } catch (e) { return; }
    if (!items || items.length < 2) return;

    var selects = root.querySelectorAll(".cmp-select");
    var a = root.querySelector('[data-slot="0"]');
    var b = root.querySelector('[data-slot="1"]');

    function sync() {
      var ia = parseInt(a.value, 10) || 0;
      var ib = parseInt(b.value, 10) || 0;
      if (ia === ib) {
        // Keep the two panes different: bump the second selector.
        ib = ia === items.length - 1 ? ia - 1 : ia + 1;
        b.value = String(ib);
      }
      render(root, items, ia, ib);
    }

    Array.prototype.forEach.call(selects, function (s) {
      s.addEventListener("change", sync);
    });
    sync();
  });
})();
