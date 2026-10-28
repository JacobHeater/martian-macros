import { useEffect, useState } from 'react';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { MmButton } from '../ui/MmButton';
import { MmIconButton } from '../ui/MmIconButton';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { MmSwitchRow } from '../ui/MmSwitchRow';
import { MmTextField } from '../ui/MmTextField';
import { Notice } from '../ui/Notice';
import { useOverlays } from '../ui/useOverlays';
import { useCell } from '../app/useCell';
import { CarbFatBalance } from '../domain/CarbFatBalance';
import { CardioFloors } from '../domain/training/CardioFloors';
import { CardioRule } from '../engine/CardioRule';
import { Fmt } from '../format/Fmt';
import { FormatError } from '../lang/FormatError';
import { NumberEntry } from '../ui/NumberEntry';
import { CoachAiConfig } from '../domain/integration/CoachAiConfig';
import type { CoachNarrationOutcome } from '../domain/integration/CoachNarrationOutcome';
import { CoachAiProvider } from '../domain/integration/CoachAiProvider';
import { TargetShape } from '../domain/TargetShape';
import { coachAiProviderLabel } from '../format/coachAiProviderLabel';
import { coachAiTestText } from '../format/coach/coachAiTestText';
import { executiveBriefNarrationRequest } from '../format/coach/executiveBriefNarrationRequest';
import { weekdayLabel } from '../format/weekdayLabel';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { useSettingsSection } from './useSettingsSection';
import { CarbFatBalanceScreen } from './CarbFatBalanceScreen';
import { CoachSettingsScreen } from './CoachSettingsScreen';
import { WeekShapeScreen } from './WeekShapeScreen';

/**
 * Settings' Coach section (MM-364, MM-665): one row that opens the coaching
 * insights' switches, as Pause opens its screen from Today's setup; optional
 * BYOK provider and API key configuration for coaching narration; and the
 * switches for exact targets (MM-123) and easing into maintenance (MM-130),
 * both off by default; the rows that open the balance of carbs and fat
 * (MM-122) and the week's shape (MM-124); and the floors the coach holds
 * cardio to (MM-678), the coach's defaults until the person types their own.
 */
export function CoachSettingsSection() {
  // Folds in place, closed until opened (MM-398).
  const fold = useSettingsSection('coach');
  const navigator = useNavigator();
  const overlays = useOverlays();
  const { services, state } = useApp();
  const exact = useLoaded(state.exactTargets) ?? false;
  const ease = useLoaded(state.easeIntoMaintenance) ?? false;
  const floors = useLoaded(state.cardioFloors) ?? CardioFloors.none;
  const aiConfig = useLoaded(state.coachAiConfig) ?? CoachAiConfig.off;
  const [keyDraft, setKeyDraft] = useState(aiConfig.apiKey);
  // "Test AI coach" (MM-671): the model's words on today's brief, or why there are none.
  const brief = useCell(state.coachAnalysis.executiveBrief);
  const [tested, setTested] = useState<CoachNarrationOutcome | undefined>(undefined);
  const [testing, setTesting] = useState(false);
  useEffect(() => {
    setKeyDraft(aiConfig.apiKey);
  }, [aiConfig.apiKey, aiConfig.provider]);

  const chooseAiProvider = () =>
    void overlays
      .options({
        title: 'AI coaching phrasing',
        options: CoachAiProvider.values.map((value) => ({ value, label: coachAiProviderLabel(value) })),
        selected: aiConfig.provider,
      })
      .then((chosen) => {
        if (chosen !== undefined) {
          void services.coachAi.saveConfig({
            provider: chosen.value,
            apiKey: chosen.value === 'none' ? '' : aiConfig.apiKey,
          });
        }
      });

  const saveApiKey = () => {
    const trimmed = keyDraft.trim();
    void services.coachAi.saveConfig({ provider: aiConfig.provider, apiKey: trimmed }).then(() => {
      overlays.snack(trimmed === '' ? 'API key cleared.' : 'API key saved on this device.');
    });
  };

  // The key as typed is what is tested: it is saved first, as Save key saves it.
  const testAiCoach = async () => {
    if (brief === undefined) return;
    setTesting(true);
    setTested(undefined);
    try {
      const trimmed = keyDraft.trim();
      if (trimmed !== aiConfig.apiKey) await services.coachAi.saveConfig({ provider: aiConfig.provider, apiKey: trimmed });
      setTested(await services.coachNarrator.probe(executiveBriefNarrationRequest(brief), { fresh: true }));
    } finally {
      setTesting(false);
    }
  };
  const testResult = tested === undefined ? undefined : coachAiTestText(tested, aiConfig.provider);

  const aiSubtitle =
    aiConfig.provider === 'none'
      ? `${coachAiProviderLabel('none')}. All coaching numbers are worked out on this phone.`
      : `${coachAiProviderLabel(aiConfig.provider)}${aiConfig.apiKey.trim() === '' ? ' · enter your API key below' : ' · key saved on this device'}. Numbers stay deterministic.`;

  const shape = TargetShape.on(useLoaded(state.targetShapes) ?? [], useCell(state.today));
  const fatShare = shape?.balance?.fatShare ?? CarbFatBalance.issuedFatShare;
  const balanceName =
    fatShare === CarbFatBalance.moreCarbsFatShare
      ? 'More carbs'
      : fatShare === CarbFatBalance.balancedFatShare
        ? 'Balanced'
        : fatShare === CarbFatBalance.moreFatFatShare
          ? 'More fat'
          : `Fat ${roundHalfAwayFromZero(fatShare * 100)}% of calories`;
  const higherDays = [1, 2, 3, 4, 5, 6, 0].filter((day) => shape?.week.higherDays.has(day) === true);
  return (
    <MmSection icon="coach" title="Coach" {...fold}>
      <MmListGroup>
        <MmListRow
          leadingIcon="insight"
          title="Coaching insights"
          subtitle="Insights under the things you log, by area and by kind."
          opens
          onPress={() => void navigator.push(() => <CoachSettingsScreen />)}
        />
        <MmListRow
          leadingIcon="coach"
          title="AI coaching phrasing"
          subtitle={aiSubtitle}
          trailingAction={
            <MmIconButton icon="edit" label="Change AI coaching provider" opens="listbox" onPress={chooseAiProvider} />
          }
        />
        {aiConfig.provider === 'none' ? null : (
          <MmListRow
            title="API key"
            subtitle="Kept on this phone outside backup files. Leave blank and save to clear."
            entry={
              // The field across the row, its two actions 12 px under it, side by side (MM-669, MM-671).
              <div>
                <div className="app-stack-item">
                  <MmTextField
                    name="Coaching API key"
                    dense
                    value={keyDraft}
                    hint="Paste your API key"
                    onSubmit={saveApiKey}
                    onChange={setKeyDraft}
                  />
                </div>
                <div className="app-row">
                  <MmButton label="Save key" kind="secondary" onPress={saveApiKey} />
                  <MmButton
                    label={testing ? 'Testing…' : 'Test AI coach'}
                    name="Test AI coach"
                    icon="coach"
                    kind="secondary"
                    onPress={brief === undefined || testing ? undefined : testAiCoach}
                  />
                </div>
                {testResult === undefined ? null : (
                  <div className="settings-ai-test">
                    <Notice
                      kind={testResult.trouble ? 'caution' : 'info'}
                      icon={testResult.trouble ? undefined : 'coach'}
                      title={testResult.title}
                      text={testResult.text}
                    />
                  </div>
                )}
              </div>
            }
          />
        )}
        <MmListRow
          leadingIcon="percent"
          title="Carbs and fat balance"
          subtitle={shape?.balance === undefined ? 'Fat 25% of calories, as the app set it. Yours to choose.' : balanceName}
          opens
          onPress={() => void navigator.push(() => <CarbFatBalanceScreen />)}
        />
        <MmListRow
          leadingIcon="calendar"
          title="Week shape"
          subtitle={
            higherDays.length === 0
              ? 'Off: every day has the same target.'
              : `${higherDays.map(weekdayLabel).join(', ')} ${roundHalfAwayFromZero((shape?.week.raise ?? 0) * 100)}% higher.`
          }
          opens
          onPress={() => void navigator.push(() => <WeekShapeScreen />)}
        />
        <MmListRow
          leadingIcon="walk"
          title="Steps a day floor"
          subtitle={
            floors.stepsPerDay === undefined
              ? `The coach's default is ${Fmt.whole(CardioRule.stepsPerDay)} a day on fat loss and recomp. Yours to change below.`
              : 'Yours. The coach holds you to it on fat loss and recomp.'
          }
          entry={
            <NumberEntry
              title="Steps a day floor"
              unit="steps"
              initial={String(floors.stepsPerDay ?? CardioRule.stepsPerDay)}
              hint="A whole number from 1,000 to 30,000."
              refusal="That floor is out of range."
              saves="steps floor"
              saveKind="secondary"
              onSave={async (steps) => {
                if (!CardioFloors.stepsAllowed(steps)) throw new FormatError('Out of range');
                await services.preferences.saveCardioFloors({ ...floors, stepsPerDay: steps });
              }}
            />
          }
        />
        <MmListRow
          leadingIcon="timer"
          title="Cardio minutes a week floor"
          subtitle={
            floors.minutesPerWeek === undefined
              ? `The coach's default is ${CardioRule.minutesPerWeek} minutes a week, every session on the watch that is not strength. Yours to change below.`
              : 'Yours. Every session on the watch that is not strength counts.'
          }
          entry={
            <NumberEntry
              title="Cardio minutes a week floor"
              unit="min"
              initial={String(floors.minutesPerWeek ?? CardioRule.minutesPerWeek)}
              hint="A whole number from 0 to 1,000."
              refusal="That floor is out of range."
              saves="cardio floor"
              saveKind="secondary"
              onSave={async (minutes) => {
                if (!CardioFloors.minutesAllowed(minutes)) throw new FormatError('Out of range');
                await services.preferences.saveCardioFloors({ ...floors, minutesPerWeek: minutes });
              }}
            />
          }
        />
        <MmSwitchRow
          leadingIcon="tune"
          title="Exact targets"
          subtitle="Show targets to the calorie and the gram. Off, they are rounded to 25 kcal and 5 g; the coach works from the exact figures either way."
          value={exact}
          onChange={(value) => void services.preferences.saveExactTargets(value)}
        />
        <MmSwitchRow
          leadingIcon="flag"
          title="Ease into maintenance"
          subtitle="Leaving a deficit, raise calories in two equal steps over two weeks instead of at once. A matter of comfort; it changes nothing about your metabolism."
          value={ease}
          onChange={(value) => void services.preferences.saveEaseIntoMaintenance(value)}
        />
      </MmListGroup>
    </MmSection>
  );
}
