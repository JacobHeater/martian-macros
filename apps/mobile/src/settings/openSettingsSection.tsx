import type { Navigator } from '../app/Navigator';
import { ProfileScreen } from './ProfileScreen';
import { SettingsScreen } from './SettingsScreen';
import type { SettingsSectionId } from './SettingsSectionId';

/**
 * Opens the screen that holds a section, with it open (MM-705): the profile
 * and nutrition goals are on Profile, every other section on Settings. The
 * one place that decides, so a way in about one row never has to know
 * which screen the row moved to.
 */
export function openSettingsSection(navigator: Navigator, section: SettingsSectionId): Promise<void | undefined> {
  if (section === 'profile' || section === 'nutritionGoals') return navigator.push(() => <ProfileScreen open={section} />);
  return navigator.push(() => <SettingsScreen open={section} />);
}
