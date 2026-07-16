# data_pipeline/

Scripts that fetch and clean the map data for MAPP It Memphis. Run these manually to
(re)generate the Soulsville boundary, amenity, and transit layers the frontend serves as
static files — there's no backend, so whatever these scripts write under
`frontend/public/memphis/` is exactly what the map shows.

## Setup

```bash
python -m venv venv
venv\Scripts\activate        # Windows; source venv/bin/activate on macOS/Linux
pip install -r data_pipeline/requirements.txt
```

`export_research_data.py` additionally needs a `data_pipeline/.env` with Supabase
credentials — see `data_pipeline/.env.example`.

## scripts/

| Script | What it does |
|--------|-------------|
| `fetch_memphis_boundaries.py` | Fetches census tracts and ZIP code tabulation areas from the US Census Bureau's TIGERweb REST API, clipped to a wide bbox around Soulsville. Also writes a **placeholder** Memphis 3.0 South District polygon (see `data/README.md` for why, and how to replace it with the real boundary once downloaded). Writes to both `data/boundaries/` (source-of-truth copy) and `frontend/public/memphis/` (what the site serves). |
| `fetch_soulsville_amenities.py` | Fetches grocery stores, parks, community centers, libraries, churches, schools, and transit (bus stops + routes) from OpenStreetMap via the Overpass API, over the Soulsville bbox. Writes to `frontend/public/memphis/amenities/` and `frontend/public/memphis/transit/`. See `data/README.md` for known gaps (some categories have very few or zero OSM-tagged results in this area — documented per-file, not silently missing). |
| `export_research_data.py` | Dumps the full research dataset (`profiles`, `drawn_boundaries`, `asset_pins`, `oral_histories`) to timestamped CSVs under `data/exports/<timestamp>/`. Requires `SUPABASE_SERVICE_ROLE_KEY` (these tables have RLS enabled). |
| `run_history.py` | Shared helper (not a standalone script) used by the fetch/export scripts to write `data/runs/` snapshots and manifests. |

## Run history

Each script that writes a data file records a run under `data/runs/<timestamp>_<script_name>/`:
a `manifest.yaml` (committed — counts, source, notes) and, where relevant, a data snapshot
(local-only, gitignored). Each script keeps its own history lane, so a rerun only diffs
against that same script's previous run.

## Replacing OSM data with curated sources

Several categories currently come from OpenStreetMap because it's directly scriptable —
no manual download step. DataMidSouth publishes cleaner, curated versions of some of these
(MATA stops/routes, libraries, community centers), but its portal has static/API exports
disabled for the datasets checked so far, so getting that data in means a manual browser
download. If/when you have one:

1. Download the dataset as GeoJSON from datamidsouth.org (or wherever the authoritative
   source turns out to be).
2. Drop it in at the matching path under `frontend/public/memphis/` (e.g.
   `frontend/public/memphis/transit/stops.geojson`), replacing the OSM-derived file.
3. Note the swap in `data/README.md`'s per-file table so it's clear which files are
   OSM-derived vs. official-source.

## Roadmap: disinvestment / context layers (not yet fetched)

These were identified as relevant to the project's framing (interview themes around
access, safety, and disinvestment) but aren't part of the current build. Sources, for
whenever this is picked up:

- Eviction court cases, Shelby County — https://www.datamidsouth.org/explore/assets/eviction-court-cases-shelby-county/
- Building & demolition permits — https://www.datamidsouth.org/explore/assets/shelby-county-building-and-demolition-permits/
- Historical code enforcement requests — https://www.datamidsouth.org/explore/assets/historical-code-enforcement-requests/
- Memphis Police Department public safety incidents — https://data.memphistn.gov/Public-Safety/Memphis-Police-Department-Public-Safety-Incidents/puh4-eea4/about_data
- Median household income by race, median monthly housing cost (tract-level context) — search datamidsouth.org/explore/

## Supabase database

Project `mapp-memphis` (separate from the prior `tinyhome-submissions` project). Schema
lives in `supabase/migrations/`. Summary:

| Table | Holds |
|-------|-------|
| `profiles` | One row per account: name, email, `is_researcher` (flipped manually in the Supabase dashboard — never user-settable). |
| `drawn_boundaries` | One row per resident interview: the drawn boundary polygon, respondent metadata (age range, years in neighborhood, relationship to the neighborhood), consent, session date. |
| `asset_pins` | One row per place a respondent pointed out: category, location, why it matters, optionally linked to a `drawn_boundaries` row. |
| `oral_histories` | Schema in place for a later phase (audio/transcript pins) — not yet exposed in the UI. |

RLS: public read of published rows, insert/update restricted to accounts with
`is_researcher = true` on their own rows. See the migration files for the exact policies.

**Service role key:** `export_research_data.py` needs `SUPABASE_SERVICE_ROLE_KEY` in
`data_pipeline/.env` (Supabase dashboard → Settings → API → `service_role` secret) to read
every row, including unpublished ones, for research purposes. This key is admin-only —
never expose it in the frontend.

## config.py

Shared settings: the Soulsville bbox, the wider boundary-clip bbox, and the UTM zone
(15N — Memphis, not the 10N used by the prior Oakland project).
