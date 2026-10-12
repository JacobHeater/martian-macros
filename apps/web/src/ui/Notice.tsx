import type { ReactNode } from 'react';
import { MmIcon } from './MmIcon';
import type { MmIconName } from './MmIconName';
import type { NoticeKind } from './NoticeKind';
import './ui.css';

interface NoticeProps {
  text: string;
  kind?: NoticeKind;
  /** The kind's own icon unless given. */
  icon?: MmIconName | undefined;
  /** A bold lead sentence (for a required safeguard). */
  title?: string | undefined;
  /** The thing to do about it (for a required safeguard). */
  action?: ReactNode;
}

const words: Readonly<Record<NoticeKind, string | undefined>> = {
  info: undefined,
  caution: 'Heads up',
  safeguard: 'Important',
};

const icons: Readonly<Record<NoticeKind, MmIconName>> = { info: 'info', caution: 'warning', safeguard: 'shield' };

/**
 * An inline callout. Never a colored fill: the kind is carried by an icon,
 * a word and, for health guidance, a border.
 */
export function Notice({ text, kind = 'info', icon, title, action }: NoticeProps) {
  const word = words[kind];
  return (
    <div className={`mm-notice mm-notice-${kind}`}>
      <span className="mm-notice-icon">
        <MmIcon name={icon ?? icons[kind]} size={20} />
      </span>
      <div className="mm-notice-body">
        {word === undefined ? null : <span className="mm-notice-word">{word}</span>}
        {title === undefined ? null : <strong className="mm-notice-title">{title}</strong>}
        <span>{text}</span>
        {action === undefined ? null : <div className="mm-notice-action">{action}</div>}
      </div>
    </div>
  );
}
