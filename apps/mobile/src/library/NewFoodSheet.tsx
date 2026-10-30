import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import type { NewFoodRoute } from './NewFoodRoute';
import '../food/food.css';

interface NewFoodSheetProps {
  /** Called with the way chosen; the sheet is then closed by its opener. */
  onChoose: (route: NewFoodRoute) => void;
}

/**
 * The ways to make a new food, from the Library's "New food" (MM-706): with
 * the person's own AI (MM-708), read a label (MM-44), type it in (MM-45),
 * or a recipe. Each row opens its form, so each says it opens something.
 */
export function NewFoodSheet({ onChoose }: NewFoodSheetProps) {
  return (
    <div className="food-sheet">
      <h2 className="app-headline">New food</h2>
      <p className="app-caption">What you make here is yours to log in any amount, and is found first when you search.</p>
      <div className="app-gap-small" />
      <MmListGroup>
        <MmListRow leadingIcon="assistant" title="With my AI" subtitle="Answer a few questions, send a photo to your own assistant, and paste its answer back." opens onPress={() => onChoose('ai')} />
        <MmListRow leadingIcon="camera" title="Scan a label" subtitle="Photograph the Nutrition Facts panel; the numbers fill in for you to check." opens onPress={() => onChoose('label')} />
        <MmListRow leadingIcon="edit" title="Type it in" subtitle="Its name, what one serving is, and the numbers, by hand." opens onPress={() => onChoose('typed')} />
        <MmListRow leadingIcon="serving" title="New recipe" subtitle="Ingredients and how many servings it makes; one serving is worked out." opens onPress={() => onChoose('recipe')} />
      </MmListGroup>
    </div>
  );
}
