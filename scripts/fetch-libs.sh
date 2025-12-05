#!/usr/bin/env bash
set -euo pipefail

# Download local copies of runtime libraries used by the planner UI.
# Run this script from the repository root.

mkdir -p lib

fetch() {
  local url="$1"
  local dest="$2"
  echo "Downloading ${url} -> ${dest}"
  curl -fL --retry 3 --retry-delay 2 --connect-timeout 10 "$url" -o "$dest"
}

fetch "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" "lib/leaflet.css"
fetch "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" "lib/leaflet.js"
fetch "https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js" "lib/leaflet-heat.js"
fetch "https://unpkg.com/react@18.2.0/umd/react.production.min.js" "lib/react.production.min.js"
fetch "https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js" "lib/react-dom.production.min.js"
fetch "https://unpkg.com/@babel/standalone@7.25.5/babel.min.js" "lib/babel.min.js"
fetch "https://cdnjs.cloudflare.com/ajax/libs/suncalc/1.9.0/suncalc.min.js" "lib/suncalc.min.js"
fetch "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js" "lib/jspdf.umd.min.js"
fetch "https://unpkg.com/shp-write@0.3.3/shpwrite.js" "lib/shp-write.js"
