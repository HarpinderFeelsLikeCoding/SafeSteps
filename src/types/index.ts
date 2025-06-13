export interface CrashData {
  _id?: string;
  crash_date?: string;
  crash_time?: string;
  borough?: string;
  on_street_name?: string;
  cross_street_name?: string;
  latitude?: number;
  longitude?: number;
  number_of_persons_injured?: number;
  number_of_persons_killed?: number;
  vehicle_type_code1?: string;
  contributing_factor_vehicle_1?: string;
  crash_narrative?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  narrative_embedding?: number[];
}

export interface RouteData {
  id: string;
  name: string;
  summary: string;
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  coordinates: [number, number][];
  polyline: string;
  crashes?: CrashData[];
  safetyScore: number;
  safetyAnalysis?: {
    safetyScore: number;
    riskLevel: string;
    insights: string[];
    recommendations: string[];
    keyRisks: string[];
  };
  detailedAnalysis?: {
    totalCrashes: number;
    nearbyCrashes: number;
    similarCrashes: number;
    safetyScore: number;
    riskLevel: string;
    insights: string[];
    recommendations: string[];
    keyRisks: string[];
  };
  type: 'recommended' | 'alternative';
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