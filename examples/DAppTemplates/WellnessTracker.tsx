import React, { useState, useEffect } from 'react';
import { 
  EmotionalChainProvider, 
  useEmotionalWallet, 
  useBiometricAuth, 
  useEmotionalChainFormatter,
  EmotionalChainErrorBoundary 
} from '../../sdk/ReactSDK';

/**
 * EmotionalChain Wellness Tracker DApp Template
 * 
 * A complete example of building a wellness tracking application
 * that uses biometric data and emotional consensus for authentic
 * wellness records on the blockchain.
 */

// Main DApp Component
const WellnessTrackerApp: React.FC = () => {
  return (
    <EmotionalChainProvider
      config={{ 
        endpoint: 'https://mainnet.emotionalchain.io',
        network: 'mainnet'
      }}
      autoConnect={true}
    >
      <EmotionalChainErrorBoundary>
        <div className="wellness-tracker">
          <Header />
          <Dashboard />
          <BiometricMonitor />
          <WellnessHistory />
        </div>
      </EmotionalChainErrorBoundary>
    </EmotionalChainProvider>
  );
};

// Header Component
const Header: React.FC = () => {
  const { wallet, connect, disconnect, isConnected, emotionalScore } = useEmotionalWallet();
  const { formatEmotionalScore, formatAddress } = useEmotionalChainFormatter();

  return (
    <header className="wellness-header">
      <h1>🧘 EmotionalChain Wellness Tracker</h1>
      <div className="connection-status">
        {isConnected ? (
          <div className="connected">
            <span className="wallet-info">
              Wallet: {formatAddress(wallet!.address)}
            </span>
            <span className="emotional-score">
              Emotional Score: {formatEmotionalScore(emotionalScore)}
            </span>
            <button onClick={disconnect} className="disconnect-btn">
              Disconnect
            </button>
          </div>
        ) : (
          <button onClick={connect} className="connect-btn">
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
};

// Main Dashboard
const Dashboard: React.FC = () => {
  const { isConnected } = useEmotionalWallet();
  const [dailyGoal, setDailyGoal] = useState(75);
  const [currentScore, setCurrentScore] = useState(0);
  const [weeklyAverage, setWeeklyAverage] = useState(0);
  const [streak, setStreak] = useState(0);

  if (!isConnected) {
    return (
      <div className="connect-prompt">
        <h2>Connect your wallet to start wellness tracking</h2>
        <p>Track your emotional wellness with authentic biometric data on the blockchain</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="wellness-stats">
        <div className="stat-card">
          <h3>Today's Score</h3>
          <div className="score-display">
            <span className={`score ${currentScore >= dailyGoal ? 'goal-met' : ''}`}>
              {currentScore.toFixed(1)}%
            </span>
            <span className="goal">Goal: {dailyGoal}%</span>
          </div>
        </div>
        
        <div className="stat-card">
          <h3>Weekly Average</h3>
          <div className="score-display">
            <span className="score">{weeklyAverage.toFixed(1)}%</span>
          </div>
        </div>
        
        <div className="stat-card">
          <h3>Wellness Streak</h3>
          <div className="score-display">
            <span className="streak">{streak} days</span>
          </div>
        </div>
      </div>
      
      <WellnessGoals dailyGoal={dailyGoal} setDailyGoal={setDailyGoal} />
    </div>
  );
};

// Wellness Goals Component
interface WellnessGoalsProps {
  dailyGoal: number;
  setDailyGoal: (goal: number) => void;
}

const WellnessGoals: React.FC<WellnessGoalsProps> = ({ dailyGoal, setDailyGoal }) => {
  const [customGoal, setCustomGoal] = useState(dailyGoal.toString());

  const handleGoalUpdate = () => {
    const newGoal = parseInt(customGoal);
    if (newGoal >= 50 && newGoal <= 100) {
      setDailyGoal(newGoal);
    }
  };

  return (
    <div className="wellness-goals">
      <h3>Wellness Goals</h3>
      <div className="goal-setting">
        <label>Daily Emotional Score Target:</label>
        <input
          type="number"
          min="50"
          max="100"
          value={customGoal}
          onChange={(e) => setCustomGoal(e.target.value)}
        />
        <button onClick={handleGoalUpdate}>Update Goal</button>
      </div>
    </div>
  );
};

// Biometric Monitor Component
const BiometricMonitor: React.FC = () => {
  const { 
    devices, 
    currentState, 
    isMonitoring, 
    scanDevices, 
    connectDevice, 
    startMonitoring, 
    stopMonitoring,
    authenticate,
    loading 
  } = useBiometricAuth();

  const [wellnessRecord, setWellnessRecord] = useState<any>(null);
  const { sendTransaction } = useEmotionalWallet();

  useEffect(() => {
    // Scan for devices on component mount
    scanDevices();
  }, [scanDevices]);

  const handleRecordWellness = async () => {
    try {
      // Authenticate with biometrics
      const authResult = await authenticate();
      
      // Create wellness record transaction
      const wellnessData = {
        timestamp: Date.now(),
        emotionalScore: authResult.overall,
        stress: authResult.stress,
        focus: authResult.focus,
        authenticity: authResult.authenticity,
        biometricProof: authResult.biometricProof
      };
      
      // Send to blockchain (simplified - would use custom transaction type)
      const tx = await sendTransaction(
        '0x0000000000000000000000000000000000000000', // Wellness contract address
        0, // No EMO transfer, just data
        true // Require emotional authentication
      );
      
      setWellnessRecord({ ...wellnessData, transactionHash: tx.hash });
      
    } catch (error) {
      console.error('Failed to record wellness:', error);
    }
  };

  return (
    <div className="biometric-monitor">
      <h3>Biometric Monitoring</h3>
      
      <div className="device-management">
        <div className="device-list">
          <h4>Connected Devices ({devices.filter(d => d.status === 'connected').length})</h4>
          {devices.map(device => (
            <div key={device.id} className={`device ${device.status}`}>
              <span className="device-name">{device.name}</span>
              <span className="device-type">{device.type}</span>
              <span className="device-status">{device.status}</span>
              {device.status === 'disconnected' && (
                <button onClick={() => connectDevice(device.id)}>Connect</button>
              )}
              {device.batteryLevel && (
                <span className="battery">🔋 {device.batteryLevel}%</span>
              )}
            </div>
          ))}
        </div>
        
        <div className="monitoring-controls">
          <button onClick={scanDevices} disabled={loading}>
            Scan Devices
          </button>
          {!isMonitoring ? (
            <button onClick={startMonitoring} disabled={loading || devices.length === 0}>
              Start Monitoring
            </button>
          ) : (
            <button onClick={stopMonitoring}>Stop Monitoring</button>
          )}
        </div>
      </div>

      {currentState && (
        <div className="current-readings">
          <h4>Current Emotional State</h4>
          <div className="emotion-metrics">
            <div className="metric">
              <span className="label">Overall:</span>
              <span className="value">{currentState.overall.toFixed(1)}%</span>
            </div>
            <div className="metric">
              <span className="label">Stress:</span>
              <span className="value">{currentState.stress.toFixed(1)}%</span>
            </div>
            <div className="metric">
              <span className="label">Focus:</span>
              <span className="value">{currentState.focus.toFixed(1)}%</span>
            </div>
            <div className="metric">
              <span className="label">Authenticity:</span>
              <span className="value">{currentState.authenticity.toFixed(1)}%</span>
            </div>
          </div>
          
          <button 
            onClick={handleRecordWellness}
            className="record-wellness-btn"
            disabled={!isMonitoring || loading}
          >
            Record Wellness Session
          </button>
        </div>
      )}

      {wellnessRecord && (
        <div className="wellness-recorded">
          <h4>✅ Wellness Session Recorded</h4>
          <p>Transaction: {wellnessRecord.transactionHash}</p>
          <p>Emotional Score: {wellnessRecord.emotionalScore.toFixed(1)}%</p>
        </div>
      )}
    </div>
  );
};

// Wellness History Component
const WellnessHistory: React.FC = () => {
  const [wellnessHistory, setWellnessHistory] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<'1d' | '7d' | '30d'>('7d');
  const { formatTimestamp } = useEmotionalChainFormatter();

  useEffect(() => {
    // Load wellness history from blockchain
    loadWellnessHistory();
  }, [timeframe]);

  const loadWellnessHistory = async () => {
    // This would query the blockchain for wellness records
    // For demo purposes, using mock data
    const mockHistory = [
      { date: Date.now() - 86400000, score: 82.5, stress: 75, focus: 88, authenticity: 91 },
      { date: Date.now() - 172800000, score: 78.2, stress: 72, focus: 85, authenticity: 88 },
      { date: Date.now() - 259200000, score: 85.1, stress: 80, focus: 92, authenticity: 93 },
      { date: Date.now() - 345600000, score: 76.8, stress: 70, focus: 84, authenticity: 86 },
      { date: Date.now() - 432000000, score: 81.3, stress: 78, focus: 87, authenticity: 90 },
    ];
    setWellnessHistory(mockHistory);
  };

  return (
    <div className="wellness-history">
      <h3>Wellness History</h3>
      
      <div className="timeframe-selector">
        <button 
          className={timeframe === '1d' ? 'active' : ''}
          onClick={() => setTimeframe('1d')}
        >
          24 Hours
        </button>
        <button 
          className={timeframe === '7d' ? 'active' : ''}
          onClick={() => setTimeframe('7d')}
        >
          7 Days
        </button>
        <button 
          className={timeframe === '30d' ? 'active' : ''}
          onClick={() => setTimeframe('30d')}
        >
          30 Days
        </button>
      </div>

      <div className="history-list">
        {wellnessHistory.map((record, index) => (
          <div key={index} className="history-item">
            <div className="date">{formatTimestamp(record.date)}</div>
            <div className="scores">
              <span className="overall-score">{record.score.toFixed(1)}%</span>
              <div className="detailed-scores">
                <span>Stress: {record.stress}%</span>
                <span>Focus: {record.focus}%</span>
                <span>Auth: {record.authenticity}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <WellnessInsights history={wellnessHistory} />
    </div>
  );
};

// Wellness Insights Component
interface WellnessInsightsProps {
  history: any[];
}

const WellnessInsights: React.FC<WellnessInsightsProps> = ({ history }) => {
  const averageScore = history.reduce((sum, record) => sum + record.score, 0) / history.length;
  const trend = history.length > 1 ? 
    (history[0].score - history[history.length - 1].score > 0 ? 'improving' : 'declining') : 
    'stable';

  return (
    <div className="wellness-insights">
      <h4>Wellness Insights</h4>
      <div className="insights">
        <div className="insight">
          <span className="label">Average Score:</span>
          <span className="value">{averageScore.toFixed(1)}%</span>
        </div>
        <div className="insight">
          <span className="label">Trend:</span>
          <span className={`value trend-${trend}`}>{trend}</span>
        </div>
        <div className="insight">
          <span className="label">Best Day:</span>
          <span className="value">
            {Math.max(...history.map(r => r.score)).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

// CSS Styles (would typically be in a separate file)
const styles = `
.wellness-tracker {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.wellness-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 30px;
}

.connection-status .connected {
  display: flex;
  align-items: center;
  gap: 15px;
}

.emotional-score {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
}

.dashboard {
  margin-bottom: 40px;
}

.wellness-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  text-align: center;
}

.score-display .score {
  display: block;
  font-size: 2.5em;
  font-weight: bold;
  color: #667eea;
}

.score-display .score.goal-met {
  color: #4CAF50;
}

.biometric-monitor {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.device-list {
  margin-bottom: 20px;
}

.device {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 10px;
}

.device.connected {
  border-color: #4CAF50;
  background-color: #f8fff8;
}

.emotion-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.metric {
  text-align: center;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.metric .value {
  display: block;
  font-size: 1.5em;
  font-weight: bold;
  color: #667eea;
}

.record-wellness-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.record-wellness-btn:hover {
  transform: translateY(-2px);
}

.wellness-history {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.timeframe-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.timeframe-selector button {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
}

.timeframe-selector button.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.overall-score {
  font-size: 1.2em;
  font-weight: bold;
  color: #667eea;
}

.detailed-scores {
  display: flex;
  gap: 15px;
  font-size: 0.9em;
  color: #666;
}

.wellness-insights {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.insights {
  display: flex;
  gap: 30px;
}

.insight {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.insight .label {
  font-size: 0.9em;
  color: #666;
  margin-bottom: 5px;
}

.insight .value {
  font-size: 1.1em;
  font-weight: bold;
}

.trend-improving { color: #4CAF50; }
.trend-declining { color: #f44336; }
.trend-stable { color: #666; }

.connect-prompt {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.wellness-recorded {
  background: #f8fff8;
  border: 1px solid #4CAF50;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
}
`;

// Add styles to document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default WellnessTrackerApp;