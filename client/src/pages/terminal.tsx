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

  // Fetch all validator wallets for comprehensive dashboard
  const { data: allWallets, error: walletError, isLoading: walletLoading } = useQuery<Array<{ validatorId: string; balance: number; currency: string }>>({
    queryKey: ['/api/wallets'],
    staleTime: 30000,
    refetchInterval: 30000
  });

  // Get StellarNode wallet data from the bulk wallets response
  const walletData = allWallets?.find(w => w.validatorId === 'StellarNode');

  // Debug wallet data loading
  useEffect(() => {
    if (walletError) {
      console.log('Wallet API Error:', walletError);
    }
    if (walletData) {
      console.log('Wallet Data:', walletData);
    }
  }, [walletData, walletError]);

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
                <span className="text-terminal-success">NETWORK VALUE</span>
              </div>
              <div className="text-terminal-cyan">Total Validators: {allWallets ? allWallets.filter(w => w.balance > 0).length : '--'}</div>
              <div className="text-terminal-cyan">Avg Balance: {allWallets ? formatNumber(allWallets.reduce((sum, w) => sum + w.balance, 0) / allWallets.filter(w => w.balance > 0).length) : '--'} EMO</div>
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

        {/* Admin Access Panel - Discrete placement */}
        <div className="terminal-window rounded-lg p-4 mt-6 border border-terminal-border/30">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              {/* Clean Status Bar Design */}
              <div className="bg-terminal-surface/40 rounded-lg p-3 border border-terminal-green/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="flex items-center space-x-4">
                    <span className="text-terminal-cyan font-bold">EmotionalChain v1.0.0</span>
                    <span className="text-terminal-success">PoE Consensus Active</span>
                    <span className="text-terminal-warning">Network: Custom</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-terminal-green">Connected to Network</span>
                    <span className="text-terminal-cyan">Block Height: {stats ? stats.blockHeight : '----'}</span>
                    <span className="text-terminal-orange">Validators: {stats ? stats.activeValidators : '--'}/{stats ? stats.activeValidators : '--'}</span>
                    <span className="text-terminal-success flex items-center gap-1">
                      <span className="status-indicator status-online w-2 h-2"></span>
                      OPERATIONAL
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Admin Panel - Small discrete links */}
            <div className="ml-4 flex gap-1 opacity-60 hover:opacity-100 transition-opacity">
              <Link href="/ai-consensus">
                <div className="bg-terminal-surface/50 hover:bg-terminal-surface border border-terminal-border/50 rounded px-2 py-1 text-terminal-cyan font-mono text-xs transition-colors cursor-pointer">
                  AI-CONS
                </div>
              </Link>
              <Link href="/ai-learning">
                <div className="bg-terminal-surface/50 hover:bg-terminal-surface border border-terminal-border/50 rounded px-2 py-1 text-terminal-warning font-mono text-xs transition-colors cursor-pointer">
                  AI-LEARN
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
