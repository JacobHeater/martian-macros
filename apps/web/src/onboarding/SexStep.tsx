import { BiologicalSex } from '../domain/BiologicalSex';
import { ChoiceCard } from '../ui/ChoiceCard';

interface SexStepProps {
  sex: BiologicalSex | undefined;
  onSex: (sex: BiologicalSex) => void;
}

/** Step 1: biological sex. No default is chosen for the user. */
export function SexStep({ sex, onSex }: SexStepProps) {
  return (
    <>
      <h1 className="app-headline">Biological sex</h1>
      <p className="app-text app-muted">
        Energy needs, safe body-fat ranges, and safety limits differ between males and females.
      </p>
      <div className="app-gap" />
      <div className="app-row app-row-even">
        {BiologicalSex.values.map((option) => (
          <ChoiceCard
            key={option}
            label={option === 'male' ? 'Male' : 'Female'}
            selected={sex === option}
            onPress={() => onSex(option)}
          />
        ))}
      </div>
    </>
  );
}
