import type { EvidenceQuestion } from '../domain/evidence/EvidenceQuestion';
import type { EvidenceRow } from '../domain/evidence/EvidenceRow';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { MmSurface } from '../ui/MmSurface';
import { EvidenceRowCard } from './EvidenceRowCard';
import './about.css';

/**
 * One answer, then the rules behind it with their grade in words and, one
 * tap down, where each comes from.
 */
export function EvidenceQuestionScreen({ question }: { question: EvidenceQuestion }) {
  const { state } = useApp();
  const register = useLoaded(state.evidenceRegister);
  const rows = question.rowNames
    .map((name) => register?.row(name))
    .filter((row): row is EvidenceRow => row !== undefined);
  return (
    <Screen title={question.title} roomy>
      <p className="app-lead">{question.answer}</p>
      <h2 className="app-subhead about-rules">The rules behind this</h2>
      {rows.map((row) => (
        <EvidenceRowCard key={row.name} row={row} />
      ))}
      {rows.length === 0 ? null : (
        <MmSurface>
          <p className="app-text">
            These sources are as recorded when the rules were written. None has been reviewed by a professional yet.
          </p>
        </MmSurface>
      )}
    </Screen>
  );
}
