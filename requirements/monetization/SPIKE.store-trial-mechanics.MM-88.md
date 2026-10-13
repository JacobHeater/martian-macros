---
id: MM-88
status: done
component: monetization
related: [MM-84, MM-86, MM-87, MM-94, MM-228]
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
4. Whether a Capacitor in-app purchase plugin exposes what is needed, or the app writes its own (it was "Flutter's `in_app_purchase`
   plugin" when written; the app is React in a Capacitor shell since MM-228).

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

## Findings (read 2026-10-13)

Nobody involved is a lawyer; this is what the stores' own pages say, quoted, with where they say it.

### 1. Apple: confirmed, with two corrections

App Store Review Guideline 3.1.1 (https://developer.apple.com/app-store/review/guidelines/, read 2026-10-13; the page shows no
last-updated date):

> "Non-subscription apps may offer a free time-based trial period before presenting a full unlock option by setting up a
> Non-Consumable IAP item at Price Tier 0 that follows the naming convention: "XX-day Trial." Prior to the start of the trial, your app
> must clearly identify its duration, the content or services that will no longer be accessible when the trial ends, and any downstream
> charges the user would need to pay for full functionality. Learn more about managing content access and the duration of the trial
> period using Receipts and DeviceCheck."

Corrections to the planning text: the naming convention is "XX-day Trial" (so "21-day Trial" fits), and the disclosure is three things
before the trial starts (duration; what stops working; what full functionality costs), not only the name.

What the user sees: the standard purchase sheet for a free non-consumable, which the person confirms as any purchase. A zero-priced
non-consumable is a transaction, so it is in the account's transaction history and comes back with `Transaction.currentEntitlements`.

The date: StoreKit 2's `Transaction.originalPurchaseDate`, "The date of purchase for the original transaction." (iOS 15.0 and later;
https://developer.apple.com/documentation/storekit/transaction/originalpurchasedate, read 2026-10-13). Apple's WWDC21 StoreKit 2
session says non-consumables in the user's transaction history are returned by `currentEntitlements` and that a reinstalled app no
longer needs an explicit restore, though an app must still offer "Restore Purchases"
(https://www.wwdcnotes.com/notes/wwdc21/10114, third-party notes of the session). Developer forum reports
(https://developer.apple.com/forums/thread/693461) say the entitlement streams read a local cache that is empty until StoreKit has
synced with Apple for that user on that device, and that `AppStore.sync()` behind a Restore button fills it; so the design treats "no
trial transaction yet" as "not started", never as "expired".

So on iOS a reinstall, or a second device on the same Apple account, **does not restart the trial**: the original purchase date of
the "21-day Trial" item is the start, kept by Apple.

### 2. Google Play: no mechanism, confirmed

Google's one-time product pages describe two purchase options, buy and rent ("The rent purchase option lets users access the one-time
products for a specified time duration"), and two offer kinds, pre-order (buy only, early access) and discount
(https://developer.android.com/google/play/billing/one-time-product-multi-purchase-options-offers, read 2026-10-13). None is a free
trial: the page names no trial offer, says nothing about a zero price, and its "limited time" setting bounds when an offer can be
bought, not how long a purchase lasts. The integration guide (https://developer.android.com/google/play/billing/integrate, read
2026-10-13) likewise lists pre-orders, purchase options and offers only. The Play Console help page on one-time products never
mentions trials (https://support.google.com/googleplay/android-developer/answer/1153481, read 2026-10-13); Play's free trials are a
subscription feature.

A rent purchase option with a 21-day period at a zero price would be the Play-native shape of a trial **if** Play allowed a zero price
for a rental; nothing read says it does or does not. Worth one question to Play support before building the clock; not assumed.

So on Android the trial is timed on the device: the start day is written to the app's own database when the person starts the trial.
This app turns cloud backup off (MM-229), so **a reinstall restarts the trial**; that is the accepted leak, and it is bounded by the
free tier being complete without the Coach (MM-85). Nothing in Play survives a reinstall for a one-time product that was never bought.

Deadline noted on both Google pages: "By Aug 31, 2026, all new apps and updates to existing apps must use Billing Library version 8 or
later." The guide's own examples use Billing Library 9.1.0.

### 3. Disclosure, both stores

Before the trial starts, in the app, on the screen that starts it: how long it lasts (21 days), what stops working when it ends (the
Coach; the logger stays whole, MM-85), and what full functionality costs (the one-time price, in the store's localized form). On iOS
that is Apple's rule quoted above; on Android no rule applies to a device-timed trial, and the same screen is shown so the two
platforms do not differ. The store listing says the app is free with a one-time Coach unlock and a 21-day trial, in both stores'
description fields; the price itself is shown by the store.

### 4. The plugin

Three Capacitor plugins exist (read 2026-10-13): Capgo's `@capgo/native-purchases` (MPL-2.0, free, StoreKit 2 and "Google Play
Billing 7.x", https://github.com/Cap-go/capacitor-native-purchases; its transaction object has `purchaseDate` on both platforms and
`originalPurchaseDate` for iOS subscriptions only, so the trial's original date would need a change or a raw receipt read); Capawesome's
`@capawesome-team/capacitor-purchases` (StoreKit 2, Billing 8, paid "Insiders" license, https://capawesome.io/plugins/purchases);
and `cordova-plugin-purchase` through its Capacitor wrapper (StoreKit 2, Billing 8.3). The repository's rule is to write its own thin
plugin where none fits (MM-228), as it did for storage, packs, reminders, the camera and health. What the app needs is small: list
two products, buy one, restore, and read each owned transaction's original purchase date; a plugin of our own over StoreKit 2 and
Billing Library 9 (`MmStore`, beside the others) is the recommendation, with the Capgo plugin as the fallback if the owner prefers a
dependency. Either is a new dependency or a new native surface and is the owner's call (MM-84).

### The design, in one place

- Two store products: the non-consumable "21-day Trial" at price tier 0 (iOS only; Android has no product for the trial) and the
  non-consumable Coach unlock at the one-time price (both stores).
- The trial's start is `originalPurchaseDate` of the trial transaction on iOS, and a day written to the app's database on Android.
- Entitlement: unlocked if the unlock transaction is owned; else in trial if today is within 21 days of the start; else the free tier.
  Unknown (no sync yet, iOS) counts as not started, never as expired.
- Reinstall: iOS keeps the trial's start; Android restarts it.
- What the person sees before starting: duration, what ends, the price; then the store's own sheet on iOS, nothing further on Android.

Decided here: none of it is built; MM-86 and MM-87 build it after the owner settles the plugin question and MM-85's free-tier boundary.
