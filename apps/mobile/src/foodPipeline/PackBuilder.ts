import { checkNutrition } from '../domain/food/checkNutrition';
import { normalizeBarcode } from '../domain/food/normalizeBarcode';
import type { PackEntry } from '../foodCatalog/PackEntry';
import { disagreementReason } from '../foodCatalog/disagreementReason';
import { byName } from '../lang/byName';
import { compareStrings } from '../lang/compareStrings';
import { BuildReport } from './BuildReport';
import type { CandidateFood } from './CandidateFood';
import type { ConflictPolicy } from './ConflictPolicy';
import { DropReason } from './DropReason';
import { GenericPrecedencePolicy } from './GenericPrecedencePolicy';
import type { PackBuildResult } from './PackBuildResult';
import { packEntryFor } from './packEntryFor';
import type { PreparationLink } from './PreparationLink';
import { preparationLinks } from './preparationLinks';

const disagreement = disagreementReason;

function isNewer(candidate: CandidateFood, existing: CandidateFood): boolean {
  if (candidate.versionKey !== existing.versionKey) return candidate.versionKey > existing.versionKey;
  return compareStrings(candidate.sourceId, existing.sourceId) > 0;
}

/**
 * Turns candidates into pack entries (MM-52): applies the nutrition checks
 * (MM-53) and barcode normalization (MM-54) from the domain, keeps the
 * newest version of a product within a source, resolves a barcode two
 * sources share with `policy`, and accounts for every entry read.
 *
 * The output depends only on the candidates and the policy, never on their
 * order or the clock, so the same sources build the same packs.
 */
export class PackBuilder {
  readonly policy: ConflictPolicy;
  readonly precedence: GenericPrecedencePolicy;
  readonly genericPackId: string;
  readonly barcodePackId: string;

  /** The sources the build expects candidates from; one that gives nothing is reported as missing (MM-383). */
  readonly expectedSources: readonly string[];

  constructor({
    policy,
    precedence = new GenericPrecedencePolicy(),
    expectedSources = [],
    genericPackId = 'generic',
    barcodePackId = 'barcode_us',
  }: {
    policy: ConflictPolicy;
    precedence?: GenericPrecedencePolicy;
    expectedSources?: readonly string[];
    genericPackId?: string;
    barcodePackId?: string;
  }) {
    this.policy = policy;
    this.precedence = precedence;
    this.expectedSources = expectedSources;
    this.genericPackId = genericPackId;
    this.barcodePackId = barcodePackId;
  }

  async build(candidates: AsyncIterable<CandidateFood> | Iterable<CandidateFood>): Promise<PackBuildResult> {
    const report = new BuildReport({ expected: this.expectedSources });
    const generic: CandidateFood[] = [];
    const byBarcode = new Map<string, Map<string, CandidateFood>>();
    // When the data was current: the newest record read, so the same export always builds the same pack (MM-153).
    let asOfSeconds = 0;

    for await (const c of candidates) {
      report.countRead(c.source);
      if (c.updatedAt > asOfSeconds) asOfSeconds = c.updatedAt;
      const problem = checkNutrition({
        name: c.name,
        kcal: c.kcal,
        proteinG: c.proteinG,
        carbsG: c.carbsG,
        fatG: c.fatG,
        fiberG: c.fiberG,
        alcoholG: c.alcoholG,
      });
      if (problem !== undefined) {
        report.countDropped(c.source, byName(DropReason.values, problem));
        continue;
      }
      if (c.kind === 'generic') {
        generic.push(c);
        continue;
      }
      const raw = c.rawBarcode;
      const gtin = raw === undefined ? undefined : normalizeBarcode(raw);
      if (gtin === undefined) {
        report.countDropped(c.source, 'invalidBarcode');
        continue;
      }
      let bySource = byBarcode.get(gtin);
      if (bySource === undefined) {
        bySource = new Map();
        byBarcode.set(gtin, bySource);
      }
      const existing = bySource.get(c.source);
      if (existing === undefined) {
        bySource.set(c.source, c);
      } else if (isNewer(c, existing)) {
        bySource.set(c.source, c);
        report.countDropped(existing.source, 'supersededVersion');
      } else {
        report.countDropped(c.source, 'supersededVersion');
      }
    }

    const barcodeEntries: PackEntry[] = [];
    for (const gtin of [...byBarcode.keys()].sort(compareStrings)) {
      const sources = byBarcode.get(gtin) as Map<string, CandidateFood>;
      const [firstName, ...otherNames] = [...sources.keys()].sort(compareStrings);
      let winner = sources.get(firstName as string) as CandidateFood;
      let disagree = false;
      for (const name of otherNames) {
        const other = sources.get(name) as CandidateFood;
        const resolution = this.policy.resolve(winner, other);
        const loser = resolution.winner === winner ? other : winner;
        report.countDropped(loser.source, 'lostConflict');
        winner = resolution.winner;
        disagree = disagree || resolution.disagree;
      }
      const entry = packEntryFor(winner, {
        id: barcodeEntries.length + 1,
        packId: this.barcodePackId,
        gtin14: gtin,
        disagreement: disagree ? disagreement : undefined,
        preparation: 'packaged',
        asOfSeconds,
      });
      barcodeEntries.push(entry);
      report.countWritten(winner.source);
      report.countGroup(winner.source, winner.category, entry.food.group);
    }

    // One name, one food: the more reliable source's record is kept (MM-383).
    const byKey = new Map<string, CandidateFood>();
    for (const c of generic) {
      const key = GenericPrecedencePolicy.key(c.name);
      const held = byKey.get(key);
      if (held === undefined) {
        byKey.set(key, c);
        continue;
      }
      const kept = this.precedence.prefer(held, c);
      const lost = kept === held ? c : held;
      report.countDropped(lost.source, 'lostDuplicateName');
      if (GenericPrecedencePolicy.statedInputs(kept) < GenericPrecedencePolicy.statedInputs(lost)) report.duplicateWinnersSparser += 1;
      byKey.set(key, kept);
    }
    generic.length = 0;
    generic.push(...byKey.values());
    generic.sort((a, b) => {
      const byFoodName = compareStrings(a.name.toLowerCase(), b.name.toLowerCase());
      return byFoodName !== 0 ? byFoodName : compareStrings(a.sourceId, b.sourceId);
    });
    // Raw and cooked versions of one food are linked (MM-151).
    const links = preparationLinks(generic.map((c) => c.name));
    const genericEntries = generic.map((c, i) => {
      const link = links[i] as PreparationLink;
      return packEntryFor(c, {
        id: i + 1,
        packId: this.genericPackId,
        preparation: link.state,
        pairedFoodId: link.pairIndex === undefined ? undefined : link.pairIndex + 1,
        asOfSeconds,
      });
    });
    generic.forEach((c, i) => {
      report.countWritten(c.source);
      report.countGroup(c.source, c.category, genericEntries[i]?.food.group);
    });
    for (const entry of [...genericEntries, ...barcodeEntries]) report.countStated(entry.food);

    return { generic: genericEntries, barcode: barcodeEntries, report };
  }
}
