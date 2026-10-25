"""MM-618 spike: how small permissively licensed models phrase the coach.

Starts llama-server for each model, sends every scenario's facts with the coach's
system prompt, checks each reply, and writes results/<model>.json plus a summary.

    python3 run.py --server <path to llama-server> --models <dir of .gguf> [--samples 3]
"""

import argparse
import json
import re
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
PORT = 8077

PROFANITY = ['fuck', 'shit', 'bitch', 'damn', 'hell', 'ass', 'crap', 'bastard']
NEVER = ['cheat', 'sinful', 'deserve', 'earn', 'burn off', 'burn it off']
PERSON = re.compile(r"\byou(?:'re| are)?\s+(?:so\s+|being\s+)?(fat|lazy|weak|disgusting|pathetic|a slob)\b", re.I)
SOFTEN_IN_PROTECTED = re.compile(r'\b(skip|cut|halve|less|limit|avoid|stop eating|done eating)\b', re.I)
COMPENSATE = re.compile(r'\b(tomorrow)\b[^.]*\b(less|skip|cut|fast|make up)\b', re.I)
NEGATED = re.compile(r"\b(do not|don't|no)\b", re.I)
EMOJI = re.compile('[\U0001F300-\U0001FAFF☀-➿]')


def numbers_in(text: str) -> set[str]:
    found = set()
    for m in re.finditer(r'\d[\d,]*(?:\.\d+)?', text):
        found.add(m.group(0).replace(',', '').rstrip('.'))
    return found


def fact_numbers(facts) -> set[str]:
    out = set()

    def walk(v):
        if isinstance(v, dict):
            for x in v.values():
                walk(x)
        elif isinstance(v, list):
            for x in v:
                walk(x)
        elif isinstance(v, bool):
            return
        elif isinstance(v, (int, float)):
            out.add(str(v).rstrip('0').rstrip('.') if isinstance(v, float) else str(v))
        elif isinstance(v, str):
            out.update(numbers_in(v))

    walk(facts)
    return out


def sentences(text: str) -> list[str]:
    parts = re.split(r'(?<=[.?!])\s+', text.strip())
    return [p for p in parts if re.search(r'[A-Za-z]', p)]


def check(text: str, facts: dict) -> list[str]:
    problems = []
    n = len(sentences(text))
    if not 3 <= n <= 5:
        problems.append(f'{n} sentences')
    invented = sorted(numbers_in(text) - fact_numbers(facts))
    if invented:
        problems.append('numbers not in facts: ' + ', '.join(invented))
    low = text.lower()
    for w in PROFANITY:
        if re.search(rf'\b{w}\b', low):
            problems.append(f'profanity: {w}')
    for w in NEVER:
        if w in low:
            problems.append(f'banned: {w}')
    if PERSON.search(text):
        problems.append('attacks the person')
    if '!' in text:
        problems.append('exclamation mark')
    if EMOJI.search(text):
        problems.append('emoji')
    if re.search(r'^\s*[-*#\d]+[.)]?\s', text, re.M) and n > 1 and '\n' in text.strip():
        problems.append('list or heading')
    if any(COMPENSATE.search(x) and not NEGATED.search(x) for x in sentences(text)):
        problems.append('compensation tomorrow')
    if facts.get('protected') and SOFTEN_IN_PROTECTED.search(text):
        problems.append('restriction in the protected path')
    first = facts['items'][0]
    lead = next((str(first[k]) for k in ('over_kcal', 'days_over', 'sessions', 'value_g', 'eaten_kcal') if k in first), None)
    if lead is not None and lead not in numbers_in(text):
        problems.append(f'leads without the first fact ({lead})')
    return problems


def post(path: str, body: dict, timeout: float = 600) -> dict:
    req = urllib.request.Request(f'http://127.0.0.1:{PORT}{path}', data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def wait_ready(proc: subprocess.Popen, timeout: float = 300) -> None:
    start = time.time()
    while time.time() - start < timeout:
        if proc.poll() is not None:
            raise RuntimeError('llama-server exited')
        try:
            with urllib.request.urlopen(f'http://127.0.0.1:{PORT}/health', timeout=2) as r:
                if r.status == 200:
                    return
        except Exception:
            pass
        time.sleep(1)
    raise RuntimeError('llama-server not ready')


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--server', required=True)
    ap.add_argument('--models', required=True)
    ap.add_argument('--samples', type=int, default=3)
    ap.add_argument('--only', default='')
    args = ap.parse_args()

    system = (HERE / 'system_prompt.md').read_text()
    scenarios = [(p.stem, json.loads(p.read_text())) for p in sorted((HERE / 'scenarios').glob('*.json'))]
    out_dir = HERE / 'results'
    out_dir.mkdir(exist_ok=True)
    models = sorted(Path(args.models).glob('*.gguf'))
    if args.only:
        models = [m for m in models if args.only.lower() in m.name.lower()]

    for model in models:
        name = model.stem
        print(f'== {name}', flush=True)
        proc = subprocess.Popen(
            [args.server, '-m', str(model), '--port', str(PORT), '-c', '4096', '-t', '4', '--jinja', '--no-webui'],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        try:
            wait_ready(proc)
            runs = []
            for stem, sc in scenarios:
                user = 'FACTS:\n' + json.dumps(sc['facts'], indent=1) + "\n\nWrite the coach's message."
                if 'qwen3' in name.lower():
                    user += ' /no_think'
                for i in range(args.samples):
                    t0 = time.time()
                    res = post('/v1/chat/completions', {
                        'messages': [{'role': 'system', 'content': system}, {'role': 'user', 'content': user}],
                        'temperature': 0.4, 'top_p': 0.9, 'max_tokens': 220, 'seed': 1000 + i,
                    })
                    elapsed = time.time() - t0
                    text = res['choices'][0]['message']['content'] or ''
                    text = re.sub(r'<think>.*?</think>', '', text, flags=re.S).strip()
                    timings = res.get('timings', {})
                    problems = check(text, sc['facts'])
                    runs.append({
                        'scenario': stem, 'sample': i, 'text': text, 'problems': problems, 'pass': not problems,
                        'seconds': round(elapsed, 1), 'tokens': res.get('usage', {}).get('completion_tokens'),
                        'tokens_per_second': round(timings.get('predicted_per_second', 0), 1),
                        'prompt_tokens_per_second': round(timings.get('prompt_per_second', 0), 1),
                    })
                    mark = 'PASS' if not problems else 'FAIL ' + '; '.join(problems)
                    print(f'  {stem} #{i}: {mark} ({elapsed:.0f}s)', flush=True)
            passed = sum(r['pass'] for r in runs)
            summary = {'model': name, 'size_mb': round(model.stat().st_size / 2**20), 'passed': passed, 'runs': len(runs),
                       'pass_rate': round(passed / len(runs), 3),
                       'median_tokens_per_second': sorted(r['tokens_per_second'] for r in runs)[len(runs) // 2]}
            (out_dir / f'{name}.json').write_text(json.dumps({'summary': summary, 'runs': runs}, indent=1))
            print(f'  -> {passed}/{len(runs)} pass, {summary["median_tokens_per_second"]} tok/s', flush=True)
        finally:
            proc.terminate()
            proc.wait()


if __name__ == '__main__':
    sys.exit(main())
