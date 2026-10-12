import { registerPlugin } from '@capacitor/core';
import type { MmDbApi } from './MmDbApi';

/**
 * The native SQLite plugin, which answers only inside the native shell.
 * Only `openAppServices` passes this to the adapters, and only there; tests
 * stand a fake in for it.
 */
export const mmDb = registerPlugin<MmDbApi>('MmDb');
