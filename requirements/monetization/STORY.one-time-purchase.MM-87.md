---
id: MM-87
status: proposed
component: monetization
related: [MM-84, MM-8, MM-85, MM-86, MM-88]
---

# Story: Buy the Coach once

## Context
See MM-84.

## Decisions (made with the product owner)
- **A single one-time purchase** unlocks the Coach permanently.

Choices I made without asking (say if any is wrong):
- **Bought through each store's in-app purchase**, using Flutter's first-party `in_app_purchase` plugin.
- **"Restore purchase" is always available**, and the app also checks for an existing purchase by itself on first launch, so a returning
  user on a new phone is not asked to pay again.
- **Family Sharing is enabled on iOS.**
- **The unlock works offline** once known: the purchase is recorded on the device and re-checked with the store when a network is
  available. A user who is offline for a month keeps the coach.
- **A refund removes the unlock** when the store reports it.
- **The purchase belongs to the store account, not to the app's data.** Erasing all data (MM-62) or restoring a backup does not remove
  or grant it.

## Description
The purchase flow from the paywall and the Coach screen, restoring, and keeping the unlock state.

## Acceptance Criteria
```gherkin
Scenario: Buying
  Given a user at the paywall
  When they complete the purchase
  Then every Coach feature is unlocked at once and targets resume adapting

Scenario: A new phone
  Given a user who bought on their old phone
  When they install on a new phone with the same store account
  Then the Coach is unlocked without paying again

Scenario: Offline
  Given a user who has bought and has no network
  Then the Coach is unlocked

Scenario: Erasing data
  Given a user who has bought
  When they erase all data
  Then the Coach is still unlocked after onboarding again

Scenario: A cancelled purchase
  When the purchase sheet is dismissed
  Then nothing is unlocked and nothing is charged
```

## Notes
- The product id is tied to the app id; settle dev and prod app ids first (MM-8).
- With no server there is no server-side receipt validation. Accept the store's on-device verification.
