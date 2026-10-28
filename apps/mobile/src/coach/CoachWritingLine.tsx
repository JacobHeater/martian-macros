import { useEffect, useState } from 'react';
import { coachAnalysisWords } from '../format/coachAnalysisWords';
import { MmBusyLine } from '../ui/MmBusyLine';
import { MmButton } from '../ui/MmButton';
import './coach.css';

interface CoachWritingLineProps {
  /** Shows the built-in words at once (MM-686). */
  onAnswerNow: () => void;
}

/** Seconds of waiting before "Answer now" is offered (the owner, 2026-10-28). */
const answerNowAfterMs = 3000;

/**
 * The wait while the person's own model writes (MM-673) and, once it has
 * lasted three seconds, the way out (MM-686): "Answer now", which shows the
 * built-in words in place of the model's. The same line and timing wherever
 * the coach is asked: the meal breakdown and the Executive summary.
 */
export function CoachWritingLine({ onAnswerNow }: CoachWritingLineProps) {
  const [offered, setOffered] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setOffered(true), answerNowAfterMs);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="coach-writing-line">
      <MmBusyLine label={coachAnalysisWords.writing} />
      {offered ? <MmButton label={coachAnalysisWords.answerNow} kind="secondary" onPress={onAnswerNow} /> : null}
    </div>
  );
}
