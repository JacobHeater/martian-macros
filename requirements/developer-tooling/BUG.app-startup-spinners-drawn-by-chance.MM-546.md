---
id: MM-546
status: done
component: developer-tooling
related: [MM-321, MM-242, MM-237]
---

# Bug: The app's startup spinners were drawn by a story only by chance

## Context
`npm run unseen` (MM-321) failed twice on 2026-10-21, on PRs that never touched the app, with
`Drawn by no story (add one, MM-321): src/app/AppRoot.tsx: <div className="app-centered app-centered-page app-centered-middle">`.

`AppRoot` waits on three startup reads in turn, each with its own spinner: the person's setup (`watchSetup`), then the
theme preference (`watchThemePreference`), then the agreement to the terms (`watchTermsAcceptance`, MM-242). The three
spinners were the same markup. No story held the setup read out, so its spinner was drawn only while the setup happened
to be still loading at a story's first render. `ThemeLoading` and `TermsLoading` held their own read out, but their
walks waited for any spinner, and the setup spinner shows first while every read is out: a walk could end before the
spinner it is about was ever drawn. Whether each branch was reached depended on timing.

## Decisions
- Choices made without asking: each spinner's wrapper carries a `data-testid` naming the read it waits on
  (`waiting-setup`, `waiting-theme`, `waiting-terms`), the existing pattern for a test to tell alike markup apart
  (`FoodAmountStep`, `AddFoodSheet`, `EstimateMealStep`). What a person sees and hears is unchanged. The three
  branches stay separate; `check-unseen.mjs` and its register are untouched.

## Description
Each of the app's three startup spinners is drawn by a story that holds that read out and waits for that spinner, so
`npm run unseen` reaches all three on every run.

## Acceptance Criteria
```gherkin
Scenario: The setup still being read
  Given a story whose setup read never comes back
  When the story is drawn
  Then the app shows the setup's spinner, "Loading"

Scenario: The theme preference still being read
  Given a story whose setup is read and whose theme preference read never comes back
  When the story is drawn
  Then the app shows the theme preference's spinner, "Loading", not only the setup's

Scenario: The agreement to the terms still being read
  Given a story whose setup and theme preference are read and whose terms read never comes back
  When the story is drawn
  Then the app shows the terms' spinner, "Loading", not only an earlier one
```

## Notes
- Fixed in `apps/mobile/src/app/AppRoot.tsx` (the wrappers' test ids) and
  `apps/mobile/src/gallery/screens/FirstRun.stories.tsx`: the new story `SetupLoading`
  (`waitingRead('setup', 'watchSetup')`), and `ThemeLoading` and `TermsLoading`, whose walks now wait, through
  `waitsOn`, for their own spinner holding the progressbar "Loading". These three stories, run by
  `test/gallery/stories.test.tsx` under `npm run unseen`, are the regression guard.
- Not run locally; CI validates.
