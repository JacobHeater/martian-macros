import { MaintenanceRule } from '../engine/MaintenanceRule';
import { suggestedMaintenanceWeeks } from '../engine/suggestedMaintenanceWeeks';
import { Fmt } from '../format/Fmt';
import { reboundText } from '../format/reboundText';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmButton } from '../ui/MmButton';
import { MmSection } from '../ui/MmSection';
import { Notice } from '../ui/Notice';
import { StatRow } from '../ui/StatRow';

/**
 * Maintenance, said plainly (MM-130): for two weeks after a cut, what the
 * scale will do and why; how long a pause before another cut is sensible;
 * then the anchor and its band, and, drifted out of the band for two weeks,
 * the question: correct back at a gentle pace, or accept the new weight.
 * Nothing changes until it is answered. Hidden outside maintenance.
 */
export function MaintenanceCard() {
  const { services, state } = useApp();
  // How much of the person's weight is shown (MM-118).
  const weightDisplay = useCell(state.weightDisplay);
  const status = useCell(state.maintenance);
  const setup = useLoaded(state.setup);
  const today = useCell(state.today);
  if (status === undefined || setup === undefined) return null;
  const fmt = new Fmt(setup.unitSystem, { weightDisplay });
  const daysIn = status.startedOn.daysUntil(today);
  const afterCut = status.fromDeficitWeeks > 0;
  const rebound = afterCut && daysIn < MaintenanceRule.reboundNoteDays;
  const { anchor, drift } = status;
  const lines: string[] = [];
  if (afterCut) {
    const weeks = suggestedMaintenanceWeeks(status.fromDeficitWeeks);
    lines.push(
      `A cut of ${status.fromDeficitWeeks} weeks ended ${daysIn === 0 ? 'today' : `${daysIn} days ago`}. ` +
        `About ${weeks} weeks here before another is a sensible pause (never fewer than ${MaintenanceRule.minimumMaintenanceWeeks}).`,
    );
  }
  if (anchor === undefined) {
    lines.push(
      `Your anchor, the weight you are holding, is read from your trend ${MaintenanceRule.anchorAfterDays} days in, once the water has come back.`,
    );
  }
  return (
    <MmSection framed icon="flag" title="Maintaining">
      {rebound ? <Notice text={reboundText(fmt)} /> : null}
      {lines.map((line) => (
        <p key={line} className="app-text">
          {line}
        </p>
      ))}
      {anchor === undefined ? null : (
        <>
          {/* The anchor and band are weights: not shown with the weight hidden (MM-118). */}
          {fmt.weightHidden ? null : (
            <>
              <StatRow label="Anchor" value={fmt.weight(anchor.weightKg)} detail={`Your trend on ${Fmt.day(anchor.on, today)}`} />
              <StatRow
                label="Band"
                value={`±${fmt.weight(anchor.halfWidthKg)}`}
                detail="Inside it, targets change only when your expenditure estimate does."
              />
            </>
          )}
          {drift === undefined ? null : drift.status === 'inBand' ? (
            <p className="app-text">Within the band: holding.</p>
          ) : drift.status === 'drifting' ? (
            <p className="app-text">
              {`${drift.deviationKg > 0 ? 'Above' : 'Below'} the band for ${drift.daysOutside} ${drift.daysOutside === 1 ? 'day' : 'days'}. ` +
                `At ${MaintenanceRule.driftDays} the coach will ask what you want.`}
            </p>
          ) : status.correcting ? (
            <p className="app-text">
              {`Correcting back toward ${fmt.weightHidden ? 'your anchor' : fmt.weight(anchor.weightKg)} at a gentle pace. Targets return to maintenance once the trend is back in the band.`}
            </p>
          ) : (
            <Notice
              title="Your weight has moved"
              text={
                `Your trend has been ${drift.deviationKg > 0 ? 'above' : 'below'} the band for ${drift.daysOutside} days: ` +
                (fmt.weightHidden ? '' : `${fmt.weight(drift.trendWeightKg)} against an anchor of ${fmt.weight(anchor.weightKg)}. `) +
                'Nothing changes until you choose.'
              }
              action={
                <div className="app-row">
                  <MmButton
                    label="Correct back"
                    kind="secondary"
                    onPress={() =>
                      void services.setup.saveSetup(setup.copyWith({ maintenanceCorrectionFrom: today, maintenanceAnchorOn: undefined }))
                    }
                  />
                  <MmButton
                    label="Accept the new weight"
                    kind="secondary"
                    onPress={() =>
                      void services.setup.saveSetup(setup.copyWith({ maintenanceAnchorOn: today, maintenanceCorrectionFrom: undefined }))
                    }
                  />
                </div>
              }
            />
          )}
        </>
      )}
    </MmSection>
  );
}
