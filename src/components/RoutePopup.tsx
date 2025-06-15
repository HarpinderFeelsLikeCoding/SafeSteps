import React from 'react';
import { Clock, Route as RouteIcon, X, Shield, AlertTriangle } from 'lucide-react';
import { RouteData } from '../types';
import { clsx } from 'clsx';

interface RoutePopupProps {
  routes: RouteData[];
  selectedRoute: RouteData | null;
  onRouteSelect: (route: RouteData) => void;
  onClose: () => void;
  getSafetyIcon: (score: number) => React.ReactNode;
}

const RoutePopup: React.FC<RoutePopupProps> = ({
  routes,
  selectedRoute,
  onRouteSelect,
  onClose,
  getSafetyIcon
}) => {
  const getRouteTypeColor = (type: string) => {
    switch (type) {
      case 'fastest': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'safest': return 'bg-green-50 text-green-700 border-green-200';
      case 'balanced': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'recommended': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getSafetyScoreColor = (score: number) => {
    if (score >= 90) return 'text-success-600 bg-success-50';
    if (score >= 70) return 'text-warning-600 bg-warning-50';
    return 'text-danger-600 bg-danger-50';
  };

  // Safe rendering with fallbacks
  const safeRoutes = routes.filter(route => route && typeof route === 'object');

  if (safeRoutes.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-[1200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-500 p-2 rounded-lg">
              <RouteIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Choose Your Route</h3>
              <p className="text-sm text-gray-600">{safeRoutes.length} options found</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Routes List */}
        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {safeRoutes.map((route, index) => {
            const safetyScore = route.safetyScore || 75;
            const distance = route.distance?.text || 'Unknown distance';
            const duration = route.duration?.text || 'Unknown duration';
            
            return (
              <div
                key={route.id}
                onClick={() => onRouteSelect(route)}
                className={clsx(
                  'p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg transform hover:scale-[1.02]',
                  selectedRoute?.id === route.id
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-primary-300'
                )}
              >
                {/* Route Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={clsx(
                      'px-3 py-1 text-xs font-medium rounded-full border',
                      getRouteTypeColor(route.type || 'default')
                    )}>
                      {route.name || 'Route'}
                    </span>
                    {index === 0 && (
                      <span className="px-2 py-1 text-xs font-bold bg-primary-100 text-primary-700 rounded-full">
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <div className={clsx(
                    'px-3 py-1 text-sm font-bold rounded-full flex items-center space-x-1',
                    getSafetyScoreColor(safetyScore)
                  )}>
                    {getSafetyIcon(safetyScore)}
                    <span>{Math.round(safetyScore)}%</span>
                  </div>
                </div>

                {/* Route Details */}
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">{duration}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{distance}</span>
                  </div>
                </div>
                
                {/* Route Summary */}
                {route.summary && (
                  <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                    Via {route.summary}
                  </p>
                )}

                {/* Safety Indicator */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Safety Level</span>
                    <span className={clsx(
                      'font-medium',
                      safetyScore >= 80 ? 'text-success-600' :
                      safetyScore >= 60 ? 'text-warning-600' : 'text-danger-600'
                    )}>
                      {safetyScore >= 80 ? 'Excellent' :
                       safetyScore >= 60 ? 'Good' : 'Caution Required'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className={clsx(
                        'h-1.5 rounded-full transition-all duration-500',
                        safetyScore >= 80 ? 'bg-success-500' :
                        safetyScore >= 60 ? 'bg-warning-500' : 'bg-danger-500'
                      )}
                      style={{ width: `${Math.min(100, Math.max(0, safetyScore))}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Select a route to view detailed safety analysis
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoutePopup;