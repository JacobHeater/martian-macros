import './gallery.css';

const COLORS = [
  'canvas', 'surface', 'raised', 'overlay', 'sunken', 'track', 'selected', 'outline', 'outline-strong',
  'text', 'text2', 'text3', 'ember', 'on-ember', 'ion', 'on-ion', 'energy', 'protein', 'carbs', 'fat',
  'positive', 'caution', 'info', 'danger', 'on-danger', 'water',
  'grade-a', 'grade-b', 'grade-c', 'grade-d', 'on-grade',
] as const;

const TYPE = ['figure-xl', 'figure', 'title', 'heading', 'body', 'label', 'caption'] as const;

/** Every color token and type role as built, in the palette chosen above. */
export function TokensCatalog() {
  return (
    <div className="gallery">
      <div className="gallery-swatches">
        {COLORS.map((color) => (
          <div key={color} className="gallery-swatch">
            <span style={{ background: `var(--${color})` }} />
            {color}
          </div>
        ))}
      </div>
      {TYPE.map((role) => (
        <p key={role} className="gallery-type" style={{ font: `var(--type-${role})` }}>
          {role} 1,534 kcal 184.1 lb
        </p>
      ))}
    </div>
  );
}
