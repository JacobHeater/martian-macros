---
id: MM-670
status: done
component: coach-insights
related: [MM-667, MM-665, MM-286, MM-582]
---

# Story: pull the Coach tab down to refresh

## Context
The owner (2026-10-28), with a Gemini key saved and the Executive summary still in the built-in coach's words: "I
want you to implement a pull down to refresh feature on the coach tab." The coach's words from the person's own
model are cached by the brief's hash (MM-665), and the health platform is read when the app opens or comes to the
front; between those there was no way to ask again.

## Decisions
- The gesture is `usePullToRefresh` in `src/ui/`, on the shell's scrolling body, with `MmPullToRefresh` as what it
  shows: a strip at the top of the body, as tall as the pull, with the sync mark and a word (Pull to refresh, Let go
  to refresh, Refreshing…). Built like the edge swipe (MM-582): pointer events on the body, a slop of 10 px, a
  pull that turns sideways or up is a scroll. The finger moves twice as far as the body; ready at 72 px; the body
  rests 56 px down while the refresh runs, at least half a second. A downward touch at the top is refused to the
  browser, so the body neither scrolls nor bounces under the pull and the pointer events are not cancelled.
- Only Coach pulls (the owner's ask); the other destinations get no handler, so nothing starts there.
- What a refresh does, `AppState.refreshCoach`: the day from the clock again, the health platform read as Settings'
  "Read now" reads it (`syncHealth('asked')`), and the coach's words asked of the person's own model afresh:
  `coachRefreshes` counts the pulls, and the Executive summary narrates with `fresh` whenever it changes, which
  skips the narrator's cache (`CoachNarrator.narrate(request, { fresh })`).

## Description
On the Coach tab, a pull down from the top of the screen draws the body down under the finger with a strip that
says where the pull is; let go past the threshold, the strip says Refreshing… while the day, the health platform
and the coach's words are read again, then the body settles.

## Acceptance Criteria
```gherkin
Scenario: A pull that goes through
  Given the Coach tab scrolled to its top
  When the body is drawn down past 72 px and let go
  Then the strip says "Refreshing…" with the body drawn down
  And the Executive summary's words are asked of the person's model again, not from the cache
  And the strip settles once the refresh is done

Scenario: A pull let go short
  When the body is drawn down 50 px and let go
  Then nothing is refreshed and the body springs back

Scenario: Elsewhere
  Given the Dashboard
  When the body is drawn down and let go
  Then nothing happens
```

## UI/UX
- Coach — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: Coach). The strip takes no room until a pull;
  the words are the caption type in the secondary text colour, the mark the sync icon, turned over when ready and
  turning while refreshing (`--motion-turn`, still under reduced motion).

## Notes
- Tests: `test/ui/pullToRefresh.test.tsx` (the gesture and the strip), `test/app/coachPullToRefresh.test.tsx` (Coach
  refreshes, the Dashboard does not), `test/format/httpCoachNarrator.test.ts` (a fresh narrate asks again).
- An owner's ask: no panel. Not run locally; CI validates. Not yet seen on a phone.
