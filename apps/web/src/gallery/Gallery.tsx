import { MmAppBar } from '../ui/MmAppBar';
import { MmButton } from '../ui/MmButton';
import { MmIconButton } from '../ui/MmIconButton';
import { MmNavigationBar } from '../ui/MmNavigationBar';
import { MmSurface } from '../ui/MmSurface';
import { destinations } from '../app/destinations';
import './gallery.css';

const COLORS = [
  'canvas', 'surface', 'raised', 'overlay', 'sunken', 'track', 'selected', 'outline', 'outline-strong',
  'text', 'text2', 'text3', 'ember', 'on-ember', 'ion', 'on-ion', 'energy', 'protein', 'carbs', 'fat',
  'positive', 'caution', 'info', 'danger', 'on-danger',
] as const;

const TYPE = ['figure-xl', 'figure', 'title', 'heading', 'body', 'label', 'caption'] as const;
const PALETTES = ['martian', 'dark', 'light'] as const;

/**
 * Every token and component as built, in each palette (MM-105). This is the
 * real thing, not a drawing of it: what is shown here is what a screen gets.
 */
export function Gallery() {
  return (
    <div className="gallery">
      {PALETTES.map((palette) => (
        <section key={palette} className={`gallery-palette theme-${palette}`} aria-label={`${palette} palette`}>
          <h2 className="gallery-title">{palette}</h2>
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
          <div className="gallery-row">
            <MmButton label="Primary" onPress={() => undefined} />
            <MmButton label="Primary off" />
            <MmButton label="Secondary" kind="secondary" onPress={() => undefined} />
            <MmButton label="Text" kind="text" onPress={() => undefined} />
            <MmIconButton icon="settings" label="Settings" onPress={() => undefined} />
          </div>
          <MmSurface>A surface</MmSurface>
          <MmAppBar title="An app bar" />
          <MmNavigationBar destinations={destinations} current="progress" onSelect={() => undefined} />
        </section>
      ))}
    </div>
  );
}
