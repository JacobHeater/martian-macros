import type { CalendarDate } from '../domain/CalendarDate';
import { Fmt } from '../format/Fmt';
import { MmButton } from '../ui/MmButton';
import { Notice } from '../ui/Notice';

interface BirthDateStepProps {
  birthDate: CalendarDate | undefined;
  isMinor: boolean;
  onPickBirthDate: () => void;
}

/** Step 2: date of birth. Under 18 stops here. */
export function BirthDateStep({ birthDate, isMinor, onPickBirthDate }: BirthDateStepProps) {
  return (
    <>
      <h1 className="app-headline">Date of birth</h1>
      <p className="app-text app-muted">Age changes energy needs and some safety limits.</p>
      <div className="app-gap" />
      <div>
        <MmButton
          label={birthDate === undefined ? 'Choose date' : Fmt.longDate(birthDate)}
          kind="secondary"
          onPress={onPickBirthDate}
        />
      </div>
      {isMinor ? (
        <>
          <div className="app-gap" />
          <Notice
            icon="close"
            text={
              'Martian Macros is for adults 18 and over. Growing bodies ' +
              'need different guidance than this app provides.'
            }
          />
        </>
      ) : null}
    </>
  );
}
