import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Denied } from '../../src/domain/integration/Denied';
import { Entitlement } from '../../src/domain/integration/Entitlement';
import { NotFound } from '../../src/domain/integration/NotFound';
import { Succeeded } from '../../src/domain/integration/Succeeded';
import { SystemClock } from '../../src/domain/integration/SystemClock';
import { Unavailable } from '../../src/domain/integration/Unavailable';
import { FixedClock } from '../../src/fixtures/FixedClock';
import { FixturePhotoCamera } from '../../src/fixtures/FixturePhotoCamera';
import { InMemoryBackupStorage } from '../../src/fixtures/InMemoryBackupStorage';
import { InMemoryDeviceLock } from '../../src/fixtures/InMemoryDeviceLock';
import { InMemoryPrivateScreen } from '../../src/fixtures/InMemoryPrivateScreen';
import { InMemoryEntitlement } from '../../src/fixtures/InMemoryEntitlement';
import { InMemoryExactAlarms } from '../../src/fixtures/InMemoryExactAlarms';
import { InMemoryFoodCatalog } from '../../src/fixtures/InMemoryFoodCatalog';
import { backupStorageContract } from '../contracts/backupStorageContract';
import { clockContract } from '../contracts/clockContract';
import { deviceLockContract } from '../contracts/deviceLockContract';
import { photoCameraContract } from '../contracts/photoCameraContract';
import { privateScreenContract } from '../contracts/privateScreenContract';
import { entitlementReaderContract } from '../contracts/entitlementReaderContract';
import { exactAlarmsContract } from '../contracts/exactAlarmsContract';
import { foodBarcodeLookupContract } from '../contracts/foodBarcodeLookupContract';
import { foodSearchContract } from '../contracts/foodSearchContract';
import { first } from '../support/first';

/**
 * The integration-seam fixtures: they satisfy the same contracts a real
 * provider will, and can be scripted to fail so offline and denied paths
 * are tested without a device.
 */
foodSearchContract('In-memory', (items) => new InMemoryFoodCatalog(items));
foodBarcodeLookupContract('In-memory', (items) => new InMemoryFoodCatalog(items));
backupStorageContract('In-memory', () => new InMemoryBackupStorage());
entitlementReaderContract('In-memory', () => new InMemoryEntitlement());
exactAlarmsContract('In-memory, allowed', () => new InMemoryExactAlarms());
exactAlarmsContract('In-memory, not asked', () => new InMemoryExactAlarms({ held: false }));
exactAlarmsContract('In-memory, declined in the setting', () => new InMemoryExactAlarms({ held: false, allowInSetting: false }));
exactAlarmsContract('In-memory, declined before', () => new InMemoryExactAlarms({ held: false, asked: true }));
clockContract('System', () => new SystemClock());
clockContract('Fixed', () => new FixedClock(CalendarDate.of(2026, 10, 8)));
// MM-157: the photos' lock, private screen and camera.
for (const answer of ['unlocked', 'refused', 'noLock'] as const) {
  deviceLockContract(`In-memory, ${answer}`, () => new InMemoryDeviceLock(answer), answer);
}
privateScreenContract('In-memory', () => {
  const screen = new InMemoryPrivateScreen();
  return { screen, hidden: async () => screen.hidden };
});
photoCameraContract('Fixture, allowed', () => new FixturePhotoCamera(), { available: true, captures: true });
photoCameraContract('Fixture, not allowed', () => new FixturePhotoCamera({ available: false }), { available: false, captures: false });

describe('scripted failures', () => {
  it('a catalog that is offline answers Unavailable to every call', async () => {
    const catalog = new InMemoryFoodCatalog([]);
    catalog.failWith(new Unavailable('offline'));
    expect(await catalog.search('oats')).toBeInstanceOf(Unavailable);
    expect(await catalog.lookup('1')).toBeInstanceOf(Unavailable);
    catalog.recover();
    expect(await catalog.search('oats')).toBeInstanceOf(Succeeded);
  });

  it('a denied backup answers Denied with the message', async () => {
    const storage = new InMemoryBackupStorage();
    storage.failWith(new Denied('signed out'));
    const result = await storage.put('a', new Uint8Array(1));
    expect(result).toBeInstanceOf(Denied);
    expect((result as Denied).message).toBe('signed out');
  });

  // In Dart this was a failure when the test ran. Here the compiler refuses
  // it, and the typecheck fails if it ever stops refusing.
  it('failWith rejects a non-failure', async () => {
    const storage = new InMemoryBackupStorage();
    // @ts-expect-error A NotFound is not a failure to script.
    storage.failWith(new NotFound());
    storage.recover();
    expect(await storage.list()).toBeInstanceOf(Succeeded);
  });
});

describe('FixedClock', () => {
  it('can be moved to another day', () => {
    const clock = new FixedClock(CalendarDate.of(2026, 10, 8));
    clock.advanceTo(CalendarDate.of(2026, 10, 9));
    expect(clock.today().epochDay).toBe(CalendarDate.of(2026, 10, 9).epochDay);
  });

  // Added in the move: the two things the class does that had no test of their own.
  it('reports the hour it was given, and time elapsed within the day', () => {
    const clock = new FixedClock(CalendarDate.of(2026, 10, 8), { hour: 7 });
    expect(clock.now().getHours()).toBe(7);
    clock.elapseMs(90 * 60 * 1000);
    expect([clock.now().getHours(), clock.now().getMinutes()]).toEqual([8, 30]);
    expect(new FixedClock(CalendarDate.of(2026, 10, 8)).now().getHours()).toBe(12);
  });
});

describe('InMemoryEntitlement', () => {
  it('starts free and follows changes', async () => {
    const entitlement = new InMemoryEntitlement();
    expect((await first(entitlement.watchEntitlement())).status).toBe('free');
    entitlement.set(new Entitlement('unlocked'));
    expect((await first(entitlement.watchEntitlement())).coachAvailable).toBe(true);
  });
});
