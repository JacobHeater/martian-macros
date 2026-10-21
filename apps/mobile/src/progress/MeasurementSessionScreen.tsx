import { useContext, useEffect, useState } from 'react';
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
import { MmSection } from '../ui/MmSection';
import { MmTextField } from '../ui/MmTextField';
import { useOverlays } from '../ui/useOverlays';
import './progress.css';

const places = ['1st', '2nd', '3rd'] as const;

/** How many measurements of a site its drawing is shown for in full: the first session; from the second it is behind "How to measure" (MM-156). */
const drawingShownFor = 1;

/** One site's typed readings: undefined while none are typed, the numbers when one or three are, or 'invalid'. */
function readingsOf(texts: readonly string[]): readonly number[] | 'invalid' | undefined {
  const typed = texts.filter((text) => text.trim() !== '').map((text) => parseNumber(text));
  if (typed.length === 0) return undefined;
  const valid = typed.filter((value): value is number => value !== undefined && value > 0);
  return valid.length === typed.length && (valid.length === 1 || valid.length === 3) ? valid : 'invalid';
}

/** Which of a site's fields says what is wrong with its readings, and what: a value that is no length, or two of three typed. */
function invalidField(texts: readonly string[]): { at: number; text: string } | undefined {
  const bad = texts.findIndex((text) => {
    if (text.trim() === '') return false;
    const value = parseNumber(text);
    return value === undefined || value <= 0;
  });
  if (bad >= 0) return { at: bad, text: 'Type a length above 0.' };
  const empty = texts.findIndex((text) => text.trim() === '');
  return { at: empty < 0 ? 0 : empty, text: 'Type one reading, or all three.' };
}

/**
 * The measuring session (MM-156): every site the user measures on one
 * screen, in a fixed order, the waist first, so the weekly routine takes a
 * minute. Each site has its instruction and drawing and the waist's entry
 * (MM-155, the sibling `WaistEntryCard`): three readings of which the
 * middle is kept, or one for a quick entry. One Save stores each site
 * typed; a site left empty is not measured today. Each site is a section
 * with the tape's mark. A site left with two readings says on its field why
 * Save is off; a value no such site can be is said on its field, which takes
 * focus.
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
  // The sites whose fields focus has left: only then is what is wrong with them said (not while the second of three is typed).
  const [left, setLeft] = useState<ReadonlySet<string>>(new Set());
  // A reading no such site can be, found on Save: said on its field, which takes focus.
  const [off, setOff] = useState<{ site: MeasurementSite; at: number; name: string }>();
  useEffect(() => {
    if (off === undefined) return;
    document.querySelector<HTMLInputElement>(`input[aria-label="${off.name}"]`)?.focus();
  }, [off]);
  if (setup === undefined || settings === undefined) return <Screen title="Measure">{null}</Screen>;
  const fmt = new Fmt(setup.unitSystem);
  const unit = fmt.imperial ? 'inches' : 'centimeters';
  const sites = MeasurementSite.values.filter((site) => site === 'waist' || settings.sites.has(site));
  const readings = sites.map((site) => ({ site, readings: readingsOf(typed[site] ?? ['', '', '']) }));
  const ready = readings.every((r) => r.readings !== 'invalid') && readings.some((r) => r.readings !== undefined);

  const fieldName = (site: MeasurementSite, at: number) =>
    `${places[at] ?? ''} ${siteLabel(site, settings.limbSide).toLowerCase()} reading, ${unit}`;

  const save = async () => {
    // The first typed reading no such site can be: its field says so and takes focus, and nothing is saved.
    for (const site of sites) {
      const at = (typed[site] ?? []).findIndex((text) => {
        const value = text.trim() === '' ? undefined : parseNumber(text);
        return value !== undefined && !MeasurementSite.plausible(site, fmt.lengthToCm(value));
      });
      if (at >= 0) {
        setOff({ site, at, name: fieldName(site, at) });
        return;
      }
    }
    const toSave = readings.flatMap(({ site, readings: values }) =>
      values === undefined || values === 'invalid' ? [] : [{ site, cm: values.map((value) => fmt.lengthToCm(value)) }],
    );
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
        const wrong = left.has(site) && readingsOf(values) === 'invalid' ? invalidField(values) : undefined;
        const names = places.map((_, i) => fieldName(site, i));
        // Once focus is somewhere outside this site's three fields, the site is left.
        const leave = () =>
          setTimeout(() => {
            const now = document.activeElement?.getAttribute('aria-label');
            if (now === null || now === undefined || !names.includes(now)) setLeft((was) => new Set(was).add(site));
          }, 0);
        return (
          <MmSection key={site} icon="tape" title={label}>
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
                        name={names[i]}
                        kind="number"
                        dense
                        value={values[i] ?? ''}
                        error={
                          off?.site === site && off.at === i
                            ? `That ${label.toLowerCase()} reading looks off. Check it.`
                            : wrong?.at === i
                              ? wrong.text
                              : undefined
                        }
                        onBlur={leave}
                        onChange={(text) => {
                          if (off?.site === site && off.at === i) setOff(undefined);
                          setTyped({ ...typed, [site]: values.map((value, at) => (at === i ? text : value)) });
                        }}
                      />
                    ))}
                  </div>
                }
              />
            </MmListGroup>
          </MmSection>
        );
      })}
      <div className="app-gap" />
      <MmButton label="Save measurements" expand onPress={ready && off === undefined ? () => void save() : undefined} />
    </Screen>
  );
}
