import { useLayoutEffect, useRef } from 'react';
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
 * and shown by weight and an indicator as well as by color. While shown it
 * says how tall it is, safe area included, as `--mm-navigation-bar-height`
 * on the document, so a snack stands above it (MM-302).
 */
export function MmNavigationBar<Id extends string>({ destinations, current, onSelect }: MmNavigationBarProps<Id>) {
  const bar = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const element = bar.current;
    if (element === null) return undefined;
    const root = document.documentElement.style;
    const publish = () => root.setProperty('--mm-navigation-bar-height', `${element.getBoundingClientRect().height}px`);
    publish();
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(publish);
    observer?.observe(element);
    return () => {
      observer?.disconnect();
      root.removeProperty('--mm-navigation-bar-height');
    };
  }, []);
  return (
    <nav ref={bar} className="mm-navigation-bar" aria-label="Destinations">
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
