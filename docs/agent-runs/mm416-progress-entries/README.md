# MM-416: the Progress entries onto a surface (2026-10-20)

One round, read-only, from source (no render). Edit owner: the session agent.

**Product-designer.** Verdict: fixes the bare fields but the first draft used the wrong sibling (`MmSurface kind="compact"`,
used on no screen) where MM-416 and the Dashboard name `MmListGroup` with one `MmListRow entry`; the night chips and the waist
chart's range switch were still bare; spacing doubled under the new edge; the ticket not updated.
Outcomes: all done (list group with an entry row; chips inside the entry; the chart on a surface; the chart's hairline and the
save rows' bottom margins removed; the check widened to chips and segmented controls; the ticket recorded).

**UX-accessibility.** Verdict: no blocking findings. An unlabelled `section` is generic, not a landmark (HTML-AAM 3.5.114);
focus order unchanged; the after-save focus on the waist's recorded line still sensible. Noted outside the change: after a
night is saved, focus fell to the page. Outcome: focus now goes to the saved night's chip. The `MmSurface` element question is
moot here, since the entries no longer use it.
