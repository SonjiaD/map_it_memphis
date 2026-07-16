"""
Fetches community amenity and transit layers for the MAPP Memphis map from OpenStreetMap
via the Overpass API, across the Soulsville bbox. Every category is written as Point
features (a representative center point for ways/relations, e.g. a park's centroid) since
the map displays these as pins, not shapes — see data_pipeline/config.py CATEGORIES below
for OSM tag mappings. Transit routes are the one LineString layer (bus route paths).

OSM/Overpass is used here (rather than DataMidSouth's curated MATA/library/community-center
datasets) because it is directly scriptable with no manual download step; DataMidSouth's
static exports are disabled for this portal (confirmed via its embedded config). Swap in
the DataMidSouth files later with --from-file if/when they're downloaded manually — they
are generally cleaner for libraries/community centers/MATA stops specifically.

Usage:
    python data_pipeline/scripts/fetch_soulsville_amenities.py [--category CATEGORY]

Outputs:
    frontend/public/memphis/amenities/{grocery,parks,community_centers,libraries,churches,schools}.geojson
    frontend/public/memphis/transit/{stops,routes}.geojson
    data/runs/<timestamp>_fetch_soulsville_amenities/manifest.yaml
"""

import argparse
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from data_pipeline.config import SOULSVILLE_SW, SOULSVILLE_NE  # noqa: E402
import run_history  # noqa: E402

SCRIPT_NAME = "fetch_soulsville_amenities"
AMENITIES_DIR = ROOT / "frontend" / "public" / "memphis" / "amenities"
TRANSIT_DIR = ROOT / "frontend" / "public" / "memphis" / "transit"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
HEADERS = {"User-Agent": "mapp-memphis-research/1.0 (soulsville participatory mapping project)"}

# Overpass bbox order: (south, west, north, east) = (min_lat, min_lng, max_lat, max_lng)
BBOX = f"{SOULSVILLE_SW[0]},{SOULSVILLE_SW[1]},{SOULSVILLE_NE[0]},{SOULSVILLE_NE[1]}"

RETRY_ATTEMPTS = 3
RETRY_BACKOFF_S = [5, 15, 45]

# category -> Overpass tag filters (each becomes one `nwr[key=value](bbox);` clause)
CATEGORIES = {
    "grocery": {"output": "grocery.geojson", "tags": [("shop", "supermarket"), ("shop", "grocery")]},
    "parks": {"output": "parks.geojson", "tags": [("leisure", "park"), ("leisure", "garden")]},
    "community_centers": {"output": "community_centers.geojson", "tags": [("amenity", "community_centre")]},
    "libraries": {"output": "libraries.geojson", "tags": [("amenity", "library")]},
    "churches": {"output": "churches.geojson", "tags": [("amenity", "place_of_worship")]},
    "schools": {"output": "schools.geojson", "tags": [("amenity", "school")]},
}


def overpass_query(query: str) -> dict:
    last_err = None
    for attempt in range(1, RETRY_ATTEMPTS + 1):
        try:
            resp = requests.post(OVERPASS_URL, data={"data": query}, headers=HEADERS, timeout=60)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            last_err = e
            if attempt < RETRY_ATTEMPTS:
                wait = RETRY_BACKOFF_S[attempt - 1]
                print(f"    Attempt {attempt} failed ({e}); retrying in {wait}s ...")
                time.sleep(wait)
    raise RuntimeError(f"Overpass query failed after {RETRY_ATTEMPTS} attempts") from last_err


def elements_to_points(elements: list, name_field: str = "name") -> dict:
    """Nodes -> their coordinate; ways/relations (fetched with `out center;`) -> their
    center coordinate. Every category is rendered as a pin on the map, so a
    representative point is all we need, not the full shape."""
    features = []
    for el in elements:
        if el["type"] == "node":
            lat, lon = el.get("lat"), el.get("lon")
        else:
            center = el.get("center") or {}
            lat, lon = center.get("lat"), center.get("lon")
        if lat is None or lon is None:
            continue
        tags = el.get("tags", {})
        features.append({
            "type": "Feature",
            "properties": {
                "osm_type": el["type"],
                "osm_id": el["id"],
                "name": tags.get(name_field),
                **{k: v for k, v in tags.items() if k in ("addr:housenumber", "addr:street", "phone", "website")},
            },
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
        })
    return {"type": "FeatureCollection", "features": features}


def fetch_category(name: str, tags: list):
    clauses = "".join(f'nwr["{k}"="{v}"]({BBOX});' for k, v in tags)
    query = f"[out:json][timeout:30];({clauses});out center tags;"
    print(f"    Query: {len(tags)} tag filter(s) over bbox {BBOX}")
    data = overpass_query(query)
    elements = data.get("elements", [])
    print(f"    Raw elements: {len(elements)}")
    return elements_to_points(elements)


def fetch_transit():
    """Bus stops as points, bus routes as LineStrings (built from each route relation's
    member ways, fetched with full geometry via `out geom;`)."""
    print("  Stops")
    stops_query = (
        f'[out:json][timeout:30];'
        f'(node["highway"="bus_stop"]({BBOX});node["public_transport"="platform"]({BBOX});'
        f'node["railway"="tram_stop"]({BBOX}););out tags;'
    )
    stops_data = overpass_query(stops_query)
    stops = elements_to_points(stops_data.get("elements", []))
    print(f"    {len(stops['features'])} stop(s)")

    print("  Routes")
    routes_query = f'[out:json][timeout:30];(relation["route"="bus"]({BBOX}););out geom;'
    routes_data = overpass_query(routes_query)
    route_features = []
    for rel in routes_data.get("elements", []):
        if rel["type"] != "relation":
            continue
        lines = []
        for member in rel.get("members", []):
            geom = member.get("geometry")
            if member.get("type") == "way" and geom:
                lines.append([[pt["lon"], pt["lat"]] for pt in geom])
        if not lines:
            continue
        tags = rel.get("tags", {})
        route_features.append({
            "type": "Feature",
            "properties": {
                "osm_id": rel["id"],
                "ref": tags.get("ref"),
                "name": tags.get("name"),
            },
            "geometry": {"type": "MultiLineString", "coordinates": lines},
        })
    routes = {"type": "FeatureCollection", "features": route_features}
    print(f"    {len(route_features)} route(s)")
    return stops, routes


def save(path: Path, geojson: dict, source: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    geojson = {**geojson, "source": source, "fetched_at": datetime.now(timezone.utc).isoformat()}
    text = json.dumps(geojson, ensure_ascii=False)
    path.write_text(text, encoding="utf-8")
    size_kb = len(text.encode("utf-8")) / 1024
    print(f"    Saved {len(geojson.get('features', []))} feature(s), {size_kb:.0f} KB -> "
          f"{path.relative_to(ROOT)}")
    return len(geojson.get("features", [])), size_kb


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", choices=list(CATEGORIES.keys()) + ["transit"], default=None,
                         help="Fetch only one category (default: fetch all)")
    args = parser.parse_args()

    start_tag = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H-%M")
    counts = {}

    targets = [args.category] if args.category else list(CATEGORIES.keys()) + ["transit"]

    for i, name in enumerate(targets, 1):
        print(f"[{i}/{len(targets)}] {name}")
        if name == "transit":
            stops, routes = fetch_transit()
            n1, kb1 = save(TRANSIT_DIR / "stops.geojson", stops, "OpenStreetMap via Overpass API")
            n2, kb2 = save(TRANSIT_DIR / "routes.geojson", routes, "OpenStreetMap via Overpass API")
            counts["transit_stops"] = {"features": n1, "kb": round(kb1, 1)}
            counts["transit_routes"] = {"features": n2, "kb": round(kb2, 1)}
        else:
            spec = CATEGORIES[name]
            geojson = fetch_category(name, spec["tags"])
            n, kb = save(AMENITIES_DIR / spec["output"], geojson, "OpenStreetMap via Overpass API")
            counts[name] = {"features": n, "kb": round(kb, 1)}

        if i < len(targets):
            time.sleep(2)  # be polite to the shared Overpass instance between categories
        print()

    manifest = {
        "script": SCRIPT_NAME,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "counts": counts,
        "notes": "OSM/Overpass source. Swap libraries/community_centers/transit for "
                 "DataMidSouth's curated datasets via --from-file if manually downloaded.",
    }
    run_dir = run_history.write_run(SCRIPT_NAME, start_tag, manifest, snapshot_files={})
    print(f"Done. Run history: {run_dir}")


if __name__ == "__main__":
    main()
