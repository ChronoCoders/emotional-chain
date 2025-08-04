import { useQuery } from '@tanstack/react-query';
import type { BiometricData, Validator } from '@shared/schema';

export default function BiometricStatus() {
  const { data: validators = [] } = useQuery<Validator[]>({
    queryKey: ['/api/validators']
  });

  const currentValidator = validators[0];

  const { data: biometric } = useQuery<BiometricData>({
    queryKey: ['/api/biometric', currentValidator?.id],
    enabled: !!currentValidator?.id
  });

  return (
    <div className="terminal-window rounded-lg p-6">
      <h2 className="text-terminal-cyan text-lg font-bold font-mono mb-4">
        +===== BIOMETRIC_VALIDATION =====+
      </h2>
      
      {!biometric ? (
        <div className="text-center text-terminal-warning p-8">
          <p className="mb-2">❌ No Biometric Device Connected</p>
          <p className="text-sm text-terminal-muted">
            Connect your Apple Watch, Fitbit, or Samsung Galaxy Watch<br />
            to enable Proof of Emotion validation
          </p>
        </div>
      ) : (
        <>
          {/* Real Biometric Data from your blockchain */}
          <div className="mb-4">
            <h3 className="text-terminal-orange mb-3">💓 Live Biometric Data:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-terminal-green">Heart Rate:</span>
                <span className="text-terminal-cyan">{biometric.heartRate} BPM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-green">HRV:</span>
                <span className="text-terminal-cyan">{biometric.hrv}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-green">Stress Level:</span>
                <span className="text-terminal-success">{biometric.stressLevel}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-green">Focus Level:</span>
                <span className="text-terminal-cyan">{biometric.focusLevel}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-green">Authenticity:</span>
                <span className="text-terminal-success">{biometric.authenticity}%</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
