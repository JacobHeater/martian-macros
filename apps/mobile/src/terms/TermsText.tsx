import type { Platform } from '../domain/integration/Platform';
import { termsOfUse } from './termsOfUse';
import './terms.css';

interface TermsTextProps {
  /** The platform the app is on, since the terms name its health platform and camera reader (MM-403). */
  platform: Platform;
}

/**
 * The terms of use as they are read, the same wherever they are shown: the
 * short account first, then every section in full under its own heading.
 * Nothing is collapsed; terms a person has to open are terms hidden.
 */
export function TermsText({ platform }: TermsTextProps) {
  return (
    <>
      <h2 className="app-subhead">Before you start</h2>
      <ul className="terms-summary">
        {termsOfUse.summary.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <p className="app-text app-muted">
        The full terms below say this in more detail and cover more, including the limits of what we are responsible
        for.
      </p>
      {termsOfUse.sectionsOn(platform).map((section) => (
        <section key={section.heading}>
          <h2 className="app-subhead">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="app-text">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </>
  );
}
