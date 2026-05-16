// icons.jsx — minimal stroke icon set for BayWash
// Stroke 1.6, 24px viewBox, currentColor.

const _icon = (path, opts = {}) => ({ size = 22, color = 'currentColor', stroke = 1.6, fill = 'none' } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
    {path}
  </svg>
);

const Icon = {
  Mail: _icon(<>
    <rect x="3" y="5" width="18" height="14" rx="2.5"/>
    <path d="M3.5 7l8 5.6a1 1 0 0 0 1 0L20.5 7"/>
  </>),
  Lock: _icon(<>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2"/>
    <path d="M8 10.5V7.5a4 4 0 1 1 8 0v3"/>
  </>),
  Eye: _icon(<>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/>
    <circle cx="12" cy="12" r="3"/>
  </>),
  ArrowRight: _icon(<><path d="M5 12h14M13 6l6 6-6 6"/></>),
  ArrowLeft: _icon(<><path d="M19 12H5M11 18l-6-6 6-6"/></>),
  Plus: _icon(<><path d="M12 5v14M5 12h14"/></>),
  Check: _icon(<><path d="M5 12.5l4.5 4.5L19 7.5"/></>),
  Bell: _icon(<>
    <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2.5h-15L6 16z"/>
    <path d="M10 19a2 2 0 0 0 4 0"/>
  </>),
  User: _icon(<>
    <circle cx="12" cy="8.5" r="3.5"/>
    <path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5"/>
  </>),
  Building: _icon(<>
    <rect x="4" y="3" width="16" height="18" rx="1.5"/>
    <path d="M8 7h2M8 11h2M8 15h2M14 7h2M14 11h2M14 15h2M10 21v-3h4v3"/>
  </>),
  Pin: _icon(<>
    <path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z"/>
    <circle cx="12" cy="10" r="2.5"/>
  </>),
  Floor: _icon(<>
    <path d="M3 7l9-4 9 4M5 9v9h14V9M9 18v-5h6v5"/>
  </>),
  Clock: _icon(<>
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 7.5V12l3 2"/>
  </>),
  Calendar: _icon(<>
    <rect x="3.5" y="5" width="17" height="15" rx="2"/>
    <path d="M3.5 10h17M8 3.5v3M16 3.5v3"/>
  </>),
  Camera: _icon(<>
    <path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/>
    <circle cx="12" cy="13" r="3.5"/>
  </>),
  Car: _icon(<>
    <path d="M3 14l1.5-5a2 2 0 0 1 2-1.5h11a2 2 0 0 1 2 1.5L21 14"/>
    <rect x="3" y="14" width="18" height="5" rx="1.5"/>
    <circle cx="7.5" cy="19" r="1.4" fill="currentColor"/>
    <circle cx="16.5" cy="19" r="1.4" fill="currentColor"/>
  </>),
  Sparkle: _icon(<>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>
    <path d="M12 8.5L13.2 12 12 15.5 10.8 12 12 8.5z" fill="currentColor"/>
  </>),
  Drop: _icon(<>
    <path d="M12 3.5s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>
  </>),
  Check2: _icon(<><path d="M4 12.5l5 5L20 6"/></>),
  Coin: _icon(<>
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 7v10M9 9.5c0-1 1.3-2 3-2s3 .8 3 2-1 1.7-3 2-3 1-3 2 1.3 2 3 2 3-1 3-2"/>
  </>),
  Card: _icon(<>
    <rect x="3" y="6" width="18" height="13" rx="2"/>
    <path d="M3 10h18M7 15h3"/>
  </>),
  Hash: _icon(<>
    <path d="M5 9h14M5 15h14M9 4l-2 16M17 4l-2 16"/>
  </>),
  Chevron: _icon(<><path d="M6 9l6 6 6-6"/></>),
  ChevronR: _icon(<><path d="M9 6l6 6-6 6"/></>),
  X: _icon(<><path d="M6 6l12 12M18 6L6 18"/></>),
  Settings: _icon(<>
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </>),
};

window.Icon = Icon;
