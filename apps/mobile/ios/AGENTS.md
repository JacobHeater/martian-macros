# The iOS shell (`ios/`)

Read with [apps/mobile/AGENTS.md](../AGENTS.md) and the root
[AGENTS.md](../../../AGENTS.md).

- Capacitor with Swift Package Manager. Swift twins of the five Kotlin
  plugins, registered as the Kotlin ones are (MM-403). Change both together.
- **The deployment target is iOS 15.0. CI builds no iOS app.** An API newer
  than iOS 15 must sit inside `if #available(...)`. Where a mistake would
  break only the iOS build, guard it with a test that reads the Swift source,
  as `test/ios/sleepValuesAvailability.test.ts` does (MM-440).
- The owner's `DEVELOPMENT_TEAM` in `App.xcodeproj/project.pbxproj` stays
  unstaged. Never commit it.
- Physical-device checks (Apple Health, the camera, reminders, a pack
  download) go on the owner's phone checklist in the handoff.
