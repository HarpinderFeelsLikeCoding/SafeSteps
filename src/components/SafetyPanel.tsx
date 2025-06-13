import React from 'react';
import { Shield, AlertTriangle, TrendingUp, Brain, Database, Cloud, MapPin } from 'lucide-react';
import { RouteData } from '../types';

interface SafetyPanelProps {
  route: RouteData;
  analysis?: {
    totalCrashes: number;
    nearbyCrashes: number;
    similarCrashes: number;
    safetyScore: number;
    riskLevel: string;
    insights: string[];
    recommendations: string[];
    keyRisks: string[];
  };
}

const SafetyPanel: React.FC<SafetyPanelProps> = ({ route, analysis }) => {
  const getSafetyLevel = (score: number) => {
    if (score >= 80) return { level: 'Excellent', color: 'text-success-600', bg: 'bg-success-50' };
    if (score >= 60) return { level: 'Good', color: 'text-warning-600', bg: 'bg-warning-50' };
    return { level: 'Caution', color: 'text-danger-600', bg: 'bg-danger-50' };
  };

  const safetyScore = analysis?.safetyScore || route.safetyScore;
  const safety = getSafetyLevel(safetyScore);

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Shield className="w-5 h-5 mr-2" />
        AI Safety Analysis
        <Brain className="w-4 h-4 ml-2 text-primary-600" title="Powered by OpenAI + Google Cloud" />
      </h3>

      {/* Route Summary */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h4 className="font-medium text-gray-800 mb-2 flex items-center">
          <MapPin className="w-4 h-4 mr-2" />
          Route Summary
        </h4>
        <p className="text-sm text-gray-600 mb-2">{route.summary}</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Distance:</span>
            <p className="font-medium">{route.distance?.text}</p>
          </div>
          <div>
            <span className="text-gray-500">Duration:</span>
            <p className="font-medium">{route.duration?.text}</p>
          </div>
        </div>
      </div>

      {/* Safety Score */}
      <div className={`p-4 rounded-lg mb-6 ${safety.bg}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Safety Score</span>
          <span className={`text-2xl font-bold ${safety.color}`}>
            {Math.round(safetyScore)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              safetyScore >= 80 ? 'bg-success-500' :
              safetyScore >= 60 ? 'bg-warning-500' : 'bg-danger-500'
            }`}
            style={{ width: `${safetyScore}%` }}
          ></div>
        </div>
        <p className={`text-sm mt-2 ${safety.color} font-medium`}>
          {safety.level} Safety Level
          {analysis && (
            <span className="ml-2 text-xs text-gray-500">
              (Risk: {analysis.riskLevel})
            </span>
          )}
        </p>
      </div>

      {/* AI Insights */}
      {analysis?.insights && (
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2 text-success-600" />
            AI Safety Insights
          </h4>
          <ul className="space-y-2">
            {analysis.insights.map((insight, index) => (
              <li key={index} className="flex items-start text-sm text-gray-600">
                <div className="w-2 h-2 bg-success-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Recommendations */}
      {analysis?.recommendations && (
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-warning-600" />
            AI Recommendations
          </h4>
          <ul className="space-y-2">
            {analysis.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start text-sm text-gray-600">
                <div className="w-2 h-2 bg-warning-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                {recommendation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key Risks */}
      {analysis?.keyRisks && (
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-danger-600" />
            Key Risk Factors
          </h4>
          <ul className="space-y-2">
            {analysis.keyRisks.map((risk, index) => (
              <li key={index} className="flex items-start text-sm text-gray-600">
                <div className="w-2 h-2 bg-danger-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Data Analysis Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
          <Database className="w-4 h-4 mr-2 text-primary-600" />
          Data Analysis
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Crashes</span>
            <p className="font-semibold text-gray-900">{analysis?.totalCrashes || 0}</p>
          </div>
          <div>
            <span className="text-gray-600">Nearby Crashes</span>
            <p className="font-semibold text-gray-900">{analysis?.nearbyCrashes || 0}</p>
          </div>
          <div>
            <span className="text-gray-600">Similar Patterns</span>
            <p className="font-semibold text-gray-900">{analysis?.similarCrashes || 0}</p>
          </div>
          <div>
            <span className="text-gray-600">Analysis Type</span>
            <p className="font-semibold text-gray-900">Hybrid Geo+Vector</p>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 flex items-center">
            <Cloud className="w-3 h-3 mr-1" />
            Google Cloud + MongoDB Atlas + OpenAI
          </p>
        </div>
      </div>
    </div>
  );
};

export default SafetyPanel;