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

## Layout

| Path | Holds |
| --- | --- |
| `src/theme/` | The design tokens as CSS variables, and the theme choice |
| `src/ui/` | The design-system components, one per file. Screens use these and no raw form control |
| `src/app/` | The shell: the five destinations and what is shown in each |
| `src/gallery/` | Every token and component as built; open the app with `?gallery` |
| `test/` | Tests that are about the whole app or the build |

The tokens are copied from the Flutter theme, and a test compares the two
until the Flutter app is removed.
