"""Reorder manifest.txt so rolls read well: heroes first, then one roll at a time,
with frames from the same source roll / same scene spread apart instead of adjacent.
Run:  python3 tools/sequence.py   (then tools/export.py + tools/make_index.py)"""
import os, re
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAN = os.path.join(root, 'manifest.txt')
# roll order on the site; each entry lists the chapters in that roll
ROLLS = [['after-dark'], ['live'], ['new-york'], ['new-orleans'],
         ['london', 'paris', 'dublin', 'elsewhere'], ['streets', 'strays'], ['sun']]
lines = [l.rstrip('\n') for l in open(MAN)]
header = [l for l in lines if l.startswith('#')]
rows = [[c.strip() for c in l.split('|')] for l in lines if l.strip() and not l.startswith('#')]

def folder(src):
    parts = src.split('/'); return parts[-2]
def scene(cap):
    return re.sub(r'\s+(i{1,3}|iv|v|vi{0,3}|ix|x)$', '', cap.strip().lower())

def stride(items):
    """permute a list so originally-consecutive frames end up far apart"""
    n = len(items)
    if n < 3: return items
    k = max(2, round(n / 2.618))
    while any(k % d == 0 and n % d == 0 for d in range(2, min(k, n) + 1)): k += 1
    return [items[(i * k) % n] for i in range(n)]

def sequence(items):
    by = {}
    for r in items: by.setdefault(folder(r[0]), []).append(r)
    N = len(items); out = []
    for f, lst in by.items():
        lst = stride(lst)
        for i, r in enumerate(lst): out.append(((i + 0.5) / len(lst) * N + 0.001 * hash(f) % 1, r))
    out.sort(key=lambda t: t[0]); seq = [r for _, r in out]
    # local repair: no two neighbours from the same folder or same scene when avoidable
    def clash(a, b): return a is not None and b is not None and (folder(a[0]) == folder(b[0]) or scene(a[3]) == scene(b[3]))
    for _ in range(4):
        for i in range(1, len(seq)):
            if clash(seq[i-1], seq[i]):
                for j in range(i + 1, len(seq)):
                    prev, nxt = seq[i-1], (seq[i+1] if i + 1 < len(seq) else None)
                    jprev, jnxt = seq[j-1], (seq[j+1] if j + 1 < len(seq) else None)
                    if not clash(prev, seq[j]) and not clash(seq[j], nxt) and not clash(jprev if j-1 != i else seq[j], seq[i]) and not clash(seq[i], jnxt):
                        seq[i], seq[j] = seq[j], seq[i]; break
    return seq

heroes = [r for r in rows if r[4] == '1']
rest = [r for r in rows if r[4] != '1']
ordered = list(heroes)
seen = set()
for chaps in ROLLS:
    grp = [r for r in rest if r[2] in chaps]
    seen.update(id(r) for r in grp)
    ordered += sequence(grp)
ordered += [r for r in rest if id(r) not in seen]   # anything in no roll goes last
assert len(ordered) == len(rows)
with open(MAN, 'w') as f:
    for h in header: f.write(h + '\n')
    for r in ordered: f.write(' | '.join(r) + '\n')
# report
adj = 0; cur = None
for r in ordered[len(heroes):]:
    if cur and folder(cur[0]) == folder(r[0]) and cur[2] == r[2]: adj += 1
    cur = r
print(len(ordered), 'frames sequenced;', adj, 'same-folder neighbours remain')
