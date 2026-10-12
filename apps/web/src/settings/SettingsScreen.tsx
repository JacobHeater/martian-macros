import { HowThisWorksScreen } from '../about/HowThisWorksScreen';
import { DailyActivity } from '../domain/DailyActivity';
import { DetailLevel } from '../domain/food/detail/DetailLevel';
import { TrainingStatus } from '../domain/TrainingStatus';
import type { UnitSystem } from '../domain/UnitSystem';
import { dailyActivityLabel } from '../format/dailyActivityLabel';
import { detailLevelDescription } from '../format/detailLevelDescription';
import { detailLevelLabel } from '../format/detailLevelLabel';
import { trainingStatusLabel } from '../format/trainingStatusLabel';
import { Gallery } from '../gallery/Gallery';
import { clamp } from '../lang/clamp';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { PauseScreen } from '../pause/PauseScreen';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { GroupHeader } from '../ui/GroupHeader';
import { MmIcon } from '../ui/MmIcon';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmMenuButton } from '../ui/MmMenuButton';
import { MmSegmented } from '../ui/MmSegmented';
import { MmSlider } from '../ui/MmSlider';
import { MmSwitchRow } from '../ui/MmSwitchRow';
import { useOverlays } from '../ui/useOverlays';
import { HealthConnectSection } from './HealthConnectSection';
import { ProfileSection } from './ProfileSection';
import { RemindersSection } from './RemindersSection';
import { ThemeSettings } from './ThemeSettings';
import './settings.css';

const whole = (value: number) => roundHalfAwayFromZero(value) + 0;

/** Everything the user set up and can change: how the app looks, their profile, what it reminds them of, their data. */
export function SettingsScreen() {
  const { services, state } = useApp();
  const navigator = useNavigator();
  const overlays = useOverlays();
  const setup = useLoaded(state.setup);
  const detail = useLoaded(state.detailLevel) ?? 'standard';
  const easyToMiss = useLoaded(state.easyToMiss)?.enabled ?? true;
  if (setup === undefined) return <Screen title="Settings">{null}</Screen>;
  const chevron = <MmIcon name="chevronRight" />;
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

  return (
    <Screen title="Settings">
      <GroupHeader text="Appearance" />
      <ThemeSettings />
      <GroupHeader text="Units" />
      <MmSegmented<UnitSystem>
        name="Units"
        segments={[
          { value: 'imperial', label: 'lb / in' },
          { value: 'metric', label: 'kg / cm' },
        ]}
        selected={setup.unitSystem}
        onChange={(units) => {
          if (units !== undefined) void services.setup.saveSetup(setup.copyWith({ unitSystem: units }));
        }}
      />
      <GroupHeader text="Activity and training" />
      <MmListGroup>
        <MmListRow
          title="Daily activity"
          subtitle={dailyActivityLabel(setup.dailyActivity)}
          trailingAction={
            <MmMenuButton<DailyActivity>
              icon="edit"
              label="Change daily activity"
              items={DailyActivity.values.map((value) => ({ value, label: dailyActivityLabel(value) }))}
              onSelect={(dailyActivity) => void services.setup.saveSetup(setup.copyWith({ dailyActivity }))}
            />
          }
        />
        <MmListRow
          title="Experience"
          subtitle={trainingStatusLabel(setup.trainingStatus)}
          trailingAction={
            <MmMenuButton<TrainingStatus>
              icon="edit"
              label="Change experience"
              items={TrainingStatus.values.map((value) => ({ value, label: trainingStatusLabel(value) }))}
              onSelect={(trainingStatus) => void services.setup.saveSetup(setup.copyWith({ trainingStatus }))}
            />
          }
        />
        <MmListRow
          title={`Training days per week: ${setup.trainingDaysPerWeek}`}
          detail={
            <MmSlider
              name="Training days per week"
              value={setup.trainingDaysPerWeek}
              max={7}
              divisions={7}
              onChange={(days) =>
                void services.setup.saveSetup(setup.copyWith({ trainingDaysPerWeek: roundHalfAwayFromZero(days) }))
              }
            />
          }
        />
      </MmListGroup>
      <GroupHeader text="Body fat estimate" />
      <MmListGroup>
        <MmSwitchRow
          title={bodyFat === undefined ? 'Let the app estimate' : `About ${whole(bodyFat)}%`}
          subtitle="Enter one only if you have a recent measurement."
          value={bodyFat !== undefined}
          onChange={(on) => void services.setup.saveSetup(setup.copyWith({ bodyFatPercent: on ? 25 : undefined }))}
        />
        {bodyFat === undefined ? null : (
          <MmSlider
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
      </MmListGroup>
      <ProfileSection />
      <GroupHeader text="Nutrition detail" />
      <MmSegmented<DetailLevel>
        name="Nutrition detail"
        segments={DetailLevel.values.map((value) => ({ value, label: detailLevelLabel(value) }))}
        selected={detail}
        onChange={(level) => {
          if (level !== undefined) void services.preferences.saveDetailLevel(level);
        }}
      />
      <p className="app-caption settings-note">
        {detailLevelDescription(detail)} Changes what is shown, never what is stored.
      </p>
      <GroupHeader text="Food logging" />
      <MmListGroup>
        <MmSwitchRow
          title="Easy-to-miss reminder"
          subtitle="A line under a completed day that names things people often forget to log."
          value={easyToMiss}
          onChange={(on) => void services.preferences.saveEasyToMissEnabled(on)}
        />
      </MmListGroup>
      <GroupHeader text="Coaching" />
      <MmListGroup>
        <MmListRow
          leadingIcon="pause"
          title="Pause"
          subtitle="For a holiday, an illness or an injury."
          trailing={chevron}
          onPress={() => void navigator.push(() => <PauseScreen />)}
        />
      </MmListGroup>
      <RemindersSection />
      <HealthConnectSection />
      <GroupHeader text="About" />
      <MmListGroup>
        <MmListRow
          leadingIcon="info"
          title="How this works"
          subtitle="Where each number comes from, and how sure we are."
          trailing={chevron}
          onPress={() => void navigator.push(() => <HowThisWorksScreen />)}
        />
      </MmListGroup>
      <GroupHeader text="Data" />
      <MmListGroup>
        <MmListRow
          leadingIcon="shield"
          title="Stored only on this device"
          subtitle="Nothing is uploaded. Encrypted backup is coming."
        />
        <MmListRow
          leadingIcon="delete"
          danger
          title="Erase all data and start over"
          onPress={() => void erase()}
        />
      </MmListGroup>
      {services.environment === 'dev' ? (
        <>
          <GroupHeader text="Development" />
          <MmListGroup>
            <MmListRow
              leadingIcon="edit"
              title="Component gallery"
              subtitle="Every color and component, light and dark."
              onPress={() => void navigator.push(() => <Gallery />)}
            />
          </MmListGroup>
        </>
      ) : null}
      <p className="app-caption settings-about">Martian Macros · {services.environment}</p>
    </Screen>
  );
}
