# Signing the iOS app for a phone

The simulator needs no signing: `mm build ios` and `mm run --ios` work on
any Mac with Xcode. A real iPhone needs the app signed with an Apple
Developer team, and Apple Health on a phone needs the HealthKit capability,
which only the paid Apple Developer Program grants (MM-69). This is done
once, by the owner, in Xcode; it is never committed.

## One-time setup

1. Open the shell in Xcode: `open apps/mobile/ios/App/App.xcodeproj`.
2. Xcode, Settings, Accounts: add your Apple ID if it is not there. Your
   team appears under it once the Developer Program membership is active.
3. In the project navigator select **App** (the blue icon), then the
   **App** target, then **Signing & Capabilities**.
4. Plug the iPhone in with a data cable, unlock it, and tap Trust when it
   asks. On the phone, Settings, Privacy & Security, Developer Mode: turn
   it on and restart when iOS asks (iOS 16 and later). Pick the phone as
   the run destination at the top of Xcode. Apple generates a development
   profile only for registered devices, so the phone comes first: without
   one, Xcode says "Your team has no devices from which to generate a
   provisioning profile". (A device can also be added by UDID under
   Devices at https://developer.apple.com/account/.)
5. Tick **Automatically manage signing** and choose your **Team**, then
   press **Try Again** if Status shows a warning. Xcode registers the
   phone, creates the signing certificate and the provisioning profile for
   `com.martianmacros` (the real app; the dev and demo twins are
   `com.martianmacros.dev` and `.demo`, which `mm run --ios --env dev|demo`
   builds the same way) and shows the HealthKit capability the project already declares
   (`App/App.entitlements`). A "Provisioning profile doesn't include the
   HealthKit entitlement" message means the team is not in the paid
   program yet.
6. Press Run. The first time, iOS refuses to open the app until the
   developer is trusted: Settings, General, VPN & Device Management, your
   Apple ID, Trust.

The team id ends up in `project.pbxproj` as `DEVELOPMENT_TEAM`. It is
yours, not the repository's: `git checkout apps/mobile/ios/App/App.xcodeproj`
before committing, or leave the line out of the commit. A later ticket can
move it to a git-ignored `xcconfig` if that becomes a chore.

## From the command line, once the team is set

```sh
cd apps/mobile && npm run ios && cd ios/App
xcodebuild -project App.xcodeproj -scheme App -configuration Debug \
  -destination 'generic/platform=iOS' -allowProvisioningUpdates build
```

`xcrun devicectl list devices` names the phone;
`xcrun devicectl device install app --device <id> <path to App.app>` installs
the build. `mm` does not wrap device builds yet (MM-403).

## What a signed phone unlocks

- The owner's checklist in MM-403: the terms, onboarding and a weigh-in
  surviving a force quit; a reminder at its time (MM-405); the camera on a
  barcode and a label (MM-406); Apple Health on the device (MM-69).
- TestFlight, later, through the same team.

## Signing is not CI's

CI builds no iOS app yet (the owner's decision, 2026-10-19, MM-403). When
it does, it builds for the simulator, which needs no team, or uses a
certificate kept in the repository's secrets, never in a file.
