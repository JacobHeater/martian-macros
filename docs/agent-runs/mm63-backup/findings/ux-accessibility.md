# UX-accessibility review: Backup and restore in Settings (MM-63, MM-64)

**Role:** ux-accessibility (UX guard), read-only. **Mode:** change; `feat/m2` working tree, 2026-10-19. **Render:** none; the stories and components read from source; the confirmation, the busy states and a cancelled share have no story and were walked from source alone. The brief's MM-65 path was wrong; the file is `SPIKE.icloud-and-device-backup-rules.MM-65.md`.

## Walkthroughs
**(a) First backup.** The folded Backup section; the row "Back up now" read as title plus subtitle; the sheet "Passphrase, dialog"; the field with its helper bound by `aria-describedby`; the secret decided before the warning is read (F5), hidden with no show option (F3), Enter inert (F4); "Passphrase again" alerts "The two do not match." from the first keystroke (F2); Cancel and a dimmed "Back up" explained by the helper; on Back up the sheet closes and the row, now busy, stops being a button, so focus falls to the document and the reader hears nothing of the work (F6); the snack is polite; a cancelled share returns silently, acceptable.
**(b) Restore with one wrong passphrase.** The picker (not inspected); a non-backup file's snack; the sheet, one field, no helper; the wrong one closes the sheet, a second of work, a fresh sheet with the alert under the field, heard; the right one brings `overlays.confirm`: Cancel focused and stronger, Restore the danger text (MM-280 met), but the message is not announced, only the title (F1); the message is one paragraph with three dates and two lists (F7); Restore's snack is polite; a second press is prevented throughout.

## Findings
**F1 (high).** `MmDialog` sets `aria-labelledby` only; the confirm's message is not the dialog's description, so a reader confirms a replace-all without hearing what is replaced (the Erase dialog too). Recommend `aria-describedby` on the body in `MmDialog`, one home.
**F2 (medium).** "The two do not match." fires from the first keystroke of the second field. Judge only once the second is as long as the first or diverges, or on leaving the field.
**F3 (medium).** Hidden entry with no Show option, typed twice on a phone keyboard; NIST SP 800-63B (2017 and the 2025 revision) says verifiers should offer to display the secret and permit paste. Recommend a Show/Hide toggle on the passphrase kind; `current-password` on the open sheet so a password manager can offer it.
**F4 (medium).** Enter does nothing (no `onSubmit`); the actions sit at the sheet's foot; whether the keyboard covers them needs a device check.
**F5 (medium).** The lost-passphrase warning sits after both fields in caption type; a novice chooses the secret before reading that nobody can recover it. Place it before the first field in body type, or as the first field's helper.
**F6 (medium).** After the sheet closes the row loses its `onPress` while busy and becomes a `<div>`, so focus is lost and "Backing up…" is in no live region; no spinner against `interaction-and-motion.md:72-73`. Keep the row a button while busy (disabled, `aria-busy`), announce the busy text, draw the labelled spinner.
**F7 (medium-low).** The restore message asks the novice to compare two lists in one paragraph; loss first, then what the backup holds, zero counts omitted unless both are zero.
**F8 (high).** MM-65 decided Settings would say the records are not in the phone's own cloud backup, beside the backup action; nothing in `src/` says it. A tester relying on iCloud or Google device backup expects their records to move; they will not. One sentence in the Backup caption.
**F9 (low).** A raw error string is interpolated into a snack. A fixed sentence.
**F10 (low).** The sheet is labelled "Passphrase", the same word as its first field; pass the heading.
**F11 (low).** "Passphrase" is the right word (several words with spaces are fine; NIST treats it as a synonym), but the sheet never says what one is: helper "A few words you will remember are easiest."; add it to the glossary.
**F12 (low, referred).** No story draws "Backing up…", "Opening the backup…", the confirmation or a cancelled share; the dialog's fit at 200% unverified.

## Verdict
Pass, no blocking finding.

## Chair requests
Privacy/security: is 8 characters adequate for an offline Argon2id-sealed file against NIST 800-63B-4's 15-character minimum? Chair: route F8 and confirm its sentence. Implementation: the keyboard-occlusion device check.

## Audit coverage
Source inspection of the section, the sheet, the words, the Settings screen, the height sheet, the field, sheet, dialog and overlays components, the stylesheet; the four stories; the flow test and the overlays test; the direction documents. Rule 9 holds against the Data and Erase sections. Not inspected: the native share sheet, picker and plugins; the cipher and file format; providers. Limitations: analytical only; reader behaviour inside a freshly opened modal is a hypothesis.

## Research
Performed for F3 and F11: NIST SP 800-63B (https://pages.nist.gov/800-63-3/sp800-63b.html, 2017, updated 2020-03-02, accessed 2026-10-19) and SP 800-63B-4 (https://pages.nist.gov/800-63-4/sp800-63b.html, 2025-08-26, accessed 2026-10-19): display option and paste should be offered, spaces accepted, "password" sometimes called "passphrase", 15-character single-factor minimum; W3C WAI Understanding SC 3.3.8 Accessible Authentication (Minimum) (https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html, updated 2026-09-06, accessed 2026-10-19): password managers and paste as mechanisms, applicability indirect. Unnecessary for the rest.

## Safety and privacy
None beyond F8. Not clinical clearance.
