---
id: MM-716
status: in-progress
component: app-shell
related: [MM-63, MM-698, MM-704, MM-715]
---

# Story: "My QR Code" in the drawer shows this phone's code straight away

## Context
The owner, 2026-10-30: "I want a dedicated menu item called My QR Code". With foods copied to the other phone by
the move's flow (MM-715), the receiving phone's code is wanted often, and reaching it took Settings, Backup, Move
to another phone, Receive on this phone. The drawer (MM-704) is the one navigation, so the code is a row of it.

## Decisions
From the owner, in one interactive round (2026-10-30):
- **A row in the side drawer**, with Profile and Library, with the QR icon, named "My QR Code". It opens this
  phone's code straight away: the same code the Receive screen shows, for a whole move or a copy of foods.
- **The code first, the backup offer only if a whole move arrives.** Most scans will be copies of foods. When
  what arrives is a whole move and this phone holds records no backup has, the offer to back up comes then,
  before anything is replaced. The Settings path keeps its nudge before the code.

Choices made without asking (say if any is wrong):
- **The row sits in the "You" group after Library**: it is this phone's own code, not a setting.
- **The offer on arrival** is a dialog, "Back up this phone first?", with the Receive screen's words, Back up
  first the action and Skip the backup the other; skipped or dismissed, the move's own confirmation still asks
  before anything is replaced. Backed up, the move goes on to that confirmation.
- **The backup is the Backup section's own**, moved into `useBackUp` so the drawer can run it; the section's
  rows and words are unchanged.
- **The drawer's test and stories name the row**; nothing else about the drawer changes.

## Description
The drawer holds "My QR Code", which shows this phone's move code at once, for the other phone to scan, whether
it is sending everything or a copy of foods.

## Acceptance Criteria
```gherkin
Scenario: The row
  When the drawer is opened
  Then its rows are Dashboard, Food, Train, Coach, Profile, Library, My QR Code and Settings

Scenario: The code at once
  Given this phone was never backed up and holds records
  When My QR Code is chosen
  Then the code is shown without any offer to back up first

Scenario: A whole move arrives
  Given the code was shown from My QR Code and this phone was never backed up
  When the other phone sends everything
  Then "Back up this phone first?" is asked; Skip the backup goes on to the move's confirmation, Back up first runs the backup and then goes on to it

Scenario: A copy of foods arrives
  When the other phone sends foods
  Then no backup is offered; the foods' confirmation comes as MM-715 says
```

## UI/UX
- The row — apps/mobile/src/gallery/screens/Drawer.stories.tsx (Story: DrawerOpen, DrawerOpenSmallPhone). Eight rows.
- The code from the drawer — apps/mobile/src/gallery/screens/Drawer.stories.tsx (Story: DrawerMyQrCode).
- The offer on arrival — apps/mobile/src/gallery/screens/MoveToAnotherPhone.stories.tsx (Story: MyQrCodeBackUpOnMove, small phone).

## Notes
- Built in `DrawerMenu`, `DrawerChoice`, `HomeShell` (the row and what it opens), `useMoveToAnotherPhone`
  (`receive({ nudge: 'onMove' })`), `useBackUp` (out of `BackupSection`).
- Tests: `test/app/drawer.test.tsx` (the row, the code at once, the offer on a whole move, none on foods).
