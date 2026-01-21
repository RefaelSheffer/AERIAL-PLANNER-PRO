// config.js
// Defines configuration constants, visualization helpers, and geometry utilities for the planner.
// Exposes AerialPlannerConfig on window so main.jsx and services can share app-wide settings.
"use strict";

const readPlannerEnv = () => window.APP_ENV || window.AERIAL_PLANNER_ENV || {};

const buildPlannerConfig = () => {
  const env = readPlannerEnv();

  return {
    DRONE_PRESETS: window.DRONE_PRESETS || {},
    DEFAULT_MAP_CENTER: [32.0853, 34.7818],
    VAPID_PUBLIC_KEY: env.VAPID_PUBLIC_KEY || "",
    SUPABASE_FUNCTIONS_URL: env.SUPABASE_FUNCTIONS_URL || "",
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY || "",
    APP_BASE_PATH: env.APP_BASE_PATH || "",
    APP_ORIGIN: env.APP_ORIGIN || "",
    OPEN_METEO_MODELS: env.OPEN_METEO_MODELS || "best_match",
    DEFAULT_SUITABILITY: {
      maxWind: 20,
      maxGust: 25,
      minCloudCover: 0,
      maxCloudCover: 100,
      maxRainProb: 40,
      minSunAltitude: 5,
      maxSunAltitude: 85,
      includeNightFlights: false,
    },

    // Color helpers for wind visualization
    helpers: {
      /**
       * Convert a wind speed value to an HSL-based color string for heatmap-style visualization.
       * @param {number|null|undefined} speed - Wind speed in m/s. Nullish or NaN values fall back to a neutral color.
       * @returns {string} A CSS color string representing the wind intensity.
       */
      windSpeedToColor: (speed) => {
        if (speed === null || speed === undefined || Number.isNaN(speed))
          return "#cbd5e1";
        const clamped = Math.max(0, Math.min(speed, 25));
        const hue = 240 - (clamped / 25) * 240;
        return `hsl(${hue}, 85%, 55%)`;
      },
      /**
       * Choose a contrasting text color for wind tiles based on the provided speed.
       * @param {number|null|undefined} speed - Wind speed in m/s. Nullish or NaN values get a dark text color.
       * @returns {string} Tailwind text color class suitable for rendering the value over the wind background.
       */
      windTextColor: (speed) => {
        if (speed === null || speed === undefined || Number.isNaN(speed))
          return "text-slate-800";
        return speed >= 18 ? "text-white" : "text-slate-800";
      },
    },

    // Geometry helpers used by the planner
    geometry: {
      /**
       * Calculate the great-circle distance between two latitude/longitude points using the haversine formula.
       * @param {{lat: number, lng: number}} p1 - Start point with latitude and longitude in degrees.
       * @param {{lat: number, lng: number}} p2 - End point with latitude and longitude in degrees.
       * @returns {number} Distance between the points in meters.
       */
      getDistance: (p1, p2) => {
        const R = 6371e3;
        const phi1 = (p1.lat * Math.PI) / 180;
        const phi2 = (p2.lat * Math.PI) / 180;
        const deltaPhi = ((p2.lat - p1.lat) * Math.PI) / 180;
        const deltaLambda = ((p2.lng - p1.lng) * Math.PI) / 180;
        const a =
          Math.sin(deltaPhi / 2) ** 2 +
          Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      },
      /**
       * Compute the initial bearing from one geographic coordinate to another.
       * @param {{lat: number, lng: number}} p1 - Origin point in degrees.
       * @param {{lat: number, lng: number}} p2 - Destination point in degrees.
       * @returns {number} Bearing in degrees clockwise from north (0-360).
       */
      getBearing: (p1, p2) => {
        const phi1 = (p1.lat * Math.PI) / 180;
        const phi2 = (p2.lat * Math.PI) / 180;
        const deltaLambda = ((p2.lng - p1.lng) * Math.PI) / 180;
        const y = Math.sin(deltaLambda) * Math.cos(phi2);
        const x =
          Math.cos(phi1) * Math.sin(phi2) -
          Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
        return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
      },
      /**
       * Derive an azimuth angle aligned with the longest edge of a polygon.
       * @param {{lat: number, lng: number}[]} points - Polygon vertices in order.
       * @returns {number} Bearing in degrees to orient flight lines; defaults to 0 for degenerate polygons.
       */
      getAutoAzimuth: (points) => {
        if (points.length < 2) return 0;
        let maxDist = 0;
        let bestBearing = 0;
        for (let i = 0; i < points.length; i++) {
          const p1 = points[i];
          const p2 = points[(i + 1) % points.length];
          const d = window.AerialPlannerConfig.geometry.getDistance(p1, p2);
          if (d > maxDist) {
            maxDist = d;
            bestBearing = window.AerialPlannerConfig.geometry.getBearing(p1, p2);
          }
        }
        return bestBearing;
      },
      /**
       * Rotate a point around a center by a given angle.
       * @param {{lat: number, lng: number}} point - Point to rotate, expressed in degrees.
       * @param {number} angleDeg - Rotation angle in degrees (positive is clockwise).
       * @param {{lat: number, lng: number}} center - Center of rotation.
       * @returns {{lat: number, lng: number}} New rotated point coordinates.
       */
      rotatePoint: (point, angleDeg, center) => {
        const angleRad = angleDeg * (Math.PI / 180);
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const dx = point.lng - center.lng;
        const dy = point.lat - center.lat;
        return {
          lat: center.lat + (dx * sin + dy * cos),
          lng: center.lng + (dx * cos - dy * sin),
        };
      },
      /**
       * Reverse a previous rotation by applying the negative angle.
       * @param {{lat: number, lng: number}} point - Rotated point in degrees.
       * @param {number} angleDeg - Rotation angle in degrees to undo.
       * @param {{lat: number, lng: number}} center - Center that was used for the original rotation.
       * @returns {{lat: number, lng: number}} Point restored to its original orientation.
       */
      unrotatePoint: (point, angleDeg, center) =>
        window.AerialPlannerConfig.geometry.rotatePoint(point, -angleDeg, center),
    },
  };
};

window.applyAerialPlannerEnv = () => {
  const config = buildPlannerConfig();
  window.AerialPlannerConfig = config;
  return config;
};

window.applyAerialPlannerEnv();
