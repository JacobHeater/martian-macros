import { useContext } from 'react';
import { SettingsOpenSectionContext } from './SettingsOpenSectionContext';
import type { SettingsSectionId } from './SettingsSectionId';

/**
 * How a section of Settings folds (MM-398): every section opens and closes
 * in place and starts closed, unless the way into Settings asked for it.
 * Spread onto the section's `MmSection`.
 */
export function useSettingsSection(id: SettingsSectionId): { collapsible: true; initiallyExpanded: boolean; maintainState: true } {
  const open = useContext(SettingsOpenSectionContext);
  // A half-typed amount survives folding the section (the UX guard's N4).
  return { collapsible: true, initiallyExpanded: open === id, maintainState: true };
}
