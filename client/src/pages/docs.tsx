import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Brain, Heart, Shield, Zap, Globe, Monitor, Users, Lock, Code, Database, Network } from 'lucide-react';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Overview', icon: Brain },
    { id: 'getting-started', title: 'Getting Started', icon: Zap },
    { id: 'proof-of-emotion', title: 'Proof of Emotion', icon: Heart },
    { id: 'biometric-devices', title: 'Biometric Devices', icon: Monitor },
    { id: 'validators', title: 'Validators', icon: Users },
    { id: 'security', title: 'Security', icon: Shield },
    { id: 'api-reference', title: 'API Reference', icon: Code },
    { id: 'network', title: 'Network', icon: Network },
    { id: 'privacy', title: 'Privacy & ZK Proofs', icon: Lock },
    { id: 'tokenomics', title: 'Tokenomics', icon: Database }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const current = sections.find(section => {
        const element = document.getElementById(section.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (current) {
        setActiveSection(current.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-green font-mono">
      {/* Header */}
      <header className="border-b border-terminal-border bg-terminal-surface/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <button className="flex items-center space-x-2 text-terminal-green hover:text-terminal-cyan transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Home</span>
                </button>
              </Link>
              <div className="flex items-center space-x-2">
                <Brain className="w-6 h-6 text-terminal-cyan" />
                <span className="text-xl font-bold">EmotionalChain Docs</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 border-r border-terminal-border bg-terminal-surface/30 min-h-screen sticky top-16">
          <div className="p-6">
            <h3 className="text-terminal-cyan font-bold mb-4">&gt; Table of Contents</h3>
            <ul className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <li key={section.id}>
                    <button
                      onClick={() => scrollToSection(section.id)}
                      className={`flex items-center space-x-2 w-full text-left px-3 py-2 rounded transition-colors ${
                        activeSection === section.id
                          ? 'bg-terminal-cyan/20 text-terminal-cyan'
                          : 'text-terminal-green hover:text-terminal-cyan hover:bg-terminal-surface/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{section.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-12">
            
            {/* Overview */}
            <section id="overview" className="terminal-window p-8">
              <h1 className="text-3xl font-bold text-terminal-cyan mb-6 flex items-center">
                <Brain className="w-8 h-8 mr-3" />
                EmotionalChain Documentation
              </h1>
              <div className="space-y-6 text-terminal-green/90">
                <p className="text-lg">
                  Welcome to EmotionalChain, the world's first blockchain platform powered by 
                  <span className="text-terminal-cyan font-bold"> Proof of Emotion (PoE)</span> consensus mechanism.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-terminal-border p-4 rounded">
                    <h3 className="text-terminal-cyan font-bold mb-2">Enterprise Grade</h3>
                    <p>Bitcoin/Ethereum-level immutability with complete blockchain state calculation</p>
                  </div>
                  <div className="border border-terminal-border p-4 rounded">
                    <h3 className="text-terminal-cyan font-bold mb-2">Real-time Biometrics</h3>
                    <p>7-metric emotional intelligence processing with anti-spoofing measures</p>
                  </div>
                  <div className="border border-terminal-border p-4 rounded">
                    <h3 className="text-terminal-cyan font-bold mb-2">Zero-Knowledge Privacy</h3>
                    <p>Circom circuit compilation with trusted setup for biometric privacy</p>
                  </div>
                  <div className="border border-terminal-border p-4 rounded">
                    <h3 className="text-terminal-cyan font-bold mb-2">Device Agnostic</h3>
                    <p>Fair mining across consumer, professional, and medical-grade devices</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Getting Started */}
            <section id="getting-started" className="terminal-window p-8">
              <h2 className="text-2xl font-bold text-terminal-cyan mb-6 flex items-center">
                <Zap className="w-6 h-6 mr-3" />
                Getting Started
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-terminal-green mb-3">1. Setup Your Validator</h3>
                  <div className="bg-terminal-bg p-4 rounded border border-terminal-border">
                    <code className="text-terminal-cyan">
                      &gt; Connect biometric device<br/>
                      &gt; Register validator node<br/>
                      &gt; Start emotional consensus
                    </code>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-terminal-green mb-3">2. Device Requirements</h3>
                  <ul className="space-y-2 text-terminal-green/80">
                    <li>&gt; Heart rate monitor (consumer or professional)</li>
                    <li>&gt; Stress detection capability</li>
                    <li>&gt; Focus monitoring support</li>
                    <li>&gt; Bluetooth/USB connectivity</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-terminal-green mb-3">3. Start Earning EMO</h3>
                  <p className="text-terminal-green/80">
                    Maintain emotional fitness to validate blocks and earn EMO tokens through our 
                    innovative consensus mechanism that rewards emotional wellness.
                  </p>
                </div>
              </div>
            </section>

            {/* Proof of Emotion */}
            <section id="proof-of-emotion" className="terminal-window p-8">
              <h2 className="text-2xl font-bold text-terminal-cyan mb-6 flex items-center">
                <Heart className="w-6 h-6 mr-3" />
                Proof of Emotion Consensus
              </h2>
              <div className="space-y-6">
                <p className="text-terminal-green/90">
                  Our revolutionary consensus mechanism requires validators to maintain emotional fitness 
                  through real-time biometric monitoring.
                </p>
                
                <div>
                  <h3 className="text-xl font-bold text-terminal-green mb-3">7-Metric System</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-terminal-cyan font-bold mb-2">Primary Metrics</h4>
                      <ul className="space-y-1 text-terminal-green/80">
                        <li>&gt; Stress Level (0-100)</li>
                        <li>&gt; Focus Level (0-100)</li>
                        <li>&gt; Authenticity Score (0-100)</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-terminal-cyan font-bold mb-2">Secondary Metrics</h4>
                      <ul className="space-y-1 text-terminal-green/80">
                        <li>&gt; Valence (emotional positivity)</li>
                        <li>&gt; Arousal (emotional intensity)</li>
                        <li>&gt; Fatigue Level</li>
                        <li>&gt; Confidence Score</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-terminal-green mb-3">Consensus Phases</h3>
                  <div className="space-y-3">
                    <div className="border border-terminal-border p-4 rounded">
                      <h4 className="text-terminal-cyan font-bold">PROPOSE</h4>
                      <p className="text-terminal-green/80">Validators with high emotional scores propose new blocks</p>
                    </div>
                    <div className="border border-terminal-border p-4 rounded">
                      <h4 className="text-terminal-cyan font-bold">VOTE</h4>
                      <p className="text-terminal-green/80">Committee votes based on emotional fitness and block validity</p>
                    </div>
                    <div className="border border-terminal-border p-4 rounded">
                      <h4 className="text-terminal-cyan font-bold">COMMIT</h4>
                      <p className="text-terminal-green/80">Block finalized with cryptographic consensus</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Biometric Devices */}
            <section id="biometric-devices" className="terminal-window p-8">
              <h2 className="text-2xl font-bold text-terminal-cyan mb-6 flex items-center">
                <Monitor className="w-6 h-6 mr-3" />
                Supported Biometric Devices
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-terminal-cyan font-bold mb-3">Consumer Devices (14)</h3>
                    <ul className="space-y-1 text-terminal-green/80 text-sm">
                      <li>&gt; Apple Watch Series 4+</li>
                      <li>&gt; Samsung Galaxy Watch</li>
                      <li>&gt; Fitbit Sense/Versa</li>
                      <li>&gt; Garmin Vivosmart</li>
                      <li>&gt; Oura Ring Gen 3</li>
                      <li>&gt; Muse Headband</li>
                      <li>&gt; And 8 more...</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-terminal-cyan font-bold mb-3">Professional (5)</h3>
                    <ul className="space-y-1 text-terminal-green/80 text-sm">
                      <li>&gt; Polar H10</li>
                      <li>&gt; Empatica E4</li>
                      <li>&gt; OpenBCI</li>
                      <li>&gt; Biosemi</li>
                      <li>&gt; g.tec</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-terminal-cyan font-bold mb-3">Medical Grade (2)</h3>
                    <ul className="space-y-1 text-terminal-green/80 text-sm">
                      <li>&gt; FDA Cleared ECG</li>
                      <li>&gt; Medical EEG</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-terminal-surface/50 p-4 rounded border border-terminal-border">
                  <h4 className="text-terminal-cyan font-bold mb-2">Fair Mining Guarantee</h4>
                  <p className="text-terminal-green/80">
                    Our fairness system prevents professional device dominance. All device categories 
                    compete equally, ensuring consumer devices remain competitive.
                  </p>
                </div>
              </div>
            </section>

            {/* Security */}
            <section id="security" className="terminal-window p-8">
              <h2 className="text-2xl font-bold text-terminal-cyan mb-6 flex items-center">
                <Shield className="w-6 h-6 mr-3" />
                Security & Anti-Spoofing
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-terminal-green mb-3">Cryptographic Security</h3>
                  <ul className="space-y-2 text-terminal-green/80">
                    <li>&gt; @noble/curves for production-grade ECDSA/EdDSA signatures</li>
                    <li>&gt; Hardware attestation and anti-tampering measures</li>
                    <li>&gt; Biometric-derived key pairs with secure storage</li>
                    <li>&gt; Real cryptographic signatures (no hash-based stubs)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-terminal-green mb-3">Anti-Spoofing Measures</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-terminal-border p-4 rounded">
                      <h4 className="text-terminal-cyan font-bold mb-2">Physiological Consistency</h4>
                      <p className="text-terminal-green/80">Multi-metric correlation analysis</p>
                    </div>
                    <div className="border border-terminal-border p-4 rounded">
                      <h4 className="text-terminal-cyan font-bold mb-2">Device Authentication</h4>
                      <p className="text-terminal-green/80">Hardware-level device verification</p>
                    </div>
                    <div className="border border-terminal-border p-4 rounded">
                      <h4 className="text-terminal-cyan font-bold mb-2">Byzantine Detection</h4>
                      <p className="text-terminal-green/80">ML-powered anomaly detection</p>
                    </div>
                    <div className="border border-terminal-border p-4 rounded">
                      <h4 className="text-terminal-cyan font-bold mb-2">Response Patterns</h4>
                      <p className="text-terminal-green/80">Temporal analysis of biometric data</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Privacy */}
            <section id="privacy" className="terminal-window p-8">
              <h2 className="text-2xl font-bold text-terminal-cyan mb-6 flex items-center">
                <Lock className="w-6 h-6 mr-3" />
                Privacy & Zero-Knowledge Proofs
              </h2>
              <div className="space-y-6">
                <p className="text-terminal-green/90">
                  EmotionalChain implements comprehensive privacy protection for sensitive biometric data 
                  through zero-knowledge proofs and secure computation.
                </p>
                
                <div>
                  <h3 className="text-xl font-bold text-terminal-green mb-3">ZK Implementation</h3>
                  <ul className="space-y-2 text-terminal-green/80">
                    <li>&gt; Complete Circom circuit compilation pipeline</li>
                    <li>&gt; Trusted setup for biometric privacy preservation</li>
                    <li>&gt; Proof generation without revealing raw biometric data</li>
                    <li>&gt; Privacy-safe database storage with hashed values</li>
                  </ul>
                </div>

                <div className="bg-terminal-surface/50 p-4 rounded border border-terminal-border">
                  <h4 className="text-terminal-cyan font-bold mb-2">Data Protection</h4>
                  <p className="text-terminal-green/80">
                    Raw biometric data never leaves your device. Only cryptographic proofs of 
                    emotional fitness are submitted to the network, ensuring complete privacy.
                  </p>
                </div>
              </div>
            </section>

            {/* API Reference */}
            <section id="api-reference" className="terminal-window p-8">
              <h2 className="text-2xl font-bold text-terminal-cyan mb-6 flex items-center">
                <Code className="w-6 h-6 mr-3" />
                API Reference
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-terminal-green mb-3">Network Status</h3>
                  <div className="bg-terminal-bg p-4 rounded border border-terminal-border">
                    <code className="text-terminal-cyan text-sm">
                      GET /api/network/status<br/>
                      <span className="text-terminal-green">{`{
  "isRunning": true,
  "stats": {
    "blockHeight": 10997,
    "totalSupply": "639109.70",
    "activeValidators": 21,
    "consensusPercentage": "100.00"
  }
}`}</span>
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-terminal-green mb-3">Validator Information</h3>
                  <div className="bg-terminal-bg p-4 rounded border border-terminal-border">
                    <code className="text-terminal-cyan text-sm">
                      GET /api/validators<br/>
                      <span className="text-terminal-green">{`{
  "validators": [
    {
      "id": "StellarNode",
      "balance": 54551.42,
      "isActive": true,
      "uptime": "97.0",
      "authScore": "98.0",
      "device": "SentimentCore v2.1"
    }
  ]
}`}</span>
                    </code>
                  </div>
                </div>
              </div>
            </section>

            {/* Network */}
            <section id="network" className="terminal-window p-8">
              <h2 className="text-2xl font-bold text-terminal-cyan mb-6 flex items-center">
                <Network className="w-6 h-6 mr-3" />
                Network Architecture
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-terminal-green mb-3">P2P Networking</h3>
                  <ul className="space-y-2 text-terminal-green/80">
                    <li>&gt; libp2p integration with gossip protocols</li>
                    <li>&gt; WebRTC support for peer-to-peer connections</li>
                    <li>&gt; NAT traversal and connection management</li>
                    <li>&gt; Advanced DoS protection and peer reputation</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-terminal-green mb-3">Consensus Network</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-terminal-border p-4 rounded">
                      <h4 className="text-terminal-cyan font-bold mb-2">Active Validators</h4>
                      <p className="text-terminal-green/80">21 ecosystem validators currently active</p>
                    </div>
                    <div className="border border-terminal-border p-4 rounded">
                      <h4 className="text-terminal-cyan font-bold mb-2">Block Time</h4>
                      <p className="text-terminal-green/80">~2-3 seconds average finality</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Validators */}
            <section id="validators" className="terminal-window p-8">
              <h2 className="text-2xl font-bold text-terminal-cyan mb-6 flex items-center">
                <Users className="w-6 h-6 mr-3" />
                Validator Operations
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-terminal-green mb-3">Validator Requirements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-terminal-cyan font-bold mb-2">Technical</h4>
                      <ul className="space-y-1 text-terminal-green/80 text-sm">
                        <li>&gt; Minimum 95% uptime</li>
                        <li>&gt; Stable internet connection</li>
                        <li>&gt; Compatible biometric device</li>
                        <li>&gt; Node.js 18+ environment</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-terminal-cyan font-bold mb-2">Emotional</h4>
                      <ul className="space-y-1 text-terminal-green/80 text-sm">
                        <li>&gt; Stress level &lt; 70</li>
                        <li>&gt; Focus level &gt; 60</li>
                        <li>&gt; Authenticity score &gt; 80</li>
                        <li>&gt; Consistent biometric patterns</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-terminal-green mb-3">Slashing Conditions</h3>
                  <div className="space-y-3">
                    <div className="border border-red-500/30 bg-red-500/10 p-4 rounded">
                      <h4 className="text-red-400 font-bold">Critical (&gt;50% stake slash)</h4>
                      <p className="text-terminal-green/80">Double signing, major protocol violations</p>
                    </div>
                    <div className="border border-yellow-500/30 bg-yellow-500/10 p-4 rounded">
                      <h4 className="text-yellow-400 font-bold">Major (10-50% stake slash)</h4>
                      <p className="text-terminal-green/80">Persistent emotional fitness failures</p>
                    </div>
                    <div className="border border-orange-500/30 bg-orange-500/10 p-4 rounded">
                      <h4 className="text-orange-400 font-bold">Minor (&lt;10% stake slash)</h4>
                      <p className="text-terminal-green/80">Temporary downtime, minor inconsistencies</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Tokenomics */}
            <section id="tokenomics" className="terminal-window p-8">
              <h2 className="text-2xl font-bold text-terminal-cyan mb-6 flex items-center">
                <Database className="w-6 h-6 mr-3" />
                EMO Tokenomics
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border border-terminal-border p-4 rounded text-center">
                    <h3 className="text-terminal-gold font-bold text-2xl">639K+</h3>
                    <p className="text-terminal-green/80">Total Supply</p>
                  </div>
                  <div className="border border-terminal-border p-4 rounded text-center">
                    <h3 className="text-terminal-cyan font-bold text-2xl">461K+</h3>
                    <p className="text-terminal-green/80">Circulating</p>
                  </div>
                  <div className="border border-terminal-border p-4 rounded text-center">
                    <h3 className="text-terminal-orange font-bold text-2xl">178K+</h3>
                    <p className="text-terminal-green/80">Staked</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-terminal-green mb-3">Reward Structure</h3>
                  <ul className="space-y-2 text-terminal-green/80">
                    <li>&gt; Mining rewards: 50-55 EMO per block (varies by emotional score)</li>
                    <li>&gt; Validation rewards: 3-4 EMO per validation</li>
                    <li>&gt; Emotional bonus: Up to 10% for exceptional fitness</li>
                    <li>&gt; Stake rewards: Annual yield based on network participation</li>
                  </ul>
                </div>

                <div className="bg-terminal-surface/50 p-4 rounded border border-terminal-border">
                  <h4 className="text-terminal-cyan font-bold mb-2">Immutable Supply</h4>
                  <p className="text-terminal-green/80">
                    All EMO balances are calculated from immutable blockchain state, ensuring 
                    Bitcoin/Ethereum-level integrity and preventing unauthorized minting.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}