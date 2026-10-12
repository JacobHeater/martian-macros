import { useState } from 'react';
import { EvidenceGrade } from '../domain/evidence/EvidenceGrade';
import type { EvidenceRow } from '../domain/evidence/EvidenceRow';
import { MmSurface } from '../ui/MmSurface';
import './about.css';

/** A rule, how well supported it is, and (when pressed) where it comes from. */
export function EvidenceRowCard({ row }: { row: EvidenceRow }) {
  const [open, setOpen] = useState(false);
  return (
    <MmSurface onPress={() => setOpen(!open)}>
      <span className="about-rule">{row.decides}</span>
      <span className="about-grade">{EvidenceGrade.inWords(row.grade)}</span>
      {open ? (
        <>
          <span className="about-detail">Value: {row.value}</span>
          <span className="about-detail">Source: {row.source}</span>
          <span className="about-detail">Based on: {row.population}</span>
        </>
      ) : null}
    </MmSurface>
  );
}
