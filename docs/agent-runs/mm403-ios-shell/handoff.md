# Handoff: mm403-ios-shell

- **State.** Reviews complete, findings disposed in `decision.md`, edits applied and tested by the chair. Nothing in flight.
- **Exact next step.** None for this run. The owner looks at `AppleHealthNoneAsked`, `AppleHealthNothingFound`, `AppleHealthAsking` and `TermsNotNowOnIos` in `mm storybook` in the three palettes, which nobody in this run could do (no browser automation on the Mac in this session).
- **Outstanding owner decisions.** (1) Whether the nothing-found row should carry a control that opens the app's own page in Settings (`UIApplication.openSettingsURLString`) instead of naming the route in words (the guard's F1 alternative). (2) Whether Android's declined terms page should also say "the app will ask again when you open it", so the siblings' sentence differs only in the platform's clause (F2).
- **On the owner's phone, once signed** (`docs/ios-signing.md`): the route Settings, Health, Data Access & Devices, with the iOS version noted (F1, PD-2); VoiceOver through asking for Weight and through "Not now" (F6).
- **Stale or unfinished reviews.** None. The reviews inspected the tree at the hashes in `state.json`; the chair's edits after them are the dispositions in `decision.md`, re-tested, not re-reviewed.
- **Limitations.** Both reviews and the chair's walk were source inspection of the stories; no render in any palette, no device, no assistive technology.
