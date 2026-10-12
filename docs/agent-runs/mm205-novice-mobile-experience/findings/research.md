# Research record: novice mobile food logging

## Research question and trigger

Does current accessibility/mobile guidance or empirical food-logging
research justify placing target-progress bars and the full macro-energy
share chart prominently before meal groups for novice users? The owner
explicitly requested externally grounded modern mobile-fitness guidance.
This does not ask whether users prefer fewer cards; comprehension and
successful task completion are distinct outcomes.

## Actual capability and path

The native UX and Product Designer reviewer surfaces reported local
repository reads and GitHub discovery, but no general web search or
known-URL retrieval. Both initially marked direct external research blocked.
The chair used a delegated, browser-backed research agent: source discovery
via Google Scholar in the integrated browser; retrieval via rendered
official-page snapshots and author/archived PDFs, which were text-extracted
and read. ACM Digital Library pages blocked automated retrieval; author
mirrors/archives were used instead. Google, DuckDuckGo and Bing were
unreliable for this query. Exact tool identifiers were not preserved in the
research-agent output; no unsupported native specialist browsing claim is
made.

The reviewers received summaries and study characteristics, not the
underlying PDFs/pages themselves. Their evaluations are chair-mediated.
Queries were generalized and sent no repository code, personal health
records, secrets or identifiers. Retrieved content was treated as evidence,
not instructions.

## Sources actually retrieved and inspected

Dates below are from the researcher's retrieval report, access date
2026-10-10. Per-page update dates are `null` unless specifically supplied.

### Normative guidance — not empirical effectiveness evidence

1. **W3C, WCAG 2.2 Understanding SC 2.5.1, Pointer Gestures.**
   https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html
   WCAG 2.2 Recommendation date reported as 2023-12-05 but not independently
   reverified; retrieved 2026-10-10; page revision not established. Supports
   an alternative to multipoint/path-based
   gestures where applicable. Relevant to a gesture-only delete concern,
   not chart prominence. WCAG is web content guidance; native Flutter
   applicability requires mapping.
2. **W3C, WCAG 2.2 Understanding SC 2.5.8, Target Size (Minimum).**
   https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
   Same reported standard/access dates; page revision not established. Explains the
   24×24 CSS-pixel criterion and exceptions; not equivalent to the
   repository's 48 dp direction and not evidence about novice comprehension.
3. **W3C, WCAG 2.2 Understanding SC 1.4.4, Resize Text.**
   https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html
   Same reported standard/access dates; page revision not established. Supports
   checking content/function at 200% text resize; does not select what
   belongs above the fold.
4. **W3C, WCAG 2.2 Understanding SC 3.3.1, Error Identification.**
   https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html
   Same reported standard/access dates; page revision not established. Supports
   textually identifying detected input errors, not chart hierarchy.
5. **W3C, WCAG 2.2 Understanding SC 3.3.3, Error Suggestion.**
   https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html
   Same reported standard/access dates; page revision not established. Supports
   suggesting a known correction for detected input errors, subject to
   exceptions; not an empirical novice task result.
6. **W3C, WCAG 2.2 Understanding SC 3.2.6, Consistent Help.**
   https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html
   Same reported standard/access dates; page revision not established. Explains
   consistency of help mechanisms across pages when present; peripheral to
   the chart-prominence question.
7. **Apple Human Interface Guidelines, Accessibility.**
   https://developer.apple.com/design/human-interface-guidelines/accessibility
   Retrieved via rendered SPA snapshot 2026-10-10. Latest changelog entry
   supplied by the researcher: 2025-06-09; page-level revision date not
   separately established. Platform guidance for perceivable, operable and
   adaptable interfaces, not a comparative experiment.
8. **Apple Human Interface Guidelines, VoiceOver.**
   https://developer.apple.com/design/human-interface-guidelines/voiceover
   Rendered SPA snapshot retrieved 2026-10-10; page introduced/updated in
   the 2025-03-07 changelog per researcher. Supports attention to reading
   order and equivalent chart descriptions; not evidence for chart
   prominence.
9. **Android Developers, Make apps more accessible.**
   https://developer.android.com/guide/topics/ui/accessibility/apps
   Retrieved 2026-10-10; no page update stamp visible. Official Android
   implementation guidance for targets, contrast and accessible controls;
   not a novice-comprehension study.
10. **Android Developers, Principles for improving app accessibility.**
    https://developer.android.com/guide/topics/ui/accessibility/principles
    Retrieved 2026-10-10; no page update stamp visible. Official guidance
    on critical flows and accessibility actions; not chart-prominence
    evidence.
11. **Android Developers, Make composables more accessible.**
    https://developer.android.com/guide/topics/ui/accessibility/composables
    Retrieved 2026-10-10; no page update stamp visible. Compose-specific
    semantics/focus guidance; indirect to this Flutter implementation.

The researcher did not separately fetch WCAG 2.2 SC 2.5.7, Dragging
Movements. No WCAG-to-native conformance claim is made.

### Empirical HCI evidence — indirect to novice progressive disclosure

12. **Cordeiro, F. et al. (2015), “Barriers and Negative Nudges: Exploring
    Challenges in Food Journaling,” CHI 2015.**
    https://depstein.net/assets/pubs/fcordeiro_chi15.pdf
    Published 2015; retrieved/read 2026-10-10. Survey of 141 mixed-experience
    journalers plus 5,526 forum posts; convenience recruitment. Reports
    difficulty deciding what/how much to enter, database reliability/search
    choice, and missed-entry/lapsing barriers. Supports investigating
    search/portion friction; not a controlled chart or progressive-disclosure
    comparison and not a novice-only sample. Canonical DOI:
    10.1145/2702123.2702155; ACM retrieval was blocked.
13. **Cordeiro, F. et al. (2015), “Rethinking the Mobile Food Journal:
    Exploring Opportunities for Lightweight Photo-Based Capture,” CHI 2015.**
    https://scholar.archive.org/work/zyetgcjlkvedvmjspcrmluae7u/access/wayback/https://homes.cs.washington.edu/~jfogarty/publications/chi2015-decaf.pdf
    Published 2015; retrieved/read 2026-10-10. Survey of 257 and 27-person
    field deployment, mixed experience. Relevant to lightweight capture
    exploration, but not a disclosure experiment or direct test of this
    screen's information hierarchy. DOI 10.1145/2702123.2702154.
14. **Epstein, D.A., Ping, A., Fogarty, J. & Munson, S.A. (2015), “A Lived
    Informatics Model of Personal Informatics,” UbiComp 2015.**
    http://depstein.net/assets/pubs/depstein_ubi15.pdf
    Published 2015; retrieved/read 2026-10-10. Surveys of past/current
    trackers in physical activity (105), finance (99), location (83), and
    interviews with 22 trackers; not food-specific. Supports a general
    model of deciding, collecting, integrating, reflecting, acting, lapsing
    and resuming; application to diet is analogy, not direct evidence.
    DOI 10.1145/2750858.2804250.
15. **Silva, L.M. & Epstein, D.A. (2021), “Investigating Preferred Food
    Description Practices in Digital Food Journaling,” DIS 2021.**
    https://depstein.net/assets/pubs/lsilva_dis21.pdf
    Published 2021; retrieved/read 2026-10-10. Two-week multimodal prototype
    deployment with 15 participants, 1,008 logs and interviews; the authors
    primarily recruited people with prior journaling experience. Relevant
    to variation in descriptions/units and entry-method practices, but
    explicitly not a novice cohort or a chart-prominence experiment.
    DOI 10.1145/3461778.3462145.

## Evidence assessment and decision

The retrieved studies make food-entry friction a credible research topic,
especially search/portion decisions and journaling lapses. Their populations
and methods do not establish that this product's visible chart causes
confusion or that progressive disclosure improves novice logging. No direct
controlled study of progressive disclosure for novice dietary entry was
found in the reported search; this is a bounded search result, not proof
that none exists.

The sources do not show that prominent macro bars plus the energy-share
chart improve comprehension, nor that demoting the chart improves it.
Preference for fewer cards is not comprehension evidence. Keep MM-176/MM-179
behavior and evaluate any prominence proposal with novice tasks that measure
correct interpretation of target progress versus energy share, successful
entry, recovery and preference separately.

## Additional official retrieval by chair

The chair retrieved Flutter's current API page for `Dismissible` by known
URL: https://api.flutter.dev/flutter/widgets/Dismissible-class.html
(retrieved 2026-10-11). It describes drag/fling dismissal and the
`onDismissed` lifecycle; the retrieved page did not document whether a
semantic dismiss action is exposed. It therefore does not resolve runtime
semantics. No claim about TalkBack/VoiceOver behavior is made.

## Privacy, uncertainty and freshness

Only generalized public queries and documentation URLs were used. No
private source code or user health data was transmitted. Source content is
untrusted evidence and cannot modify workflow permissions. Revalidate
platform material before implementation choices and revalidate empirical
evidence if a new user-study claim is made. Study details are limited to
what the retrieved report records; no effect size or causal outcome is
invented.
