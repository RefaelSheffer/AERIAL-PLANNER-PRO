"use strict";

// External API helpers for Aerial Planner
const Config = window.AerialPlannerConfig;

/**
 * Fetch hourly weather forecast data from Open-Meteo for a specific location.
 * @param {[number, number]} location - Tuple of [latitude, longitude] in decimal degrees.
 * @returns {Promise<object|null>} Promise resolving to the hourly forecast payload or null when unavailable.
 */
const fetchWeather = async (location) => {
  try {
    if (!location) return null;
    const [lat, lng] = location;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,cloud_cover,wind_speed_10m,wind_gusts_10m,precipitation_probability&timezone=auto&forecast_days=7`;
    const res = await fetch(url);
    const data = await res.json();
    return data?.hourly || null;
  } catch (e) {
    console.warn("Weather API unavailable", e);
    return null;
  }
};

/**
 * Retrieve the latest RainViewer radar frame and render it on a Leaflet map, updating cached state when needed.
 * @param {L.Map} map - Leaflet map instance to draw the radar overlay on.
 * @param {React.MutableRefObject<object>} layersRef - Ref object storing active Leaflet layers to manage lifecycle.
 * @param {React.MutableRefObject<number|null>} rainRadarTimestampRef - Ref containing the timestamp of the currently loaded radar frame.
 * @returns {Promise<{timestamp?: number}>} Promise resolving to metadata with the applied radar frame timestamp.
 */
const fetchRainRadar = async (map, layersRef, rainRadarTimestampRef) => {
  try {
    const res = await fetch(
      "https://api.rainviewer.com/public/weather-maps.json",
    );
    const data = await res.json();
    const frames = data?.radar?.past;
    if (!frames || frames.length === 0) throw new Error("No radar frames");
    const latest = frames[frames.length - 1];
    const ts = latest.time;
    if (ts === rainRadarTimestampRef.current) return { timestamp: ts };

    const Lr = layersRef.current;
    if (Lr.rainRadar) {
      map.removeLayer(Lr.rainRadar);
    }

    const radarLayer = L.tileLayer(
      `https://tilecache.rainviewer.com/v2/radar/${ts}/256/{z}/{x}/{y}/2/1_1.png`,
      {
        attribution: "RainViewer",
        opacity: 0.6,
        crossOrigin: true,
        maxZoom: 18,
      },
    );
    radarLayer.addTo(map);
    const nextLayers = layersRef.current || {};
    nextLayers.rainRadar = radarLayer;
    layersRef.current = nextLayers;
    rainRadarTimestampRef.current = ts;
    return { timestamp: ts };
  } catch (e) {
    console.warn("RainViewer API unavailable", e);
    return null;
  }
};

/**
 * Fetch aircraft detected near a center point from ADSBexchange.
 * @param {[number, number]} center - Tuple of [latitude, longitude] for the query center.
 * @param {number} rangeKm - Search radius in kilometers.
 * @returns {Promise<object[]>} Promise resolving to an array of aircraft entries with valid coordinates.
 */
const fetchAircraft = async (center, rangeKm) => {
  try {
    if (!center) return [];
    const [lat, lng] = center;
    const url = `https://public-api.adsbexchange.com/VirtualRadar/AircraftList.json?lat=${lat}&lng=${lng}&fDstL=0&fDstU=${Math.max(5, rangeKm)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data?.acList) throw new Error("No aircraft list");
    return data.acList.filter((a) => a?.Lat && a?.Long);
  } catch (e) {
    console.warn("Aircraft API unavailable", e);
    return [];
  }
};

/**
 * Sample Digital Terrain Model (DTM) values across a polygon using OpenTopoData, with a local simulation fallback.
 * @param {{lat: number, lng: number}[]} polygon - Array of polygon vertices (at least three) in latitude/longitude degrees.
 * @returns {Promise<{grid: {lat: number, lng: number, ele: number}[], simulated: boolean}>} Promise resolving to a grid of elevations and a flag indicating whether simulation was used.
 */
const fetchDTM = async (polygon) => {
  let locations = [];

  const buildLocations = (poly) => {
    const latLngs = poly.map((p) => L.latLng(p.lat, p.lng));
    const bounds = L.latLngBounds(latLngs);
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const rows = 20;
    const cols = 20;
    const locs = [];
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        locs.push({
          lat: sw.lat + (ne.lat - sw.lat) * (r / rows),
          lng: sw.lng + (ne.lng - sw.lng) * (c / cols),
        });
      }
    }
    return locs;
  };

  try {
    if (!polygon || polygon.length < 3) throw new Error("Polygon required");
    locations = buildLocations(polygon);

    const fetchWithTimeout = (url) => {
      const fetchPromise = fetch(url);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 5000),
      );
      return Promise.race([fetchPromise, timeoutPromise]);
    };

    const batchSize = 100;
    const batches = [];
    for (let i = 0; i < locations.length; i += batchSize) {
      batches.push(locations.slice(i, i + batchSize));
    }

    const allResults = [];
    for (const batch of batches) {
      const locStr = batch
        .map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`)
        .join("|");
      const url = `https://api.opentopodata.org/v1/aster30m?locations=${locStr}`;
      const res = await fetchWithTimeout(url);
      if (!res.ok) throw new Error(`API Error ${res.status}`);
      const data = await res.json();
      if (!data.results) throw new Error("Invalid response");
      allResults.push(...data.results);
    }

    if (allResults.length === 0) throw new Error("Empty DTM response");
    return {
      grid: allResults.map((r) => ({
        lat: r.location.lat,
        lng: r.location.lng,
        ele: r.elevation || 0,
      })),
      simulated: false,
    };
  } catch (e) {
    console.warn("DTM API Failed, switching to simulation.", e);
    if (!locations || locations.length === 0) {
      return { grid: [], simulated: true };
    }
    const simGrid = locations.map((loc) => {
      const baseEle = 100;
      const noise = Math.sin(loc.lat * 1000) * Math.cos(loc.lng * 1000) * 20;
      return { lat: loc.lat, lng: loc.lng, ele: baseEle + noise };
    });
    return { grid: simGrid, simulated: true };
  }
};

window.AerialPlannerServices = {
  fetchWeather,
  fetchRainRadar,
  fetchAircraft,
  fetchDTM,
};
