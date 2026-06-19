// ---------------------------------------------------------------------------
// CONTEXT INJECTION
// ---------------------------------------------------------------------------
// Everything in this object is merged into the LLM system prompt (see
// ../config/prompts.js). Change it here to retarget the trainer to a different
// person, company, conversation partner or business scenario. You can also wire
// this up to a settings screen later and pass an override into useConversation.
// ---------------------------------------------------------------------------

export const businessContext = {
  // The learner (a native Dutch speaker practising German).
  userName: 'Sonnevelt', // how the coach addresses the learner
  lastName: 'Sonnevelt', // used in self-introduction examples
  company: 'Family Chicken',
  goal: 'Professionele zakelijke communicatie en verkoop in Duitsland.',

  // The AI persona on the other end of the "phone call".
  partnerName: 'Hansi',
  partnerRole:
    'Einkäufer bei einem deutschen Lebensmittelgroßhändler (a purchaser at a German food wholesaler).',

  // The business situation being role-played.
  scenario:
    'Ein telefonisches Verkaufsgespräch über die Lieferung von Geflügelprodukten ' +
    '(Hähnchen, Putenfleisch) von Family Chicken an einen deutschen Geschäftskunden: ' +
    'Mengen, Preise, Liefertermine, Qualität und Folgetermine.',
};
