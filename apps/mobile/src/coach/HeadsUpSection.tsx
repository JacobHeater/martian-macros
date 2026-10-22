import { MmSection } from '../ui/MmSection';

interface HeadsUpSectionProps {
  /** Each caution's full text, in the order it is read: the health check's cautions, then the target flags. */
  notes: readonly string[];
}

/**
 * Coach's cautions in one place (MM-553): the health check's cautions and the
 * flags on the targets, under the hero, folded by default to their count. The
 * caution's icon and colour stay on the folded line so it never reads as
 * routine; opened, each note is said in full. With no notes, nothing is
 * drawn. The open or closed choice is kept for the session only.
 */
export function HeadsUpSection({ notes }: HeadsUpSectionProps) {
  if (notes.length === 0) return null;
  return (
    <MmSection framed
      icon="warning"
      kind="caution"
      title="Heads up"
      summary={`${notes.length} ${notes.length === 1 ? 'note' : 'notes'} about your targets`}
      collapsible
      initiallyExpanded={false}
      remember="coach.headsUp"
    >
      {notes.map((note) => (
        <p key={note} className="app-text">
          {note}
        </p>
      ))}
    </MmSection>
  );
}
