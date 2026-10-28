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

describe('Meal Coach breakdown sheet and inline food moves (MM-666, MM-684)', () => {
  it('opens Coach breakdown from the meal overflow menu alongside Macro split and shows tactical impact and the move', async () => {
    const repos = new InMemoryRepositories();
    await repos.preferences.saveThemePreference('martian');
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }));
    await repos.weights.saveWeight(today, 82);

    // A lean food logged at lunch on two prior days (TradeRule.loggedMinDays): the add's own-food candidate (MM-684).
    for (const [id, daysAgo] of [
      [1, 1],
      [2, 2],
    ] as const) {
      await repos.food.addFood(
        new FoodEntry({
          id,
          date: today.addDays(-daysAgo),
          meal: 'lunch',
          name: 'Grilled chicken wrap',
          kcal: 280,
          proteinG: 36,
          carbsG: 20,
          fatG: 6,
          source: 'weighed',
        }),
      );
    }

    // Log a low-protein, calorie-dense lunch item today.
    await repos.food.addFood(
      new FoodEntry({
        id: 3,
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

    // The inline line under the pasta ends in the food's own move (MM-684): the wrap added, in the approved words.
    expect(await screen.findByText('Light on protein: 640 kcal for 12 g. Add grilled chicken wrap, 280 kcal for 36 g, alongside next time.')).toBeInTheDocument();

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
    expect(within(dialog).getByText('Your move')).toBeInTheDocument();
    expect(within(dialog).getByText('Add grilled chicken wrap next time')).toBeInTheDocument();
    expect(within(dialog).getByText('+280 kcal · +36 g protein')).toBeInTheDocument();
    // The built-in words (no model set up): the drag named, the one order, and the next meal carrying today.
    expect(within(dialog).getByText(/Lunch was 640 kcal for 12 g of protein, 8% protein\. The Creamy Alfredo pasta is the drag: 640 kcal for 12 g\. Next time build it around protein: add grilled chicken wrap, 280 kcal for 36 g, and lunch stands at 48 g\. You have [\d,]+ kcal left for \d+ g today\. Dinner carries it\./)).toBeInTheDocument();
  });
});
