import { normalizeLocation } from "@/lib/geocoding";
import { STATE_ABBREVIATIONS } from "@/lib/stateMapping";
import type { NormalizedLocation, GeocodingError } from "@/types/geocoding";
import type { ParsedLocation } from "./types";

type StateEntry = {
  abbr: string;
  fullName: string;
};

const STATE_ENTRIES: StateEntry[] = Object.entries(STATE_ABBREVIATIONS).map(
  ([abbr, fullName]) => ({ abbr, fullName })
);

const STOP_WORDS = new Set([
  "election",
  "elections",
  "results",
  "candidate",
  "candidates",
  "profile",
  "find",
  "who",
  "won",
  "for",
  "the",
  "current",
  "live",
  "local",
  "city",
  "county",
  "state",
  "in",
  "of",
]);

function titleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function cleanCitySegment(segment: string): string {
  const cleaned = segment
    .replace(/[,;:]+/g, " ")
    .replace(/\b(?:and|or|for|the|about|info|information)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const parts = cleaned
    .split(" ")
    .filter((word) => word && !STOP_WORDS.has(word.toLowerCase()));

  const candidate = titleCase(parts.join(" "));
  return candidate.length > 1 ? candidate : "";
}

function tryHeuristicParse(query: string): ParsedLocation | null {
  const lower = query.toLowerCase();
  for (const { abbr, fullName } of STATE_ENTRIES) {
    const fullLower = fullName.toLowerCase();
    const abbrLower = abbr.toLowerCase();

    let stateMatchIndex = lower.indexOf(fullLower);
    let matchedState = fullName;
    let matchedAbbr = abbr;
    let matchedLength = fullLower.length;

    if (stateMatchIndex === -1) {
      const regex = new RegExp(`\\b${abbrLower}(?:\\.|\\b)`, "i");
      const abbrMatch = lower.match(regex);
      if (abbrMatch && abbrMatch.index != null) {
        stateMatchIndex = abbrMatch.index;
        matchedState = STATE_ABBREVIATIONS[abbr as keyof typeof STATE_ABBREVIATIONS];
        matchedAbbr = abbr;
        matchedLength = abbrMatch[0].length;
      }
    }

    if (stateMatchIndex === -1) continue;

    const beforeState = query.slice(0, stateMatchIndex).trim();
    const afterState = query
      .slice(stateMatchIndex + matchedLength)
      .trim()
      .replace(/^[,\s]+/, "");

    // Prefer the fragment immediately preceding the state name.
    const possibleCitySegments = [beforeState, afterState];

    for (const segment of possibleCitySegments) {
      if (!segment) continue;

      const directCity = cleanCitySegment(segment.split(/\b(?:in|near|around|for)\b/i).pop() ?? segment);
      if (directCity) {
        return {
          city: directCity,
          state: matchedAbbr,
          stateName: matchedState,
        };
      }
    }
  }
  return null;
}

export async function parseLocationFromQuery(
  query: string
): Promise<ParsedLocation | null> {
  const heuristics = tryHeuristicParse(query);
  if (heuristics) {
    return heuristics;
  }

  // Fallback to geocoding if a Mapbox token is available.
  if (process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    try {
      const normalized = await normalizeLocation(query);
      const isLocation = (value: unknown): value is NormalizedLocation => {
        if (!value || typeof value !== "object") return false;
        const loc = value as NormalizedLocation;
        return typeof loc.city === "string" && typeof loc.state === "string";
      };
      if (isLocation(normalized) && normalized.city && normalized.state) {
        return {
          city: titleCase(normalized.city),
          state: normalized.state.toUpperCase(),
          stateName: normalized.stateName ?? normalized.state,
        };
      }
      const error = normalized as GeocodingError;
      if (error?.message) {
        console.debug("semantic-routing: geocoding fallback", error.message);
      }
    } catch (error) {
      console.warn("semantic-routing: normalizeLocation failed", error);
    }
  }

  return null;
}
