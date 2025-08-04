import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/use-websocket';
import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ExternalLink, Activity, Users, Coins, BarChart3, Monitor, TrendingUp, Heart, Brain } from 'lucide-react';
import AsciBanner from '@/components/terminal/ascii-banner';
import TerminalInterface from '@/components/terminal/terminal-interface';
import BlockchainExplorer from '@/components/terminal/blockchain-explorer';
import ConsensusMonitor from '@/components/terminal/consensus-monitor';
import ValidatorDashboard from '@/components/terminal/validator-dashboard';
import BiometricStatus from '@/components/terminal/biometric-status';
import TokenEconomics from '@/components/terminal/token-economics';
import VisualBlocks from '@/components/terminal/visual-blocks';
import MobileResponsiveTerminal from '@/components/layout/MobileResponsiveTerminal';
import EmotionalTrendChart from '@/components/charts/EmotionalTrendChart';
import { useResponsive } from '@/components/layout/MobileResponsiveTerminal';
import type { NetworkStats } from '@shared/schema';

export default function Terminal() {
  const [realtimeStats, setRealtimeStats] = useState<NetworkStats | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const { lastMessage } = useWebSocket();
  const deviceInfo = useResponsive();

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

  // Generate mock emotional trend data
  const generateEmotionalTrendData = () => {
    const now = Date.now();
    const data = [];
    const points = timeRange === '1h' ? 12 : timeRange === '6h' ? 36 : timeRange === '24h' ? 48 : 168;
    const interval = timeRange === '1h' ? 5 * 60 * 1000 : timeRange === '6h' ? 10 * 60 * 1000 : timeRange === '24h' ? 30 * 60 * 1000 : 60 * 60 * 1000;
    
    for (let i = points; i >= 0; i--) {
      data.push({
        timestamp: now - (i * interval),
        blockHeight: 9920 + (points - i),
        averageEmotionalScore: 75 + Math.sin(i * 0.1) * 10 + Math.random() * 5,
        heartRateAvg: 75 + Math.sin(i * 0.05) * 15 + Math.random() * 8,
        stressLevelAvg: 25 + Math.sin(i * 0.08) * 10 + Math.random() * 5,
        focusLevelAvg: 80 + Math.cos(i * 0.06) * 12 + Math.random() * 6,
        validatorCount: 21,
        consensusStrength: 85 + Math.sin(i * 0.04) * 8 + Math.random() * 4
      });
    }
    return data;
  };

  // Generate validator performance data
  const generateValidatorPerformance = () => {
    const validators = [
      { name: 'StellarNode', baseScore: 92 },
      { name: 'NebulaForge', baseScore: 88 },
      { name: 'QuantumReach', baseScore: 85 },
      { name: 'OrionPulse', baseScore: 76 },
      { name: 'DarkMatterLabs', baseScore: 82 },
      { name: 'GravityCore', baseScore: 94 },
      { name: 'AstroSentinel', baseScore: 78 },
      { name: 'ByteGuardians', baseScore: 68 }
    ];
    return validators.map(({ name, baseScore }) => ({
      validatorId: name,
      emotionalScore: Math.max(60, Math.min(98, baseScore + (Math.random() - 0.5) * 10)),
      consistency: 80 + Math.random() * 20,
      participation: 90 + Math.random() * 10,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    }));
  };

  // If on mobile or tablet, use the responsive terminal layout
  if (deviceInfo.isMobile || deviceInfo.isTablet) {
    const sections = [
      {
        id: 'validator-status',
        title: 'Validator Status',
        icon: <Activity className="w-4 h-4" />,
        content: <ValidatorDashboard walletData={walletData} networkStats={stats} />,
        collapsible: true,
        defaultCollapsed: false
      },
      {
        id: 'blockchain-stats',
        title: 'Blockchain Stats',
        icon: <BarChart3 className="w-4 h-4" />,
        content: <TokenEconomics allWallets={allWallets} networkStats={stats} />,
        collapsible: true,
        defaultCollapsed: deviceInfo.isMobile
      },
      {
        id: 'consensus-monitor',
        title: 'Consensus Monitor',
        icon: <Users className="w-4 h-4" />,
        content: <ConsensusMonitor networkStats={stats} />,
        collapsible: true,
        defaultCollapsed: deviceInfo.isMobile
      },
      {
        id: 'biometric-status',
        title: 'Biometric Status',
        icon: <Heart className="w-4 h-4" />,
        content: <BiometricStatus />,
        collapsible: true,
        defaultCollapsed: deviceInfo.isMobile
      },
      {
        id: 'emotional-trends',
        title: 'Emotional Trends',
        icon: <TrendingUp className="w-4 h-4" />,
        content: (
          <EmotionalTrendChart
            data={generateEmotionalTrendData()}
            validatorPerformance={generateValidatorPerformance()}
            timeRange={timeRange}
            onTimeRangeChange={(range) => setTimeRange(range as any)}
          />
        ),
        collapsible: true,
        defaultCollapsed: false  // Show emotional trends by default
      },
      {
        id: 'blockchain-explorer',
        title: 'Blockchain Explorer',
        icon: <Coins className="w-4 h-4" />,
        content: <BlockchainExplorer />,
        collapsible: true,
        defaultCollapsed: true
      }
    ];

    const header = (
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Monitor className="w-5 h-5 text-blue-500" />
          <h1 className="text-lg font-bold text-gray-900">
            EmotionalChain
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/privacy">
            <div className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-colors cursor-pointer flex items-center gap-2">
              <ExternalLink size={14} />
              Privacy
            </div>
          </Link>
        </div>
      </div>
    );

    const footer = (
      <div className="text-center text-sm text-gray-500">
        <div className="flex justify-center items-center space-x-4">
          <span>Block {stats?.blockHeight?.toLocaleString() || '9,920+'}</span>
          <span>•</span>
          <span>{stats?.totalSupply ? formatNumber(stats.totalSupply) : '577K+'} EMO</span>
          <span>•</span>
          <span>21 Validators</span>
        </div>
      </div>
    );

    return (
      <MobileResponsiveTerminal
        sections={sections}
        header={header}
        footer={footer}
      />
    );
  }

  // Desktop/traditional terminal view
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

        {/* Emotional Trends Chart - Full Width */}
        <div className="terminal-window rounded-lg p-6 mb-6">
          <EmotionalTrendChart
            data={generateEmotionalTrendData()}
            validatorPerformance={generateValidatorPerformance()}
            timeRange={timeRange}
            onTimeRangeChange={(range) => setTimeRange(range as any)}
          />
        </div>

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
