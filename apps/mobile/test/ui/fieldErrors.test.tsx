import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MetricFacts } from '../../src/ui/MetricFacts';
import { MmOverlays } from '../../src/ui/MmOverlays';
import { MmTextField } from '../../src/ui/MmTextField';
import { NumberEntry } from '../../src/ui/NumberEntry';

/**
 * MM-279: a field's error is beside it, described to it and spoken; the
 * number card explains itself under the field and keeps the keyboard; a
 * facts list pairs label and value in order.
 */
describe('a field with an error', () => {
  it('shows the message under the field, marks the field invalid and announces it', () => {
    render(<MmTextField label="Weight" value="5" onChange={() => undefined} error="That value looks off." helper="This morning." />);
    const field = screen.getByRole('textbox', { name: 'Weight' });
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription('That value looks off. This morning.');
    expect(screen.getByRole('alert')).toHaveTextContent('That value looks off.');
    expect(screen.getByRole('alert')).toHaveClass('mm-field-error');
    expect(field.closest('.mm-field-box')).toHaveClass('mm-field-box-error');
  });

  it('a spoken name composes with the visible label rather than replacing it', () => {
    const { rerender } = render(<MmTextField label="Left" name="Left waist reading" value="" onChange={() => undefined} />);
    expect(screen.getByRole('textbox', { name: 'Left waist reading' })).toBeInTheDocument();
    rerender(<MmTextField label="Reps" name="How many" value="" onChange={() => undefined} />);
    expect(screen.getByRole('textbox', { name: 'Reps, How many' })).toBeInTheDocument();
  });
});

// MM-284: the unit after a value is part of what a screen reader hears for the field.
describe('a field with a unit', () => {
  it('says the unit in its description', () => {
    render(<MmTextField name="Today's weigh-in" kind="number" suffix="lb" value="" onChange={() => undefined} />);
    expect(screen.getByRole('textbox', { name: "Today's weigh-in" })).toHaveAccessibleDescription(/lb/);
  });
});

describe('the number entry', () => {
  it('explains an inert Save under the field, and a refusal, keeping the keyboard in the field', async () => {
    render(
      <MmOverlays>
        <NumberEntry
          title="Today's weigh-in"
          unit="lb"
          initial={undefined}
          hint="First thing."
          onSave={async () => {
            throw new Error('too light');
          }}
        />
      </MmOverlays>,
    );
    const field = screen.getByRole('textbox', { name: "Today's weigh-in" });
    await userEvent.type(field, 'heavy');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a number above zero.');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await userEvent.clear(field);
    await userEvent.type(field, '5');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('That value looks off. Check it.');
    expect(screen.getByRole('alert').closest('.mm-number-entry-block')).not.toBeNull();
    await userEvent.type(field, '0');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

// MM-295: the hint is how to take the number, so it is heard with the field.
// MM-296: the keyboard's action key saves, as Save does; never while the value is not a number.
describe('the number entry, heard and submitted', () => {
  it('describes the field with its hint', () => {
    render(<NumberEntry title="Today's weigh-in" unit="lb" initial={undefined} hint="First thing." onSave={async () => undefined} />);
    expect(screen.getByRole('textbox', { name: "Today's weigh-in" })).toHaveAccessibleDescription(/First thing\./);
  });

  it('saves on the keyboard action key, and only a number', async () => {
    const saved: number[] = [];
    render(
      <NumberEntry
        title="Today's weigh-in"
        unit="lb"
        initial={undefined}
        hint="First thing."
        onSave={async (value) => {
          saved.push(value);
        }}
      />,
    );
    const field = screen.getByRole('textbox', { name: "Today's weigh-in" });
    expect(field).not.toHaveAttribute('enterkeyhint');
    await userEvent.type(field, 'heavy{Enter}');
    expect(saved).toEqual([]);
    await userEvent.clear(field);
    await userEvent.type(field, '181.4');
    expect(field).toHaveAttribute('enterkeyhint', 'done');
    await userEvent.type(field, '{Enter}');
    expect(saved).toEqual([181.4]);
  });
});

describe('metric facts', () => {
  it('puts each label before its value', () => {
    const { container } = render(<MetricFacts facts={[['Trend weight', '184.1 lb']]} />);
    const fact = container.querySelector('.mm-metric-fact') as HTMLElement;
    expect(fact.firstElementChild?.tagName).toBe('DT');
    expect(fact.lastElementChild?.tagName).toBe('DD');
  });
});
