import type { TermsSection } from './TermsSection';

interface LegalSectionsProps {
  sections: readonly TermsSection[];
}

/**
 * Headed sections of a legal text, every one in full: the terms of use
 * (MM-242) and the privacy policy (MM-95) are read the same way, and nothing
 * is collapsed or behind a link.
 */
export function LegalSections({ sections }: LegalSectionsProps) {
  return (
    <>
      {sections.map((section) => (
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
