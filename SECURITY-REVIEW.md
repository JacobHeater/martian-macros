# Security review

## HIGH: Broadly auto-approved command can execute an arbitrary server binary

- **Affected setting:** `.claude/settings.json`, the `Bash(python3 run.py:*)`
  allow rule.
- **Execution path:** `tool/spikes/coach_model/run.py` accepts the `--server`
  argument and passes its value as the executable in `subprocess.Popen`.
- **Impact:** Any invocation that Claude Code runs under this broad allow rule
  can supply an attacker-controlled `--server` path. The script then launches
  that binary without an additional permission prompt.
- **Confidence:** 8/10.
- **Recommendation:** Remove the wildcard permission or constrain it to a
  trusted invocation and executable. Avoid accepting arbitrary executable
  paths in the script.
