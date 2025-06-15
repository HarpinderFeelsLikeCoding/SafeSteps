import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon, LatLngTuple, LatLngBounds } from 'leaflet';
import { Navigation, MapPin, AlertTriangle, Shield, Clock, Route, Database, Zap, Cloud, X, Menu } from 'lucide-react';
import SearchPanel from './components/SearchPanel';
import SafetyPanel from './components/SafetyPanel';
import RoutePopup from './components/RoutePopup';
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

// Component to handle map centering
function MapController({ routes, selectedRoute }: { routes: RouteData[], selectedRoute: RouteData | null }) {
  const map = useMap();

  useEffect(() => {
    if (routes.length > 0) {
      // Get all coordinates from all routes
      const allCoords: LatLngTuple[] = [];
      routes.forEach(route => {
        if (route.coordinates && route.coordinates.length > 0) {
          route.coordinates.forEach(coord => {
            if (coord && coord.length === 2 && !isNaN(coord[0]) && !isNaN(coord[1])) {
              allCoords.push([coord[0], coord[1]]);
            }
          });
        }
      });

      if (allCoords.length > 0) {
        try {
          const bounds = new LatLngBounds(allCoords);
          map.fitBounds(bounds, { padding: [50, 50] });
        } catch (error) {
          console.log('Error fitting bounds, using first coordinate');
          map.setView(allCoords[0], 13);
        }
      }
    }
  }, [routes, map]);

  return null;
}

function App() {
  const [origin, setOrigin] = useState<string>('Times Square, New York, NY');
  const [destination, setDestination] = useState<string>('Brooklyn Bridge, New York, NY');
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [travelMode, setTravelMode] = useState<'driving' | 'walking' | 'bicycling'>('driving');
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showRoutePopup, setShowRoutePopup] = useState(false);
  const [showSafetyPanel, setShowSafetyPanel] = useState(false);

  // Check API health on component mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  // Show route popup when routes are computed
  useEffect(() => {
    if (routes.length > 0) {
      setShowRoutePopup(true);
      setShowSearchPanel(false);
    }
  }, [routes]);

  const checkApiHealth = async () => {
    try {
      console.log('🏥 Checking API health...');
      const health = await apiService.healthCheck();
      console.log('✅ API health response:', health);
      setApiStatus(health.services);
      setError(null);
    } catch (error) {
      console.error('❌ API health check failed:', error);
      setApiStatus({ mongodb: 'disconnected', openai: 'not configured', googleCloud: 'not configured' });
      setError('API connection failed - using demo mode');
    }
  };

  const computeRoutes = async () => {
    if (!origin || !destination) {
      setError('Please enter both origin and destination');
      return;
    }
    
    console.log('🚀 Starting route computation...');
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📍 Computing route: ${origin} → ${destination} (${travelMode})`);
      const response = await apiService.computeRoutes(origin, destination, travelMode);
      
      console.log('✅ Route computation successful:', response);
      
      // Safely process the routes
      const processedRoutes = (response.routes || []).map((route: any, index: number) => ({
        id: route.id || `route_${index}`,
        name: route.name || (index === 0 ? 'Recommended Route' : `Alternative ${index}`),
        summary: route.summary || 'Route via city streets',
        distance: route.distance || { text: 'Unknown', value: 0 },
        duration: route.duration || { text: 'Unknown', value: 0 },
        coordinates: route.coordinates || [],
        polyline: route.polyline || '',
        crashes: route.crashes || [],
        safetyScore: route.safetyScore || 75,
        safetyAnalysis: route.safetyAnalysis,
        type: index === 0 ? 'recommended' : 'alternative'
      })) as RouteData[];

      console.log('📊 Processed routes:', processedRoutes);
      
      setRoutes(processedRoutes);
      if (processedRoutes.length > 0) {
        setSelectedRoute(processedRoutes[0]);
      }

    } catch (error: any) {
      console.error('❌ Error computing routes:', error);
      setError(`Failed to compute routes: ${error.message || 'Unknown error'}`);
      
      // Set demo routes as fallback
      const demoRoutes: RouteData[] = [{
        id: 'demo_route',
        name: 'Demo Route',
        summary: 'Demo route via Broadway',
        distance: { text: '2.1 mi', value: 3380 },
        duration: { text: '12 mins', value: 720 },
        coordinates: [
          [40.7580, -73.9855], // Times Square
          [40.7505, -73.9934], // Herald Square
          [40.7282, -73.9942], // Union Square
          [40.7061, -73.9969]  // Brooklyn Bridge
        ],
        polyline: 'demo_polyline',
        crashes: [],
        safetyScore: 85,
        type: 'recommended'
      }];
      
      setRoutes(demoRoutes);
      setSelectedRoute(demoRoutes[0]);
    } finally {
      setLoading(false);
    }
  };

  const analyzeRoute = async (route: RouteData) => {
    if (!route.coordinates || route.coordinates.length === 0) {
      console.log('⚠️ No coordinates available for route analysis');
      return;
    }

    try {
      console.log('🧠 Starting route analysis for:', route.id);
      const analysis = await apiService.analyzeRoute(route.id, route.summary, route.coordinates);
      
      console.log('✅ Route analysis complete:', analysis);
      
      // Update route with detailed analysis
      const updatedRoute = {
        ...route,
        detailedAnalysis: analysis.analysis,
        crashes: analysis.crashes || []
      };
      
      setSelectedRoute(updatedRoute);
      
      // Update routes array
      setRoutes(prev => prev.map(r => r.id === route.id ? updatedRoute : r));
      
    } catch (error: any) {
      console.error('❌ Error analyzing route:', error);
      // Don't show error to user for analysis - just use basic route data
    }
  };

  const handleRouteSelect = (route: RouteData) => {
    console.log('📍 Route selected:', route.id);
    setSelectedRoute(route);
    setShowRoutePopup(false);
    setShowSafetyPanel(true);
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

  // Safe crash data rendering
  const renderCrashMarkers = () => {
    if (!selectedRoute?.crashes) return null;
    
    return selectedRoute.crashes.slice(0, 20).map((crash: any, index: number) => {
      // Handle both field name formats (original and processed)
      const latitude = crash.LATITUDE || crash.latitude;
      const longitude = crash.LONGITUDE || crash.longitude;
      
      if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
        return null;
      }

      return (
        <Marker
          key={`crash-${index}`}
          position={[parseFloat(latitude), parseFloat(longitude)]}
        >
          <Popup>
            <div className="max-w-xs">
              <div className="flex items-center mb-2">
                <AlertTriangle className="w-4 h-4 text-danger-600 mr-2" />
                <strong>Crash Report</strong>
              </div>
              <p><strong>Date:</strong> {crash.CRASH_DATE || crash.crash_date || 'Unknown'}</p>
              <p><strong>Location:</strong> {crash.ON_STREET_NAME || crash.on_street_name || 'Unknown'}</p>
              <p><strong>Borough:</strong> {crash.BOROUGH || crash.borough || 'Unknown'}</p>
              {(crash.VEHICLE_TYPE_CODE_1 || crash.vehicle_type_code1) && (
                <p><strong>Vehicle:</strong> {crash.VEHICLE_TYPE_CODE_1 || crash.vehicle_type_code1}</p>
              )}
              {(crash.NUMBER_OF_PERSONS_INJURED || crash.number_of_persons_injured) > 0 && (
                <p><strong>Injuries:</strong> {crash.NUMBER_OF_PERSONS_INJURED || crash.number_of_persons_injured}</p>
              )}
              {(crash.NUMBER_OF_PERSONS_KILLED || crash.number_of_persons_killed) > 0 && (
                <p className="text-danger-600 font-semibold">
                  <strong>Fatalities:</strong> {crash.NUMBER_OF_PERSONS_KILLED || crash.number_of_persons_killed}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      );
    }).filter(Boolean);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50 relative">
      {/* Full Screen Map */}
      <div className="absolute inset-0">
        <MapContainer
          center={NYC_CENTER}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* Auto-center map when routes change */}
          <MapController routes={routes} selectedRoute={selectedRoute} />

          {/* Route Lines */}
          {routes.map((route) => {
            if (!route.coordinates || route.coordinates.length === 0) return null;
            
            return (
              <Polyline
                key={route.id}
                positions={route.coordinates}
                color={getRouteColor(route.safetyScore)}
                weight={selectedRoute?.id === route.id ? 6 : 4}
                opacity={selectedRoute?.id === route.id ? 1 : 0.6}
              />
            );
          })}

          {/* Crash Markers */}
          {renderCrashMarkers()}
        </MapContainer>
      </div>

      {/* Floating Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-500 p-2 rounded-lg">
              <Navigation className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SafeStep</h1>
              <p className="text-xs text-gray-600">AI-Powered Route Safety</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* API Status */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Database className={`w-3 h-3 ${apiStatus?.mongodb === 'connected' ? 'text-success-600' : 'text-danger-600'}`} />
                <span className="text-xs text-gray-600">DB</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className={`w-3 h-3 ${apiStatus?.openai === 'configured' ? 'text-success-600' : 'text-danger-600'}`} />
                <span className="text-xs text-gray-600">AI</span>
              </div>
              <div className="flex items-center space-x-1">
                <Cloud className={`w-3 h-3 ${apiStatus?.googleCloud === 'configured' ? 'text-success-600' : 'text-danger-600'}`} />
                <span className="text-xs text-gray-600">Cloud</span>
              </div>
            </div>

            {/* Menu Button */}
            <button
              onClick={() => setShowSearchPanel(true)}
              className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Error Banner */}
        {error && (
          <div className="px-6 pb-3">
            <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-4 h-4 text-warning-600 mr-2" />
                <span className="text-sm text-warning-800">{error}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Panel Overlay */}
      {showSearchPanel && (
        <div className="absolute inset-0 z-[1100] bg-black/50 backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-full max-w-md h-full bg-white shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Plan Route</h2>
              <button
                onClick={() => setShowSearchPanel(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
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
            </div>
          </div>
        </div>
      )}

      {/* Route Selection Popup */}
      {showRoutePopup && routes.length > 0 && (
        <RoutePopup
          routes={routes}
          selectedRoute={selectedRoute}
          onRouteSelect={handleRouteSelect}
          onClose={() => setShowRoutePopup(false)}
          getSafetyIcon={getSafetyIcon}
        />
      )}

      {/* Safety Panel Overlay */}
      {showSafetyPanel && selectedRoute && (
        <div className="absolute inset-0 z-[1100] bg-black/50 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-full max-w-md h-full bg-white shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Safety Analysis</h2>
              <button
                onClick={() => setShowSafetyPanel(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-full overflow-y-auto pb-20">
              <SafetyPanel
                route={selectedRoute}
                analysis={selectedRoute.detailedAnalysis}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="absolute bottom-6 right-6 z-[1000] flex flex-col space-y-3">
        {selectedRoute && (
          <button
            onClick={() => setShowSafetyPanel(true)}
            className="bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all border border-gray-200"
            title="View Safety Analysis"
          >
            <Shield className="w-6 h-6 text-primary-600" />
          </button>
        )}
        
        {routes.length > 0 && (
          <button
            onClick={() => setShowRoutePopup(true)}
            className="bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all border border-gray-200"
            title="View Route Options"
          >
            <Route className="w-6 h-6 text-primary-600" />
          </button>
        )}
      </div>
    </div>
  );
}

export default App;