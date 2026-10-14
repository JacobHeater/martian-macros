import type { CalendarDate } from '../domain/CalendarDate';
import { Fmt } from '../format/Fmt';
import { MmPickerField } from '../ui/MmPickerField';
import { Notice } from '../ui/Notice';

interface BirthDateStepProps {
  birthDate: CalendarDate | undefined;
  isMinor: boolean;
  onPickBirthDate: () => void;
}

/** Step 2: date of birth, as a field that opens the design system's calendar (MM-263). Under 18 stops here. */
export function BirthDateStep({ birthDate, isMinor, onPickBirthDate }: BirthDateStepProps) {
  return (
    <>
      <h1 className="app-headline">Date of birth</h1>
      <p className="app-text app-muted">Age changes energy needs and some safety limits.</p>
      <div className="app-gap" />
      <MmPickerField
        label="Date of birth"
        valueText={birthDate === undefined ? 'Choose a date' : Fmt.longDate(birthDate)}
        onPress={onPickBirthDate}
      />
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
