import { trainingLapseText } from '../format/trainingLapseText';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { Notice } from '../ui/Notice';

/**
 * The coach's word when training has lapsed against a goal that needs it
 * (MM-134): a notice at two weeks, and on a gain the paused surplus at
 * three. Nothing during a pause.
 */
export function TrainingLapseNotice() {
  const { state } = useApp();
  const lapse = useCell(state.trainingLapse);
  if (lapse === undefined) return null;
  const words = trainingLapseText(lapse);
  if (words === undefined) return null;
  return (
    <div className="app-stack-item">
      <Notice icon="train" title={words.title} text={words.text} />
    </div>
  );
}
