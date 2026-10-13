import { useState } from 'react';
import { GroupHeader } from '../ui/GroupHeader';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSlider } from '../ui/MmSlider';
import { MmSliderRow } from '../ui/MmSliderRow';
import { MmSwitchRow } from '../ui/MmSwitchRow';
import { SectionLabel } from '../ui/SectionLabel';
import './gallery.css';

/**
 * A slider every way a screen holds one (MM-240): as a row's detail, as a
 * row under a switch, and under a label of its own. In a group it is
 * always at the row's inset.
 */
export function SlidersCatalog() {
  const [days, setDays] = useState(4);
  const [measured, setMeasured] = useState(true);
  const [bodyFat, setBodyFat] = useState(22);
  const [pace, setPace] = useState(0.5);
  return (
    <div className="gallery-stack">
      <GroupHeader text="Activity and training" />
      <MmListGroup>
        <MmListRow title="Experience" subtitle="3+ years" />
        <MmListRow
          title={`Training days per week: ${days}`}
          detail={<MmSlider name="Training days per week" value={days} max={7} divisions={7} onChange={setDays} />}
        />
      </MmListGroup>
      <GroupHeader text="Body fat estimate" />
      <MmListGroup>
        <MmSwitchRow
          title={measured ? `About ${bodyFat}%` : 'Let the app estimate'}
          subtitle="Enter one only if you have a recent measurement."
          value={measured}
          onChange={setMeasured}
        />
        {measured ? (
          <MmSliderRow name="Body fat percent" value={bodyFat} min={5} max={55} divisions={50} onChange={setBodyFat} />
        ) : null}
      </MmListGroup>
      <SectionLabel text={`Pace: ${pace}% a week`} />
      <MmSlider name="Pace" value={pace} divisions={4} onChange={setPace} />
    </div>
  );
}
