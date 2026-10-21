import { CalendarDate } from '../domain/CalendarDate';
import { Profile } from '../domain/Profile';
import { ScreeningAnswers } from '../domain/ScreeningAnswers';
import type { UserSetup } from '../domain/UserSetup';
import { Fmt } from '../format/Fmt';
import { healthPlatformName } from '../format/healthPlatformName';
import { heightLabel } from '../format/heightLabel';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { useOverlays } from '../ui/useOverlays';
import { EditHeightSheet } from './EditHeightSheet';
import { useSettingsSection } from './useSettingsSection';
import { HealthCheckScreen } from './HealthCheckScreen';

const tickedCount = (s: ScreeningAnswers) =>
  [
    s.pregnant,
    s.breastfeeding,
    s.eatingDisorderHistory,
    s.chronicKidneyDisease,
    s.androgenUse,
    s.pcos,
    s.menopause,
    s.thyroidCondition,
    s.insulinOrSulfonylurea,
    s.bariatricSurgery,
    s.weightAffectingMedication,
    s.weightLossMedication,
    s.fluidLimitedByClinician,
    s.sleepDisorder,
  ].filter((ticked) => ticked).length;

/**
 * The You section of Settings (MM-259): sex, date of birth, height and the
 * health check, each correctable (MM-83). Every change issues new targets at once.
 *
 * A height read from the health platform that shows differently from the
 * profile's is offered under the height row and in its sheet, and saved
 * only when the person chooses it there (MM-68).
 */
export function ProfileSection() {
  // Folds in place, closed until opened (MM-398).
  const fold = useSettingsSection('profile');
  const { services, state } = useApp();
  const navigator = useNavigator();
  const overlays = useOverlays();
  const setup = useLoaded(state.setup);
  const today = useCell(state.today);
  const platformHeight = useLoaded(state.importedHeight);
  if (setup === undefined) return null;
  const profile = setup.profile;
  const imperial = new Fmt(setup.unitSystem).imperial;
  const height = heightLabel(profile.heightCm, imperial);
  const platform = healthPlatformName(services.platform);
  const suggestedCm = platformHeight?.value;
  const suggestion =
    suggestedCm !== undefined &&
    suggestedCm >= Profile.minHeightCm &&
    suggestedCm <= Profile.maxHeightCm &&
    heightLabel(suggestedCm, imperial) !== height
      ? { cm: suggestedCm, label: heightLabel(suggestedCm, imperial), from: platform }
      : undefined;
  const ticked = tickedCount(setup.screening);

  /**
   * Saves a corrected profile or health check and marks it, so the engine
   * issues new targets now, not at the next weekly check-in.
   */
  const save = (from: UserSetup, changes: { profile?: Profile; screening?: ScreeningAnswers }) =>
    services.setup.saveSetup(
      from.copyWith({
        ...changes,
        profileRevision: from.profileRevision + 1,
        healthCheckConfirmedOn: state.today.peek(),
        healthCheckSkipCount: 0,
      }),
    );

  const changeSex = async () => {
    const toMale = profile.sex === 'female';
    const confirmed = await overlays.confirm({
      title: 'Change biological sex?',
      message:
        'Your energy needs, body-fat estimate and safety limits are ' +
        `recalculated for a ${toMale ? 'male' : 'female'} profile, and new ` +
        'targets start now. Your food log and weigh-ins are kept.' +
        `${toMale ? ' Female-only health answers are cleared.' : ''}`,
      confirmLabel: 'Change',
    });
    if (!confirmed) return;
    const s = setup.screening;
    await save(setup, {
      profile: new Profile({ sex: toMale ? 'male' : 'female', birthDate: profile.birthDate, heightCm: profile.heightCm }),
      ...(toMale
        ? {
            screening: new ScreeningAnswers({
              eatingDisorderHistory: s.eatingDisorderHistory,
              chronicKidneyDisease: s.chronicKidneyDisease,
              androgenUse: s.androgenUse,
              thyroidCondition: s.thyroidCondition,
              insulinOrSulfonylurea: s.insulinOrSulfonylurea,
              insulinCareTeamConfirmed: s.insulinCareTeamConfirmed,
              bariatricSurgery: s.bariatricSurgery,
              weightAffectingMedication: s.weightAffectingMedication,
              weightLossMedication: s.weightLossMedication,
              fluidLimitedByClinician: s.fluidLimitedByClinician,
              sleepDisorder: s.sleepDisorder,
            }),
          }
        : {}),
    });
  };

  const changeBirthDate = async () => {
    const picked = await overlays.date({
      helpText: 'Date of birth',
      initial: profile.birthDate,
      first: CalendarDate.of(today.year - 100, 1, 1),
      last: today,
      today,
    });
    if (picked === undefined) return;
    await save(setup, { profile: new Profile({ sex: profile.sex, birthDate: picked, heightCm: profile.heightCm }) });
  };

  const changeHeight = () =>
    overlays.sheet<void>('Height', (close) => (
      <EditHeightSheet
        initialCm={profile.heightCm}
        imperial={imperial}
        suggestion={suggestion}
        onSave={(heightCm) => {
          close();
          void save(setup, { profile: new Profile({ sex: profile.sex, birthDate: profile.birthDate, heightCm }) });
        }}
        onCancel={() => close()}
      />
    ));

  return (
    <MmSection icon="person" title="You" {...fold}>
      <MmListGroup>
        <MmListRow
          leadingIcon="person"
          title="Biological sex"
          trailing={<span>{profile.sex === 'male' ? 'Male' : 'Female'}</span>}
          onPress={() => void changeSex()}
        />
        <MmListRow
          leadingIcon="calendar"
          title="Date of birth"
          subtitle={`Age ${profile.ageOn(today)}`}
          trailing={<span>{Fmt.longDate(profile.birthDate)}</span>}
          onPress={() => void changeBirthDate()}
        />
        <MmListRow
          leadingIcon="ruler"
          title="Height"
          subtitle={suggestion === undefined ? undefined : `${suggestion.from} says ${suggestion.label}`}
          trailing={<span>{height}</span>}
          onPress={() => void changeHeight()}
        />
        <MmListRow
          leadingIcon="health"
          title="Health check"
          subtitle={ticked === 0 ? 'Nothing ticked' : `${ticked} ${ticked === 1 ? 'answer' : 'answers'} ticked`}
          onPress={() => void navigator.push(() => <HealthCheckScreen />)}
        />
      </MmListGroup>
    </MmSection>
  );
}
