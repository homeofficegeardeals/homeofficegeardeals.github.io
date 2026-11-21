/*
  Newsletter wiring.
  Set `endpoint` and the signup form goes live everywhere it appears. Leave it empty and the form
  stays hidden, with the "not live yet" note and the free checklist link showing instead.

  provider options:
    "substack"   endpoint = https://<publication>.substack.com      (free, unlimited subscribers)
    "buttondown" endpoint = https://buttondown.email/api/emails/embed-subscribe/<username>
    "formspree"  endpoint = https://formspree.io/f/<form-id>
*/
window.NEWSLETTER_CONFIG = {
  provider: "substack",
  endpoint: "",
  checklist: "assets/welcome-offer-home-office-hacks.pdf",
};
