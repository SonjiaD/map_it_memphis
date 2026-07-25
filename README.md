# MAPP It Memphis

**Measuring Assets, People, and Places** is a youth-led participatory mapping project for the Soulsville neighborhood in South Memphis, TN, supporting research by Dr. Brenda Mathias (School of Social Work, University of Memphis) in partnership with Knowledge Quest.

The site compares how residents define their own neighborhood against official administrative boundaries (census tracts, zip codes, Memphis 3.0 planning districts). Youth researchers collect resident-drawn boundaries, asset pins, and oral history interviews in the field on tablets; the public site shows that data layered against the official lines, including a live consensus heatmap of where residents' drawn boundaries agree.

## What the site does

- **Public map (no login needed):** explore Soulsville with toggleable layers, official boundaries, resident-drawn consensus heatmap, community asset pins (grocery stores, parks, libraries, community centers, churches, schools), and transit (MATA stops and routes).
- **Researcher tool (login required):** youth researchers authorized for data collection draw a resident's neighborhood boundary on the map, drop pins for places the resident points out, and save it, all from a tablet in the field. Submissions appear on the public map right away.

## Tech stack

- **Frontend:** React + TypeScript + TailwindCSS + Leaflet, deployed on Netlify.
- **Database:** Supabase (Postgres + Auth), with row-level security separating public read access from researcher write access.
- No backend server: static map layers are plain GeoJSON files, and the consensus heatmap is computed live in the browser.

## Local setup

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`. Requires a `frontend/.env` with your Supabase project URL and anon key (see `frontend/.env.example`).

## Data pipeline

Scripts for fetching and cleaning Memphis boundary and amenity data live in `data_pipeline/`, see `data_pipeline/README.md` for details.

## Data model notes

**Session timing (`drawn_boundaries.started_at` / `ended_at`).** Each collection session records two timestamps:

- `started_at` = the moment the researcher **begins drawing the map** (leaving the consent/info step for the draw step). It deliberately does *not* include the time spent reading the consent script and filling in respondent details.
- `ended_at` = when they hit **Save**.

Both are captured on the client (one clock, so the duration is consistent) and stored in UTC. The admin console renders them in **Memphis local time (America/Chicago, "CT")** and uses `started_at` for the per-map download filenames. The older `session_date` column is retained but no longer displayed.

**Admin map downloads.** Admins can download each submitted boundary as a zipped Shapefile, or all of them at once. Filenames follow `{n}_{researcher}_{yyyy-mm-dd}_{hhmm}ct` where `n` is a global sequence numbering every map by session start (earliest = 1), so each file has a unique number (see `frontend/src/pages/AdminPage.tsx`). Note the Shapefile `.dbf` format truncates attribute *column names* to 8 characters (values are intact).
