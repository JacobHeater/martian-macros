# UX-accessibility review, WS-03 close (2026-10-20)

Verdict: 1 blocking finding open (F1). No render, device or screen reader; contrast by arithmetic on token values.

- F1 blocking. The compact segment (Progress' 30d/90d) shows its choice by the selected fill and Ember text alone, no check;
  Ember on `--selected` in Light about 4.25:1. The checklist counts `aria-pressed`, a spoken cue only.
- F2 should-fix. The checklist claims more than the tests check: targets read only `ui.css` px minimum heights; gestures only
  find "More actions", never open it; folded sections are not name-checked; the chart check accepts any word and digit.
- F3 should-fix (hypothesis). Dashboard focus after a save in place clears its flag after one commit; with a slow store the
  replacing row mounts later, unfocused.
- F4 should-fix. A remembered fold beats an opening the app asks for (a recovery check-in newly due stays folded).
- F5 should-fix. Focus is lost after the waist save on Progress, and the outcome is not announced.
- F6 consider. A restored scroll can undo the reveal; the reveal is consumed even when the section is not drawn yet.
- F7 should-fix. A text action has no cue beyond weight; contrast passes.
- F8 should-fix. Text scaling and screen size claims are unverified: Android's system font scale reaches the web view as text
  zoom (fonts only); the stories scale the root; iOS unchecked; "360 dp" conflicts with rule 7.
- F9 consider. The floating action is first in reading order but drawn last; state the exception.
Research: Chromium android_webview `web-page-layout.md` (text zoom scales fonts only), accessed 2026-10-20.
