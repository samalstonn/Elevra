export interface MapboxFeature {
  id: string;
  type: string;
  place_type: string[];
  relevance: number;
  properties: {
    accuracy?: string;
    address?: string;
    category?: string;
    maki?: string;
    wikidata?: string;
  };
  text: string;
  place_name: string;
  center: [number, number]; // [longitude, latitude]
  geometry: {
    type: string;
    coordinates: [number, number];
  };
  context: {
    id: string;
    text: string;
    wikidata?: string;
    short_code?: string;
  }[];
}

export interface MapboxGeocodeResponse {
  type: string;
  query: string[];
  features: MapboxFeature[];
  attribution: string;
}

export interface NormalizedLocation {
  city: string;
  state: string; // State abbreviation (e.g., "WI")
  stateName: string; // Full state name (e.g., "Wisconsin")
  longitude?: number;
  latitude?: number;
  fullAddress?: string;
}

export interface GeocodingError {
  message: string;
  code?: string;
}

export interface AutocompleteSuggestion {
  id: string;
  text: string;
  placeName: string;
  city?: string;
  state?: string; // State abbreviation
  stateName?: string; // Full state name
  // Optional: when suggestion represents an election result
  electionId?: number;
}
