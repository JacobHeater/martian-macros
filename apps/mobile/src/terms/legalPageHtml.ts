import type { Platform } from '../domain/integration/Platform';
import { Fmt } from '../format/Fmt';
import { privacyPolicy } from './privacyPolicy';
import { termsOfUse } from './termsOfUse';
import type { TermsSection } from './TermsSection';

/**
 * Whether a licensed attorney has reviewed the terms and the policy (MM-242,
 * MM-95). Until then the public page says, above everything, that both are a
 * draft not in effect. Set to true only in the change that records the review.
 */
const reviewedByAnAttorney = false;

const escape = (text: string): string =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const platformLabel: Readonly<Record<Exclude<Platform, 'web'>, string>> = { android: 'On Android', ios: 'On iPhone' };

/** What the two phones say alike is written once; what they say differently is written for each, labelled. */
function bothPhones(android: readonly string[], ios: readonly string[], tag: 'p' | 'li'): string {
  const line = (text: string, phone?: Exclude<Platform, 'web'>) =>
    `<${tag}>${phone === undefined ? '' : `<strong>${platformLabel[phone]}:</strong> `}${escape(text)}</${tag}>`;
  const lines: string[] = [];
  for (let at = 0; at < Math.max(android.length, ios.length); at++) {
    const onAndroid = android[at];
    const onIos = ios[at];
    if (onAndroid === onIos && onAndroid !== undefined) lines.push(line(onAndroid));
    else {
      if (onAndroid !== undefined) lines.push(line(onAndroid, 'android'));
      if (onIos !== undefined) lines.push(line(onIos, 'ios'));
    }
  }
  return lines.join('\n');
}

function sections(android: readonly TermsSection[], ios: readonly TermsSection[]): string {
  return android
    .map((section, at) => {
      const other = ios[at];
      const heading = other === undefined || other.heading === section.heading ? escape(section.heading) : `${escape(section.heading)} / ${escape(other.heading)}`;
      return `<section>\n<h3>${heading}</h3>\n${bothPhones(section.paragraphs, other?.paragraphs ?? [], 'p')}\n</section>`;
    })
    .join('\n');
}

const style = `
:root { color-scheme: light dark; --bg: #ffffff; --text: #1c1b1f; --muted: #5f5b66; --rule: #d9d4de; --draft: #fff4d6; }
@media (prefers-color-scheme: dark) { :root { --bg: #141218; --text: #e6e0e9; --muted: #b0a9b8; --rule: #3a3540; --draft: #3d3214; } }
body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.55 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
main { max-width: 44rem; margin: 0 auto; padding: 24px 16px 64px; }
h1 { font-size: 1.6rem; margin: 0 0 8px; }
h2 { font-size: 1.3rem; margin: 40px 0 4px; padding-top: 16px; border-top: 1px solid var(--rule); }
h3 { font-size: 1.05rem; margin: 24px 0 4px; }
.meta { color: var(--muted); margin: 0 0 16px; }
.draft { background: var(--draft); padding: 12px 16px; border-radius: 8px; }
nav a { color: inherit; }
`;

/**
 * The public page of the terms of use and the privacy policy (MM-247): one
 * HTML file, built from the same source the app shows, so the stores' text
 * cannot differ from the app's. It loads nothing: no script, no font, no
 * image and no stylesheet from anywhere. A paragraph that differs between
 * Android and iPhone is given for each, labelled.
 */
export function legalPageHtml(): string {
  const draft = reviewedByAnAttorney
    ? ''
    : '<p class="draft"><strong>Draft, not yet in effect.</strong> These terms and this policy have not yet been reviewed by a lawyer, and the bracketed blanks are still to be filled in.</p>';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
<meta name="referrer" content="no-referrer">
<title>Martian Macros: terms of use and privacy policy</title>
<style>${style}</style>
</head>
<body>
<main>
<h1>Martian Macros</h1>
${draft}
<nav><p><a href="#terms">Terms of use</a> · <a href="#privacy">Privacy policy</a></p></nav>
<h2 id="terms">Terms of use</h2>
<p class="meta">Version ${termsOfUse.version}, in effect from ${escape(Fmt.longDate(termsOfUse.effectiveOn))}.</p>
<h3>Before you start</h3>
<ul>
${bothPhones(termsOfUse.summary, termsOfUse.summary, 'li')}
</ul>
<p>The full terms below say this in more detail and cover more, including the limits of what we are responsible for.</p>
${sections(termsOfUse.sectionsOn('android'), termsOfUse.sectionsOn('ios'))}
<h2 id="privacy">Privacy policy</h2>
<p class="meta">Version ${privacyPolicy.version}, in effect from ${escape(Fmt.longDate(privacyPolicy.effectiveOn))}.</p>
<h3>In short</h3>
<ul>
${bothPhones(privacyPolicy.summaryOn('android'), privacyPolicy.summaryOn('ios'), 'li')}
</ul>
${sections(privacyPolicy.sectionsOn('android'), privacyPolicy.sectionsOn('ios'))}
</main>
</body>
</html>
`;
}
