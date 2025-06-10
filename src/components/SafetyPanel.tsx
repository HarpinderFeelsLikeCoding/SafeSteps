import React from 'react';
import { Shield, AlertTriangle, Info, TrendingUp, Brain, Database } from 'lucide-react';
import { RouteData, CrashData } from '../types';

interface SafetyPanelProps {
  route: RouteData;
  crashData: CrashData[];
  safetyAnalysis?: {
    safetyScore: number;
    riskLevel: string;
    insights: string[];
    recommendations: string[];
  };
}

const SafetyPanel: React.FC<SafetyPanelProps> = ({ route, crashData, safetyAnalysis }) => {
  const getSafetyLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: 'text-success-600', bg: 'bg-success-50' };
    if (score >= 70) return { level: 'Good', color: 'text-warning-600', bg: 'bg-warning-50' };
    return { level: 'Caution', color: 'text-danger-600', bg: 'bg-danger-50' };
  };

  const safety = getSafetyLevel(safetyAnalysis?.safetyScore || route.safetyScore);

  // Use AI analysis if available, otherwise fall back to mock data
  const insights = safetyAnalysis?.insights || [
    'Lower accident frequency during morning hours',
    'Well-lit streets with good visibility',
    'Regular traffic enforcement presence',
    'Protected bike lanes available'
  ];

  const recommendations = safetyAnalysis?.recommendations || [
    'Heavy traffic during rush hours',
    'Construction zone ahead',
    'Weather conditions may affect visibility'
  ];

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Shield className="w-5 h-5 mr-2" />
        AI Safety Analysis
        {safetyAnalysis && (
          <Brain className="w-4 h-4 ml-2 text-primary-600" title="Powered by OpenAI" />
        )}
      </h3>

      {/* Safety Score */}
      <div className={`p-4 rounded-lg mb-6 ${safety.bg}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Safety Score</span>
          <span className={`text-2xl font-bold ${safety.color}`}>
            {Math.round(safetyAnalysis?.safetyScore || route.safetyScore)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              (safetyAnalysis?.safetyScore || route.safetyScore) >= 90 ? 'bg-success-500' :
              (safetyAnalysis?.safetyScore || route.safetyScore) >= 70 ? 'bg-warning-500' : 'bg-danger-500'
            }`}
            style={{ width: `${safetyAnalysis?.safetyScore || route.safetyScore}%` }}
          ></div>
        </div>
        <p className={`text-sm mt-2 ${safety.color} font-medium`}>
          {safety.level} Safety Level
          {safetyAnalysis && (
            <span className="ml-2 text-xs text-gray-500">
              (Risk: {safetyAnalysis.riskLevel})
            </span>
          )}
        </p>
      </div>

      {/* AI Insights */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2 text-success-600" />
          {safetyAnalysis ? 'AI Safety Insights' : 'Safety Highlights'}
        </h4>
        <ul className="space-y-2">
          {insights.map((insight, index) => (
            <li key={index} className="flex items-start text-sm text-gray-600">
              <div className="w-2 h-2 bg-success-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              {insight}
            </li>
          ))}
        </ul>
      </div>

      {/* AI Recommendations */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2 text-warning-600" />
          {safetyAnalysis ? 'AI Recommendations' : 'Risk Factors'}
        </h4>
        <ul className="space-y-2">
          {recommendations.map((recommendation, index) => (
            <li key={index} className="flex items-start text-sm text-gray-600">
              <div className="w-2 h-2 bg-warning-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
              {recommendation}
            </li>
          ))}
        </ul>
      </div>

      {/* Real-time Data Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
          <Database className="w-4 h-4 mr-2 text-primary-600" />
          Live Data Analysis
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Incidents Found</span>
            <p className="font-semibold text-gray-900">{crashData.length}</p>
          </div>
          <div>
            <span className="text-gray-600">Data Source</span>
            <p className="font-semibold text-gray-900">
              {safetyAnalysis ? 'MongoDB Atlas' : 'Cache'}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Analysis Type</span>
            <p className="font-semibold text-gray-900">
              {safetyAnalysis ? 'AI Vector Search' : 'Statistical'}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Last Updated</span>
            <p className="font-semibold text-gray-900">Real-time</p>
          </div>
        </div>
        
        {safetyAnalysis && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 flex items-center">
              <Brain className="w-3 h-3 mr-1" />
              Powered by OpenAI GPT-3.5 and MongoDB Atlas Vector Search
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SafetyPanel;