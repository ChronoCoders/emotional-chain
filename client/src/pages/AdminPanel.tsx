import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Shield, Server, Users, Settings, Database, Monitor, AlertTriangle } from "lucide-react";
import EmotionalChainLogo from '@/components/ui/emotional-chain-logo';
import TerminalInterface from '@/components/terminal/terminal-interface';

export default function AdminPanel() {
  const { data: networkStats } = useQuery({
    queryKey: ['/api/network/status'],
  });

  const { data: allWallets } = useQuery<Array<{ validatorId: string; balance: number; currency: string }>>({
    queryKey: ['/api/wallets'],
    staleTime: 30000,
    refetchInterval: 30000
  });

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  // Calculate total network value
  const totalNetworkValue = allWallets?.reduce((sum, wallet) => sum + wallet.balance, 0) || 0;

  return (
    <div className="min-h-screen bg-black text-terminal-green font-mono">
      {/* Header */}
      <header className="terminal-window p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <EmotionalChainLogo size={32} className="text-terminal-cyan" />
            <div>
              <h1 className="text-2xl font-bold text-terminal-green terminal-text">&gt; Admin Panel</h1>
              <p className="text-terminal-orange terminal-text">⚠️ Administrative Access - Use with Caution</p>
            </div>
          </div>
          <div className="flex space-x-4">
            <Link href="/explorer" className="text-terminal-cyan hover:text-terminal-success transition-colors terminal-text">
              [Explorer]
            </Link>
            <Link href="/" className="text-terminal-cyan hover:text-terminal-success transition-colors terminal-text">
              [Exit Admin]
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 space-y-8">
        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="terminal-window p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-terminal-green text-sm font-medium terminal-text">SYSTEM STATUS</h3>
              <Server className="w-5 h-5 text-terminal-success" />
            </div>
            <p className="text-2xl font-bold text-terminal-success terminal-text">OPERATIONAL</p>
            <p className="text-terminal-green/70 text-sm terminal-text">All systems running</p>
          </div>
          
          <div className="terminal-window p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-terminal-green text-sm font-medium terminal-text">ACTIVE VALIDATORS</h3>
              <Users className="w-5 h-5 text-terminal-cyan" />
            </div>
            <p className="text-2xl font-bold text-terminal-cyan terminal-text">
              {networkStats?.stats?.activeValidators || 21}
            </p>
            <p className="text-terminal-green/70 text-sm terminal-text">100% consensus</p>
          </div>
          
          <div className="terminal-window p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-terminal-green text-sm font-medium terminal-text">TOTAL NETWORK VALUE</h3>
              <Database className="w-5 h-5 text-terminal-gold" />
            </div>
            <p className="text-2xl font-bold text-terminal-gold terminal-text">
              {formatNumber(Math.round(totalNetworkValue))} EMO
            </p>
            <p className="text-terminal-green/70 text-sm terminal-text">Across all validators</p>
          </div>
          
          <div className="terminal-window p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-terminal-green text-sm font-medium terminal-text">NETWORK HEALTH</h3>
              <Monitor className="w-5 h-5 text-terminal-success" />
            </div>
            <p className="text-2xl font-bold text-terminal-success terminal-text">
              {networkStats?.stats?.emotionalAverage || 78}%
            </p>
            <p className="text-terminal-green/70 text-sm terminal-text">Emotional consensus</p>
          </div>
        </div>

        {/* Admin Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="terminal-window p-6">
            <h2 className="text-xl font-semibold text-terminal-green mb-6 terminal-text">[⚙️] System Controls</h2>
            
            <div className="space-y-4">
              <button className="w-full bg-terminal-orange/20 border border-terminal-orange text-terminal-orange px-4 py-3 hover:bg-terminal-orange/30 transition-colors terminal-text flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Network Configuration
              </button>
              
              <button className="w-full bg-terminal-cyan/20 border border-terminal-cyan text-terminal-cyan px-4 py-3 hover:bg-terminal-cyan/30 transition-colors terminal-text flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Validator Management
              </button>
              
              <button className="w-full bg-terminal-gold/20 border border-terminal-gold text-terminal-gold px-4 py-3 hover:bg-terminal-gold/30 transition-colors terminal-text flex items-center">
                <Database className="w-4 h-4 mr-2" />
                Database Operations
              </button>
              
              <button className="w-full bg-terminal-warning/20 border border-terminal-warning text-terminal-warning px-4 py-3 hover:bg-terminal-warning/30 transition-colors terminal-text flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Emergency Controls
              </button>
            </div>
          </div>
          
          <div className="terminal-window p-6">
            <h2 className="text-xl font-semibold text-terminal-green mb-6 terminal-text">[📊] System Metrics</h2>
            
            <div className="space-y-4">
              <div className="bg-terminal-surface border border-terminal-border p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-terminal-green terminal-text">CPU Usage</span>
                  <span className="text-terminal-success terminal-text">12%</span>
                </div>
                <div className="w-full bg-terminal-surface h-2">
                  <div className="bg-terminal-success h-2" style={{ width: '12%' }}></div>
                </div>
              </div>
              
              <div className="bg-terminal-surface border border-terminal-border p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-terminal-green terminal-text">Memory Usage</span>
                  <span className="text-terminal-cyan terminal-text">34%</span>
                </div>
                <div className="w-full bg-terminal-surface h-2">
                  <div className="bg-terminal-cyan h-2" style={{ width: '34%' }}></div>
                </div>
              </div>
              
              <div className="bg-terminal-surface border border-terminal-border p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-terminal-green terminal-text">Network I/O</span>
                  <span className="text-terminal-gold terminal-text">67%</span>
                </div>
                <div className="w-full bg-terminal-surface h-2">
                  <div className="bg-terminal-gold h-2" style={{ width: '67%' }}></div>
                </div>
              </div>
              
              <div className="bg-terminal-surface border border-terminal-border p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-terminal-green terminal-text">Consensus Load</span>
                  <span className="text-terminal-orange terminal-text">89%</span>
                </div>
                <div className="w-full bg-terminal-surface h-2">
                  <div className="bg-terminal-orange h-2" style={{ width: '89%' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="terminal-window p-6">
            <h2 className="text-xl font-semibold text-terminal-green mb-6 terminal-text">[🔒] Security Status</h2>
            
            <div className="space-y-4">
              <div className="bg-terminal-surface border border-terminal-success p-3">
                <div className="flex items-center mb-2">
                  <Shield className="w-4 h-4 text-terminal-success mr-2" />
                  <span className="text-terminal-success terminal-text">Firewall Active</span>
                </div>
                <p className="text-terminal-green/70 text-xs terminal-text">All ports secured</p>
              </div>
              
              <div className="bg-terminal-surface border border-terminal-success p-3">
                <div className="flex items-center mb-2">
                  <Shield className="w-4 h-4 text-terminal-success mr-2" />
                  <span className="text-terminal-success terminal-text">SSL Certificates Valid</span>
                </div>
                <p className="text-terminal-green/70 text-xs terminal-text">Expires in 89 days</p>
              </div>
              
              <div className="bg-terminal-surface border border-terminal-success p-3">
                <div className="flex items-center mb-2">
                  <Shield className="w-4 h-4 text-terminal-success mr-2" />
                  <span className="text-terminal-success terminal-text">Auth System Online</span>
                </div>
                <p className="text-terminal-green/70 text-xs terminal-text">JWT validation active</p>
              </div>
              
              <div className="bg-terminal-surface border border-terminal-warning p-3">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="w-4 h-4 text-terminal-warning mr-2" />
                  <span className="text-terminal-warning terminal-text">High Privilege Session</span>
                </div>
                <p className="text-terminal-green/70 text-xs terminal-text">Admin access active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Full Terminal Interface for Admins */}
        <div className="terminal-window p-6">
          <h2 className="text-xl font-semibold text-terminal-green mb-6 terminal-text">[🖥️] Full System Terminal</h2>
          <div className="bg-terminal-surface border-2 border-terminal-border p-4">
            <TerminalInterface />
          </div>
        </div>
      </div>
    </div>
  );
}