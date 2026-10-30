import { Screen } from '../app/Screen';
import { NutritionGoalsSection } from './NutritionGoalsSection';
import { ProfileSection } from './ProfileSection';
import { SettingsOpenSectionContext } from './SettingsOpenSectionContext';
import './settings.css';

/**
 * Who the person is and what they are aiming for (MM-705): the profile
 * section and nutrition goals, out of Settings and into a screen of their
 * own, reached from the drawer (MM-704). Both sections open on arrival,
 * since the screen is theirs; each still folds in place.
 */
export function ProfileScreen() {
  return (
    <Screen title="Profile">
      <SettingsOpenSectionContext.Provider value="profile">
        <ProfileSection />
      </SettingsOpenSectionContext.Provider>
      <SettingsOpenSectionContext.Provider value="nutritionGoals">
        <NutritionGoalsSection />
      </SettingsOpenSectionContext.Provider>
    </Screen>
  );
}
