// ---------------------------------------------------------------------------
// Anthropic-inspired LIGHT theme.
// Centralised palette so every screen/component shares one source of truth
// (no duplicated colour literals scattered across StyleSheets).
// ---------------------------------------------------------------------------

export const theme = {
  bg: '#F0EEE6', // ivory / cream background
  surface: '#FAF9F5', // cards / raised surfaces
  surfaceAlt: '#EDEAE0', // subtle alternate surface (chips, tab bar)
  inputBg: '#FFFFFF',

  text: '#191919', // near-black
  textMuted: '#6E6B62', // warm grey
  textFaint: '#9A968C',

  border: 'rgba(25,25,25,0.12)',
  borderStrong: 'rgba(25,25,25,0.22)',

  accent: '#D97757', // Anthropic coral
  accentDark: '#C2603F',
  accentSoft: 'rgba(217,119,87,0.12)',
  onAccent: '#FFFFFF',

  danger: '#B23A2E',
  dangerSoft: 'rgba(178,58,46,0.10)',
  success: '#3F7A53',
  successSoft: 'rgba(63,122,83,0.12)',
};
