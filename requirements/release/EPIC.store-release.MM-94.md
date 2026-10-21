---
id: MM-94
status: proposed
component: release
related: [MM-95, MM-96, MM-7, MM-8, MM-29, MM-57, MM-65, MM-84, MM-88, MM-109]
---

# Epic: Releasing to the stores

## Context
Getting a health app with in-app purchases onto the App Store and Google Play, in the United States, involves obligations that are easy to
discover late: privacy disclosures, health-data declarations, rules about health claims, and several reviews by people outside the project.

## On the backburner
- **The owner, 2026-10-21:** "I don't actually intend to release to app stores and only intend to use this personally on my own phone through local builds." This is future vision (M5); nothing here is built unless the owner decides to release.

## Narrative
The first release is United States only, on both stores.

Before it can be submitted:
- the safety limits and screening rules have been reviewed by a qualified professional (MM-29);
- the food data licensing has been reviewed (MM-57);
- the backup rules for health data are settled (MM-65);
- the trial and purchase mechanics are confirmed against current store rules (MM-88);
- there is a privacy policy, and the stores' data declarations are filled in truthfully (MM-95);
- every claim in the listing and the app has been checked (MM-96);
- CI builds the release (MM-7) with production app ids (MM-8).

## Acceptance Criteria (narrative)
The Epic is done when the app is live on both stores in the United States, each of the reviews above is recorded in its ticket with a name
and a date, and nothing in the listing promises what the app does not do.

## Notes
- The app icon and launch screen are MM-109; accessibility is MM-106.
- Not yet ticketed, and needed before submission: store screenshots and listing text, signing keys and their safekeeping, a support
  contact, and a release-build performance check.

**Note (2026-10-12, MM-242).** A gate this list did not have: the terms of use (MM-242) ship as a draft written by non-lawyers. A licensed attorney's review of the text and of the regulatory position, and the owner's decisions on licensor, governing law, disputes and contact address, are outstanding and block submission. Google Play also requires a privacy policy at a public address and inside the app (MM-95), separately from any terms. MM-244 (what the scanner sends, observed) must be done before the Data safety form is filled in.
