import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Server, Activity, Coins, Heart, Shield, Settings, TrendingUp, Users } from "lucide-react";
import EmotionalChainLogo from '@/components/ui/emotional-chain-logo';

export default function ValidatorDashboard() {
  const { data: networkStats } = useQuery({
    queryKey: ['/api/network/status'],
  });

  const { data: allWallets } = useQuery<Array<{ validatorId: string; balance: number; currency: string }>>({
    queryKey: ['/api/wallets'],
    staleTime: 30000,
    refetchInterval: 30000
  });

  // For demo purposes, showing StellarNode validator
  const validatorData = allWallets?.find(w => w.validatorId === 'StellarNode');
  const validatorId = 'StellarNode';

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  return (
    <div className="min-h-screen bg-black text-terminal-green font-mono">
      {/* Header */}
      <header className="terminal-window p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <EmotionalChainLogo size={32} className="text-terminal-cyan" />
            <div>
              <h1 className="text-2xl font-bold text-terminal-green terminal-text">&gt; Validator Dashboard</h1>
              <p className="text-terminal-cyan terminal-text">Node: {validatorId}</p>
            </div>
          </div>
          <div className="flex space-x-4">
            <Link href="/explorer" className="text-terminal-cyan hover:text-terminal-success transition-colors terminal-text">
              [Explorer]
            </Link>
            <Link href="/validator/settings" className="text-terminal-cyan hover:text-terminal-success transition-colors terminal-text">
              [Settings]
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 space-y-8">
        {/* Validator Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="terminal-window p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-terminal-green text-sm font-medium terminal-text">NODE STATUS</h3>
              <Server className="w-5 h-5 text-terminal-success" />
            </div>
            <p className="text-2xl font-bold text-terminal-success terminal-text">ACTIVE</p>
            <p className="text-terminal-green/70 text-sm terminal-text">Uptime: 99.8%</p>
          </div>
          
          <div className="terminal-window p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-terminal-green text-sm font-medium terminal-text">EMO BALANCE</h3>
              <Coins className="w-5 h-5 text-terminal-gold" />
            </div>
            <p className="text-2xl font-bold text-terminal-gold terminal-text">
              {validatorData ? formatNumber(Math.round(validatorData.balance)) : '67,142'} EMO
            </p>
            <p className="text-terminal-success text-sm terminal-text">+53.67 EMO today</p>
          </div>
          
          <div className="terminal-window p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-terminal-green text-sm font-medium terminal-text">EMOTIONAL SCORE</h3>
              <Heart className="w-5 h-5 text-terminal-orange" />
            </div>
            <p className="text-2xl font-bold text-terminal-orange terminal-text">84%</p>
            <p className="text-terminal-green/70 text-sm terminal-text">Above network avg</p>
          </div>
          
          <div className="terminal-window p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-terminal-green text-sm font-medium terminal-text">BLOCKS VALIDATED</h3>
              <Shield className="w-5 h-5 text-terminal-cyan" />
            </div>
            <p className="text-2xl font-bold text-terminal-cyan terminal-text">1,247</p>
            <p className="text-terminal-green/70 text-sm terminal-text">Last 30 days</p>
          </div>
        </div>

        {/* Validator Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="terminal-window p-6">
            <h2 className="text-xl font-semibold text-terminal-green mb-6 terminal-text">[⚙️] Node Management</h2>
            
            <div className="space-y-4">
              <div className="bg-terminal-surface border border-terminal-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-terminal-green font-medium terminal-text">Biometric Devices</h3>
                  <Activity className="w-4 h-4 text-terminal-success" />
                </div>
                <p className="text-terminal-green/70 text-sm mb-3 terminal-text">2 devices connected</p>
                <button className="w-full bg-terminal-cyan/20 border border-terminal-cyan text-terminal-cyan px-4 py-2 hover:bg-terminal-cyan/30 transition-colors terminal-text">
                  Manage Devices
                </button>
              </div>
              
              <div className="bg-terminal-surface border border-terminal-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-terminal-green font-medium terminal-text">Stake Management</h3>
                  <Coins className="w-4 h-4 text-terminal-gold" />
                </div>
                <p className="text-terminal-green/70 text-sm mb-3 terminal-text">Staked: 10,000 EMO</p>
                <button className="w-full bg-terminal-gold/20 border border-terminal-gold text-terminal-gold px-4 py-2 hover:bg-terminal-gold/30 transition-colors terminal-text">
                  Manage Stake
                </button>
              </div>
              
              <div className="bg-terminal-surface border border-terminal-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-terminal-green font-medium terminal-text">Node Configuration</h3>
                  <Settings className="w-4 h-4 text-terminal-orange" />
                </div>
                <p className="text-terminal-green/70 text-sm mb-3 terminal-text">Last updated: 2 days ago</p>
                <button className="w-full bg-terminal-orange/20 border border-terminal-orange text-terminal-orange px-4 py-2 hover:bg-terminal-orange/30 transition-colors terminal-text">
                  Configure Node
                </button>
              </div>
            </div>
          </div>
          
          <div className="terminal-window p-6">
            <h2 className="text-xl font-semibold text-terminal-green mb-6 terminal-text">[📊] Performance Metrics</h2>
            
            <div className="space-y-4">
              <div className="bg-terminal-surface border border-terminal-border p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-terminal-green terminal-text">Consensus Participation</span>
                  <span className="text-terminal-success font-medium terminal-text">98.7%</span>
                </div>
                <div className="w-full bg-terminal-surface h-2">
                  <div className="bg-terminal-success h-2" style={{ width: '98.7%' }}></div>
                </div>
              </div>
              
              <div className="bg-terminal-surface border border-terminal-border p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-terminal-green terminal-text">Emotional Authenticity</span>
                  <span className="text-terminal-orange font-medium terminal-text">84.2%</span>
                </div>
                <div className="w-full bg-terminal-surface h-2">
                  <div className="bg-terminal-orange h-2" style={{ width: '84.2%' }}></div>
                </div>
              </div>
              
              <div className="bg-terminal-surface border border-terminal-border p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-terminal-green terminal-text">Network Reputation</span>
                  <span className="text-terminal-cyan font-medium terminal-text">92.1%</span>
                </div>
                <div className="w-full bg-terminal-surface h-2">
                  <div className="bg-terminal-cyan h-2" style={{ width: '92.1%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity & Rewards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="terminal-window p-6">
            <h2 className="text-xl font-semibold text-terminal-green mb-6 terminal-text">[🎯] Recent Rewards</h2>
            
            <div className="space-y-3">
              <div className="bg-terminal-surface border border-terminal-border p-3">
                <div className="flex justify-between items-center">
                  <span className="text-terminal-success terminal-text">Mining Reward</span>
                  <span className="text-terminal-gold font-medium terminal-text">+53.67 EMO</span>
                </div>
                <p className="text-terminal-green/70 text-sm terminal-text">Block #13,221 | 2 minutes ago</p>
              </div>
              
              <div className="bg-terminal-surface border border-terminal-border p-3">
                <div className="flex justify-between items-center">
                  <span className="text-terminal-success terminal-text">Validation Reward</span>
                  <span className="text-terminal-gold font-medium terminal-text">+3.41 EMO</span>
                </div>
                <p className="text-terminal-green/70 text-sm terminal-text">Block #13,221 | 2 minutes ago</p>
              </div>
              
              <div className="bg-terminal-surface border border-terminal-border p-3">
                <div className="flex justify-between items-center">
                  <span className="text-terminal-success terminal-text">Mining Reward</span>
                  <span className="text-terminal-gold font-medium terminal-text">+52.46 EMO</span>
                </div>
                <p className="text-terminal-green/70 text-sm terminal-text">Block #13,212 | 1 hour ago</p>
              </div>
            </div>
          </div>
          
          <div className="terminal-window p-6">
            <h2 className="text-xl font-semibold text-terminal-green mb-6 terminal-text">[⚡] Network Statistics</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-terminal-green terminal-text">Active Validators:</span>
                <span className="text-terminal-cyan terminal-text">{networkStats?.stats?.activeValidators || 21}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-terminal-green terminal-text">Network Emotional Score:</span>
                <span className="text-terminal-orange terminal-text">{networkStats?.stats?.emotionalAverage || 78}%</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-terminal-green terminal-text">Current Block Height:</span>
                <span className="text-terminal-cyan terminal-text">#{networkStats?.stats?.blockHeight || '13,221'}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-terminal-green terminal-text">Your Ranking:</span>
                <span className="text-terminal-gold terminal-text">#1 of 21</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-terminal-green terminal-text">Monthly Earnings:</span>
                <span className="text-terminal-success terminal-text">+1,847 EMO</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}