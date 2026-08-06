/**
 * Regression test for the service-worker fetch handler.
 *
 * The bug it locks down: the handler used to end with `.catch(() => hit)` on a
 * path where `hit` was provably undefined, so a transient network failure while
 * pulling a JS chunk resolved respondWith() with a non-Response. Per spec that
 * is a network error — harder than having no service worker at all, because the
 * browser's own HTTP stack never gets the request. The router then threw
 * ChunkLoadError for the segment being navigated into and the reader saw
 * «تعذّر تحميل المقالة» with the layout intact, cured by refreshing two or
 * three times.
 *
 * Invisible to curl, to the build, and to every server-side check — which is
 * why it needs a test rather than a comment.
 *
 * Run: node scripts/test-sw-fetch-handler.mjs
 */
import fs from 'node:fs';
import vm from 'node:vm';

const src = fs.readFileSync('public/sw.js', 'utf8');

function makeScope({ cacheHit, fetchBehaviour }) {
  const listeners = {};
  const store = new Map();
  let fetchCalls = 0;
  const cache = {
    match: async () => (cacheHit ? new Response('cached', { status: 200 }) : undefined),
    put: async (k, v) => { store.set(k, v); },
    keys: async () => [...store.keys()],
    delete: async (k) => store.delete(k),
  };
  const scope = {
    self: null,
    caches: { open: async () => cache, keys: async () => [], delete: async () => true },
    fetch: async () => {
      fetchCalls += 1;
      return fetchBehaviour(fetchCalls);
    },
    Response, Request, URL, Promise, console,
    setTimeout, clearTimeout,
  };
  scope.self = {
    addEventListener: (t, fn) => { listeners[t] = fn; },
    skipWaiting: () => {},
    clients: { claim: async () => {} },
    location: { origin: 'https://x.test' },
    registration: {},
  };
  scope.clients = scope.self.clients;
  vm.createContext(scope);
  vm.runInContext(src, scope);
  return { listeners, getFetchCalls: () => fetchCalls };
}

async function run(label, opts, expect) {
  const { listeners, getFetchCalls } = makeScope(opts);
  const req = new Request('https://x.test/_next/static/chunks/page-abc123.js');
  let responded;
  listeners.fetch({ request: req, respondWith: (p) => { responded = p; } });
  let result, err = null;
  try { result = await responded; } catch (e) { err = e; }
  const isResponse = result instanceof Response;
  const ok = expect(isResponse, result, err, getFetchCalls());
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  console.log(`        → response=${isResponse ? result.status : String(result)}  threw=${err ? err.message : 'no'}  fetches=${getFetchCalls()}`);
  return ok;
}

const netErr = () => { throw new Error('Failed to fetch'); };
let all = true;

all &= await run('cache hit → serves cache, no network',
  { cacheHit: true, fetchBehaviour: netErr },
  (isRes, r, e, n) => isRes && n === 0);

all &= await run('cache miss, network OK → serves network',
  { cacheHit: false, fetchBehaviour: () => new Response('js', { status: 200, headers: {} }) },
  (isRes, r, e, n) => isRes && n === 1);

all &= await run('cache miss, FIRST fetch fails, retry OK → serves retry  [the reported bug]',
  { cacheHit: false, fetchBehaviour: (n) => { if (n === 1) netErr(); return new Response('js', { status: 200 }); } },
  (isRes, r, e, n) => isRes && n === 2);

all &= await run('cache miss, both fetches fail → rejects (browser handles it), never resolves undefined',
  { cacheHit: false, fetchBehaviour: netErr },
  (isRes, r, e, n) => !isRes && e !== null && r === undefined && n === 2);

// Cache API unavailable entirely (private mode, quota, evicted storage): the
// asset must still be served straight from the network, never failed. This is
// the path the first shape of the fix got wrong in the opposite direction — it
// wrapped everything in one catch and made an offline device fetch three times.
{
  const listeners = {};
  let fetchCalls = 0;
  const scope = {
    self: null,
    caches: {
      open: async () => { throw new Error('QuotaExceededError'); },
      keys: async () => [], delete: async () => true,
    },
    fetch: async () => { fetchCalls += 1; return new Response('js', { status: 200 }); },
    Response, Request, URL, Promise, console, setTimeout, clearTimeout,
  };
  scope.self = {
    addEventListener: (t, fn) => { listeners[t] = fn; },
    skipWaiting: () => {}, clients: { claim: async () => {} },
    location: { origin: 'https://x.test' }, registration: {},
  };
  scope.clients = scope.self.clients;
  vm.createContext(scope);
  vm.runInContext(src, scope);
  let responded;
  listeners.fetch({
    request: new Request('https://x.test/_next/static/chunks/p.js'),
    respondWith: (p) => { responded = p; },
  });
  const r = await responded;
  const ok = r instanceof Response && fetchCalls === 1;
  all &= ok;
  console.log(`${ok ? 'PASS' : 'FAIL'}  Cache API unavailable → serves from network anyway`);
  console.log(`        → response=${r instanceof Response ? r.status : String(r)}  fetches=${fetchCalls}`);
}

console.log(all ? '\nALL PASS' : '\nFAILURES');
process.exit(all ? 0 : 1);
