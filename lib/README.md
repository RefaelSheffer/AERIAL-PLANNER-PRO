# Local vendor libraries

This folder holds the runtime libraries required by the planner UI (React, Babel, Leaflet, jsPDF, etc.).

Because CDN access may be blocked in some environments, the HTML now loads these files directly from `lib/`.
The repository ships with placeholder files so the directory is always present. Replace each placeholder with
the official distribution file for the same version:

- `leaflet.css`, `leaflet.js` from Leaflet 1.9.4
- `leaflet-heat.js` from leaflet.heat 0.2.0
- `react.production.min.js` and `react-dom.production.min.js` from React 18.2.0
- `babel.min.js` from `@babel/standalone` 7.25.5
- `suncalc.min.js` from SunCalc 1.9.0
- `jspdf.umd.min.js` from jsPDF 2.5.1
- `shp-write.js` from shp-write 0.3.3

To refresh everything automatically (when you have network access), run:

```bash
./scripts/fetch-libs.sh
```

After downloading, commit the updated files so GitHub Pages can serve them directly without relying on CDNs.
