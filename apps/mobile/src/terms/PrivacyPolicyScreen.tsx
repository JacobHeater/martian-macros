import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { Fmt } from '../format/Fmt';
import { LegalSections } from './LegalSections';
import { privacyPolicy } from './privacyPolicy';
import './terms.css';

/**
 * The privacy policy (MM-95), read from Settings, About, beside the terms of
 * use: the short account first, then every section in full, for the platform
 * the app is on. Nothing here is asked of the person and nothing is fetched.
 */
export function PrivacyPolicyScreen() {
  const { services } = useApp();
  return (
    <Screen title="Privacy policy" roomy>
      <p className="terms-version">
        Version {privacyPolicy.version}, in effect from {Fmt.longDate(privacyPolicy.effectiveOn)}.
      </p>
      <h2 className="app-subhead">In short</h2>
      <ul className="terms-summary">
        {privacyPolicy.summaryOn(services.platform).map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <LegalSections sections={privacyPolicy.sectionsOn(services.platform)} />
    </Screen>
  );
}
