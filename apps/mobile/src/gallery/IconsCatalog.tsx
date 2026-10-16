import type { MmIconName } from '../ui/MmIconName';
import { MmIcon } from '../ui/MmIcon';
import { mmIcons } from '../ui/mmIcons';
import { ShakerBottleOutlined } from '../ui/ShakerBottleOutlined';
import './gallery.css';

/** Every icon beside its name, so a bad shape is seen here before a phone (MM-236). */
export function IconsCatalog() {
  return (
    <div className="gallery-icons">
      {(Object.keys(mmIcons) as MmIconName[]).map((name) => (
        <div key={name} className="gallery-icon">
          <MmIcon name={name} />
          {name}
        </div>
      ))}
      {/* Drawn for the app, not Material's: seen large, where a stray line shows (MM-335). */}
      <div className="gallery-icon-drawn">
        <ShakerBottleOutlined className="mm-icon" style={{ width: 48, height: 48 }} aria-hidden focusable="false" />
        protein, drawn for the app
      </div>
    </div>
  );
}
