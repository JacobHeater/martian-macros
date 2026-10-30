import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { CoachAiConfig } from '../../src/domain/integration/CoachAiConfig';
import { encodePhotoArchive } from '../../src/domain/photos/encodePhotoArchive';
import { FakeDataRestorer } from '../../src/fixtures/FakeDataRestorer';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { passphraseHeadline } from '../../src/settings/passphraseHeadline';
import type { AppServices } from '../../src/state/AppServices';
import { FakeMoveReceiver } from '../../src/transfer/FakeMoveReceiver';
import { foodCopyBytes } from '../../src/transfer/foodCopyBytes';
import type { MoveParcel } from '../../src/transfer/MoveParcel';
import { foodOn } from '../support/foodOn';
import { renderApp } from '../support/renderApp';
import { declarationsOf } from '../support/stylesheetRules';
import { topLayer } from '../support/topLayer';

/**
 * MM-704: the app's menu is a drawer from the left, opened by the menu
 * button in the app bar: the lettering at its head, the four destinations,
 * Profile, Library, My QR Code (MM-716) and Settings. It is the one
 * navigation: the bottom bar is gone (MM-711), as is the settings gear.
 */
const today = CalendarDate.of(2026, 10, 30);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

const bar = () => screen.findByRole('button', { name: 'Menu' });

async function openMenu(): Promise<HTMLElement> {
  await bar();
  await userEvent.click(screen.getByRole('button', { name: 'Menu' }));
  return screen.findByRole('dialog', { name: 'Menu' });
}

const rowsOf = (drawer: HTMLElement) => within(drawer).getAllByRole('button').map((row) => row.textContent);

it('opens from the menu button with the lettering, the destinations, Profile, Library, My QR Code and Settings, the current one marked', async () => {
  renderApp(repos, today);
  const drawer = await openMenu();
  expect(rowsOf(drawer)).toEqual(['Dashboard', 'Food', 'Train', 'Coach', 'Profile', 'Library', 'My QR Code', 'Settings']);
  // The lettering is decoration: an image with no name, passed by.
  expect(drawer.querySelector('img.mm-lettering')).toHaveAttribute('alt', '');
  expect(within(drawer).getByRole('button', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
  expect(within(drawer).getByRole('button', { name: 'Food' })).not.toHaveAttribute('aria-current');
  // In three groups: the destinations, the person's own places, Settings.
  expect(within(drawer).getAllByRole('group').map((group) => group.getAttribute('aria-label'))).toEqual(['Destinations', 'You', 'Settings']);
});

it('there is no bottom bar: the drawer is the one way between destinations (MM-711)', async () => {
  renderApp(repos, today);
  await bar();
  expect(screen.queryByRole('navigation')).toBeNull();
  expect(document.querySelector('.mm-navigation-bar')).toBeNull();
});

it('a destination chosen in the drawer closes it and is the current one', async () => {
  renderApp(repos, today);
  const drawer = await openMenu();
  await userEvent.click(within(drawer).getByRole('button', { name: 'Food' }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull());
  expect(await screen.findByRole('heading', { name: 'Breakfast' })).toBeInTheDocument();
  // Opened again, Food is the row marked.
  expect(within(await openMenu()).getByRole('button', { name: 'Food' })).toHaveAttribute('aria-current', 'page');
});

it('Settings from the drawer is pushed over the destination with Back, and back returns to it', async () => {
  renderApp(repos, today);
  const drawer = await openMenu();
  await userEvent.click(within(drawer).getByRole('button', { name: 'Settings' }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull());
  const settings = within(topLayer());
  expect(await settings.findByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
  await userEvent.click(settings.getByRole('button', { name: 'Back' }));
  await waitFor(() => expect(screen.queryByRole('heading', { level: 1, name: 'Settings' })).toBeNull());
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dashboard');
});

it('the Library from the drawer is pushed over the destination (MM-706)', async () => {
  renderApp(repos, today);
  const drawer = await openMenu();
  await userEvent.click(within(drawer).getByRole('button', { name: 'Library' }));
  expect(await within(topLayer()).findByRole('heading', { level: 1, name: 'Library' })).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull());
});

it('Profile from the drawer is pushed over the destination', async () => {
  renderApp(repos, today);
  const drawer = await openMenu();
  await userEvent.click(within(drawer).getByRole('button', { name: 'Profile' }));
  expect(await within(topLayer()).findByRole('heading', { level: 1, name: 'Profile' })).toBeInTheDocument();
});

it('the gear is gone: no Settings button until the drawer is open', async () => {
  renderApp(repos, today);
  await bar();
  expect(screen.queryByRole('button', { name: 'Settings' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-haspopup', 'dialog');
});

it('a press on the scrim closes it, and focus goes back to the menu button', async () => {
  renderApp(repos, today);
  const drawer = await openMenu();
  expect(drawer).toHaveFocus();
  fireEvent.pointerDown(drawer.parentElement!);
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull());
  expect(screen.getByRole('button', { name: 'Menu' })).toHaveFocus();
});

it('Escape closes it', async () => {
  renderApp(repos, today);
  await openMenu();
  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull());
  expect(screen.getByRole('button', { name: 'Menu' })).toHaveFocus();
});

it('dragged back past a third of its width it leaves; a short drag springs back', async () => {
  renderApp(repos, today);
  const drawer = await openMenu();
  vi.spyOn(drawer, 'getBoundingClientRect').mockReturnValue({ width: 300, height: 800, x: 0, y: 0, top: 0, left: 0, right: 300, bottom: 800, toJSON: () => ({}) });
  // A short drag: the panel follows the finger on a transform of its own, then springs back and keeps nothing of it.
  fireEvent.pointerDown(drawer, { clientX: 250, clientY: 200, pointerId: 1 });
  fireEvent.pointerMove(drawer, { clientX: 240, clientY: 201, pointerId: 1 });
  fireEvent.pointerMove(drawer, { clientX: 200, clientY: 203, pointerId: 1 });
  expect(drawer.style.transform).toBe('translate3d(-50px, 0, 0)');
  fireEvent.pointerUp(drawer, { clientX: 200, clientY: 203, pointerId: 1 });
  expect(drawer.style.transform).toBe('');
  expect(screen.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument();
  // Past a third of 300 px, let go: it leaves.
  fireEvent.pointerDown(drawer, { clientX: 250, clientY: 200, pointerId: 1 });
  fireEvent.pointerMove(drawer, { clientX: 240, clientY: 201, pointerId: 1 });
  fireEvent.pointerMove(drawer, { clientX: 120, clientY: 204, pointerId: 1 });
  fireEvent.pointerUp(drawer, { clientX: 120, clientY: 204, pointerId: 1 });
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull());
});

it('a finger that moves mostly up or down scrolls the rows and never drags the drawer', async () => {
  renderApp(repos, today);
  const drawer = await openMenu();
  fireEvent.pointerDown(drawer, { clientX: 250, clientY: 200, pointerId: 1 });
  fireEvent.pointerMove(drawer, { clientX: 248, clientY: 240, pointerId: 1 });
  fireEvent.pointerMove(drawer, { clientX: 150, clientY: 300, pointerId: 1 });
  expect(drawer.style.transform).toBe('');
  fireEvent.pointerUp(drawer, { clientX: 150, clientY: 300, pointerId: 1 });
  expect(screen.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument();
});

it('its slide-in, spring-back and leaving take the base motion token, 0 ms under reduced motion', () => {
  expect(declarationsOf('src/ui/ui.css', '.mm-drawer')).toMatch(/animation:\s*mm-drawer-in var\(--motion-base\)/);
  expect(declarationsOf('src/ui/ui.css', '.mm-drawer-settling')).toMatch(/transition:\s*transform var\(--motion-base\)/);
  expect(declarationsOf('src/ui/ui.css', '.mm-drawer-leaving')).toMatch(/transition:\s*transform var\(--motion-base\)/);
});

/** A never-backed-up phone with records, and the other phone about to send `parcel` once the code is shown (MM-716). */
const phoneShowingItsCode = (parcel?: MoveParcel) => {
  const restorer = new FakeDataRestorer();
  restorer.here = { weighIns: 30, foodDays: 20, workouts: 4, customFoods: 1, from: today.addDays(-30), to: today, hasSetup: true };
  restorer.toDescribe = { ...restorer.here, weighIns: 45 };
  const receiver = parcel === undefined ? new FakeMoveReceiver() : new FakeMoveReceiver({ kind: 'receives', parcel });
  renderApp(repos, today, { change: (services: AppServices) => ({ ...services, restorer, moveReceiver: receiver }) });
};
const everything: MoveParcel = { kind: 'everything', payload: { snapshot: new Uint8Array([4, 5, 6]), photos: encodePhotoArchive([]), coachAi: CoachAiConfig.off } };
const slowly = { timeout: 15000 };

it('MM-716: My QR Code shows this phone’s code at once, with no offer to back up first', async () => {
  phoneShowingItsCode();
  const drawer = await openMenu();
  await userEvent.click(within(drawer).getByRole('button', { name: 'My QR Code' }));
  const sheet = within(await screen.findByRole('dialog', { name: 'Move to this phone' }, slowly));
  expect(await sheet.findByRole('img', { name: 'QR code for your other phone to scan' }, slowly)).toBeInTheDocument();
  expect(sheet.queryByText('Back up this phone first?')).toBeNull();
});

it('MM-716: a whole move arriving from it offers the backup first; skipped, the move’s own confirmation follows', async () => {
  phoneShowingItsCode(everything);
  const drawer = await openMenu();
  await userEvent.click(within(drawer).getByRole('button', { name: 'My QR Code' }));
  const asks = within(await screen.findByRole('dialog', { name: 'Back up this phone first?' }, slowly));
  expect(asks.getByText(/Your other phone sent everything\. This phone has never been backed up\./)).toBeInTheDocument();
  await userEvent.click(asks.getByRole('button', { name: 'Skip the backup' }));
  expect(await screen.findByRole('dialog', { name: 'Replace this phone’s data?' }, slowly)).toBeInTheDocument();
});

it('MM-716: Back up first runs the Backup section’s own backup, from the passphrase on', async () => {
  phoneShowingItsCode(everything);
  const drawer = await openMenu();
  await userEvent.click(within(drawer).getByRole('button', { name: 'My QR Code' }));
  const asks = within(await screen.findByRole('dialog', { name: 'Back up this phone first?' }, slowly));
  await userEvent.click(asks.getByRole('button', { name: 'Back up first' }));
  expect(await screen.findByRole('dialog', { name: passphraseHeadline('set') }, slowly)).toBeInTheDocument();
});

it('MM-716: a copy of foods arriving from it offers no backup: the foods’ own confirmation comes (MM-715)', async () => {
  const foods = foodCopyBytes({ day: today, entries: [foodOn(today, { name: 'Apple', meal: 'snack', kcal: 95 })], foods: [] });
  phoneShowingItsCode({ kind: 'foods', foods });
  const drawer = await openMenu();
  await userEvent.click(within(drawer).getByRole('button', { name: 'My QR Code' }));
  expect(await screen.findByRole('dialog', { name: 'Add foods from your other phone?' }, slowly)).toBeInTheDocument();
  expect(screen.queryByText('Back up this phone first?')).toBeNull();
});
