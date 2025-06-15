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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Plan Your Safe Route</h3>
        <p className="text-sm text-gray-600">AI-powered route safety analysis</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Enter starting location..."
            value={origin}
            onChange={(e) => onOriginChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
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
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            required
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
                  onClick={() => onTravelModeChange(mode.id as any)}
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
          type="submit"
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
      </form>

      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Powered by Google Cloud + MongoDB Atlas + OpenAI
        </p>
      </div>
    </div>
  );
};

export default SearchPanel;