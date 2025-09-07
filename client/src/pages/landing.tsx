import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/use-websocket';
import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ExternalLink, Activity, Users, Coins, BarChart3, Monitor, TrendingUp, Heart, Brain, Zap, Shield, Globe, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmotionalChainLogo from '@/components/ui/emotional-chain-logo';
import type { NetworkStats } from '@shared/schema';

export default function LandingPage() {
  const [realtimeStats, setRealtimeStats] = useState<NetworkStats | null>(null);
  const [typingText, setTypingText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { lastMessage } = useWebSocket();

  const { data: networkStatus } = useQuery<{ stats: NetworkStats }>({
    queryKey: ['/api/network/status'],
    refetchInterval: 3000  // Refetch every 3 seconds
  });

  const { data: tokenEconomics } = useQuery({
    queryKey: ['/api/token/economics'],
    refetchInterval: 5000  // Refetch every 5 seconds
  });

  const { data: wallets } = useQuery({
    queryKey: ['/api/wallets'],
    refetchInterval: 5000  // Refetch every 5 seconds
  });

  // Update with real-time data from WebSocket
  useEffect(() => {
    if (lastMessage?.type === 'update') {
      // Update network stats
      if (lastMessage.data?.networkStatus?.stats) {
        setRealtimeStats(lastMessage.data.networkStatus.stats);
      }
      // Force refetch of token economics and wallets when we get updates
      if (lastMessage.data?.tokenEconomics || lastMessage.data?.validators) {
        // Trigger a refetch by updating query keys
        window.dispatchEvent(new CustomEvent('blockchain-update'));
      }
    }
  }, [lastMessage]);

  const stats = realtimeStats || networkStatus?.stats;
  
  // Calculate live statistics from blockchain data with WebSocket updates
  const circulatingSupply = lastMessage?.data?.tokenEconomics?.circulatingSupply || 
                           (tokenEconomics as any)?.circulatingSupply || 
                           (stats as any)?.circulatingSupply || 0;
  
  const blockHeight = stats?.blockHeight || 0;
  
  const activeValidators = lastMessage?.data?.validators?.filter((validator: any) => validator.balance > 0).length ||
                          (wallets as any)?.filter((wallet: any) => wallet.balance > 0).length || 21;
  
  const consensusHealth = (stats as any)?.consensusQuality || (stats as any)?.emotionalAverage || 100;

  // Typing animation effect
  useEffect(() => {
    const text = 'EmotionalChain Network Initialized...';
    let index = 0;
    
    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setTypingText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typeInterval);
      }
    }, 80);

    return () => clearInterval(typeInterval);
  }, []);

  // Cursor blinking effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 600);

    return () => clearInterval(cursorInterval);
  }, []);

  const formatNumber = (num: number | string) => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    return n.toLocaleString('en-US');
  };

  const deviceCategories = [
    {
      name: 'Consumer Wearables',
      devices: ['Apple Watch', 'Galaxy Watch', 'Fitbit', 'Garmin', 'Oura Ring', 'Muse Headband'],
      icon: Heart,
      count: 14
    },
    {
      name: 'Professional Monitors', 
      devices: ['Polar H10', 'Empatica E4', 'OpenBCI', 'Biosemi', 'g.tec'],
      icon: Monitor,
      count: 5
    },
    {
      name: 'Medical Grade',
      devices: ['FDA Cleared ECG', 'Medical EEG'],
      icon: Shield,
      count: 2
    }
  ];

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-green font-mono overflow-x-hidden">
      {/* Matrix Rain Background */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-terminal-green/5 to-transparent"></div>
      </div>

      {/* Header Navigation */}
      <header className="relative z-10 border-b border-terminal-border bg-terminal-surface/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <EmotionalChainLogo size={24} className="text-terminal-cyan" />
              <span className="text-xl font-bold text-terminal-green">EmotionalChain</span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/explorer" className="text-terminal-green hover:text-terminal-cyan transition-colors">
                Explorer
              </Link>
              <Link href="/whitepaper" className="text-terminal-green hover:text-terminal-cyan transition-colors">
                Whitepaper
              </Link>
              <a href="#get-started">
                <button 
                  className="border-2 border-terminal-border text-terminal-green hover:bg-terminal-cyan hover:text-terminal-bg px-4 py-2 rounded-md transition-colors bg-transparent font-medium"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' });
                    setMobileMenuOpen(false);
                  }}
                >
                  Get Started
                </button>
              </a>
            </nav>
            
            {/* Mobile menu button */}
            <button 
              className="md:hidden text-terminal-green hover:text-terminal-cyan"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-terminal-border bg-terminal-surface/90 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-4 space-y-4">
              <Link 
                href="/explorer" 
                className="block text-terminal-green hover:text-terminal-cyan transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Explorer
              </Link>
              <Link 
                href="/whitepaper" 
                className="block text-terminal-green hover:text-terminal-cyan transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Whitepaper
              </Link>
              <a href="#get-started">
                <button 
                  className="w-full border-2 border-terminal-border text-terminal-green hover:bg-terminal-cyan hover:text-terminal-bg px-4 py-2 rounded-md transition-colors bg-transparent font-medium"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' });
                    setMobileMenuOpen(false);
                  }}
                >
                  Get Started
                </button>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16">
        <div className="container mx-auto px-4 text-center">
          {/* ASCII Banner */}
          <div className="mb-8">
            <pre className="ascii-art text-terminal-green text-xs sm:text-sm lg:text-base inline-block">
{`
███████╗███╗   ███╗ ██████╗      ██████╗██╗  ██╗ █████╗ ██╗███╗   ██╗
██╔════╝████╗ ████║██╔═══██╗    ██╔════╝██║  ██║██╔══██╗██║████╗  ██║
█████╗  ██╔████╔██║██║   ██║    ██║     ███████║███████║██║██╔██╗ ██║
██╔══╝  ██║╚██╔╝██║██║   ██║    ██║     ██╔══██║██╔══██║██║██║╚██╗██║
███████╗██║ ╚═╝ ██║╚██████╔╝    ╚██████╗██║  ██║██║  ██║██║██║ ╚████║
╚══════╝╚═╝     ╚═╝ ╚═════╝      ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝
`}
            </pre>
          </div>

          {/* Typing Animation */}
          <div className="mb-8">
            <span className="text-terminal-cyan text-lg">
              {typingText}
              {showCursor && <span className="text-terminal-green">█</span>}
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl md:text-5xl font-bold mb-6 text-terminal-green">
            World's First <span className="text-terminal-cyan">Emotion-Driven</span> Blockchain
          </h1>
          
          <p className="text-lg md:text-xl mb-8 text-terminal-green/80 max-w-3xl mx-auto">
            Revolutionary Proof of Emotion (PoE) consensus mechanism powered by real-time biometric validation.
            <br />Enterprise-grade blockchain with Bitcoin/Ethereum-level immutability.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a href="#get-started">
              <button 
                className="bg-terminal-cyan text-terminal-bg hover:bg-terminal-green hover:text-terminal-bg border-2 border-terminal-cyan hover:border-terminal-green font-bold px-8 py-3 rounded-md w-full sm:w-auto flex items-center justify-center transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Zap className="w-5 h-5 mr-2" />
                <span className="font-bold">Start Validating</span>
              </button>
            </a>
            <Link href="/explorer">
              <button 
                className="border-2 border-terminal-green text-terminal-green hover:bg-terminal-green hover:text-terminal-bg font-bold px-8 py-3 rounded-md w-full sm:w-auto flex items-center justify-center transition-colors bg-transparent"
              >
                <Globe className="w-5 h-5 mr-2" />
                <span className="font-bold">Explore Network</span>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Live Network Stats */}
      <section className="relative z-10 py-16 bg-terminal-surface/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-terminal-green">
              &gt; Network Status: <span className="text-terminal-success">ONLINE</span>
            </h2>
            <p className="text-terminal-green/80">Real-time statistics from the EmotionalChain network</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="terminal-window p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Coins className="w-8 h-8 text-terminal-gold mr-2" />
                <span className="text-sm text-terminal-green/60">EMO SUPPLY</span>
              </div>
              <div className="text-2xl font-bold text-terminal-gold">
                {formatNumber(circulatingSupply)}
              </div>
              <div className="text-sm text-terminal-green/60">Circulating EMO</div>
            </div>

            <div className="terminal-window p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <BarChart3 className="w-8 h-8 text-terminal-cyan mr-2" />
                <span className="text-sm text-terminal-green/60">BLOCKS</span>
              </div>
              <div className="text-2xl font-bold text-terminal-cyan">
                {formatNumber(blockHeight)}
              </div>
              <div className="text-sm text-terminal-green/60">Block Height</div>
            </div>

            <div className="terminal-window p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-8 h-8 text-terminal-success mr-2" />
                <span className="text-sm text-terminal-green/60">VALIDATORS</span>
              </div>
              <div className="text-2xl font-bold text-terminal-success">{activeValidators}</div>
              <div className="text-sm text-terminal-green/60">Active</div>
            </div>

            <div className="terminal-window p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Activity className="w-8 h-8 text-terminal-orange mr-2" />
                <span className="text-sm text-terminal-green/60">CONSENSUS</span>
              </div>
              <div className="text-2xl font-bold text-terminal-orange">
                {Math.round(consensusHealth)}%
              </div>
              <div className="text-sm text-terminal-green/60">Emotional Fitness</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-terminal-green">
              &gt; How Proof of Emotion Works
            </h2>
            <p className="text-terminal-green/80 max-w-3xl mx-auto">
              Revolutionary consensus mechanism that validates blocks based on real-time emotional fitness metrics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="terminal-window p-6">
              <div className="flex items-center mb-4">
                <Heart className="w-8 h-8 text-terminal-error mr-3" />
                <h3 className="text-xl font-bold text-terminal-green">Biometric Monitoring</h3>
              </div>
              <p className="text-terminal-green/80 mb-4">
                Validators connect wearable devices to provide real-time heart rate, stress levels, and focus metrics.
              </p>
              <ul className="text-sm text-terminal-green/70 space-y-1">
                <li>&gt; Heart Rate Variability</li>
                <li>&gt; Stress Detection</li>
                <li>&gt; Focus & Attention</li>
                <li>&gt; Emotional Authenticity</li>
              </ul>
            </div>

            <div className="terminal-window p-6">
              <div className="flex items-center mb-4">
                <Brain className="w-8 h-8 text-terminal-cyan mr-3" />
                <h3 className="text-xl font-bold text-terminal-green">7-Metric Processing</h3>
              </div>
              <p className="text-terminal-green/80 mb-4">
                Advanced emotional intelligence system processes multiple physiological signals for consensus.
              </p>
              <ul className="text-sm text-terminal-green/70 space-y-1">
                <li>&gt; Primary: Stress, Focus, Authenticity</li>
                <li>&gt; Secondary: Valence, Arousal</li>
                <li>&gt; Additional: Fatigue, Confidence</li>
                <li>&gt; Real-time AI Analysis</li>
              </ul>
            </div>

            <div className="terminal-window p-6">
              <div className="flex items-center mb-4">
                <Shield className="w-8 h-8 text-terminal-gold mr-3" />
                <h3 className="text-xl font-bold text-terminal-green">Secure Validation</h3>
              </div>
              <p className="text-terminal-green/80 mb-4">
                Only emotionally fit validators can participate in block creation and consensus voting.
              </p>
              <ul className="text-sm text-terminal-green/70 space-y-1">
                <li>&gt; Anti-spoofing Measures</li>
                <li>&gt; Byzantine Fault Tolerance</li>
                <li>&gt; Zero-knowledge Privacy</li>
                <li>&gt; Enterprise Immutability</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Devices */}
      <section className="relative z-10 py-16 bg-terminal-surface/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-terminal-green">
              &gt; Device Ecosystem
            </h2>
            <p className="text-terminal-green/80">
              Fair mining regardless of hardware quality - consumer and professional devices compete equally
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {deviceCategories.map((category, index) => (
              <div key={index} className="terminal-window p-6">
                <div className="flex items-center mb-4">
                  <category.icon className="w-8 h-8 text-terminal-cyan mr-3" />
                  <div>
                    <h3 className="text-xl font-bold text-terminal-green">{category.name}</h3>
                    <span className="text-sm text-terminal-green/60">{category.count} devices supported</span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {category.devices.map((device, idx) => (
                    <li key={idx} className="text-terminal-green/80 flex items-center">
                      <span className="text-terminal-cyan mr-2">&gt;</span>
                      {device}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section id="get-started" className="relative z-10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-terminal-green">
            &gt; Ready to Join the Network?
          </h2>
          <p className="text-terminal-green/80 mb-8 max-w-2xl mx-auto">
            Become a validator in the world's first emotion-driven blockchain. 
            Connect your wearable device and start earning EMO coins.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/access">
              <button 
                className="bg-terminal-cyan text-terminal-bg hover:bg-terminal-green hover:text-terminal-bg border-2 border-terminal-cyan hover:border-terminal-green font-bold px-8 py-3 rounded-md w-full sm:w-auto flex items-center justify-center transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/access';
                }}
              >
                <Heart className="w-5 h-5 mr-2" />
                <span className="font-bold">Get Started</span>
              </button>
            </a>
            <a href="/docs">
              <button 
                className="border-2 border-terminal-green text-terminal-green hover:bg-terminal-green hover:text-terminal-bg font-bold px-8 py-3 rounded-md w-full sm:w-auto flex items-center justify-center transition-colors bg-transparent"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/docs';
                }}
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                <span className="font-bold">View Documentation</span>
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-terminal-border bg-terminal-surface/50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <EmotionalChainLogo size={20} className="text-terminal-cyan" />
              <span className="text-terminal-green">EmotionalChain Network</span>
            </div>
            <div className="text-terminal-green/60 text-sm">
              &gt; Powered by Proof of Emotion | Enterprise-Grade Blockchain
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}