# -*- coding: utf-8 -*-
"""Find articles that compete for the same search intent.

Not a generic similarity score: two guides can share many words and still answer
different questions. So the signal is the TITLE's content words after stripping
the filler that appears on almost every title here, plus the requirement that
the pair sits in a related category. Pairs are then reported for human reading,
never merged automatically.
"""
import json, os, re, itertools
from collections import defaultdict

S = os.path.dirname(os.path.abspath(__file__))
rows = json.load(open(os.path.join(S, 'corpus.json'), encoding='utf-8'))

# Words that carry no distinguishing meaning in this corpus — they appear in a
# large share of titles, so leaving them in makes everything look similar.
STOP = set("""في من على عن إلى الى مع بعد قبل بين كل ما لا هل ماذا كيف متى اين أين
لماذا هي هو التي الذي و أو ثم دليل شرح خطوات كامل كاملة الكامل الشامل شامل
تركيا التركية التركي 2026 2025 الجديد الجديدة الرسمي الرسمية بالتفصيل تفصيلي
للسوريين السوريين سوريا الأجانب للأجانب طريقة طرق ال أهم نصائح معلومات""".split())

def norm(t):
    t = re.sub(r'[ً-ْ]', '', t or '')          # harakat
    t = t.replace('أ','ا').replace('إ','ا').replace('آ','ا').replace('ة','ه').replace('ى','ي')
    t = re.sub(r'[^ء-يa-zA-Z0-9\s]', ' ', t)
    return t

def keywords(t):
    return {w for w in norm(t).split() if len(w) > 2 and w not in STOP}

for r in rows:
    r['kw'] = keywords(r['title'])

# Category families — a pair only counts if it could plausibly serve one query.
FAMILY = {
    'الكملك والحماية المؤقتة': 'kimlik', 'خدمات السوريين': 'kimlik',
    'أنواع الإقامات': 'residence', 'الفيزا والتأشيرات': 'residence',
    'معاملات رسمية': 'official', 'خدمات e-Devlet': 'official',
    'العمل والاستثمار': 'work', 'الدراسة والتعليم': 'edu',
    'الصحة والتأمين': 'health', 'السكن والحياة': 'housing',
}

pairs = []
for a, b in itertools.combinations(rows, 2):
    if not a['kw'] or not b['kw']:
        continue
    fa, fb = FAMILY.get(a['category']), FAMILY.get(b['category'])
    if fa is None or fa != fb:
        continue
    inter = a['kw'] & b['kw']
    if len(inter) < 2:
        continue
    j = len(inter) / len(a['kw'] | b['kw'])
    if j >= 0.42:
        pairs.append((round(j, 3), a['slug'], b['slug'], sorted(inter)))

pairs.sort(reverse=True)

# Group overlapping pairs into clusters (union-find).
parent = {}
def find(x):
    parent.setdefault(x, x)
    while parent[x] != x:
        parent[x] = parent[parent[x]]; x = parent[x]
    return x
def union(x, y):
    parent[find(x)] = find(y)
for _, a, b, _ in pairs:
    union(a, b)

groups = defaultdict(list)
for s in {s for _, a, b, _ in pairs for s in (a, b)}:
    groups[find(s)].append(s)

by_slug = {r['slug']: r for r in rows}
print('candidate pairs :', len(pairs))
print('clusters        :', len(groups))
print()
out = []
for i, (root, members) in enumerate(sorted(groups.items(), key=lambda kv: -len(kv[1])), 1):
    print('--- cluster %d (%d pages) ---' % (i, len(members)))
    for s in sorted(members):
        r = by_slug[s]
        print('   %-42s | %-26s | %s' % (s[:42], r['category'][:26], r['title'][:70]))
    out.append(sorted(members))
    print()
json.dump(out, open(os.path.join(S, 'clusters.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
