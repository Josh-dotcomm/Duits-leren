// ---------------------------------------------------------------------------
// DEFAULTS + SETUP SUGGESTIONS
// ---------------------------------------------------------------------------
// Nothing about the user is hardcoded anymore. The profile (name / company /
// role) is entered on the Profiel tab and persisted; these are only the empty
// defaults used until the user fills it in.
// ---------------------------------------------------------------------------

export const defaultProfile = {
  name: '',
  company: '',
  role: '',
};

// Pre-filled values on the Setup screen.
export const defaultCallSetup = {
  scenario: 'Bellen over proefpakket',
  persona: 'Inkoper franchiseorganisatie/groothandel',
};

// Quick-pick suggestions (tap a chip to fill the field).
export const scenarioSuggestions = [
  'Bellen over proefpakket',
  'Koude acquisitie',
  'Klacht levering/product',
  'Prijsonderhandeling',
  'Afspraak inplannen',
];

export const personaSuggestions = [
  'Inkoper franchiseorganisatie/groothandel',
  'Eigenaar Imbiss',
  'Chef-kok horecazaak',
  'Verkoper binnendienst orderverwerking',
];
