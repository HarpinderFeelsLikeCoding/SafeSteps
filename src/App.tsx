import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon, LatLngTuple, LatLngBounds } from 'leaflet';
import { Navigation, MapPin, AlertTriangle, Shield, Clock, Route, Database, Zap, Cloud, X, Menu, Search, Car, User, Bike } from 'lucide-react';
import SafetyPanel from './components/SafetyPanel';
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
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [showSafetyPanel, setShowSafetyPanel] = useState(false);

  // Check API health on component mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  // Show route panel when routes are computed
  useEffect(() => {
    if (routes.length > 0) {
      setShowRoutePanel(true);
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
    setShowRoutePanel(false);
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

  const travelModes = [
    { id: 'driving', label: 'Driving', icon: Car },
    { id: 'walking', label: 'Walking', icon: User },
    { id: 'bicycling', label: 'Cycling', icon: Bike }
  ];

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
      <div className="absolute top-6 left-6 right-6 z-[1000] bg-white/95 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-200">
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
          
          {/* API Status */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Database className={`w-4 h-4 ${apiStatus?.mongodb === 'connected' ? 'text-success-600' : 'text-danger-600'}`} />
              <span className="text-sm text-gray-600">DB</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap className={`w-4 h-4 ${apiStatus?.openai === 'configured' ? 'text-success-600' : 'text-danger-600'}`} />
              <span className="text-sm text-gray-600">AI</span>
            </div>
            <div className="flex items-center space-x-1">
              <Cloud className={`w-4 h-4 ${apiStatus?.googleCloud === 'configured' ? 'text-success-600' : 'text-danger-600'}`} />
              <span className="text-sm text-gray-600">Cloud</span>
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={() => setShowSearchPanel(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors flex items-center space-x-2 shadow-lg"
          >
            <Search className="w-5 h-5" />
            <span className="font-medium">Plan Route</span>
          </button>
        </div>
        
        {/* Error Banner */}
        {error && (
          <div className="px-6 pb-4">
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
        <div className="absolute inset-0 z-[1100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-500 p-2 rounded-lg">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Plan Your Route</h2>
                  <p className="text-sm text-gray-600">AI-powered safety analysis</p>
                </div>
              </div>
              <button
                onClick={() => setShowSearchPanel(false)}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter starting location..."
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="relative">
                  <Navigation className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter destination..."
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Travel Mode Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Travel Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    {travelModes.map((mode) => {
                      const IconComponent = mode.icon;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setTravelMode(mode.id as any)}
                          className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center space-y-2 ${
                            travelMode === mode.id
                              ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <IconComponent className="w-5 h-5" />
                          <span className="text-xs font-medium">{mode.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={computeRoutes}
                  disabled={loading || !origin || !destination}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 px-4 rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span className="font-medium">Computing Routes...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      <span className="font-medium">Find Safe Routes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Route Selection Panel */}
      {showRoutePanel && routes.length > 0 && (
        <div className="absolute top-24 left-6 z-[1100] bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-200 max-w-sm w-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100 rounded-t-2xl">
            <div className="flex items-center space-x-2">
              <Route className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Route Options</h3>
            </div>
            <button
              onClick={() => setShowRoutePanel(false)}
              className="p-1 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {routes.map((route, index) => {
              const safetyScore = route.safetyScore || 75;
              
              return (
                <div
                  key={route.id}
                  onClick={() => handleRouteSelect(route)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg transform hover:scale-[1.02] ${
                    selectedRoute?.id === route.id
                      ? 'border-primary-500 bg-primary-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                        {route.name}
                      </span>
                      {index === 0 && (
                        <span className="px-2 py-1 text-xs font-bold bg-success-100 text-success-700 rounded-full">
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    <div className={`px-2 py-1 text-sm font-bold rounded-full flex items-center space-x-1 ${
                      safetyScore >= 80 ? 'text-success-600 bg-success-50' :
                      safetyScore >= 60 ? 'text-warning-600 bg-warning-50' : 'text-danger-600 bg-danger-50'
                    }`}>
                      {getSafetyIcon(safetyScore)}
                      <span>{Math.round(safetyScore)}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{route.duration?.text || 'Unknown'}</span>
                    </div>
                    <div>
                      <span>{route.distance?.text || 'Unknown'}</span>
                    </div>
                  </div>
                  
                  {route.summary && (
                    <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                      Via {route.summary}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Safety Analysis Panel */}
      {showSafetyPanel && selectedRoute && (
        <div className="absolute top-24 right-6 z-[1100] bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl border border-gray-200 max-w-md w-full max-h-[calc(100vh-8rem)]">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100 rounded-t-2xl">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Safety Analysis</h3>
            </div>
            <button
              onClick={() => setShowSafetyPanel(false)}
              className="p-1 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          <div className="overflow-y-auto max-h-[calc(100vh-12rem)]">
            <SafetyPanel
              route={selectedRoute}
              analysis={selectedRoute.detailedAnalysis}
            />
          </div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="absolute bottom-6 right-6 z-[1000] flex flex-col space-y-3">
        {selectedRoute && (
          <button
            onClick={() => setShowSafetyPanel(!showSafetyPanel)}
            className="bg-white/95 backdrop-blur-sm p-3 rounded-full shadow-xl hover:shadow-2xl transition-all border border-gray-200 transform hover:scale-110"
            title="Toggle Safety Analysis"
          >
            <Shield className="w-6 h-6 text-primary-600" />
          </button>
        )}
        
        {routes.length > 0 && (
          <button
            onClick={() => setShowRoutePanel(!showRoutePanel)}
            className="bg-white/95 backdrop-blur-sm p-3 rounded-full shadow-xl hover:shadow-2xl transition-all border border-gray-200 transform hover:scale-110"
            title="Toggle Route Options"
          >
            <Route className="w-6 h-6 text-primary-600" />
          </button>
        )}
      </div>
    </div>
  );
}

export default App;