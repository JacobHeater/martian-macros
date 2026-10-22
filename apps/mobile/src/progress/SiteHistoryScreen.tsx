import { useState } from 'react';
import { WaistChart } from '../charts/WaistChart';
import { MeasurementSite } from '../domain/measurements/MeasurementSite';
import { WaistObservation } from '../domain/WaistObservation';
import { WaistRule } from '../engine/WaistRule';
import { Fmt } from '../format/Fmt';
import { siteLabel } from '../format/siteLabel';
import { siteSummary } from '../format/siteSummary';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmSegmented } from '../ui/MmSegmented';
import { MmSurface } from '../ui/MmSurface';
import './progress.css';

/**
 * One site over time (MM-156), drawn as the waist is (MM-155): its line,
 * the chart with that site's noise as the band, over 90 days or a year.
 */
export function SiteHistoryScreen({ site }: { site: MeasurementSite }) {
  const { state } = useApp();
  const [rangeDays, setRangeDays] = useState(90);
  const today = useCell(state.today);
  const setup = useLoaded(state.setup);
  const settings = useLoaded(state.measurementSettings);
  const all = useLoaded(state.measurements) ?? [];
  if (setup === undefined || settings === undefined) return <Screen title={MeasurementSite.facts(site).label}>{null}</Screen>;
  const fmt = new Fmt(setup.unitSystem);
  const own = all.filter((o) => o.site === site);
  const label = siteLabel(site, settings.limbSide);
  const single = own.some((o) => o.isSingleReading);
  return (
    <Screen title={label}>
      <p className="app-text">{siteSummary(all, site, fmt, today)}</p>
      <MmSurface>
        <div className="progress-waist-chart">
          <div className="progress-hero-head">
            <h3 className="progress-waist-chart-title">{`${label} over time`}</h3>
            <MmSegmented<number>
              name={`${label} range`}
              compact
              segments={[
                { value: 90, label: '90d' },
                { value: 365, label: '1y' },
              ]}
              selected={rangeDays}
              onChange={(chosen) => setRangeDays(chosen ?? rangeDays)}
            />
          </div>
          <WaistChart
            waist={own.map((o) => new WaistObservation({ date: o.date, waistCm: o.valueCm, readings: o.readings }))}
            today={today}
            rangeDays={rangeDays}
            fmt={fmt}
            noiseCm={MeasurementSite.facts(site).noiseCm * (single ? WaistRule.singleReadingFactor : 1)}
            emptyText={`No ${label.toLowerCase()} measurements in this range.`}
            label={`${label} over the last ${rangeDays === 365 ? 'year' : `${rangeDays} days`}, from ${own.length} measurement${own.length === 1 ? '' : 's'}.`}
          />
          <p className="app-caption">Dots are measurements. The line is the middle of each three; the band is what a tape can tell apart.</p>
        </div>
      </MmSurface>
    </Screen>
  );
}
