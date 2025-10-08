sweet — looks like your “agent” already wired the Next.js side to the new /v1 API and added an adapter in src/lib/api.ts. Here’s a tidy, copy-pasteable runbook you can hand an agent to verify + finish the migration and catch any stragglers.

Agent Handoff: Finalize Next.js migration to /v1 search API

What’s already done (per your tool logs)
	•	Server routes updated to hit:
	•	/v1/search/attorneys
	•	/v1/search/facets
	•	/v1/attorneys and /v1/attorneys/:id
	•	src/lib/api.ts now maps backend { items, estimatedTotal } → frontend { hits, total } (adapter layer).
	•	Test page updated to use q/office_city, parsing items.

Goal

Finish the migration, ensure no callers reference estimatedTotalHits/totalHits or old paths, and ship with clean types, build, and e2e checks.

⸻

1) Env + config

# In the Next.js repo root
grep -q '^NEXT_PUBLIC_API_URL=' .env.local || echo 'NEXT_PUBLIC_API_URL=https://api.viewport.software' >> .env.local
grep -q '^NEXT_PUBLIC_API_PREFIX=' .env.local || echo 'NEXT_PUBLIC_API_PREFIX=/v1' >> .env.local

# Show current values
echo; echo "---- .env.local ----"; cat .env.local | grep NEXT_PUBLIC_API_

2) Sanity: code references

# Must be zero results after edits:
grep -RnE 'estimatedTotalHits|totalHits' src || true
grep -RinE '"/search/attorneys"|'\''/search/attorneys'\''' src || true

# Check we route via our API client or new API routes:
grep -RinE 'searchAttorneys\(|/api/search|/v1/search/attorneys' src || true

If anything matches the first two greps, refactor callers to consume the normalized shape from src/lib/api.ts:

const { hits, total } = await searchAttorneys({ q, limit, offset, office_city, practice, firm_id });

3) Types & adapter (single source of truth)

Open src/lib/api.ts and verify (or replace) the search function with this exact version:

// src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX || '/v1';

export type Attorney = {
  attorney_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  firm_id: string;
  firm_name: string;
  office_city: string;
  office_country: string;
  practice_areas: string[];
  title: string;
  bio: string;
  jd_year: number;
  headshot_url: string | null;
};

export type SearchParams = {
  q?: string;
  limit?: number;
  offset?: number;
  firm_id?: string;
  office_city?: string;
  practice?: string;
};

export async function searchAttorneys(params: SearchParams = {}) {
  const url = new URL(`${API_URL}${API_PREFIX}/search/attorneys`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`search failed: ${res.status} ${res.statusText}`);

  // Backend: { items, estimatedTotal }
  const data = await res.json() as {
    items?: Attorney[];
    estimatedTotal?: number;
    hits?: Attorney[];   // (graceful if a local mock returns hits)
    total?: number;      // fallback
  };

  const items = data.items ?? data.hits ?? [];
  const estimatedTotal = data.estimatedTotal ?? data.total ?? items.length;

  // Adapter keeps the rest of the app stable
  return { hits: items, total: estimatedTotal, limit: Number(url.searchParams.get('limit') || 20), offset: Number(url.searchParams.get('offset') || 0) };
}

4) Build + typecheck

# pick your manager
npm ci || yarn --frozen-lockfile || pnpm i --frozen-lockfile

# strict types
npm run type-check || npm run ts:check || true

# build
npm run build

5) Local smoke (via Next API and direct backend)

# Next.js dev or preview server must be running if you test its API routes:
# npm run dev  (or use your preview URL if deployed)

# Through Next local route (if you keep an /api/search proxy)
curl -sS 'http://localhost:3000/api/search?q=smith&limit=2' | jq .

# Direct to backend (bypassing Next):
curl -sS 'https://api.viewport.software/v1/search/attorneys?q=smith&limit=2' | jq .

Expect non-empty items and a sensible estimatedTotal (or total via adapter).

6) UI verification
	•	Open your search page (e.g., /search) and confirm:
	•	Results render from hits.
	•	Pagination uses total.
	•	Filters use q, office_city, practice, firm_id (no firm names unless you map them to IDs).

If any UI code still reads estimatedTotalHits or totalHits, switch to total (adapter) or to estimatedTotal if you want to delete the adapter (see next section).

7) (Optional) Remove the adapter and use backend shape directly

If you’d rather align UI to backend:
	•	Change searchAttorneys to return { items, estimatedTotal } directly.
	•	Bulk replace in callers:
	•	hits → items
	•	total → estimatedTotal
	•	Re-run steps 4–6.

8) Deployment checklist
	•	Ensure Vercel/hosting has:
	•	NEXT_PUBLIC_API_URL=https://api.viewport.software
	•	NEXT_PUBLIC_API_PREFIX=/v1
	•	Trigger a fresh build.
	•	Run an end-to-end smoke (same two curls as Step 5 against your deployed URL if you proxy through Next).

⸻

Acceptance Criteria
	•	No references remain to estimatedTotalHits or totalHits.
	•	All search requests go to /v1/search/attorneys.
	•	The UI paginates using total (or estimatedTotal if you dropped the adapter).
	•	TypeScript clean, production build succeeds.
	•	Manual query q=smith&limit=2 shows results in UI consistent with backend.
