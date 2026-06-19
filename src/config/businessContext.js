// ---------------------------------------------------------------------------
// LEARNER PROFILE + CALL-SETUP DEFAULTS
// ---------------------------------------------------------------------------
// The learner profile describes WHO is practising (a native Dutch speaker).
// The call setup (scenario + AI persona) is chosen per call on the Setup screen
// and injected into the system prompt at runtime — it is no longer hardcoded.
// ---------------------------------------------------------------------------

export const learnerProfile = {
  userName: 'Sonnevelt', // how the coach addresses the learner
  lastName: 'Sonnevelt', // used in self-introduction examples
  company: 'Family Chicken',
  nativeLanguage: 'Nederlands',
  targetLanguage: 'Duits',
};

// Values pre-filled on the Setup screen.
export const defaultCallSetup = {
  scenario: 'Bellen over een monsterpakket van onze kipproducten.',
  persona: 'Inkoper bij een Duitse supermarktketen',
};

// Quick-pick suggestions (tap a chip to fill the field).
export const scenarioSuggestions = [
  'Bellen over een monsterpakket',
  'Koude acquisitie (walk-in)',
  'Een klacht over een levering oplossen',
  'Prijsonderhandeling met een inkoper',
  'Een afspraak inplannen',
];

export const personaSuggestions = [
  'Supermarktmanager',
  'Inkoper (Einkäufer)',
  'Poortwachter / secretaresse',
  'Chef-kok van een restaurant',
  'Groothandel-inkoper',
];
