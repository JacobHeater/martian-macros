import { DemoSeed } from '../fixtures/DemoSeed';
import type { AppServices } from '../state/AppServices';

/**
 * Replaces everything in the stores with the demo scenario, when this build
 * was asked to (`mm demo --seed`) and is running inside the shell (MM-177).
 * It runs before any screen subscribes, and on every launch of such a
 * build, so the data is the same each time and never accumulates. Any
 * other build, and a browser, is never seeded. Returns whether it seeded.
 */
export async function seedDemo({
  services,
  asked,
  native,
}: {
  services: AppServices;
  asked: boolean;
  native: boolean;
}): Promise<boolean> {
  if (!asked || !native) return false;
  await new DemoSeed(services.clock.today()).replace(services);
  return true;
}
