import type { MmHealthNutrition } from './MmHealthNutrition';

/**
 * The health plugin's writing (MM-70, MM-314, MM-489). Each kind ("food",
 * "water", "workouts") is turned on by itself, which asks the platform for
 * that kind's write permission alone; the plugin keeps in its own
 * preferences which are on. It writes a kind only while that kind is on
 * and permitted, and only ever changes or removes the app's own records,
 * found by the app's id for them.
 */
export interface MmHealthWritingApi {
  /** Of `kinds`, those on and permitted now. */
  writing(options: { kinds: string[] }): Promise<{ kinds: string[] }>;

  /** Asks for `kind`'s write permission, and turns it on if granted. */
  startWriting(options: { kind: string }): Promise<{ on: boolean }>;

  /** Turns `kind` off. Nothing on the platform is changed. */
  stopWriting(options: { kind: string }): Promise<{ on: boolean }>;

  /** The namespace every id the app writes carries (MM-522), made once and kept in the plugin's preferences. */
  writeNamespace(): Promise<{ namespace: string }>;

  /** Replaces the namespace with a new random one, kept before it answers. */
  renewWriteNamespace(): Promise<{ namespace: string }>;

  writeNutrition(options: MmHealthNutrition): Promise<{ written: boolean }>;
  removeNutrition(options: { id: string }): Promise<{ removed: boolean }>;
  writeWater(options: { id: string; atMs: number; ml: number }): Promise<{ written: boolean }>;
  removeWater(options: { id: string }): Promise<{ removed: boolean }>;
}
