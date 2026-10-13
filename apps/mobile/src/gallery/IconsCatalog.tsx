import type { MmIconName } from '../ui/MmIconName';
import { MmIcon } from '../ui/MmIcon';
import { mmIcons } from '../ui/mmIcons';
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
    </div>
  );
}
