import { readFileSync } from 'node:fs';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MmRhythmStrip } from '../../src/ui/MmRhythmStrip';
import { MmSection } from '../../src/ui/MmSection';
import { declarationsOf, rules } from '../support/stylesheetRules';

/**
 * MM-253, rules 1 to 3: the section is the second tier (an icon, a heading
 * and rows on the canvas), it folds to its one line and opens on press,
 * and the rhythm strip says every day and its state aloud.
 */
const ui = 'src/ui/ui.css';

describe('a section', () => {
  it('is a labelled region with its heading, never a card', () => {
    render(
      <MmSection icon="tape" title="Waist" summary="Latest: 34 in on Oct 5.">
        <p>Three fields</p>
      </MmSection>,
    );
    const region = screen.getByRole('region', { name: 'Waist' });
    expect(within(region).getByRole('heading', { level: 2, name: 'Waist' })).toBeInTheDocument();
    expect(region).toHaveClass('mm-section');
    expect(region.closest('.mm-surface')).toBeNull();
    expect(screen.getByText('Three fields')).toBeVisible();
  });

  it('folded, shows its line and opens on press; a due section starts open', async () => {
    render(
      <MmSection icon="heart" title="How you are holding up" summary="Last answered yesterday." collapsible initiallyExpanded={false}>
        <p>Five lines</p>
      </MmSection>,
    );
    expect(screen.getByText('Last answered yesterday.')).toBeVisible();
    expect(screen.queryByText('Five lines')).toBeNull();
    const toggle = screen.getByRole('button', { name: /^How you are holding up/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Five lines')).toBeVisible();
  });

  it('with maintainState, what is inside stays while folded', async () => {
    render(
      <MmSection icon="lunch" title="Lunch" collapsible maintainState>
        <p>Rice</p>
      </MmSection>,
    );
    await userEvent.click(screen.getByRole('button', { name: /^Lunch(?!:)/ }));
    expect(screen.getByText('Rice')).not.toBeVisible();
  });

  it('opening something else, the header is a button named by the title alone', async () => {
    const open = vi.fn();
    render(<MmSection icon="speed" title="Weekly training volume" summary="Chest 12 · Back 9" onPress={open} />);
    await userEvent.click(screen.getByRole('button', { name: 'Weekly training volume' }));
    expect(open).toHaveBeenCalledOnce();
  });

  it('draws its icon at 24 dp in the header and its heading in the heading role', () => {
    expect(declarationsOf(ui, '.mm-section-title')).toMatch(/font: var\(--type-heading\)/);
    const head = rules(readFileSync(ui, 'utf8')).find((rule) => rule.selectors.includes('.mm-section-head-body'));
    expect(head?.body).toMatch(/min-height: 48px/);
  });
});

describe('the rhythm strip', () => {
  const days = ['M', 'Tu', 'W'].map((letter, i) => ({
    key: String(i),
    letter,
    label: `${letter}: ${['logged and marked complete', 'partly logged', 'nothing logged'][i]}`,
    mark: (['full', 'half', 'none'] as const)[i]!,
    today: i === 2,
  }));

  it('names the group and every day with its state, and marks today', () => {
    render(<MmRhythmStrip name="Last seven days" days={days} />);
    const group = screen.getByRole('group', { name: 'Last seven days' });
    expect(within(group).getAllByRole('img').map((day) => day.getAttribute('aria-label'))).toEqual([
      'M: logged and marked complete',
      'Tu: partly logged',
      'W: nothing logged',
    ]);
    expect(group.querySelectorAll('.mm-rhythm-full')).toHaveLength(1);
    expect(group.querySelectorAll('.mm-rhythm-half')).toHaveLength(1);
    expect(group.querySelectorAll('.mm-rhythm-today')).toHaveLength(1);
  });

  it('pressable, each day is a 48 dp button that gives back its key', async () => {
    const chosen: string[] = [];
    render(<MmRhythmStrip name="Last seven days" days={days} onSelect={(key) => chosen.push(key)} />);
    await userEvent.click(screen.getByRole('button', { name: 'Tu: partly logged' }));
    expect(chosen).toEqual(['1']);
    expect(screen.getByRole('button', { name: 'W: nothing logged' })).toHaveAttribute('aria-current', 'date');
    expect(declarationsOf(ui, '.mm-rhythm-day')).toMatch(/min-height: 48px/);
  });
});
