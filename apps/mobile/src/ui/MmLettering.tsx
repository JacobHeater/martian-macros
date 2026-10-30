import lettering from '../assets/brand/lettering.png';
import './ui.css';

/**
 * The Martian Macros lettering, the owner's art (MM-704), drawn across the
 * width it is given. Decoration: whatever carries it says its own name, so
 * a screen reader passes it by.
 */
export function MmLettering() {
  return <img className="mm-lettering" src={lettering} alt="" aria-hidden="true" />;
}
