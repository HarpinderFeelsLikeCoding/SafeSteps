import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon, LatLngTuple } from 'leaflet';
import { Navigation, MapPin, AlertTriangle, Shield, Clock, Route, Database, Zap, Cloud } from 'lucide-react';
import SearchPanel from './components/SearchPanel';
import SafetyPanel from './components/SafetyPanel';
import RoutePanel from './components/RoutePanel';
import { CrashData, RouteData } from './types';
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
  const [origin, setOrigin] = useState<string>('Times Square, New York, NY');
  const [destination, setDestination] = useState<string>('Brooklyn Bridge, New York, NY');
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [travelMode, setTravelMode] = useState<'driving' | 'walking' | 'bicycling'>('driving');
  const [apiStatus, setApiStatus] = useState<any>(null);

  // Check API health on component mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const health = await apiService.healthCheck();
      setApiStatus(health.services);
    } catch (error) {
      console.error('API health check failed:', error);
      setApiStatus({ mongodb: 'disconnected', openai: 'not configured', googleCloud: 'not configured' });
    }
  };

  const computeRoutes = async () => {
    if (!origin || !destination) return;
    
    setLoading(true);
    
    try {
      const response = await apiService.computeRoutes(origin, destination, travelMode);
      
      setRoutes(response.routes);
      setSelectedRoute(response.routes[0]);

    } catch (error) {
      console.error('Error computing routes:', error);
      // Show error to user
    } finally {
      setLoading(false);
    }
  };

  const analyzeRoute = async (route: RouteData) => {
    try {
      const analysis = await apiService.analyzeRoute(route.id, route.summary, route.coordinates);
      
      // Update route with detailed analysis
      const updatedRoute = {
        ...route,
        detailedAnalysis: analysis.analysis,
        crashes: analysis.crashes
      };
      
      setSelectedRoute(updatedRoute);
      
      // Update routes array
      setRoutes(prev => prev.map(r => r.id === route.id ? updatedRoute : r));
      
    } catch (error) {
      console.error('Error analyzing route:', error);
    }
  };

  const handleRouteSelect = (route: RouteData) => {
    setSelectedRoute(route);
    analyzeRoute(route);
  };

  const getRouteColor = (safetyScore: number) => {
    if (safetyScore >= 80) return '#22c55e'; // Green
    if (safetyScore >= 60) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getSafetyIcon = (score: number) => {
    if (score >= 80) return <Shield className="w-4 h-4 text-success-600" />;
    if (score >= 60) return <AlertTriangle className="w-4 h-4 text-warning-600" />;
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
              <p className="text-sm text-gray-600">Google Cloud + MongoDB Atlas Hackathon</p>
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
            <div className="flex items-center space-x-2">
              <Cloud className={`w-4 h-4 ${apiStatus?.googleCloud === 'configured' ? 'text-success-600' : 'text-danger-600'}`} />
              <span className="text-xs text-gray-600">Google Cloud</span>
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
            travelMode={travelMode}
            onOriginChange={setOrigin}
            onDestinationChange={setDestination}
            onTravelModeChange={setTravelMode}
            onSearch={computeRoutes}
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
              analysis={selectedRoute.detailedAnalysis}
            />
          )}
        </div>

        {/* Map Container */}
        <div className="flex-1 relative map-container">
          <MapContainer
            center={NYC_CENTER}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
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

            {/* Crash Markers */}
            {selectedRoute?.crashes?.slice(0, 20).map((crash: any, index: number) => (
              crash.latitude && crash.longitude && (
                <Marker
                  key={`crash-${index}`}
                  position={[crash.latitude, crash.longitude]}
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
                      {crash.vehicle_type_code1 && (
                        <p><strong>Vehicle:</strong> {crash.vehicle_type_code1}</p>
                      )}
                      {crash.number_of_persons_injured > 0 && (
                        <p><strong>Injuries:</strong> {crash.number_of_persons_injured}</p>
                      )}
                      {crash.number_of_persons_killed > 0 && (
                        <p className="text-danger-600 font-semibold">
                          <strong>Fatalities:</strong> {crash.number_of_persons_killed}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default App;