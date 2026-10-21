import type { LimbSide } from '../domain/measurements/LimbSide';
import { MeasurementSite } from '../domain/measurements/MeasurementSite';
import { leanGainPairOf } from '../engine/leanGainPairOf';
import { limbFactsOf } from '../engine/limbFactsOf';
import { suggestedSites } from '../engine/suggestedSites';
import type { Fmt } from '../format/Fmt';
import { leanGainPairText } from '../format/leanGainPairText';
import { limbFactText } from '../format/limbFactText';
import { siteLabel } from '../format/siteLabel';
import { siteListText } from '../format/siteListText';
import { siteSummary } from '../format/siteSummary';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { MmButton } from '../ui/MmButton';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { Notice } from '../ui/Notice';
import { useOverlays } from '../ui/useOverlays';
import { MeasurementSessionScreen } from './MeasurementSessionScreen';
import { MeasurementSitesScreen } from './MeasurementSitesScreen';
import { SiteHistoryScreen } from './SiteHistoryScreen';
import './progress.css';

/**
 * The sites beyond the waist (MM-156), a section under the waist's (the
 * sibling `WaistEntryCard`, MM-257): the suggested sites offered once, each
 * measured site's line opening its chart, what limbs did beside the waist
 * as two facts, the measuring session and the choice of sites. In a lean
 * gain, what limbs and waist together are consistent with.
 */
export function MeasurementsCard({ fmt }: { fmt: Fmt }) {
  const { services, state } = useApp();
  const navigator = useNavigator();
  const overlays = useOverlays();
  const today = useCell(state.today);
  const setup = useLoaded(state.setup);
  const settings = useLoaded(state.measurementSettings);
  const measurements = useLoaded(state.measurements) ?? [];
  if (setup === undefined || settings === undefined) return null;
  const sites = MeasurementSite.optional.filter((site) => settings.sites.has(site));
  const suggested = settings.suggestionAnswered
    ? []
    : suggestedSites({
        sex: setup.profile.sex,
        goal: setup.goalMode,
        eatingDisorderHistory: setup.screening.eatingDisorderHistory,
        measured: settings.sites,
      });
  const facts = limbFactsOf({ measurements, sites: settings.sites, asOf: today });
  const pair = setup.goalMode === 'leanGain' ? leanGainPairOf(facts) : undefined;

  const answer = async (add: boolean) => {
    let limbSide = settings.limbSide;
    if (add && limbSide === undefined && suggested.some((site) => MeasurementSite.isLimb(site))) {
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
    const chosen = add ? [...settings.sites, ...suggested] : [...settings.sites];
    await services.measurementSettings.saveMeasurementSettings(
      settings.copyWith(limbSide === undefined ? { sites: chosen, suggestionAnswered: true } : { sites: chosen, limbSide, suggestionAnswered: true }),
    );
  };

  return (
    <MmSection
      icon="ruler"
      title="More measurements"
      summary={sites.length === 0 ? 'Waist only. Other sites are there if you want them.' : `Also ${siteListText(sites)}.`}
      collapsible
      initiallyExpanded={false}
      remember="progress.measurements"
    >
      {suggested.length === 0 ? null : (
        <Notice
          title="Measure more than your waist?"
          text={`Suggested for your goal: ${siteListText(suggested)}. Each takes a minute in the same session, and none is needed.`}
          action={
            <div className="app-row">
              <MmButton label="Add them" kind="secondary" onPress={() => void answer(true)} />
              <MmButton label="No thanks" kind="text" onPress={() => void answer(false)} />
            </div>
          }
        />
      )}
      {/* The measured sites, then the choice of sites as the group's last row (MM-156). */}
      <MmListGroup>
        {sites.map((site) => (
          <MmListRow
            key={site}
            title={siteLabel(site, settings.limbSide)}
            subtitle={siteSummary(measurements, site, fmt, today)}
            opens
            onPress={() => void navigator.push(() => <SiteHistoryScreen site={site} />)}
          />
        ))}
        <MmListRow
          leadingIcon="tape"
          title="Choose sites"
          subtitle={`${sites.length} of ${MeasurementSite.optional.length}`}
          opens
          onPress={() => void navigator.push(() => <MeasurementSitesScreen />)}
        />
      </MmListGroup>
      {/* What limbs did beside the waist: facts said as captions under the rows, not body text. */}
      {facts.map((fact) => (
        <p key={fact.site} className="app-caption">
          {limbFactText(fact, fmt, settings.limbSide)}
        </p>
      ))}
      {pair === undefined ? null : <p className="app-caption">{leanGainPairText(pair)}</p>}
      <div className="app-gap-small" />
      <MmButton
        label="Measure"
        kind="secondary"
        expand
        onPress={() => void navigator.push(() => <MeasurementSessionScreen />)}
      />
    </MmSection>
  );
}
