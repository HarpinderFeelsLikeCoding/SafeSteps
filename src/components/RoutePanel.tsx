import React from 'react';
import { Clock, Route as RouteIcon } from 'lucide-react';
import { RouteData } from '../types';
import { clsx } from 'clsx';

interface RoutePanelProps {
  routes: RouteData[];
  selectedRoute: RouteData | null;
  onRouteSelect: (route: RouteData) => void;
  getSafetyIcon: (score: number) => React.ReactNode;
}

const RoutePanel: React.FC<RoutePanelProps> = ({
  routes,
  selectedRoute,
  onRouteSelect,
  getSafetyIcon
}) => {
  const getRouteTypeColor = (type: string) => {
    switch (type) {
      case 'fastest': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'safest': return 'bg-green-50 text-green-700 border-green-200';
      case 'balanced': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getSafetyScoreColor = (score: number) => {
    if (score >= 90) return 'text-success-600 bg-success-50';
    if (score >= 70) return 'text-warning-600 bg-warning-50';
    return 'text-danger-600 bg-danger-50';
  };

  return (
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <RouteIcon className="w-5 h-5 mr-2" />
        Route Options
      </h3>

      <div className="space-y-3">
        {routes.map((route) => (
          <div
            key={route.id}
            onClick={() => onRouteSelect(route)}
            className={clsx(
              'p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md',
              selectedRoute?.id === route.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className={clsx(
                  'px-2 py-1 text-xs font-medium rounded-full border',
                  getRouteTypeColor(route.type)
                )}>
                  {route.name}
                </span>
                {getSafetyIcon(route.safetyScore)}
              </div>
              <div className={clsx(
                'px-2 py-1 text-xs font-bold rounded-full',
                getSafetyScoreColor(route.safetyScore)
              )}>
                {route.safetyScore}% Safe
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {route.duration}
                </div>
                <div>
                  {route.distance}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoutePanel;