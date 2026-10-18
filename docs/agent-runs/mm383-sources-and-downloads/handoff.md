# Handoff: a third source and the reliability score (MM-383); packs downloading together behind an icon (MM-384)

- **What this run was.** By message, no questions, the owner asked for an additional food data source chosen with the panel,
  a reliability score of the author's own ordering search (the scan ranking the author's), concurrent pack downloads and an
  icon in place of the download button. Three read-only roles reviewed the drafted tickets (integrations, product,
  react-capacitor); the product designer and the UX guard reviewed the renders of the build.
- **Where the answers are.** The tickets MM-383 and MM-384 (every "say if any is wrong" choice), `docs/food-packs-data.md`
  (the owner's commands for the first build), `decision.md` (every finding's disposition), the bugs the roles found by
  inspection: MM-385 and MM-388 (fixed, failing-first tests), MM-386 and MM-387 (opened).
- **What changed from the draft.** The scan ranking moved to where it is decided, the build's conflict policy
  (`ReliabilityPolicy`, the default): USDA Branded over Open Food Facts; one name one food puts the grade's floor first; the
  fetch cache is keyed by address; the build fails when a configured source gives nothing; the FNDDS portion branch drops
  numeric codes; the −15 keys on the shared disagreement sentence for every source; the controller holds one cell per pack with
  a derived list and a starting guard; catalog re-opens are coalesced; the Cancel buttons are named per download.
- **The design pass.** The product designer (build with changes) and the UX guard (BLOCK on the strip announcing every
  percent, then a second pass on the fixed build) reviewed the renders; the icon moved to the card's title row as an Ember
  glyph, the cards are headed by the pack's name, the strip lines are 48 px with the inset once, the strip is spoken at
  ten-percent steps, focus moves to a neighbour when a control goes, the popover scrolls at large text.
- **Open for the owner.** The first pack build and publish; the fifty-package hand check (MM-51); MM-386 and MM-387; the
  items in `requirements/HANDOFF.md`.
- **Not verified.** On a phone (both packs together, the WebView's memory); the pack build.
