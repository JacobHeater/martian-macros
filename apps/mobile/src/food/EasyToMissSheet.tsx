import { MmButton } from '../ui/MmButton';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import type { EasyToMissAnswer } from './EasyToMissAnswer';
import './food.css';

/** The things people most often forget to log (MM-152), each with where add-food opens for it. */
const items: readonly { title: string; answer: EasyToMissAnswer }[] = [
  { title: 'Cooking oil', answer: { kind: 'add', query: 'oil' } },
  { title: 'Drinks', answer: { kind: 'add', query: 'drink' } },
  { title: 'Sauces', answer: { kind: 'add', query: 'sauce' } },
  { title: 'Bites and tastes', answer: { kind: 'add', estimateSize: 'light' } },
];

/**
 * Asked as a day is marked complete (MM-575, the owner): the easy-to-miss
 * foods, each opening add-food for it, and the one way on that marks the
 * day: nothing was missed. Closed, nothing is marked.
 */
export function EasyToMissSheet({ onAnswer }: { onAnswer: (answer: EasyToMissAnswer) => void }) {
  return (
    <div className="food-sheet">
      <h2 className="app-headline">Anything easy to miss?</h2>
      <MmListGroup>
        {items.map((item) => (
          <MmListRow key={item.title} title={item.title} opens onPress={() => onAnswer(item.answer)} />
        ))}
      </MmListGroup>
      <div className="food-easy-to-miss-confirm">
        <MmButton label="Nothing missed, mark complete" expand onPress={() => onAnswer({ kind: 'nothingMissed' })} />
      </div>
    </div>
  );
}
