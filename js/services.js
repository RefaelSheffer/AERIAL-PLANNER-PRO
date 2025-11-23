// External API helpers for Aerial Planner
const Config = window.AerialPlannerConfig;

const fetchWeather = async (location) => {
    if (!location) return null;
    const [lat, lng] = location;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,cloud_cover,wind_speed_10m,wind_gusts_10m,precipitation_probability&timezone=auto&forecast_days=7`;
    const res = await fetch(url);
    const data = await res.json();
    return data?.hourly || null;
};

const fetchRainRadar = async (map, layersRef, rainRadarTimestampRef) => {
    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    const data = await res.json();
    const frames = data?.radar?.past;
    if (!frames || frames.length === 0) throw new Error('No radar frames');
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
            attribution: 'RainViewer',
            opacity: 0.6,
            crossOrigin: true,
            maxZoom: 18,
        }
    );
    radarLayer.addTo(map);
    Lr.rainRadar = radarLayer;
    rainRadarTimestampRef.current = ts;
    return { timestamp: ts };
};

const fetchAircraft = async (center, rangeKm) => {
    if (!center) return [];
    const [lat, lng] = center;
    const url = `https://public-api.adsbexchange.com/VirtualRadar/AircraftList.json?lat=${lat}&lng=${lng}&fDstL=0&fDstU=${Math.max(5, rangeKm)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data?.acList) throw new Error('No aircraft list');
    return data.acList.filter(a => a?.Lat && a?.Long);
};

const fetchDTM = async (polygon) => {
    if (!polygon || polygon.length < 3) throw new Error('Polygon required');
    const latLngs = polygon.map(p => L.latLng(p.lat, p.lng));
    const bounds = L.latLngBounds(latLngs);
    const sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
    const rows = 20, cols = 20;
    const locations = [];
    for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
            locations.push({
                lat: sw.lat + (ne.lat - sw.lat) * (r / rows),
                lng: sw.lng + (ne.lng - sw.lng) * (c / cols)
            });
        }
    }

    const fetchWithTimeout = (url) => {
        const fetchPromise = fetch(url);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000));
        return Promise.race([fetchPromise, timeoutPromise]);
    };

    try {
        const batchSize = 100;
        const batches = [];
        for (let i = 0; i < locations.length; i += batchSize) {
            batches.push(locations.slice(i, i + batchSize));
        }

        const allResults = [];
        for (const batch of batches) {
            const locStr = batch.map(p => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join('|');
            const url = `https://api.opentopodata.org/v1/aster30m?locations=${locStr}`;
            const res = await fetchWithTimeout(url);
            if (!res.ok) throw new Error(`API Error ${res.status}`);
            const data = await res.json();
            if (!data.results) throw new Error('Invalid response');
            allResults.push(...data.results);
        }

        if (allResults.length === 0) throw new Error('Empty DTM response');
        return {
            grid: allResults.map(r => ({ lat: r.location.lat, lng: r.location.lng, ele: r.elevation || 0 })),
            simulated: false
        };
    } catch (e) {
        console.warn('DTM API Failed, switching to simulation.', e);
        const simGrid = locations.map(loc => {
            const baseEle = 100;
            const noise = Math.sin(loc.lat * 1000) * Math.cos(loc.lng * 1000) * 20;
            return { lat: loc.lat, lng: loc.lng, ele: baseEle + noise };
        });
        return { grid: simGrid, simulated: true };
    }
};

window.AerialPlannerServices = { fetchWeather, fetchRainRadar, fetchAircraft, fetchDTM };
