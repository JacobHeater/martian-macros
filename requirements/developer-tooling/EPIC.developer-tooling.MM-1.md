---
id: MM-1
status: in-progress
component: developer-tooling
related: [MM-2, MM-3, MM-4, MM-5, MM-6, MM-7, MM-8]
---

# Epic: Developer tooling

## Context
The app is built on Windows day to day and on a Mac for iOS. The Flutter CLI is verbose and differs in small ways per shell, and Bash is
not native on Windows. The product owner's constraint: anyone can clone the repository and run every task with one short command, on
Windows, macOS and Linux, without typing Flutter CLI commands.

## Narrative
One task runner, `mm`, wraps every Flutter and Dart invocation. It is a Dart program with no dependencies, because the Dart SDK is the one
runtime every contributor already has, so there is nothing else to install and one implementation for every OS. Three thin launchers
(`mm.ps1`, `mm.cmd`, `mm`) start it from PowerShell, cmd.exe and POSIX shells.

The pieces:
- the runner and its commands (MM-2), including starting an emulator when the app is run with no device connected (MM-3);
- a pinned Flutter version and a `doctor` command that checks it (MM-4);
- one pub workspace for all packages (MM-5);
- the requirements tracker (MM-6).

Still to do: continuous integration that runs the same commands (MM-7), and separate dev and prod app ids so both can be installed on one
device (MM-8).

## Acceptance Criteria (narrative)
The Epic is done when a new contributor on any of the three operating systems can clone the repository, follow the README's four setup
steps, and then run, test, build and check the project using only `mm` commands, and a pull request is checked by CI running `mm check`.
