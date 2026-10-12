import type { MuscleVolume } from '../engine/MuscleVolume';
import { clamp } from '../lang/clamp';
import { toStringAsFixed } from '../lang/toStringAsFixed';
import './ui.css';

const sets = (value: number) => (Number.isInteger(value) ? String(value + 0) : toStringAsFixed(value, 1));

/**
 * One muscle group's hard sets over the last seven days: the count in
 * words, and a bar against the typical 10 to 20 range with a thin marker
 * for the seven days before.
 */
export function MuscleVolumeRow({ volume }: { volume: MuscleVolume }) {
  const name = volume.group;
  const label = `${name.charAt(0).toUpperCase()}${name.substring(1)}`;
  const delta = volume.change;
  const maximum = Math.max(20, volume.currentSets, volume.previousSets);
  const percent = (value: number) => `${clamp(value / maximum, 0, 1) * 100}%`;
  return (
    <div className="mm-volume-row">
      <p className="mm-volume-head">
        <span>{label}</span>
        <span>{sets(volume.currentSets)} hard sets</span>
      </p>
      <p className="mm-volume-detail">
        Previous: {sets(volume.previousSets)} · change: {delta > 0 ? '+' : ''}
        {sets(delta)}
      </p>
      <div
        className="mm-volume-bar"
        role="img"
        aria-label={
          `${label}: ${sets(volume.currentSets)} current hard sets; ` +
          `${sets(volume.previousSets)} previous. Typical reference 10 to 20.`
        }
      >
        <span className="mm-volume-reference" style={{ left: percent(10), width: percent(10) }} />
        <span className="mm-volume-current" style={{ width: percent(volume.currentSets) }} />
        <span className="mm-volume-previous" style={{ left: `min(${percent(volume.previousSets)}, calc(100% - 2px))` }} />
      </div>
    </div>
  );
}
