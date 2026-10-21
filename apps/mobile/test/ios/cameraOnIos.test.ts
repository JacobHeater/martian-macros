import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { BarcodeSymbology } from '../../src/domain/food/BarcodeSymbology';

/**
 * MM-406: the camera on iOS. CI builds no iOS app, so this reads the Swift
 * source: the retail barcodes only, each told with a symbology the app
 * reads; Cancel; a camera that cannot be used reported once the scan is on
 * screen; and a label read with Vision from a photo kept in memory.
 */
const plugin = readFileSync('ios/App/App/Plugins/MmScannerPlugin.swift', 'utf8');
const scan = readFileSync('ios/App/App/Plugins/ScanViewController.swift', 'utf8');
const plist = readFileSync('ios/App/App/Info.plist', 'utf8');

it('offers the scan and the label read', () => {
  for (const method of ['scan', 'readLabel']) {
    expect(plugin).toContain(`CAPPluginMethod(name: "${method}", returnType: CAPPluginReturnPromise)`);
    expect(plugin).toMatch(new RegExp(`@objc func ${method}\\(`));
  }
});

it('reads the retail barcodes only, and names each one as the app does', () => {
  expect(scan).toContain('let wanted: [AVMetadataObject.ObjectType] = [.ean13, .ean8, .upce]');
  const named = [...scan.matchAll(/case \.\w+: return "(\w+)"/g)].map((m) => m[1]);
  expect(named.length).toBeGreaterThan(0);
  for (const symbology of named) expect(BarcodeSymbology.values).toContain(symbology);
});

it('tells the app a scan was cancelled', () => {
  expect(scan).toContain('@objc private func cancelPressed() { finish(.cancelled) }');
  expect(plugin).toContain('call.resolve(["cancelled": true])');
});

it('says the camera cannot be used, and only once the scan is on screen', () => {
  expect(plugin).toContain('"The camera cannot be used."');
  const loaded = scan.slice(scan.indexOf('override func viewDidLoad'), scan.indexOf('override func viewDidAppear'));
  // A scan still being presented cannot be dismissed, so the app would never hear back.
  expect(loaded).not.toContain('finish(');
  expect(scan).toMatch(/override func viewDidAppear[\s\S]*if unusable \{ finish\(\.failed\("The camera cannot be used\."\)\) \}/);
});

it('reads a label with Vision on the device, and writes no photo', () => {
  expect(plugin).toContain('VNRecognizeTextRequest');
  expect(plugin).not.toMatch(/\.write\(to:|UIImageWriteToSavedPhotosAlbum|FileManager/);
  expect(plist).toContain('<key>NSCameraUsageDescription</key>');
});
