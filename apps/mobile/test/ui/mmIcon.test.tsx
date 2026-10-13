import type React from 'react';
import RestaurantOutlined from '@mui/icons-material/RestaurantOutlined';
import FitnessCenterOutlined from '@mui/icons-material/FitnessCenterOutlined';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MmIcon } from '../../src/ui/MmIcon';
import type { MmIconName } from '../../src/ui/MmIconName';
import { mmIcons } from '../../src/ui/mmIcons';

/**
 * MM-236: the icons are Material's, mapped once by meaning. Food and train
 * are the two the owner could not read when they were hand-drawn; they are
 * pinned to the shapes he chose the standard set for.
 */
const drawn = (element: React.ReactElement): string => {
  const view = render(element);
  const svg = view.container.querySelector('svg');
  expect(svg).not.toBeNull();
  const inner = svg!.innerHTML;
  view.unmount();
  return inner;
};

describe('MmIcon', () => {
  it('every name renders a hidden svg', () => {
    for (const name of Object.keys(mmIcons) as MmIconName[]) {
      const view = render(<MmIcon name={name} />);
      const svg = view.container.querySelector('svg.mm-icon');
      expect(svg, name).not.toBeNull();
      expect(svg!.getAttribute('aria-hidden'), name).toBe('true');
      view.unmount();
    }
  });

  it('food is Material’s Restaurant and train is FitnessCenter', () => {
    expect(drawn(<MmIcon name="food" />)).toBe(drawn(<RestaurantOutlined />));
    expect(drawn(<MmIcon name="train" />)).toBe(drawn(<FitnessCenterOutlined />));
  });
});
