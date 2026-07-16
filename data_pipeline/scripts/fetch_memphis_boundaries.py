"""
Fetches official administrative boundary layers for the MAPP Memphis map: census
tracts and ZIP code tabulation areas from the US Census Bureau's TIGERweb REST API
(a stable, scriptable, authoritative source — no manual download needed), clipped to
the BOUNDARY_CLIP bbox around Soulsville.

The Memphis 3.0 South District boundary is NOT fetched here: Shelby County's own GIS
server (gis.shelbycountytn.gov) sits behind Cloudflare bot protection that blocks
scripted requests entirely (confirmed: a plain query returns an HTML challenge page,
not JSON, regardless of headers), and datamidsouth.org has its static/API export
disabled for this dataset ("enable_static_exports": false in the portal's own config).
A clearly-flagged placeholder polygon is written instead — see write_placeholder_south_district()
below. Replace data/boundaries/memphis30_south_district.geojson with a real download
(e.g. from https://www.memphis3point0.com/district-home/south-district or the Shelby
County GIS portal via a browser) whenever it's available, then rerun this script with
--skip-tracts --skip-zips to just recopy it into frontend/public/.

Usage:
    python data_pipeline/scripts/fetch_memphis_boundaries.py

Outputs (both a source-of-truth copy and the frontend-served copy):
    data/boundaries/census_tracts.geojson              -> frontend/public/memphis/census_tracts.geojson
    data/boundaries/zip_codes.geojson                  -> frontend/public/memphis/zip_codes.geojson
    data/boundaries/memphis30_south_district.geojson   -> frontend/public/memphis/memphis30_south_district.geojson  (PLACEHOLDER)
    data/runs/<timestamp>_fetch_memphis_boundaries/manifest.yaml
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests
from shapely.geometry import shape, box

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from data_pipeline.config import BOUNDARY_CLIP_SW, BOUNDARY_CLIP_NE  # noqa: E402
import run_history  # noqa: E402

SCRIPT_NAME = "fetch_memphis_boundaries"
BOUNDARIES_DIR = ROOT / "data" / "boundaries"
PUBLIC_DIR = ROOT / "frontend" / "public" / "memphis"

# (min_lng, min_lat, max_lng, max_lat) — matches BOUNDARY_CLIP_SW/NE in config.py
BBOX = (BOUNDARY_CLIP_SW[1], BOUNDARY_CLIP_SW[0], BOUNDARY_CLIP_NE[1], BOUNDARY_CLIP_NE[0])
CLIP_BOX = box(*BBOX)

TIGERWEB = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb"
TRACTS_URL = f"{TIGERWEB}/Tracts_Blocks/MapServer/4/query"
ZCTA_URL = f"{TIGERWEB}/PUMA_TAD_TAZ_UGA_ZCTA/MapServer/7/query"


def fetch_arcgis_geojson(url: str, extra_params: dict) -> dict:
    params = {
        "geometry": ",".join(str(v) for v in BBOX),
        "geometryType": "esriGeometryEnvelope",
        "inSR": 4326,
        "spatialRel": "esriSpatialRelIntersects",
        "outSR": 4326,
        "f": "geojson",
        **extra_params,
    }
    resp = requests.get(url, params=params, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    if "error" in data:
        raise RuntimeError(f"ArcGIS REST error from {url}: {data['error']}")
    return data


def clip_and_simplify(geojson: dict, tolerance_deg: float = 0.0001) -> dict:
    """Clip every feature to the bbox (defensive — the server-side query already
    filters by intersection, but a feature can extend well beyond the bbox) and
    lightly simplify to keep the file small for the browser.

    Esri's f=geojson conversion occasionally emits multipolygon ring structures
    shapely's shape() can't parse (inconsistent ring winding). Those features are
    passed through unclipped/unsimplified rather than dropped or crashing the run —
    the server-side spatial query already guarantees they intersect the bbox.
    """
    out_features = []
    skipped = 0
    for feat in geojson.get("features", []):
        try:
            geom = shape(feat["geometry"])
            clipped = geom.intersection(CLIP_BOX)
            if clipped.is_empty:
                continue
            simplified = clipped.simplify(tolerance_deg, preserve_topology=True)
            out_geometry = simplified.__geo_interface__
        except Exception:
            skipped += 1
            out_geometry = feat["geometry"]
        out_features.append({
            "type": "Feature",
            "properties": feat.get("properties", {}),
            "geometry": out_geometry,
        })
    if skipped:
        print(f"    ({skipped} feature(s) passed through unclipped — malformed multipolygon geometry)")
    return {"type": "FeatureCollection", "features": out_features}


def write_geojson(name: str, geojson: dict, source: str):
    BOUNDARIES_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

    geojson = {**geojson, "source": source, "fetched_at": datetime.now(timezone.utc).isoformat()}

    src_path = BOUNDARIES_DIR / name
    pub_path = PUBLIC_DIR / name
    text = json.dumps(geojson, ensure_ascii=False)
    src_path.write_text(text, encoding="utf-8")
    pub_path.write_text(text, encoding="utf-8")
    size_kb = len(text.encode("utf-8")) / 1024
    print(f"  {len(geojson.get('features', []))} feature(s), {size_kb:.0f} KB -> "
          f"{pub_path.relative_to(ROOT)}")
    return len(geojson.get("features", [])), size_kb


def write_placeholder_south_district():
    """A clearly-flagged placeholder box roughly over Soulsville, standing in for the
    real Memphis 3.0 South District boundary until it can be downloaded manually."""
    from data_pipeline.config import SOULSVILLE_SW, SOULSVILLE_NE

    sw, ne = SOULSVILLE_SW, SOULSVILLE_NE
    ring = [[sw[1], sw[0]], [ne[1], sw[0]], [ne[1], ne[0]], [sw[1], ne[0]], [sw[1], sw[0]]]
    geojson = {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {
                "name": "South District (PLACEHOLDER — not the real boundary)",
                "is_placeholder": True,
            },
            "geometry": {"type": "Polygon", "coordinates": [ring]},
        }],
    }
    return write_geojson(
        "memphis30_south_district.geojson", geojson,
        source="PLACEHOLDER — replace with a real download from "
               "https://www.memphis3point0.com/district-home/south-district or Shelby "
               "County GIS; not real district geometry.",
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-tracts", action="store_true")
    parser.add_argument("--skip-zips", action="store_true")
    args = parser.parse_args()

    start_tag = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H-%M")
    counts = {}

    if not args.skip_tracts:
        print("[1/3] Census tracts (US Census Bureau TIGERweb)")
        raw = fetch_arcgis_geojson(TRACTS_URL, {"outFields": "GEOID,NAME,STATE,COUNTY,TRACT"})
        clipped = clip_and_simplify(raw)
        n, kb = write_geojson("census_tracts.geojson", clipped,
                               source="US Census Bureau TIGERweb (Tracts_Blocks/MapServer)")
        counts["census_tracts"] = {"features": n, "kb": round(kb, 1)}

    if not args.skip_zips:
        print("[2/3] ZIP code tabulation areas (US Census Bureau TIGERweb)")
        raw = fetch_arcgis_geojson(ZCTA_URL, {"outFields": "ZCTA5,GEOID"})
        clipped = clip_and_simplify(raw)
        n, kb = write_geojson("zip_codes.geojson", clipped,
                               source="US Census Bureau TIGERweb (PUMA_TAD_TAZ_UGA_ZCTA/MapServer)")
        counts["zip_codes"] = {"features": n, "kb": round(kb, 1)}

    print("[3/3] Memphis 3.0 South District (PLACEHOLDER — see script docstring)")
    n, kb = write_placeholder_south_district()
    counts["memphis30_south_district"] = {"features": n, "kb": round(kb, 1), "placeholder": True}

    manifest = {
        "script": SCRIPT_NAME,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "counts": counts,
        "notes": "South District is a placeholder pending a manual download; "
                 "tracts/zips are real TIGERweb data.",
    }
    run_dir = run_history.write_run(SCRIPT_NAME, start_tag, manifest, snapshot_files={})
    print(f"\nDone. Run history: {run_dir}")


if __name__ == "__main__":
    main()
