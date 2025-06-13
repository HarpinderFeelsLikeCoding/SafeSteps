const API_BASE_URL = 'http://localhost:5000/api';

export interface CrashSearchResponse {
  crashData: any[];
  safetyAnalysis: {
    safetyScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    insights: string[];
    recommendations: string[];
  };
  totalResults: number;
}

export interface RouteAnalysisResponse {
  crashData: any[];
  safetyAnalysis: {
    safetyScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    insights: string[];
    recommendations: string[];
  };
  routeAnalysis: {
    totalCrashes: number;
    recentCrashes: number;
  };
}

class ApiService {
  async searchCrashes(query: string, origin: string, destination: string): Promise<CrashSearchResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/search-crashes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, origin, destination }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching crashes:', error);
      throw error;
    }
  }

  async analyzeRoute(
    coordinates: [number, number][], 
    origin: string, 
    destination: string
  ): Promise<RouteAnalysisResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze-route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coordinates, origin, destination }),
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

  async addCrashData(crashData: any): Promise<{ success: boolean; insertedId?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/add-crash-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(crashData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding crash data:', error);
      throw error;
    }
  }

  async processEmbeddings(): Promise<{ success: boolean; processed: number; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/process-embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing embeddings:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string; mongodb: string; openai: string }> {
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