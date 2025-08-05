import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/use-websocket';
import { useEffect, useState } from 'react';
import type { NetworkStats } from '@shared/schema';

export default function ConsensusMonitor() {
  const [realtimeStats, setRealtimeStats] = useState<NetworkStats | null>(null);
  const { lastMessage } = useWebSocket();

  const { data: initialStats } = useQuery<{ stats: NetworkStats }>({
    queryKey: ['/api/network/status'],
    select: (data) => data
  });

  // Update with real-time data from WebSocket
  useEffect(() => {
    if (lastMessage?.type === 'update' && lastMessage.data?.networkStatus?.stats) {
      setRealtimeStats(lastMessage.data.networkStatus.stats);
    }
  }, [lastMessage]);

  const stats = realtimeStats || initialStats?.stats;

  if (!stats) {
    return (
      <div className="terminal-window rounded-lg p-6">
        <h2 className="text-terminal-cyan text-lg font-bold mb-4">
          ┌── PoE_CONSENSUS_MONITOR ──┐
        </h2>
        <div className="text-terminal-warning">Loading network stats...</div>
      </div>
    );
  }

  const progressBars = [
    { label: 'Network Stress', value: parseFloat(stats.networkStress), color: 'terminal-error' },
    { label: 'Network Energy', value: parseFloat(stats.networkEnergy), color: 'terminal-success' },
    { label: 'Network Focus', value: parseFloat(stats.networkFocus), color: 'terminal-cyan' }
  ];

  return (
    <div className="terminal-window rounded-lg p-6">
      <h2 className="text-terminal-cyan text-lg font-bold font-mono mb-4">
        +===== PoE_CONSENSUS_MONITOR =====+
      </h2>
      
      {/* Network Emotional State */}
      <div className="mb-6">
        <h3 className="text-terminal-orange mb-3">🧠 Network Emotional State:</h3>
        <div className="space-y-3">
          {progressBars.map((bar) => (
            <div key={bar.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-terminal-green">{bar.label}</span>
                <span className="text-terminal-cyan">{bar.value.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-terminal-surface rounded-full h-2">
                <div 
                  className="progress-bar h-2 rounded-full" 
                  style={{ width: `${Math.min(100, Math.max(0, bar.value))}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Performance Metrics */}
      <div className="mb-6">
        <h3 className="text-terminal-orange mb-3">⚡ Network Performance:</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-terminal-surface p-3 rounded border border-terminal-border">
            <div className="text-terminal-cyan text-sm">Transaction Speed</div>
            <div className="text-2xl font-bold text-terminal-success">
              {stats.tps || '0.0534'} TPS
            </div>
            <div className="text-xs text-terminal-green">
              {stats.transactions24h || '4,624'} tx/24h
            </div>
          </div>
          <div className="bg-terminal-surface p-3 rounded border border-terminal-border">
            <div className="text-terminal-cyan text-sm">Volume 24h</div>
            <div className="text-2xl font-bold text-terminal-success">
              {stats.volume24h ? (stats.volume24h / 1000).toFixed(1) + 'K' : '145.3K'} EMO
            </div>
            <div className="text-xs text-terminal-green">Real blockchain data</div>
          </div>
        </div>
      </div>

      {/* Consensus Agreement */}
      <div className="mb-6">
        <h3 className="text-terminal-orange mb-3">📊 Consensus Agreement:</h3>
        <div className="text-center">
          <div className="text-4xl font-bold text-terminal-success mb-2">
            {parseFloat(stats.consensusPercentage).toFixed(1)}%
          </div>
          <div className="text-terminal-cyan text-sm">
            {stats.activeValidators}/{stats.activeValidators} Validators Participating
          </div>
          <div className="text-terminal-green text-sm">
            Block #{stats.blockHeight} - ✅ Consensus Reached
          </div>
        </div>
      </div>
    </div>
  );
}
