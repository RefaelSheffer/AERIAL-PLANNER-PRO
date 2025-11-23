const Config = window.AerialPlannerConfig;
const Services = window.AerialPlannerServices;

const Icon = ({ name, size = 16, className = '', strokeWidth = 2, color = 'currentColor' }) => {
    const baseProps = {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: color,
        strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        className
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
        )
    };

    return icons[name] || null;
};

const DockButton = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        aria-label={label}
        className={`bg-white/95 text-slate-800 rounded-full shadow-lg border transition hover:-translate-y-0.5 hover:shadow-xl p-1 ${active ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'}`}
    >
        <span className={`w-12 h-12 rounded-full flex items-center justify-center ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
            <Icon name={icon} size={18} />
        </span>
        <span className="sr-only">{label}</span>
    </button>
);

const Sidebar = ({ children }) => children;
const MapView = ({ children }) => children;
const TimelineBoard = ({ children }) => children;
const RealtimePanel = ({ children }) => children;
const DocumentationPanel = ({ children }) => children;

const Dock = ({ children }) => (
    <div className="fixed md:bottom-6 bottom-4 flex flex-col gap-3 z-[1100]" style={{ right: '1rem' }}>
        {children}
    </div>
);

window.AerialPlannerComponents = { Sidebar, MapView, TimelineBoard, RealtimePanel, DocumentationPanel, Dock, Icon, DockButton };
