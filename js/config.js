// Configuration and constants for Aerial Planner
window.AerialPlannerConfig = {
    DRONE_PRESETS: window.DRONE_PRESETS || {},
    DEFAULT_MAP_CENTER: [32.0853, 34.7818],
    DEFAULT_SUITABILITY: {
        maxWind: 12,
        maxGust: 18,
        maxCloudCover: 70,
        maxRainProb: 20,
        minSunAltitude: 5,
        maxSunAltitude: 85,
    },
    helpers: {
        windSpeedToColor: (speed) => {
            if (speed === null || speed === undefined || Number.isNaN(speed)) return '#cbd5e1';
            const clamped = Math.max(0, Math.min(speed, 25));
            const hue = 240 - (clamped / 25) * 240;
            return `hsl(${hue}, 85%, 55%)`;
        },
        windTextColor: (speed) => {
            if (speed === null || speed === undefined || Number.isNaN(speed)) return 'text-slate-800';
            return speed >= 18 ? 'text-white' : 'text-slate-800';
        }
    },
    geometry: {
        getDistance: (p1, p2) => {
            const R = 6371e3;
            const phi1 = p1.lat * Math.PI / 180;
            const phi2 = p2.lat * Math.PI / 180;
            const deltaPhi = (p2.lat - p1.lat) * Math.PI / 180;
            const deltaLambda = (p2.lng - p1.lng) * Math.PI / 180;
            const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        },
        getBearing: (p1, p2) => {
            const phi1 = p1.lat * Math.PI / 180;
            const phi2 = p2.lat * Math.PI / 180;
            const deltaLambda = (p2.lng - p1.lng) * Math.PI / 180;
            const y = Math.sin(deltaLambda) * Math.cos(phi2);
            const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
            return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
        },
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
        rotatePoint: (point, angleDeg, center) => {
            const angleRad = angleDeg * (Math.PI / 180);
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);
            const dx = point.lng - center.lng;
            const dy = point.lat - center.lat;
            return {
                lat: center.lat + (dx * sin + dy * cos),
                lng: center.lng + (dx * cos - dy * sin)
            };
        },
        unrotatePoint: (point, angleDeg, center) => {
            return window.AerialPlannerConfig.geometry.rotatePoint(point, -angleDeg, center);
        }
    }
};
