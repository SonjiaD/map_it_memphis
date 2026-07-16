"""
Exports the full research dataset from Supabase to timestamped CSV files, so all the
data collected in the field (resident-drawn boundaries, asset pins, oral history
metadata, researcher accounts) can be analyzed offline in Excel / pandas / R / Dedoose.

Writes one CSV per table: profiles, drawn_boundaries, asset_pins, oral_histories. Because
these are interconnected by researcher_id / boundary_id, you can reproduce any view or
answer any custom question offline.

Requires a SERVICE ROLE key (not the anon key): these tables have RLS enabled, so reading
every row (including unpublished/withdrawn-consent ones, useful for research audit trails)
requires the service role. Add SUPABASE_SERVICE_ROLE_KEY to data_pipeline/.env (Supabase
dashboard -> Settings -> API -> service_role secret). This is an admin-only tool — never
ship this key to the frontend.

Usage:
    python data_pipeline/scripts/export_research_data.py [--notes "..."]

Outputs:
    data/exports/<timestamp>/{profiles,drawn_boundaries,asset_pins,oral_histories}.csv
    data/runs/<timestamp>_export_research_data/manifest.yaml  (history record)
"""

import csv
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
import os

import run_history

ROOT = Path(__file__).resolve().parents[2]
SCRIPT_NAME = "export_research_data"
PAGE = 1000

# (output filename, supabase table name, ordering column or None)
EXPORTS = [
    ("profiles.csv",          "profiles",          "created_at"),
    ("drawn_boundaries.csv",  "drawn_boundaries",  "created_at"),
    ("asset_pins.csv",        "asset_pins",        "created_at"),
    ("oral_histories.csv",    "oral_histories",    "created_at"),
]


def get_client():
    load_dotenv(ROOT / "data_pipeline" / ".env")
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in data_pipeline/.env")
        print("  These tables have RLS enabled, so exporting every row for research requires")
        print("  the service_role key (Supabase dashboard -> Settings -> API -> service_role secret).")
        sys.exit(1)
    from supabase import create_client
    return create_client(url, key)


def fetch_all(client, table, order_col):
    """Fetch every row of a table/view, paginated."""
    rows = []
    page = 0
    while True:
        q = client.table(table).select("*")
        if order_col:
            q = q.order(order_col)
        resp = q.range(page * PAGE, page * PAGE + PAGE - 1).execute()
        rows.extend(resp.data)
        if len(resp.data) < PAGE:
            break
        page += 1
    return rows


def _csv_safe(value):
    """Neutralize CSV/formula injection. User-entered text (e.g. vote comments) that begins
    with a formula trigger would execute when the CSV is opened in Excel/Sheets. Prefixing
    with a single quote makes spreadsheets treat the cell as literal text."""
    if isinstance(value, str) and value and value[0] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + value
    return value


def write_csv(path, rows):
    """Write rows (list of dicts) to CSV. Union of all keys as header (stable order)."""
    if not rows:
        path.write_text("", encoding="utf-8")
        return 0
    header = list(rows[0].keys())
    for r in rows:  # pick up any keys missing from the first row
        for k in r:
            if k not in header:
                header.append(k)
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=header)
        w.writeheader()
        for r in rows:
            w.writerow({k: _csv_safe(r.get(k)) for k in header})
    return len(rows)


def main():
    notes = sys.argv[sys.argv.index("--notes") + 1] if "--notes" in sys.argv else ""
    start_tag = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H-%M")
    client = get_client()

    out_dir = ROOT / "data" / "exports" / start_tag
    out_dir.mkdir(parents=True, exist_ok=True)

    counts = {}
    for filename, table, order_col in EXPORTS:
        print(f"Exporting {table} -> {filename} ...")
        rows = fetch_all(client, table, order_col)
        n = write_csv(out_dir / filename, rows)
        counts[table] = n
        print(f"  {n:,} rows")

    print(f"\nDone. CSVs written to {out_dir}")

    manifest = {
        "script": SCRIPT_NAME,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "export_dir": f"data/exports/{start_tag}",
        "row_counts": counts,
        "notes": notes,
    }
    run_dir = run_history.write_run(SCRIPT_NAME, start_tag, manifest, snapshot_files={})
    print(f"  Run history: {run_dir}")


if __name__ == "__main__":
    main()
