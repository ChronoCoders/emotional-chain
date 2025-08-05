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
    <div key={label} className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-terminal-cyan">{label}</span>
        <span className={getPrimaryColor(value, inverted)}>{value.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-terminal-surface rounded-full h-2 border border-terminal-border">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getBarColor(value, inverted)}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="terminal-window rounded-lg p-6">
      <h2 className="text-terminal-cyan text-lg font-bold font-mono mb-4">
        +==== 7-METRIC EMOTIONAL INTELLIGENCE ====+
      </h2>
      
      {/* Network Overview */}
      <div className="mb-6 bg-terminal-surface p-4 rounded border border-terminal-border">
        <div className="flex justify-between items-center mb-2">
          <span className="text-terminal-orange font-semibold">Network Emotional Health:</span>
          <span className="text-terminal-success font-bold">{metrics.networkHealth}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-terminal-green">Average PoE Score:</span>
          <span className="text-terminal-cyan">{metrics.avgScore.toFixed(1)}%</span>
        </div>
      </div>

      {/* Primary Metrics (Traditional PoE) */}
      <div className="mb-6">
        <h3 className="text-terminal-orange mb-3 font-semibold">🔹 Primary Emotional Metrics (60% Weight):</h3>
        <div className="space-y-1">
          {renderMetricBar('Stress Level (Inverted)', 100 - metrics.primaryMetrics.stress, false)}
          {renderMetricBar('Focus Level', metrics.primaryMetrics.focus)}
          {renderMetricBar('Authenticity Score', metrics.primaryMetrics.authenticity)}
        </div>
      </div>

      {/* Secondary Metrics (Enterprise Enhancement) */}
      <div className="mb-6">
        <h3 className="text-terminal-orange mb-3 font-semibold">🔸 Secondary Intelligence Metrics (40% Weight):</h3>
        <div className="space-y-1">
          {renderMetricBar('Emotional Valence', metrics.secondaryMetrics.valence)}
          {renderMetricBar('Arousal/Energy Level', metrics.secondaryMetrics.arousal)}
          {renderMetricBar('Fatigue Index', metrics.secondaryMetrics.fatigue, true)}
          {renderMetricBar('Confidence Score', metrics.secondaryMetrics.confidence)}
        </div>
      </div>

      {/* Device Mix Analysis */}
      <div className="mb-6">
        <h3 className="text-terminal-orange mb-3 font-semibold">📱 Device Ecosystem (21 Validators):</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-terminal-surface p-3 rounded border border-terminal-border">
            <div className="text-terminal-cyan text-2xl font-bold">{metrics.deviceMix.consumer}</div>
            <div className="text-terminal-green text-xs">Consumer</div>
            <div className="text-terminal-muted text-xs">Apple, Galaxy, Fitbit</div>
          </div>
          <div className="bg-terminal-surface p-3 rounded border border-terminal-border">
            <div className="text-terminal-warning text-2xl font-bold">{metrics.deviceMix.professional}</div>
            <div className="text-terminal-green text-xs">Professional</div>
            <div className="text-terminal-muted text-xs">Polar, Empatica</div>
          </div>
          <div className="bg-terminal-surface p-3 rounded border border-terminal-border">
            <div className="text-terminal-error text-2xl font-bold">{metrics.deviceMix.medical}</div>
            <div className="text-terminal-green text-xs">Medical</div>
            <div className="text-terminal-muted text-xs">Clinical Grade</div>
          </div>
        </div>
      </div>

      {/* Metric Descriptions */}
      <div className="bg-terminal-surface p-4 rounded border border-terminal-border">
        <h4 className="text-terminal-cyan mb-2 font-semibold">Metric Definitions:</h4>
        <div className="text-xs space-y-1 text-terminal-muted">
          <div><span className="text-terminal-orange">Valence:</span> Positive/negative emotional state (happiness vs sadness)</div>
          <div><span className="text-terminal-orange">Arousal:</span> Energy/activation state (calm-focused vs excited-focused)</div>
          <div><span className="text-terminal-orange">Fatigue:</span> Mental/physical exhaustion (prevents validator burnout)</div>
          <div><span className="text-terminal-orange">Confidence:</span> Decision-making certainty (affects voting weight)</div>
        </div>
      </div>
    </div>
  );
}