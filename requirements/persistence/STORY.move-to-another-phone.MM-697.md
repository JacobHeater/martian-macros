---
id: MM-697
status: in-progress
component: persistence
related: [MM-59, MM-63, MM-64, MM-65, MM-157, MM-95, MM-244, MM-453]
---

# Story: Move to another phone over the same Wi-Fi

## Context
The owner carries an Android phone and an iPhone and switches between them. Today moving the data means a backup (MM-63): make a file,
type a passphrase, send it through the share sheet, find it with the document picker on the other phone, type the passphrase again. The
platforms' own nearby sharing (AirDrop, Quick Share, Wi-Fi Direct) does not work reliably between an iPhone and an Android phone, so the
app runs the link itself.

The backup's sealed snapshot (the database and the progress photos, MM-157) and the restore that replaces what is on a phone already
exist. This story sends that snapshot straight from one phone to the other on the local network, sealed with a one-time key that the
receiving phone shows in a QR code, and applies it through the same restore.

## Decisions (made with the product owner, 2026-10-29)
- **A hand-off that replaces, not a merge.** The receiving phone becomes an exact copy of the sending one, as a restore does. Switching
  back means sending the other way. Using two phones at once is still not supported (MM-63).
- **A nudge to back up first.** If the receiving phone holds anything logged since its last backup, or has never been backed up, it says
  so before it shows the code and offers "Back up first", which runs the existing backup flow and comes back. It can be passed by. A fresh
  phone, or one with nothing new since its last backup, is not warned.
- **The same Wi-Fi only.** No Bluetooth, no hotspot, nothing over the internet.
- **The receiving phone shows a QR code and the sending phone scans it** with the app's own scanner. The code carries the Martian Macros
  logo in its centre.
- **Data and progress photos only**, what a backup holds. Downloaded food packs stay where they are. *Amended by the owner, 2026-10-29:*
  the settings kept in the database (theme, units, reminders) travel too, as a restore carries them: the receiving phone becomes an
  exact copy, and the confirmation says "your profile and your settings" are replaced.
- **Two ways in:** a "Move to another phone" row in Settings > Backup, on both phones, and "I have Martian Macros on another phone" at
  the first-run welcome, so a new phone is not set up only to be overwritten. This settles MM-63's open question about restoring at the
  welcome step.
- **Both phones must run the same app version.** If they differ, neither proceeds, and each says which phone to update.
- **The receiving phone confirms before it replaces anything**, with the restore confirmation (MM-63): what this phone loses, then what
  arrived, Cancel the stronger choice. Showing the code means "ready to receive", not "replace with whatever comes".
- **Named "Move to another phone".** Free, as backup is (MM-85).

Choices I made without asking (say if any is wrong):
- **The code holds the receiving phone's local address, a port and a fresh 32-byte key.** The snapshot is sealed with that key using
  libsodium (already bundled for MM-63), so no passphrase is typed. The key lives only in memory, on the screen, for one transfer.
- **The receiving phone listens only while its code is on screen**, and accepts one transfer. A connection refused for the wrong key
  does not end the listening: the code stays valid until a transfer completes, the screen is left, or five minutes pass. A new code
  means a new key.
- **The app versions are checked before any data is sent**, in a short opening exchange sealed with the same key. A sender holding the
  wrong key is refused at that point, before any of its data is read.
- **Progress photos always travel**, even if the backup's photo switch is off. That switch exists because a backup file goes to storage
  the person picks. The transfer goes only to their own other phone. If a phone holds no photos, nothing of them is sent.
- **A new native plugin, `MmTransfer`**, beside `MmBackup`: a server socket on Android, `NWListener` on iOS, with a client on each side. It
  sits behind a `TransferPlatform` interface, with native and fake implementations (a browser cannot listen, so stories and tests use the fake), as the backup does (MM-162).
- **The scanner learns QR codes** on both platforms, but only for this screen. The food scanner still reads only retail barcodes.
- **The logo uses the QR code's highest error-correction level (H)** and covers at most a fifth of the code's area. Every code is checked
  in tests by decoding it back.
- **The QR code is drawn by the app**, with no new dependency if a small, tested encoder fits in the source tree. If it does not, the
  smallest maintained encoder is proposed in the PR first.
- **The local-network paperwork goes in the same change.** The iOS Local Network explanation (`NSLocalNetworkUsageDescription`, which
  today speaks only of development) is rewritten for this. The privacy policy (MM-95) and the terms (MM-244) gain a sentence saying the
  two phones talk directly on the person's Wi-Fi and nothing goes to the internet. The offline check is unaffected, because it checks the
  page's own addresses.

## Decisions on building (2026-10-29)
- **Built like its siblings** (rule 9): the row sits in Settings > Backup beside Back up now and Restore, as an `MmListRow`; the
  sheets follow `PassphraseSheet` (a headline, a line of text, buttons at the end); the confirmation is the restore's own `confirm`,
  its words built as `restoreWords` builds them (the loss first). The row's icon is `movePhone` and Receive's is `qrCode`, both added to the set by
  meaning (MM-253 rule 2; `sync` already means Health sync on the same screen, the designer's PD-3).
- **"The same version" is the version and build the shell reports, and the schema version.** A local build carries the same version
  string on every build, so the schema is what tells two of them apart in practice.
- **The nudge works by day**: only the last backup's day is kept (MM-63), so a record on that day counts as unbacked; once the person
  has just backed up from the nudge, a backup made today counts as holding everything.
- **One row, then a choice** of Send from this phone or Receive on this phone, rather than two rows, so the section keeps one way in.
- **The code is in base32 behind `MMMOVE1:`**, 38 bytes (IPv4 address, port, key), so the QR code stays at version 6 (41 modules) in
  the alphanumeric mode with the icon in it. **jsQR is a dev dependency, for tests only**: every drawn code is decoded by it.
- **The photos are behind the phone's lock** (MM-157): sending asks for it when this phone holds any; replacing asks when this phone
  holds any.

## Decisions after the panel (2026-10-29)
The product designer and the UX guard read the stories, the small-phone ones among them, from source.
- **The nudge's skip is "Skip the backup"**, so both actions fit one row at 360 px with the backup the strong one (PD-1, F6).
- **One status region stays in each sheet** across its stages, and the headline takes focus on an outcome, so an expired code, a
  failure or "Sent" is heard; the percentage is no longer a live region (F3, F4).
- **A version mismatch offers only Close**: another try would fail the same way until a phone is updated (F5).
- **Something scanned that is not a move code** is the send sheet's failure, with Scan again, not a snack (F2).
- **Send says the other phone's step** ("On the phone you are moving to, choose Receive on this phone, then scan its code here"), and
  the code's words say "the phone you are moving from" (F1, F8). The QR code is named "QR code for your other phone to scan".
- **The confirmation is drawn at phone width** with the longest counts and photos on both sides (F7).
- **The terms are not changed here.** They say "The app does not send your records anywhere" and avoid "encrypt", and the backup's
  same gap waits on the owner and the attorney in MM-453; the move's sentence joins it there. The privacy policy (a draft for the same
  attorney) says it now: in the short account, in section 6, and in the photos' sentence.

## Description
On the receiving phone, "Move to another phone" checks for unbacked data and, if there is any, offers "Back up first". It then shows a
QR code (with the logo) and a line saying to scan it from Martian Macros on the other phone, both phones on the same Wi-Fi. On the sending
phone, "Move to another phone" opens the scanner. Once the code is read, the sender seals the snapshot with the key in the code and sends
it. Both phones show progress. The receiver opens the snapshot, checks it as a restore does, and asks to confirm with the counts. On
confirmation it replaces its data and shows the app as on the sending phone. On cancel, nothing changes. The sending phone keeps its data
in every case.

At the first-run welcome the same receiving screen opens without onboarding. After a confirmed transfer, the phone goes straight to the
app with the sender's profile. If the transfer is cancelled or fails, the phone returns to the welcome.

## Acceptance Criteria
```gherkin
Scenario: A full move from one phone to the other
  Given phone A holds a profile, targets, weigh-ins, food entries, marks, workouts, saved foods and progress photos
  And phone B shows its "Move to another phone" code
  When phone A scans the code and phone B confirms
  Then phone B holds every setup field, target, weigh-in, food entry, mark, workout, saved food and photo phone A holds, and nothing it held before
  And phone A's data is unchanged

Scenario: Photos travel whatever the backup's photo switch says
  Given phone A's backup photo switch is off and it holds progress photos
  When a move to phone B is confirmed
  Then phone B holds every one of those photos

Scenario: A phone with no photos
  Given phone A holds no progress photos
  When a move to phone B is confirmed
  Then the move succeeds and phone B holds no photos

Scenario: From the first-run welcome
  Given a fresh install that has accepted the terms
  When "I have Martian Macros on another phone" is chosen and a move is confirmed
  Then the app opens on the moved data without asking any onboarding question

Scenario: A move from the welcome that does not finish
  Given a fresh install started a move from the welcome
  When the move is cancelled at the confirmation, or the connection fails
  Then the app returns to the welcome with nothing stored and no profile

Scenario: Unbacked data is warned about first
  Given phone B holds data logged since its last backup, or holds data and has never been backed up
  When it starts "Move to another phone"
  Then before the code is shown it says that data is not backed up, and offers "Back up first" and a way to go on
  And "Back up first" runs the backup flow and then returns to this screen, which shows the code
  And going on without a backup shows the code

Scenario: Nothing to warn about
  Given phone B is fresh, or has nothing logged since its last backup
  When it starts "Move to another phone"
  Then the code is shown with no backup warning

Scenario: Nothing is replaced without confirmation
  Given phone B has received a move
  When the confirmation is shown
  Then it says what phone B will lose and what arrived, with Cancel focused
  And cancelling leaves phone B's data exactly as it was

Scenario: Different app versions
  Given the two phones run different app versions
  When phone A scans phone B's code
  Then no data is sent
  And each phone says which one to update
  And phone A's data is unchanged

Scenario: The wrong key is refused
  Given phone B is showing its code
  When a connection arrives that does not hold the key in the code
  Then phone B refuses it before reading any data
  And phone B keeps waiting, and its code still works for the right phone

Scenario: A changed byte is refused
  Given a move in progress
  When one byte of the sealed data is changed on the way
  Then phone B refuses it and its data is untouched

Scenario: Only sealed bytes cross the network
  Given a move in progress
  When the connection's traffic is captured
  Then every byte either phone wrote to it is sealed with the code's key
  And it holds no readable name, number or date from the person's data

Scenario: The listener does not outlive the screen
  Given phone B is showing its code
  When it leaves the screen, completes a move, or five minutes pass
  Then it no longer accepts connections, and the old code no longer works
  And a code shown again carries a different key from the last

Scenario: The phones cannot reach each other
  Given phone A has scanned a code
  When it cannot connect to the address in it
  Then it says both phones must be on the same Wi-Fi, and offers to scan again
  And phone A's data is unchanged

Scenario: The code reads with its logo
  Given any code the app draws for a move
  When it is decoded
  Then it uses error-correction level H, its logo covers at most a fifth of its area, and it decodes to its address, port and key

Scenario: The food scanner still reads only retail barcodes
  Given the food scanner is open
  When it sees a QR code
  Then it reads nothing

Scenario: The local network is explained
  Given the app as shipped
  When its iOS Local Network explanation, privacy policy and terms are read
  Then the explanation describes moving data to another phone on the same Wi-Fi
  And the privacy policy and the terms say the two phones talk directly on the person's Wi-Fi and none of it goes to the internet
```

## UI/UX
All in apps/mobile/src/gallery/screens/MoveToAnotherPhone.stories.tsx; the ones at phone width (360 px) carry the longest labels.
- Which way — (Story: MoveChoice, small phone). Send or receive, from Settings > Backup.
- The nudge — (Stories: MoveNudgeNeverBackedUp, small phone; MoveNudgeSinceBackup).
- The code — (Stories: MoveGettingCodeReady; MoveCodeWaiting, small phone). The QR code with the icon, and the wait.
- Receiving — (Story: MoveReceiving).
- The confirmation — (Story: MoveConfirm).
- Receiving did not happen — (Stories: MoveReceiveNoWifi, MoveReceiveOtherVersion, MoveCodeExpired, MoveReceiveBroken).
- Sending — (Stories: MoveReachingOtherPhone, MoveSending, MoveSent).
- Sending did not happen — (Stories: MoveSendUnreachable, small phone; MoveSendOlderReceiver; MoveScannedNotACode).
- From the welcome — (Story: MoveFromWelcome, small phone).

## Notes
- **Out of scope:** merging two phones' data; Bluetooth, hotspot or internet relay; sending food packs or phone settings; a move between
  more than two phones at once.
- The receiver's data is replaced only through the restore path MM-63 built (`SqlDataRestorer`), so there is one way the app replaces
  its store.
- Owed on the owner's phones, last (both on the same Wi-Fi): Android to iPhone and iPhone to Android; the iOS Local Network prompt;
  a network that keeps devices apart giving the "same Wi-Fi" message.
