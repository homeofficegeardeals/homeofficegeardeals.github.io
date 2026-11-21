// Newsletter signup. Reads window.NEWSLETTER_CONFIG (newsletter-config.js) and wires every
// form marked data-newsletter. No dependencies, no page reload, no backend.
(function () {
  "use strict";

  var cfg = window.NEWSLETTER_CONFIG || {};
  var live = !!(cfg.endpoint && String(cfg.endpoint).trim());

  function setStatus(form, text, kind) {
    var status = form.parentNode.querySelector("[data-newsletter-status]");
    if (!status) return;
    status.textContent = text;
    status.className = "newsletter-status" + (kind ? " is-" + kind : "");
    status.hidden = false;
  }

  function submitToSubstack(form, email) {
    var base = String(cfg.endpoint).replace(/\/+$/, "");
    var url = base + "/subscribe?email=" + encodeURIComponent(email);
    window.open(url, "_blank", "noopener");
    setStatus(form, "Opening the subscribe page in a new tab. Finish there and you are on the list.",
      "ok");
  }

  function postJson(form, email) {
    var payload = new FormData();
    payload.append("email", email);
    if (cfg.provider === "formspree") payload.append("_subject", "Newsletter signup");

    var button = form.querySelector("button[type=submit]");
    if (button) { button.disabled = true; button.textContent = "Sending…"; }

    fetch(cfg.endpoint, {
      method: "POST",
      body: payload,
      headers: { Accept: "application/json" },
    })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        form.reset();
        setStatus(form, "You are on the list. One email a week, unsubscribe any time.", "ok");
      })
      .catch(function () {
        setStatus(form,
          "That did not go through. Try again, or email hello@homeofficegeardeals.com.", "error");
      })
      .finally(function () {
        if (button) { button.disabled = false; button.textContent = "Subscribe"; }
      });
  }

  document.querySelectorAll("form[data-newsletter]").forEach(function (form) {
    var status = form.parentNode.querySelector("[data-newsletter-status]");

    if (!live) {
      form.hidden = true;
      return;
    }

    form.hidden = false;
    if (status) status.hidden = true;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector("input[type=email]");
      var email = input ? input.value.trim() : "";
      if (!email) return;

      if (cfg.provider === "substack") submitToSubstack(form, email);
      else postJson(form, email);
    });
  });
})();
