# data/

Source-of-truth copies of the map data fetched by `data_pipeline/`. The frontend doesn't
read from here directly — every file here has a matching copy under
`frontend/public/memphis/` (or `frontend/public/memphis/amenities/` /
`frontend/public/memphis/transit/`), which is what the map actually loads. Keeping both
means the frontend's public assets are always exactly what was last fetched, while this
folder is the versioned record of it.

## boundaries/

Official administrative boundaries, fetched by `data_pipeline/scripts/fetch_memphis_boundaries.py`:

| File | Source | Real data? |
|------|--------|------------|
| `census_tracts.geojson` | US Census Bureau TIGERweb REST API | Yes |
| `zip_codes.geojson` | US Census Bureau TIGERweb REST API (ZCTA layer) | Yes |
| `memphis30_south_district.geojson` | — | **No — placeholder.** Shelby County's GIS server (the authoritative source for the real Memphis 3.0 South District boundary) sits behind Cloudflare bot protection that blocks scripted requests entirely, and DataMidSouth has static/API exports disabled for this dataset. The file has `is_placeholder: true` on its one feature (a rough box over Soulsville, not the real district shape). **Replace this file with a real download** (browse to https://www.memphis3point0.com/district-home/south-district or the Shelby County GIS portal, export/save as GeoJSON, drop it in at both `data/boundaries/memphis30_south_district.geojson` and `frontend/public/memphis/memphis30_south_district.geojson`) whenever you have it. |

Both real files are clipped to a wide bbox around Soulsville (see `BOUNDARY_CLIP_SW`/`BOUNDARY_CLIP_NE` in `data_pipeline/config.py`) — intentionally wider than just the neighborhood itself, so the map shows the surrounding administrative units too (the whole point of the MAUP comparison is seeing how official lines cut across a place residents experience as one neighborhood).

## Amenities and transit (`frontend/public/memphis/amenities/`, `frontend/public/memphis/transit/`)

Fetched by `data_pipeline/scripts/fetch_soulsville_amenities.py` from OpenStreetMap via the Overpass API. Every category is a set of Point pins (a representative center point even for OSM ways/polygons, e.g. a park's centroid) since the map displays these as icons, not shapes.

| File | OSM tags | Notes |
|------|----------|-------|
| `amenities/grocery.geojson` | `shop=supermarket`, `shop=grocery` | 0 results as of the last fetch — genuinely no OSM-tagged grocery store in the Soulsville bbox, not a bug. Worth checking against a curated source; food access is directly relevant to this project's framing. |
| `amenities/parks.geojson` | `leisure=park`, `leisure=garden` | |
| `amenities/community_centers.geojson` | `amenity=community_centre` | Only 1 result — OSM tagging is likely incomplete here; DataMidSouth's community centers dataset is probably more complete. |
| `amenities/libraries.geojson` | `amenity=library` | Only 1 result — same caveat as community centers. |
| `amenities/churches.geojson` | `amenity=place_of_worship` | 168 results. |
| `amenities/schools.geojson` | `amenity=school` | 19 results. |
| `transit/stops.geojson` | `highway=bus_stop`, `public_transport=platform`, `railway=tram_stop` | **0 results — OSM has no tagged MATA stops in this bbox.** This isn't a fetch error (confirmed with a direct, isolated query); OSM's transit-stop tagging is just incomplete here. Swap in MATA's official stops dataset from DataMidSouth (https://www.datamidsouth.org/explore/assets/mata-stops0/view/, manual download) when available. |
| `transit/routes.geojson` | `route=bus` relations | 16 real bus route paths (line geometry), built from each route relation's member ways. |

`knowledge_quest.geojson` (a single pin for the project's partner organization) isn't fetched — it's a small static file with coordinates geocoded from Knowledge Quest's published main campus address.

## exports/

Timestamped research CSV exports written by `data_pipeline/scripts/export_research_data.py` — `profiles`, `drawn_boundaries`, `asset_pins`, `oral_histories`. **Gitignored** (may contain PII from respondent metadata; local machine only). Each export also drops a manifest under `data/runs/` recording row counts and when it ran.

## runs/

Version history for every pipeline script run — see `data_pipeline/README.md` → "Run history".
