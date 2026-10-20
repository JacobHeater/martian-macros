# Outcomes

| Finding | Severity | Outcome |
|---|---|---|
| PD1 / UX F5: two Ember fills while the question is asked | blocking | Fixed; bug MM-435 with a regression test. Camera button is secondary while asking or looking up. |
| PD2 / UX F2: "Nothing is uploaded" on the scan step; "The only thing this app ever fetches" in Settings | should-fix | Fixed: "The camera reads the barcode on this phone."; "fetched only when you ask". |
| PD3 / UX F12: Always and Never as equal twins side by side | should-fix | Fixed: stacked and laddered, Just for now (primary), Always (secondary), Never (text); the row CSS removed. |
| PD4: "Looking it up online…" as an info notice | should-fix | Fixed: spinner row in the status region, as the Food database screen's checking row. |
| PD5 / UX: unreachable states differ and narrate buttons | should-fix | Fixed: one sentence in both places (`onlineUnreachableText`), a secondary Try again in both. |
| PD6: "Found online" headed over nothing found | should-fix | Fixed: the line alone, in the status region. |
| PD7 / UX F16 heading: a Settings group header inside the sheet | should-fix | Fixed: the sheet's own `food-label` paragraph, no second h2. |
| PD8 / UX F16: online rows lack the grade | consider | Fixed: `FoodGrade` on each online row, as on pack rows. |
| PD9 / UX F9: rows used as paragraphs; privacy sentence in caption type | should-fix | Fixed: one-line source rows (licence · address), the account as paragraphs, the privacy sentence as a Notice in body type. |
| PD10: attribution and "On this phone" in two homes | should-fix | Fixed: Food database cites with a "Food data sources" row and drops its paragraph; the sources screen drops the installed list. |
| PD11 / UX F13: a read-only copy of the Settings choice | consider | Fixed: the choice row removed from the sources screen; the Notice points to Settings, under Data. |
| PD12 / UX F14: lock row promises a route a no-source build has not | should-fix | Fixed: the sentence branches on whether a source exists; "Food data sources" subtitle shortened. |
| PD13: case of "found online" | consider | Fixed: "Found online". |
| UX F1: "Just this once" lasts the whole run | should-fix | Fixed by making the words match: "Just for now", with "For now means until you close the app" in the question and the terms. The duration itself stays the ticket's decision (say if wrong). |
| UX F3: the question appears silently for a reader | should-fix | Fixed: the status region says "…not in the food database on this phone. A question follows." when the question appears. |
| UX F4: focus dropped after an answer or after Search online | should-fix | Fixed: the question's buttons stay mounted and off while the lookup runs; "Search online" stays in place, off, while the question or search is open. After Never on the scan step the status region speaks and the label button follows; focus is not moved programmatically. |
| UX F6: Never leaves no trace; "in Settings" unlocated | should-fix | Fixed: `onlineLookupOffText` once after Never in both places; the question says "in Settings, under Data". |
| UX F7: empty-database sentence omits the online path | should-fix | Fixed: "…search online, or enter the food yourself" when offered. |
| UX F8: results and nothing-found not announced; spinner region created with its text | should-fix | Fixed: one status region in `OnlineSearchResults` from the start, carrying searching, N found, nothing found, unreachable, off. |
| UX F10: group label duplicates the first sentence | consider | Fixed: the group is "Online lookup". |
| UX F11: Always does not say what it commits to | consider | Fixed, in the question. |
| UX F15: "in builds that include it" in the terms | consider | Fixed: "where the app offers it". |
| UX F16: no story with a pack beside online results | consider | Fixed: `SearchOnlineBesidePack`. |
| MM-57 "with links" as plain text; a shell open-URL seam | chair request | Left as recorded on MM-57: no native surface, addresses as text; the owner may ask for a seam. |
| Runtime screen-reader verification (TalkBack, VoiceOver) | chair request | Not possible this session; recorded on MM-58 as unverified on a device. |
