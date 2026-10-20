# Product-designer review: Settings > Backup (MM-63, MM-64)

**Role:** product-designer, read-only. **Mode:** change; `feat/m2` working tree, 2026-10-19. **Render:** none; stories and components read from source; palette fidelity unverified. The brief's MM-65 path was wrong; the file is `SPIKE.icloud-and-device-backup-rules.MM-65.md`.

## Walkthroughs
**(a) A first backup.** Eleven folded headers; "Backup" between Data and Appearance with Data's own `lock` icon (PD-2). Three rows of equal weight and a caption. The sheet: two hidden fields, the helper, the warning as a caption under the second field (PD-4), Cancel and an inert "Back up" explained by the helper. On Back up the row becomes "Backing up…" and stops being a button; a word swap in the same type, no spinner (PD-3). Snack and the day shown. No failing step; two weak signals.
**(b) A restore with one wrong passphrase.** Settings draws nothing until setup exists, so a fresh phone must be onboarded before Restore, and the "nothing is lost" branch is unreachable from the UI (Q1). The picker; a wrong file's snack; the sheet; the wrong passphrase closes it, a second of work, a fresh sheet with the error; the right one brings the dialog, identical to Erase's (Cancel stronger, Restore the danger text); one paragraph of up to eight numbers (PD-8). No failing step.

## Findings
**PD-1 (high).** MM-65 decided Settings would say, beside the backup action, that the database is not in the phone's cloud backup; nothing says it, and "Stored only on this device. Nothing is uploaded." invites the opposite inference. One sentence in the caption; a story change follows.
**PD-2 (medium).** A new section beside Data with Data's icon and Data's sentence: three `lock` glyphs in 200 dp, "Nothing is uploaded" said twice, no sibling named and no reason given (rule 9); Settings already exceeds its group budget. Ask whether Backup should be rows of Data; if the section stays, record the reason and accept the duplication explicitly.
**PD-3 (medium).** "Backing up…", "Opening the backup…", the mismatch and the confirmation are drawn by no story (MM-292); the busy state is a title swap and the row stops being a button, against the sibling (`HealthPlatformSection` keeps the row a button with "Reading…" in the subtitle) and `interaction-and-motion.md:72-73`. Follow the sibling; add stories through `FakeBackupPlatform`.
**PD-4 (medium).** The warning is honest but the smallest thing on the sheet, read after typing. Move it under the headline, or make it a sheet notice; name the useful act ("Keep it somewhere safe.").
**PD-5 (medium).** A failed backup speaks an internal message. A fixed sentence.
**PD-6 (low).** Restore is guarded as Erase is; the row rightly not `danger` (the beta's recovery act). Record the reason.
**PD-7 (low-medium).** "Last backup" records a day on Android's "handed on", which only says another app received the file. A hedge or an owner decision (Q2).
**PD-8 (low).** `Fmt.shortDay` has no year, the only cue between files; two paragraphs would let a novice find the loss sentence.
**PD-9 (low).** "Passphrase" is the domain's word (the phone's own lock is the "password" in the terms); add it to the glossary. `current-password` on the open sheet.

## Audit coverage
Source inspection of the section, sheet, words, problems, fake, the Settings screen, the sibling sheets and sections, the design-system parts, the stylesheet, the four stories, the tests, MM-63/64/65/280, the direction documents, `design-map.json`. Not inspected: the cryptography, the plugins, providers, token contrast. Blocked: any render.

## Research
Performed, partly blocked: WhatsApp's encrypted-backups post (https://blog.whatsapp.com/end-to-end-encrypted-backups-on-whatsapp, accessed 2026-10-19) says "password"; Signal's support article (https://support.signal.org/hc/articles/10066926526362) returned 403, its "passphrase" wording unverified. The repository's own decision and the need to tell the backup's secret from the phone's password decide it.

## Chair requests
Q1 (product): a restore entry at the welcome step for a fresh install? Q2 (React-Capacitor, privacy): what Android's chooser can tell the app.

## Safety, privacy
None in scope; the copy's claims match the built posture. Owner decisions: PD-2, PD-4, PD-7, Q1.
