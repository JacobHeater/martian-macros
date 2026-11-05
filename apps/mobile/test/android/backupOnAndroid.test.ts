import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

/**
 * MM-730: a backup chosen on Android is read off the main thread, so a
 * large one never holds the screen; and a meal's photo on Android 8, whose
 * decoder leaves a photo as the sensor saw it, is turned upright by its own
 * orientation tag, as every later Android and iOS hand it. Read from the
 * source: CI compiles the Kotlin and runs none of it.
 */
const kotlin = readFileSync('android/app/src/main/java/com/martianmacros/MmBackupPlugin.kt', 'utf8');

it('a chosen backup is read on the plugin’s own thread', () => {
  const start = kotlin.indexOf('fun picked(call: PluginCall?, result: ActivityResult)');
  const body = kotlin.slice(start, kotlin.indexOf('@PluginMethod', start));
  expect(body.indexOf('executor.execute {')).toBeGreaterThan(-1);
  expect(body.indexOf('executor.execute {')).toBeLessThan(body.indexOf('openInputStream(uri)'));
});

it('a photo decoded without its orientation is turned upright by it', () => {
  expect(kotlin).toContain('private fun upright(bitmap: Bitmap, uri: Uri): Bitmap');
  expect(kotlin).toContain('ExifInterface(it).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)');
  const legacy = kotlin.slice(kotlin.indexOf('val bounds = BitmapFactory.Options()'), kotlin.indexOf('private fun upright('));
  expect(legacy.match(/return upright\(/g)?.length).toBe(2);
  expect(legacy).not.toMatch(/return decoded\b/);
  expect(legacy).not.toMatch(/return scaled\b/);
});
