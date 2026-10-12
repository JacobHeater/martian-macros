# Martian Macros: the React app

The app being built to replace the Flutter one in `apps/mobile/` (MM-228).
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

## The Android shell

`android/` is a Capacitor project that shows the built app in a web view.
Until the switch it has the demo identity only
(`com.martianmacros.martian_macros.demo`), so it cannot share the normal
app's storage. Cloud backup is off.

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

## Layout

| Path | Holds |
| --- | --- |
| `src/theme/` | The design tokens as CSS variables, and the theme choice |
| `src/ui/` | The design-system components, one per file. Screens use these and no raw form control |
| `src/app/` | The shell: the five destinations and what is shown in each |
| `src/lang/` | The few things Dart had and JavaScript lacks or does differently: rounding, reading a number, its errors, a watched value |
| `src/domain/` | The domain model, carried over from `packages/domain`. Imports only `src/lang/` |
| `src/platform/` | What the phone provides, each behind an interface of ours with the Capacitor adapter beside it |
| `src/gallery/` | Every token and component as built; open the app with `?gallery` |
| `test/` | Tests that are about the whole app or the build |

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
| Named parameters | One object parameter, destructured, with the same defaults |
| `null` | `undefined`, everywhere. A nullable field is `name?: T \| undefined` |
| `CalendarDate(2026, 3, 8)` | `CalendarDate.of(2026, 3, 8)`. There is one object per day, so `===`, `Map` keys and `Set` members behave as Dart's value equality did |
| `==` overridden on a class | An `equals(other)` method, or a `sameX(a, b)` function for an interface. `===` on two objects is never value equality |
| `x.round()` | `roundHalfAwayFromZero(x)`. Never `Math.round`, which sends -2.5 to -2 |
| `x ~/ y`, `x.toInt()` | `Math.trunc(x / y)`, `Math.trunc(x)` |
| `x % y` with a possibly negative `x` | Dart's result is never negative; JavaScript's can be. Write `((x % y) + y) % y` |
| `double.tryParse(text)` | `tryParseDouble(text)`. Never `Number(text)` or `parseFloat(text)` |
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
