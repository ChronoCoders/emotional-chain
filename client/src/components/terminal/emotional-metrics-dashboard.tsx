import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/use-websocket';
import { useEffect, useState } from 'react';

interface EmotionalMetrics {
  primaryMetrics: {
    stress: number;
    focus: number;
    authenticity: number;
  };
  secondaryMetrics: {
    valence: number;     // Emotional positivity (0-100)
    arousal: number;     // Energy/activation (0-100)  
    fatigue: number;     // Mental exhaustion (0-100, lower is better)
    confidence: number;  // Decision certainty (0-100)
  };
  deviceMix: {
    consumer: number;      // Apple Watch, Galaxy Watch, Fitbit
    professional: number; // Polar H10, Empatica E4
    medical: number;       // Clinical-grade devices
  };
  avgScore: number;
  networkHealth: string;
}

export default function EmotionalMetricsDashboard() {
  const [metrics, setMetrics] = useState<EmotionalMetrics>({
    primaryMetrics: {
      stress: 78.2,
      focus: 84.6,
      authenticity: 91.8
    },
    secondaryMetrics: {
      valence: 76.4,     // Positive emotional state
      arousal: 68.9,     // Energy level
      fatigue: 25.3,     // Mental exhaustion (inverted)
      confidence: 82.1   // Decision certainty
    },
    deviceMix: {
      consumer: 14,      // Apple Watch, Galaxy Watch, Fitbit, etc.
      professional: 5,   // Polar H10, Empatica E4, etc.
      medical: 2         // Clinical-grade devices
    },
    avgScore: 78.6,
    networkHealth: 'Excellent'
  });

  const { lastMessage } = useWebSocket();

  // Update with real-time emotional data
  useEffect(() => {
    if (lastMessage?.type === 'update' && lastMessage.data?.emotionalMetrics) {
      setMetrics(lastMessage.data.emotionalMetrics);
    }
  }, [lastMessage]);

  const getPrimaryColor = (value: number, inverted = false) => {
    if (inverted) {
      // For fatigue - lower is better
      if (value < 30) return 'text-terminal-success';
      if (value < 60) return 'text-terminal-warning';
      return 'text-terminal-error';
    } else {
      // For normal metrics - higher is better
      if (value >= 80) return 'text-terminal-success';
      if (value >= 60) return 'text-terminal-warning';
      return 'text-terminal-error';
    }
  };

  const getBarColor = (value: number, inverted = false) => {
    if (inverted) {
      if (value < 30) return 'bg-terminal-success';
      if (value < 60) return 'bg-terminal-warning';
      return 'bg-terminal-error';
    } else {
      if (value >= 80) return 'bg-terminal-success';
      if (value >= 60) return 'bg-terminal-warning';
      return 'bg-terminal-error';
    }
  };

  const renderMetricBar = (label: string, value: number, inverted = false) => (
    <div key={label} className="mb-1">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-terminal-cyan">{label}</span>
        <span className={getPrimaryColor(value, inverted)}>{value.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-black rounded-full h-1.5 border border-terminal-border">
        <div 
          className={`h-1.5 rounded-full transition-all duration-300 ${getBarColor(value, inverted)}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="terminal-window rounded-lg p-4">
      <h2 className="text-terminal-cyan text-lg font-bold font-mono mb-3">
        +== 7-METRIC EMOTIONAL INTELLIGENCE ==+
      </h2>
      
      {/* Compact Header with Network Health */}
      <div className="flex justify-between items-center mb-4 bg-terminal-surface p-3 rounded border border-terminal-border">
        <div>
          <span className="text-terminal-orange font-semibold">Network Health: </span>
          <span className="text-terminal-success font-bold">{metrics.networkHealth}</span>
        </div>
        <div>
          <span className="text-terminal-green">Avg PoE: </span>
          <span className="text-terminal-cyan font-bold">{metrics.avgScore.toFixed(1)}%</span>
        </div>
      </div>

      {/* Compact Grid Layout: Primary + Secondary Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Primary Metrics Column */}
        <div className="bg-terminal-surface p-3 rounded border border-terminal-border">
          <h3 className="text-terminal-orange mb-2 text-sm font-semibold">🔹 Primary (60%):</h3>
          <div className="space-y-2">
            {renderMetricBar('Stress', 100 - metrics.primaryMetrics.stress, false)}
            {renderMetricBar('Focus', metrics.primaryMetrics.focus)}
            {renderMetricBar('Authenticity', metrics.primaryMetrics.authenticity)}
          </div>
        </div>

        {/* Secondary Metrics Column */}
        <div className="bg-terminal-surface p-3 rounded border border-terminal-border">
          <h3 className="text-terminal-orange mb-2 text-sm font-semibold">🔸 Secondary (40%):</h3>
          <div className="space-y-2">
            {renderMetricBar('Valence', metrics.secondaryMetrics.valence)}
            {renderMetricBar('Arousal', metrics.secondaryMetrics.arousal)}
            {renderMetricBar('Fatigue', metrics.secondaryMetrics.fatigue, true)}
            {renderMetricBar('Confidence', metrics.secondaryMetrics.confidence)}
          </div>
        </div>
      </div>

      {/* Compact Device Mix - Single Row */}
      <div className="bg-terminal-surface p-3 rounded border border-terminal-border">
        <div className="flex justify-between items-center">
          <h3 className="text-terminal-orange text-sm font-semibold">📱 Device Mix:</h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <span className="text-terminal-cyan font-bold">{metrics.deviceMix.consumer}</span>
              <span className="text-terminal-green">Consumer</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-terminal-warning font-bold">{metrics.deviceMix.professional}</span>
              <span className="text-terminal-green">Pro</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-terminal-error font-bold">{metrics.deviceMix.medical}</span>
              <span className="text-terminal-green">Medical</span>
            </div>
          </div>
        </div>
        
        {/* Visual Device Distribution */}
        <div className="mt-2 flex items-center space-x-1">
          {Array.from({ length: metrics.deviceMix.consumer }, (_, i) => (
            <div key={`c-${i}`} className="w-2 h-2 bg-terminal-cyan rounded-full"></div>
          ))}
          {Array.from({ length: metrics.deviceMix.professional }, (_, i) => (
            <div key={`p-${i}`} className="w-2 h-2 bg-terminal-warning rounded-full"></div>
          ))}
          {Array.from({ length: metrics.deviceMix.medical }, (_, i) => (
            <div key={`m-${i}`} className="w-2 h-2 bg-terminal-error rounded-full"></div>
          ))}
        </div>
      </div>
    </div>
  );
}