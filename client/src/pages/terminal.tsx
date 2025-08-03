import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/use-websocket';
import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ExternalLink } from 'lucide-react';
import AsciBanner from '@/components/terminal/ascii-banner';
import TerminalInterface from '@/components/terminal/terminal-interface';
import BlockchainExplorer from '@/components/terminal/blockchain-explorer';
import ConsensusMonitor from '@/components/terminal/consensus-monitor';
import ValidatorDashboard from '@/components/terminal/validator-dashboard';
import BiometricStatus from '@/components/terminal/biometric-status';
import TokenEconomics from '@/components/terminal/token-economics';
import VisualBlocks from '@/components/terminal/visual-blocks';
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
          <div className="flex justify-between items-start mb-4">
            <AsciBanner className="flex-1" />
            <div className="flex gap-2 flex-wrap">
              <Link href="/privacy">
                <div className="bg-terminal-success/20 hover:bg-terminal-success/30 border border-terminal-success rounded px-3 py-2 text-terminal-success font-mono text-xs transition-colors cursor-pointer flex items-center gap-2">
                  <ExternalLink size={14} />
                  PRIVACY
                </div>
              </Link>
              <Link href="/monitoring">
                <div className="bg-terminal-success/20 hover:bg-terminal-success/30 border border-terminal-success rounded px-3 py-2 text-terminal-success font-mono text-xs transition-colors cursor-pointer flex items-center gap-2">
                  <ExternalLink size={14} />
                  MONITORING
                </div>
              </Link>
              <Link href="/ai-consensus">
                <div className="bg-terminal-cyan/20 hover:bg-terminal-cyan/30 border border-terminal-cyan rounded px-3 py-2 text-terminal-cyan font-mono text-xs transition-colors cursor-pointer flex items-center gap-2">
                  <ExternalLink size={14} />
                  AI CONSENSUS
                </div>
              </Link>
              <Link href="/ai-learning">
                <div className="bg-terminal-warning/20 hover:bg-terminal-warning/30 border border-terminal-warning rounded px-3 py-2 text-terminal-warning font-mono text-xs transition-colors cursor-pointer flex items-center gap-2">
                  <ExternalLink size={14} />
                  AI LEARNING
                </div>
              </Link>
              <Link href="/explorer">
                <div className="bg-terminal-success/20 hover:bg-terminal-success/30 border border-terminal-success rounded px-3 py-2 text-terminal-success font-mono text-xs transition-colors cursor-pointer flex items-center gap-2">
                  <ExternalLink size={14} />
                  EXPLORER
                </div>
              </Link>
            </div>
          </div>
          
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

        {/* Visual Block Explorer - Full Width */}
        <VisualBlocks />

        {/* Command Interface & Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Terminal Command Interface & Blockchain Explorer */}
          <div className="space-y-6">
            <TerminalInterface />
            <BlockchainExplorer />
          </div>

          {/* Sidebar: Token Economics & Network Status */}
          <div className="space-y-6">
            <TokenEconomics />
            <ConsensusMonitor />
            <ValidatorDashboard />
            <BiometricStatus />
          </div>
        </div>

        {/* Footer */}
        <div className="terminal-window rounded-lg p-4 mt-6">
          <div className="ascii-art text-terminal-green text-center text-xs">
            {`┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  EmotionalChain v1.0.0 | PoE Consensus Active | Network: Custom                          │
│  Connected to Network | Block Height: ${stats ? stats.blockHeight : '----'} | Validators: ${stats ? stats.activeValidators : '--'}/${stats ? stats.activeValidators : '--'} | Status: ✅ OPERATIONAL │
└─────────────────────────────────────────────────────────────────────────────────────────┘`}
          </div>
        </div>
      </div>
    </div>
  );
}
