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
    var chosen = [items[0], items[1] || items[0]];
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
        '<input class="cmp-input" type="text" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="false" aria-autocomplete="list">' +
        '<span class="cmp-caret" aria-hidden="true">▾</span>' +
        '<ul class="cmp-list" role="listbox" hidden></ul>';
      var input = host.querySelector(".cmp-input");
      var list = host.querySelector(".cmp-list");
      var query = "";
      var cursor = -1;

      function options() {
        var pool = listFor(index);
        var q = query.trim().toLowerCase();
        if (q) pool = pool.filter(function (it) { return it.name.toLowerCase().indexOf(q) > -1; });
        return pool;
      }

      function paint() {
        var opts = options();
        list.innerHTML = opts.length
          ? opts.map(function (it, n) {
              var active = it === chosen[index] ? " is-selected" : "";
              var cur = n === cursor ? " is-cursor" : "";
              return '<li role="option" class="cmp-option' + active + cur + '" data-n="' + n + '">' + esc(it.name) +
                '<em>' + esc(it.type || "") + "</em></li>";
            }).join("")
          : '<li class="cmp-empty">No match</li>';
      }

      function open() {
        query = "";
        cursor = options().indexOf(chosen[index]);
        paint();
        list.hidden = false;
        input.setAttribute("aria-expanded", "true");
      }

      function close() {
        list.hidden = true;
        input.setAttribute("aria-expanded", "false");
        input.value = chosen[index] ? chosen[index].name : "";
        query = "";
      }

      function pick(it) {
        if (!it) return;
        chosen[index] = it;
        syncOther(index);
        close();
        draw();
      }

      input.addEventListener("focus", open);
      input.addEventListener("click", function () { if (list.hidden) open(); });
      input.addEventListener("input", function () {
        query = input.value;
        cursor = -1;
        if (list.hidden) { list.hidden = false; input.setAttribute("aria-expanded", "true"); }
        paint();
      });
      input.addEventListener("keydown", function (e) {
        var opts = options();
        if (e.key === "ArrowDown") { e.preventDefault(); cursor = Math.min(cursor + 1, opts.length - 1); paint(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); cursor = Math.max(cursor - 1, 0); paint(); }
        else if (e.key === "Enter") { e.preventDefault(); pick(opts[cursor > -1 ? cursor : 0]); }
        else if (e.key === "Escape") { close(); input.blur(); }
      });
      list.addEventListener("mousedown", function (e) {
        var li = e.target.closest(".cmp-option");
        if (!li) return;
        e.preventDefault();
        pick(options()[parseInt(li.getAttribute("data-n"), 10)]);
      });
      input.addEventListener("blur", function () { setTimeout(close, 120); });

      input.value = chosen[index] ? chosen[index].name : "";
      return { refresh: function () {
        if (!list.hidden) paint();
        if (chosen[index] && input.value !== chosen[index].name && document.activeElement !== input) {
          input.value = chosen[index].name;
        }
      } };
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
