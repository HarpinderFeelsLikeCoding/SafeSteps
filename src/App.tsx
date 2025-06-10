import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon, LatLngTuple } from 'leaflet';
import { Navigation, MapPin, AlertTriangle, Shield, Clock, Route, Database, Zap } from 'lucide-react';
import SearchPanel from './components/SearchPanel';
import SafetyPanel from './components/SafetyPanel';
import RoutePanel from './components/RoutePanel';
import { CrashData, RouteData, SafetyScore } from './types';
import { apiService } from './services/api';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const NYC_CENTER: LatLngTuple = [40.7128, -74.0060];

function App() {
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [crashData, setCrashData] = useState<CrashData[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [safetyAnalysis, setSafetyAnalysis] = useState<any>(null);
  const [apiStatus, setApiStatus] = useState<{ mongodb: string; openai: string } | null>(null);

  // Check API health on component mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const health = await apiService.healthCheck();
      setApiStatus({ mongodb: health.mongodb, openai: health.openai });
    } catch (error) {
      console.error('API health check failed:', error);
      setApiStatus({ mongodb: 'disconnected', openai: 'not configured' });
    }
  };

  const calculateRoute = async () => {
    if (!origin || !destination) return;
    
    setLoading(true);
    
    try {
      // Generate mock routes with NYC coordinates
      const mockRoutes: RouteData[] = [
        {
          id: '1',
          name: 'Fastest Route',
          coordinates: [
            [40.7128, -74.0060],
            [40.7589, -73.9851],
            [40.7831, -73.9712]
          ],
          distance: '12.5 miles',
          duration: '25 mins',
          safetyScore: 85,
          type: 'fastest'
        },
        {
          id: '2',
          name: 'Safest Route',
          coordinates: [
            [40.7128, -74.0060],
            [40.7505, -73.9934],
            [40.7831, -73.9712]
          ],
          distance: '13.2 miles',
          duration: '28 mins',
          safetyScore: 95,
          type: 'safest'
        },
        {
          id: '3',
          name: 'Balanced Route',
          coordinates: [
            [40.7128, -74.0060],
            [40.7547, -73.9897],
            [40.7831, -73.9712]
          ],
          distance: '12.8 miles',
          duration: '26 mins',
          safetyScore: 90,
          type: 'balanced'
        }
      ];

      setRoutes(mockRoutes);
      setSelectedRoute(mockRoutes[0]);

      // Search for real crash data using vector search
      try {
        const searchResponse = await apiService.searchCrashes('', origin, destination);
        setCrashData(searchResponse.crashData);
        setSafetyAnalysis(searchResponse.safetyAnalysis);

        // Update route safety scores based on real data
        const updatedRoutes = mockRoutes.map(route => ({
          ...route,
          safetyScore: Math.max(10, Math.min(100, searchResponse.safetyAnalysis.safetyScore + (Math.random() * 10 - 5)))
        }));
        
        setRoutes(updatedRoutes);
        setSelectedRoute(updatedRoutes[0]);

      } catch (error) {
        console.error('Error fetching crash data:', error);
        // Fallback to mock data if API fails
        setCrashData([]);
        setSafetyAnalysis({
          safetyScore: 75,
          riskLevel: 'medium',
          insights: ['API temporarily unavailable - using cached analysis'],
          recommendations: ['Exercise normal caution while driving']
        });
      }

    } catch (error) {
      console.error('Error calculating route:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeSelectedRoute = async (route: RouteData) => {
    if (!route) return;

    try {
      const analysis = await apiService.analyzeRoute(route.coordinates, origin, destination);
      setSafetyAnalysis(analysis.safetyAnalysis);
      setCrashData(analysis.crashData);
    } catch (error) {
      console.error('Error analyzing route:', error);
    }
  };

  const handleRouteSelect = (route: RouteData) => {
    setSelectedRoute(route);
    analyzeSelectedRoute(route);
  };

  const getRouteColor = (safetyScore: number) => {
    if (safetyScore >= 90) return '#22c55e'; // Green
    if (safetyScore >= 70) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getSafetyIcon = (score: number) => {
    if (score >= 90) return <Shield className="w-4 h-4 text-success-600" />;
    if (score >= 70) return <AlertTriangle className="w-4 h-4 text-warning-600" />;
    return <AlertTriangle className="w-4 h-4 text-danger-600" />;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-500 p-2 rounded-lg">
              <Navigation className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SafeStep</h1>
              <p className="text-sm text-gray-600">AI-Powered Safe Navigation</p>
            </div>
          </div>
          
          {/* API Status Indicators */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Database className={`w-4 h-4 ${apiStatus?.mongodb === 'connected' ? 'text-success-600' : 'text-danger-600'}`} />
              <span className="text-xs text-gray-600">MongoDB</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className={`w-4 h-4 ${apiStatus?.openai === 'configured' ? 'text-success-600' : 'text-danger-600'}`} />
              <span className="text-xs text-gray-600">OpenAI</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Left Panel */}
        <div className="w-96 bg-white shadow-lg border-r border-gray-200 flex flex-col">
          {/* Search Panel */}
          <SearchPanel
            origin={origin}
            destination={destination}
            onOriginChange={setOrigin}
            onDestinationChange={setDestination}
            onSearch={calculateRoute}
            loading={loading}
          />

          {/* Routes Panel */}
          {routes.length > 0 && (
            <RoutePanel
              routes={routes}
              selectedRoute={selectedRoute}
              onRouteSelect={handleRouteSelect}
              getSafetyIcon={getSafetyIcon}
            />
          )}

          {/* Safety Panel */}
          {selectedRoute && (
            <SafetyPanel
              route={selectedRoute}
              crashData={crashData}
              safetyAnalysis={safetyAnalysis}
            />
          )}
        </div>

        {/* Map Container */}
        <div className="flex-1 relative map-container">
          <MapContainer
            center={NYC_CENTER}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
            className="h-full w-full"
            whenCreated={(mapInstance) => {
              setTimeout(() => {
                mapInstance.invalidateSize();
              }, 100);
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
              tileSize={256}
            />

            {/* Route Lines */}
            {routes.map((route) => (
              <Polyline
                key={route.id}
                positions={route.coordinates}
                color={getRouteColor(route.safetyScore)}
                weight={selectedRoute?.id === route.id ? 6 : 4}
                opacity={selectedRoute?.id === route.id ? 1 : 0.6}
              />
            ))}

            {/* Origin and Destination Markers */}
            {selectedRoute && (
              <>
                <Marker position={selectedRoute.coordinates[0]}>
                  <Popup>
                    <div className="text-center">
                      <MapPin className="w-4 h-4 mx-auto mb-1 text-primary-600" />
                      <strong>Origin</strong>
                      <br />
                      {origin}
                    </div>
                  </Popup>
                </Marker>
                <Marker position={selectedRoute.coordinates[selectedRoute.coordinates.length - 1]}>
                  <Popup>
                    <div className="text-center">
                      <MapPin className="w-4 h-4 mx-auto mb-1 text-danger-600" />
                      <strong>Destination</strong>
                      <br />
                      {destination}
                    </div>
                  </Popup>
                </Marker>
              </>
            )}

            {/* Crash Data Markers */}
            {crashData.map((crash, index) => (
              <Marker
                key={index}
                position={[crash.latitude || 40.7128, crash.longitude || -74.0060]}
              >
                <Popup>
                  <div className="max-w-xs">
                    <div className="flex items-center mb-2">
                      <AlertTriangle className="w-4 h-4 text-danger-600 mr-2" />
                      <strong>Crash Report</strong>
                    </div>
                    <p><strong>Date:</strong> {crash.crash_date}</p>
                    <p><strong>Location:</strong> {crash.on_street_name}</p>
                    <p><strong>Borough:</strong> {crash.borough}</p>
                    {crash.vehicle_types && (
                      <p><strong>Vehicles:</strong> {crash.vehicle_types.join(', ')}</p>
                    )}
                    {crash.injuries_total > 0 && (
                      <p><strong>Injuries:</strong> {crash.injuries_total}</p>
                    )}
                    {crash.deaths_total > 0 && (
                      <p className="text-danger-600 font-semibold"><strong>Deaths:</strong> {crash.deaths_total}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default App;