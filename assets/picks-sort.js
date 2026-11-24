// Client-side ordering for the product grids on the category pages.
// Cards are plain <section class="top-pick"> blocks, so the data is read from the markup.
(function () {
  function ratingOf(card) {
    var el = card.querySelector(".rating");
    if (!el) return 0;
    var m = (el.textContent || "").match(/(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : 0;
  }
  function reviewsOf(card) {
    var el = card.querySelector(".rating");
    if (!el) return 0;
    var m = (el.textContent || "").replace(/,/g, "").match(/(\d+)\s*reviews?/i);
    return m ? parseInt(m[1], 10) : 0;
  }
  function nameOf(card) {
    var h = card.querySelector("h2");
    return h ? (h.textContent || "").trim() : "";
  }

  var grids = document.querySelectorAll("[data-pick-grid]");
  Array.prototype.forEach.call(grids, function (grid) {
    var wrap = grid.closest(".pick-grid-wrap") || grid.parentElement;
    var sel = wrap ? wrap.querySelector(".pick-sort") : null;
    if (!sel) return;
    var original = Array.prototype.slice.call(grid.children);

    sel.addEventListener("change", function () {
      var mode = sel.value;
      var list = original.slice();
      if (mode === "rating") {
        list.sort(function (a, b) { return ratingOf(b) - ratingOf(a); });
      } else if (mode === "reviews") {
        list.sort(function (a, b) { return reviewsOf(b) - reviewsOf(a); });
      } else if (mode === "name") {
        list.sort(function (a, b) { return nameOf(a).localeCompare(nameOf(b)); });
      }
      list.forEach(function (el) { grid.appendChild(el); });
    });
    sel.value = "featured";
  });
})();
