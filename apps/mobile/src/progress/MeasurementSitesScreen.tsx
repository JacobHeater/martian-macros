import type { LimbSide } from '../domain/measurements/LimbSide';
import { MeasurementSite } from '../domain/measurements/MeasurementSite';
import { siteLabel } from '../format/siteLabel';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { MmListGroup } from '../ui/MmListGroup';
import { MmSwitchRow } from '../ui/MmSwitchRow';
import { useOverlays } from '../ui/useOverlays';
import './progress.css';

/**
 * Which sites beyond the waist the user measures (MM-156), each off until
 * added, as Nutrition goals' switches are (the sibling, rule 9). The first
 * limb added asks which side: limbs are measured on that one side from then
 * on, so every entry is of the same limb. Any site can be added here, with
 * or without a suggestion.
 */
export function MeasurementSitesScreen() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const settings = useLoaded(state.measurementSettings);
  if (settings === undefined) return <Screen title="Measurement sites">{null}</Screen>;

  const turn = async (site: MeasurementSite, on: boolean) => {
    let limbSide = settings.limbSide;
    if (on && MeasurementSite.isLimb(site) && limbSide === undefined) {
      limbSide = await overlays.choice<LimbSide>({
        title: 'Which side?',
        message: 'Limbs are measured on one side, the same one every time, so a change is the limb’s and not the tape’s.',
        primaryLabel: 'Left',
        primary: 'left',
        secondaryLabel: 'Right',
        secondary: 'right',
      });
      if (limbSide === undefined) return;
    }
    const sites = new Set(settings.sites);
    if (on) sites.add(site);
    else sites.delete(site);
    await services.measurementSettings.saveMeasurementSettings(
      settings.copyWith(limbSide === undefined ? { sites } : { sites, limbSide }),
    );
  };

  return (
    <Screen title="Measurement sites">
      <p className="app-text">
        Waist is always measured. Add any of these to measure in the same session; each is off until you add it.
      </p>
      <p className="app-caption">Neck, and hips for a female profile, are what the tape method of estimating body fat needs.</p>
      <MmListGroup>
        {MeasurementSite.optional.map((site) => (
          <MmSwitchRow
            key={site}
            title={siteLabel(site, settings.limbSide)}
            subtitle={MeasurementSite.facts(site).instruction}
            value={settings.sites.has(site)}
            onChange={(on) => void turn(site, on)}
          />
        ))}
      </MmListGroup>
      {settings.limbSide === undefined ? null : (
        <p className="app-caption">{`Limbs are measured on the ${settings.limbSide} side.`}</p>
      )}
    </Screen>
  );
}
