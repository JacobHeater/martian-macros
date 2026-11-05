import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

/**
 * MM-726: the Android scanner's Cancel stands above the navigation bar in
 * density-independent units, with the bar's own height added as the window
 * reports it (the activity is drawn edge to edge), as iOS pins it to the
 * safe area; and a phone with no camera app to take a label's photo is
 * told so, as iOS tells it, instead of the app dying. Read from the source.
 */
const scan = readFileSync('android/app/src/main/java/com/martianmacros/ScanActivity.kt', 'utf8');
const scanner = readFileSync('android/app/src/main/java/com/martianmacros/MmScannerPlugin.kt', 'utf8');

it('Cancel keeps clear of the navigation bar, in dp plus the bar’s inset', () => {
  expect(scan).not.toMatch(/bottomMargin = \d+/);
  expect(scan).toContain('(32 * resources.displayMetrics.density).roundToInt()');
  expect(scan).toContain('ViewCompat.setOnApplyWindowInsetsListener(layout)');
  expect(scan).toContain('insets.getInsets(WindowInsetsCompat.Type.systemBars())');
  expect(scan).toContain('bottomMargin = margin + bars.bottom');
});

it('a label’s photo with no camera app to take it is refused in words, as on iOS', () => {
  const start = scanner.indexOf('private fun startPhoto(');
  const body = scanner.slice(start, scanner.indexOf('@ActivityCallback', start));
  expect(body).toContain('catch (error: ActivityNotFoundException)');
  expect(body).toContain('call.reject("The camera cannot be used.")');
  const swift = readFileSync('ios/App/App/Plugins/MmScannerPlugin.swift', 'utf8');
  expect(swift).toContain('"The camera cannot be used."');
});
