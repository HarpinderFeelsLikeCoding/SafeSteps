import React from 'react';
import { Search, MapPin, Navigation } from 'lucide-react';

interface SearchPanelProps {
  origin: string;
  destination: string;
  onOriginChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onSearch: () => void;
  loading: boolean;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  onSearch,
  loading
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div className="p-6 border-b border-gray-200">
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

        <button
          type="submit"
          disabled={loading || !origin || !destination}
          className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Finding Routes...</span>
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