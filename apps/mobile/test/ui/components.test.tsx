import { FormatError } from '../../src/lang/FormatError';
import AddOutlined from '@mui/icons-material/AddOutlined';
import { readFileSync } from 'node:fs';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { ChoiceCard } from '../../src/ui/ChoiceCard';
import { DayStepper } from '../../src/ui/DayStepper';
import { DownloadStatusStrip } from '../../src/ui/DownloadStatusStrip';
import { MacroBar } from '../../src/ui/MacroBar';
import { MmDisclosure } from '../../src/ui/MmDisclosure';
import { MmFab } from '../../src/ui/MmFab';
import { MmIconButton } from '../../src/ui/MmIconButton';
import { MmMenuButton } from '../../src/ui/MmMenuButton';
import { MmOverlays } from '../../src/ui/MmOverlays';
import { MmSegmented } from '../../src/ui/MmSegmented';
import { MmSwitchRow } from '../../src/ui/MmSwitchRow';
import { MmTextField } from '../../src/ui/MmTextField';
import { Notice } from '../../src/ui/Notice';
import { NumberEntry } from '../../src/ui/NumberEntry';
import type { Overlays } from '../../src/ui/Overlays';
import { StepProgress } from '../../src/ui/StepProgress';
import { useOverlays } from '../../src/ui/useOverlays';
import { turnDrum } from '../support/pickers';

/** MM-232: the component library, by what a person sees, hears and does. */
const css = readFileSync('src/ui/ui.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** The declarations of the last rule in ui.css whose selector is exactly `selector`. */
function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const found = [...css.matchAll(new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`, 'g'))];
  expect(found.length, `ui.css has no rule for ${selector}`).toBeGreaterThan(0);
  return found.map((match) => match[1]).join('\n');
}

describe('the floating action', () => {
  // Carried over from mm_fab_test.dart (MM-181).
  it('has no glow or elevation, and does its action', async () => {
    let pressed = false;
    render(<MmFab label="Add food" icon="plus" onPress={() => (pressed = true)} />);
    expect(rule('.mm-fab')).not.toMatch(/box-shadow|filter/);
    await userEvent.click(screen.getByRole('button', { name: 'Add food' }));
    expect(pressed).toBe(true);
  });
});

describe('the add button', () => {
  // Carried over from mm_icon_button_test.dart. Sizes and colors are read from the stylesheet:
  // the test browser lays nothing out.
  it('is a drawn plus on a small quiet plate in a full-size target, and fills Ember on hover (MM-276)', () => {
    render(<MmIconButton icon="plus" kind="add" label="Add food to lunch" onPress={() => undefined} />);
    const button = screen.getByRole('button', { name: 'Add food to lunch' });
    const drawing = button.querySelector('svg');
    expect(drawing?.getAttribute('style')).toContain('width: 16px');
    // Material's Add, through MmIcon (MM-236).
    const plus = render(<AddOutlined />);
    expect(drawing?.innerHTML).toBe(plus.container.querySelector('svg')?.innerHTML);
    plus.unmount();

    expect(rule('.mm-icon-button')).toMatch(/width: 48px;[\s\S]*height: 48px;/);
    const plate = rule('.mm-icon-button-plate');
    expect(plate).toMatch(/width: 28px;[\s\S]*height: 28px;[\s\S]*border-radius: var\(--radius-chip\);/);
    expect(plate).toContain('background: var(--selected);');
    expect(plate).toContain('color: var(--ember);');
    expect(css).toMatch(
      /\.mm-icon-button-add:not\(:disabled\):hover \.mm-icon-button-plate,[\s\S]*?\{\s*background: var\(--ember\);\s*color: var\(--on-ember\);/,
    );
  });

  it('with no action is off', () => {
    render(<MmIconButton icon="plus" kind="add" label="Add" onPress={undefined} />);
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
  });
});

describe('a text field', () => {
  function Field(props: { kind?: 'text' | 'number'; helper?: string; warning?: boolean }) {
    const [value, setValue] = useState('');
    return (
      <MmTextField
        label="Weight"
        suffix="kg"
        value={value}
        onChange={setValue}
        kind={props.kind ?? 'text'}
        helper={props.helper}
        helperIsWarning={props.warning ?? false}
      />
    );
  }

  it('is named by its label, takes what is typed, and shows its unit', async () => {
    render(<Field />);
    const field = screen.getByRole('textbox', { name: 'Weight' });
    await userEvent.type(field, '82.5');
    expect(field).toHaveValue('82.5');
    expect(screen.getByText('kg')).toBeInTheDocument();
  });

  it('asks for the number keyboard for a number, and describes itself with its helper', () => {
    render(<Field kind="number" helper="That looks high." warning />);
    const field = screen.getByRole('textbox', { name: 'Weight' });
    expect(field).toHaveAttribute('inputmode', 'decimal');
    // The unit is part of the description (MM-284), then the helper.
    expect(field).toHaveAccessibleDescription('kg That looks high.');
    expect(screen.getByText('That looks high.')).toHaveClass('mm-field-helper-warning');
  });
});

describe('a segmented choice', () => {
  function Choice({ allowEmpty = false }: { allowEmpty?: boolean }) {
    const [unit, setUnit] = useState<string | undefined>('lb');
    return (
      <MmSegmented
        name="Units"
        segments={[
          { value: 'lb', label: 'Pounds' },
          { value: 'kg', label: 'Kilograms' },
        ]}
        selected={unit}
        onChange={setUnit}
        allowEmpty={allowEmpty}
      />
    );
  }

  it('says which is chosen, and changes when another is pressed', async () => {
    render(<Choice />);
    const group = screen.getByRole('group', { name: 'Units' });
    expect(within(group).getByRole('button', { name: 'Pounds' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(within(group).getByRole('button', { name: 'Kilograms' }));
    expect(within(group).getByRole('button', { name: 'Kilograms' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(group).getByRole('button', { name: 'Pounds' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('keeps its choice when the chosen one is pressed again, unless it may be empty', async () => {
    const { unmount } = render(<Choice />);
    await userEvent.click(screen.getByRole('button', { name: 'Pounds' }));
    expect(screen.getByRole('button', { name: 'Pounds' })).toHaveAttribute('aria-pressed', 'true');
    unmount();

    render(<Choice allowEmpty />);
    await userEvent.click(screen.getByRole('button', { name: 'Pounds' }));
    expect(screen.getByRole('button', { name: 'Pounds' })).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('a switch', () => {
  it('is a switch named by its title, and reports the change', async () => {
    const seen: boolean[] = [];
    render(<MmSwitchRow title="Weigh-in reminder" subtitle="Every morning" value={false} onChange={(v) => seen.push(v)} />);
    const control = screen.getByRole('switch', { name: /Weigh-in reminder/ });
    expect(control).not.toBeChecked();
    await userEvent.click(control);
    expect(seen).toEqual([true]);
  });
});

describe('a disclosure', () => {
  it('is closed until pressed, says so, and shows what is inside when open', async () => {
    render(
      <MmDisclosure title="How this was worked out">
        <p>From your last fourteen days.</p>
      </MmDisclosure>,
    );
    const toggle = screen.getByRole('button', { name: 'How this was worked out' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('From your last fourteen days.')).not.toBeInTheDocument();
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('From your last fourteen days.')).toBeVisible();
  });
});

describe('a menu', () => {
  it('opens its choices, gives the one chosen and closes; Escape closes it too', async () => {
    const chosen: string[] = [];
    render(
      <MmOverlays>
        <MmMenuButton
          icon="more"
          label="More"
          items={[
            { value: 'copy', label: 'Copy to today' },
            { value: 'delete', label: 'Delete' },
          ]}
          onSelect={(value) => chosen.push(value)}
        />
      </MmOverlays>,
    );
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'More' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(chosen).toEqual(['delete']);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'More' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

describe('what is said in words, not by color alone', () => {
  it('a macro bar states its grams, minimum and target', () => {
    const { rerender } = render(<MacroBar macro="protein" grams={120.4} target={160} minimum={140} emphasized />);
    expect(screen.getByText('Protein')).toBeInTheDocument();
    expect(screen.getByText('120 g · min 140 · target 160')).toBeInTheDocument();
    rerender(<MacroBar macro="carbs" grams={99.5} target={200} />);
    expect(screen.getByText('100 / 200 g')).toBeInTheDocument();
    rerender(<MacroBar macro="fat" grams={30} />);
    expect(screen.getByText('30 g')).toBeInTheDocument();
  });

  it('a notice carries its kind as a word', () => {
    const { rerender } = render(<Notice text="Targets hold while the app learns." />);
    expect(screen.queryByText('Heads up')).not.toBeInTheDocument();
    rerender(<Notice kind="caution" text="Talk to your care team." />);
    expect(screen.getByText('Heads up')).toBeInTheDocument();
    rerender(<Notice kind="safeguard" title="Check with your clinician" text="Before a deficit." />);
    expect(screen.getByText('Important')).toBeInTheDocument();
    expect(screen.getByText('Check with your clinician')).toBeInTheDocument();
  });

  it('progress through steps is a count of steps', () => {
    render(<StepProgress current={2} count={6} />);
    expect(screen.getByRole('img', { name: 'Step 3 of 6' })).toBeInTheDocument();
  });

  it('a chosen card says it is chosen', () => {
    render(<ChoiceCard label="Fat loss" detail="Lose fat steadily." badge="Suggested" selected onPress={() => undefined} />);
    expect(screen.getByRole('button', { name: /Fat loss/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Suggested')).toBeInTheDocument();
  });

  it('a download says how far along it is, and cannot be stopped once past that point', () => {
    const { rerender } = render(<DownloadStatusStrip label="Downloading foods" fraction={0.426} onCancel={() => undefined} />);
    // What a screen reader hears moves in ten-percent steps (MM-384), so 42.6% is spoken as 40.
    expect(screen.getByRole('status')).toHaveTextContent('Downloading foods, 40 percent');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
    rerender(<DownloadStatusStrip label="Installing" fraction={1} onCancel={undefined} />);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });
});

describe('stepping between days', () => {
  it('the day is a way back to today except on today, and an end of the range is off', async () => {
    let back = 0;
    const { rerender } = render(
      <DayStepper label="Yesterday" onPrevious={() => undefined} onNext={() => undefined} onLabelPress={() => back++} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Yesterday' }));
    expect(back).toBe(1);

    rerender(<DayStepper label="Today" onPrevious={() => undefined} onNext={undefined} onLabelPress={undefined} />);
    expect(screen.queryByRole('button', { name: 'Today' })).not.toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next day' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous day' })).toBeEnabled();
  });
});

describe('entering one number', () => {
  const card = (onSave: (value: number) => Promise<void>, initial?: string) => (
    <MmOverlays>
      <NumberEntry title="Today's weigh-in" unit="lb" initial={initial} hint="First thing in the morning." onSave={onSave} />
    </MmOverlays>
  );

  it('saves a number, typed with a comma or a point, and only once it has changed', async () => {
    const saved: number[] = [];
    render(card(async (value) => void saved.push(value), '181.4'));
    // With a value already saved there is no Save until it changes (MM-257): never a disabled primary.
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    const field = screen.getByRole('textbox', { name: /^Today's weigh-in/ });
    await userEvent.clear(field);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await userEvent.type(field, '180,6');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(saved).toEqual([180.6]);
  });

  it('refuses nothing, zero and words', async () => {
    render(card(async () => undefined));
    const field = screen.getByRole('textbox', { name: "Today's weigh-in" });
    for (const typed of ['0', '-3', 'heavy']) {
      await userEvent.clear(field);
      await userEvent.type(field, typed);
      expect(screen.getByRole('button', { name: 'Save' }), typed).toBeDisabled();
    }
  });

  it('says the value looks off when it is not accepted', async () => {
    render(
      card(async () => {
        throw new FormatError('too light to be real');
      }),
    );
    await userEvent.type(screen.getByRole('textbox', { name: "Today's weigh-in" }), '5');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('That value looks off. Check it.')).toBeInTheDocument();
  });
});

describe('questions over the screen', () => {
  function Asker({ ask }: { ask: (overlays: Overlays) => Promise<unknown> }) {
    const overlays = useOverlays();
    const [answer, setAnswer] = useState<string>('not asked');
    return (
      <>
        <button type="button" onClick={() => void ask(overlays).then((a) => setAnswer(JSON.stringify(a) ?? 'nothing'))}>
          Ask
        </button>
        <output>{answer}</output>
      </>
    );
  }
  const asking = async (ask: (overlays: Overlays) => Promise<unknown>) => {
    render(
      <MmOverlays>
        <Asker ask={ask} />
      </MmOverlays>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Ask' }));
    return screen.getByRole('dialog');
  };

  const erase = { title: 'Erase everything?', message: 'This cannot be undone.', confirmLabel: 'Erase' };

  it('a confirmation is true only when confirmed', async () => {
    const dialog = await asking((o) => o.confirm(erase));
    expect(dialog).toHaveAccessibleName('Erase everything?');
    expect(within(dialog).getByText('This cannot be undone.')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Erase' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
  });

  it('cancelling, or closing with Escape, is not a confirmation', async () => {
    const dialog = await asking((o) => o.confirm(erase));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('false')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Ask' }));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('false')).toBeInTheDocument();
  });

  it('a choice between two answers gives the one pressed, and nothing when closed', async () => {
    const question = {
      title: 'Keep these targets?',
      message: 'They may come down next week.',
      primaryLabel: 'Keep',
      primary: 'keep',
      secondaryLabel: 'Take the change',
      secondary: 'change',
    };
    const dialog = await asking((o) => o.choice(question));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Take the change' }));
    expect(screen.getByText('"change"')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Ask' }));
    await userEvent.keyboard('{Escape}');
    expect(screen.getByText('nothing')).toBeInTheDocument();
  });

  it('a list of options marks the chosen one in words, and gives the one pressed', async () => {
    const options = [
      { value: 60, label: '1:00' },
      { value: 120, label: '2:00' },
    ];
    const dialog = await asking((o) => o.options({ title: 'Rest', options, selected: 120 }));
    const chosen = within(dialog).getByRole('option', { name: /2:00/ });
    expect(chosen).toHaveAttribute('aria-selected', 'true');
    expect(within(chosen).getByText('Chosen')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('option', { name: '1:00' }));
    expect(screen.getByText('{"value":60,"label":"1:00"}')).toBeInTheDocument();
  });

  it('a time to the second opens on the time given and gives what the drums are turned to', async () => {
    const dialog = await asking((o) => o.clockTime({ title: 'Set started', initialMs: (18 * 3600 + 2 * 60 + 10) * 1000 }));
    expect(within(dialog).getByRole('spinbutton', { name: 'Hour' })).toHaveValue(6);
    expect(within(dialog).getByRole('spinbutton', { name: 'Minute' })).toHaveValue(2);
    expect(within(dialog).getByRole('spinbutton', { name: 'Second' })).toHaveValue(10);
    expect(within(dialog).getByRole('button', { name: 'PM' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(dialog).getByText('6:02:10 PM')).toBeInTheDocument();

    turnDrum(dialog, 'Hour', 12);
    await userEvent.click(within(dialog).getByRole('button', { name: 'AM' }));
    turnDrum(dialog, 'Second', 0, 2);
    await userEvent.click(within(dialog).getByRole('button', { name: 'OK' }));
    // Twelve in the morning is the first hour of the day.
    expect(screen.getByText(String(2 * 60 * 1000))).toBeInTheDocument();
  });

  it('a time of day gives minutes after midnight, said back in words', async () => {
    const dialog = await asking((o) => o.timeOfDay({ initialMinuteOfDay: 7 * 60 + 30, helpText: 'Weigh-in reminder' }));
    expect(dialog).toHaveAccessibleName('Weigh-in reminder');
    expect(within(dialog).getByRole('spinbutton', { name: 'Hour' })).toHaveValue(7);
    expect(within(dialog).getByRole('spinbutton', { name: 'Minute' })).toHaveValue(30);
    expect(within(dialog).getByText('7:30 AM')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'OK' }));
    expect(screen.getByText('450')).toBeInTheDocument();
  });

  it('a short message is shown with its action, which is done once', async () => {
    let undone = 0;
    render(
      <MmOverlays>
        <Asker ask={async (o) => o.snack('Oats removed.', { label: 'Undo', onAction: () => undone++ })} />
      </MmOverlays>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Ask' }));
    expect(screen.getByText('Oats removed.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(undone).toBe(1);
    expect(screen.queryByText('Oats removed.')).not.toBeInTheDocument();
  });
});
