import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { dataGapsOf } from '../../src/coach/dataGapsOf';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { CoachConfidence } from '../../src/engine/CoachConfidence';
import type { ConfidenceLevel } from '../../src/engine/ConfidenceLevel';
import { ConfidenceNextStep } from '../../src/engine/ConfidenceNextStep';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { HealthDataType } from '../../src/healthIngest/HealthDataType';
import { FakeHealthSource } from '../../src/healthIngest/testing/FakeHealthSource';
import { recordedHealthHistory } from '../../src/healthIngest/testing/recordedHealthHistory';
import type { HealthConnection } from '../../src/state/HealthConnection';
import { dashboardLoaded } from '../support/dashboardLoaded';
import { first } from '../support/first';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-523: where the health platform's data has a gap the person controls,
 * the coach says what it costs beside the estimate it weakens, offers where
 * to allow it, and leaves the choice to them: dismissed, it stays gone.
 */
const today = CalendarDate.of(2026, 10, 5);
const weighInsLine = /your trend and the dates it projects are less certain/;
const historyLine = /Allowing past data in Health Connect would give it more/;

const confidence = (levels: { weighIns?: ConfidenceLevel; estimate?: ConfidenceLevel } = {}) =>
  new CoachConfidence({
    level: 'learning',
    estimate: levels.estimate ?? 'learning',
    foodLog: 'learning',
    weighIns: levels.weighIns ?? 'learning',
    stability: 'good',
    nextStep: ConfidenceNextStep.values[0],
    usableFoodDays: 0,
    weighInDays: 1,
  });

const connection = (permitted: HealthDataType[], history = true): HealthConnection => ({
  available: new Set<HealthDataType>(['weight', 'bodyFat', 'steps']),
  permitted: new Set(permitted),
  imported: new Map(),
  history,
});

describe('which gaps are said', () => {
  it('weigh-ins not allowed and too few for the coach', () => {
    expect(dataGapsOf({ connection: connection([]), confidence: confidence(), eatingDisorderHistory: false })).toEqual(['weight']);
  });

  it('nothing when the typed weigh-ins are enough', () => {
    expect(
      dataGapsOf({ connection: connection([]), confidence: confidence({ weighIns: 'good' }), eatingDisorderHistory: false }),
    ).toEqual([]);
  });

  it('never a line that asks for more weighing with an eating-disorder history', () => {
    expect(dataGapsOf({ connection: connection([]), confidence: confidence(), eatingDisorderHistory: true })).toEqual([]);
  });

  it('the history refused while weight is read and the estimate is not yet sure', () => {
    expect(dataGapsOf({ connection: connection(['weight'], false), confidence: confidence(), eatingDisorderHistory: false })).toEqual([
      'history',
    ]);
    expect(
      dataGapsOf({ connection: connection(['weight'], false), confidence: confidence({ estimate: 'good' }), eatingDisorderHistory: false }),
    ).toEqual([]);
    expect(dataGapsOf({ connection: connection(['weight'], true), confidence: confidence(), eatingDisorderHistory: false })).toEqual([]);
  });

  it('nothing on a phone without a health platform', () => {
    const none: HealthConnection = { available: new Set(), permitted: new Set(), imported: new Map(), history: false };
    expect(dataGapsOf({ connection: none, confidence: confidence(), eatingDisorderHistory: false })).toEqual([]);
    expect(dataGapsOf({ connection: undefined, confidence: confidence(), eatingDisorderHistory: false })).toEqual([]);
  });
});

describe('on Coach', () => {
  let repos: InMemoryRepositories;
  let source: FakeHealthSource;

  beforeEach(async () => {
    repos = new InMemoryRepositories();
    await repos.preferences.saveThemePreference('martian');
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today, healthCheckConfirmedOn: today }));
    await repos.weights.saveWeight(today, 82);
    source = FakeHealthSource.fromJson(recordedHealthHistory);
  });

  async function openCoach(): Promise<void> {
    renderApp(repos, today, { change: (services) => ({ ...services, healthSource: source }) });
    await dashboardLoaded();
    await openTab('Coach');
  }

  it('weigh-ins not allowed: beside the trend, what that costs and where to allow them', async () => {
    await openCoach();
    const line = await screen.findByText(weighInsLine);
    const body = (await screen.findByRole('heading', { name: 'Body' })).closest('.mm-section') as HTMLElement;
    expect(body).toContainElement(line);
    expect(line.textContent).not.toMatch(/you are missing|you haven|you didn/i);
    await userEvent.click(within(body).getByRole('button', { name: 'Open Settings: Health Connect' }));
    expect(await screen.findByText(/Nothing read leaves this phone/)).toBeInTheDocument();
  });

  it('dismissed, it does not come back for the same gap, and nothing else changes', async () => {
    await openCoach();
    await screen.findByText(weighInsLine);
    const setupBefore = await repos.setup.loadSetup();
    await userEvent.click(screen.getByRole('button', { name: 'Got it: weigh-ins' }));
    await expect.poll(() => screen.queryByText(weighInsLine)).toBeNull();
    const snoozes = await first(repos.insightSnoozes.watchInsightSnoozes());
    expect(snoozes).toEqual([{ kind: 'dataGap', subject: 'weight', item: 'Weigh-ins from Health Connect', resumesOn: undefined }]);
    expect(await repos.setup.loadSetup()).toEqual(setupBefore);
    expect(await source.permitted()).toEqual(new Set());
  });

  it('an eating-disorder history: no line asks for more weighing', async () => {
    const setup = (await repos.setup.loadSetup())!;
    await repos.setup.saveSetup(setup.copyWith({ screening: new ScreeningAnswers({ ...setup.screening, eatingDisorderHistory: true }) }));
    await openCoach();
    await screen.findByRole('heading', { name: 'Body' });
    await screen.findByText(/Trend weight/);
    expect(screen.queryByText(weighInsLine)).not.toBeInTheDocument();
  });

  it('the history refused: beside the expenditure estimate, that it has less to go on, with Health Connect to open', async () => {
    await source.permit(new Set<HealthDataType>(['weight']));
    source.historyFrom = new Date(2026, 8, 5);
    source.willPermitHistory = false;
    await source.requestHistory();
    await openCoach();
    const line = await screen.findByText(historyLine);
    const metabolism = (await screen.findByRole('heading', { name: 'Your metabolism' })).closest('.mm-section') as HTMLElement;
    expect(metabolism).toContainElement(line);
    expect(screen.queryByText(weighInsLine)).not.toBeInTheDocument();
    await userEvent.click(within(metabolism).getByRole('button', { name: 'Open Health Connect' }));
    await expect.poll(() => source.permissionsOpened).toBe(1);
  });
});
