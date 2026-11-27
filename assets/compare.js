// Two searchable product dropdowns + side-by-side comparison.
// - only products of the same type can be compared
// - picking on either side re-scopes the other side
// - the sidebar filter chips also narrow the dropdown lists
(function () {
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function cardVisible(id) {
    var el = id && document.getElementById(id);
    if (!el) return true;
    return el.style.display !== "none" && el.offsetParent !== null;
  }

  function init(root) {
    var holder = document.getElementById(root.getAttribute("data-compare"));
    if (!holder) return;
    var items;
    try { items = JSON.parse(holder.textContent); } catch (e) { return; }
    if (!items || items.length < 2) return;

    var out = root.querySelector(".cmp-out");
    var first = items[0];
    var partner =
      items.filter(function (it) { return it !== first && it.type === first.type && it.tier === "Best Value"; })[0] ||
      items.filter(function (it) { return it !== first && it.type === first.type; })[0] ||
      items[1] ||
      first;
    var chosen = [first, partner];
    var slots = [];

    function listFor(i) {
      var other = chosen[1 - i];
      var pool = items.filter(function (it) { return cardVisible(it.id); });
      if (other && other.type) {
        var same = pool.filter(function (it) { return it.type === other.type; });
        if (same.length > 1) pool = same;
      }
      return pool;
    }

    function draw() {
      out.innerHTML = chosen.map(function (p) {
        return (
          '<div class="cmp-col">' +
            '<span class="cmp-pill' + (p.tier ? "" : " cmp-pill-empty") + '">' + esc(p.tier || p.type || "In the guide") + "</span>" +
            "<b>" + esc(p.name) + "</b>" +
            "<dl>" +
              "<dt>Best for</dt><dd>" + esc(p.bestFor || "—") + "</dd>" +
              "<dt>Type</dt><dd>" + esc(p.type || "—") + "</dd>" +
              "<dt>Warranty</dt><dd>" + esc(p.warranty || "Not stated") + "</dd>" +
              "<dt>Standout</dt><dd>" + esc(p.standout || "—") + "</dd>" +
            "</dl>" +
            (p.href ? '<a class="affiliate-link cmp-cta" href="' + esc(p.href) + '" target="_blank" rel="nofollow sponsored">Check Today&#8217;s Price on Amazon</a>' : "") +
          "</div>"
        );
      }).join("");
    }

    function syncOther(i) {
      var pool = listFor(i);
      if (pool.indexOf(chosen[1 - i]) === -1) {
        var alt = pool.filter(function (it) { return it !== chosen[i]; })[0] || pool[0];
        if (alt) chosen[1 - i] = alt;
      }
      slots[1 - i].refresh();
    }

    function makeSlot(host, index) {
      host.innerHTML =
        '<button class="cmp-trigger" type="button" aria-expanded="false" aria-haspopup="listbox">' +
          '<span class="cmp-trigger-label"></span><span class="cmp-caret" aria-hidden="true">▾</span>' +
        "</button>" +
        '<div class="cmp-popover" hidden>' +
          '<input class="cmp-input" type="text" placeholder="Type to search…" autocomplete="off" spellcheck="false" aria-label="Search products">' +
          '<ul class="cmp-list" role="listbox"></ul>' +
        "</div>";
      var trigger = host.querySelector(".cmp-trigger");
      var label = host.querySelector(".cmp-trigger-label");
      var pop = host.querySelector(".cmp-popover");
      var input = host.querySelector(".cmp-input");
      var list = host.querySelector(".cmp-list");
      var cursor = -1;

      function options() {
        var pool = listFor(index);
        var q = input.value.trim().toLowerCase();
        if (q) pool = pool.filter(function (it) { return it.name.toLowerCase().indexOf(q) > -1; });
        return pool;
      }

      function paint() {
        var opts = options();
        list.innerHTML = opts.length
          ? opts.map(function (it, n) {
              var active = it === chosen[index] ? " is-selected" : "";
              var cur = n === cursor ? " is-cursor" : "";
              return '<li role="option" class="cmp-option' + active + cur + '" data-n="' + n + '">' +
                "<span>" + esc(it.name) + "</span><em>" + esc(it.type || "") + "</em></li>";
            }).join("")
          : '<li class="cmp-empty">No match</li>';
      }

      function setLabel() {
        label.textContent = chosen[index] ? chosen[index].name : "Choose a product";
        trigger.setAttribute("title", label.textContent);
      }

      function open() {
        input.value = "";
        cursor = options().indexOf(chosen[index]);
        paint();
        pop.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
        input.focus();
      }

      function close() {
        pop.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
        setLabel();
      }

      function pick(it) {
        if (!it) return;
        chosen[index] = it;
        syncOther(index);
        close();
        draw();
      }

      trigger.addEventListener("click", function () {
        if (pop.hidden) open(); else close();
      });
      input.addEventListener("input", function () { cursor = -1; paint(); });
      input.addEventListener("keydown", function (e) {
        var opts = options();
        if (e.key === "ArrowDown") { e.preventDefault(); cursor = Math.min(cursor + 1, opts.length - 1); paint(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); cursor = Math.max(cursor - 1, 0); paint(); }
        else if (e.key === "Enter") { e.preventDefault(); pick(opts[cursor > -1 ? cursor : 0]); }
        else if (e.key === "Escape") { e.preventDefault(); close(); trigger.focus(); }
      });
      list.addEventListener("mousedown", function (e) {
        var li = e.target.closest(".cmp-option");
        if (!li) return;
        e.preventDefault();
        pick(options()[parseInt(li.getAttribute("data-n"), 10)]);
      });
      document.addEventListener("click", function (e) {
        if (!host.contains(e.target) && !pop.hidden) close();
      });

      setLabel();
      return { refresh: function () { if (!pop.hidden) paint(); setLabel(); } };
    }

    slots.push(makeSlot(root.querySelector('[data-slot="0"]'), 0));
    slots.push(makeSlot(root.querySelector('[data-slot="1"]'), 1));
    draw();

    // Sidebar filter chips narrow the dropdown pools too.
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".picks-filters button")) return;
      setTimeout(function () {
        slots.forEach(function (s) { s.refresh(); });
        var pool = listFor(0);
        if (pool.indexOf(chosen[0]) === -1 && pool[0]) chosen[0] = pool[0];
        pool = listFor(1);
        if (pool.indexOf(chosen[1]) === -1) {
          var alt = pool.filter(function (it) { return it !== chosen[0]; })[0] || pool[0];
          if (alt) chosen[1] = alt;
        }
        slots.forEach(function (s) { s.refresh(); });
        draw();
      }, 30);
    });
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-compare]"), init);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
