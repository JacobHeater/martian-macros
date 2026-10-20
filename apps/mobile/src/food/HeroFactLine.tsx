import '../ui/ui.css';

/**
 * One fact of the day inside the calorie hero, drawn as the macro rows above
 * it are: the name at the start, the figures at the end (MM-336, the panel's
 * PD-3). Fiber against its guide; alcohol, which is in the day's total.
 */
export function HeroFactLine({ name, figures }: { name: string; figures: string }) {
  return (
    <div className="mm-macro-bar-head food-hero-fact">
      <span className="mm-macro-bar-name">{name}</span>
      <span className="mm-macro-bar-figures">{figures}</span>
    </div>
  );
}
