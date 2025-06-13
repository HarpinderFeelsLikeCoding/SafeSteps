import React from 'react';
import { Search, MapPin, Navigation, Car, User, Bike } from 'lucide-react';

interface SearchPanelProps {
  origin: string;
  destination: string;
  travelMode: 'driving' | 'walking' | 'bicycling';
  onOriginChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onTravelModeChange: (mode: 'driving' | 'walking' | 'bicycling') => void;
  onSearch: () => void;
  loading: boolean;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  origin,
  destination,
  travelMode,
  onOriginChange,
  onDestinationChange,
  onTravelModeChange,
  onSearch,
  loading
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const travelModes = [
    { id: 'driving', label: 'Driving', icon: Car },
    { id: 'walking', label: 'Walking', icon: User },
    { id: 'bicycling', label: 'Cycling', icon: Bike }
  ];

  return (
    <div className="p-6 border-b border-gray-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Plan Your Safe Route</h3>
        <p className="text-sm text-gray-600">Powered by Google Cloud + MongoDB Atlas</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Enter starting location..."
            value={origin}
            onChange={(e) => onOriginChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            required
          />
        </div>

        <div className="relative">
          <Navigation className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Enter destination..."
            value={destination}
            onChange={(e) => onDestinationChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            required
          />
        </div>

        {/* Travel Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Travel Mode</label>
          <div className="grid grid-cols-3 gap-2">
            {travelModes.map((mode) => {
              const IconComponent = mode.icon;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onTravelModeChange(mode.id as any)}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center space-y-1 ${
                    travelMode === mode.id
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
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
          type="submit"
          disabled={loading || !origin || !destination}
          className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Computing Routes...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Find Safe Routes</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default SearchPanel;