import { MmIcon } from './MmIcon';
import type { MmNavDestination } from './MmNavDestination';
import './ui.css';

interface MmNavigationBarProps<Id extends string> {
  destinations: readonly MmNavDestination<Id>[];
  current: Id;
  onSelect: (id: Id) => void;
}

/**
 * The bottom bar (MM-99). The current place is said to assistive technology
 * and shown by weight and an indicator as well as by color.
 */
export function MmNavigationBar<Id extends string>({ destinations, current, onSelect }: MmNavigationBarProps<Id>) {
  return (
    <nav className="mm-navigation-bar" aria-label="Destinations">
      {destinations.map((destination) => {
        const isCurrent = destination.id === current;
        return (
          <button
            key={destination.id}
            type="button"
            className={`mm-nav-destination${isCurrent ? ' mm-nav-destination-current' : ''}`}
            aria-current={isCurrent ? 'page' : undefined}
            onClick={() => onSelect(destination.id)}
          >
            <span className="mm-nav-indicator">
              <MmIcon name={destination.icon} />
            </span>
            {destination.label}
          </button>
        );
      })}
    </nav>
  );
}
