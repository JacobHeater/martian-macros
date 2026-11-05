---
id: MM-729
status: in-progress
component: persistence
related: [MM-698, MM-716, MM-56, MM-720]
---

# Bug: the move's QR code can carry a VPN address on Android, and an error on its threads ends the app

## Context
Read from the sources on 2026-11-05, a parity pass over the Android app. `wifiAddress` took the first
network with the Wi-Fi transport; Android lists a VPN's underlying transports among the VPN network's, so
with a VPN up the move code can carry the VPN's own address, which no phone on the Wi-Fi can reach ("Could
not reach the other phone"). iOS reads `en0` by name and a VPN never changes it. Every block on the
plugin's threads caught `IOException` only, and an uncaught exception on an executor thread ends an Android
app: `listen` read the Wi-Fi address before its try (`NetworkInterface.getNetworkInterfaces` throws), and
`connect` could throw from the socket's close inside its catch. The pack download read `rangeStart` as an
`Int`, where iOS reads a 64-bit value: an offset past two gigabytes would not be read.

## Description
A VPN's network is passed over for the Wi-Fi's own. Every block on the plugin's threads answers the call,
whatever is thrown, with the same words and codes as before. Where a download carries on from is read as a
long.

## Acceptance Criteria
```gherkin
Scenario: A VPN is up
  Given the phone is on the Wi-Fi with a VPN up
  When "My QR Code" is shown
  Then the code carries the phone's Wi-Fi address

Scenario: Something thrown while listening
  Given the phone's network interfaces cannot be read
  When the app starts listening for a move
  Then it says the phone has no Wi-Fi address, and stays up
```

## Notes
- Regression test: `test/android/transferAndPacksOnAndroid.test.ts`.
- Where: `MmTransferPlugin.kt` (`wifiAddress`, every `io.execute` block), `MmPacksPlugin.kt` (`rangeStartOf`).
- Hotspots stay out of scope (MM-698); Android's `wlan` fallback may still name one.
- Owed on the owner's Pixel, on a build of main: "My QR Code" with a VPN up, carrying the Wi-Fi address.
  Not run locally; CI validates.
