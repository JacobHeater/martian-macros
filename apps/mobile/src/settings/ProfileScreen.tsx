import { Screen } from '../app/Screen';
import { NutritionGoalsSection } from './NutritionGoalsSection';
import { ProfileSection } from './ProfileSection';
import { SettingsOpenSectionContext } from './SettingsOpenSectionContext';
import type { SettingsSectionId } from './SettingsSectionId';
import './settings.css';

interface ProfileScreenProps {
  /** The section a way in asked to find open (MM-398); none opens by itself (MM-712). */
  open?: SettingsSectionId | undefined;
}

/**
 * Who the person is and what they are aiming for (MM-705): the profile
 * section and nutrition goals, out of Settings and into a screen of their
 * own, reached from the drawer (MM-704). Both start closed, as every fold
 * does (the owner, MM-712), unless the way in asked for one.
 */
export function ProfileScreen({ open }: ProfileScreenProps = {}) {
  return (
    <Screen title="Profile">
      <SettingsOpenSectionContext.Provider value={open}>
        <ProfileSection />
        <NutritionGoalsSection />
      </SettingsOpenSectionContext.Provider>
    </Screen>
  );
}
