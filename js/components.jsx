// components.jsx
// Defines presentational React components (layout, sidebar, timeline board, realtime panel, shared controls).
// Exposes AerialPlannerComponents on window as UI building blocks consumed by main.jsx.
(function () {
  "use strict";

// Icon library for UI elements
const Icon = ({
  name,
  size = 16,
  className = "",
  strokeWidth = 2,
  color = "currentColor",
}) => {
  const baseProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
  };

  const icons = {
    map: (
      <svg {...baseProps}>
        <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    mountain: (
      <svg {...baseProps}>
        <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    wind: (
      <svg {...baseProps}>
        <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    ),
    cloud: (
      <svg {...baseProps}>
        <path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
    gps: (
      <svg {...baseProps}>
        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    trash: (
      <svg {...baseProps}>
        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    close: (
      <svg {...baseProps}>
        <path d="M6 6l12 12M6 18L18 6" />
      </svg>
    ),
    rotate: (
      <svg {...baseProps}>
        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    camera: (
      <svg {...baseProps}>
        <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    clock: (
      <svg {...baseProps}>
        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg {...baseProps}>
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    drone: (
      <svg {...baseProps}>
        <path d="M8 4H5a2 2 0 00-2 2v3m16-5h-3m3 0a2 2 0 012 2v3m-5 8h3a2 2 0 002-2v-3M4 16v3a2 2 0 002 2h3M9 9l1-1h4l1 1m-6 0l-1 2.5M15 9l1 2.5M10 12h4m-2 0v2" />
      </svg>
    ),
    mission: (
      <svg {...baseProps}>
        <path d="M4 17l4-4 4 4 6-6" />
        <path d="M3 5h4v4H3zM9 9h4v4H9zM16 4h5v5h-5z" />
      </svg>
    ),
    radar: (
      <svg {...baseProps}>
        <path d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
        <path d="M12 12l6-6" />
        <path d="M12 3v4" />
        <path d="M12 12h7" />
      </svg>
    ),
    calendar: (
      <svg {...baseProps}>
        <path d="M8 7V3m8 4V3m-9 8h8M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    doc: (
      <svg {...baseProps}>
        <path d="M7 7a2 2 0 012-2h5l4 4v9a2 2 0 01-2 2H9a2 2 0 01-2-2V7z" />
        <path d="M14 3v4h4" />
      </svg>
    ),
    upload: (
      <svg {...baseProps}>
        <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
        <path d="M7 9l5-5 5 5M12 4v12" />
      </svg>
    ),
    export: (
      <svg {...baseProps}>
        <path d="M9 14l-6 6m0 0h7m-7 0v-7" />
        <path d="M15 10h6m0 0V4m0 6l-9 9" />
      </svg>
    ),
  };

  return icons[name] || null;
};

// Floating dock button used across panels
const DockButton = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    aria-label={label}
    className={`bg-white/95 text-slate-800 rounded-full shadow-lg border transition hover:-translate-y-0.5 hover:shadow-xl p-1 ${active ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"}`}
  >
    <span
      className={`w-12 h-12 rounded-full flex items-center justify-center ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
    >
      <Icon name={icon} size={18} />
    </span>
    <span className="sr-only">{label}</span>
  </button>
);

// Planning sidebar wrapper
const Sidebar = ({ open, className = "", children }) => {
  if (!open) return null;
  return <aside className={className}>{children}</aside>;
};

// Map view container
const MapView = ({ className = "", children }) => (
  <div className={className}>{children}</div>
);

// Weather timeline board
const TimelineBoard = ({
  show,
  isMobile,
  windTimeline,
  visibleTimeline,
  dataUnavailable = false,
  showFlyableOnly,
  selectedSlotKey,
  onSlotSelect,
  onScroll,
  timelineContainerRef,
  mobileDayIndex,
  onMobileDayChange,
  isSlotFlyable,
  windTextColor,
  windSpeedToColor,
}) => {
  if (!show) return null;

  const preparedTimeline = React.useMemo(() => {
    return visibleTimeline.map((day) => {
      let flyableCount = 0;
      let firstFlyable = null;
      const displaySlots = [];

      const enrichedSlots = day.slots.map((slot) => {
        const slotWithFlag = { ...slot, isFlyable: isSlotFlyable(slot) };
        if (slotWithFlag.isFlyable) {
          flyableCount += 1;
          if (!firstFlyable) firstFlyable = slotWithFlag;
        }

        if (!showFlyableOnly || slotWithFlag.isFlyable) {
          displaySlots.push(slotWithFlag);
        }

        return slotWithFlag;
      });

      return {
        ...day,
        enrichedSlots,
        displaySlots,
        flyableCount,
        firstFlyable,
      };
    });
  }, [visibleTimeline, showFlyableOnly, isSlotFlyable]);

  const timelineEmpty = preparedTimeline.length === 0;

  const timelineCardSizing = isMobile
    ? "w-[45vw] max-w-[420px] max-h-[92vh]"
    : "w-[95vw] max-w-5xl max-h-[55vh] mx-auto";

  return (
    <div
      className={`bg-white/95 border border-slate-200 shadow-2xl rounded-2xl ${timelineCardSizing}`}
    >
      {dataUnavailable && (
        <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-t-2xl px-3 py-2 text-center">
          מקור הנתונים לא זמין כרגע
        </div>
      )}
      {timelineEmpty && (
        <div className="p-4 text-center text-sm text-slate-600">
          אין נתוני תחזית זמינים כרגע.
        </div>
      )}
      {isMobile && windTimeline.length > 1 && (
        <div className="flex items-center justify-between px-3 pt-2 pb-1 text-[12px] text-slate-700">
          <button
            className="px-2 py-1 rounded border border-slate-200 bg-white disabled:opacity-40"
            onClick={() => onMobileDayChange(-1)}
            disabled={mobileDayIndex === 0}
          >
            יום קודם
          </button>
          <div className="font-semibold text-slate-800">
            {visibleTimeline[0]?.label}
          </div>
          <button
            className="px-2 py-1 rounded border border-slate-200 bg-white disabled:opacity-40"
            onClick={() => onMobileDayChange(1)}
            disabled={mobileDayIndex >= windTimeline.length - 1}
          >
            יום הבא
          </button>
        </div>
      )}
      <div className="relative">
        {!isMobile && windTimeline.length > 1 && (
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
            <button
              onClick={() => onScroll(-1)}
              className="pointer-events-auto rounded-full bg-white/90 border border-slate-200 shadow-lg p-2 text-slate-700 hover:bg-slate-50"
              aria-label="הזז שמאלה"
            >
              ‹
            </button>
            <button
              onClick={() => onScroll(1)}
              className="pointer-events-auto rounded-full bg-white/90 border border-slate-200 shadow-lg p-2 text-slate-700 hover:bg-slate-50"
              aria-label="הזז ימינה"
            >
              ›
            </button>
          </div>
        )}
        <div
          ref={timelineContainerRef}
          className={`${isMobile ? "overflow-y-auto" : "overflow-x-auto"} custom-scroll snap-x snap-mandatory`}
        >
          <div
            className={`${isMobile ? "flex flex-col gap-2 p-3" : "flex gap-3 p-4 min-w-full"}`}
          >
            {preparedTimeline.map((day) => (
              <div
                key={day.day}
                className={`${isMobile ? "w-full" : "min-w-[300px] max-w-[340px]"} snap-start bg-white border border-slate-200 rounded-xl shadow-sm p-3 flex flex-col gap-2`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">
                      {day.label}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {day.slots.length} חלונות זמן · {day.flyableCount} שעות
                      יציבות
                    </div>
                    {day.firstFlyable && (
                      <div className="text-[10px] text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 inline-flex items-center gap-1 mt-1">
                        <Icon name="clock" size={11} /> החל מ-
                        {day.firstFlyable.time}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end text-[10px] text-slate-600">
                    <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200 font-semibold">
                      {day.day}
                    </span>
                    <span className="mt-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      מרווח 6 שעות
                    </span>
                  </div>
                </div>
                <div
                  className={`grid ${isMobile ? "grid-cols-2 gap-1.5" : "grid-cols-3 gap-2"}`}
                >
                  {!timelineEmpty && day.displaySlots.length > 0 ? (
                    day.displaySlots.map((slot) => {
                      const slotKey = `${day.day}T${slot.time}`;
                      const isActive = slotKey === selectedSlotKey;
                      return (
                        <button
                          key={slot.key}
                          onClick={() => onSlotSelect(`${day.day}T${slot.time}`)}
                          className={`${isMobile ? "p-2 flex flex-col gap-1.5 text-[12px]" : "p-2 flex flex-col gap-2 text-[12px]"} w-full h-full min-h-[120px] rounded-lg border transition shadow-sm hover:-translate-y-0.5 relative ${isActive ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200 hover:border-blue-300"}`}
                          style={{ background: "white" }}
                        >
                          {slot.isFlyable && (
                            <div className="absolute top-1 left-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800 border border-green-200 shadow-sm">
                              שעה יציבה
                            </div>
                          )}
                          <div
                            className={`${isMobile ? "flex items-center justify-between w-full text-[12px]" : "items-center justify-between text-xs"} text-slate-600`}
                          >
                            <span className="font-semibold">{slot.time}</span>
                            {!isMobile && (
                              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                <Icon name="clock" size={12} /> {day.label}
                              </span>
                            )}
                          </div>
                          <div
                            className={`${isMobile ? "h-9 w-full text-[13px]" : "h-9 w-full text-[12px]"} rounded-md flex items-center justify-center font-bold ${windTextColor(slot.wind)}`}
                            style={{
                              background: windSpeedToColor(slot.wind),
                            }}
                          >
                            {slot.wind?.toFixed(1) ?? "-"} מ"ש
                            {!isMobile && slot.isMajor && (
                              <span className="absolute top-1 right-1 text-[9px] text-slate-100 bg-slate-900/50 px-2 py-0.5 rounded-full">
                                מרווח 12ש'
                              </span>
                            )}
                          </div>
                          <div
                            className={`${isMobile ? "w-full space-y-0.5" : "w-full px-1.5 pb-1 space-y-1"}`}
                          >
                            <div
                              className={`h-1.5 w-full rounded-full overflow-hidden ${slot.isFlyable ? "bg-green-100" : "bg-slate-200"}`}
                            >
                              <div
                                className="h-full bg-blue-500"
                                style={{ width: `${slot.clouds ?? 0}%` }}
                              ></div>
                            </div>
                            <div
                              className={`${isMobile ? "text-[10px] text-slate-600 grid grid-cols-2 gap-1" : "text-[10px] text-slate-600 flex flex-wrap gap-1 justify-center"}`}
                            >
                              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-center">
                                עננות {slot.clouds ?? 0}%
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded-full border text-center ${slot.isFlyable ? "bg-green-50 text-green-700 border-green-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}
                              >
                                גשם {slot.rainProb ?? 0}%
                              </span>
                              <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-center">
                                משבים{" "}
                                {slot.gust?.toFixed(1) ??
                                  slot.wind?.toFixed(1) ??
                                  "-"}{" "}
                                מ"ש
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-[11px] text-slate-500 p-2 border border-dashed border-slate-300 rounded w-full text-center col-span-full">
                      אין שעות מתאימות לטיסה ביום זה
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Realtime data controls (rain radar + aircraft)
const RealtimePanel = ({
  open,
  rainRadarEnabled,
  onToggleRainRadar,
  rainRadarStatus,
  rainRadarUnavailable,
  rainRadarTimestamp,
  onRefreshRainRadar,
  aircraftEnabled,
  onToggleAircraft,
  aircraftStatus,
  aircraftUnavailable,
  aircraftTimestamp,
  aircraftRangeKm,
  aircraftData,
  onRangeChange,
}) => {
  if (!open) return null;

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-amber-50 to-white text-slate-900 flex flex-col p-4 gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-amber-700 font-bold">
            זמן אמת
          </div>
          <h2 className="text-xl font-black text-slate-900">
            מקם גשם ומיקומי מטוסים
          </h2>
          <p className="text-sm text-slate-600">
            הפעלת מקורות נתוני זמן אמת על שכבת המפה.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-600">
          {rainRadarStatus === "loading" && <span>מקם טוען...</span>}
          {rainRadarStatus === "error" && (
            <span className="text-red-600">מקם לא זמין</span>
          )}
          {(rainRadarUnavailable || rainRadarStatus === "unavailable") && (
            <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
              מקור הנתונים לא זמין כרגע
            </span>
          )}
          {rainRadarTimestamp && (
            <span>
              עודכן:{" "}
              {new Date(rainRadarTimestamp * 1000).toLocaleTimeString("he-IL")}
            </span>
          )}
          <button
            onClick={onRefreshRainRadar}
            className="px-3 py-1 bg-amber-600 text-white rounded-full text-xs font-semibold hover:bg-amber-500"
          >
            רענן שכבת גשם
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border border-amber-200 rounded-2xl bg-white/90 p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <Icon name="radar" size={18} />
              </span>
              <div>
                <div className="font-bold text-slate-900">מקם גשם</div>
                <div className="text-[11px] text-amber-800/80">
                  RainViewer API · מתעדכן כל 5 דק'
                </div>
              </div>
            </div>
            <span
              className={`text-[11px] font-semibold ${rainRadarEnabled ? "text-amber-700" : "text-slate-400"}`}
            >
              {rainRadarEnabled ? "מוצג" : "מוסתר"}
            </span>
          </div>
          <button
            onClick={onToggleRainRadar}
            className={`w-full flex items-center justify-between text-sm rounded-xl border px-3 py-2 transition ${rainRadarEnabled ? "bg-amber-600 text-white border-amber-600 shadow-inner" : "bg-white text-amber-800 border-amber-200 hover:bg-amber-50/80"}`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center ${rainRadarEnabled ? "bg-white/20" : "bg-amber-100 text-amber-700"}`}
              >
                <Icon name="cloud" size={16} />
              </span>
              <div className="flex flex-col text-right">
                <span className="font-bold">
                  {rainRadarEnabled ? "הסתר שכבת גשם" : "הצג שכבת גשם"}
                </span>
                <span className="text-[10px] text-amber-800/80">
                  שמירת ההגדרה נשמרת כל עוד העמוד פתוח
                </span>
              </div>
            </div>
            <span
              className={`text-[11px] font-semibold ${rainRadarEnabled ? "text-white" : "text-amber-700"}`}
            >
              {rainRadarEnabled ? "פעיל" : "כבוי"}
            </span>
          </button>
          {rainRadarUnavailable && (
            <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-2">
              מקור הנתונים לא זמין כרגע
            </div>
          )}
        </div>

        <div className="border border-amber-200 rounded-2xl bg-white/90 p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <Icon name="drone" size={18} />
              </span>
              <div>
                <div className="font-bold text-slate-900">מטוסים בסביבה</div>
                <div className="text-[11px] text-amber-800/80">
                  ADSBExchange · רענון כל 15 שניות
                </div>
              </div>
            </div>
            <span
              className={`text-[11px] font-semibold ${aircraftEnabled ? "text-amber-700" : "text-slate-400"}`}
            >
              {aircraftEnabled ? "מוצג" : "מוסתר"}
            </span>
          </div>
          <div className="space-y-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
            <button
              onClick={onToggleAircraft}
              className={`w-full flex items-center justify-between text-sm rounded-xl border px-3 py-1.5 transition ${aircraftEnabled ? "bg-amber-600 text-white border-amber-600 shadow-inner" : "bg-white text-amber-800 border-amber-200 hover:bg-amber-100/70"}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${aircraftEnabled ? "bg-white/20" : "bg-amber-100 text-amber-700"}`}
                >
                  <Icon name="drone" size={16} />
                </span>
                <div className="flex flex-col text-right">
                  <span className="font-bold">
                    {aircraftEnabled
                      ? "הסתר מיקומי מטוסים"
                      : "הצג מיקומי מטוסים"}
                  </span>
                  <span className="text-[10px] text-amber-800/80">
                    {aircraftTimestamp
                      ? `עודכן: ${new Date(aircraftTimestamp).toLocaleTimeString("he-IL")}`
                      : "עדכון אוטומטי כל 15 שניות"}
                  </span>
                </div>
              </div>
            <span
              className={`text-[11px] font-semibold ${aircraftEnabled ? "text-white" : "text-amber-700"}`}
            >
              {aircraftEnabled ? "פעיל" : "כבוי"}
            </span>
          </button>
          {(aircraftUnavailable || aircraftStatus === "error") && (
            <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-2">
              מקור הנתונים לא זמין כרגע
            </div>
          )}
          <div className="flex items-center justify-between text-[11px] text-amber-800">
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-700 rounded-full px-2 py-1 text-[10px]">
                {aircraftData.length} בטווח
                </span>
                <span className="text-[10px] text-amber-700">
                  טווח: {aircraftRangeKm} ק"מ
                </span>
              </div>
              <div className="flex gap-1 text-[10px] text-amber-700">
                {aircraftStatus === "loading" && <span>מתחבר...</span>}
                {aircraftStatus === "updating" && <span>מרענן...</span>}
                {aircraftStatus === "error" && (
                  <span className="text-red-600">שגיאה</span>
                )}
                {aircraftEnabled &&
                  aircraftData.length === 0 &&
                  aircraftStatus === "ready" && <span>אין מטוסים בטווח</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-amber-800">
              <input
                type="range"
                min="20"
                max="200"
                step="5"
                value={aircraftRangeKm}
                onChange={(e) => onRangeChange(Number(e.target.value))}
                className="flex-1 accent-amber-600"
                disabled={!aircraftEnabled}
              />
              <span className="text-[10px] text-amber-700">
                חיפוש סביב מרכז המפה
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapper for documentation content
const DocumentationPanel = ({ children }) => children;

// Floating dock container
const Dock = ({ children }) => (
  <div
    className="fixed md:bottom-6 bottom-4 flex flex-col gap-3 z-[1100]"
    style={{ right: "1rem" }}
  >
    {children}
  </div>
);

window.AerialPlannerComponents = {
  Sidebar,
  MapView,
  TimelineBoard,
  RealtimePanel,
  DocumentationPanel,
  Dock,
  Icon,
  DockButton,
};
})();
