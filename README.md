# MAPP Memphis

**Measuring Assets, People, and Places** — a youth-led participatory mapping project for the Soulsville neighborhood in South Memphis, TN.

MAPP Memphis compares resident-drawn neighborhood boundaries against official administrative boundaries (census tracts, zip codes, Memphis 3.0 planning districts) to show where the two diverge. Youth researchers trained through a partnership with **Knowledge Quest** collect boundary drawings, asset pins, and oral history interviews from Soulsville residents in the field; the public site displays that data layered against the official lines.

This project supports research by **Dr. Brenda Mathias**, Assistant Professor, School of Social Work, University of Memphis.

> **Status: work in progress.** This repo is being pivoted from a prior project, TinyHome-Oakland (a parking-siting tool for Oakland, CA), and is being rebuilt in phases. This README is updated as each phase lands.

---

## Architecture

- **Frontend:** React + TypeScript + TailwindCSS + Leaflet (`react-leaflet`), deployed on Netlify.
- **Database:** Supabase (Postgres + Auth), with row-level security enforcing a two-tier access model:
  - **Public visitors** — no login, read-only map exploration.
  - **Youth researchers** — logged-in accounts flagged `is_researcher` (set manually by the study coordinator), who can draw boundaries and drop asset pins from the field.
- **No backend server.** Official boundary/amenity/transit layers are static GeoJSON files served alongside the frontend; researcher submissions write directly to Supabase (authorized by RLS); the resident-drawn consensus heatmap is computed live in the browser (Turf.js) from published submissions — no server-side compute needed.
- **`data_pipeline/`:** one-off/periodic Python scripts that fetch and clean Memphis/Shelby County boundary and amenity data (census tracts, zip codes, MATA transit, grocery stores, parks, libraries, etc.) into the static GeoJSON files the frontend serves.

## Local setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`. Requires a `frontend/.env` with Supabase credentials — see `frontend/.env.example` (added in Phase 2).

### Data pipeline

See `data_pipeline/README.md` for fetching/regenerating the Memphis boundary and amenity layers.

## Build progress

- [x] **Phase 1 — Strip & rebrand.** Removed the Oakland parking-siting app (AHP/WSM ranking, voting, the Flask backend, Oakland map data). Rebuilt routing/nav for MAPP Memphis's public map + researcher login structure. Auth (login/signup) carried over from TinyHome-Oakland.
- [ ] **Phase 2 — New Supabase project & schema.** `profiles` (with `is_researcher`), `drawn_boundaries`, `asset_pins`, `oral_histories`, RLS policies, Realtime.
- [ ] **Phase 3 — Data pipeline.** Memphis census tracts, zip codes, Memphis 3.0 South District, transit, and community amenity layers.
- [ ] **Phase 4 — Public map page.** The Soulsville explore map with toggleable official boundary and amenity layers.
- [ ] **Phase 5 — Researcher tier.** Gating the field-collection tool to flagged accounts.
- [ ] **Phase 6 — Collection tool.** Touch-friendly boundary drawing + asset-pin dropping for tablets in the field.
- [ ] **Phase 7 — Live consensus heatmap.** Client-side aggregation of published boundaries into a heatmap + overlap statistic, live-updating via Supabase Realtime.
- [ ] **Phase 8 — Content, env, deploy.** About/Methodology copy, `.env.example` files, Netlify config.

## Prior project

This repo began as a fork of **TinyHome-Oakland**, a geospatial decision-support tool for siting Tiny Homes on Oakland parking spots (still live at [tinyhomeproject.netlify.app](https://tinyhomeproject.netlify.app/), on its own separate Supabase project — untouched by this pivot). MAPP Memphis reuses its stack pattern (React/TypeScript/Tailwind/Leaflet/Supabase) and some UI primitives (the map drawing-tool code, teardrop pin markers), but the ranking/voting logic and Oakland-specific data have been removed entirely, since there is nothing to rank or vote on in this project.
