import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/use-websocket';
import { useEffect, useState } from 'react';
import type { BiometricData, Validator } from '@shared/schema';

export default function BiometricStatus() {
  const [realtimeBiometric, setRealtimeBiometric] = useState<BiometricData | null>(null);
  const [nextValidation, setNextValidation] = useState(272); // seconds countdown
  const { lastMessage } = useWebSocket();

  const { data: validators = [] } = useQuery<Validator[]>({
    queryKey: ['/api/validators']
  });

  const currentValidator = validators[0]; // Simulate current user validator

  const { data: initialBiometric } = useQuery<BiometricData>({
    queryKey: ['/api/biometric', currentValidator?.id],
    enabled: !!currentValidator?.id
  });

  // Update with real-time data from WebSocket (simulated)
  useEffect(() => {
    if (lastMessage?.type === 'update') {
      // Simulate real-time biometric data updates
      const mockBiometric: BiometricData = {
        id: 'mock',
        validatorId: currentValidator?.id || 'mock',
        heartRate: Math.floor(Math.random() * 20) + 65, // 65-85 BPM
        hrv: Math.floor(Math.random() * 30) + 30, // 30-60ms
        stressLevel: (Math.random() * 30 + 15).toFixed(1), // 15-45%
        focusLevel: (Math.random() * 20 + 80).toFixed(1), // 80-100%
        authenticity: (Math.random() * 10 + 90).toFixed(1), // 90-100%
        timestamp: new Date()
      };
      setRealtimeBiometric(mockBiometric);
    }
  }, [lastMessage, currentValidator?.id]);

  // Countdown timer for next validation
  useEffect(() => {
    const interval = setInterval(() => {
      setNextValidation(prev => {
        if (prev <= 0) return 272; // Reset to ~4.5 minutes
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const biometric = realtimeBiometric || initialBiometric;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getStatusIcon = (isConnected: boolean) => isConnected ? '✅' : '❌';
  const getStatusText = (isConnected: boolean) => isConnected ? 'Connected' : 'Disconnected';
  const getStatusColor = (isConnected: boolean) => isConnected ? 'text-terminal-success' : 'text-terminal-error';

  const deviceConnected = !!biometric;
  const biometricVerified = deviceConnected && parseFloat(biometric?.authenticity || '0') > 85;
  const mlProcessing = deviceConnected;
  const antiSpoofing = biometricVerified && parseFloat(biometric?.authenticity || '0') > 95;

  return (
    <div className="terminal-window rounded-lg p-6">
      <h2 className="text-terminal-cyan text-lg font-bold mb-4">
        ┌── BIOMETRIC_VALIDATION ──┐
      </h2>
      
      {/* Real-time Biometric Data */}
      <div className="mb-4">
        <h3 className="text-terminal-orange mb-3">💓 Live Biometric Data:</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-terminal-green">Heart Rate:</span>
            <span className="text-terminal-cyan">{biometric?.heartRate || '--'} BPM</span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal-green">HRV:</span>
            <span className="text-terminal-cyan">{biometric?.hrv || '--'}ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal-green">Stress Level:</span>
            <span className="text-terminal-success">{biometric?.stressLevel || '--'}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal-green">Focus Level:</span>
            <span className="text-terminal-cyan">{biometric?.focusLevel || '--'}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal-green">Authenticity:</span>
            <span className="text-terminal-success">{biometric?.authenticity || '--'}%</span>
          </div>
        </div>
      </div>
      
      {/* Validation Status */}
      <div className="mb-4">
        <h3 className="text-terminal-orange mb-3">🔐 Validation Status:</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <span className={`status-indicator ${deviceConnected ? 'status-online' : 'status-offline'}`}></span>
            <span className={getStatusColor(deviceConnected)}>
              {getStatusIcon(deviceConnected)} Device {getStatusText(deviceConnected)}
            </span>
          </div>
          <div className="flex items-center">
            <span className={`status-indicator ${biometricVerified ? 'status-online' : 'status-offline'}`}></span>
            <span className={getStatusColor(biometricVerified)}>
              {getStatusIcon(biometricVerified)} Biometric {getStatusText(biometricVerified)}
            </span>
          </div>
          <div className="flex items-center">
            <span className={`status-indicator ${mlProcessing ? 'status-online' : 'status-offline'}`}></span>
            <span className={getStatusColor(mlProcessing)}>
              {getStatusIcon(mlProcessing)} ML Processing Active
            </span>
          </div>
          <div className="flex items-center">
            <span className={`status-indicator ${antiSpoofing ? 'status-online' : 'status-warning'}`}></span>
            <span className={antiSpoofing ? 'text-terminal-success' : 'text-terminal-warning'}>
              {antiSpoofing ? '✅' : '⚠️'} Anti-Spoofing Check
            </span>
          </div>
        </div>
      </div>
      
      {/* Next Validation */}
      <div className="bg-terminal-surface p-3 rounded border border-terminal-border">
        <div className="text-terminal-orange text-sm mb-2">⏱️ Next Validation:</div>
        <div className="text-terminal-cyan text-lg font-bold">{formatTime(nextValidation)}</div>
        <div className="text-terminal-green text-xs">Auto-mining enabled</div>
      </div>
    </div>
  );
}
