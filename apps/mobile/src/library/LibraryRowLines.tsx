import './library.css';

/** A Library row's detail (MM-706): what the thing is, then how often it is logged, each on its own line. */
export function LibraryRowLines({ lines }: { lines: readonly string[] }) {
  return (
    <>
      {lines.map((line) => (
        <span key={line} className="library-row-line">
          {line}
        </span>
      ))}
    </>
  );
}
