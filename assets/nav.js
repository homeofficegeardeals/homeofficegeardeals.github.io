// Dropdown + burger behaviour for the grouped nav.
(function () {
  "use strict";
  var nav = document.querySelector(".main-nav");
  if (!nav) return;

  var burger = nav.querySelector(".nav-burger");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", open ? "false" : "true");
      burger.setAttribute("aria-expanded", String(!open));
    });
  }

  nav.querySelectorAll(".nav-group-toggle").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var group = btn.closest(".nav-group");
      var open = group.getAttribute("data-open") === "true";
      // close siblings
      nav.querySelectorAll(".nav-group").forEach(function (g) {
        g.setAttribute("data-open", "false");
        var b = g.querySelector(".nav-group-toggle");
        if (b) b.setAttribute("aria-expanded", "false");
      });
      if (!open) {
        group.setAttribute("data-open", "true");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  document.addEventListener("click", function () {
    nav.querySelectorAll(".nav-group").forEach(function (g) {
      g.setAttribute("data-open", "false");
      var b = g.querySelector(".nav-group-toggle");
      if (b) b.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    nav.querySelectorAll(".nav-group").forEach(function (g) {
      g.setAttribute("data-open", "false");
    });
    nav.setAttribute("data-open", "false");
  });
})();
