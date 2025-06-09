import React from 'react';
import { Shield, AlertTriangle, Info, TrendingUp } from 'lucide-react';
import { RouteData, CrashData } from '../types';

interface SafetyPanelProps {
  route: RouteData;
  crashData: CrashData[];
}

const SafetyPanel: React.FC<SafetyPanelProps> = ({ route, crashData }) => {
  const getSafetyLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: 'text-success-600', bg: 'bg-success-50' };
    if (score >= 70) return { level: 'Good', color: 'text-warning-600', bg: 'bg-warning-50' };
    return { level: 'Caution', color: 'text-danger-600', bg: 'bg-danger-50' };
  };

  const safety = getSafetyLevel(route.safetyScore);

  const mockInsights = [
    'Lower accident frequency during morning hours',
    'Well-lit streets with good visibility',
    'Regular traffic enforcement presence',
    'Protected bike lanes available'
  ];

  const mockRisks = [
    'Heavy traffic during rush hours',
    'Construction zone ahead',
    'Weather conditions may affect visibility'
  ];

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Shield className="w-5 h-5 mr-2" />
        Safety Analysis
      </h3>

      {/* Safety Score */}
      <div className={`p-4 rounded-lg mb-6 ${safety.bg}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Safety Score</span>
          <span className={`text-2xl font-bold ${safety.color}`}>
            {route.safetyScore}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              route.safetyScore >= 90 ? 'bg-success-500' :
              route.safetyScore >= 70 ? 'bg-warning-500' : 'bg-danger-500'
            }`}
            style={{ width: `${route.safetyScore}%` }}
          ></div>
        </div>
        <p className={`text-sm mt-2 ${safety.color} font-medium`}>
          {safety.level} Safety Level
        </p>
      </div>

      {/* Safety Insights */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2 text-success-600" />
          Safety Highlights
        </h4>
        <ul className="space-y-2">
          {mockInsights.map((insight, index) => (
            <li key={index} className="flex items-start text-sm text-gray-600">
              <div className="w-2 h-2 bg-success-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              {insight}
            </li>
          ))}
        </ul>
      </div>

      {/* Risk Factors */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2 text-warning-600" />
          Risk Factors
        </h4>
        <ul className="space-y-2">
          {mockRisks.map((risk, index) => (
            <li key={index} className="flex items-start text-sm text-gray-600">
              <div className="w-2 h-2 bg-warning-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              {risk}
            </li>
          ))}
        </ul>
      </div>

      {/* Crash Data Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
          <Info className="w-4 h-4 mr-2 text-primary-600" />
          Historical Data
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Incidents (30 days)</span>
            <p className="font-semibold text-gray-900">{crashData.length || 'Low'}</p>
          </div>
          <div>
            <span className="text-gray-600">Peak Risk Time</span>
            <p className="font-semibold text-gray-900">5-7 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyPanel;