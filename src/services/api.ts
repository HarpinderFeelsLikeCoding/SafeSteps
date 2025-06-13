const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface RouteComputeResponse {
  origin: { lat: number; lng: number; formatted_address: string };
  destination: { lat: number; lng: number; formatted_address: string };
  routes: any[];
  metadata: {
    totalRoutes: number;
    safestRoute: string;
    travelMode: string;
  };
}

export interface RouteAnalysisResponse {
  routeId: string;
  analysis: {
    totalCrashes: number;
    nearbyCrashes: number;
    similarCrashes: number;
    safetyScore: number;
    riskLevel: string;
    insights: string[];
    recommendations: string[];
    keyRisks: string[];
  };
  crashes: any[];
  metadata: {
    analysisType: string;
    timestamp: string;
  };
}

class ApiService {
  async computeRoutes(origin: string, destination: string, travelMode: string = 'driving'): Promise<RouteComputeResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/compute-routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ origin, destination, travelMode }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error computing routes:', error);
      throw error;
    }
  }

  async analyzeRoute(routeId: string, routeSummary: string, coordinates: [number, number][]): Promise<RouteAnalysisResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze-route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ routeId, routeSummary, coordinates }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error analyzing route:', error);
      throw error;
    }
  }

  async ingestCrashData(crashes: any[]): Promise<{ success: boolean; processed: number; errors: number; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/ingest-crash-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ crashes }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error ingesting crash data:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string; services: { mongodb: string; openai: string; googleCloud: string }; timestamp: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();