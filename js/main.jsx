// main.jsx
// Bootstraps the Aerial Planner app, manages state, and wires config, services, and components together.
// Uses global AerialPlannerConfig, DRONE_PRESETS, AerialPlannerServices, and AerialPlannerComponents to render the experience.
"use strict";

// Feature flags (set to false to disable panels without removing code).
const ENABLE_MISSION_PLANNING = false;
const ENABLE_REALTIME_PANEL = false;
const ENABLE_DOCUMENTATION = false;
const WEATHER_ONLY_MODE =
  !ENABLE_MISSION_PLANNING &&
  !ENABLE_REALTIME_PANEL &&
  !ENABLE_DOCUMENTATION;

const renderDependencyError =
  window.renderPlannerDependencyError ||
  ((missingDeps) => {
    const root = document.getElementById("root");
    if (!root) return;

    root.innerHTML = `
      <div style="font-family: 'Heebo', sans-serif; padding: 24px; max-width: 720px; margin: 0 auto; text-align: right;">
        <h1 style="font-size: 24px; margin-bottom: 12px;">האתר לא נטען</h1>
        <p style="margin-bottom: 8px;">לא הצלחנו לטעון את הספריות החיצוניות הנדרשות להפעלת האפליקציה.</p>
        <p style="margin-bottom: 16px;">אנא ודאו שיש גישה לאינטרנט או שה-CDN לא חסום.</p>
        <div style="background: #f1f5f9; padding: 12px 16px; border-radius: 12px; color: #0f172a;">
          <strong>תלויות חסרות:</strong>
          <ul style="margin-top: 8px; padding-inline-start: 20px;">
            ${missingDeps.map((name) => `<li>${name}</li>`).join("")}
          </ul>
        </div>
      </div>
    `;
  });

const missingDeps = [];
if (typeof React === "undefined") missingDeps.push("React");
if (typeof ReactDOM === "undefined") missingDeps.push("ReactDOM");
if (typeof Babel === "undefined") missingDeps.push("Babel");
if (typeof L === "undefined") missingDeps.push("Leaflet");

if (missingDeps.length) {
  renderDependencyError(missingDeps);
  throw new Error(`Missing client dependencies: ${missingDeps.join(", ")}`);
}

// Main application setup
const { useState, useEffect, useRef, useMemo, useCallback } = React;
const Config = window.AerialPlannerConfig;
const Services = window.AerialPlannerServices;
const {
  Sidebar,
  MapView,
  TimelineBoard,
  RealtimePanel,
  DocumentationPanel,
  Dock,
  Icon,
  DockButton,
} = window.AerialPlannerComponents;
const AerialPlanner = {
  config: Config,
  helpers: Config.helpers,
  geometry: Config.geometry,
};
const SUITABILITY_STORAGE_KEY = "plannerSuitabilitySettings";

/**
 * Calculate the sun altitude for the current weather location and a given timestamp.
 * @param {[number, number]} weatherLocation - Latitude/longitude pair used for the calculation.
 * @param {string} dateStr - ISO-like datetime string (YYYY-MM-DDTHH:mm) representing the slot time.
 * @returns {number|null} Sun altitude in degrees above the horizon, or null when unavailable.
 */
const computeSunAltitudeDeg = (weatherLocation, dateStr) => {
  if (typeof SunCalc === "undefined" || !weatherLocation) return null;
  const [lat, lng] = weatherLocation;
  const pos = SunCalc.getPosition(new Date(dateStr), lat, lng);
  if (!pos || Number.isNaN(pos.altitude)) return null;
  return pos.altitude * (180 / Math.PI);
};

/**
 * Determine whether a forecast slot meets user-defined suitability thresholds for flight.
 * @param {{wind:number|null, gust:number|null, clouds:number|null, rainProb:number|null, sunAlt:number|null}} slot - Normalized forecast slot values.
 * @param {object} suitabilitySettings - User thresholds for evaluating flight suitability.
 * @returns {boolean} True when all constraints are satisfied.
 */
const slotIsFlyable = (slot, suitabilitySettings) => {
  const {
    maxWind,
    maxGust,
    minCloudCover,
    maxCloudCover,
    maxRainProb,
    minSunAltitude,
    maxSunAltitude,
    includeNightFlights,
  } = suitabilitySettings;
  const wind =
    typeof slot.wind === "number" && !Number.isNaN(slot.wind) ? slot.wind : null;
  const gust =
    typeof slot.gust === "number" && !Number.isNaN(slot.gust) ? slot.gust : null;
  const clouds =
    typeof slot.clouds === "number" && !Number.isNaN(slot.clouds)
      ? slot.clouds
      : null;
  const rainProb =
    typeof slot.rainProb === "number" && !Number.isNaN(slot.rainProb)
      ? slot.rainProb
      : null;

  const safeWind = wind === null ? true : wind <= maxWind;
  const safeGust =
    gust === null
      ? wind === null
        ? true
        : wind <= maxGust
      : gust <= maxGust;
  const safeCloud =
    clouds === null
      ? true
      : clouds >= minCloudCover && clouds <= maxCloudCover;
  const safeRain = rainProb === null ? true : rainProb <= maxRainProb;

  const sunOk = includeNightFlights
    ? true
    : slot.sunAlt === null
      ? true
      : slot.sunAlt >= minSunAltitude && slot.sunAlt <= maxSunAltitude;

  return safeWind && safeGust && safeCloud && safeRain && sunOk;
};

/**
 * Calculate a normalized risk score for a forecast slot based on threshold exceedance.
 * @param {{wind:number|null, gust:number|null, clouds:number|null, rainProb:number|null, sunAlt:number|null}} slot - Normalized forecast slot values.
 * @param {object} suitabilitySettings - User thresholds for evaluating flight suitability.
 * @returns {number} Risk score between 0 and 1.
 */
const calculateSlotRisk = (slot, suitabilitySettings) => {
  const {
    maxWind,
    maxGust,
    maxRainProb,
    minSunAltitude,
    maxSunAltitude,
    includeNightFlights,
  } = suitabilitySettings;

  const wind =
    typeof slot.wind === "number" && !Number.isNaN(slot.wind) ? slot.wind : null;
  const gustRaw =
    typeof slot.gust === "number" && !Number.isNaN(slot.gust)
      ? slot.gust
      : null;
  const gust = gustRaw ?? wind;
  const rainProb =
    typeof slot.rainProb === "number" && !Number.isNaN(slot.rainProb)
      ? slot.rainProb
      : null;

  const safeDivisor = (value, fallback = 1) =>
    typeof value === "number" && value > 0 ? value : fallback;

  const windRisk =
    wind === null ? 0 : Math.max(0, (wind - maxWind) / safeDivisor(maxWind));
  const gustRisk =
    gust === null ? 0 : Math.max(0, (gust - maxGust) / safeDivisor(maxGust));
  const rainDenominator = Math.max(1, 100 - maxRainProb);
  const rainRisk =
    rainProb === null
      ? 0
      : Math.max(0, (rainProb - maxRainProb) / rainDenominator);
  const sunRisk = includeNightFlights
    ? 0
    : slot.sunAlt === null || slot.sunAlt === undefined
      ? 0
      : slot.sunAlt < minSunAltitude || slot.sunAlt > maxSunAltitude
        ? 1
        : 0;

  return (windRisk + gustRisk + rainRisk + sunRisk) / 4;
};

/**
 * Build a condensed wind timeline grouped by day, sampling every 3 hours with sun altitude enrichment.
 * @param {object|null} hourlyForecast - Weather API response containing hourly arrays.
 * @param {[number, number]|null} weatherLocation - Current location used for sun angle enrichment.
 * @returns {{day: string, label: string, slots: object[]}[]} Timeline structure for TimelineBoard consumption.
 */
const buildWindTimeline = (hourlyForecast, weatherLocation) => {
  if (!hourlyForecast?.time) return [];
  const days = new Map();

  hourlyForecast.time.forEach((t, i) => {
    const hour = Number(t.slice(11, 13));
    if (hour % 3 !== 0) return; // כל 3 שעות

    const dayKey = t.slice(0, 10);
    if (!days.has(dayKey)) days.set(dayKey, { day: dayKey, slots: [] });

    const slotDate = `${t.slice(0, 13)}:00`;

    days.get(dayKey).slots.push({
      key: t,
      time: t.slice(11, 16),
      wind: hourlyForecast.wind_speed_10m?.[i],
      gust: hourlyForecast.wind_gusts_10m?.[i],
      clouds: hourlyForecast.cloud_cover?.[i],
      rainProb: hourlyForecast.precipitation_probability?.[i],
      isMajor: hour % 6 === 0,
      sunAlt: computeSunAltitudeDeg(weatherLocation, slotDate),
    });
  });

  return Array.from(days.values()).map((day) => ({
    ...day,
    label: new Date(day.day).toLocaleDateString("he-IL", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    }),
  }));
};

const computeElevationStats = (grid) => {
  if (!Array.isArray(grid) || grid.length === 0) return null;

  return grid.reduce(
    (acc, point) => {
      const ele = point.ele;
      if (ele < acc.min) acc.min = ele;
      if (ele > acc.max) acc.max = ele;
      acc.sum += ele;
      return acc;
    },
    { min: Infinity, max: -Infinity, sum: 0 },
  );
};

const buildDtmHeatPoints = (grid, stats) => {
  if (!grid || !stats) return [];
  const range = stats.max - stats.min || 1;

  return grid.map((pt) => {
    const normalized = (pt.ele - stats.min) / range;
    const intensity = Math.max(0, Math.min(1, normalized));
    return [pt.lat, pt.lng, intensity];
  });
};

const computeIsMobile = () => {
  if (typeof window === "undefined") return false;

  const coarsePointer =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(pointer: coarse)").matches
      : false;
  return window.innerWidth < 900 || coarsePointer;
};

const App = () => {
  const initialIsMobile = computeIsMobile();

  const [mapCenter, setMapCenter] = useState(Config.DEFAULT_MAP_CENTER);
  const [weatherLocation, setWeatherLocation] = useState(
    Config.DEFAULT_MAP_CENTER,
  );
  const [polygon, setPolygon] = useState(() =>
    ENABLE_MISSION_PLANNING ? [] : null,
  );
  const [userLocation, setUserLocation] = useState(null);
  const [userAccuracy, setUserAccuracy] = useState(null);
  const [locationMessage, setLocationMessage] = useState(null);
  const [addressQuery, setAddressQuery] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressStatus, setAddressStatus] = useState("idle");
  const [isAddressOpen, setIsAddressOpen] = useState(false);

  // Flight Params
  const [selectedDrone, setSelectedDrone] = useState(() =>
    ENABLE_MISSION_PLANNING ? "mavic_3_e" : null,
  );
  const [altitude, setAltitude] = useState(() =>
    ENABLE_MISSION_PLANNING ? 60 : null,
  );
  const [overlapFront, setOverlapFront] = useState(() =>
    ENABLE_MISSION_PLANNING ? 75 : null,
  );
  const [overlapSide, setOverlapSide] = useState(() =>
    ENABLE_MISSION_PLANNING ? 70 : null,
  );
  const [speed, setSpeed] = useState(() =>
    ENABLE_MISSION_PLANNING ? 10 : null,
  ); // m/s
  const [azimuth, setAzimuth] = useState(() =>
    ENABLE_MISSION_PLANNING ? 0 : null,
  );
  const [autoOrient, setAutoOrient] = useState(() =>
    ENABLE_MISSION_PLANNING ? true : null,
  );
  const [opticalZoomIndex, setOpticalZoomIndex] = useState(() =>
    ENABLE_MISSION_PLANNING ? 0 : null,
  );
  const [flightDate, setFlightDate] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showDayDetails, setShowDayDetails] = useState(false);
  const [filterFlyableOnly, setFilterFlyableOnly] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState("mission");
  const [settingsReadOnly, setSettingsReadOnly] = useState(true);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return window.localStorage.getItem("plannerTheme") || "light";
  });
  const [suitabilitySettings, setSuitabilitySettings] = useState(() => {
    if (typeof window === "undefined") return Config.DEFAULT_SUITABILITY;
    const saved = window.localStorage.getItem(SUITABILITY_STORAGE_KEY);
    if (!saved) return Config.DEFAULT_SUITABILITY;
    return { ...Config.DEFAULT_SUITABILITY, ...JSON.parse(saved) };
  });

  // Stats
  const [totalDistance, setTotalDistance] = useState(0);

  // Weather & DTM
  const [hourlyForecast, setHourlyForecast] = useState(null);
  const [dtmData, setDtmData] = useState(() =>
    ENABLE_MISSION_PLANNING ? null : undefined,
  );
  const [isFetchingDTM, setIsFetchingDTM] = useState(() =>
    ENABLE_MISSION_PLANNING ? false : null,
  );
  const [dtmStats, setDtmStats] = useState(() =>
    ENABLE_MISSION_PLANNING ? null : undefined,
  );
  const [terrainShadows, setTerrainShadows] = useState(() =>
    ENABLE_MISSION_PLANNING ? [] : null,
  );
  const [isSimulatedDTM, setIsSimulatedDTM] = useState(() =>
    ENABLE_MISSION_PLANNING ? false : null,
  ); // New flag for fallback
  const [weatherUnavailable, setWeatherUnavailable] = useState(false);
  const [showTimeline, setShowTimeline] = useState(WEATHER_ONLY_MODE);
  const [sidebarOpen, setSidebarOpen] = useState(
    ENABLE_MISSION_PLANNING && !initialIsMobile,
  );
  const [dronePanelOpen, setDronePanelOpen] = useState(!initialIsMobile);
  const [isMobile, setIsMobile] = useState(initialIsMobile);
  const [realtimePanelOpen, setRealtimePanelOpen] = useState(false);
  const [rainRadarEnabled, setRainRadarEnabled] = useState(false);
  const [rainRadarStatus, setRainRadarStatus] = useState("idle");
  const [rainRadarTimestamp, setRainRadarTimestamp] = useState(null);
  const [rainRadarUnavailable, setRainRadarUnavailable] = useState(false);
  const [aircraftEnabled, setAircraftEnabled] = useState(() =>
    ENABLE_REALTIME_PANEL ? false : null,
  );
  const [aircraftStatus, setAircraftStatus] = useState(() =>
    ENABLE_REALTIME_PANEL ? "idle" : null,
  );
  const [aircraftTimestamp, setAircraftTimestamp] = useState(() =>
    ENABLE_REALTIME_PANEL ? null : undefined,
  );
  const [aircraftRangeKm, setAircraftRangeKm] = useState(() =>
    ENABLE_REALTIME_PANEL ? 80 : null,
  );
  const [realtimePanelWidth, setRealtimePanelWidth] = useState(0);
  const [aircraftData, setAircraftData] = useState(() =>
    ENABLE_REALTIME_PANEL ? [] : null,
  );
  const [aircraftUnavailable, setAircraftUnavailable] = useState(() =>
    ENABLE_REALTIME_PANEL ? false : null,
  );
  const [documentationOpen, setDocumentationOpen] = useState(() =>
    ENABLE_DOCUMENTATION ? false : null,
  );
  const [docForm, setDocForm] = useState(() =>
    ENABLE_DOCUMENTATION
      ? {
          title: "",
          notes: "",
          images: [],
          location: null,
        }
      : null,
  );
  const [docEntries, setDocEntries] = useState(() =>
    ENABLE_DOCUMENTATION ? [] : null,
  );
  const [docLocationAllowed, setDocLocationAllowed] = useState(() =>
    ENABLE_DOCUMENTATION ? false : null,
  );
  const [docStorageMode, setDocStorageMode] = useState(() =>
    ENABLE_DOCUMENTATION ? "session" : null,
  );

  const ALLOWED_DOC_IMAGE_TYPES = useMemo(
    () => new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]),
    [],
  );
  const MAX_DOC_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB per image cap
  const MAX_DOC_IMAGES = 10; // Avoid excessive payload persistence
  const MAX_DOC_ENTRIES = 50; // Retention limit to avoid unbounded persistence
  const DOC_STORAGE_KEY = "aerialPlannerDocEntriesSession";
  const DOC_LOCAL_STORAGE_KEY = "aerialPlannerDocEntriesLocal";

  const activeDrone = useMemo(
    () => AerialPlanner.config.DRONE_PRESETS[selectedDrone] || null,
    [selectedDrone],
  );

  const opticalZoomLevels = useMemo(() => {
    if (!activeDrone?.opticalZoomLevels) return null;
    return activeDrone.opticalZoomLevels.length > 0
      ? activeDrone.opticalZoomLevels
      : null;
  }, [activeDrone]);

  const clampedOpticalZoomIndex = useMemo(() => {
    if (!opticalZoomLevels) return 0;
    return Math.min(opticalZoomIndex, opticalZoomLevels.length - 1);
  }, [opticalZoomIndex, opticalZoomLevels]);

  const currentOpticalZoom = useMemo(
    () => (opticalZoomLevels ? opticalZoomLevels[clampedOpticalZoomIndex] : 1),
    [clampedOpticalZoomIndex, opticalZoomLevels],
  );

  const activeFocalLength = useMemo(() => {
    if (!activeDrone?.focalLength) return 0;
    return activeDrone.focalLength * currentOpticalZoom;
  }, [activeDrone, currentOpticalZoom]);

  const hasOpticalZoom = Boolean(opticalZoomLevels?.length);

  useEffect(() => {
    if (!opticalZoomLevels) {
      setOpticalZoomIndex(0);
      return;
    }
    setOpticalZoomIndex(0);
  }, [selectedDrone, opticalZoomLevels ? opticalZoomLevels.length : 0]);

  useEffect(() => {
    if (!ENABLE_DOCUMENTATION) return;
    if (typeof window === "undefined") return;

    const loadEntriesFromStorage = (storage, key) => {
      try {
        const stored = storage?.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            return parsed.slice(0, MAX_DOC_ENTRIES).map((entry) => ({
              ...entry,
              location: entry.location ?? null,
            }));
          }
        }
      } catch (e) {
        console.warn("Failed to read stored documentation entries", e);
      }
      return null;
    };

    const localEntries =
      typeof localStorage !== "undefined"
        ? loadEntriesFromStorage(localStorage, DOC_LOCAL_STORAGE_KEY)
        : null;
    if (localEntries?.length) {
      setDocEntries(localEntries);
      setDocStorageMode("local");
      return;
    }

    const sessionEntries =
      typeof sessionStorage !== "undefined"
        ? loadEntriesFromStorage(sessionStorage, DOC_STORAGE_KEY)
        : null;
    if (sessionEntries?.length) {
      setDocEntries(sessionEntries);
    }
  }, []);

  useEffect(() => {
    if (!ENABLE_DOCUMENTATION) return;
    if (typeof window === "undefined") return;

    const targetKey =
      docStorageMode === "local" ? DOC_LOCAL_STORAGE_KEY : DOC_STORAGE_KEY;
    const targetStorage =
      docStorageMode === "local" ? localStorage : sessionStorage;

    try {
      targetStorage?.setItem(
        targetKey,
        JSON.stringify(docEntries.slice(0, MAX_DOC_ENTRIES)),
      );
    } catch (e) {
      console.warn("Failed to persist documentation entries", e);
    }

    const staleKey =
      docStorageMode === "local" ? DOC_STORAGE_KEY : DOC_LOCAL_STORAGE_KEY;
    const staleStorage =
      docStorageMode === "local" ? sessionStorage : localStorage;
    try {
      staleStorage?.removeItem(staleKey);
    } catch (e) {
      console.warn("Failed to clean stale documentation entries", e);
    }
  }, [docEntries, docStorageMode]);

  const themeStyles = useMemo(() => {
    const isDark = theme === "dark";
    return {
      panel: isDark
        ? "bg-slate-900 text-white"
        : "bg-white text-slate-900 border-l border-slate-200",
      header: isDark
        ? "bg-slate-800 border-b border-slate-700"
        : "bg-slate-50 border-b border-slate-200",
      tabList: isDark
        ? "bg-slate-900/60 border border-slate-700"
        : "bg-white border border-slate-200 shadow-sm",
      tabActive: "bg-blue-600 text-white",
      tabInactive: isDark
        ? "text-slate-200 hover:bg-slate-700/80"
        : "text-slate-700 hover:bg-blue-50",
      iconButton: isDark
        ? "bg-slate-700 p-2 rounded hover:bg-slate-600 text-white"
        : "bg-white p-2 rounded border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm",
      closeButton: isDark
        ? "bg-slate-700 p-2 rounded-full hover:bg-slate-600"
        : "bg-white p-2 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm",
      card: isDark
        ? "bg-slate-800 border border-slate-700"
        : "bg-white border border-slate-200 shadow-sm",
      subtleText: isDark ? "text-slate-400" : "text-slate-600",
      select:
        "w-full p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
      selectTone: isDark
        ? "bg-slate-900 border border-slate-700 text-white"
        : "bg-white border border-slate-300 text-slate-900",
      chip: isDark ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-700",
      accent: isDark ? "text-blue-300" : "text-blue-600",
      subtlePanel: isDark ? "bg-slate-700/50" : "bg-slate-100",
    };
  }, [theme]);

  const settingsTheme = useMemo(() => {
    const isDark = theme === "dark";
    return {
      modal: isDark ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900",
      closeButton: isDark
        ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
        : "border-slate-200 bg-white/95 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      title: isDark ? "text-slate-100" : "text-slate-900",
      subtitle: isDark ? "text-slate-300" : "text-slate-600",
      metaText: isDark ? "text-slate-300" : "text-slate-700",
      label: isDark ? "text-slate-200" : "text-slate-700",
      helperText: isDark ? "text-slate-400" : "text-slate-500",
      summary: isDark
        ? "text-slate-300 bg-slate-800 border-slate-700"
        : "text-slate-600 bg-slate-50 border-slate-200",
      input: isDark
        ? "bg-slate-800 text-slate-100 border-slate-700 placeholder-slate-500 focus:ring-blue-400"
        : "",
      panel: isDark
        ? "border-slate-700 bg-slate-800"
        : "border-slate-200 bg-white",
    };
  }, [theme]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.dataset.theme = theme;
    }
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("plannerTheme", theme);
      } catch (e) {
        console.warn("Failed to persist theme", e);
      }
    }
  }, [theme]);

  const mapRef = useRef(null);
  const layersRef = useRef({});
  const radarIntervalRef = useRef(null);
  const rainRadarTimestampRef = useRef(null);
  const userLocationInitialized = useRef(false);
  const aircraftIntervalRef = useRef(null);
  const sidebarRef = useRef(null);
  const realtimePanelRef = useRef(null);
  const addressSearchRef = useRef(null);
  const addressAbortRef = useRef(null);
  const [desktopDockOffset, setDesktopDockOffset] = useState(16);
  const showPlannerLayout =
    ENABLE_MISSION_PLANNING || ENABLE_REALTIME_PANEL || ENABLE_DOCUMENTATION;
  const timelineVisible = WEATHER_ONLY_MODE ? true : showTimeline;
  const timelineDockHeight = isMobile ? 180 : 210;
  const mapBottomPadding = timelineVisible ? `${timelineDockHeight}px` : "0px";

  /**
   * Toggle visibility of the sidebar, realtime panel, or timeline while keeping them mutually exclusive.
   * @param {"sidebar"|"realtime"|"timeline"} panel - Target panel key to toggle.
   */
  const toggleExclusivePanel = useCallback(
    (panel) => {
      if (panel === "sidebar" && !ENABLE_MISSION_PLANNING) return;
      if (panel === "realtime" && !ENABLE_REALTIME_PANEL) return;
      if (panel === "timeline" && WEATHER_ONLY_MODE) {
        setShowTimeline(true);
        return;
      }
      const states = {
        sidebar: sidebarOpen,
        realtime: realtimePanelOpen,
        timeline: showTimeline,
      };

      const shouldOpen = !states[panel];

      setSidebarOpen(panel === "sidebar" ? shouldOpen : false);
      setRealtimePanelOpen(panel === "realtime" ? shouldOpen : false);
      setShowTimeline(panel === "timeline" ? shouldOpen : false);
      setDocumentationOpen(false);
    },
    [sidebarOpen, realtimePanelOpen, showTimeline],
  );

  /**
   * Toggle the documentation drawer. Keeps it exclusive from the planning sidebar
   * and other overlays to prevent simultaneous open states (especially on mobile).
   */
  const toggleDocumentation = useCallback(() => {
    if (!ENABLE_DOCUMENTATION) return;
    setDocumentationOpen((isOpen) => {
      const next = !isOpen;
      if (next) {
        setShowTimeline(false);
        setRealtimePanelOpen(false);
        setSidebarOpen(false);
      }
      return next;
    });
  }, []);

  const moveToLocation = useCallback((coords, label) => {
    if (!coords) return;
    setMapCenter(coords);
    setWeatherLocation(coords);
    if (mapRef.current) {
      const zoom = Math.max(mapRef.current.getZoom(), 15);
      mapRef.current.flyTo(coords, zoom, { duration: 0.75 });
    }
    if (label) {
      setAddressQuery(label);
    }
    setIsAddressOpen(false);
    setAddressSuggestions([]);
    setLocationMessage("מציג תחזית לכתובת...");
    setTimeout(() => setLocationMessage(null), 2200);
  }, []);

  const handleAddressSelect = useCallback(
    (suggestion) => {
      if (!suggestion) return;
      moveToLocation([suggestion.lat, suggestion.lng], suggestion.label);
    },
    [moveToLocation],
  );

  const recenterOnUser = useCallback(() => {
    if (!mapRef.current) return;

    const clearMessageLater = (delay = 2200) => {
      setTimeout(() => setLocationMessage(null), delay);
    };

    if (userLocation) {
      const zoom = Math.max(mapRef.current.getZoom(), 16);
      mapRef.current.flyTo(userLocation, zoom, { duration: 0.75 });
      setMapCenter(userLocation);
      setLocationMessage("ממקם לפי GPS...");
      clearMessageLater();
      return;
    }

    if (!navigator.geolocation) {
      setLocationMessage("המכשיר לא תומך ב-GPS");
      clearMessageLater(3200);
      return;
    }

    setLocationMessage("מאתר מיקום...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setUserAccuracy(pos.coords.accuracy);
        setMapCenter(coords);
        const zoom = Math.max(mapRef.current.getZoom(), 16);
        mapRef.current.flyTo(coords, zoom, { duration: 0.75 });
        setLocationMessage("מרכזתי לפי GPS");
        clearMessageLater();
      },
      () => {
        setLocationMessage("לא הצלחתי לקבל מיקום");
        clearMessageLater(3200);
      },
      { enableHighAccuracy: true, timeout: 9000 },
    );
  }, [userLocation]);

  const handleAddressSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (addressSuggestions.length > 0) {
        handleAddressSelect(addressSuggestions[0]);
        return;
      }

      const query = addressQuery.trim();
      if (!query) return;
      setAddressStatus("loading");
      try {
        const results = await Services.fetchLocationSuggestions(query, {
          limit: 1,
        });
        if (results.length > 0) {
          handleAddressSelect(results[0]);
        } else {
          setAddressSuggestions([]);
          setIsAddressOpen(true);
          setAddressStatus("ready");
        }
      } catch (e) {
        console.error("Address lookup failed", e);
        setAddressStatus("error");
        setAddressSuggestions([]);
      }
    },
    [addressQuery, addressSuggestions, handleAddressSelect],
  );

  const updateSuitabilitySetting = (key, value) => {
    setSuitabilitySettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSuitabilitySettings = () => {
    setSuitabilitySettings(Config.DEFAULT_SUITABILITY);
    window.localStorage.removeItem(SUITABILITY_STORAGE_KEY);
    setSettingsReadOnly(true);
  };

  const openSuitabilitySettings = () => {
    setActiveSidebarTab("settings");
    setShowSettings(true);
    setSettingsReadOnly(true);
  };

  const enableSettingsEditing = () => setSettingsReadOnly(false);

  // --- Geolocation ---
  useEffect(() => {
    if (!navigator.geolocation) return;

    const handlePosition = (pos) => {
      const coords = [pos.coords.latitude, pos.coords.longitude];
      setUserLocation(coords);
      setUserAccuracy(pos.coords.accuracy);

      if (!userLocationInitialized.current) {
        setMapCenter(coords);
        setWeatherLocation(coords);
        if (mapRef.current) mapRef.current.setView(coords, 17);
        userLocationInitialized.current = true;
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      handlePosition,
      (err) => console.warn("GPS Error:", err.code),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Keep the mission tab highlighted once settings modal is closed
  useEffect(() => {
    if (!showSettings && activeSidebarTab === "settings") {
      setActiveSidebarTab("mission");
    }
  }, [showSettings, activeSidebarTab]);

  useEffect(() => {
    window.localStorage.setItem(
      SUITABILITY_STORAGE_KEY,
      JSON.stringify(suitabilitySettings),
    );
  }, [suitabilitySettings]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = computeIsMobile();
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
        setDronePanelOpen(false);
        setShowTimeline(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!addressSearchRef.current) return;
      if (!addressSearchRef.current.contains(event.target)) {
        setIsAddressOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const trimmed = addressQuery.trim();
    if (trimmed.length < 2) {
      setAddressSuggestions([]);
      setAddressStatus("idle");
      return;
    }

    setAddressStatus("loading");
    if (addressAbortRef.current) {
      addressAbortRef.current.abort();
    }
    const controller = new AbortController();
    addressAbortRef.current = controller;

    const timeoutId = setTimeout(async () => {
      try {
        const results = await Services.fetchLocationSuggestions(trimmed, {
          signal: controller.signal,
          limit: 6,
        });
        if (!controller.signal.aborted) {
          setAddressSuggestions(results);
          setAddressStatus("ready");
          setIsAddressOpen(true);
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          console.error("Autocomplete failed", e);
          setAddressStatus("error");
          setAddressSuggestions([]);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [addressQuery]);

  // --- Weather ---
  const fetchWeather = async () => {
    if (!weatherLocation) return;
    try {
      const data = await Services.fetchWeather(weatherLocation);
      if (data) {
        setHourlyForecast(data);
        setWeatherUnavailable(false);
      } else {
        setHourlyForecast(null);
        setWeatherUnavailable(true);
      }
    } catch (e) {
      console.error(e);
      setHourlyForecast(null);
      setWeatherUnavailable(true);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [weatherLocation]);

  useEffect(() => {
    if (ENABLE_MISSION_PLANNING && polygon && polygon.length > 2) {
      const bounds = L.latLngBounds(polygon.map((p) => L.latLng(p.lat, p.lng)));
      const center = bounds.getCenter();
      setWeatherLocation([center.lat, center.lng]);
      return;
    }
    setWeatherLocation(mapCenter);
  }, [polygon, mapCenter]);

  // --- Rain Radar (RainViewer) ---
  const refreshRainRadar = async () => {
    if (!mapRef.current) return;
    setRainRadarStatus("loading");
    setRainRadarUnavailable(false);
    try {
      const result = await Services.fetchRainRadar(
        mapRef.current,
        layersRef,
        rainRadarTimestampRef,
      );
      if (result?.timestamp) {
        setRainRadarTimestamp(result.timestamp);
        setRainRadarStatus("ready");
      } else {
        setRainRadarStatus("unavailable");
        setRainRadarUnavailable(true);
      }
    } catch (e) {
      console.error("RainViewer error", e);
      setRainRadarStatus("error");
      setRainRadarUnavailable(true);
    }
  };

  useEffect(() => {
    if (!rainRadarEnabled) {
      if (radarIntervalRef.current) {
        clearInterval(radarIntervalRef.current);
        radarIntervalRef.current = null;
      }

      const Lr = layersRef.current;
      if (Lr.rainRadar && mapRef.current) {
        mapRef.current.removeLayer(Lr.rainRadar);
        Lr.rainRadar = null;
      }
      setRainRadarUnavailable(false);
      setRainRadarStatus("idle");
      return;
    }

    refreshRainRadar();
    radarIntervalRef.current = setInterval(refreshRainRadar, 5 * 60 * 1000);

    return () => {
      if (radarIntervalRef.current) {
        clearInterval(radarIntervalRef.current);
        radarIntervalRef.current = null;
      }
      const Lr = layersRef.current;
      if (Lr.rainRadar && mapRef.current) {
        mapRef.current.removeLayer(Lr.rainRadar);
        Lr.rainRadar = null;
      }
    };
  }, [rainRadarEnabled]);

  // --- Aircraft (ADSBexchange) ---
  const fetchAircraft = useCallback(async () => {
    if (!ENABLE_REALTIME_PANEL) return;
    if (!aircraftEnabled || !mapCenter) return;
    setAircraftStatus((prev) => (prev === "ready" ? "updating" : "loading"));
    setAircraftUnavailable(false);

    try {
      const filtered = await Services.fetchAircraft(mapCenter, aircraftRangeKm);
      setAircraftData(filtered);
      setAircraftUnavailable(filtered.length === 0);
      setAircraftTimestamp(Date.now());
      setAircraftStatus("ready");
    } catch (e) {
      console.error("ADSBexchange error", e);
      setAircraftStatus("error");
      setAircraftUnavailable(true);
    }
  }, [aircraftEnabled, mapCenter, aircraftRangeKm]);

  useEffect(() => {
    if (!ENABLE_REALTIME_PANEL) return;
    if (!aircraftEnabled) {
      if (aircraftIntervalRef.current) {
        clearInterval(aircraftIntervalRef.current);
        aircraftIntervalRef.current = null;
      }
      setAircraftStatus("idle");
      setAircraftUnavailable(false);
      setAircraftData([]);
      const Lr = layersRef.current;
      if (Lr.aircraft && mapRef.current) {
        mapRef.current.removeLayer(Lr.aircraft);
        Lr.aircraft = null;
      }
      return;
    }

    fetchAircraft();
    aircraftIntervalRef.current = setInterval(fetchAircraft, 15000);

    return () => {
      if (aircraftIntervalRef.current) {
        clearInterval(aircraftIntervalRef.current);
        aircraftIntervalRef.current = null;
      }
    };
  }, [aircraftEnabled, fetchAircraft]);

  const windTimeline = useMemo(
    () => buildWindTimeline(hourlyForecast, weatherLocation),
    [hourlyForecast, weatherLocation],
  );

  const isSlotRelevant = useCallback(
    (slot) => {
      const {
        includeNightFlights,
        minSunAltitude,
        maxSunAltitude,
      } = suitabilitySettings;

      if (includeNightFlights) return true;
      if (slot.sunAlt === null || slot.sunAlt === undefined) return true;
      return (
        slot.sunAlt >= minSunAltitude && slot.sunAlt <= maxSunAltitude
      );
    },
    [suitabilitySettings],
  );

  const isSlotFlyable = useCallback(
    (slot) => slotIsFlyable(slot, suitabilitySettings),
    [suitabilitySettings],
  );

  const daySuitability = useMemo(() => {
    const formatRange = (values, unit) => {
      if (!values.length) return "-";
      const min = Math.min(...values);
      const max = Math.max(...values);
      if (min === max) return `${min.toFixed(1)}${unit}`;
      return `${min.toFixed(1)}–${max.toFixed(1)}${unit}`;
    };

    const formatPercentRange = (values) => {
      if (!values.length) return "-";
      const min = Math.min(...values);
      const max = Math.max(...values);
      if (min === max) return `${min.toFixed(0)}%`;
      return `${min.toFixed(0)}–${max.toFixed(0)}%`;
    };

    const SLOT_HOURS = 3;

    const getWindows = (slots) => {
      if (!slots.length) return [];
      const windows = [];
      let current = null;

      slots.forEach((slot) => {
        if (slot.isFlyable) {
          if (!current) {
            current = { start: slot, end: slot, count: 1 };
          } else {
            current.end = slot;
            current.count += 1;
          }
        } else if (current) {
          windows.push(current);
          current = null;
        }
      });

      if (current) windows.push(current);

      return windows.map((window) => {
        const startTime = window.start.time;
        const endDate = new Date(`${window.end.key.slice(0, 13)}:00`);
        endDate.setHours(endDate.getHours() + SLOT_HOURS);
        const endTime = endDate.toISOString().slice(11, 16);
        return {
          label: `${startTime}–${endTime}`,
          hours: window.count * SLOT_HOURS,
          count: window.count,
        };
      });
    };

    const formatFlyableHoursLabel = (windowHours, totalHours) => {
      if (totalHours <= 0) return "אין חלון טיסה";
      const hasSequence = windowHours.some((hours) => hours > SLOT_HOURS);
      if (!hasSequence) return `${totalHours} ש׳`;
      const min = Math.min(...windowHours);
      const max = Math.max(...windowHours);
      if (min === max) return `${min} ש׳`;
      return `${min}–${max} ש׳`;
    };

    return windTimeline.map((day) => {
      const relevantSlots = day.slots.filter(isSlotRelevant);
      const enrichedSlots = day.slots.map((slot) => ({
        ...slot,
        isRelevant: isSlotRelevant(slot),
        isFlyable: isSlotFlyable(slot),
        riskScore: calculateSlotRisk(slot, suitabilitySettings),
      }));
      const relevantEnriched = enrichedSlots.filter((slot) => slot.isRelevant);
      const flyableSlots = relevantEnriched.filter((slot) => slot.isFlyable);
      const percent =
        relevantEnriched.length > 0
          ? Math.round((flyableSlots.length / relevantEnriched.length) * 100)
          : 0;
      const baseRiskScore =
        relevantEnriched.length > 0
          ? relevantEnriched.reduce(
              (total, slot) =>
                total + calculateSlotRisk(slot, suitabilitySettings),
              0,
            ) / relevantEnriched.length
          : 0;
      const availabilityPenalty = 1 - percent / 100;
      const dayRiskScore =
        percent > 0 ? (baseRiskScore + availabilityPenalty) / 2 : baseRiskScore;

      const winds = relevantSlots
        .map((slot) => slot.wind)
        .filter((value) => typeof value === "number");
      const gusts = relevantSlots
        .map((slot) => slot.gust ?? slot.wind)
        .filter((value) => typeof value === "number");
      const rain = relevantSlots
        .map((slot) => slot.rainProb)
        .filter((value) => typeof value === "number");
      const clouds = relevantSlots
        .map((slot) => slot.clouds)
        .filter((value) => typeof value === "number");

      const flyableWindows = getWindows(relevantEnriched);
      const windowHours = flyableWindows.map((window) => window.hours);
      const flyableHoursTotal = flyableSlots.length * SLOT_HOURS;

      return {
        ...day,
        enrichedSlots,
        relevantSlots: relevantEnriched,
        flyableSlots,
        percent,
        dayRiskScore,
        windRange: formatRange(winds, " m/s"),
        gustRange: formatRange(gusts, " m/s"),
        rainRange: formatPercentRange(rain),
        cloudRange: formatPercentRange(clouds),
        flyableWindows: flyableWindows.map((window) => window.label),
        flyableHoursLabel: formatFlyableHoursLabel(
          windowHours,
          flyableHoursTotal,
        ),
        flyableHoursTotal,
      };
    });
  }, [windTimeline, isSlotRelevant, isSlotFlyable, suitabilitySettings]);

  useEffect(() => {
    if (selectedDayIndex >= daySuitability.length && daySuitability.length > 0) {
      setSelectedDayIndex(0);
    }
  }, [daySuitability.length, selectedDayIndex]);

  const sanitizeDataUrl = (dataUrl, mimeType) => {
    if (typeof dataUrl !== "string") return null;
    const expectedPrefix = `data:${mimeType}`;
    if (!dataUrl.startsWith(expectedPrefix)) return null;

    const commaIndex = dataUrl.indexOf(",");
    if (commaIndex === -1) return null;

    try {
      const sample = atob(dataUrl.slice(commaIndex + 1, commaIndex + 256));
      if (/<svg/i.test(sample) || /<script/i.test(sample)) return null;
    } catch (err) {
      console.warn("Failed to inspect uploaded image payload", err);
      return null;
    }

    return dataUrl;
  };

  const handleDocFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const errors = [];
    const safeFiles = [];
    const currentCount = docForm.images.length;

    files.forEach((file) => {
      if (!ALLOWED_DOC_IMAGE_TYPES.has(file.type)) {
        errors.push(`${file.name} לא אושרה (סוג קובץ לא נתמך)`);
        return;
      }

      if (file.size > MAX_DOC_IMAGE_BYTES) {
        errors.push(`${file.name} חורגת מהמגבלה (עד 5MB לקובץ)`);
        return;
      }

      if (currentCount + safeFiles.length >= MAX_DOC_IMAGES) {
        errors.push("חריגה ממספר התמונות המרבי (10)");
        return;
      }

      safeFiles.push(file);
    });

    if (errors.length > 0) {
      alert(errors.join("\n"));
    }

    if (safeFiles.length === 0) {
      event.target.value = "";
      return;
    }

    Promise.all(
      safeFiles.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error("קובץ לא נקרא"));
            reader.onload = () => {
              const dataUrl = sanitizeDataUrl(reader.result, file.type);
              if (!dataUrl) {
                reject(new Error(`${file.name} נפסל בשל תוכן לא בטוח`));
                return;
              }

              resolve({ name: file.name, dataUrl });
            };
            reader.readAsDataURL(file);
          }),
      ),
    )
      .then((results) => {
        setDocForm((prev) => ({
          ...prev,
          images: [...prev.images, ...results],
        }));
      })
      .catch((err) => alert(err.message))
      .finally(() => {
        event.target.value = "";
      });
  };

  const sampleDocumentationLocation = () => {
    if (!docLocationAllowed) {
      alert("הפעל שמירת מיקום לפני דגימת קואורדינטות לאובייקט.");
      return;
    }

    if (userLocation) {
      setDocForm((prev) => ({
        ...prev,
        location: {
          lat: userLocation[0],
          lng: userLocation[1],
          accuracy: userAccuracy,
        },
      }));
      return;
    }

    if (!navigator.geolocation) {
      alert("המכשיר לא תומך בדגימת מיקום.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDocForm((prev) => ({
          ...prev,
          location: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          },
        }));
      },
      () => alert("לא הצלחנו לקבל מיקום כעת"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const addDocumentationEntry = () => {
    if (
      !docForm.title &&
      !docForm.notes &&
      docForm.images.length === 0 &&
      !docForm.location
    ) {
      alert("הוסף לפחות שם, מלל, מיקום או תמונה כדי לשמור אובייקט.");
      return;
    }

    const locationPayload = docLocationAllowed ? docForm.location : null;
    const entry = {
      ...docForm,
      location: locationPayload,
      id: Date.now(),
      timestamp: new Date().toISOString(),
    };

    setDocEntries((prev) => [entry, ...prev].slice(0, MAX_DOC_ENTRIES));
    setDocForm((prev) => ({
      ...prev,
      title: "",
      notes: "",
      images: [],
      location: locationPayload,
    }));
  };

  const exportDocumentationPDF = () => {
    if (!window.jspdf?.jsPDF) {
      alert("ספריית PDF לא נטענה.");
      return;
    }

    if (docEntries.length === 0) {
      alert("אין אובייקטים לייצוא.");
      return;
    }

    const doc = new window.jspdf.jsPDF({ unit: "mm" });
    let y = 15;
    doc.setFontSize(16);
    doc.text("כרטיסיית תיעוד", 10, y);
    y += 8;
    doc.setFontSize(12);

    docEntries.forEach((entry, idx) => {
      if (y > 260) {
        doc.addPage();
        y = 15;
      }
      doc.setFont(undefined, "bold");
      doc.text(`${idx + 1}. ${entry.title || "ללא כותרת"}`, 10, y);
      doc.setFont(undefined, "normal");
      y += 6;
      if (entry.timestamp) {
        doc.text(new Date(entry.timestamp).toLocaleString("he-IL"), 10, y);
        y += 6;
      }
      if (entry.location) {
        doc.text(
          `מיקום: ${entry.location.lat.toFixed(5)}, ${entry.location.lng.toFixed(5)}`,
          10,
          y,
        );
        y += 6;
        if (entry.location.accuracy) {
          doc.text(`דיוק: ~${Math.round(entry.location.accuracy)} מ'`, 10, y);
          y += 6;
        }
      }
      if (entry.notes) {
        const lines = doc.splitTextToSize(entry.notes, 180);
        doc.text(lines, 10, y);
        y += lines.length * 6;
      }
      (entry.images || []).forEach((img) => {
        if (!img?.dataUrl?.startsWith("data:image")) return;
        const props = doc.getImageProperties(img.dataUrl);
        const width = 180;
        const height = (props.height * width) / props.width;
        if (y + height > 280) {
          doc.addPage();
          y = 15;
        }
        doc.addImage(
          img.dataUrl,
          props.fileType || "JPEG",
          15,
          y,
          width,
          height,
        );
        y += height + 4;
      });
      y += 6;
    });

    doc.save("documentation.pdf");
  };

  const serializeDocumentation = () => ({
    version: "1.0",
    generatedAt: new Date().toISOString(),
    entries: docEntries.slice(0, MAX_DOC_ENTRIES).map((entry) => ({
      ...entry,
      location: entry.location ?? null,
    })),
  });

  const downloadDocumentationProject = () => {
    if (docEntries.length === 0) {
      alert("אין אובייקטים לייצוא.");
      return;
    }

    const blob = new Blob([JSON.stringify(serializeDocumentation(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "aerial-planner-documentation.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const shareDocumentationProject = async () => {
    if (docEntries.length === 0) {
      alert("אין אובייקטים לשיתוף.");
      return;
    }

    const payload = serializeDocumentation();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const filename = "aerial-planner-documentation.json";

    try {
      if (typeof navigator !== "undefined" && navigator.canShare) {
        const file = new File([blob], filename, { type: "application/json" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "כרטיסיית תיעוד",
            text: "קובץ תיעוד לשיתוף מהאפליקציה",
          });
          return;
        }
      }
    } catch (e) {
      console.warn("Native share failed, falling back to WhatsApp link", e);
    }

    const summaryText = [
      "שיתוף תיעוד משימה:",
      ...docEntries.slice(0, 5).map((entry, idx) =>
        `${idx + 1}. ${entry.title || "ללא כותרת"}${
          entry.notes ? ` – ${entry.notes.slice(0, 80)}` : ""
        }`,
      ),
      "נוצר מ- Aerial Planner",
    ].join("\n");

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(summaryText)}`;
    window.open(whatsappUrl, "_blank");
  };

  const exportDocumentationShapefile = () => {
    if (!window.shpwrite) {
      alert("ספריית Shapefile לא נטענה.");
      return;
    }

    const features = docEntries
      .filter((e) => e.location)
      .map((e) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [e.location.lng, e.location.lat],
        },
        properties: {
          title: e.title || "ללא כותרת",
          notes: e.notes || "",
          timestamp: e.timestamp,
          accuracy: e.location?.accuracy ?? null,
        },
      }));

    if (features.length === 0) {
      alert("אין אובייקטים עם מיקום לייצוא.");
      return;
    }

    window.shpwrite.download(
      { type: "FeatureCollection", features },
      { folder: "documentation", types: { point: "docs" } },
    );
  };

  const clearDocumentationEntries = () => {
    setDocEntries([]);
    setDocForm((prev) => ({ ...prev, location: null }));
    [
      [sessionStorage, DOC_STORAGE_KEY],
      [localStorage, DOC_LOCAL_STORAGE_KEY],
    ].forEach(([storage, key]) => {
      if (typeof storage === "undefined") return;
      try {
        storage.removeItem(key);
      } catch (e) {
        console.warn("Failed to clear stored documentation entries", e);
      }
    });
  };

  const geolocateButtonStyle = {
    bottom: !isMobile && showTimeline ? "calc(55vh + 1rem)" : "1.5rem",
  };

  const computeSidebarWidthPx = useCallback(() => {
    if (typeof window === "undefined") return 0;

    // Prefer the rendered sidebar width when available to avoid over-estimating
    // offsets on larger tablets that still report a coarse pointer (and are
    // therefore treated as mobile).
    const measuredWidth = sidebarRef.current?.offsetWidth;
    if (measuredWidth) return measuredWidth;

    const raw =
      getComputedStyle(document.documentElement).getPropertyValue(
        "--mobile-sidebar-width",
      ) || "62%";

    const trimmed = raw.trim();

    if (trimmed.endsWith("%")) {
      const percent = Number.parseFloat(trimmed.replace("%", ""));
      return Number.isFinite(percent)
        ? Math.min((percent / 100) * window.innerWidth, 420)
        : 0;
    }

    if (trimmed.endsWith("px")) {
      const pixels = Number.parseFloat(trimmed.replace("px", ""));
      return Number.isFinite(pixels) ? Math.min(pixels, 420) : 0;
    }

    return Math.min(window.innerWidth * 0.62, 420);
  }, []);

  const computeDesktopDockOffset = useCallback(() => {
    const gapPx = 16;

    const realtimeWidth = realtimePanelOpen ? realtimePanelWidth : 0;

    return gapPx + realtimeWidth;
  }, [realtimePanelOpen, realtimePanelWidth]);

  useEffect(() => {
    const updateOffset = () => setDesktopDockOffset(computeDesktopDockOffset());

    updateOffset();
    window.addEventListener("resize", updateOffset);

    return () => window.removeEventListener("resize", updateOffset);
  }, [computeDesktopDockOffset]);

  useEffect(() => {
    if (!realtimePanelOpen) {
      setRealtimePanelWidth(0);
      return;
    }

    const updateRealtimeWidth = () => {
      const width = realtimePanelRef.current?.offsetWidth || 0;
      setRealtimePanelWidth(width);
    };

    updateRealtimeWidth();
    window.addEventListener("resize", updateRealtimeWidth);

    return () => window.removeEventListener("resize", updateRealtimeWidth);
  }, [realtimePanelOpen]);

  const dockPositionClasses = useMemo(() => {
    return isMobile
      ? "flex justify-end"
      : "flex left-auto items-start justify-start";
  }, [isMobile]);

  const dockPositionStyle = useMemo(() => {
    if (isMobile) {
      const mobileGapPx = 12;
      const sidebarWidthPx = computeSidebarWidthPx();
      const sidebarOffsetPx =
        sidebarWidthPx > 0 ? sidebarWidthPx + mobileGapPx : mobileGapPx;
      const realtimeOffsetPx =
        realtimePanelOpen && realtimePanelWidth > 0
          ? realtimePanelWidth + mobileGapPx
          : 0;

      const offsetPx = realtimeOffsetPx
        ? Math.max(realtimeOffsetPx, sidebarOpen ? sidebarOffsetPx : mobileGapPx)
        : sidebarOpen
          ? sidebarOffsetPx
          : mobileGapPx;

      return { right: `${offsetPx}px` };
    }

    return { right: `${desktopDockOffset}px` };
  }, [
    desktopDockOffset,
    computeSidebarWidthPx,
    isMobile,
    realtimePanelOpen,
    realtimePanelWidth,
    sidebarOpen,
  ]);

  const plannerPanelWidth = useMemo(() => {
    return isMobile ? "min(50vw, 360px)" : "min(50vw, 640px)";
  }, [isMobile]);

  const dtmHeatPoints = useMemo(
    () => buildDtmHeatPoints(dtmData, dtmStats),
    [dtmData, dtmStats],
  );

  // --- DTM (With Fallback) ---
  const fetchDTM = async () => {
    if (!ENABLE_MISSION_PLANNING) return;
    if (polygon.length < 3) return alert("סמן אזור תחילה");
    setIsFetchingDTM(true);
    setDtmData(null);
    setTerrainShadows([]);
    setIsSimulatedDTM(false);

    try {
      const result = await Services.fetchDTM(polygon);
      processDTM(result.grid, result.simulated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingDTM(false);
    }
  };

  /**
   * Persist sampled DTM data, compute basic statistics, and derive terrain shadow geometry.
   * @param {{lat: number, lng: number, ele: number}[]} grid - Elevation samples across the polygon.
   * @param {boolean} isSim - Whether the data originated from the fallback simulator.
   */
  const processDTM = (grid, isSim) => {
    setDtmData(grid);
    setIsSimulatedDTM(isSim);
    const stats = computeElevationStats(grid);
    const summary =
      stats && grid.length
        ? { min: stats.min, max: stats.max, avg: stats.sum / grid.length }
        : null;
    setDtmStats(summary);
    calcShadows(grid, summary?.min);
  };

  /**
   * Estimate terrain shadow segments for the current flight time using the SunCalc library.
   * @param {{lat: number, lng: number, ele: number}[]} grid - Elevation samples used to derive relative heights.
   */
  const calcShadows = (grid, minEle) => {
    if (typeof SunCalc === "undefined") return;
    const sun = SunCalc.getPosition(
      new Date(flightDate),
      mapCenter[0],
      mapCenter[1],
    );
    if (sun.altitude <= 0) return; // Night

    const shadows = [];
    const referenceMin =
      typeof minEle === "number"
        ? minEle
        : Math.min(...grid.map((p) => p.ele));

    grid.forEach((pt) => {
      // Calculate shadow based on height relative to local minimum
      const relativeHeight = pt.ele - referenceMin;
      if (relativeHeight <= 1) return;

      // Shadow Length = h / tan(alpha)
      // Exaggerate slightly for visibility
      const len = (relativeHeight * 1.2) / Math.tan(sun.altitude);

      // Cap shadow length to avoid map artifacts
      const displayLen = Math.min(len, 500);

      if (displayLen > 5) {
        const az = sun.azimuth + Math.PI;
        const dLat = (Math.cos(az) * displayLen) / 111111;
        const dLng =
          (Math.sin(az) * displayLen) /
          (111111 * Math.cos((pt.lat * Math.PI) / 180));
        shadows.push([
          [pt.lat, pt.lng],
          [pt.lat + dLat, pt.lng + dLng],
        ]);
      }
    });
    setTerrainShadows(shadows);
  };

  useEffect(() => {
    if (!ENABLE_MISSION_PLANNING) return;
    if (dtmData) calcShadows(dtmData, dtmStats?.min);
  }, [flightDate, dtmData, dtmStats]);

  // --- Path Generation ---
  /**
   * Generate a lawnmower-style flight path over the selected polygon, updating total distance.
   * @returns {number[][]} Ordered lat/lng pairs for the flight polyline.
   */
  const generatePath = () => {
    if (!ENABLE_MISSION_PLANNING) return [];
    if (polygon.length < 3) {
      setTotalDistance(0);
      return [];
    }

    const drone = activeDrone;
    if (!drone || !activeFocalLength) {
      setTotalDistance(0);
      return [];
    }

    const footprintW = (drone.sensorWidth * altitude) / activeFocalLength;
    const spacingMeters = footprintW * (1 - overlapSide / 100);

    // "azimuth" represents the intended direction of flight lines. Internally we
    // rotate the polygon so we can draw horizontal sweeps, so offset by -90° to
    // keep the visible flight lines aligned with the requested azimuth instead
    // of perpendicular to it.
    let angle = azimuth - 90;
    const polyPoints = polygon.map((p) => ({ lat: p.lat, lng: p.lng }));

    if (autoOrient) {
      angle = AerialPlanner.geometry.getAutoAzimuth(polyPoints) - 90;
    }

    const center = polyPoints[0];
    const rotatedPoly = polyPoints.map((p) =>
      AerialPlanner.geometry.rotatePoint(p, -angle, center),
    );

    const lats = rotatedPoly.map((p) => p.lat);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const spacingDeg = spacingMeters / 111111;
    const lines = [];

    for (let y = maxLat - spacingDeg / 2; y > minLat; y -= spacingDeg) {
      let intersections = [];
      for (let i = 0; i < rotatedPoly.length; i++) {
        const p1 = rotatedPoly[i];
        const p2 = rotatedPoly[(i + 1) % rotatedPoly.length];
        if ((p1.lat > y && p2.lat <= y) || (p2.lat > y && p1.lat <= y)) {
          const x =
            p1.lng + ((y - p1.lat) * (p2.lng - p1.lng)) / (p2.lat - p1.lat);
          intersections.push(x);
        }
      }
      intersections.sort((a, b) => a - b);
      for (let i = 0; i < intersections.length; i += 2) {
        if (i + 1 < intersections.length) {
          lines.push([
            { lat: y, lng: intersections[i] },
            { lat: y, lng: intersections[i + 1] },
          ]);
        }
      }
    }

    const finalPath = [];
    let dist = 0;

    lines.forEach((line, index) => {
      const start = AerialPlanner.geometry.unrotatePoint(
        line[0],
        -angle,
        center,
      );
      const end = AerialPlanner.geometry.unrotatePoint(line[1], -angle, center);

      dist += AerialPlanner.geometry.getDistance(start, end);

      if (index > 0) {
        const prevPoint = finalPath[finalPath.length - 1];
        const currentStart = index % 2 === 0 ? start : end;
        dist += AerialPlanner.geometry.getDistance(
          { lat: prevPoint[0], lng: prevPoint[1] },
          currentStart,
        );
      }

      if (index % 2 === 0) {
        finalPath.push([start.lat, start.lng], [end.lat, end.lng]);
      } else {
        finalPath.push([end.lat, end.lng], [start.lat, start.lng]);
      }
    });

    setTotalDistance(dist);
    return finalPath;
  };

  useEffect(() => {
    if (!ENABLE_MISSION_PLANNING) return;
    if (autoOrient && polygon.length > 2) {
      const best = AerialPlanner.geometry.getAutoAzimuth(
        polygon.map((p) => ({ lat: p.lat, lng: p.lng })),
      );
      setAzimuth(Math.round(best));
    }
  }, [polygon, autoOrient]);

  // --- Map Rendering ---
  useEffect(() => {
    if (!mapRef.current) {
      const esriImagery = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Esri" },
      );

      const osmFallback = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { attribution: "&copy; OpenStreetMap contributors" },
      );

      // If the Esri imagery fails (rate limit / CORS), fall back to OpenStreetMap so the map still renders.
      esriImagery.on("tileerror", () => {
        if (!mapRef.current.hasLayer(osmFallback)) {
          mapRef.current.addLayer(osmFallback);
        }
      });

      mapRef.current = L.map("map", {
        center: mapCenter,
        zoom: 15,
        layers: [esriImagery],
        zoomControl: false,
      });
      mapRef.current.on("click", (e) => {
        if (!ENABLE_MISSION_PLANNING) return;
        setPolygon((prev) => [
          ...prev,
          { lat: e.latlng.lat, lng: e.latlng.lng },
        ]);
      });
      mapRef.current.on("moveend", () => {
        const center = mapRef.current.getCenter();
        setMapCenter([center.lat, center.lng]);
      });
    }
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => mapRef.current.invalidateSize(), 150);
    }
  }, [sidebarOpen]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const Lr = layersRef.current;

    if (Lr.poly) map.removeLayer(Lr.poly);
    if (Lr.path) map.removeLayer(Lr.path);
    if (Lr.shadows) map.removeLayer(Lr.shadows);
    if (Lr.heat) map.removeLayer(Lr.heat);

    if (ENABLE_MISSION_PLANNING && polygon?.length > 0) {
      const latLngs = polygon.map((p) => [p.lat, p.lng]);
      Lr.poly = L.polygon(latLngs, {
        color: "yellow",
        weight: 2,
        fillOpacity: 0.1,
      }).addTo(map);
    }

    if (ENABLE_MISSION_PLANNING && polygon?.length > 2) {
      const pathPoints = generatePath();
      Lr.path = L.polyline(pathPoints, { color: "#3b82f6", weight: 3 }).addTo(
        map,
      );
    }

    if (ENABLE_MISSION_PLANNING && terrainShadows?.length > 0) {
      // Draw Shadows
      Lr.shadows = L.layerGroup(
        terrainShadows.map((l) =>
          L.polyline(l, { color: "black", weight: 4, opacity: 0.6 }),
        ),
      ).addTo(map);
    }

    if (ENABLE_MISSION_PLANNING && dtmHeatPoints.length > 0 && L.heatLayer) {
      // Draw smooth DTM heat layer
      Lr.heat = L.heatLayer(dtmHeatPoints, {
        radius: 28,
        blur: 22,
        max: 1,
        gradient: {
          0.0: "#2563eb", // נמוך
          0.4: "#22c55e",
          0.7: "#f59e0b",
          1.0: "#ef4444", // גבוה
        },
      }).addTo(map);
    }

    if (Lr.aircraft) {
      map.removeLayer(Lr.aircraft);
      Lr.aircraft = null;
    }

    const aircraftList = aircraftData ?? [];
    if (ENABLE_REALTIME_PANEL && aircraftEnabled && aircraftList.length > 0) {
      const markers = aircraftList.map((a) => {
        const heading = Number.isFinite(a.Trak) ? a.Trak : 0;
        const icon = L.divIcon({
          html: `<div style="transform: rotate(${heading}deg); width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; color: #ef4444;">✈️</div>`,
          className: "aircraft-icon",
          iconSize: [22, 22],
        });

        const marker = L.marker([a.Lat, a.Long], { icon });
        const speed = a.Spd ? `${Math.round(a.Spd)} kt` : "N/A";
        const altitude = a.Alt ? `${a.Alt} ft` : "N/A";
        const callsign = a.Call || a.Reg || a.Icao || "לא ידוע";

        marker.bindPopup(`
                    <div class="text-[12px]">
                        <div class="font-bold text-slate-800">${callsign}</div>
                        <div class="text-slate-700">גובה: ${altitude}</div>
                        <div class="text-slate-700">מהירות: ${speed}</div>
                        <div class="text-slate-700">כיוון: ${Math.round(heading)}°</div>
                        ${a.Op ? `<div class="text-slate-500 text-[11px]">${a.Op}</div>` : ""}
                    </div>
                `);
        return marker;
      });

      Lr.aircraft = L.layerGroup(markers).addTo(map);
    }
  }, [
    polygon,
    selectedDrone,
    altitude,
    overlapSide,
    azimuth,
    autoOrient,
    activeFocalLength,
    terrainShadows,
    dtmHeatPoints,
    aircraftEnabled,
    aircraftData,
  ]);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const Lr = layersRef.current;

    if (!userLocation) {
      if (Lr.userMarker) {
        map.removeLayer(Lr.userMarker);
        Lr.userMarker = null;
      }
      if (Lr.userAccuracy) {
        map.removeLayer(Lr.userAccuracy);
        Lr.userAccuracy = null;
      }
      return;
    }

    const latlng = L.latLng(userLocation[0], userLocation[1]);

    if (!Lr.userMarker) {
      Lr.userMarker = L.circleMarker(latlng, {
        radius: 8,
        color: "#2563eb",
        weight: 2,
        fillColor: "#60a5fa",
        fillOpacity: 0.9,
      }).addTo(map);
    } else {
      Lr.userMarker.setLatLng(latlng);
    }

    if (userAccuracy !== null && userAccuracy !== undefined) {
      const radius = Math.max(userAccuracy, 10);
      if (!Lr.userAccuracy) {
        Lr.userAccuracy = L.circle(latlng, {
          radius,
          color: "#60a5fa",
          weight: 1,
          fillColor: "#bfdbfe",
          fillOpacity: 0.2,
          interactive: false,
        }).addTo(map);
      } else {
        Lr.userAccuracy.setLatLng(latlng);
        Lr.userAccuracy.setRadius(radius);
      }
    } else if (Lr.userAccuracy) {
      map.removeLayer(Lr.userAccuracy);
      Lr.userAccuracy = null;
    }
  }, [userLocation, userAccuracy]);

  // Stats Calc
  const stats = useMemo(() => {
    const d = activeDrone;
    if (!d || !activeFocalLength) {
      return {
        gsd: "0.00",
        time: 0,
        images: 0,
        dist: Math.round(totalDistance),
        coverageKm2: "0",
      };
    }

    const gsd =
      (d.sensorWidth * altitude * 100) / (activeFocalLength * d.imageWidth);
    const timeMin =
      totalDistance > 0 ? Math.ceil(totalDistance / speed / 60) : 0;
    const footprintH = (d.sensorHeight * altitude) / activeFocalLength;
    const triggerDist = footprintH * (1 - overlapFront / 100);
    const imgCount =
      totalDistance > 0 ? Math.ceil(totalDistance / triggerDist) : 0;
    const polygonAreaSqM = (() => {
      if (!polygon || polygon.length < 3) return 0;
      const refLatRad = (polygon[0].lat * Math.PI) / 180;
      const meterPerDegLat = 111132.92 - 559.82 * Math.cos(2 * refLatRad) + 1.175 * Math.cos(4 * refLatRad);
      const meterPerDegLng =
        (Math.PI / 180) * 6378137 * Math.cos(refLatRad);

      const coords = polygon.map((p) => ({
        x: (p.lng - polygon[0].lng) * meterPerDegLng,
        y: (p.lat - polygon[0].lat) * meterPerDegLat,
      }));

      let sum = 0;
      for (let i = 0; i < coords.length; i++) {
        const current = coords[i];
        const next = coords[(i + 1) % coords.length];
        sum += current.x * next.y - next.x * current.y;
      }
      return Math.abs(sum) / 2;
    })();

    const coverageKm2 = polygonAreaSqM > 0 ? (polygonAreaSqM / 1_000_000).toFixed(2) : "0";

    return {
      gsd: gsd.toFixed(2),
      time: timeMin,
      images: imgCount,
      dist: Math.round(totalDistance),
      coverageKm2,
    };
  }, [
    activeDrone,
    activeFocalLength,
    altitude,
    totalDistance,
    speed,
    overlapFront,
    polygon,
  ]);

  const selectedSlotKey = useMemo(
    () => `${flightDate.slice(0, 13)}:00`,
    [flightDate],
  );

  const timelineBoard = (
    <TimelineBoard
      show={timelineVisible}
      isMobile={isMobile}
      days={daySuitability}
      dataUnavailable={weatherUnavailable}
      selectedSlotKey={selectedSlotKey}
      onSlotSelect={setFlightDate}
      selectedDayIndex={selectedDayIndex}
      onSelectDay={(index) => {
        setSelectedDayIndex(index);
        setShowDayDetails(true);
      }}
      showDayDetails={showDayDetails}
      onCloseDayDetails={() => setShowDayDetails(false)}
      filterFlyableOnly={filterFlyableOnly}
      onToggleFilterFlyable={() =>
        setFilterFlyableOnly((prev) => !prev)
      }
      panelWidth={plannerPanelWidth}
      onOpenSettings={openSuitabilitySettings}
      showSettingsButton={true}
    />
  );

  return (
    <>
      {showSettings && (
        <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`relative rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4 ${settingsTheme.modal}`}
          >
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className={`absolute top-4 left-4 rounded-full border p-2 shadow-sm transition ${settingsTheme.closeButton}`}
              aria-label="סגור הגדרות"
            >
              <Icon name="close" size={16} />
            </button>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="pr-8 md:pr-0">
                <div className="text-sm uppercase tracking-widest text-blue-600 font-bold">
                  הגדרות מערכת
                </div>
                <h2 className={`text-2xl font-black ${settingsTheme.title}`}>
                  ספי יציבות לטיסה
                </h2>
                <p className={`text-sm ${settingsTheme.subtitle}`}>
                  הגדר פרמטרים ברירת מחדל למה נחשב יום מתאים לטיסה. לחץ על פרמטר
                  כדי לאפשר עריכה.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 justify-end">
                <div className={`text-sm flex items-center gap-2 ${settingsTheme.metaText}`}>
                  מצב תצוגה:
                  <span className="font-semibold">
                    {theme === "dark" ? "כהה" : "בהיר"}
                  </span>
                </div>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-sm font-semibold hover:bg-blue-100"
                >
                  החלף למצב {theme === "dark" ? "בהיר" : "כהה"}
                </button>
                <button
                  onClick={resetSuitabilitySettings}
                  className={`px-3 py-2 rounded-lg border text-sm font-semibold ${
                    theme === "dark"
                      ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  איפוס לברירת מחדל
                </button>
              </div>
            </div>

            <div
              className={`text-xs border rounded-lg px-3 py-2 ${settingsTheme.summary}`}
            >
              מה נחשב יציב: רוח ≤ {suitabilitySettings.maxWind} מ"ש · משבים ≤{" "}
              {suitabilitySettings.maxGust} מ"ש · עננות בין{" "}
              {suitabilitySettings.minCloudCover}% ל-
              {suitabilitySettings.maxCloudCover}% · גשם ≤{" "}
              {suitabilitySettings.maxRainProb}% · שמש בין{" "}
              {suitabilitySettings.minSunAltitude}° ל-
              {suitabilitySettings.maxSunAltitude}°
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={`text-sm font-semibold ${settingsTheme.label}`}>
                  מקסימום רוח (מ"ש)
                </label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  step="0.5"
                  value={suitabilitySettings.maxWind}
                  onChange={(e) =>
                    updateSuitabilitySetting(
                      "maxWind",
                      Number(e.target.value) || 0,
                    )
                  }
                  onFocus={enableSettingsEditing}
                  onClick={enableSettingsEditing}
                  className={`input-field ${settingsReadOnly ? "opacity-70" : ""} ${settingsTheme.input}`}
                  readOnly={settingsReadOnly}
                />
                <p className={`text-xs ${settingsTheme.helperText}`}>
                  ברירת מחדל: {Config.DEFAULT_SUITABILITY.maxWind} מ"ש.
                </p>
              </div>
              <div className="space-y-1">
                <label className={`text-sm font-semibold ${settingsTheme.label}`}>
                  מקסימום משבי רוח (מ"ש)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={suitabilitySettings.maxGust}
                  onChange={(e) =>
                    updateSuitabilitySetting(
                      "maxGust",
                      Number(e.target.value) || 0,
                    )
                  }
                  onFocus={enableSettingsEditing}
                  onClick={enableSettingsEditing}
                  className={`input-field ${settingsReadOnly ? "opacity-70" : ""} ${settingsTheme.input}`}
                  readOnly={settingsReadOnly}
                />
                <p className={`text-xs ${settingsTheme.helperText}`}>
                  ברירת מחדל: {Config.DEFAULT_SUITABILITY.maxGust} מ"ש.
                </p>
              </div>
              <div className="space-y-1">
                <label className={`text-sm font-semibold ${settingsTheme.label}`}>
                  מינימום כיסוי עננים (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={suitabilitySettings.minCloudCover}
                  onChange={(e) =>
                    updateSuitabilitySetting(
                      "minCloudCover",
                      Number(e.target.value) || 0,
                    )
                  }
                  onFocus={enableSettingsEditing}
                  onClick={enableSettingsEditing}
                  className={`input-field ${settingsReadOnly ? "opacity-70" : ""} ${settingsTheme.input}`}
                  readOnly={settingsReadOnly}
                />
                <p className={`text-xs ${settingsTheme.helperText}`}>
                  ברירת מחדל: {Config.DEFAULT_SUITABILITY.minCloudCover}%.
                </p>
              </div>
              <div className="space-y-1">
                <label className={`text-sm font-semibold ${settingsTheme.label}`}>
                  מקסימום כיסוי עננים (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={suitabilitySettings.maxCloudCover}
                  onChange={(e) =>
                    updateSuitabilitySetting(
                      "maxCloudCover",
                      Number(e.target.value) || 0,
                    )
                  }
                  onFocus={enableSettingsEditing}
                  onClick={enableSettingsEditing}
                  className={`input-field ${settingsReadOnly ? "opacity-70" : ""} ${settingsTheme.input}`}
                  readOnly={settingsReadOnly}
                />
                <p className={`text-xs ${settingsTheme.helperText}`}>
                  ברירת מחדל: {Config.DEFAULT_SUITABILITY.maxCloudCover}%.
                </p>
              </div>
              <div className="space-y-1">
                <label className={`text-sm font-semibold ${settingsTheme.label}`}>
                  מקסימום הסתברות גשם (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={suitabilitySettings.maxRainProb}
                  onChange={(e) =>
                    updateSuitabilitySetting(
                      "maxRainProb",
                      Number(e.target.value) || 0,
                    )
                  }
                  onFocus={enableSettingsEditing}
                  onClick={enableSettingsEditing}
                  className={`input-field ${settingsReadOnly ? "opacity-70" : ""} ${settingsTheme.input}`}
                  readOnly={settingsReadOnly}
                />
                <p className={`text-xs ${settingsTheme.helperText}`}>
                  ברירת מחדל: {Config.DEFAULT_SUITABILITY.maxRainProb}%.
                </p>
              </div>
              <div className="space-y-1">
                <label className={`text-sm font-semibold ${settingsTheme.label}`}>
                  גובה שמש מינימלי (°)
                </label>
                <input
                  type="number"
                  min="-5"
                  max="90"
                  step="1"
                  value={suitabilitySettings.minSunAltitude}
                  onChange={(e) =>
                    updateSuitabilitySetting(
                      "minSunAltitude",
                      Number(e.target.value) || 0,
                    )
                  }
                  onFocus={enableSettingsEditing}
                  onClick={enableSettingsEditing}
                  className={`input-field ${settingsReadOnly ? "opacity-70" : ""} ${settingsTheme.input}`}
                  readOnly={settingsReadOnly}
                />
                <p className={`text-xs ${settingsTheme.helperText}`}>
                  ברירת מחדל: {Config.DEFAULT_SUITABILITY.minSunAltitude}°. ערך
                  גבוה יותר ימנע טיסה בשעת דמדומים.
                </p>
              </div>
              <div className="space-y-1">
                <label className={`text-sm font-semibold ${settingsTheme.label}`}>
                  גובה שמש מקסימלי (°)
                </label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  step="1"
                  value={suitabilitySettings.maxSunAltitude}
                  onChange={(e) =>
                    updateSuitabilitySetting(
                      "maxSunAltitude",
                      Number(e.target.value) || 0,
                    )
                  }
                  onFocus={enableSettingsEditing}
                  onClick={enableSettingsEditing}
                  className={`input-field ${settingsReadOnly ? "opacity-70" : ""} ${settingsTheme.input}`}
                  readOnly={settingsReadOnly}
                />
                <p className={`text-xs ${settingsTheme.helperText}`}>
                  ברירת מחדל: {Config.DEFAULT_SUITABILITY.maxSunAltitude}°. ניתן
                  להגביל במקרים של סינוור חזק.
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className={`text-sm font-semibold ${settingsTheme.label}`}>
                  כולל טיסות לילה
                </label>
                <div className={`flex items-start gap-3 rounded-lg border p-3 ${settingsTheme.panel}`}>
                  <input
                    id="includeNightFlights"
                    type="checkbox"
                    checked={suitabilitySettings.includeNightFlights}
                    onChange={(e) =>
                      updateSuitabilitySetting(
                        "includeNightFlights",
                        e.target.checked,
                      )
                    }
                    onFocus={enableSettingsEditing}
                    onClick={enableSettingsEditing}
                    className="mt-1 h-4 w-4 accent-blue-600"
                  />
                  <div>
                    <label
                      htmlFor="includeNightFlights"
                      className={`text-sm font-semibold ${settingsTheme.label}`}
                    >
                      הכללת שעות לילה בחישוב התאמה
                    </label>
                    <p className={`text-xs ${settingsTheme.helperText}`}>
                      כאשר כבוי, אחוז ההתאמה ושעות יציבות מחושבים רק בשעות יום.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`flex justify-between items-center text-sm rounded-lg p-3 ${
                theme === "dark"
                  ? "text-slate-200 bg-slate-800 border border-slate-700"
                  : "text-slate-600 bg-slate-100 border border-slate-200"
              }`}
            >
              <span>
                ההגדרות נשמרות למצב הנוכחי בלבד. שינוי הערכים משפיע על סימון
                השעות היציבות בלוח הרוח/עננות/גשם.
              </span>
              <button
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500"
                onClick={() => setShowSettings(false)}
              >
                שמור וסגור
              </button>
            </div>
          </div>
        </div>
      )}

      {WEATHER_ONLY_MODE ? (
        <MapView
          className="flex-1 relative h-full bg-black box-border"
          style={{ paddingBottom: mapBottomPadding }}
        >
          <div id="map"></div>
          <div
            className="absolute top-4 right-6 z-[940] w-[320px] max-w-[85vw] pointer-events-auto"
            ref={addressSearchRef}
          >
            <form onSubmit={handleAddressSubmit}>
              <div className="flex items-center gap-2 rounded-full bg-white/95 border border-slate-200 px-3 py-2 shadow-lg focus-within:ring-2 focus-within:ring-blue-500">
                <Icon name="map" size={16} className="text-slate-500" />
                <input
                  type="text"
                  value={addressQuery}
                  onChange={(event) => setAddressQuery(event.target.value)}
                  onFocus={() => setIsAddressOpen(true)}
                  placeholder="חיפוש כתובת להצגת מזג אוויר"
                  className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                {addressQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAddressQuery("");
                      setAddressSuggestions([]);
                      setIsAddressOpen(false);
                      setAddressStatus("idle");
                    }}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="נקה חיפוש"
                  >
                    <Icon name="close" size={14} />
                  </button>
                ) : null}
              </div>
            </form>
            {isAddressOpen && addressQuery.trim().length > 0 && (
              <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-xl">
                <div className="max-h-60 overflow-y-auto">
                  {addressStatus === "loading" && (
                    <div className="px-4 py-3 text-xs text-slate-500">
                      טוען הצעות...
                    </div>
                  )}
                  {addressStatus === "error" && (
                    <div className="px-4 py-3 text-xs text-red-600">
                      לא הצלחנו להביא הצעות כרגע.
                    </div>
                  )}
                  {addressStatus === "ready" &&
                    addressSuggestions.length === 0 && (
                      <div className="px-4 py-3 text-xs text-slate-500">
                        לא נמצאו תוצאות.
                      </div>
                    )}
                  {addressSuggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleAddressSelect(item)}
                      className="w-full text-right px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 transition"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {locationMessage && (
            <div className="absolute bottom-28 left-6 z-[930] bg-white/95 text-slate-800 px-4 py-2 rounded-full shadow-lg border border-slate-200 text-xs pointer-events-none">
              {locationMessage}
            </div>
          )}
          <div
            className="absolute left-6 z-[930] pointer-events-auto flex flex-col items-start gap-2"
            style={geolocateButtonStyle}
          >
            <button
              onClick={recenterOnUser}
              className="w-12 h-12 rounded-full bg-white/95 text-slate-800 shadow-lg border border-slate-200 flex items-center justify-center hover:-translate-y-0.5 hover:shadow-xl transition"
              aria-label="מרכז למיקום הנוכחי"
            >
              <Icon name="gps" size={18} />
            </button>
          </div>
          {timelineBoard}
        </MapView>
      ) : (
        <div className="flex flex-col md:flex-row h-full relative overflow-x-hidden">
        {/* Controls Sidebar */}
        {ENABLE_MISSION_PLANNING && (
        <Sidebar
          open={sidebarOpen}
          containerRef={sidebarRef}
          className={`${themeStyles.panel} flex flex-col z-[960] shadow-2xl mobile-panel overflow-y-auto custom-scroll fixed inset-y-0 right-0 md:static`}
          style={{ width: plannerPanelWidth }}
        >
          <div className={`${themeStyles.header} p-4 sticky top-0 z-30 flex justify-between items-center gap-2`}>
            <h1 className="font-black text-lg tracking-wider text-blue-400">
              SMART PLANNER
            </h1>
            <div className="flex items-center gap-2">
              <div
                role="tablist"
                aria-label="ניווט פאנל תכנון"
                className={`flex items-center rounded-xl overflow-hidden ${themeStyles.tabList}`}
              >
                <button
                  role="tab"
                  aria-selected={activeSidebarTab === "mission"}
                  className={`px-3 py-2 text-xs font-semibold transition focus:outline-none ${
                    activeSidebarTab === "mission"
                      ? themeStyles.tabActive
                      : themeStyles.tabInactive
                  }`}
                  onClick={() => {
                    setActiveSidebarTab("mission");
                    setShowSettings(false);
                  }}
                >
                  תכנון משימות
                </button>
                <button
                  role="tab"
                  aria-selected={activeSidebarTab === "settings"}
                  className={`px-3 py-2 text-xs font-semibold transition focus:outline-none border-r last:border-r-0 ${
                    activeSidebarTab === "settings"
                      ? themeStyles.tabActive
                      : themeStyles.tabInactive
                  } ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`}
                  onClick={() => {
                    setActiveSidebarTab("settings");
                    setShowSettings(true);
                  }}
                >
                  הגדרות
                </button>
              </div>
              <button className={themeStyles.iconButton}>
                <Icon name="gps" />
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className={themeStyles.closeButton}
                aria-label="סגור את לוח התכנון"
              >
                <Icon name="close" size={14} />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-6 flex-1 pb-24 md:pb-6">
            {/* Flight Params */}
            <div className="space-y-4">
              <div className={`${themeStyles.card} rounded-lg p-3 space-y-2`}>
                <div className="flex items-center justify-between gap-2">
                  <div className={`flex items-center gap-2 text-sm font-semibold ${themeStyles.accent}`}>
                    <Icon name="drone" size={18} /> בחר רחפן מבצעי
                  </div>
                  <div className={`flex items-center gap-2 text-[11px] ${themeStyles.subtleText}`}>
                    <span>
                      {Object.keys(AerialPlanner.config.DRONE_PRESETS).length}{" "}
                      דגמים זמינים
                    </span>
                    <button
                      className={`px-2 py-1 rounded ${
                        theme === "dark"
                          ? "bg-slate-700 hover:bg-slate-600 text-slate-200"
                          : "bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100"
                      }`}
                      onClick={() => setDronePanelOpen((o) => !o)}
                    >
                      {dronePanelOpen ? "הסתר" : "הצג"}
                    </button>
                  </div>
                </div>
                {dronePanelOpen ? (
                  <>
                    <p className={`text-xs ${themeStyles.subtleText}`}>
                      בחר דגם כדי לראות חיישן, סוג משימה ולקבל חישובי טיסה
                      מדויקים.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(AerialPlanner.config.DRONE_PRESETS).map(
                        ([k, v]) => (
                          <button
                            key={k}
                            onClick={() => setSelectedDrone(k)}
                            className={`w-full text-right border rounded-lg px-3 py-2 transition shadow-sm hover:border-blue-400 hover:shadow-lg focus:outline-none ${
                              selectedDrone === k
                                ? "border-blue-500 bg-blue-500/10 text-blue-900"
                                : theme === "dark"
                                  ? "border-slate-700 bg-slate-900 text-slate-100"
                                  : "border-slate-200 bg-white text-slate-900"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm">
                                {v.name}
                              </span>
                              <span
                                className={`text-[11px] px-2 py-1 rounded-full ${
                                  selectedDrone === k
                                    ? "bg-blue-600/20 text-blue-800"
                                    : themeStyles.chip
                                }`}
                              >
                                {v.type}
                              </span>
                            </div>
                            <div className={`text-[11px] ${themeStyles.subtleText} mt-1`}>
                              חיישן {v.sensorWidth}x{v.sensorHeight} מ"מ · מוקד{" "}
                              {v.focalLength} מ"מ
                            </div>
                            {v.opticalZoomLevels?.length ? (
                              <div className={`text-[10px] ${themeStyles.accent} mt-1`}>
                                זום אופטי עד {Math.max(...v.opticalZoomLevels)}x
                              </div>
                            ) : null}
                          </button>
                        ),
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <p className={`text-xs ${themeStyles.subtleText}`}>
                      פתיחה מלאה מציגה את כל הדגמים; ניתן לבחור מהרשימה המהירה.
                    </p>
                    <select
                      value={selectedDrone}
                      onChange={(e) => setSelectedDrone(e.target.value)}
                      className={`${themeStyles.select} ${themeStyles.selectTone}`}
                    >
                      {Object.entries(AerialPlanner.config.DRONE_PRESETS).map(
                        ([k, v]) => (
                          <option key={k} value={k}>
                            {v.name} • {v.type}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                )}
              </div>

              {/* Sliders */}
              {hasOpticalZoom && opticalZoomLevels && (
                <div className={`${themeStyles.card} rounded-lg p-3 mb-2`}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>זום אופטי</span>
                    <span className={themeStyles.accent}>
                      {currentOpticalZoom}x · {activeFocalLength.toFixed(1)} מ"מ
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={opticalZoomLevels.length - 1}
                    step="1"
                    value={clampedOpticalZoomIndex}
                    onChange={(e) =>
                      setOpticalZoomIndex(Number(e.target.value))
                    }
                    className="w-full"
                  />
                  <div className={`flex justify-between text-[10px] ${themeStyles.subtleText} mt-1`}>
                    {opticalZoomLevels.map((level, idx) => (
                      <span
                        key={`${level}-${idx}`}
                        className={
                          idx === clampedOpticalZoomIndex
                            ? "text-blue-300 font-semibold"
                            : ""
                        }
                      >
                        {level}x
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>גובה (AGL)</span>
                  <span className="text-blue-400">{altitude}m</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  value={altitude}
                  onChange={(e) => setAltitude(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>מהירות טיסה</span>
                  <span className="text-blue-400">{speed} מ/ש</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="15"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>חפיפה קדמית</span>
                  <span className="text-blue-400">{overlapFront}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={overlapFront}
                  onChange={(e) => setOverlapFront(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>חפיפה צידית</span>
                  <span className="text-blue-400">{overlapSide}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={overlapSide}
                  onChange={(e) => setOverlapSide(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Azimuth Control */}
              <div className={`${themeStyles.card} p-2 rounded`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-xs font-bold flex items-center gap-1 ${themeStyles.subtleText}`}>
                    <Icon name="rotate" /> כיוון טיסה
                  </span>
                  <label className={`text-[10px] flex items-center gap-1 cursor-pointer ${themeStyles.subtleText}`}>
                    <input
                      type="checkbox"
                      checked={autoOrient}
                      onChange={(e) => setAutoOrient(e.target.checked)}
                    />{" "}
                    אוטומטי
                  </label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={azimuth}
                  disabled={autoOrient}
                  onChange={(e) => {
                    setAzimuth(Number(e.target.value));
                    setAutoOrient(false);
                  }}
                  className={`w-full ${autoOrient ? "opacity-50 cursor-not-allowed" : ""}`}
                />
              </div>
            </div>

            {/* DTM */}
            <div className={`pt-4 border-t ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`}>
              <div className={`${themeStyles.card} text-[11px] ${themeStyles.subtleText} rounded p-2 mb-2`}>
                בחירת המועד נעשית מלוח מזג האוויר בתחתית. בחר שעה רצויה בלוח כדי
                לחשב צל בהתאם.
              </div>
              <button
                onClick={fetchDTM}
                disabled={isFetchingDTM || polygon.length < 3}
                className="w-full btn-primary bg-blue-600 hover:bg-blue-500"
              >
                {isFetchingDTM ? "טוען גבהים..." : "טען DTM וחשב צל"}
              </button>
              {dtmStats && (
                <div
                  className={`mt-2 text-[10px] text-center p-2 rounded border ${isSimulatedDTM ? "bg-yellow-900/30 border-yellow-700 text-yellow-400" : "bg-green-900/30 border-green-700 text-green-400"}`}
                >
                  {isSimulatedDTM && (
                    <div className="flex justify-center items-center gap-1 mb-1 font-bold">
                      <Icon name="warning" /> סימולציית שטח (Offline Mode)
                    </div>
                  )}
                  גבהים: {dtmStats.min.toFixed(0)}m - {dtmStats.max.toFixed(0)}m
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM STATS BAR */}
          <div
            className={`p-3 flex flex-col gap-2 ${
              theme === "dark"
                ? "bg-slate-800 border-t border-slate-700"
                : "bg-slate-50 border-t border-slate-200"
            }`}
          >
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setPolygon([]);
                  setDtmData(null);
                  setTotalDistance(0);
                }}
                className="bg-red-600 text-white px-3 py-2 rounded-lg shadow hover:bg-red-700 flex items-center gap-2 text-xs font-semibold"
                aria-label="איפוס תכנון"
              >
                <Icon name="trash" />
                איפוס
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center">
              <div className={`${themeStyles.subtlePanel} p-1 rounded border ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`}>
                <div className={`text-[9px] ${themeStyles.subtleText}`}>מרחק</div>
                <div className="font-bold text-sm">{stats.dist}m</div>
              </div>
              <div className={`${themeStyles.subtlePanel} p-1 rounded border ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`}>
                <div className={`text-[9px] ${themeStyles.subtleText}`}>זמן (דקות)</div>
                <div className={`font-bold text-sm ${themeStyles.accent}`}>
                  <Icon name="clock" size={10} className="inline mr-1" />
                  {stats.time}
                </div>
              </div>
              <div className={`${themeStyles.subtlePanel} p-1 rounded border ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`}>
                <div className={`text-[9px] ${themeStyles.subtleText}`}>תמונות</div>
                <div className={`font-bold text-sm ${themeStyles.accent}`}>
                  <Icon name="camera" size={10} className="inline mr-1" />
                  {stats.images}
                </div>
              </div>
              <div className={`${themeStyles.subtlePanel} p-1 rounded border ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`}>
                <div className={`text-[9px] ${themeStyles.subtleText}`}>GSD</div>
                <div className="font-bold text-sm">{stats.gsd}</div>
              </div>
              <div className={`${themeStyles.subtlePanel} p-1 rounded border ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`}>
                <div className={`text-[9px] ${themeStyles.subtleText}`}>שטח כיסוי</div>
                <div className={`font-bold text-sm ${themeStyles.accent}`}>
                  {stats.coverageKm2} קמ"ר
                </div>
              </div>
            </div>
          </div>
        </Sidebar>
        )}

        {/* Map */}
        {showPlannerLayout && (
        <MapView
          className="flex-1 relative h-full bg-black box-border"
          style={{ paddingBottom: mapBottomPadding }}
        >
          <div id="map"></div>
          {locationMessage && (
            <div className="absolute bottom-28 left-6 z-[930] bg-white/95 text-slate-800 px-4 py-2 rounded-full shadow-lg border border-slate-200 text-xs pointer-events-none">
              {locationMessage}
            </div>
          )}
          <div
            className="absolute left-6 z-[930] pointer-events-auto flex flex-col items-start gap-2"
            style={geolocateButtonStyle}
          >
            <button
              onClick={recenterOnUser}
              className="w-12 h-12 rounded-full bg-white/95 text-slate-800 shadow-lg border border-slate-200 flex items-center justify-center hover:-translate-y-0.5 hover:shadow-xl transition"
              aria-label="מרכז למיקום הנוכחי"
            >
              <Icon name="gps" size={18} />
            </button>
          </div>
          {ENABLE_MISSION_PLANNING && polygon?.length === 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-xs pointer-events-none z-[900]">
              לחץ במפה לסימון
            </div>
          )}

          {/* Docked controls aligned to the right */}
          <div
            className={`absolute top-4 z-[940] ${dockPositionClasses}`}
            style={dockPositionStyle}
          >
            <div
              className={`pointer-events-auto ${
                isMobile
                  ? "flex flex-row items-start gap-3 w-full"
                  : "flex flex-row items-start gap-3"
              }`}
            >
              <div
                className={`${
                  isMobile
                    ? "flex flex-col-reverse gap-2 items-end w-full"
                    : "flex flex-col items-start gap-3"
                }`}
              >
                {ENABLE_DOCUMENTATION && documentationOpen && (
                <div
                  className="bg-white/95 backdrop-blur rounded-2xl border border-blue-200 shadow-2xl text-right text-slate-800 p-3 space-y-3 pointer-events-auto z-[920]"
                  style={{ width: plannerPanelWidth }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-black text-blue-800">
                      <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center">
                        <Icon name="doc" size={16} />
                      </span>
                      כרטיסיית תיעוד
                    </div>
                    <button
                      onClick={() => setDocumentationOpen(false)}
                      className="text-blue-700 hover:text-blue-900"
                      aria-label="סגור כרטיסיית תיעוד"
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                  <div
                    className={`flex flex-col gap-2 rounded-lg border px-3 py-2 text-[11px] ${
                      theme === "dark"
                        ? "bg-slate-900 text-blue-100 border-slate-700"
                        : "bg-blue-50 text-blue-800 border-blue-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">מצב שמירת התיעוד</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] ${
                          docStorageMode === "local"
                            ? "bg-green-100 text-green-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {docStorageMode === "local" ? "שמירה מקומית" : "סשן בלבד"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="leading-relaxed">
                        {docStorageMode === "local"
                          ? "האובייקטים נשמרים במכשיר וממשיכים להיות זמינים גם אחרי רענון."
                          : "האובייקטים נשמרים בסשן הנוכחי בלבד ויימחקו בעת סגירת הטאב."}
                      </p>
                      <label
                        className={`flex items-center gap-2 text-[11px] font-semibold px-2 py-1 rounded cursor-pointer ${
                          theme === "dark"
                            ? "bg-slate-800 text-blue-100 border border-slate-700"
                            : "bg-white text-blue-800 border border-blue-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={docStorageMode === "local"}
                          onChange={(e) =>
                            setDocStorageMode(e.target.checked ? "local" : "session")
                          }
                        />
                        שמור מקומית במכשיר
                      </label>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                    <div className="grid grid-cols-1 gap-2">
                      <input
                        type="text"
                        value={docForm.title}
                        onChange={(e) =>
                          setDocForm((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        placeholder="שם האובייקט"
                        className="w-full rounded-lg border border-blue-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <textarea
                        rows="3"
                        value={docForm.notes}
                        onChange={(e) =>
                          setDocForm((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        placeholder="מלל חופשי, הערות ודגשים"
                        className="w-full rounded-lg border border-blue-200 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex flex-col gap-2 text-[12px] text-blue-900">
                      <div className="flex items-center justify-between gap-2">
                        <label
                          className={`flex items-center gap-2 text-[11px] font-semibold px-2 py-1 rounded ${
                            theme === "dark"
                              ? "bg-slate-900 text-blue-100 border border-slate-700"
                              : "bg-white text-blue-800 border border-blue-200"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={docLocationAllowed}
                            onChange={(e) => {
                              const nextValue = e.target.checked;
                              setDocLocationAllowed(nextValue);
                              if (!nextValue) {
                                setDocForm((prev) => ({ ...prev, location: null }));
                              }
                            }}
                          />
                          שמור מיקום באובייקט
                        </label>
                        <button
                          onClick={sampleDocumentationLocation}
                          disabled={!docLocationAllowed}
                          className={`px-2 py-1 text-[11px] rounded flex items-center gap-1 ${
                            docLocationAllowed
                              ? "bg-blue-600 text-white hover:bg-blue-500"
                              : "bg-blue-100 text-blue-500 cursor-not-allowed"
                          }`}
                        >
                          <Icon name="gps" size={12} /> דגום
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 rounded-full px-2 py-1 flex items-center gap-1">
                          <Icon name="gps" size={12} /> מיקום
                        </span>
                        {docForm.location ? (
                          <span className="text-[11px] text-blue-700">
                            {docForm.location.lat.toFixed(5)},{" "}
                            {docForm.location.lng.toFixed(5)} (
                            {docForm.location.accuracy
                              ? `±${Math.round(docForm.location.accuracy)}מ'`
                              : "ללא דיוק"}
                            )
                          </span>
                        ) : (
                          <span className="text-[11px] text-blue-700">
                            שמירת מיקום כבויה, נתונים לא יאוחסנו
                          </span>
                        )}
                      </div>

                      <label
                        className={`flex items-center justify-between gap-2 cursor-pointer text-[11px] rounded-lg px-3 py-2 border hover:border-blue-400 ${
                          theme === "dark"
                            ? "text-blue-100 bg-slate-900 border-slate-700"
                            : "text-blue-800 bg-white border-blue-200"
                        }`}
                      >
                        <span className="flex items-center gap-2 font-semibold">
                          <Icon name="upload" size={14} /> העלאת תמונות
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleDocFileChange}
                        />
                        <span className="text-[10px] text-blue-700">
                          {docForm.images.length} נבחרו
                        </span>
                      </label>
                    </div>

                    <button
                        onClick={addDocumentationEntry}
                        className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-blue-500 flex items-center justify-center gap-2"
                      >
                        <Icon name="mission" size={16} /> שמור אובייקט
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={exportDocumentationPDF}
                        className={`flex-1 rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-2 ${
                          theme === "dark"
                            ? "bg-slate-900 text-white hover:bg-slate-800"
                            : "bg-blue-600 text-white hover:bg-blue-500"
                        }`}
                      >
                        <Icon name="export" size={16} /> PDF
                      </button>
                      <button
                        onClick={exportDocumentationShapefile}
                        className={`flex-1 rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-2 ${
                          theme === "dark"
                            ? "bg-slate-800 text-white border border-slate-600 hover:bg-slate-700"
                            : "bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        <Icon name="map" size={16} /> Shapefile
                      </button>
                      <button
                        onClick={clearDocumentationEntries}
                        className={`flex-1 rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-2 ${
                          theme === "dark"
                            ? "bg-slate-800 text-red-200 border border-slate-600 hover:bg-slate-700"
                            : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                        }`}
                      >
                        <Icon name="trash" size={16} /> נקה תיעוד מקומי
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={downloadDocumentationProject}
                        className={`flex-1 rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-2 ${
                          theme === "dark"
                            ? "bg-slate-900 text-white border border-slate-700 hover:bg-slate-800"
                            : "bg-white text-blue-800 border border-blue-200 hover:bg-blue-50"
                        }`}
                      >
                        <Icon name="export" size={16} /> הורד קובץ פרויקט
                      </button>
                      <button
                        onClick={shareDocumentationProject}
                        className={`flex-1 rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-2 ${
                          theme === "dark"
                            ? "bg-blue-800 text-white hover:bg-blue-700"
                            : "bg-green-100 text-green-800 border border-green-200 hover:bg-green-50"
                        }`}
                      >
                        <Icon name="upload" size={16} /> שיתוף וואטסאפ/שיתוף מכשיר
                      </button>
                    </div>

                    <div
                      className={`text-[11px] rounded-lg border p-2 ${
                        theme === "dark"
                          ? "bg-slate-900/60 text-slate-200 border-slate-700"
                          : "bg-white text-slate-700 border-blue-200"
                      }`}
                    >
                      נתוני התיעוד נשמרים אוטומטית בהתאם למצב שנבחר למעלה. שמירת מיקום נשמרת רק אם הפיצ'ר פעיל וניתן לניקוי בכל
                      עת. ניתן גם להוריד קובץ פרויקט או לשתף מידית בוואטסאפ.
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto custom-scroll">
                      {docEntries.length === 0 ? (
                        <div
                          className={`text-[11px] border border-dashed rounded-lg p-3 text-center ${
                            theme === "dark"
                              ? "text-slate-300 border-slate-600"
                              : "text-slate-500 border-slate-300"
                          }`}
                        >
                          אין אובייקטים מתועדים עדיין. שמור אובייקט כדי להתחיל.
                        </div>
                      ) : (
                        docEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className={`rounded-lg p-3 space-y-1 border ${
                              theme === "dark"
                                ? "border-slate-700 bg-slate-800"
                                : "border-slate-200 bg-white/80"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div
                                  className={`font-bold text-sm ${
                                    theme === "dark" ? "text-white" : "text-slate-900"
                                  }`}
                                >
                                  {entry.title || "ללא כותרת"}
                                </div>
                                <div
                                  className={`text-[10px] ${
                                    theme === "dark" ? "text-slate-300" : "text-slate-500"
                                  }`}
                                >
                                  {new Date(entry.timestamp).toLocaleString(
                                    "he-IL",
                                  )}
                                </div>
                              </div>
                              {entry.location && (
                                <div
                                  className={`text-[10px] rounded px-2 py-1 ${
                                    theme === "dark"
                                      ? "text-blue-200 bg-blue-900/30 border border-blue-700"
                                      : "text-blue-800 bg-blue-50 border border-blue-200"
                                  }`}
                                >
                                  {entry.location.lat.toFixed(4)},{" "}
                                  {entry.location.lng.toFixed(4)}
                                </div>
                              )}
                            </div>
                            {entry.notes && (
                              <p
                                className={`text-[12px] leading-relaxed ${
                                  theme === "dark" ? "text-slate-200" : "text-slate-700"
                                }`}
                              >
                                {entry.notes}
                              </p>
                            )}
                            {entry.images?.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-1">
                                {entry.images.map((img, idx) => (
                                  <img
                                    key={idx}
                                    src={img.dataUrl}
                                    alt={img.name || "תמונה"}
                                    className="w-16 h-16 object-cover rounded"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {ENABLE_REALTIME_PANEL && (
                  <RealtimePanel
                    open={realtimePanelOpen}
                    rainRadarEnabled={rainRadarEnabled}
                    onToggleRainRadar={() =>
                      setRainRadarEnabled((prev) => !prev)
                    }
                    rainRadarStatus={rainRadarStatus}
                    rainRadarUnavailable={rainRadarUnavailable}
                    rainRadarTimestamp={rainRadarTimestamp}
                    onRefreshRainRadar={refreshRainRadar}
                    aircraftEnabled={aircraftEnabled}
                    onToggleAircraft={() => setAircraftEnabled((prev) => !prev)}
                    aircraftStatus={aircraftStatus}
                    aircraftUnavailable={aircraftUnavailable}
                    aircraftTimestamp={aircraftTimestamp}
                    aircraftRangeKm={aircraftRangeKm}
                    aircraftData={aircraftData}
                    onRangeChange={setAircraftRangeKm}
                    panelRef={realtimePanelRef}
                    panelWidth={plannerPanelWidth}
                  />
                )}

                {timelineBoard}
              </div>

                <div className="flex flex-col items-start gap-2">
                  {ENABLE_MISSION_PLANNING && (
                    <DockButton
                      icon="mission"
                      label="תוכנית טיסה"
                      active={sidebarOpen}
                      onClick={() => toggleExclusivePanel("sidebar")}
                    />
                  )}
                  {ENABLE_REALTIME_PANEL && (
                    <DockButton
                      icon="radar"
                      label="זמן אמת"
                      active={realtimePanelOpen}
                      onClick={() => toggleExclusivePanel("realtime")}
                    />
                  )}
                  <DockButton
                    icon="calendar"
                    label="לוח מזג אוויר"
                    active={showTimeline}
                    onClick={() => toggleExclusivePanel("timeline")}
                  />
                  {ENABLE_DOCUMENTATION && (
                    <DockButton
                      icon="doc"
                      label="כרטיסיית תיעוד"
                      active={documentationOpen}
                      onClick={toggleDocumentation}
                    />
                  )}
                </div>
              </div>
            </div>
            
        {/* Heatmap Legend */}
        {dtmData && (
          <div className="absolute bottom-6 left-6 z-[900] bg-white/90 p-2 rounded text-xs shadow-lg text-slate-900">
            <div className="font-bold mb-1">גבהים</div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div> גבוה
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div> נמוך
              </div>
              <div className="flex items-center gap-1 mt-1 border-t pt-1">
                <div className="w-4 h-1 bg-black/60"></div> צל
              </div>
            </div>
          )}
        </MapView>
        )}
      </div>
      )}
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
