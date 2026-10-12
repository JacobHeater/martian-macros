import { registerPlugin } from '@capacitor/core';
import type { MmPacksApi } from './MmPacksApi';

/**
 * The native food-pack plugin, which answers only inside the native shell.
 * Only `openAppServices` passes this to the adapters; tests stand a fake in
 * for it.
 */
export const mmPacks = registerPlugin<MmPacksApi>('MmPacks');
