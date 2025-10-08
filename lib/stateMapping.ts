export const STATE_ABBREVIATIONS: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  DC: 'District of Columbia',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming'
}; 


// Function to normalize state input - returns full state name when possible
export function normalizeState(state: string | null): string | null {
  if (!state) {
    return null;
  }

  const trimmed = state.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.toLowerCase() === "all") {
    return "all";
  }

  if (trimmed.length === 2) {
    const upper = trimmed.toUpperCase();
    return STATE_ABBREVIATIONS[upper] ?? null;
  }

  const normalized = trimmed.replace(/\s+/g, " ").toLowerCase();
  const match = Object.values(STATE_ABBREVIATIONS).find(
    (fullState) => fullState.toLowerCase() === normalized
  );

  return match ?? null;
}
