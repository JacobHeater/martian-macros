# Martian Macros: the React app

The app (MM-228). It replaced the Flutter app with MM-232; the layers the
Dart packages kept apart stay apart below.
It runs offline inside a native shell on a phone. The browser is where it is
developed, tested and reviewed; the web is not a product.

From the repository root, `mm check` runs everything below with the rest of
the repository's checks. From this folder:

| Command | Does |
| --- | --- |
| `npm ci` | Installs the exact versions in `package-lock.json` |
| `npm run dev` | Serves the app for development |
| `npm run check` | Type check, tests, build, and the offline check |
| `npm run android` | Builds the app and copies it into the Android shell |
| `npm run ios` | Builds the app and copies it into the iOS shell |

## The Android shell

`android/` is a Capacitor project that shows the built app in a web view.
Its three product flavors are the three identities (MM-8): `prod`
(`com.martianmacros`, "Martian Macros"), `dev` (`.dev`, "Martian Macros
Dev") and `demo` (`.demo`, "Martian Macros DEMO"), each its own sandbox;
nothing but the id and the name differs. Cloud backup is off.

To build and install it, with `JAVA_HOME` set to Android Studio's `jbr`
folder and `ANDROID_HOME` to the SDK:

```
npm run android
cd android
./gradlew assembleDebug
adb -s <device> install -r app/build/outputs/apk/debug/app-debug.apk
```

Name the device with `-s` every time. The Gradle wrapper is 9.3.1, the same
as the Flutter project's, because the wrapper Capacitor generates cannot run
on Java 25.

## The iOS shell

`ios/` is the same app in a Capacitor iOS project (MM-403) under the same
three identities (MM-8): the bundle id is `com.martianmacros` plus the
build setting `MM_IDENTITY_SUFFIX`, the Home Screen name `MM_DISPLAY_NAME`;
`mm` passes both, and Xcode's own Run is the real app. Swift Package Manager (`ios/App/CapApp-SPM/Package.swift`
is written by `cap sync`, never by hand). The plugins are Swift classes in
`ios/App/App/Plugins/`, registered from `MainViewController`, one for each
Kotlin plugin: `MmDb` over the system SQLite (MM-404), `MmPacks` (MM-404),
`MmReminders` (MM-405), `MmScanner` (MM-406) and `MmHealth` over HealthKit
(MM-69). The app's files live under `Library/Application Support`, kept out
of backups.

From the repository root, `mm build ios` builds for the simulator and
`mm run --ios` installs and launches there; no signing is needed.
`mm run --ios --phone` builds signed and opens the real app on the iPhone
plugged in (MM-412; the team from `MM_APPLE_TEAM` or the project's own
uncommitted line). A phone
needs a team chosen in Xcode once: `docs/ios-signing.md`.

## Layout

| Path | Holds |
| --- | --- |
| `src/theme/` | The design tokens as CSS variables, and the theme choice |
| `src/ui/` | The design-system components, one per file. Screens use these and no raw form control |
| `src/app/` | The shell: the five destinations and what is shown in each |
| `src/lang/` | The few things Dart had and JavaScript lacks or does differently: rounding, reading a number, its errors, a watched value |
| `src/domain/` | The domain model, carried over from `packages/domain`. Imports only `src/lang/` |
| `src/engine/` | The coaching engine, carried over from `packages/engine`. Imports only `lang` and `domain` |
| `src/healthIngest/` | The seam to a phone's health platform, carried over from `packages/health_ingest`. Imports only `lang` |
| `src/sql/` | `SqlDatabase`, the one thing the app knows about SQLite, and in `wasm/` its adapter for tests and the browser. Imports only `lang` |
| `src/foodCatalog/` | Food packs read, searched and written through `SqlDatabase`, carried over from `packages/food_catalog`. Imports only `lang` and `sql` |
| `src/foodPipeline/` | Builds food packs from the open data sources, carried over from `packages/food_pipeline`. A developer tool, never part of the app; its `node/` folder is the only place that touches files |
| `src/fixtures/` | Every repository and seam held in memory, the demo seed, and a typical user, carried over from `packages/fixtures`. Their contract suites are in `test/contracts/` |
| `src/data/` | The user's database and every repository over it, through `SqlDatabase`, carried over from `packages/data`. Passes the same contract suites as the fixtures |
| `src/format/` | What the user reads: numbers, dates, units and the fixed wording of every label and sentence, carried over from the Flutter app. The only place imperial units exist |
| `src/state/` | `AppState`: everything the screens show that is worked out from what is stored, as cells that follow the repositories. No React and no browser in it. From the Flutter app's providers |
| `src/platform/` | What the phone provides, each behind an interface of ours with the Capacitor adapter beside it; `runningOn` says which platform, for the few screens that differ (MM-403) |
| `src/gallery/` | Every token and component as built; open the app with `?gallery` |
| `test/` | Tests carried over from Dart, in the folder of what they test; `test/contracts/` holds the suites every implementation of an interface must pass; and tests about the whole app or the build |

The tokens are copied from the Flutter theme, and a test compares the two
until the Flutter app is removed.

## Carrying Dart over

All of the Dart is being converted to TypeScript (MM-230). The Dart tests
are the reference: each is carried over with its source and must pass with
the same expected values. So that any file can be checked against the one it
came from, the conversion is written the same way everywhere.

| Dart | TypeScript |
| --- | --- |
| `foo_bar.dart` declaring `FooBar` | `FooBar.ts` in the same folder; a function `fooBar` goes in `fooBar.ts`. One exported declaration per file; a file with several is split |
| `enum GoalMode { fatLoss, ... }` | A type of string literals and an object of the same name: `'fatLoss'`, `GoalMode.values` in the Dart order |
| An enum with fields or getters | Functions on that object: `QuantitySource.relativeSigma(source)`, `PortionUnit.grams(unit)` |
| A class with only fields | An `interface`, built as an object literal |
| A class with defaults, getters, methods or checks | A `class` whose constructor takes one object: `new Pause({ from, to, reason })` |
| Named parameters | One object parameter, destructured, with the same defaults. A default also replaces a key given as `undefined`, which Dart's does not do for an explicit `null`; where that matters, test for the key with `in` |
| `null` | `undefined`, everywhere. A nullable field is `name?: T \| undefined` |
| `CalendarDate(2026, 3, 8)` | `CalendarDate.of(2026, 3, 8)`. There is one object per day, so `===`, `Map` keys and `Set` members behave as Dart's value equality did |
| `==` overridden on a class | An `equals(other)` method, or a `sameX(a, b)` function for an interface. `===` on two objects is never value equality |
| `x.round()` | `roundHalfAwayFromZero(x)`. Never `Math.round`, which sends -2.5 to -2 |
| `x.toStringAsFixed(n)` | `toStringAsFixed(x, n)`. `toFixed` drops the sign of negative zero |
| `NumberFormat`, `DateFormat` | Written out in `format/` (`groupThousands`, `Fmt.day`). Not `Intl`, whose output depends on the device |
| `x ~/ y`, `x.toInt()` | `Math.trunc(x / y)`, `Math.trunc(x)` |
| `x % y` with a possibly negative `x` | Dart's result is never negative; JavaScript's can be. Write `((x % y) + y) % y` |
| `double.tryParse(text)` | `tryParseDouble(text)`. Never `Number(text)` or `parseFloat(text)` |
| `int.tryParse(text)` | `tryParseInt(text)`. Never `parseInt(text)` |
| `1.0.toString()` is `"1.0"` | JavaScript gives `"1"`. Format numbers for display explicitly |
| `DateTime` | `Date` |
| `Duration` | A number of milliseconds, with `Ms` in the name |
| `Stream<T>` from a repository | `Watched<T>` |
| `Future<T>` | `Promise<T>` |
| `ArgumentError`, `FormatException` | `ArgumentError`, `FormatError` in `src/lang/` |
| `assert(...)` in a constructor | A thrown `ArgumentError`, always on |
| A sealed class and its cases | A class per case with a `kind`, and a union type of them |
| A record `(a, b)` | A readonly tuple `[a, b]` |
| `/// doc comment` | `/** doc comment */`, the same words |

## App icon and splash

The masters live in `design/`: `app-icon.png` (square, the art filling the
frame), `loading-screen.png` (portrait) and `landscape-loading-screen.png`.
Every platform icon and splash is generated from them, never edited by hand:

```sh
python3 scripts/app-icons.py
```

That writes the iOS 1024 px icon and its 2732 px splash (shown aspect-fit by
the launch storyboard on the art's own sky colour), the Android launcher,
round and adaptive foreground at each density (the adaptive background colour
taken from the art's corner) and the portrait and landscape splashes at each
density, and the web shell's favicon in `public/`.
