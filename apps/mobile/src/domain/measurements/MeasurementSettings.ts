import type { LimbSide } from './LimbSide';
import type { MeasurementSite } from './MeasurementSite';

interface MeasurementSettingsInit {
  sites?: Iterable<MeasurementSite>;
  limbSide?: LimbSide | undefined;
  suggestionAnswered?: boolean;
}

/**
 * Which sites beyond the waist the user measures, the side limbs are
 * measured on, and whether the one-time suggestion has been answered
 * (MM-156). Waist is always measured, so it is never in `sites`.
 */
export class MeasurementSettings {
  readonly sites: ReadonlySet<MeasurementSite>;
  /** Undefined until a limb is first added. */
  readonly limbSide: LimbSide | undefined;
  /** Once true, the suggested sites are not offered again, whatever the answer was. */
  readonly suggestionAnswered: boolean;

  constructor(init: MeasurementSettingsInit = {}) {
    this.sites = new Set([...(init.sites ?? [])].filter((site) => site !== 'waist'));
    this.limbSide = init.limbSide;
    this.suggestionAnswered = init.suggestionAnswered ?? false;
  }

  static readonly none = new MeasurementSettings();

  copyWith(changes: { sites?: Iterable<MeasurementSite>; limbSide?: LimbSide; suggestionAnswered?: boolean }): MeasurementSettings {
    return new MeasurementSettings({
      sites: changes.sites ?? this.sites,
      limbSide: changes.limbSide ?? this.limbSide,
      suggestionAnswered: changes.suggestionAnswered ?? this.suggestionAnswered,
    });
  }
}
