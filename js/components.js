(function() {
  "use strict";
  const tr = (key, params) => window.AerialPlannerI18n ? window.AerialPlannerI18n.t(key, params) : key;
  const getDateLocale = () => window.AerialPlannerI18n ? window.AerialPlannerI18n.getDateLocale() : "he-IL";
  const Icon = ({
    name,
    size = 18,
    className = "",
    strokeWidth = 2,
    color = "currentColor"
  }) => {
    const baseProps = {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      xmlns: "http://www.w3.org/2000/svg",
      fill: "none",
      stroke: color,
      strokeWidth,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      focusable: "false",
      "aria-hidden": true
    };
    const icons = {
      map: /* @__PURE__ */ React.createElement("svg", { ...baseProps }, /* @__PURE__ */ React.createElement("path", { d: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" })),
      mountain: /* @__PURE__ */ React.createElement("svg", { ...baseProps }, /* @__PURE__ */ React.createElement("path", { d: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" })),
      wind: /* @__PURE__ */ React.createElement("svg", { ...baseProps }, /* @__PURE__ */ React.createElement("path", { d: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" }), /* @__PURE__ */ React.createElement("path", { d: "M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" })),
      cloud: /* @__PURE__ */ React.createElement("svg", { ...baseProps }, /* @__PURE__ */ React.createElement("path", { d: "M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" })),
      gps: /* @__PURE__ */ React.createElement("svg", { ...baseProps }, /* @__PURE__ */ React.createElement("path", { d: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" }), /* @__PURE__ */ React.createElement("path", { d: "M15 11a3 3 0 11-6 0 3 3 0 016 0z" })),
      trash: /* @__PURE__ */ React.createElement("svg", { ...baseProps }, /* @__PURE__ */ React.createElement("path", { d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" })),
      close: /* @__PURE__ */ React.createElement("svg", { ...baseProps }, /* @__PURE__ */ React.createElement("path", { d: "M6 6l12 12M6 18L18 6" })),
      rotate: /* @__PURE__ */ React.createElement("svg", { ...baseProps }, /* @__PURE__ */ React.createElement("path", { d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" })),
      camera: /* @__PURE__ */ React.createElement("svg", { ...baseProps }, /* @__PURE__ */ React.createElement("path", { d: "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" }), /* @__PURE__ */ React.createElement("path", { d: "M15 13a3 3 0 11-6 0 3 3 0 016 0z" })),
      clock: /* @__PURE__ */ React.createElement("svg", { ...baseProps }, /* @__PURE__ */ React.createElement("path", { d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" })),
      warning: /* @__PURE__ */ React.createElement("svg", { ...baseProps }, /* @__PURE__ */ React.createElement("path", { d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" })),
      drone: /* @__PURE__ */ React.createElement("svg", { ...baseProps }, /* @__PURE__ */ React.createElement("path", { d: "M8 4H5a2 2 0 00-2 2v3m16-5h-3m3 0a2 2 0 012 2v3m-5 8h3a2 2 0 002-2v-3M4 16v3a2 2 0 002 2h3M9 9l1-1h4l1 1m-6 0l-1 2.5M15 9l1 2.5M10 12h4m-2 0v2" })),
      mission: /* @__PURE__ */ React.createElement("svg", { ...baseProps }, /* @__PURE__ */ React.createElement("path", { d: "M4 17l4-4 4 4 6-6" }), /* @__PURE__ */ React.createElement("path", { d: "M3 5h4v4H3zM9 9h4v4H9zM16 4h5v5h-5z" })),
      radar: /* @__PURE__ */ React.createElement("svg", { ...baseProps }, /* @__PURE__ */ React.createElement("path", { d: "M12 21a9 9 0 100-18 9 9 0 000 18z" }), /* @__PURE__ */ React.createElement("path", { d: "M12 12l6-6" }), /* @__PURE__ */ React.createElement("path", { d: "M12 3v4" }), /* @__PURE__ */ React.createElement("path", { d: "M12 12h7" })),
      calendar: /* @__PURE__ */ React.createElement("svg", { ...baseProps }, /* @__PURE__ */ React.createElement("path", { d: "M8 7V3m8 4V3m-9 8h8M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" })),
      doc: /* @__PURE__ */ React.createElement("svg", { ...baseProps }, /* @__PURE__ */ React.createElement("path", { d: "M7 7a2 2 0 012-2h5l4 4v9a2 2 0 01-2 2H9a2 2 0 01-2-2V7z" }), /* @__PURE__ */ React.createElement("path", { d: "M14 3v4h4" })),
      upload: /* @__PURE__ */ React.createElement("svg", { ...baseProps }, /* @__PURE__ */ React.createElement("path", { d: "M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" }), /* @__PURE__ */ React.createElement("path", { d: "M7 9l5-5 5 5M12 4v12" })),
      "chevron-left": /* @__PURE__ */ React.createElement("svg", { ...baseProps }, /* @__PURE__ */ React.createElement("path", { d: "M15 18l-6-6 6-6" })),
      "chevron-right": /* @__PURE__ */ React.createElement("svg", { ...baseProps }, /* @__PURE__ */ React.createElement("path", { d: "M9 6l6 6-6 6" })),
      export: /* @__PURE__ */ React.createElement("svg", { ...baseProps }, /* @__PURE__ */ React.createElement("path", { d: "M9 14l-6 6m0 0h7m-7 0v-7" }), /* @__PURE__ */ React.createElement("path", { d: "M15 10h6m0 0V4m0 6l-9 9" })),
      settings: /* @__PURE__ */ React.createElement("svg", { ...baseProps }, /* @__PURE__ */ React.createElement("path", { d: "M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" }), /* @__PURE__ */ React.createElement("path", { d: "M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82 1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" })),
      info: /* @__PURE__ */ React.createElement("svg", { ...baseProps }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "16", x2: "12", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "8", x2: "12.01", y2: "8" })),
      bell: /* @__PURE__ */ React.createElement("svg", { ...baseProps }, /* @__PURE__ */ React.createElement("path", { d: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" }), /* @__PURE__ */ React.createElement("path", { d: "M13.73 21a2 2 0 01-3.46 0" }))
    };
    return icons[name] || null;
  };
  const DockButton = ({ icon, label, active, onClick, compact = false }) => /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick,
      "aria-label": label,
      className: `bg-white/95 text-slate-800 rounded-full shadow-lg border transition hover:-translate-y-0.5 hover:shadow-xl ${compact ? "p-0.5" : "p-1"} ${active ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"}`
    },
    /* @__PURE__ */ React.createElement(
      "span",
      {
        className: `${compact ? "w-10 h-10" : "w-12 h-12"} rounded-full flex items-center justify-center ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`
      },
      /* @__PURE__ */ React.createElement(Icon, { name: icon, size: compact ? 16 : 18 })
    ),
    /* @__PURE__ */ React.createElement("span", { className: "sr-only" }, label)
  );
  const InfoHelpModal = ({ show, onClose, theme }) => {
    if (!show) return null;
    const isDark = theme === "dark";
    const t = {
      overlay: "fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4",
      modal: isDark ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900",
      closeBtn: isDark ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white" : "border-slate-200 bg-white/95 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      sectionTitle: isDark ? "text-blue-400" : "text-blue-700",
      text: isDark ? "text-slate-300" : "text-slate-600",
      card: isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
    };
    const Section = ({ icon, title, children }) => /* @__PURE__ */ React.createElement("div", { className: `border rounded-xl p-4 space-y-2 ${t.card}` }, /* @__PURE__ */ React.createElement(
      "h3",
      {
        className: `text-lg font-bold flex items-center gap-2 ${t.sectionTitle}`
      },
      /* @__PURE__ */ React.createElement(Icon, { name: icon, size: 20 }),
      title
    ), /* @__PURE__ */ React.createElement("div", { className: `text-sm leading-relaxed space-y-1 ${t.text}` }, children));
    return /* @__PURE__ */ React.createElement("div", { className: t.overlay, onClick: onClose }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `relative rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4 ${t.modal}`,
        onClick: (e) => e.stopPropagation()
      },
      /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: onClose,
          className: `absolute top-4 left-4 rounded-full border p-2 shadow-sm transition ${t.closeBtn}`,
          "aria-label": tr("help.closeGuide")
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "close", size: 16 })
      ),
      /* @__PURE__ */ React.createElement("div", { className: "pr-8 md:pr-0" }, /* @__PURE__ */ React.createElement("div", { className: "text-blue-600 font-bold text-sm uppercase tracking-widest" }, tr("help.userGuide")), /* @__PURE__ */ React.createElement(
        "h2",
        {
          className: `text-2xl font-black ${isDark ? "text-slate-100" : "text-slate-900"}`
        },
        "AERIAL PLANNER PRO"
      ), /* @__PURE__ */ React.createElement("p", { className: `text-sm ${t.text}` }, tr("help.appDescription"))),
      /* @__PURE__ */ React.createElement(Section, { icon: "drone", title: tr("help.overview.title") }, /* @__PURE__ */ React.createElement("p", null, tr("help.overview.p1")), /* @__PURE__ */ React.createElement("p", null, tr("help.overview.p2"))),
      /* @__PURE__ */ React.createElement(Section, { icon: "map", title: tr("help.map.title") }, /* @__PURE__ */ React.createElement("p", null, tr("help.map.p1")), /* @__PURE__ */ React.createElement("p", null, tr("help.map.p2")), /* @__PURE__ */ React.createElement("p", null, tr("help.map.p3"))),
      /* @__PURE__ */ React.createElement(Section, { icon: "calendar", title: tr("help.timeline.title") }, /* @__PURE__ */ React.createElement("p", null, tr("help.timeline.p1")), /* @__PURE__ */ React.createElement("p", null, tr("help.timeline.p2")), /* @__PURE__ */ React.createElement("ul", { className: "list-disc ps-5 space-y-1" }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-green-600" }, tr("help.timeline.green")), " —", " ", tr("help.timeline.greenDesc")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-amber-500" }, tr("help.timeline.orange")), " —", " ", tr("help.timeline.orangeDesc")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-red-500" }, tr("help.timeline.red")), " —", " ", tr("help.timeline.redDesc")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-slate-400" }, tr("help.timeline.gray")), " —", " ", tr("help.timeline.grayDesc")))),
      /* @__PURE__ */ React.createElement(Section, { icon: "settings", title: tr("help.suitability.title") }, /* @__PURE__ */ React.createElement("p", null, tr("help.suitability.p1")), /* @__PURE__ */ React.createElement("ul", { className: "list-disc ps-5 space-y-1" }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold" }, tr("help.suitability.wind")), " — ", tr("help.suitability.windDefault")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold" }, tr("help.suitability.gust")), " — ", tr("help.suitability.gustDefault")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold" }, tr("help.suitability.rain")), " — ", tr("help.suitability.rainDefault")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold" }, tr("help.suitability.clouds")), " — ", tr("help.suitability.cloudsDefault")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold" }, tr("help.suitability.sun")), " — ", tr("help.suitability.sunDefault"))), /* @__PURE__ */ React.createElement("p", null, tr("help.suitability.p2"))),
      /* @__PURE__ */ React.createElement(Section, { icon: "bell", title: tr("help.notifications.title") }, /* @__PURE__ */ React.createElement("p", null, tr("help.notifications.p1")), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold" }, tr("help.notifications.enableLabel")), tr("help.notifications.enableText")), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold" }, tr("help.notifications.manageLabel")), tr("help.notifications.manageText")), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold" }, tr("help.notifications.frequencyLabel")), tr("help.notifications.frequencyText")), /* @__PURE__ */ React.createElement("ul", { className: "list-disc ps-5 space-y-1" }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold" }, tr("help.notifications.freqTodayLabel")), " — ", tr("help.notifications.freqTodayText")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold" }, tr("help.notifications.freq2to4Label")), " — ", tr("help.notifications.freq2to4Text")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold" }, tr("help.notifications.freq5to16Label")), " — ", tr("help.notifications.freq5to16Text")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold" }, tr("help.notifications.freq16plusLabel")), " — ", tr("help.notifications.freq16plusText"))), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold" }, tr("help.notifications.whenLabel")), tr("help.notifications.whenText")), /* @__PURE__ */ React.createElement("p", null, tr("help.notifications.contentText")), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold" }, tr("help.notifications.futureLabel")), tr("help.notifications.futureText")), /* @__PURE__ */ React.createElement("p", null, tr("help.notifications.futureBadge"))),
      /* @__PURE__ */ React.createElement(Section, { icon: "settings", title: tr("help.settings.title") }, /* @__PURE__ */ React.createElement("p", null, tr("help.settings.p1")), /* @__PURE__ */ React.createElement("ul", { className: "list-disc ps-5 space-y-1" }, /* @__PURE__ */ React.createElement("li", null, tr("help.settings.item1")), /* @__PURE__ */ React.createElement("li", null, tr("help.settings.item2")), /* @__PURE__ */ React.createElement("li", null, tr("help.settings.item3")), /* @__PURE__ */ React.createElement("li", null, tr("help.settings.item4"))))
    ));
  };
  const Sidebar = ({ open, className = "", children, containerRef }) => {
    if (!open) return null;
    return /* @__PURE__ */ React.createElement("aside", { className, ref: containerRef }, children);
  };
  const MapView = ({ className = "", style, children }) => /* @__PURE__ */ React.createElement("div", { className, style }, children);
  const TimelineBoard = ({
    show,
    isMobile,
    days,
    dataUnavailable = false,
    selectedSlotKey,
    onSlotSelect,
    selectedDayIndex,
    onSelectDay,
    showDayDetails,
    onCloseDayDetails,
    filterFlyableOnly,
    onToggleFilterFlyable,
    panelWidth,
    onOpenSettings,
    showSettingsButton = false,
    onTrackFutureDate,
    notificationsSupported = false,
    notificationsEnabled = false,
    notificationsLoading = false,
    isSelectedDayTracked = false,
    onEnableNotifications,
    onDisableNotifications,
    onOpenNotificationManager,
    suitabilitySettings,
    formatWindValue
  }) => {
    if (!show) return null;
    const [showAllSlots, setShowAllSlots] = React.useState(false);
    const daysScrollRef = React.useRef(null);
    const [showLeftFade, setShowLeftFade] = React.useState(false);
    const [showRightFade, setShowRightFade] = React.useState(false);
    React.useEffect(() => {
      if (!filterFlyableOnly) {
        setShowAllSlots(false);
      }
    }, [filterFlyableOnly]);
    const visibleDays = React.useMemo(() => {
      if (!Array.isArray(days)) return [];
      const withIndex = days.map((day, index) => ({ ...day, originalIndex: index }));
      if (!filterFlyableOnly) return withIndex;
      return withIndex.filter((day) => day.flyableSlots.length > 0);
    }, [days, filterFlyableOnly]);
    const updateFadeEdges = React.useCallback(() => {
      const container = daysScrollRef.current;
      if (!container) return;
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftFade(scrollLeft > 4);
      setShowRightFade(scrollLeft + clientWidth < scrollWidth - 4);
    }, []);
    React.useEffect(() => {
      updateFadeEdges();
    }, [visibleDays.length, updateFadeEdges]);
    React.useEffect(() => {
      const container = daysScrollRef.current;
      if (!container) return;
      const handleWheel = (event) => {
        if (!daysScrollRef.current) return;
        const hasDeltaX = Math.abs(event.deltaX) > 0;
        const scrollDelta = hasDeltaX ? event.deltaX : event.deltaY;
        if (scrollDelta === 0) return;
        event.preventDefault();
        daysScrollRef.current.scrollLeft += scrollDelta;
      };
      const handleScroll = () => {
        updateFadeEdges();
      };
      const handleResize = () => {
        updateFadeEdges();
      };
      container.addEventListener("wheel", handleWheel, { passive: false });
      container.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", handleResize);
      return () => {
        container.removeEventListener("wheel", handleWheel);
        container.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleResize);
      };
    }, [updateFadeEdges]);
    const scrollDaysBy = (direction) => {
      const container = daysScrollRef.current;
      if (!container) return;
      const amount = container.clientWidth * 0.7;
      container.scrollBy({
        left: direction * amount,
        behavior: "smooth"
      });
    };
    const selectedDay = days?.[selectedDayIndex] || null;
    const getSuitabilityBackground = (percent) => {
      if (percent <= 15) return "from-slate-50 to-rose-50";
      if (percent <= 40) return "from-orange-50 to-orange-100";
      if (percent <= 70) return "from-lime-50 to-lime-100";
      return "from-emerald-50 to-emerald-100";
    };
    const getRiskLevel = (riskScore) => {
      if (riskScore >= 0.75) return "extreme";
      if (riskScore >= 0.5) return "high";
      if (riskScore >= 0.25) return "medium";
      return "low";
    };
    const renderRiskIndicator = (riskScore) => {
      const riskLevel = getRiskLevel(riskScore);
      if (riskLevel === "low") {
        return /* @__PURE__ */ React.createElement("span", { className: "inline-flex items-center gap-1 text-emerald-700" }, /* @__PURE__ */ React.createElement(
          "span",
          {
            className: "inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500",
            "aria-hidden": "true"
          }
        ), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-semibold" }, tr("risk.low")));
      }
      if (riskLevel === "medium") {
        return /* @__PURE__ */ React.createElement("span", { className: "inline-flex items-center gap-1 text-orange-700" }, /* @__PURE__ */ React.createElement(
          "span",
          {
            className: "inline-flex h-2.5 w-2.5 rounded-full bg-orange-500",
            "aria-hidden": "true"
          }
        ), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-semibold" }, tr("risk.medium")));
      }
      if (riskLevel === "high") {
        return /* @__PURE__ */ React.createElement("span", { className: "inline-flex items-center gap-1 text-red-600" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm leading-none", "aria-hidden": "true" }, "⚠️"), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-semibold" }, tr("risk.high")));
      }
      return /* @__PURE__ */ React.createElement("span", { className: "inline-flex items-center gap-1 text-red-700" }, /* @__PURE__ */ React.createElement("span", { className: "text-sm leading-none", "aria-hidden": "true" }, "⛔"), /* @__PURE__ */ React.createElement("span", { className: "text-[11px] font-semibold" }, tr("risk.high")));
    };
    const formatDayHeader = (dayValue) => {
      const date = new Date(dayValue);
      if (Number.isNaN(date.getTime())) return dayValue;
      const weekday = tr(`weekday.${date.getDay()}`);
      const dayNum = `${date.getDate()}`.padStart(2, "0");
      const monthNum = `${date.getMonth() + 1}`.padStart(2, "0");
      return `${weekday} ${dayNum}.${monthNum}`;
    };
    const getSlotAlerts = (slot) => {
      if (!suitabilitySettings || slot.isFlyable) {
        return {
          wind: false,
          gust: false,
          clouds: false,
          rain: false,
          sun: false
        };
      }
      const {
        maxWind,
        maxGust,
        minCloudCover,
        maxCloudCover,
        maxRainProb,
        minSunAltitude,
        maxSunAltitude,
        includeNightFlights
      } = suitabilitySettings;
      const wind = typeof slot.wind === "number" && !Number.isNaN(slot.wind) ? slot.wind : null;
      const gustRaw = typeof slot.gust === "number" && !Number.isNaN(slot.gust) ? slot.gust : null;
      const gust = gustRaw ?? wind;
      const clouds = typeof slot.clouds === "number" && !Number.isNaN(slot.clouds) ? slot.clouds : null;
      const rainProb = typeof slot.rainProb === "number" && !Number.isNaN(slot.rainProb) ? slot.rainProb : null;
      const sunAlt = typeof slot.sunAlt === "number" && !Number.isNaN(slot.sunAlt) ? slot.sunAlt : null;
      return {
        wind: wind !== null && wind > maxWind,
        gust: gust !== null && gust > maxGust,
        clouds: clouds !== null && (clouds < minCloudCover || clouds > maxCloudCover),
        rain: rainProb !== null && rainProb > maxRainProb,
        sun: !includeNightFlights && sunAlt !== null && (sunAlt < minSunAltitude || sunAlt > maxSunAltitude)
      };
    };
    const getSlotChipClass = (isAlert) => `px-2 py-1 rounded-full border flex items-center gap-2 ${isAlert ? "border-rose-200 bg-rose-50 text-rose-700" : "bg-slate-100 border-slate-200 text-slate-600"}`;
    const renderAlertBadge = (isAlert) => isAlert ? /* @__PURE__ */ React.createElement(
      "span",
      {
        className: "inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold",
        "aria-hidden": "true"
      },
      "!"
    ) : null;
    const formatWind = (value) => {
      if (typeof formatWindValue === "function") {
        return formatWindValue(value);
      }
      if (value === null || value === void 0 || Number.isNaN(value)) {
        return "-";
      }
      return `${value.toFixed(1)} ${tr("wind.kmh")}`;
    };
    const displayedSlots = selectedDay ? filterFlyableOnly && !showAllSlots ? selectedDay.relevantSlots.filter((slot) => slot.isFlyable) : selectedDay.relevantSlots : [];
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "fixed bottom-0 left-0 right-0 z-[940] pointer-events-auto bg-white/95 backdrop-blur border-t border-slate-200 shadow-[0_-6px_18px_rgba(15,23,42,0.12)]" }, dataUnavailable && /* @__PURE__ */ React.createElement("div", { className: "text-[11px] text-amber-800 bg-amber-50 border-b border-amber-200 px-3 py-2 text-center" }, tr("timeline.dataUnavailable")), /* @__PURE__ */ React.createElement("div", { className: "flex h-[180px] md:h-[210px] flex-col" }, /* @__PURE__ */ React.createElement("div", { className: "h-[48px] md:h-[52px] px-4 flex items-center justify-between gap-2 text-[12px] text-slate-700 border-b border-slate-200" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onToggleFilterFlyable,
        className: `flex items-center gap-1 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition ${filterFlyableOnly ? "bg-emerald-600 text-white border-emerald-600 shadow" : "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"}`
      },
      /* @__PURE__ */ React.createElement(Icon, { name: "clock", size: 12 }),
      filterFlyableOnly ? tr("timeline.showAll") : tr("timeline.showFlyable")
    )), showSettingsButton && /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: onOpenSettings,
        className: "flex items-center gap-1 px-3 py-1.5 rounded-full border text-[11px] bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
      },
      /* @__PURE__ */ React.createElement(Icon, { name: "settings", size: 12 }),
      tr("timeline.settings")
    )), /* @__PURE__ */ React.createElement("div", { className: "relative flex-1 px-4" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: daysScrollRef,
        className: "flex items-center gap-3 overflow-x-auto overflow-y-hidden py-4 custom-scroll scroll-smooth snap-x snap-mandatory touch-pan-x",
        style: { WebkitOverflowScrolling: "touch" }
      },
      visibleDays.map((day) => {
        const isSelected = day.originalIndex === selectedDayIndex;
        const backgroundTone = getSuitabilityBackground(day.percent);
        const dayLine = formatDayHeader(day.day);
        const riskIndicator = renderRiskIndicator(day.dayRiskScore);
        const hasFlyableHours = day.flyableHoursTotal > 0;
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            key: day.day,
            onClick: () => onSelectDay(day.originalIndex),
            className: `min-w-[190px] sm:min-w-[230px] md:min-w-[280px] lg:min-w-[300px] max-w-[320px] p-2.5 sm:p-3 md:p-4 rounded-2xl border shadow-sm transition flex flex-col gap-2 md:gap-3 text-start snap-start bg-gradient-to-br ${backgroundTone} ${isSelected ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200 hover:border-blue-300"} opacity-100`
          },
          /* @__PURE__ */ React.createElement("div", { className: "text-[12px] md:text-[13px] font-semibold text-slate-500" }, dayLine),
          /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement(
            "div",
            {
              className: `text-xl sm:text-2xl md:text-3xl font-black ${hasFlyableHours ? "text-slate-900" : "text-slate-500"}`
            },
            day.flyableHoursLabel
          ), hasFlyableHours && /* @__PURE__ */ React.createElement("div", { className: "text-[10px] md:text-[11px] font-semibold text-slate-500" }, tr("timeline.flightWindow"))),
          /* @__PURE__ */ React.createElement("div", { className: "text-[10px] md:text-[11px] font-semibold text-slate-500 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", null, riskIndicator), /* @__PURE__ */ React.createElement("span", null, tr("timeline.showDetails")))
        );
      }),
      onTrackFutureDate && /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: onTrackFutureDate,
          className: "min-w-[190px] sm:min-w-[230px] md:min-w-[280px] lg:min-w-[300px] max-w-[320px] p-2.5 sm:p-3 md:p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/80 hover:bg-blue-50/60 transition flex flex-col items-center justify-center gap-2 md:gap-3 text-center snap-start"
        },
        /* @__PURE__ */ React.createElement("span", { className: "w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Icon, { name: "calendar", size: 20 })),
        /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-bold text-slate-700" }, tr("timeline.futureDate")), /* @__PURE__ */ React.createElement("div", { className: "text-[10px] md:text-[11px] text-slate-500 leading-snug" }, tr("timeline.trackBeyondForecast")))
      )
    ), !isMobile && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => scrollDaysBy(-1),
        className: "absolute left-1 top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow hover:bg-white",
        "aria-label": tr("timeline.scrollLeft")
      },
      /* @__PURE__ */ React.createElement(Icon, { name: "chevron-left", size: 14 })
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => scrollDaysBy(1),
        className: "absolute right-1 top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-white/90 text-slate-600 shadow hover:bg-white",
        "aria-label": tr("timeline.scrollRight")
      },
      /* @__PURE__ */ React.createElement(Icon, { name: "chevron-right", size: 14 })
    )), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white/95 to-transparent transition-opacity ${showLeftFade ? "opacity-100" : "opacity-0"}`
      }
    ), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white/95 to-transparent transition-opacity ${showRightFade ? "opacity-100" : "opacity-0"}`
      }
    )))), showDayDetails && selectedDay && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 px-4 py-6" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `bg-white rounded-3xl shadow-2xl border border-slate-200 w-full ${isMobile ? "max-h-[90vh]" : "max-h-[80vh] max-w-4xl"} flex flex-col overflow-hidden`
      },
      /* @__PURE__ */ React.createElement("div", { className: "sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex flex-col gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1 text-start" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold text-slate-500" }, selectedDay.day), /* @__PURE__ */ React.createElement("div", { className: "text-xl font-black text-slate-900" }, selectedDay.label)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold" }, selectedDay.percent, tr("timeline.suitabilityPercent")), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: onCloseDayDetails,
          className: "w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-50",
          "aria-label": tr("timeline.closeDayDetails")
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "close", size: 16 })
      ))), visibleDays.length > 1 && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 overflow-x-auto pb-1 pt-1 custom-scroll" }, visibleDays.map((day) => {
        const isSelected = day.originalIndex === selectedDayIndex;
        const dayLine = formatDayHeader(day.day);
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            key: day.day,
            type: "button",
            onClick: () => onSelectDay(day.originalIndex),
            className: `flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold transition ${isSelected ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"}`
          },
          /* @__PURE__ */ React.createElement("span", null, dayLine),
          /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-400" }, day.percent, "%")
        );
      })), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2 text-[12px] text-slate-600" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "px-3 py-1 rounded-full bg-slate-100 border border-slate-200" }, tr("timeline.stableWindows"), " ", selectedDay.flyableWindows.length ? selectedDay.flyableWindows.join(", ") : tr("timeline.none")), filterFlyableOnly && /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: () => setShowAllSlots((prev) => !prev),
          className: "px-3 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
        },
        showAllSlots ? tr("timeline.showStableOnly") : tr("timeline.showLessIdeal")
      )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: onOpenSettings,
          className: "px-3 py-1 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        },
        tr("timeline.adjustThresholds")
      ), !notificationsSupported ? /* @__PURE__ */ React.createElement("span", { className: "px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-[11px] text-slate-600" }, tr("timeline.browserNoNotifications")) : isSelectedDayTracked ? /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-[11px] font-semibold text-emerald-700" }, tr("timeline.dayTracked")), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: onOpenNotificationManager,
          className: "px-3 py-1 rounded-full border border-slate-200 bg-white text-[11px] text-slate-600 hover:bg-slate-50"
        },
        tr("timeline.manageNotifications")
      )) : /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: onEnableNotifications,
          disabled: notificationsLoading,
          className: `px-3 py-1 rounded-full border text-[11px] font-semibold transition bg-blue-600 text-white border-blue-600 ${notificationsLoading ? "opacity-60 cursor-wait" : ""}`
        },
        notificationsLoading ? tr("timeline.processing") : tr("timeline.enableNotificationsForDay")
      )))),
      /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto p-5 space-y-3 custom-scroll" }, displayedSlots.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "text-center text-sm text-slate-500 border border-dashed border-slate-300 rounded-xl py-6" }, tr("timeline.noSlotsToShow")) : displayedSlots.map((slot) => {
        const slotKey = `${selectedDay.day}T${slot.time}`;
        const isActive = slotKey === selectedSlotKey;
        const slotAlerts = getSlotAlerts(slot);
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            key: slot.key,
            onClick: () => onSlotSelect(`${selectedDay.day}T${slot.time}`),
            className: `w-full text-start border rounded-2xl p-4 shadow-sm transition ${isActive ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200 hover:border-blue-300"}`
          },
          /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "text-xl font-black text-slate-900" }, slot.time), /* @__PURE__ */ React.createElement(
            "span",
            {
              className: `px-3 py-1 rounded-full text-[11px] font-semibold ${slot.isFlyable ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"}`
            },
            slot.isFlyable ? tr("timeline.stableHour") : tr("timeline.lessIdeal")
          )),
          /* @__PURE__ */ React.createElement("div", { className: "mt-3 grid grid-cols-2 md:grid-cols-6 gap-2 text-[11px] text-slate-600" }, /* @__PURE__ */ React.createElement("div", { className: "px-2 py-1 rounded-full bg-slate-100 border border-slate-200 flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "whitespace-nowrap" }, tr("timeline.riskIndex")), renderRiskIndicator(slot.riskScore ?? 0)), /* @__PURE__ */ React.createElement("div", { className: getSlotChipClass(slotAlerts.wind) }, "🌬 ", tr("timeline.wind"), " ", formatWind(slot.wind), renderAlertBadge(slotAlerts.wind)), /* @__PURE__ */ React.createElement("div", { className: getSlotChipClass(slotAlerts.gust) }, "💨 ", tr("timeline.gusts"), " ", formatWind(slot.gust ?? slot.wind), renderAlertBadge(slotAlerts.gust)), /* @__PURE__ */ React.createElement("div", { className: getSlotChipClass(slotAlerts.rain) }, "🌧 ", tr("timeline.rain"), " ", slot.rainProb ?? 0, "%", renderAlertBadge(slotAlerts.rain)), /* @__PURE__ */ React.createElement("div", { className: getSlotChipClass(slotAlerts.clouds) }, "☁ ", tr("timeline.clouds"), " ", slot.clouds ?? 0, "%", renderAlertBadge(slotAlerts.clouds)), /* @__PURE__ */ React.createElement("div", { className: getSlotChipClass(slotAlerts.sun) }, "☀ ", tr("timeline.sunAngle"), " ", typeof slot.sunAlt === "number" ? `${slot.sunAlt.toFixed(1)}°` : "—", renderAlertBadge(slotAlerts.sun)))
        );
      }))
    )));
  };
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
    panelRef,
    panelWidth
  }) => {
    if (!open) return null;
    const panelStyle = {
      top: "calc(env(safe-area-inset-top, 0px) + 1rem)",
      width: panelWidth || "min(22rem, calc(100% - 6rem))",
      maxWidth: panelWidth || "22rem"
    };
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: panelRef,
        className: "fixed right-3 sm:right-4 max-h-[82vh] z-[920] bg-gradient-to-b from-blue-50 to-white text-slate-900 shadow-2xl border border-blue-200 rounded-3xl overflow-y-auto custom-scroll",
        style: panelStyle
      },
      /* @__PURE__ */ React.createElement("div", { className: "sticky top-0 z-10 bg-gradient-to-b from-blue-50 to-white px-5 pt-5 pb-3 border-b border-blue-200" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1 text-start" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs uppercase tracking-[0.3em] text-blue-700 font-bold" }, tr("realtime.title")), /* @__PURE__ */ React.createElement("h2", { className: "text-xl font-black text-slate-900 leading-tight" }, tr("realtime.subtitle")), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-600" }, tr("realtime.description")))),
      /* @__PURE__ */ React.createElement("div", { className: "p-5 space-y-4 text-start" }, /* @__PURE__ */ React.createElement("div", { className: "border border-blue-200 rounded-2xl bg-white/90 p-4 space-y-3 shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0" }, /* @__PURE__ */ React.createElement(Icon, { name: "radar", size: 18 })), /* @__PURE__ */ React.createElement("div", { className: "leading-tight text-start" }, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-slate-900" }, tr("realtime.rainRadar")), /* @__PURE__ */ React.createElement("div", { className: "text-[11px] text-blue-800/80" }, tr("realtime.rainRadarSource")))), /* @__PURE__ */ React.createElement(
        "span",
        {
          className: `text-[11px] font-semibold px-2 py-0.5 rounded-full ${rainRadarEnabled ? "text-blue-700 bg-blue-50 border border-blue-200" : "text-slate-400 bg-slate-100"}`
        },
        rainRadarEnabled ? tr("realtime.shown") : tr("realtime.hidden")
      )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2 text-[11px] text-blue-800" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 items-center" }, rainRadarStatus === "loading" && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200" }, tr("realtime.radarLoading")), rainRadarStatus === "error" && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200" }, tr("realtime.radarUnavailable")), (rainRadarUnavailable || rainRadarStatus === "unavailable") && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800" }, tr("realtime.sourceUnavailable"))), rainRadarTimestamp && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded-full bg-white border border-blue-200 text-blue-700" }, tr("realtime.updated"), " ", new Date(rainRadarTimestamp * 1e3).toLocaleTimeString(getDateLocale()))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onToggleRainRadar,
          className: `flex items-center justify-between text-sm rounded-xl border px-3 py-2 transition ${rainRadarEnabled ? "bg-blue-600 text-white border-blue-600 shadow-inner" : "bg-white text-blue-800 border-blue-200 hover:bg-blue-50/80"}`
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
          "span",
          {
            className: `w-7 h-7 rounded-full flex items-center justify-center ${rainRadarEnabled ? "bg-white/20" : "bg-blue-100 text-blue-700"}`
          },
          /* @__PURE__ */ React.createElement(Icon, { name: "cloud", size: 16 })
        ), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-start" }, rainRadarEnabled ? tr("realtime.hideRain") : tr("realtime.showRain"))),
        /* @__PURE__ */ React.createElement(
          "span",
          {
            className: `text-[11px] font-semibold ${rainRadarEnabled ? "text-white" : "text-blue-700"}`
          },
          rainRadarEnabled ? tr("realtime.active") : tr("realtime.off")
        )
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onRefreshRainRadar,
          className: "flex items-center justify-center rounded-xl border border-blue-200 bg-white text-sm font-semibold text-blue-700 hover:bg-blue-50/80"
        },
        tr("realtime.refreshRadar")
      )))), /* @__PURE__ */ React.createElement("div", { className: "border border-blue-200 rounded-2xl bg-white/90 p-4 space-y-3 shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0" }, /* @__PURE__ */ React.createElement(Icon, { name: "drone", size: 18 })), /* @__PURE__ */ React.createElement("div", { className: "leading-tight text-start" }, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-slate-900" }, tr("realtime.aircraft")), /* @__PURE__ */ React.createElement("div", { className: "text-[11px] text-blue-800/80" }, tr("realtime.aircraftSource")))), /* @__PURE__ */ React.createElement(
        "span",
        {
          className: `text-[11px] font-semibold px-2 py-0.5 rounded-full ${aircraftEnabled ? "text-blue-700 bg-blue-50 border border-blue-200" : "text-slate-400 bg-slate-100"}`
        },
        aircraftEnabled ? tr("realtime.shown") : tr("realtime.hidden")
      )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2 bg-blue-50/60 border border-blue-200 rounded-xl px-3 py-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2 text-[11px] text-blue-800" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 items-center" }, aircraftStatus === "loading" && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded-full bg-blue-100 border border-blue-200" }, tr("realtime.connecting")), aircraftStatus === "updating" && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded-full bg-blue-100 border border-blue-200" }, tr("realtime.refreshing")), aircraftStatus === "error" && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600" }, tr("realtime.error")), (aircraftUnavailable || aircraftStatus === "error") && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200" }, tr("realtime.sourceUnavailable"))), /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded-full bg-white border border-blue-200 text-blue-700 text-[10px]" }, tr("realtime.range"), " ", aircraftRangeKm, " ", tr("realtime.kmUnit"), " · ", aircraftData.length, " ", tr("realtime.inRange"))), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onToggleAircraft,
          className: `w-full flex items-center justify-between text-sm rounded-xl border px-3 py-1.5 transition ${aircraftEnabled ? "bg-blue-600 text-white border-blue-600 shadow-inner" : "bg-white text-blue-800 border-blue-200 hover:bg-blue-100/70"}`
        },
        /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
          "span",
          {
            className: `w-7 h-7 rounded-full flex items-center justify-center ${aircraftEnabled ? "bg-white/20" : "bg-blue-100 text-blue-700"}`
          },
          /* @__PURE__ */ React.createElement(Icon, { name: "drone", size: 16 })
        ), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-start" }, aircraftEnabled ? tr("realtime.hideAircraft") : tr("realtime.showAircraft"))),
        /* @__PURE__ */ React.createElement(
          "span",
          {
            className: `text-[11px] font-semibold ${aircraftEnabled ? "text-white" : "text-blue-700"}`
          },
          aircraftEnabled ? tr("realtime.active") : tr("realtime.off")
        )
      ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-[11px] text-blue-800" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "range",
          min: "20",
          max: "200",
          step: "5",
          value: aircraftRangeKm,
          onChange: (e) => onRangeChange(Number(e.target.value)),
          className: "flex-1 accent-blue-600",
          disabled: !aircraftEnabled
        }
      ), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-blue-700" }, tr("realtime.searchAroundMap"))))))
    );
  };
  const DocumentationPanel = ({ children }) => children;
  const Dock = ({ children }) => /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "fixed md:bottom-6 bottom-4 flex flex-col gap-3 z-[940]",
      style: { right: "1rem" }
    },
    children
  );
  const NotificationManagerModal = ({
    show,
    onClose,
    theme,
    rules = [],
    isLoading = false,
    onDeleteRule,
    onRefresh,
    onDisableAll
  }) => {
    if (!show) return null;
    const isDark = theme === "dark";
    const [confirmDeleteId, setConfirmDeleteId] = React.useState(null);
    const t = {
      overlay: "fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4",
      modal: isDark ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900",
      closeBtn: isDark ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white" : "border-slate-200 bg-white/95 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      card: isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200",
      text: isDark ? "text-slate-300" : "text-slate-600"
    };
    const formatDateShort = (dateStr) => {
      if (!dateStr) return "";
      const parts = dateStr.split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
      return dateStr;
    };
    const handleDeleteClick = (ruleId) => {
      if (confirmDeleteId === ruleId) {
        onDeleteRule(ruleId);
        setConfirmDeleteId(null);
      } else {
        setConfirmDeleteId(ruleId);
      }
    };
    return /* @__PURE__ */ React.createElement("div", { className: t.overlay, onClick: onClose }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `relative rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4 ${t.modal}`,
        onClick: (e) => e.stopPropagation()
      },
      /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: onClose,
          className: `absolute top-4 left-4 rounded-full border p-2 shadow-sm transition ${t.closeBtn}`,
          "aria-label": tr("notifMgr.closeManager")
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "close", size: 16 })
      ),
      /* @__PURE__ */ React.createElement("div", { className: "pr-8 md:pr-0" }, /* @__PURE__ */ React.createElement("div", { className: "text-blue-600 font-bold text-sm uppercase tracking-widest" }, tr("notifMgr.title")), /* @__PURE__ */ React.createElement("h2", { className: `text-xl font-black ${isDark ? "text-slate-100" : "text-slate-900"}` }, rules.length > 0 ? tr("notifMgr.activeRules", { count: rules.length }) : tr("notifMgr.noActiveRules"))),
      isLoading ? /* @__PURE__ */ React.createElement("div", { className: "text-center py-8" }, /* @__PURE__ */ React.createElement("div", { className: `text-sm ${t.text}` }, tr("notifMgr.loadingRules"))) : rules.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: `text-center py-8 border border-dashed rounded-xl ${isDark ? "border-slate-700" : "border-slate-300"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-center mb-3" }, /* @__PURE__ */ React.createElement(Icon, { name: "bell", size: 32, className: isDark ? "text-slate-600" : "text-slate-300" })), /* @__PURE__ */ React.createElement("div", { className: `text-sm ${t.text}` }, tr("notifMgr.noNotificationsNow")), /* @__PURE__ */ React.createElement("div", { className: `text-xs mt-1 ${t.text}` }, tr("notifMgr.enableFromDayView"))) : /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, rules.map((rule) => {
        const locationName = rule.criteria?.locationName || tr("location.unknown");
        const dateRange = rule.start_date === rule.end_date ? formatDateShort(rule.start_date) : `${formatDateShort(rule.start_date)} – ${formatDateShort(rule.end_date)}`;
        const hourFrom = rule.hour_from ?? 0;
        const hourTo = rule.hour_to ?? 23;
        const hoursLabel = `${String(hourFrom).padStart(2, "0")}:00–${String(hourTo).padStart(2, "0")}:00`;
        const lastChecked = rule.last_checked_at ? new Date(rule.last_checked_at).toLocaleString(getDateLocale(), {
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "2-digit"
        }) : null;
        const isConfirming = confirmDeleteId === rule.id;
        return /* @__PURE__ */ React.createElement(
          "div",
          {
            key: rule.id,
            className: `border rounded-xl p-3 space-y-2 ${t.card}`
          },
          /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1 flex-1" }, /* @__PURE__ */ React.createElement("div", { className: `font-bold text-sm ${isDark ? "text-slate-100" : "text-slate-900"}` }, locationName), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center gap-2 text-[11px]" }, /* @__PURE__ */ React.createElement("span", { className: `px-2 py-0.5 rounded-full border ${isDark ? "bg-slate-700 border-slate-600 text-slate-200" : "bg-white border-slate-200 text-slate-700"}` }, dateRange), /* @__PURE__ */ React.createElement("span", { className: `px-2 py-0.5 rounded-full border ${isDark ? "bg-slate-700 border-slate-600 text-slate-200" : "bg-white border-slate-200 text-slate-700"}` }, hoursLabel), rule.criteria?.ruleType === "future" && /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 rounded-full border border-purple-200 bg-purple-50 text-purple-700 text-[10px] font-semibold" }, tr("notifMgr.waitingForForecast")), lastChecked && /* @__PURE__ */ React.createElement("span", { className: `text-[10px] ${t.text}` }, tr("notifMgr.lastChecked"), " ", lastChecked))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1" }, isConfirming ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              onClick: () => handleDeleteClick(rule.id),
              className: "px-2 py-1 rounded-lg bg-red-600 text-white text-[11px] font-semibold hover:bg-red-500"
            },
            tr("notifMgr.delete")
          ), /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              onClick: () => setConfirmDeleteId(null),
              className: `px-2 py-1 rounded-lg text-[11px] font-semibold ${isDark ? "bg-slate-700 text-slate-200" : "bg-slate-200 text-slate-700"}`
            },
            tr("notifMgr.cancel")
          )) : /* @__PURE__ */ React.createElement(
            "button",
            {
              type: "button",
              onClick: () => handleDeleteClick(rule.id),
              className: `p-1.5 rounded-lg transition ${isDark ? "text-slate-400 hover:text-red-400 hover:bg-slate-700" : "text-slate-400 hover:text-red-600 hover:bg-slate-100"}`,
              "aria-label": tr("notifMgr.deleteRule")
            },
            /* @__PURE__ */ React.createElement(Icon, { name: "trash", size: 14 })
          )))
        );
      })),
      /* @__PURE__ */ React.createElement("div", { className: `flex flex-wrap items-center justify-between gap-2 pt-2 border-t ${isDark ? "border-slate-700" : "border-slate-200"}` }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: onRefresh,
          disabled: isLoading,
          className: `px-3 py-2 rounded-lg border text-[11px] font-semibold transition ${isDark ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"} ${isLoading ? "opacity-60 cursor-wait" : ""}`
        },
        /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement(Icon, { name: "rotate", size: 12 }), tr("notifMgr.refresh"))
      ), rules.length > 0 && /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: onDisableAll,
          className: "px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-[11px] font-semibold hover:bg-red-100 transition"
        },
        tr("notifMgr.disableAll")
      ))
    ));
  };
  const FutureDateTrackingModal = ({
    show,
    onClose,
    theme,
    locationName,
    futureDateValue,
    futureDateMin,
    futureDateMax,
    onDateChange,
    onConfirm,
    isLoading
  }) => {
    if (!show) return null;
    const isDark = theme === "dark";
    const t = {
      overlay: "fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4",
      modal: isDark ? "bg-slate-900 text-slate-100" : "bg-white text-slate-900",
      closeBtn: isDark ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white" : "border-slate-200 bg-white/95 text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      card: isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200",
      text: isDark ? "text-slate-300" : "text-slate-600"
    };
    const formattedDate = futureDateValue ? (() => {
      const parts = futureDateValue.split("-");
      return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : futureDateValue;
    })() : "";
    const confirmText = futureDateValue && locationName ? tr("futureDate.trackLocation", { location: locationName, date: formattedDate }) : futureDateValue ? tr("futureDate.trackDate", { date: formattedDate }) : tr("futureDate.selectDateToTrack");
    return /* @__PURE__ */ React.createElement("div", { className: t.overlay, onClick: onClose }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `relative rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 ${t.modal}`,
        onClick: (e) => e.stopPropagation()
      },
      /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: onClose,
          className: `absolute top-4 left-4 rounded-full border p-2 shadow-sm transition ${t.closeBtn}`,
          "aria-label": tr("futureDate.close")
        },
        /* @__PURE__ */ React.createElement(Icon, { name: "close", size: 16 })
      ),
      /* @__PURE__ */ React.createElement("div", { className: "pr-8 md:pr-0" }, /* @__PURE__ */ React.createElement("div", { className: "text-blue-600 font-bold text-sm uppercase tracking-widest" }, tr("futureDate.title")), /* @__PURE__ */ React.createElement("h2", { className: `text-xl font-black ${isDark ? "text-slate-100" : "text-slate-900"}` }, tr("futureDate.subtitle"))),
      /* @__PURE__ */ React.createElement("div", { className: `border rounded-xl p-4 space-y-2 ${t.card}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0" }, /* @__PURE__ */ React.createElement(Icon, { name: "gps", size: 16 })), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("div", { className: `text-sm font-bold truncate ${isDark ? "text-slate-100" : "text-slate-900"}` }, locationName || tr("futureDate.loadingLocation")), /* @__PURE__ */ React.createElement("div", { className: `text-[11px] ${t.text}` }, tr("futureDate.locationByMapCenter"))))),
      /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("label", { className: `text-sm font-semibold block ${isDark ? "text-slate-200" : "text-slate-700"}` }, tr("futureDate.chooseDate")), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "date",
          min: futureDateMin || "",
          max: futureDateMax || "",
          value: futureDateValue || "",
          onChange: (e) => onDateChange(e.target.value),
          className: `w-full px-3 py-2.5 rounded-lg border text-sm ${isDark ? "bg-slate-800 border-slate-600 text-slate-200" : "bg-white border-slate-300 text-slate-800"}`
        }
      ), /* @__PURE__ */ React.createElement("p", { className: `text-[11px] leading-relaxed ${t.text}` }, tr("futureDate.description"))),
      /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-2" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: onConfirm,
          disabled: !futureDateValue || isLoading,
          className: `w-full px-4 py-3 rounded-xl text-sm font-bold transition ${futureDateValue && !isLoading ? "bg-blue-600 text-white hover:bg-blue-500 shadow-sm" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`
        },
        isLoading ? tr("futureDate.activating") : confirmText
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          onClick: onClose,
          className: `w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition ${isDark ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`
        },
        tr("futureDate.cancelBtn")
      ))
    ));
  };
  window.AerialPlannerComponents = {
    Sidebar,
    MapView,
    TimelineBoard,
    RealtimePanel,
    DocumentationPanel,
    Dock,
    Icon,
    DockButton,
    InfoHelpModal,
    NotificationManagerModal,
    FutureDateTrackingModal
  };
})();
