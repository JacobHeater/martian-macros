import type { Clipboard } from '../domain/integration/Clipboard';

/**
 * Copies `text` by selecting it in a hidden, read-only field and asking the
 * page to copy (MM-589): the way a WebView allows without a permission, while
 * the press that asked is still being handled. False when the page refuses.
 */
function copyBySelection(text: string): boolean {
  if (typeof document.execCommand !== 'function') return false;
  const focused = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
  const field = document.createElement('textarea');
  field.value = text;
  // Read-only, so no keyboard opens; out of sight, so nothing moves.
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.top = '-1000px';
  field.style.opacity = '0';
  document.body.appendChild(field);
  try {
    field.focus();
    field.select();
    // iOS selects only through a range.
    field.setSelectionRange(0, text.length);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    field.remove();
    focused?.focus();
  }
}

/**
 * `Clipboard` through the WebView (MM-586), the same in the shell and in a
 * browser: no plugin. Writing selects and copies first, since Android's
 * WebView refuses the clipboard API's write (MM-589), then tries that API.
 * Reading asks the phone, which may show its own Paste button (iOS) or
 * refuse (Android's WebView); a refusal is an answer, never an error.
 */
export class NavigatorClipboard implements Clipboard {
  async write(text: string): Promise<boolean> {
    // Before any await: copying needs the press that asked for it.
    if (copyBySelection(text)) return true;
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  async read(): Promise<string | undefined> {
    try {
      const text = await navigator.clipboard.readText();
      return text === '' ? undefined : text;
    } catch {
      return undefined;
    }
  }
}
