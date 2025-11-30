import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Wallet, TrendingUp, Activity, Shield, Heart, ExternalLink } from "lucide-react";
import EmotionalChainLogo from '@/components/ui/emotional-chain-logo';

export default function UserDashboard() {
  const { data: networkStats } = useQuery({
    queryKey: ['/api/network/status'],
  });

  const { data: tokenData } = useQuery({
    queryKey: ['/api/token-economics'],
  });

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
              <h1 className="text-2xl font-bold text-terminal-green terminal-text">&gt; User Dashboard</h1>
              <p className="text-terminal-cyan terminal-text">Welcome to EmotionalChain Network</p>
            </div>
          </div>
          <div className="flex space-x-4">
            <Link href="/explorer" className="text-terminal-cyan hover:text-terminal-success transition-colors terminal-text">
              [Explorer]
            </Link>
            <Link href="/docs" className="text-terminal-cyan hover:text-terminal-success transition-colors terminal-text">
              [Documentation]
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 space-y-8">
        {/* Network Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="terminal-window p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-terminal-green text-sm font-medium terminal-text">NETWORK STATUS</h3>
              <Activity className="w-5 h-5 text-terminal-success" />
            </div>
            <p className="text-2xl font-bold text-terminal-success terminal-text">ONLINE</p>
            <p className="text-terminal-green/70 text-sm terminal-text">
              {networkStats?.stats?.activeValidators || 21} active validators
            </p>
          </div>
          
          <div className="terminal-window p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-terminal-green text-sm font-medium terminal-text">EMO PRICE</h3>
              <TrendingUp className="w-5 h-5 text-terminal-gold" />
            </div>
            <p className="text-2xl font-bold text-terminal-gold terminal-text">$0.01</p>
            <p className="text-terminal-success text-sm terminal-text">+5.2% (24h)</p>
          </div>
          
          <div className="terminal-window p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-terminal-green text-sm font-medium terminal-text">CIRCULATING SUPPLY</h3>
              <Wallet className="w-5 h-5 text-terminal-cyan" />
            </div>
            <p className="text-2xl font-bold text-terminal-cyan terminal-text">
              {tokenData?.circulatingSupply ? formatNumber(Math.round(tokenData.circulatingSupply)) : '549K'} EMO
            </p>
            <p className="text-terminal-green/70 text-sm terminal-text">73.2% of total supply</p>
          </div>
        </div>

        {/* Getting Started Section */}
        <div className="terminal-window p-6">
          <h2 className="text-xl font-semibold text-terminal-green mb-6 terminal-text">[START] Getting Started with EmotionalChain</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-terminal-surface border-2 border-terminal-border p-4">
              <div className="flex items-center mb-3">
                <Heart className="w-5 h-5 text-terminal-orange mr-2" />
                <h3 className="text-terminal-green font-medium terminal-text">Become a Validator</h3>
              </div>
              <p className="text-terminal-green/70 text-sm mb-4 terminal-text">
                Set up your validator node and start earning EMO rewards through biometric validation
              </p>
              <Link href="/validator/setup">
                <button className="w-full bg-terminal-success/20 border border-terminal-success text-terminal-success px-4 py-2 hover:bg-terminal-success/30 transition-colors terminal-text">
                  Setup Validator Node
                </button>
              </Link>
            </div>
            
            <div className="bg-terminal-surface border-2 border-terminal-border p-4">
              <div className="flex items-center mb-3">
                <Shield className="w-5 h-5 text-terminal-cyan mr-2" />
                <h3 className="text-terminal-green font-medium terminal-text">Connect Biometric Device</h3>
              </div>
              <p className="text-terminal-green/70 text-sm mb-4 terminal-text">
                Link your wearable device to participate in emotional consensus
              </p>
              <button className="w-full bg-terminal-cyan/20 border border-terminal-cyan text-terminal-cyan px-4 py-2 hover:bg-terminal-cyan/30 transition-colors terminal-text">
                Connect Device
              </button>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="terminal-window p-6">
          <h2 className="text-xl font-semibold text-terminal-green mb-6 terminal-text">[LINKS] Quick Navigation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link href="/explorer">
              <div className="bg-terminal-surface border border-terminal-border p-4 hover:border-terminal-success transition-colors cursor-pointer">
                <h3 className="text-terminal-cyan font-medium mb-2 terminal-text">Blockchain Explorer</h3>
                <p className="text-terminal-green/70 text-xs terminal-text">View blocks, transactions, and validators</p>
              </div>
            </Link>
            
            <Link href="/docs">
              <div className="bg-terminal-surface border border-terminal-border p-4 hover:border-terminal-success transition-colors cursor-pointer">
                <h3 className="text-terminal-cyan font-medium mb-2 terminal-text">Documentation</h3>
                <p className="text-terminal-green/70 text-xs terminal-text">Learn how to use EmotionalChain</p>
              </div>
            </Link>
            
            <a href="https://github.com/emotionalchain" target="_blank" rel="noopener noreferrer">
              <div className="bg-terminal-surface border border-terminal-border p-4 hover:border-terminal-success transition-colors cursor-pointer">
                <div className="flex items-center">
                  <h3 className="text-terminal-cyan font-medium mb-2 terminal-text">GitHub</h3>
                  <ExternalLink className="w-3 h-3 text-terminal-green/50 ml-1" />
                </div>
                <p className="text-terminal-green/70 text-xs terminal-text">View source code and contribute</p>
              </div>
            </a>
            
            <Link href="/whitepaper">
              <div className="bg-terminal-surface border border-terminal-border p-4 hover:border-terminal-success transition-colors cursor-pointer">
                <h3 className="text-terminal-cyan font-medium mb-2 terminal-text">Whitepaper</h3>
                <p className="text-terminal-green/70 text-xs terminal-text">Technical documentation</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="terminal-window p-6">
          <h2 className="text-xl font-semibold text-terminal-green mb-6 terminal-text">[ACTIVITY] Network Updates</h2>
          
          <div className="space-y-3">
            <div className="bg-terminal-surface border border-terminal-border p-3">
              <div className="flex justify-between items-center">
                <span className="text-terminal-green terminal-text">Block #{networkStats?.stats?.blockHeight || '13,218'} mined</span>
                <span className="text-terminal-green/70 text-sm terminal-text">2 minutes ago</span>
              </div>
              <p className="text-terminal-cyan text-sm terminal-text">Emotional Score: 78% | Consensus: 92%</p>
            </div>
            
            <div className="bg-terminal-surface border border-terminal-border p-3">
              <div className="flex justify-between items-center">
                <span className="text-terminal-green terminal-text">New validator joined network</span>
                <span className="text-terminal-green/70 text-sm terminal-text">1 hour ago</span>
              </div>
              <p className="text-terminal-cyan text-sm terminal-text">Validator: ChronoKeep | Stake: 10,000 EMO</p>
            </div>
            
            <div className="bg-terminal-surface border border-terminal-border p-3">
              <div className="flex justify-between items-center">
                <span className="text-terminal-green terminal-text">Network emotional health improved</span>
                <span className="text-terminal-green/70 text-sm terminal-text">6 hours ago</span>
              </div>
              <p className="text-terminal-cyan text-sm terminal-text">Average wellness score: +3.2%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}