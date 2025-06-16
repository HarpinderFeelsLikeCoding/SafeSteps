import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon, LatLngTuple, LatLngBounds } from 'leaflet';
import { Navigation, MapPin, AlertTriangle, Shield, Clock, Route, Database, Zap, Cloud, X, Menu, Search, Car, User, Bike, RefreshCw, ChevronRight, Star, TrendingUp } from 'lucide-react';
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
          map.fitBounds(bounds, { padding: [80, 80] });
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

  // New function to handle travel mode change and recompute routes
  const handleTravelModeChange = async (newMode: 'driving' | 'walking' | 'bicycling') => {
    setTravelMode(newMode);
    
    // If we have routes, recompute them with the new travel mode
    if (routes.length > 0 && origin && destination) {
      setLoading(true);
      setError(null);
      
      try {
        console.log(`🔄 Switching to ${newMode} mode and recomputing routes...`);
        const response = await apiService.computeRoutes(origin, destination, newMode);
        
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

        setRoutes(processedRoutes);
        if (processedRoutes.length > 0) {
          setSelectedRoute(processedRoutes[0]);
          analyzeRoute(processedRoutes[0]);
        }
        
        console.log(`✅ Routes updated for ${newMode} mode`);
      } catch (error: any) {
        console.error('❌ Error switching travel mode:', error);
        setError(`Failed to switch to ${newMode} mode`);
      } finally {
        setLoading(false);
      }
    }
  };

  const getRouteColor = (safetyScore: number) => {
    if (safetyScore >= 80) return '#10b981'; // Emerald
    if (safetyScore >= 60) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const getSafetyIcon = (score: number) => {
    if (score >= 80) return <Shield className="w-4 h-4 text-emerald-600" />;
    if (score >= 60) return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    return <AlertTriangle className="w-4 h-4 text-red-600" />;
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
                <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
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
                <p className="text-red-600 font-semibold">
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
    { id: 'driving', label: 'Drive', icon: Car },
    { id: 'walking', label: 'Walk', icon: User },
    { id: 'bicycling', label: 'Bike', icon: Bike }
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
                weight={selectedRoute?.id === route.id ? 8 : 6}
                opacity={selectedRoute?.id === route.id ? 1 : 0.7}
              />
            );
          })}

          {/* Crash Markers */}
          {renderCrashMarkers()}
        </MapContainer>
      </div>

      {/* Apple-Style Floating Header */}
      <div className="absolute top-6 left-6 right-6 z-[1000]">
        <div className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20">
          <div className="flex items-center justify-between px-8 py-5">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-2xl shadow-lg">
                <Navigation className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">SafeStep</h1>
                <p className="text-sm text-gray-600 font-medium">AI-Powered Route Safety</p>
              </div>
            </div>
            
            {/* Status Indicators */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${apiStatus?.mongodb === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium text-gray-700">Database</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${apiStatus?.openai === 'configured' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium text-gray-700">AI</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${apiStatus?.googleCloud === 'configured' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium text-gray-700">Cloud</span>
              </div>
            </div>

            {/* Search Button */}
            <button
              onClick={() => setShowSearchPanel(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
            >
              <Search className="w-5 h-5" />
              <span>Plan Route</span>
            </button>
          </div>
          
          {/* Error Banner */}
          {error && (
            <div className="px-8 pb-5">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mr-3" />
                  <span className="text-sm text-amber-800 font-medium">{error}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Apple-Style Search Panel */}
      {showSearchPanel && (
        <div className="absolute inset-0 z-[1100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-2xl">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Plan Your Route</h2>
                    <p className="text-sm text-gray-600 font-medium">AI-powered safety analysis</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSearchPanel(false)}
                  className="p-2 hover:bg-white/50 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-5">
                <div className="relative">
                  <div className="absolute left-4 top-4 w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <input
                    type="text"
                    placeholder="From"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900 font-medium placeholder-gray-500"
                  />
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-4 w-3 h-3 bg-red-500 rounded-full"></div>
                  <input
                    type="text"
                    placeholder="To"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900 font-medium placeholder-gray-500"
                  />
                </div>

                {/* Travel Mode Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">Travel Mode</label>
                  <div className="grid grid-cols-3 gap-3">
                    {travelModes.map((mode) => {
                      const IconComponent = mode.icon;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setTravelMode(mode.id as any)}
                          className={`p-4 rounded-2xl transition-all flex flex-col items-center space-y-2 font-medium ${
                            travelMode === mode.id
                              ? 'bg-blue-500 text-white shadow-lg transform scale-105'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <IconComponent className="w-6 h-6" />
                          <span className="text-sm">{mode.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={computeRoutes}
                  disabled={loading || !origin || !destination}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-5 px-6 rounded-2xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold text-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>Finding Safe Routes...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-6 h-6" />
                      <span>Find Safe Routes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apple-Style Route Selection Panel */}
      {showRoutePanel && routes.length > 0 && (
        <div className="absolute top-32 left-6 z-[1100] bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 max-w-sm w-full overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Route className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Route Options</h3>
                  <p className="text-sm text-gray-600">{routes.length} routes found</p>
                </div>
              </div>
              <button
                onClick={() => setShowRoutePanel(false)}
                className="p-2 hover:bg-white/50 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {routes.map((route, index) => {
              const safetyScore = route.safetyScore || 75;
              
              return (
                <div
                  key={route.id}
                  onClick={() => handleRouteSelect(route)}
                  className={`p-5 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02] ${
                    selectedRoute?.id === route.id
                      ? 'bg-blue-50 border-2 border-blue-200 shadow-md'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {index === 0 && (
                        <div className="bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          BEST
                        </div>
                      )}
                      <span className="font-semibold text-gray-900">
                        {route.name}
                      </span>
                    </div>
                    <div className={`px-3 py-1 text-sm font-bold rounded-full flex items-center space-x-1 ${
                      safetyScore >= 80 ? 'text-emerald-700 bg-emerald-100' :
                      safetyScore >= 60 ? 'text-amber-700 bg-amber-100' : 'text-red-700 bg-red-100'
                    }`}>
                      {getSafetyIcon(safetyScore)}
                      <span>{Math.round(safetyScore)}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{route.duration?.text || 'Unknown'}</span>
                    </div>
                    <div className="text-gray-600 font-medium">
                      {route.distance?.text || 'Unknown'}
                    </div>
                  </div>
                  
                  {route.summary && (
                    <p className="text-xs text-gray-500 bg-white/70 p-3 rounded-xl font-medium">
                      Via {route.summary}
                    </p>
                  )}

                  <div className="flex items-center justify-end mt-3">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Travel Mode Switcher */}
          <div className="border-t border-gray-100 p-6 bg-gray-50/50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-700">Switch Travel Mode</span>
              {loading && (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              )}
            </div>
            <div className="flex items-center space-x-3">
              {travelModes.map((mode) => {
                const IconComponent = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => handleTravelModeChange(mode.id as any)}
                    disabled={loading}
                    className={`flex-1 p-4 rounded-2xl transition-all flex flex-col items-center space-y-2 font-medium ${
                      travelMode === mode.id
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="text-xs">{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Apple-Style Safety Analysis Panel */}
      {showSafetyPanel && selectedRoute && (
        <div className="absolute top-32 right-6 z-[1100] bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20 max-w-md w-full max-h-[calc(100vh-10rem)] overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="w-6 h-6 text-emerald-600" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Safety Analysis</h3>
                  <p className="text-sm text-gray-600">AI-powered insights</p>
                </div>
              </div>
              <button
                onClick={() => setShowSafetyPanel(false)}
                className="p-2 hover:bg-white/50 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-[calc(100vh-16rem)]">
            <SafetyPanel
              route={selectedRoute}
              analysis={selectedRoute.detailedAnalysis}
            />
          </div>
        </div>
      )}

      {/* Apple-Style Floating Action Buttons */}
      <div className="absolute bottom-8 right-8 z-[1000] flex flex-col space-y-4">
        {selectedRoute && (
          <button
            onClick={() => setShowSafetyPanel(!showSafetyPanel)}
            className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all border border-white/20 transform hover:scale-110"
            title="Toggle Safety Analysis"
          >
            <Shield className="w-7 h-7 text-emerald-600" />
          </button>
        )}
        
        {routes.length > 0 && (
          <button
            onClick={() => setShowRoutePanel(!showRoutePanel)}
            className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-2xl hover:shadow-2xl transition-all border border-white/20 transform hover:scale-110"
            title="Toggle Route Options"
          >
            <Route className="w-7 h-7 text-blue-600" />
          </button>
        )}
      </div>
    </div>
  );
}

export default App;