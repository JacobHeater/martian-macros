import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

const today = CalendarDate.of(2026, 10, 20);

describe('Meal Coach breakdown sheet and inline food swaps (MM-666)', () => {
  it('opens Coach breakdown from the meal overflow menu alongside Macro split and shows tactical impact and swap', async () => {
    const repos = new InMemoryRepositories();
    await repos.preferences.saveThemePreference('martian');
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }));
    await repos.weights.saveWeight(today, 82);

    // Log a higher-protein food yesterday so a swap candidate exists.
    await repos.food.addFood(
      new FoodEntry({
        id: 1,
        date: today.addDays(-1),
        meal: 'lunch',
        name: 'Grilled chicken wrap',
        kcal: 420,
        proteinG: 42,
        carbsG: 36,
        fatG: 10,
        source: 'weighed',
      }),
    );

    // Log a low-protein, calorie-dense lunch item today.
    await repos.food.addFood(
      new FoodEntry({
        id: 2,
        date: today,
        meal: 'lunch',
        name: 'Creamy Alfredo pasta',
        kcal: 640,
        proteinG: 12,
        carbsG: 68,
        fatG: 36,
        source: 'weighed',
      }),
    );

    renderApp(repos, today);
    await openTab('Food');

    // Inline insight under Creamy Alfredo pasta should surface the concrete swap.
    expect(await screen.findByText(/Swap for Grilled chicken wrap/i)).toBeInTheDocument();

    // Open Lunch overflow menu and verify both "Coach breakdown" and "Macro split" are present.
    const optionsBtn = await screen.findByRole('button', { name: 'Options for lunch' });
    await userEvent.click(optionsBtn);
    expect(await screen.findByRole('menuitem', { name: 'Macro split' })).toBeInTheDocument();
    const breakdownItem = await screen.findByRole('menuitem', { name: 'Coach breakdown' });
    await userEvent.click(breakdownItem);

    const dialog = await screen.findByRole('dialog', { name: 'Coach breakdown' });
    expect(within(dialog).getByText('Meal impact')).toBeInTheDocument();
    expect(within(dialog).getByText('Meal protein density (P%)')).toBeInTheDocument();
    expect(within(dialog).getByText('Remaining runway')).toBeInTheDocument();
    expect(within(dialog).getByText('Highest calorie drag')).toBeInTheDocument();
    expect(within(dialog).getByText('Suggested swap')).toBeInTheDocument();
    expect(within(dialog).getByText(/Grilled chicken wrap in place of Creamy Alfredo pasta/)).toBeInTheDocument();
  });
});
