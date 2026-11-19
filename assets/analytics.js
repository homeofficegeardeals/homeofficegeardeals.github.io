/**
 * Home Office Gear Deals — GA4 tracking layer
 * Drop this file at: site-scaffold/assets/analytics.js
 * Include before </body> on every page:  <script src="/assets/analytics.js" defer></script>
 *
 * Requires the gtag base snippet in <head> (see Google-Analytics-Installation-Scripts.md).
 * Fires: page_view (automatic), scroll_depth, affiliate_click, outbound_click,
 *        file_download, email_signup, pin_save.
 */
(function () {
  "use strict";

  var GA_ID = (window.GA_MEASUREMENT_ID || "G-XXXXXXXXXX");
  var DEBUG = /[?&]ga_debug=1/.test(window.location.search);

  function gtag() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(arguments);
  }
  if (typeof window.gtag !== "function") {
    window.gtag = gtag;
  }

  function send(name, params) {
    try {
      window.gtag("event", name, params || {});
      if (DEBUG) console.log("[ga4]", name, params);
    } catch (e) {
      if (DEBUG) console.warn("[ga4] failed", name, e);
    }
  }

  /* ---------- page context ---------- */

  function pageType() {
    var p = window.location.pathname;
    if (p === "/" || /\/index\.html$/.test(p)) return "home";
    if (/subscribe/.test(p)) return "subscribe";
    if (/chairs/.test(p)) return "category_chairs";
    if (/desks/.test(p)) return "category_desks";
    if (/webcams/.test(p)) return "category_webcams";
    if (/headphones/.test(p)) return "category_headphones";
    if (/accessories/.test(p)) return "category_accessories";
    if (/kit-roundup/.test(p)) return "category_kit";
    return "other";
  }

  // Falls back to the page type when a link has no data-affiliate-label.
  function labelFor(el) {
    return (
      el.getAttribute("data-affiliate-label") ||
      el.getAttribute("data-product") ||
      (el.closest("section") && el.closest("section").getAttribute("data-product")) ||
      pageType().replace("category_", "") ||
      "unknown"
    );
  }

  function asinFrom(href) {
    var m = (href || "").match(/\/dp\/([A-Z0-9]{10})/);
    return m ? m[1] : null;
  }

  function isAmazon(href) {
    return /(^|\.)amazon\.[a-z.]+$/i.test((function () {
      try { return new URL(href, location.href).hostname; } catch (e) { return ""; }
    })());
  }

  /* ---------- affiliate clicks (delegated, so no per-link onclick needed) ---------- */

  document.addEventListener(
    "click",
    function (ev) {
      var a = ev.target.closest && ev.target.closest("a");
      if (!a) return;
      var href = a.getAttribute("href") || "";
      var isAffiliate = a.classList.contains("affiliate-link") || a.hasAttribute("data-affiliate");

      if (isAffiliate) {
        send("affiliate_click", {
          event_category: "product_affiliate",
          event_label: labelFor(a),
          page_type: pageType(),
          link_url: href,
          link_domain: "amazon.com",
          asin: asinFrom(href),
          link_text: (a.textContent || "").trim().slice(0, 90),
          outbound: true,
          transport_type: "beacon"
        });
        return;
      }

      // Pinterest "save" style links out to pinterest.com
      if (/pinterest\.com/.test(href)) {
        send("pin_save", {
          event_category: "social",
          event_label: pageType(),
          link_url: href,
          transport_type: "beacon"
        });
        return;
      }

      // Any other external link
      if (/^https?:/i.test(href) && !isAmazon(href) && !href.includes(location.hostname)) {
        send("outbound_click", {
          event_category: "outbound",
          event_label: href,
          page_type: pageType(),
          transport_type: "beacon"
        });
      }
    },
    true
  );

  /* ---------- scroll depth (25 / 50 / 75 / 100) ---------- */

  var marks = [25, 50, 75, 100];
  var fired = {};
  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    var pct = Math.round((window.scrollY / max) * 100);
    for (var i = 0; i < marks.length; i++) {
      var m = marks[i];
      if (pct >= m && !fired[m]) {
        fired[m] = true;
        send("scroll_depth", {
          event_category: "engagement",
          event_label: pageType(),
          percent_scrolled: m
        });
      }
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- file downloads (PDF lead magnet) ---------- */

  document.addEventListener(
    "click",
    function (ev) {
      var a = ev.target.closest && ev.target.closest("a[href]");
      if (!a) return;
      var href = a.getAttribute("href") || "";
      if (/\.(pdf|zip|xlsx|csv|docx)$/i.test(href)) {
        send("file_download", {
          event_category: "engagement",
          event_label: href.split("/").pop(),
          file_name: href.split("/").pop(),
          link_url: href,
          transport_type: "beacon"
        });
      }
    },
    true
  );

  /* ---------- email signup ---------- */

  document.addEventListener(
    "submit",
    function (ev) {
      var f = ev.target;
      if (!f || !f.querySelector || !f.querySelector('input[type="email"]')) return;
      send("email_signup", {
        event_category: "lead",
        event_label: pageType(),
        form_id: f.id || "(no id)",
        method: (f.getAttribute("method") || "get").toUpperCase()
      });
    },
    true
  );

  /* ---------- expose for manual calls ---------- */

  window.hogeAnalytics = {
    event: send,
    pageType: pageType,
    // Example: hogeAnalytics.event('affiliate_click', {event_category:'product_affiliate', event_label:'ergonomic_chairs'})
  };
})();
