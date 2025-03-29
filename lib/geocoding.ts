import { 
  MapboxGeocodeResponse, 
  MapboxFeature, 
  NormalizedLocation,
  GeocodingError,
  AutocompleteSuggestion
} from '@/types/geocoding';
import { STATE_ABBREVIATIONS } from './stateMapping';

const MAPBOX_API_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

// Types of places we'll accept from Mapbox
const VALID_PLACE_TYPES = ['postcode', 'place', 'locality', 'address', 'neighborhood', 'region'];

/**
 * Gets autocomplete suggestions from Mapbox for a given search term
 */
export async function getLocationSuggestions(
  searchTerm: string
): Promise<AutocompleteSuggestion[]> {
  if (!searchTerm || searchTerm.trim().length < 2) {
    return [];
  }

  try {
    const response = await fetch(
      `${MAPBOX_API_URL}/${encodeURIComponent(searchTerm)}.json?` +
      `access_token=${MAPBOX_ACCESS_TOKEN}&` +
      `autocomplete=true&` +
      `country=us&` + // US only
      `types=postcode,place,address,locality,neighborhood,region&` +
      `limit=5`
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data: MapboxGeocodeResponse = await response.json();

    return data.features.map(feature => ({
      id: feature.id,
      text: feature.text,
      placeName: feature.place_name,
      ...extractCityState(feature)
    }));

  } catch (error) {
    console.error('Error getting location suggestions:', error);
    return [];
  }
}

/**
 * Normalizes a location input to a city and state
 */
export async function normalizeLocation(
  input: string
): Promise<NormalizedLocation | GeocodingError> {
  if (!input || input.trim().length === 0) {
    return { message: 'Please enter a location' };
  }

  try {
    const response = await fetch(
      `${MAPBOX_API_URL}/${encodeURIComponent(input)}.json?` +
      `access_token=${MAPBOX_ACCESS_TOKEN}&` +
      `country=us&` + // US only
      `types=postcode,place,address,locality,neighborhood,region&` +
      `limit=1`
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data: MapboxGeocodeResponse = await response.json();

    if (data.features.length === 0) {
      return { message: 'Location not found. Please try a different search.' };
    }

    const feature = data.features[0];
    
    // Check if the feature is a valid place type
    if (!feature.place_type.some(type => VALID_PLACE_TYPES.includes(type))) {
      return { message: 'Invalid location type. Please enter a city, address, or ZIP code.' };
    }

    const cityState = extractCityState(feature);
    
    if (!cityState.city || !cityState.state) {
      return { message: 'Could not determine city and state. Please try a more specific location.' };
    }

    // Get full state name from abbreviation
    const stateName = cityState.state ? (STATE_ABBREVIATIONS[cityState.state] || cityState.state) : '';
    
    if (!stateName) {
      return { message: 'Could not determine state. Please try a more specific location.' };
    }

    return {
      city: cityState.city,
      state: cityState.state,
      stateName: stateName,
      longitude: feature.center[0],
      latitude: feature.center[1],
      fullAddress: feature.place_name
    };

  } catch (error) {
    console.error('Error normalizing location:', error);
    return { 
      message: 'Error processing location. Please try again.',
      code: 'GEOCODING_ERROR'
    };
  }
}

/**
 * Extracts city and state from a Mapbox feature
 */
function extractCityState(feature: MapboxFeature): { city?: string; state?: string; stateName?: string } {
  const result: { city?: string; state?: string; stateName?: string } = {};
  
  // For postal codes, cities, and neighborhoods
  if (
    feature.place_type.includes('postcode') || 
    feature.place_type.includes('neighborhood')
  ) {
    // Find the city and state from context
    for (const item of feature.context || []) {
      if (item.id.startsWith('place.')) {
        result.city = item.text;
      }
      if (item.id.startsWith('region.') && item.short_code) {
        const stateCode = item.short_code.toUpperCase().replace('US-', '');
        result.state = stateCode;
        result.stateName = STATE_ABBREVIATIONS[stateCode] || stateCode;
      }
    }
  }
  
  // For cities (places)
  else if (feature.place_type.includes('place')) {
    result.city = feature.text;
    
    // Find the state from context
    for (const item of feature.context || []) {
      if (item.id.startsWith('region.') && item.short_code) {
        const stateCode = item.short_code.toUpperCase().replace('US-', '');
        result.state = stateCode;
        result.stateName = STATE_ABBREVIATIONS[stateCode] || stateCode;
        break;
      }
    }
  }
  
  // For addresses
  else if (feature.place_type.includes('address')) {
    // Find the city and state from context
    for (const item of feature.context || []) {
      if (item.id.startsWith('place.')) {
        result.city = item.text;
      }
      if (item.id.startsWith('region.') && item.short_code) {
        const stateCode = item.short_code.toUpperCase().replace('US-', '');
        result.state = stateCode;
        result.stateName = STATE_ABBREVIATIONS[stateCode] || stateCode;
      }
    }
  }
  
  // For regions (states)
  else if (feature.place_type.includes('region')) {
    const stateCode = (feature.properties as { short_code?: string }).short_code?.toUpperCase().replace('US-', '') || feature.text;
    result.state = stateCode;
    result.stateName = STATE_ABBREVIATIONS[stateCode] || stateCode;
  }
  
  return result;
}