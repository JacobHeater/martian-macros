---
id: MM-720
status: in-progress
component: persistence
related: [MM-698, MM-715, MM-718, MM-719]
---

# Bug: the first send from an iPhone fails while it asks for the local network

## Context
The owner, 2026-11-01, from the phone, trying a copy to the other phone (MM-715 to MM-719) on one Wi-Fi: the
iPhone said the network connection was lost, though both phones were on the Wi-Fi. The app's own words for that
are "Could not reach the other phone. Both phones need the same Wi-Fi…", which the iPhone's plugin gives when
its connection does not go `ready`.

On iOS the first connection an app makes to an address on the local network is when the phone asks the person
"would like to find and connect to devices on your local network". While that question is on screen, and after
"Don't Allow", the `NWConnection` sits in `.waiting` (Apple's own test prints `waiting(... Network is down)`
after a refusal). The plugin treated `.waiting` as failure at once, and in any case gave up after five seconds,
so the first send from an iPhone failed under the question before the person could allow it, and a phone that
had refused was told to check its Wi-Fi.

## Decisions
From the owner (2026-11-01): it has to work end to end, both phones on one Wi-Fi.

Choices made without asking (say if any is wrong):
- **Waiting is not failure.** The iPhone's connect goes on through `.waiting` and fails only on `.failed`, or
  at a deadline of 30 seconds: long enough to read the question and allow it. A phone on the wrong Wi-Fi waits
  that long before "Could not reach the other phone"; the sheet shows the wait all along.
- **A refusal is told apart.** At the deadline, a connection whose path says `localNetworkDenied` fails with a
  new kind, `noLocalNetwork`, and the sheet says where to allow it: "This phone is not allowed to find devices
  on its Wi-Fi. In the phone’s Settings, under Privacy & Security, Local Network, allow Martian Macros, then try
  again." Android never gives this kind.
- **The sending sheet says to allow the question**, in the line it already shows while reaching the other
  phone: "If this phone asks to find devices on your network, allow it."
- **The screen stays on while the phone listens or holds a connection**, on both platforms (the idle timer on
  iOS, `FLAG_KEEP_SCREEN_ON` on Android), and locks as usual once neither. A receiving phone whose screen locked
  while the other was scanned was suspended with its listener, which the sheet's "Keep both phones open" could
  not prevent.

## Description
A send from an iPhone succeeds the first time, once the person allows the local network question, and says
where to allow it when they refused. Neither phone's screen locks during a move or a copy.

## Acceptance Criteria
```gherkin
Scenario: The question is answered in time
  Given an iPhone that has never been asked for the local network
  When "Copy to another phone" is chosen and the other phone's code scanned
  Then the phone asks to find devices on the local network while the sheet says it is reaching the other phone
  And once "Allow" is tapped the copy is sent

Scenario: The local network was refused
  Given an iPhone that refused the app the local network
  When the other phone's code is scanned
  Then the sheet says the phone is not allowed to find devices on its Wi-Fi, and where in Settings to allow it
  And offers Scan again

Scenario: The other phone is not there
  Given the other phone no longer shows its code
  When its code is scanned
  Then after the wait the sheet says the other phone could not be reached, as before

Scenario: The screen stays on
  Given a phone shows its code, or is sending
  When nothing is touched for longer than its auto-lock
  Then the screen stays on until the code is closed, the move ends, or the connection closes
```

## UI/UX
In apps/mobile/src/gallery/screens/MoveToAnotherPhone.stories.tsx: MoveSendNoLocalNetwork (small phone), the
refusal's words; MoveReachingOtherPhone, the wait with the line about the question.

## Notes
- iOS: `MmTransferPlugin.connect` (`.waiting` kept, `connectWithin` 30 s, `currentPath?.unsatisfiedReason ==
  .localNetworkDenied` → `noLocalNetwork`), `screenStaysOn()`. Android: `screenStaysOn()`. App:
  `MoveProblemKind`, `NativeLocalLink`, `moveProblemWords`, `SendMoveSheet`. Test: `test/settings/move.test.tsx`.
- CI builds no iOS; the Swift is compiled by the build onto the owner's iPhone.
- Owed on the owner's phones (one Wi-Fi, both directions): the question and the copy after Allow; the words after
  a refusal; a receiving phone left alone past its auto-lock.
