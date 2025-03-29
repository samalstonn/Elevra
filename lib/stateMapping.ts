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
  if (state == "all") {
    return "all"
  }
  if (state == null) {
    return null
  }
  // If it's a 2-letter abbreviation, convert to full state name
  if (state.length === 2) {
      const upperState = state.toUpperCase();
      if (STATE_ABBREVIATIONS[upperState]) {
          return STATE_ABBREVIATIONS[upperState]; // Return full state name
      }
  }
  
  // If it's already a full state name, return it properly capitalized
  const lowerState = state.toLowerCase();
  for (const [fullStateLower, abbr] of Object.entries(STATE_ABBREVIATIONS)) {
      if (lowerState === fullStateLower) {
          // Convert to proper case (first letter of each word capitalized)
          return fullStateLower
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
      }
  }
  
  // If it's a valid state name but not in perfect format, format it properly
  for (const fullStateLower of Object.keys(STATE_ABBREVIATIONS)) {
      if (lowerState === fullStateLower) {
          // Convert to proper case
          return fullStateLower
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
      }
  }
  
  // If we can't identify the state, return null
  return null;
}