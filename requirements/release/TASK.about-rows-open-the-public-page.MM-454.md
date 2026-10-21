---
id: MM-454
status: in-progress
component: release
related: [MM-247, MM-95, MM-242]
---

# Task: Settings, About links to the public page of the terms and the policy

## Context
MM-247 asks for the public page's address in the app's About rows, beside "Terms of use" and "Privacy policy" (MM-95), opened in the
phone's browser since the app itself fetches nothing. The page and its workflow are built (MM-247); the address exists only once the
owner merges the workflow and turns Pages on. The app has no way yet to hand an address to the phone's browser: nothing in either shell
opens a link, and adding one is a new platform capability behind an interface (rule 2).

## Decisions
Made by the author without asking, easy to overrule:
- The address is `publicPageAddress` in `apps/mobile/src/terms/publicPageAddress.ts`,
  `https://jacobheater.github.io/martian-macros/`, the one MM-247 names. **Awaiting the owner's confirmation**; changing it
  is that one line (and the test that pins it).
- The port is `ExternalLinks` (`domain/integration/`), one method, `openInBrowser(address)`, which hands over only an
  absolute `https` address (`httpsAddress`) and rejects anything else. Fake: `InMemoryExternalLinks` (keeps the addresses;
  `noBrowser` refuses). Phone: `NativeExternalLinks` over one new method on the existing `MmBackup` plugin,
  `openInBrowser({ url })`: an `ACTION_VIEW` intent (category `BROWSABLE`) on Android, `UIApplication.open` on iOS. It sits
  on `MmBackup` because that is the plugin that already hands things to the phone's other apps (the share sheet, the file
  picker); the adapter depends only on `MmOpenInBrowserApi`. No new npm dependency (`@capacitor/browser` would be one, and
  opens an in-app tab, not the browser). Browser (the dev server): `WindowExternalLinks`, a new tab with `noopener`.
- The row is built like its sibling "Privacy policy" (an `MmListRow` in the About group), placed under it, with the
  `document` icon (no web icon exists; adding one is a design-system change this does not need). It draws no chevron,
  since it opens nothing in the app, and its subtitle says where it goes: "Opens jacobheater.github.io/martian-macros in
  your browser". If the phone has no browser, a snack says so and gives the address.
- The privacy policy names it (section 4): the browser fetches the page from GitHub Pages, not the app, and GitHub sees
  the IP address. `test/terms/privacyText.test.ts` names the host `jacobheater.github.io` as "GitHub Pages".

## Description
- A narrow `ExternalLinks` port (open an address in the phone's browser) with the Android and iOS implementations and a fake.
- One row under "Privacy policy" in Settings, About: "On the web", with the address as its subtitle, that opens the public page.
- The address is one constant, the same one entered in both store listings.

## Acceptance Criteria
```gherkin
Scenario: The same address as the stores
  Then the About row's address is the one both store listings carry

Scenario: Opened in the browser
  When the person presses the row
  Then the phone's browser opens the public page, and the app itself fetches nothing

Scenario: Substitutable
  Then the link port has a fake for tests and stories, and the row is in a gallery story
```

## UI/UX
- SettingsOpensThePublicPage — apps/mobile/src/gallery/screens/Settings.stories.tsx (Story: SettingsOpensThePublicPage).
  The row under "Privacy policy", pressed.
- SettingsPublicPageNoBrowser — apps/mobile/src/gallery/screens/Settings.stories.tsx (Story: SettingsPublicPageNoBrowser).
  A phone with no browser: the snack with the address.

## Notes
Waits on the owner: the merge of MM-247's workflow, Pages turned on, and the address confirmed. In progress until then.

Built (not run locally; CI validates): the port, its contract suite `test/contracts/externalLinksContract.ts` run against
the fake, the native adapter (bridge stood in for) and the browser one in `test/platform/externalLinks.test.ts`; the row in
`test/settings/publicPage.test.tsx`; the policy's paragraph in `test/terms/privacyText.test.ts`.

Owed on the owner's phones (a new native method, so on a release build too): on Android and on an iPhone, Settings, About,
"On the web" opens the page in the phone's own browser (not inside the app), and coming back finds the app as it was.
