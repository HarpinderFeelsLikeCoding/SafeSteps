export interface CrashData {
  _id?: string;
  borough?: string;
  on_street_name?: string;
  crash_date?: string;
  vehicle_types?: string[];
  contributing_factors?: string[];
  latitude?: number;
  longitude?: number;
  injuries_total?: number;
  deaths_total?: number;
}

export interface RouteData {
  id: string;
  name: string;
  coordinates: [number, number][];
  distance: string;
  duration: string;
  safetyScore: number;
  type: 'fastest' | 'safest' | 'balanced';
}

export interface SafetyScore {
  routeId: string;
  score: number;
  factors: {
    crashFrequency: number;
    severity: number;
    timeOfDay: number;
    weather: number;
  };
  recommendations: string[];
}

export interface RouteSegment {
  start: [number, number];
  end: [number, number];
  safetyScore: number;
  crashCount: number;
  riskFactors: string[];
}