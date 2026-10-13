---
id: MM-244
component: release
status: proposed
related: [MM-95, MM-242]
---

# Task: observe what the barcode and label reader sends

## Why

The privacy reviewer of MM-242 found that the app bundles two Google ML
Kit libraries (barcode scanning and text recognition), and that Google's
own data disclosure says ML Kit collects device and app information,
per-installation identifiers and performance data "in all features" and
sends it to Google
(https://developers.google.com/ml-kit/android-data-disclosure, read
2026-10-12). Nobody has watched what this app actually sends.

Meanwhile Settings tells the person "Nothing is uploaded" and calls the
food database download "the only thing this app ever fetches"
(`apps/mobile/src/settings/SettingsScreen.tsx`), and the offline check
(`apps/mobile/scripts/check-offline.mjs`) looks only at the built web
files, so it cannot see what a native library does.

If ML Kit does report on itself, those two sentences are not true as
written, and the Play Data safety form may not be able to say that no
data is collected. The terms of use (MM-242) were written narrowly so
that they are true either way.

## What to do

1. Run a release build of the shell with a network monitor attached,
   through first use, a barcode scan, a label photograph, the list of
   food packs and a pack download. Record every host and the request
   headers.
2. From what is seen, the owner chooses: disclose it (and reword the two
   Settings sentences), replace the libraries with ones that send nothing,
   or keep the wording if nothing is sent.
3. Record the result in MM-95, whose "checked by observation" scenario
   this is.

## Acceptance criteria

```gherkin
Scenario: observed, not assumed
  Given a release build under a network monitor
  When a barcode is scanned and a label is photographed
  Then every destination contacted is recorded in this ticket

Scenario: the app says what is true
  Then Settings, the terms of use and the privacy policy name every
  destination that was seen and none that was not
```

## Notes

The same run can answer three smaller questions the reviewer raised:
what the download request reveals besides the IP address (the default
user agent, GitHub's redirect host), whether the label photo is left in
the cache when Android recreates the app during capture, and whether
erasing clears the reminder schedule kept outside the database. Each
becomes a bug ticket with a regression test if it is confirmed.
