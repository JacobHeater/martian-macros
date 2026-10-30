import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';
import { openAddFood, press } from './addFood';
import { topLayer } from './topLayer';

/**
 * Opens the Library (MM-706) of an app already drawn, the way this branch
 * reaches it: Add food, Saved, "Manage in Library" (MM-707). The sheet closes
 * and the Library is the screen on top. Its folds start closed.
 */
export async function openLibrary(): Promise<HTMLElement> {
  const sheet = await openAddFood();
  await press(sheet, 'Saved');
  await press(sheet, 'Manage in Library');
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Add food' })).toBeNull());
  const library = topLayer();
  await within(library).findByRole('heading', { name: 'Library' });
  return library;
}

/** Opens the fold whose header is called `title` ("Foods · 3", "Usual foods"). */
export async function openFold(library: HTMLElement, title: string | RegExp): Promise<void> {
  await userEvent.click(within(library).getByRole('button', { name: title }));
}

/** The form sheet called `name` ("Save your own food", "New recipe"), open over the Library. */
export function libraryForm(name: string): Promise<HTMLElement> {
  return screen.findByRole('dialog', { name });
}

/** Presses "New food" and the way called `route` in its chooser, and gives the form that opens. */
export async function newFoodBy(library: HTMLElement, route: 'Scan a label' | 'Type it in' | 'New recipe'): Promise<HTMLElement> {
  await press(library, 'New food');
  const chooser = await screen.findByRole('dialog', { name: 'New food' });
  await userEvent.click(within(chooser).getByRole('button', { name: new RegExp(`^${route}`) }));
  return libraryForm(route === 'New recipe' ? 'New recipe' : 'Save your own food');
}

/** Opens the editor of the saved food or exercise called `name` from its row's menu. */
export async function editInLibrary(library: HTMLElement, name: string): Promise<void> {
  await press(library, `More actions for ${name}`);
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }));
}
