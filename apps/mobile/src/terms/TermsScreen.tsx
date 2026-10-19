import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { Fmt } from '../format/Fmt';
import { termsOfUse } from './termsOfUse';
import { TermsText } from './TermsText';
import './terms.css';

/**
 * The terms of use, to read again at any time from Settings (MM-242): the
 * same text that was agreed to, with its version and the day of agreeing.
 * Nothing here changes the agreement.
 */
export function TermsScreen() {
  const { services, state } = useApp();
  const accepted = useLoaded(state.termsAcceptance);
  return (
    <Screen title="Terms of use" roomy>
      <p className="terms-version">
        Version {termsOfUse.version}, in effect from {Fmt.longDate(termsOfUse.effectiveOn)}.
        {accepted === undefined ? '' : ` You agreed on ${Fmt.longDate(accepted.acceptedOn)}.`}
      </p>
      <TermsText platform={services.platform} />
    </Screen>
  );
}
