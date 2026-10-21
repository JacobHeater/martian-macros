import { HowThisWorksScreen } from '../about/HowThisWorksScreen';
import { useInsightKinds } from '../coach/useInsightKinds';
import { FoodDatabaseScreen } from '../foodPacks/FoodDatabaseScreen';
import { FoodSourcesScreen } from '../foodPacks/FoodSourcesScreen';
import { OnlineLookupChoice } from '../domain/food/online/OnlineLookupChoice';
import { onlineLookupChoiceLabel } from '../format/onlineLookupChoiceLabel';
import { onlineSourceNames } from '../format/onlineSourceNames';
import { useCell } from '../app/useCell';
import { Loadable } from '../state/Loadable';
import { DailyActivity } from '../domain/DailyActivity';
import { DetailLevel } from '../domain/food/detail/DetailLevel';
import { useNetCarbs } from '../food/useNetCarbs';
import { TrainingStatus } from '../domain/TrainingStatus';
import type { UnitSystem } from '../domain/UnitSystem';
import { dailyActivityLabel } from '../format/dailyActivityLabel';
import { detailLevelDescription } from '../format/detailLevelDescription';
import { detailLevelLabel } from '../format/detailLevelLabel';
import { Fmt } from '../format/Fmt';
import { trainingStatusLabel } from '../format/trainingStatusLabel';
import { clamp } from '../lang/clamp';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { PauseScreen } from '../pause/PauseScreen';
import { PrivacyPolicyScreen } from '../terms/PrivacyPolicyScreen';
import { privacyPolicy } from '../terms/privacyPolicy';
import { TermsScreen } from '../terms/TermsScreen';
import { termsOfUse } from '../terms/termsOfUse';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { MmIconButton } from '../ui/MmIconButton';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { MmSlider } from '../ui/MmSlider';
import { MmSliderRow } from '../ui/MmSliderRow';
import { MmSwitchRow } from '../ui/MmSwitchRow';
import { useOverlays } from '../ui/useOverlays';
import { CoachSettingsSection } from './CoachSettingsSection';
import { HealthPlatformSection } from './HealthPlatformSection';
import { NutritionGoalsSection } from './NutritionGoalsSection';
import { ProfileSection } from './ProfileSection';
import { BackupSection } from './BackupSection';
import { RemindersSection } from './RemindersSection';
import { ThemeSettings } from './ThemeSettings';
import { SettingsOpenSectionContext } from './SettingsOpenSectionContext';
import type { SettingsSectionId } from './SettingsSectionId';
import './settings.css';

const whole = (value: number) => roundHalfAwayFromZero(value) + 0;

const unitLabels: Readonly<Record<UnitSystem, string>> = { imperial: 'lb / in', metric: 'kg / cm' };

/**
 * Everything the user set up and can change (MM-259): sections of rows in
 * the order of use, every row with its icon, the choosers one tap away,
 * and the one destructive action last in a section of its own. Each
 * section opens and closes in place and starts closed (MM-398), unless a
 * way into Settings about one row asks for its section with `open`.
 */
export function SettingsScreen({ open }: { open?: SettingsSectionId } = {}) {
  const { services, state } = useApp();
  const navigator = useNavigator();
  const overlays = useOverlays();
  const setup = useLoaded(state.setup);
  const detail = useLoaded(state.detailLevel) ?? 'standard';
  const easyToMiss = useLoaded(state.easyToMiss)?.enabled ?? true;
  const netCarbs = useNetCarbs();
  const termsAccepted = useLoaded(state.termsAcceptance);
  // Settings > Coach (MM-364), once there is a kind of inline insight to switch.
  const coachSettings = useInsightKinds().length > 0;
  if (setup === undefined) return <Screen title="Settings">{null}</Screen>;
  // This screen's own sections fold as the section components' do (useSettingsSection).
  const fold = (id: SettingsSectionId) => ({ collapsible: true, initiallyExpanded: open === id, maintainState: true });
  const bodyFat = setup.bodyFatPercent;

  const erase = async () => {
    const confirmed = await overlays.confirm({
      title: 'Erase everything?',
      message:
        'This permanently deletes your profile, food log, weigh-ins, and targets from this device. It cannot be ' +
        'undone.',
      confirmLabel: 'Erase',
    });
    if (!confirmed) return;
    navigator.closeAll();
    await services.eraser.eraseAll();
  };

  const chooseActivity = () =>
    void overlays
      .options<DailyActivity>({
        title: 'Daily activity',
        options: DailyActivity.values.map((value) => ({ value, label: dailyActivityLabel(value) })),
        selected: setup.dailyActivity,
      })
      .then((chosen) => {
        if (chosen !== undefined) void services.setup.saveSetup(setup.copyWith({ dailyActivity: chosen.value }));
      });

  const chooseExperience = () =>
    void overlays
      .options<TrainingStatus>({
        title: 'Experience',
        options: TrainingStatus.values.map((value) => ({ value, label: trainingStatusLabel(value) })),
        selected: setup.trainingStatus,
      })
      .then((chosen) => {
        if (chosen !== undefined) void services.setup.saveSetup(setup.copyWith({ trainingStatus: chosen.value }));
      });

  const chooseDetail = () =>
    void overlays
      .options<DetailLevel>({
        title: 'Nutrition detail',
        options: DetailLevel.values.map((value) => ({ value, label: detailLevelLabel(value) })),
        selected: detail,
      })
      .then((chosen) => {
        if (chosen !== undefined) void services.preferences.saveDetailLevel(chosen.value);
      });

  // Whether unknown foods may be looked up online (MM-58): the same choice the scan step asks, kept here.
  const onlineChoice = Loadable.valueOf(useCell(state.onlineLookup.choice)) ?? 'ask';
  const onlineSources = state.onlineLookup.sourceIds;
  const chooseOnlineLookup = () =>
    void overlays
      .options<OnlineLookupChoice>({
        title: 'Look foods up online',
        options: OnlineLookupChoice.values.map((value) => ({ value, label: onlineLookupChoiceLabel(value) })),
        selected: onlineChoice,
      })
      .then((chosen) => {
        if (chosen !== undefined) void state.onlineLookup.choose(chosen.value);
      });

  const chooseUnits = () =>
    void overlays
      .options<UnitSystem>({
        title: 'Units',
        options: (['imperial', 'metric'] as const).map((value) => ({ value, label: unitLabels[value] })),
        selected: setup.unitSystem,
      })
      .then((chosen) => {
        if (chosen !== undefined) void services.setup.saveSetup(setup.copyWith({ unitSystem: chosen.value }));
      });

  return (
    <Screen title="Settings">
      <SettingsOpenSectionContext.Provider value={open}>
        <MmSection icon="calendarCheck" title="Today’s setup" {...fold('todaysSetup')}>
          <MmListGroup>
            <MmListRow
              leadingIcon="walk"
              title="Daily activity"
              subtitle={dailyActivityLabel(setup.dailyActivity)}
              trailingAction={<MmIconButton icon="edit" label="Change daily activity" opens="listbox" onPress={chooseActivity} />}
            />
            <MmListRow
              leadingIcon="school"
              title="Experience"
              subtitle={trainingStatusLabel(setup.trainingStatus)}
              trailingAction={<MmIconButton icon="edit" label="Change experience" opens="listbox" onPress={chooseExperience} />}
            />
            <MmListRow
              leadingIcon="calendar"
              title={`Training days per week: ${setup.trainingDaysPerWeek}`}
              detail={
                <MmSlider
                  name="Training days per week"
                  value={setup.trainingDaysPerWeek}
                  max={7}
                  divisions={7}
                  label={`${setup.trainingDaysPerWeek} days`}
                  onChange={(days) =>
                    void services.setup.saveSetup(setup.copyWith({ trainingDaysPerWeek: roundHalfAwayFromZero(days) }))
                  }
                />
              }
            />
            <MmSwitchRow
              leadingIcon="percent"
              title="Body fat estimate"
              subtitle={bodyFat === undefined ? 'Estimated by the app. Turn on to enter a recent measurement.' : `About ${whole(bodyFat)}%, your measurement.`}
              value={bodyFat !== undefined}
              onChange={(on) => void services.setup.saveSetup(setup.copyWith({ bodyFatPercent: on ? 25 : undefined }))}
            />
            {bodyFat === undefined ? null : (
              <MmSliderRow
                name="Body fat percent"
                value={clamp(bodyFat, 5, 55)}
                min={5}
                max={55}
                divisions={50}
                label={`${whole(bodyFat)}%`}
                onChange={(percent) =>
                  void services.setup.saveSetup(setup.copyWith({ bodyFatPercent: roundHalfAwayFromZero(percent) + 0 }))
                }
              />
            )}
            <MmListRow
              leadingIcon="tune"
              title="Nutrition detail"
              subtitle={`${detailLevelLabel(detail)}: ${detailLevelDescription(detail)} Changes what is shown, never what is stored.`}
              trailingAction={<MmIconButton icon="edit" label="Change nutrition detail" opens="listbox" onPress={chooseDetail} />}
            />
            <MmSwitchRow
              leadingIcon="food"
              title="Net carbs"
              subtitle={
                (netCarbs
                  ? 'Carbs less fiber and sugar alcohols, against the same carb target. Changes what is shown, never what is stored.'
                  : 'Total carbs, as on the label.') +
                (DetailLevel.showsCarbsAndFat(detail) ? '' : ' Shown at Standard or Full nutrition detail.')
              }
              value={netCarbs}
              onChange={(on) => void services.preferences.saveNetCarbs(on)}
            />
            <MmSwitchRow
              leadingIcon="insight"
              title="Easy-to-miss reminder"
              subtitle="A line under a completed day that names things people often forget to log."
              value={easyToMiss}
              onChange={(on) => void services.preferences.saveEasyToMissEnabled(on)}
            />
            <MmListRow
              leadingIcon="pause"
              title="Pause"
              subtitle="For a holiday, an illness or an injury."
              opens
              onPress={() => void navigator.push(() => <PauseScreen />)}
            />
          </MmListGroup>
        </MmSection>
        {coachSettings ? <CoachSettingsSection /> : null}
        <NutritionGoalsSection />
        <ProfileSection />
        <RemindersSection />
        <HealthPlatformSection />
        <MmSection icon="lock" title="Data" {...fold('data')}>
          <MmListGroup>
            <MmListRow
              leadingIcon="download"
              title="Food database"
              subtitle="Optional download for food search and barcode scanning, fetched only when you ask."
              opens
              onPress={() => void navigator.push(() => <FoodDatabaseScreen />)}
            />
            {onlineSources.length === 0 ? null : (
              <MmListRow
                leadingIcon="search"
                title="Look foods up online"
                subtitle={`${onlineLookupChoiceLabel(onlineChoice)}. When a food is not on this phone, only the barcode or your search words go to ${onlineSourceNames(onlineSources)}.`}
                trailingAction={<MmIconButton icon="edit" label="Change online lookup" opens="listbox" onPress={chooseOnlineLookup} />}
              />
            )}
            <MmListRow
              leadingIcon="document"
              title="Food data sources"
              subtitle="Where the foods come from and their licences."
              opens
              onPress={() => void navigator.push(() => <FoodSourcesScreen />)}
            />
            <MmListRow
              leadingIcon="lock"
              title="Your records stay on this device"
              subtitle={
                onlineSources.length === 0
                  ? 'Nothing about you is uploaded.'
                  : 'Nothing about you is uploaded. Only a barcode or search words ever go online, and only if you allow it.'
              }
            />
          </MmListGroup>
        </MmSection>
        <BackupSection />
        <MmSection icon="palette" title="Appearance" {...fold('appearance')}>
          <MmListGroup>
            <ThemeSettings />
            <MmListRow
              leadingIcon="ruler"
              title="Units"
              subtitle={unitLabels[setup.unitSystem]}
              trailingAction={<MmIconButton icon="edit" label="Change units" opens="listbox" onPress={chooseUnits} />}
            />
          </MmListGroup>
        </MmSection>
        <MmSection icon="info" title="About" {...fold('about')}>
          <MmListGroup>
            <MmListRow
              leadingIcon="info"
              title="How this works"
              subtitle="Where each number comes from, and how sure we are."
              opens
              onPress={() => void navigator.push(() => <HowThisWorksScreen />)}
            />
            <MmListRow
              leadingIcon="shield"
              title="Not medical advice"
              subtitle="A general wellness app, not a medical device. It does not diagnose or treat anything."
            />
            <MmListRow
              leadingIcon="document"
              title="Terms of use"
              subtitle={
                `Version ${termsOfUse.version}` +
                (termsAccepted === undefined ? '' : `, agreed ${Fmt.longDate(termsAccepted.acceptedOn)}`)
              }
              opens
              onPress={() => void navigator.push(() => <TermsScreen />)}
            />
            <MmListRow
              leadingIcon="lock"
              title="Privacy policy"
              subtitle={`Version ${privacyPolicy.version}: what the app keeps, and what it sends`}
              opens
              onPress={() => void navigator.push(() => <PrivacyPolicyScreen />)}
            />
          </MmListGroup>
        </MmSection>
        <MmSection icon="delete" title="Erase" {...fold('erase')}>
          <MmListGroup>
            <MmListRow
              leadingIcon="delete"
              danger
              title="Erase all data and start over"
              onPress={() => void erase()}
            />
          </MmListGroup>
        </MmSection>
      </SettingsOpenSectionContext.Provider>
      <p className="app-caption settings-about">Martian Macros · {services.environment}</p>
    </Screen>
  );
}
