import type { MmIconName } from './MmIconName';
import { mmIcons } from './mmIcons';

/** A decorative icon. Whatever carries it supplies the name a person hears. */
export function MmIcon({ name, size = 24 }: { name: MmIconName; size?: number }) {
  const Icon = mmIcons[name];
  return <Icon className="mm-icon" style={{ width: size, height: size }} aria-hidden focusable="false" />;
}
