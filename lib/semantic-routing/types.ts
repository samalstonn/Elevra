export type SemanticRouteType = "candidate" | "results" | "live-elections";

export interface SemanticRouteEntry {
  id: string;
  type: SemanticRouteType;
  url: string;
  embeddingText: string;
  keywords?: string[];
  weight?: number;
  data?: Record<string, unknown>;
}

export interface SemanticRouteScoredEntry {
  entry: SemanticRouteEntry;
  similarity: number;
  embedding: number[];
}

export type SemanticRouteSource = "embedding" | "keyword" | "fallback";

export interface SemanticRouteMatch {
  url: string;
  score: number;
  source: SemanticRouteSource;
  matchedEntry?: {
    id: string;
    type: SemanticRouteType;
    url: string;
    keywords?: string[];
  };
  rationale?: string;
  debug?: {
    topMatches?: Array<{
      id: string;
      score: number;
    }>;
  };
}

export interface ParsedLocation {
  city: string;
  state: string;
  stateName?: string;
}
