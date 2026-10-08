---
id: MM-88
status: proposed
component: monetization
related: [MM-84, MM-86, MM-87, MM-94]
---

# Spike: How each store supports a trial before a one-time purchase

## Context
Subscriptions have built-in free trials on both stores. A one-time unlock does not. Planning's understanding, **stated from memory and not
checked against the current guideline text**:
- **Apple** allows a non-subscription app to offer a free time-limited trial through a zero-priced non-consumable in-app purchase named in
  the form "21-day Trial" (App Store Review Guideline 3.1.1), whose transaction date StoreKit keeps across reinstalls.
- **Google Play** has no equivalent for one-time products, so the trial would be timed on the device.

## Description
Confirm or correct both, from the current store documentation:
1. Apple: the exact rule, the required naming and disclosure, what the user sees, whether the trial item appears in purchase history, and
   how StoreKit 2 exposes its original purchase date.
2. Google Play: whether any mechanism now exists for a timed trial of a one-time product; if not, the least-bad on-device clock (and what
   survives a reinstall, if anything).
3. For both: what the store listing and the app must disclose about the trial and the price before it starts.
4. Whether Flutter's `in_app_purchase` plugin exposes what is needed, or a platform channel is required.

## Acceptance Criteria
```gherkin
Scenario: Confirmed against the source
  Then this ticket quotes the current rule for each store, with a link and the date it was read

Scenario: A design for each store
  Then it states how the 21-day trial is implemented on iOS and on Android, and what a reinstall does on each

Scenario: Disclosure
  Then it lists what must be shown to the user, and where, before the trial starts
```

## Notes
- If Apple's rule turns out not to allow this, the fallback is an on-device clock on both platforms, with the same accepted leak as
  Android.
