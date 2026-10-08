# WS-13: Commercial and release readiness

**Order** 13 · **Group** D · **State** not started · **Risk** high

## Summary
The Coach unlock and its trial, the external reviews, the stores' obligations,
and the release itself.

## Why this is a workstream
Releasing a health app with an in-app purchase in the United States involves
obligations that are easy to discover late: a professional's signature on the
safety limits, privacy disclosures, health-data declarations, rules about
health claims, and each store's own rules for a trial attached to a one-time
purchase. The monetization model (free logging forever, a one-time Coach
unlock, a 21-day trial timed to end after two adaptive updates) is decided;
none of it is built.

It is last because it depends on nearly everything, and it is in this roadmap
from the beginning because three of its items take calendar time that no
amount of engineering can shorten. Those start now.

## Capability it unlocks
The app is on both stores, sold as described, with every external review
recorded.

## Included
- A spike on how each store permits a trial for a non-subscription purchase.
- The privacy policy and the stores' data and health declarations.
- Professional review of the safety limits, screening rules and safeguards.
- The free-tier boundary and the real entitlement implementation.
- The trial and the one-time purchase.
- A review of every claim in the app and the listing.
- The store release.

## Excluded or deferred
- Subscriptions: the decision is a one-time purchase.
- Markets outside the United States.
- Analytics and crash reporting: none is planned, and the privacy ticket
  forbids adding a library that contacts the network without updating the
  policy first.
- Listing screenshots, signing-key custody, a support contact and a
  release-build performance check: the release epic lists these as needed
  and not yet ticketed. Write the tickets before step 6.

## Prerequisites
Step 1: none.

Step 2 (professional review):
- **WS-06 step 1 (MM-143)**: the evidence register is the document reviewed.
- **WS-02 (MM-120, MM-131, MM-115, MM-132, MM-111, MM-135)**: review the
  corrected limits, not the known-defective ones.
- **WS-05 (MM-83, MM-112)**: the screening rules under review.

Steps 3 and 4 (free tier, trial, purchase):
- **WS-06 step 3 (MM-138)**: paid features already read the entitlement
  interface.
- **WS-09 (MM-149, MM-114, MM-147, MM-33)**: the trial ends after the user
  has seen what the coach measured.

Step 6 (release), in addition:
- **WS-01 (MM-7, MM-8)**, **WS-03 (MM-91, MM-106, MM-109)**,
  **WS-04 (MM-57, MM-52, MM-56)**, **WS-12 (MM-65, MM-63, MM-64)**.

## Enables
Nothing further. It is the end of the graph.

## Packages and surfaces
- a purchases and entitlement package (new), implementing the interface
  introduced in WS-06
- store listings, the privacy policy, and declarations (documents, hosted
  outside the repository)
- release configuration and CI release jobs

## Risks
- **The professional review can change engine values late.** That is its
  purpose. Schedule it as early as its prerequisites allow so that changes
  land before the beta ends, not after.
- **Store rules for trials differ and change.** The plan on iOS is a
  zero-price non-consumable as the trial marker; on Android, a locally kept
  clock. Both need confirming against current rules, which is the spike.
- **A locally kept trial clock can be reset** by reinstalling. Decide how
  much that matters before engineering against it; for a one-time purchase
  from a small developer, not much.
- **Health claims.** The stores reject medical claims from apps that are not
  medical devices, and consumer-protection law applies to the listing. The
  what-to-expect screen, the weight-loss-medication wording and every
  explanation the coach gives are in scope.
- **The paywall must never gate safety.** Screening, limits, the
  under-eating notice, the fast-loss raise and the health re-check work the
  same for free users.

## Sequence
1. **Long-lead items (MM-88, MM-95).** M3. Start now. Begin looking for the
   reviewer for step 2 at the same time; the ticket for the review cannot
   start, but the search can.
2. **Professional review (MM-29).** M3. Recorded against rows of the evidence
   register, with name, credential and date.
3. **Free tier and entitlements (MM-85).** M3. Decide the boundary feature by
   feature, then implement the interface for real.
4. **Trial and purchase (MM-86, MM-87).** M3.
5. **Health-claims review (MM-96).** M3. Best done with the reviewer from
   step 2.
6. **Release (MM-94).** M3.

## Done enough to unblock others
Not applicable. The workstream is done when the app is live on both stores in
the United States.

## Do not start before this
Not applicable.

## Parallel with
Step 1 runs beside everything. Steps 3 and 4 touch only the new purchases
package and the entitlement interface, and can run beside late work in WS-09
to WS-12.

## Requirement sources
- Remaining: MM-88, MM-95, MM-29, MM-85, MM-86, MM-87, MM-96, MM-94.
  Epic: MM-84.

## Notes for whoever builds it
- The free tier, as decided: food logging, barcode scanning, the training
  log, trend weight, health sync and backup, forever. The Coach unlock:
  adaptive expenditure, weekly target changes, body-composition estimates,
  reports and phase planning. The free-tier ticket also proposes letting
  free users set targets by hand; that proposal awaits confirmation.
- Introduce no purchase code before the spike is done.
- The privacy policy lists every network request the app can make. As
  designed there are five kinds: the food pack download, the opt-in barcode
  lookup, a backup to storage the user connected, the purchase (handled by
  the store), and nothing else. Verify by observing a release build with a
  network monitor, as the ticket requires.
- iOS builds, HealthKit declarations and App Store submission need the Mac.
  Android can reach a store-ready build from the Windows machine.
- The product models biological sex as male or female only. Listing text
  and screenshots should describe the app as it is.
