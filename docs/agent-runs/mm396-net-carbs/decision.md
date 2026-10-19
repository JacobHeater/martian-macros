# Panel decision: net carbs (MM-396), sugar alcohols (MM-397), Settings as an accordion (MM-398), and what the owner raised during the run (MM-399 to MM-402)

- **Facts versus proposals and traceability.** Four read-only reviews of the drafted tickets (nutrition, integrations, product designer, UX), then a product-designer audit of spacing after the owner's screenshots. The chair built, measured renders in a static Storybook through Chrome's DevTools protocol at 412 × 915, ran the tests and wrote this record.
- **Owner decisions** (question tool, 2026-10-18): net carbs everywhere carbs show; all sugar alcohols subtracted, as labels do. By message: Settings an accordion, sections closed by default; padding around folding areas fixed; the scrolling frame fixed; filler never again; all of it on this branch.
- **Findings and disposition.**
  - *An EU label's carbohydrate already leaves fiber out; subtracting it again double-counts* (NU-1): **accepted, differently**: rather than a per-food basis column, the build makes such a figure a US total when the stated calories agree better (`usLabelCarbs`), so the app needs no basis.
  - *Clamp each food at zero before the day sums; the day keeps total and net apart; "Net carbs" printed twice* (NU-2, PD-1): **accepted**.
  - *The target "is what digestible carbohydrate supplies" overstates; calories govern* (NU-3): **accepted**, wording changed.
  - *Split caption; a test that the switch changes nothing the engine reads; "as stated"* (NU-4, NU-5, NU-6): **accepted**.
  - *Branded's nutrient 1086 only; `polyols_100g`; format 3 reader and writer; tests; report coverage; never offer a newer format; label wording* (IN-1 to IN-7): **accepted**; IN-5 kept out of the report; IN-8 (energy factor for polyols) **opened** as a question in MM-397.
  - *The switch's place, icon, words; which words follow it; no summaries on closed headers; Erase closed; spacing; "You"* (PD-2 to PD-9): **accepted**; the icon is `food`, the set having no grain.
  - *A folding heading inside its button* (UX-1): **accepted** as a bug, MM-399.
  - *The adults-only screen's way into Settings; search's "in Settings"* (UX-2, UX-3): **accepted**: the section opens; search names "under Data" (a button pushing a screen from inside the add-food sheet has no sibling).
  - *An explain button beside "Net carbs"; summaries on closed headers* (UX-4, UX-6): **declined for now**: the switch's subtitle and the total on the amount step and extras line say it; the designer's reasoning on summaries stands.
  - *Spacing: disclosures without a rule, cards on headers, closed headers spaced as groups* (the spacing audit's PD-1 to PD-3): **accepted**, MM-402; PD-4 not reproduced.
- **Found by measurement:** the page 2,500 px tall on a 915 px screen in the Dashboard's history story, visually hidden words escaping the scroll (MM-400); 915 px after the fix.
- **Owner decisions taken by the chair ("say if any is wrong"):** the target's grams read as net; the build-time EU correction; the switch's icon; no explain button; no summaries; search's words instead of a button.
- **Edit owner:** the parent session (chair).
- **Verification:** the tests named in each ticket; the stories; measurements in the static Storybook; `mm check`. Not verified on a phone: on the checklist.
