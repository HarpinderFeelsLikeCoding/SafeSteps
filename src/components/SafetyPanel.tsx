import React from 'react';
import { Shield, AlertTriangle, TrendingUp, Brain, Database, Cloud, MapPin, Star, Award, Target } from 'lucide-react';
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
    if (score >= 90) return { level: 'Excellent', color: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-200' };
    if (score >= 80) return { level: 'Very Good', color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200' };
    if (score >= 60) return { level: 'Good', color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-200' };
    return { level: 'Caution', color: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-200' };
  };

  const safetyScore = analysis?.safetyScore || route.safetyScore || 75;
  const safety = getSafetyLevel(safetyScore);

  // Safe array rendering with fallbacks
  const safeInsights = Array.isArray(analysis?.insights) ? analysis.insights : [];
  const safeRecommendations = Array.isArray(analysis?.recommendations) ? analysis.recommendations : [];
  const safeKeyRisks = Array.isArray(analysis?.keyRisks) ? analysis.keyRisks : [];

  return (
    <div className="p-6 space-y-6">
      {/* Route Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100">
        <h4 className="font-bold text-gray-900 mb-3 flex items-center text-lg">
          <MapPin className="w-5 h-5 mr-3 text-blue-600" />
          Route Overview
        </h4>
        <p className="text-gray-700 mb-4 font-medium">{route.summary || 'Route analysis'}</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/70 p-3 rounded-xl">
            <span className="text-gray-600 text-sm font-medium">Distance</span>
            <p className="font-bold text-gray-900 text-lg">{route.distance?.text || 'Unknown'}</p>
          </div>
          <div className="bg-white/70 p-3 rounded-xl">
            <span className="text-gray-600 text-sm font-medium">Duration</span>
            <p className="font-bold text-gray-900 text-lg">{route.duration?.text || 'Unknown'}</p>
          </div>
        </div>
      </div>

      {/* Safety Score Card */}
      <div className={`p-6 rounded-2xl border-2 ${safety.bg} ${safety.ring} ring-2`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-3 rounded-2xl shadow-sm">
              <Shield className={`w-6 h-6 ${safety.color}`} />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-700">Safety Score</span>
              <p className={`text-sm ${safety.color} font-bold`}>{safety.level}</p>
            </div>
          </div>
          <div className={`text-4xl font-black ${safety.color}`}>
            {Math.round(safetyScore)}%
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
          <div
            className={`h-3 rounded-full transition-all duration-1000 ${
              safetyScore >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
              safetyScore >= 60 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 
              'bg-gradient-to-r from-red-400 to-red-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, safetyScore))}%` }}
          ></div>
        </div>
        
        {analysis && (
          <p className="text-xs text-gray-600 font-medium">
            Risk Level: <span className={`${safety.color} font-bold`}>{analysis.riskLevel || 'unknown'}</span>
          </p>
        )}
      </div>

      {/* AI Insights */}
      {safeInsights.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-100">
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <div className="bg-emerald-500 p-2 rounded-xl mr-3">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            AI Safety Insights
          </h4>
          <div className="space-y-3">
            {safeInsights.slice(0, 4).map((insight, index) => (
              <div key={index} className="flex items-start bg-white/70 p-4 rounded-xl">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                <p className="text-sm text-gray-700 font-medium leading-relaxed">
                  {typeof insight === 'string' ? insight : 'Analysis insight available'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {safeRecommendations.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-5 rounded-2xl border border-blue-100">
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <div className="bg-blue-500 p-2 rounded-xl mr-3">
              <Target className="w-5 h-5 text-white" />
            </div>
            AI Recommendations
          </h4>
          <div className="space-y-3">
            {safeRecommendations.slice(0, 4).map((recommendation, index) => (
              <div key={index} className="flex items-start bg-white/70 p-4 rounded-xl">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-4 flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-700 font-medium leading-relaxed">
                  {typeof recommendation === 'string' ? recommendation : 'Safety recommendation available'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Risks */}
      {safeKeyRisks.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-100">
          <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <div className="bg-amber-500 p-2 rounded-xl mr-3">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            Key Risk Factors
          </h4>
          <div className="space-y-3">
            {safeKeyRisks.slice(0, 4).map((risk, index) => (
              <div key={index} className="flex items-start bg-white/70 p-4 rounded-xl">
                <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                <p className="text-sm text-gray-700 font-medium leading-relaxed">
                  {typeof risk === 'string' ? risk : 'Risk factor identified'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Analysis Summary */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-5 rounded-2xl border border-gray-200">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <div className="bg-gray-600 p-2 rounded-xl mr-3">
            <Database className="w-5 h-5 text-white" />
          </div>
          Analysis Summary
        </h4>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white p-4 rounded-xl text-center">
            <p className="text-2xl font-black text-gray-900">{analysis?.totalCrashes || 0}</p>
            <span className="text-xs text-gray-600 font-semibold">Total Crashes</span>
          </div>
          <div className="bg-white p-4 rounded-xl text-center">
            <p className="text-2xl font-black text-gray-900">{analysis?.nearbyCrashes || 0}</p>
            <span className="text-xs text-gray-600 font-semibold">Nearby</span>
          </div>
          <div className="bg-white p-4 rounded-xl text-center">
            <p className="text-2xl font-black text-gray-900">{analysis?.similarCrashes || 0}</p>
            <span className="text-xs text-gray-600 font-semibold">Similar Patterns</span>
          </div>
          <div className="bg-white p-4 rounded-xl text-center">
            <p className="text-sm font-black text-gray-900">Hybrid</p>
            <span className="text-xs text-gray-600 font-semibold">Analysis Type</span>
          </div>
        </div>
        
        <div className="bg-white/70 p-4 rounded-xl">
          <p className="text-xs text-gray-600 flex items-center justify-center font-medium">
            <Cloud className="w-4 h-4 mr-2" />
            Powered by Google Cloud + MongoDB Atlas + OpenAI
          </p>
        </div>
      </div>
    </div>
  );
};

export default SafetyPanel;