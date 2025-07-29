import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/use-websocket';
import { useEffect, useState } from 'react';
import AsciBanner from '@/components/terminal/ascii-banner';
import TerminalInterface from '@/components/terminal/terminal-interface';
import BlockchainExplorer from '@/components/terminal/blockchain-explorer';
import ConsensusMonitor from '@/components/terminal/consensus-monitor';
import ValidatorDashboard from '@/components/terminal/validator-dashboard';
import BiometricStatus from '@/components/terminal/biometric-status';
import type { NetworkStats } from '@shared/schema';

export default function Terminal() {
  const [realtimeStats, setRealtimeStats] = useState<NetworkStats | null>(null);
  const { lastMessage } = useWebSocket();

  const { data: networkStatus } = useQuery<{ stats: NetworkStats }>({
    queryKey: ['/api/network/status']
  });

  // Update with real-time data from WebSocket
  useEffect(() => {
    if (lastMessage?.type === 'update' && lastMessage.data?.networkStatus?.stats) {
      setRealtimeStats(lastMessage.data.networkStatus.stats);
    }
  }, [lastMessage]);

  const stats = realtimeStats || networkStatus?.stats;

  const formatNumber = (num: number | string) => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    return n.toLocaleString('en-US');
  };

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-green relative">
      {/* Matrix Rain Effect (decorative) */}
      <div className="matrix-rain">
        <div className="absolute inset-0 text-terminal-green text-xs opacity-20 pointer-events-none"></div>
      </div>

      <div className="relative z-10 p-4">
        {/* Main Terminal Header */}
        <div className="terminal-window rounded-lg p-6 mb-6">
          <AsciBanner className="mb-4" />
          
          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-terminal-surface p-3 rounded border border-terminal-border">
              <div className="flex items-center mb-2">
                <span className="status-indicator status-online"></span>
                <span className="text-terminal-success">NETWORK STATUS</span>
              </div>
              <div className="text-terminal-cyan">Connected Peers: {stats ? formatNumber(stats.connectedPeers) : '--'}</div>
              <div className="text-terminal-cyan">Block Height: {stats ? formatNumber(stats.blockHeight) : '--'}</div>
            </div>
            
            <div className="bg-terminal-surface p-3 rounded border border-terminal-border">
              <div className="flex items-center mb-2">
                <span className="status-indicator status-online"></span>
                <span className="text-terminal-success">PoE CONSENSUS</span>
              </div>
              <div className="text-terminal-cyan">Validators: {stats ? stats.activeValidators : '--'}</div>
              <div className="text-terminal-cyan">Consensus: {stats ? parseFloat(stats.consensusPercentage).toFixed(1) : '--'}%</div>
            </div>
            
            <div className="bg-terminal-surface p-3 rounded border border-terminal-border">
              <div className="flex items-center mb-2">
                <span className="status-indicator status-warning"></span>
                <span className="text-terminal-warning">BIOMETRIC VAL</span>
              </div>
              <div className="text-terminal-cyan">Active: {stats ? Math.floor(stats.activeValidators * 0.85) : '--'}/{stats ? stats.activeValidators : '--'}</div>
              <div className="text-terminal-cyan">Avg Auth: 94.3%</div>
            </div>
            
            <div className="bg-terminal-surface p-3 rounded border border-terminal-border">
              <div className="flex items-center mb-2">
                <span className="status-indicator status-online"></span>
                <span className="text-terminal-success">WALLET STATUS</span>
              </div>
              <div className="text-terminal-cyan">Balance: 15,420 EMO</div>
              <div className="text-terminal-cyan">Staked: 10,000 EMO</div>
            </div>
          </div>
        </div>

        {/* Command Interface & Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Terminal Command Interface & Blockchain Explorer */}
          <div className="xl:col-span-2 space-y-6">
            <TerminalInterface />
            <BlockchainExplorer />
          </div>

          {/* Sidebar: Network Status & Validator Dashboard */}
          <div className="space-y-6">
            <ConsensusMonitor />
            <ValidatorDashboard />
            <BiometricStatus />
          </div>
        </div>

        {/* Footer */}
        <div className="terminal-window rounded-lg p-4 mt-6">
          <div className="ascii-art text-terminal-green text-center text-xs">
            {`┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  EmotionalChain v2.1.0 | PoE Consensus Active | 🧠 Research: Altug Tatlisu, Bytus Tech  │
│  Connected to Network | Block Height: ${stats ? stats.blockHeight : '----'} | Validators: ${stats ? stats.activeValidators : '--'}/${stats ? stats.activeValidators : '--'} | Status: ✅ OPERATIONAL │
└─────────────────────────────────────────────────────────────────────────────────────────┘`}
          </div>
        </div>
      </div>
    </div>
  );
}
