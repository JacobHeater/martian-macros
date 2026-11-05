import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

/**
 * MM-729: the move's plugin on Android never hands out a VPN's address (its
 * network carries the Wi-Fi it rides on among its transports, and nothing on
 * the Wi-Fi can reach it), and nothing thrown on its threads ends the app:
 * every block answers the call instead. The pack download reads where it
 * carries on from as a long, as iOS does. Read from the source.
 */
const transfer = readFileSync('android/app/src/main/java/com/martianmacros/MmTransferPlugin.kt', 'utf8');
const packs = readFileSync('android/app/src/main/java/com/martianmacros/MmPacksPlugin.kt', 'utf8');

it('a VPN’s network is passed over for the Wi-Fi’s own', () => {
  const start = transfer.indexOf('private fun wifiAddress()');
  const body = transfer.slice(start);
  expect(body.indexOf('hasTransport(NetworkCapabilities.TRANSPORT_VPN)) continue')).toBeGreaterThan(-1);
  expect(body.indexOf('hasTransport(NetworkCapabilities.TRANSPORT_VPN)) continue')).toBeLessThan(body.indexOf('TRANSPORT_WIFI'));
});

it('every block on the plugin’s threads answers the call, whatever is thrown', () => {
  expect(transfer).not.toContain('catch (error: IOException)');
  expect(transfer.match(/catch \(error: Throwable\)/g)?.length).toBe(5);
  const listen = transfer.slice(transfer.indexOf('fun listen('), transfer.indexOf('fun accept('));
  expect(listen.indexOf('try {')).toBeLessThan(listen.indexOf('wifiAddress()'));
  const connect = transfer.slice(transfer.indexOf('fun connect('), transfer.indexOf('fun send('));
  expect(connect).toContain('runCatching { socket.close() }');
});

it('where a download carries on from is read as a long', () => {
  expect(packs).not.toContain('call.getInt("rangeStart")');
  expect(packs).toContain('private fun rangeStartOf(call: PluginCall): Long?');
  expect(packs).toContain('call.data.optLong("rangeStart")');
  expect(packs.match(/val rangeStart = rangeStartOf\(call\)/g)?.length).toBe(2);
});
