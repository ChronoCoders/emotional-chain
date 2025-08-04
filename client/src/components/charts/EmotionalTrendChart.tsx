/**
 * EmotionalChain Emotional Trend Visualization
 * Advanced charts showing validator emotional consensus trends
 */

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ScatterChart,
  Scatter
} from 'recharts';
import { TrendingUp, Heart, Brain, Activity, Users } from 'lucide-react';

interface EmotionalDataPoint {
  timestamp: number;
  blockHeight: number;
  averageEmotionalScore: number;
  heartRateAvg: number;
  stressLevelAvg: number;
  focusLevelAvg: number;
  validatorCount: number;
  consensusStrength: number;
}

interface ValidatorPerformance {
  validatorId: string;
  emotionalScore: number;
  consistency: number;
  participation: number;
  color: string;
}

interface EmotionalTrendChartProps {
  data: EmotionalDataPoint[];
  validatorPerformance: ValidatorPerformance[];
  timeRange: '1h' | '6h' | '24h' | '7d';
  onTimeRangeChange: (range: string) => void;
}

export function EmotionalTrendChart({ 
  data, 
  validatorPerformance, 
  timeRange, 
  onTimeRangeChange 
}: EmotionalTrendChartProps) {
  const [activeMetric, setActiveMetric] = useState<'emotional' | 'biometric' | 'consensus'>('emotional');

  // Format timestamp for display
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    if (timeRange === '1h' || timeRange === '6h') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Custom tooltip for emotional trends
  const EmotionalTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">
            Block {data.blockHeight}
          </p>
          <p className="text-xs text-gray-500 mb-2">
            {formatTime(data.timestamp)}
          </p>
          
          <div className="space-y-1">
            <div className="flex items-center">
              <Heart className="w-3 h-3 text-red-500 mr-2" />
              <span className="text-xs text-gray-600">
                Emotional Score: {data.averageEmotionalScore.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center">
              <Activity className="w-3 h-3 text-blue-500 mr-2" />
              <span className="text-xs text-gray-600">
                Heart Rate: {data.heartRateAvg.toFixed(0)} BPM
              </span>
            </div>
            <div className="flex items-center">
              <Brain className="w-3 h-3 text-purple-500 mr-2" />
              <span className="text-xs text-gray-600 dark:text-gray-300">
                Focus: {data.focusLevelAvg.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center">
              <Users className="w-3 h-3 text-green-500 mr-2" />
              <span className="text-xs text-gray-600 dark:text-gray-300">
                Validators: {data.validatorCount}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Performance distribution data
  const performanceDistribution = [
    { name: 'Excellent (90-100)', value: validatorPerformance.filter(v => v.emotionalScore >= 90).length, color: '#10B981' },
    { name: 'Good (80-89)', value: validatorPerformance.filter(v => v.emotionalScore >= 80 && v.emotionalScore < 90).length, color: '#3B82F6' },
    { name: 'Fair (70-79)', value: validatorPerformance.filter(v => v.emotionalScore >= 70 && v.emotionalScore < 80).length, color: '#F59E0B' },
    { name: 'Poor (<70)', value: validatorPerformance.filter(v => v.emotionalScore < 70).length, color: '#EF4444' }
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
            Emotional Consensus Trends
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Real-time biometric validation and consensus strength
          </p>
        </div>

        <div className="flex gap-2">
          {/* Time Range Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['1h', '6h', '24h', '7d'].map((range) => (
              <button
                key={range}
                onClick={() => onTimeRangeChange(range)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  timeRange === range
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Metric Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { key: 'emotional', label: 'Emotional', icon: Heart },
              { key: 'biometric', label: 'Biometric', icon: Activity },
              { key: 'consensus', label: 'Consensus', icon: Users }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveMetric(key as any)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors flex items-center ${
                  activeMetric === key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <Icon className="w-3 h-3 mr-1" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Trend Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ResponsiveContainer width="100%" height={400}>
          {activeMetric === 'emotional' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="emotionalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTime}
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                domain={[0, 100]}
                stroke="#6B7280"
                fontSize={12}
              />
              <Tooltip content={<EmotionalTooltip />} />
              <Area
                type="monotone"
                dataKey="averageEmotionalScore"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#emotionalGradient)"
                name="Emotional Score"
              />
            </AreaChart>
          ) : activeMetric === 'biometric' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTime}
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                yAxisId="left"
                domain={[0, 100]}
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                domain={[60, 120]}
                stroke="#6B7280"
                fontSize={12}
              />
              <Tooltip content={<EmotionalTooltip />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="focusLevelAvg"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={false}
                name="Focus Level"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="stressLevelAvg"
                stroke="#EF4444"
                strokeWidth={2}
                dot={false}
                name="Stress Level"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="heartRateAvg"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                name="Heart Rate (BPM)"
              />
            </LineChart>
          ) : (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="consensusGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTime}
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                domain={[0, 100]}
                stroke="#6B7280"
                fontSize={12}
              />
              <Tooltip content={<EmotionalTooltip />} />
              <Area
                type="monotone"
                dataKey="consensusStrength"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#consensusGradient)"
                name="Consensus Strength"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Performance Distribution and Validator Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Distribution Pie Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Validator Performance Distribution
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={performanceDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {performanceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Validator Performance Scatter */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Validator Performance vs Consistency
          </h4>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart data={validatorPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                type="number" 
                dataKey="consistency" 
                name="Consistency"
                domain={[0, 100]}
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                type="number" 
                dataKey="emotionalScore" 
                name="Emotional Score"
                domain={[0, 100]}
                stroke="#6B7280"
                fontSize={12}
              />
              <Tooltip 
                formatter={(value, name) => [value, name]}
                labelFormatter={(label) => `Validator: ${label}`}
              />
              <Scatter 
                dataKey="emotionalScore" 
                fill="#3B82F6"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default EmotionalTrendChart;