// ─── Kategorien ──────────────────────────────────────────────
const CATEGORIES = [
  // Natur/Landschaft
  { id: 'Berg',          label: 'Berg',          emoji: '⛰️',  group: 'Natur' },
  { id: 'Schlucht',      label: 'Schlucht',       emoji: '🏔️', group: 'Natur' },
  { id: 'Wasserfall',    label: 'Wasserfall',     emoji: '💧',  group: 'Natur' },
  { id: 'Felsformation', label: 'Felsformation',  emoji: '🪨',  group: 'Natur' },
  { id: 'Naturdenkmal',  label: 'Naturdenkmal',   emoji: '🌳',  group: 'Natur' },
  { id: 'See',           label: 'See',            emoji: '🏞️', group: 'Natur' },
  { id: 'Strand',        label: 'Strand',         emoji: '🏖️', group: 'Natur' },
  { id: 'Höhle',         label: 'Höhle',          emoji: '🕳️', group: 'Natur' },
  // Wandern/Sport
  { id: 'Wanderung',     label: 'Wanderung',      emoji: '🥾',  group: 'Sport' },
  { id: 'Klettersteig',  label: 'Klettersteig',   emoji: '🧗',  group: 'Sport' },
  // Kultur
  { id: 'Kirche',        label: 'Kirche/Kloster', emoji: '⛪',  group: 'Kultur' },
  { id: 'Burg',          label: 'Burg/Schloss',   emoji: '🏰',  group: 'Kultur' },
  // Stadtbild
  { id: 'Stadtbild',     label: 'Stadtbild',      emoji: '🏙️', group: 'Kultur' },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

// ─── Länder ───────────────────────────────────────────────────
const COUNTRIES = [
  { name: 'Deutschland',         flag: '🇩🇪' },
  { name: 'Österreich',          flag: '🇦🇹' },
  { name: 'Schweiz',             flag: '🇨🇭' },
  { name: 'Italien',             flag: '🇮🇹' },
  { name: 'Frankreich',          flag: '🇫🇷' },
  { name: 'Spanien',             flag: '🇪🇸' },
  { name: 'Portugal',            flag: '🇵🇹' },
  { name: 'Griechenland',        flag: '🇬🇷' },
  { name: 'Kroatien',            flag: '🇭🇷' },
  { name: 'Slowenien',           flag: '🇸🇮' },
  { name: 'Tschechien',          flag: '🇨🇿' },
  { name: 'Polen',               flag: '🇵🇱' },
  { name: 'Norwegen',            flag: '🇳🇴' },
  { name: 'Schweden',            flag: '🇸🇪' },
  { name: 'Niederlande',         flag: '🇳🇱' },
  { name: 'Belgien',             flag: '🇧🇪' },
  { name: 'Dänemark',            flag: '🇩🇰' },
  { name: 'Ungarn',              flag: '🇭🇺' },
  { name: 'Rumänien',            flag: '🇷🇴' },
  { name: 'Bulgarien',           flag: '🇧🇬' },
  { name: 'Türkei',              flag: '🇹🇷' },
  { name: 'Marokko',             flag: '🇲🇦' },
  { name: 'Albanien',            flag: '🇦🇱' },
  { name: 'Bosnien-Herzegowina', flag: '🇧🇦' },
  { name: 'Montenegro',          flag: '🇲🇪' },
  { name: 'Serbien',             flag: '🇷🇸' },
  { name: 'Slowakei',            flag: '🇸🇰' },
  { name: 'Finnland',            flag: '🇫🇮' },
  { name: 'Island',              flag: '🇮🇸' },
  { name: 'Irland',              flag: '🇮🇪' },
  { name: 'Großbritannien',      flag: '🇬🇧' },
  { name: 'Luxemburg',           flag: '🇱🇺' },
  { name: 'Malta',               flag: '🇲🇹' },
  { name: 'Andorra',             flag: '🇦🇩' },
  { name: 'Liechtenstein',       flag: '🇱🇮' },
  { name: 'Zypern',              flag: '🇨🇾' },
  { name: 'Estland',             flag: '🇪🇪' },
  { name: 'Lettland',            flag: '🇱🇻' },
  { name: 'Litauen',             flag: '🇱🇹' },
  { name: 'Ukraine',             flag: '🇺🇦' },
  { name: 'Nordmazedonien',      flag: '🇲🇰' },
  { name: 'Kosovo',              flag: '🇽🇰' },
  { name: 'Tunesien',            flag: '🇹🇳' },
  { name: 'Weißrussland',        flag: '🇧🇾' },
];

// ─── Kategorie-Farbgradienten (Fallback wenn kein Foto) ───────
const CAT_GRADIENTS = {
  Berg:          'linear-gradient(160deg,#2d3a2a 0%,#4a6a3a 60%,#8a9a6a 100%)',
  Schlucht:      'linear-gradient(160deg,#1a2a2a 0%,#2a4a4a 60%,#5a8a7a 100%)',
  Wasserfall:    'linear-gradient(160deg,#1a2a3a 0%,#2a5a7a 60%,#5a9aaa 100%)',
  Felsformation: 'linear-gradient(160deg,#2a2a1a 0%,#4a4a2a 60%,#8a7a5a 100%)',
  Naturdenkmal:  'linear-gradient(160deg,#1a3a1a 0%,#2a6a2a 60%,#5a9a5a 100%)',
  See:           'linear-gradient(160deg,#1a2a4a 0%,#2a4a7a 60%,#4a7aaa 100%)',
  Strand:        'linear-gradient(160deg,#2a3a1a 0%,#5a7a2a 60%,#c8b86a 100%)',
  Höhle:         'linear-gradient(160deg,#1a1a1a 0%,#2a2a2a 60%,#5a5a4a 100%)',
  Wanderung:     'linear-gradient(160deg,#2a3a1a 0%,#4a6a2a 60%,#7a9a5a 100%)',
  Klettersteig:  'linear-gradient(160deg,#3a2a1a 0%,#6a4a2a 60%,#9a7a5a 100%)',
  Kirche:        'linear-gradient(160deg,#2a2a3a 0%,#4a4a6a 60%,#8a8aaa 100%)',
  Burg:          'linear-gradient(160deg,#3a2a1a 0%,#6a5a2a 60%,#9a8a5a 100%)',
  Stadtbild:     'linear-gradient(160deg,#1a1a2a 0%,#2a2a4a 60%,#5a5a7a 100%)',
};

// ─── Theme-Tokens ─────────────────────────────────────────────
const THEMES = {
  dark: {
    bg:          '#1c2420',
    bg2:         '#242e22',
    bg3:         '#2a3828',
    border:      '#3a4a38',
    text:        '#e8dfc9',
    muted:       '#6a8060',
    accent:      '#4a7c59',
    accentSoft:  '#3a5a38',
    gold:        '#c8a840',
    font:        "Fraunces, 'Georgia', serif",
    fontUI:      "Inter, system-ui, sans-serif",
    chipBg:      '#2a3828',
    shadow:      '0 4px 20px rgba(0,0,0,0.4)',
  },
  light: {
    bg:          '#f5f2ec',
    bg2:         '#ffffff',
    bg3:         '#eae6de',
    border:      '#d0c8b8',
    text:        '#2a2a1a',
    muted:       '#7a8070',
    accent:      '#3a6a48',
    accentSoft:  '#d0e8d8',
    gold:        '#9a7a10',
    font:        "Fraunces, 'Georgia', serif",
    fontUI:      "Inter, system-ui, sans-serif",
    chipBg:      '#eae6de',
    shadow:      '0 4px 20px rgba(0,0,0,0.12)',
  },
};

// ─── Icon-Helfer (SVG inline) ─────────────────────────────────
const Icon = {
  star: (color = '#c8a840', size = 14, fill = 'none') => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg>
  ),
  dot: (filled, color = '#4a7c59', size = 14) => (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" fill={filled ? color : 'none'} stroke={color} strokeWidth="2"/>
    </svg>
  ),
  back: (color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <polyline points="15,18 9,12 15,6"/>
    </svg>
  ),
  edit: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  trash: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14H6L5,6"/>
      <path d="M10,11v6"/><path d="M14,11v6"/>
      <path d="M9,6V4h6v2"/>
    </svg>
  ),
  map: (color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2"/>
      <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  pin: (color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="0">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  ),
  plus: (color) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  search: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  close: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  photo: (color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21,15 16,10 5,21"/>
    </svg>
  ),
  link: (color) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
    </svg>
  ),
  gps: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
    </svg>
  ),
  sun: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  moon: (color) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  ),
};

// ─── Hilfsfunktionen ─────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function formatEuros(cents) {
  if (!cents) return '';
  return (cents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
