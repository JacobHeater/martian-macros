import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

/**
 * MM-599: a meal's photos are picked and shared by both shells, and from iOS
 * never saved to the phone's Photos. CI builds no iOS, so this reads the
 * sources: the twins name the same methods, and the share sheet leaves out
 * "Save Image", which would also need a permission the app does not ask for.
 */
const swift = readFileSync('ios/App/App/Plugins/MmBackupPlugin.swift', 'utf8');
const kotlin = readFileSync('android/app/src/main/java/com/martianmacros/MmBackupPlugin.kt', 'utf8');

it('both shells pick and share a meal’s photos, and clear what they wrote', () => {
  for (const method of ['pickPhotos', 'shareMeal', 'clearMealShare']) {
    expect(swift, `iOS registers ${method}`).toContain(`CAPPluginMethod(name: "${method}"`);
    expect(swift, `iOS has ${method}`).toContain(`@objc func ${method}(`);
    expect(kotlin, `Android has ${method}`).toMatch(new RegExp(`@PluginMethod\\s+fun ${method}\\(`));
  }
});

it('iOS never offers to save a meal’s photos to Photos, and picks them with PHPicker, which needs no permission', () => {
  const share = swift.slice(swift.indexOf('@objc func shareMeal('), swift.indexOf('@objc func clearMealShare('));
  expect(share).toContain('excludedActivityTypes = [.saveToCameraRoll');
  expect(swift).toContain('PHPickerViewController(configuration:');
  const plist = readFileSync('ios/App/App/Info.plist', 'utf8');
  expect(plist, 'no library permission is asked').not.toContain('NSPhotoLibraryUsageDescription');
});
