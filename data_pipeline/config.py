"""
Shared configuration for the MAPP Memphis data pipeline.
"""

# Soulsville study-area bounding box (lat, lng) — matches the bbox used in the
# project's OSM/Overpass queries.
SOULSVILLE_SW = (35.085, -90.045)
SOULSVILLE_NE = (35.125, -90.000)

# Wider clip window for official boundary layers (census tracts, zip codes). The
# Modifiable Areal Unit Problem framing wants surrounding administrative units
# visible on the map too, not just the ones directly over Soulsville.
BOUNDARY_CLIP_SW = (35.02, -90.12)
BOUNDARY_CLIP_NE = (35.19, -89.92)

# UTM Zone 15N — the correct projected CRS for Memphis/Shelby County (Oakland used
# zone 10N / EPSG:26910; that does not apply here).
UTM_CRS = 26915
WGS84_CRS = 4326
