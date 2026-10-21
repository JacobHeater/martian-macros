import { useContext, useState } from 'react';
import { MeasurementSite } from '../domain/measurements/MeasurementSite';
import { middleReading } from '../engine/middleReading';
import { Fmt } from '../format/Fmt';
import { parseNumber } from '../format/parseNumber';
import { siteLabel } from '../format/siteLabel';
import { CloseScreenContext } from '../app/CloseScreenContext';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MeasurementSiteFigure } from '../ui/MeasurementSiteFigure';
import { MmButton } from '../ui/MmButton';
import { MmDisclosure } from '../ui/MmDisclosure';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmTextField } from '../ui/MmTextField';
import { useOverlays } from '../ui/useOverlays';
import './progress.css';

const places = ['1st', '2nd', '3rd'] as const;

/** How many measurements of a site its drawing is shown for in full; from then on it is one tap down (MM-155). */
const drawingShownFor = 3;

/** One site's typed readings: undefined while none are typed, the numbers when one or three are, or 'invalid'. */
function readingsOf(texts: readonly string[]): readonly number[] | 'invalid' | undefined {
  const typed = texts.filter((text) => text.trim() !== '').map((text) => parseNumber(text));
  if (typed.length === 0) return undefined;
  const valid = typed.filter((value): value is number => value !== undefined && value > 0);
  return valid.length === typed.length && (valid.length === 1 || valid.length === 3) ? valid : 'invalid';
}

/**
 * The measuring session (MM-156): every site the user measures on one
 * screen, in a fixed order, the waist first, so the weekly routine takes a
 * minute. Each site has its instruction and drawing and the waist's entry
 * (MM-155, the sibling `WaistEntryCard`): three readings of which the
 * middle is kept, or one for a quick entry. One Save stores each site
 * typed; a site left empty is not measured today.
 */
export function MeasurementSessionScreen() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const close = useContext(CloseScreenContext);
  const today = useCell(state.today);
  const setup = useLoaded(state.setup);
  const settings = useLoaded(state.measurementSettings);
  const measurements = useLoaded(state.measurements) ?? [];
  const [typed, setTyped] = useState<Readonly<Record<string, readonly string[]>>>({});
  if (setup === undefined || settings === undefined) return <Screen title="Measure">{null}</Screen>;
  const fmt = new Fmt(setup.unitSystem);
  const unit = fmt.imperial ? 'inches' : 'centimeters';
  const sites = MeasurementSite.values.filter((site) => site === 'waist' || settings.sites.has(site));
  const readings = sites.map((site) => ({ site, readings: readingsOf(typed[site] ?? ['', '', '']) }));
  const ready = readings.every((r) => r.readings !== 'invalid') && readings.some((r) => r.readings !== undefined);

  const save = async () => {
    const toSave = readings.flatMap(({ site, readings: values }) =>
      values === undefined || values === 'invalid' ? [] : [{ site, cm: values.map((value) => fmt.lengthToCm(value)) }],
    );
    const off = toSave.find(({ site, cm }) => cm.some((value) => !MeasurementSite.plausible(site, value)));
    if (off !== undefined) {
      overlays.snack(`That ${siteLabel(off.site).toLowerCase()} value looks off. Check it.`);
      return;
    }
    for (const { site, cm } of toSave) {
      await services.measurements.saveMeasurement(site, today, middleReading(cm), { readings: cm });
    }
    overlays.snack(toSave.length === 1 ? 'Saved 1 measurement.' : `Saved ${toSave.length} measurements.`);
    close?.();
  };

  return (
    <Screen title="Measure">
      <p className="app-text">
        {`Three readings of each in ${unit}; the middle one is kept. One reading is kept as it is. Leave a site empty to skip it today.`}
      </p>
      {sites.map((site) => {
        const label = siteLabel(site, settings.limbSide);
        const facts = MeasurementSite.facts(site);
        const entries = measurements.filter((o) => o.site === site).length;
        const figure = (
          <div className="progress-waist-protocol">
            <MeasurementSiteFigure site={site} />
          </div>
        );
        const values = typed[site] ?? ['', '', ''];
        return (
          <section key={site} className="progress-session-site" aria-label={label}>
            <h3 className="progress-waist-chart-title">{label}</h3>
            <p className="app-caption">{facts.instruction}</p>
            {entries < drawingShownFor ? figure : <MmDisclosure title="How to measure">{figure}</MmDisclosure>}
            <MmListGroup>
              <MmListRow
                title={`Today’s ${label.toLowerCase()}`}
                entry={
                  <div className="progress-waist-fields">
                    {places.map((place, i) => (
                      <MmTextField
                        key={place}
                        label={place}
                        name={`${place} ${label.toLowerCase()} reading, ${unit}`}
                        kind="number"
                        dense
                        value={values[i] ?? ''}
                        onChange={(text) =>
                          setTyped({ ...typed, [site]: values.map((value, at) => (at === i ? text : value)) })
                        }
                      />
                    ))}
                  </div>
                }
              />
            </MmListGroup>
          </section>
        );
      })}
      <div className="app-gap" />
      <MmButton label="Save measurements" expand onPress={ready ? () => void save() : undefined} />
    </Screen>
  );
}
