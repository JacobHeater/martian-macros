import { render } from '@testing-library/react';
import { expect, it } from 'vitest';
import { HorizonArc } from '../../src/ui/HorizonArc';

// MM-568: the hero vanished at some scroll offsets on the iPhone; an SVG blur inside its rounded clip made WebKit drop it.
it('the arc draws its glow without an SVG filter', () => {
  const view = render(<HorizonArc progress={1.2} />);
  expect(view.container.querySelector('filter')).toBeNull();
  expect(view.container.querySelector('[filter]')).toBeNull();
  expect(view.container.querySelector('radialGradient')).not.toBeNull();
});
