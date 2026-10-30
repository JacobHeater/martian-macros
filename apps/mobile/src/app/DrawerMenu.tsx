import { MmDrawerGroup } from '../ui/MmDrawerGroup';
import { MmDrawerRow } from '../ui/MmDrawerRow';
import { MmLettering } from '../ui/MmLettering';
import type { DrawerChoice } from './DrawerChoice';
import type { HomeDestination } from '../state/HomeDestination';
import { destinations } from './destinations';
import './app.css';

interface DrawerMenuProps {
  /** The destination the person is at, marked as current. */
  current: HomeDestination;
  onChoose: (choice: DrawerChoice) => void;
}

/**
 * What the drawer holds (MM-704): the Martian Macros lettering at its head,
 * then the four destinations, the person's own places (Profile, and the
 * Library of everything they made, MM-706), and Settings.
 */
export function DrawerMenu({ current, onChoose }: DrawerMenuProps) {
  return (
    <>
      <div className="mm-drawer-head">
        <MmLettering />
      </div>
      <MmDrawerGroup label="Destinations">
        {destinations.map((destination) => (
          <MmDrawerRow
            key={destination.id}
            icon={destination.icon}
            label={destination.label}
            current={destination.id === current}
            onPress={() => onChoose(destination.id)}
          />
        ))}
      </MmDrawerGroup>
      <MmDrawerGroup label="You">
        <MmDrawerRow icon="person" label="Profile" onPress={() => onChoose('profile')} />
        <MmDrawerRow icon="library" label="Library" onPress={() => onChoose('library')} />
      </MmDrawerGroup>
      <MmDrawerGroup label="Settings">
        <MmDrawerRow icon="settings" label="Settings" onPress={() => onChoose('settings')} />
      </MmDrawerGroup>
    </>
  );
}
