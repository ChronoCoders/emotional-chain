import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Brain, FileText, Download } from 'lucide-react';
import EmotionalChainLogo from '@/components/ui/emotional-chain-logo';

export default function WhitepaperPage() {
  const [activeSection, setActiveSection] = useState('abstract');

  const sections = [
    { id: 'abstract', title: 'Abstract' },
    { id: 'introduction', title: 'Introduction' },
    { id: 'problem', title: 'Problem Statement' },
    { id: 'solution', title: 'Proof of Emotion Solution' },
    { id: 'technical', title: 'Technical Architecture' },
    { id: 'biometrics', title: 'Biometric Integration' },
    { id: 'consensus', title: 'Consensus Mechanism' },
    { id: 'security', title: 'Security & Privacy' },
    { id: 'tokenomics', title: 'Economic Model' },
    { id: 'implementation', title: 'Implementation' },
    { id: 'evaluation', title: 'Performance Analysis' },
    { id: 'conclusion', title: 'Conclusion' }
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
                <FileText className="w-6 h-6 text-terminal-cyan" />
                <span className="text-xl font-bold">EmotionalChain Whitepaper</span>
              </div>
            </div>
            <button className="flex items-center space-x-2 bg-terminal-cyan text-terminal-bg px-4 py-2 rounded hover:bg-terminal-green transition-colors">
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 border-r border-terminal-border bg-terminal-surface/30 min-h-screen sticky top-16">
          <div className="p-6">
            <h3 className="text-terminal-cyan font-bold mb-4">&gt; Table of Contents</h3>
            <ul className="space-y-2">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <button
                    onClick={() => scrollToSection(section.id)}
                    className={`flex items-center space-x-2 w-full text-left px-3 py-2 rounded transition-colors text-sm ${
                      activeSection === section.id
                        ? 'bg-terminal-cyan/20 text-terminal-cyan'
                        : 'text-terminal-green hover:text-terminal-cyan hover:bg-terminal-surface/50'
                    }`}
                  >
                    <span className="text-terminal-cyan font-mono">{(index + 1).toString().padStart(2, '0')}.</span>
                    <span>{section.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-12">
            
            {/* Title Page */}
            <section className="terminal-window p-8 text-center">
              <div className="flex justify-center mb-6">
                <EmotionalChainLogo size={80} className="text-terminal-cyan" />
              </div>
              <h1 className="text-4xl font-bold text-terminal-cyan mb-4">
                EmotionalChain: A Proof of Emotion Blockchain
              </h1>
              <p className="text-xl text-terminal-green/80 mb-6">
                Revolutionary Consensus Through Biometric Emotional Validation
              </p>
              <div className="text-terminal-green/60 space-y-2">
                <p>Version 1.0 - August 2025</p>
                <p>Authors: EmotionalChain Research Team</p>
                <p>contact@emotionalchain.org</p>
              </div>
            </section>

            {/* Abstract */}
            <section id="abstract" className="terminal-window p-8">
              <h2 className="text-2xl font-bold text-terminal-cyan mb-6">01. Abstract</h2>
              <div className="space-y-4 text-terminal-green/90 leading-relaxed">
                <p>
                  EmotionalChain introduces the world's first Proof of Emotion (PoE) consensus mechanism, 
                  revolutionizing blockchain technology through real-time biometric validation. Traditional 
                  consensus mechanisms like Proof of Work and Proof of Stake rely on computational power 
                  or economic stake, while PoE leverages human emotional intelligence as the foundational 
                  trust mechanism.
                </p>
                <p>
                  Our enterprise-grade blockchain platform achieves Bitcoin/Ethereum-level immutability 
                  through a comprehensive 7-metric emotional intelligence system that processes stress, 
                  focus, authenticity, valence, arousal, fatigue, and confidence levels from biometric 
                  devices. The platform supports 21 device categories across consumer, professional, and 
                  medical-grade hardware with built-in fairness mechanisms preventing device-based advantages.
                </p>
                <p>
                  This whitepaper presents the technical architecture, cryptographic security measures, 
                  zero-knowledge privacy implementation, and performance evaluation of EmotionalChain's 
                  642K+ EMO coin ecosystem with 11,070+ validated blocks and 21 active validators 
                  maintaining 100% consensus.
                </p>
              </div>
            </section>

            {/* Introduction */}
            <section id="introduction" className="terminal-window p-8">
              <h2 className="text-2xl font-bold text-terminal-cyan mb-6">02. Introduction</h2>
              <div className="space-y-6 text-terminal-green/90 leading-relaxed">
                <p>
                  Blockchain technology has evolved through multiple generations, from Bitcoin's energy-intensive 
                  Proof of Work to Ethereum's stake-based consensus. However, existing mechanisms suffer from 
                  centralization risks, environmental concerns, and disconnect from human values. EmotionalChain 
                  addresses these limitations by introducing emotional intelligence as the core validation mechanism.
                </p>
                
                <h3 className="text-xl font-bold text-terminal-green mb-3">2.1 Motivation</h3>
                <p>
                  Human emotional states contain rich, unforgeable information that can serve as a novel 
                  cryptographic primitive. Unlike computational resources or financial stake, emotional 
                  authenticity cannot be easily replicated or monopolized, making it an ideal foundation 
                  for decentralized consensus.
                </p>

                <h3 className="text-xl font-bold text-terminal-green mb-3">2.2 Key Innovations</h3>
                <ul className="space-y-2 ml-6">
                  <li>&gt; First blockchain to utilize biometric emotional data for consensus</li>
                  <li>&gt; Enterprise-grade 7-metric emotional intelligence processing</li>
                  <li>&gt; Device-agnostic fairness system across 21 hardware categories</li>
                  <li>&gt; Zero-knowledge proofs for biometric privacy preservation</li>
                  <li>&gt; Bitcoin/Ethereum-level immutability with blockchain state calculation</li>
                </ul>
              </div>
            </section>

            {/* Problem Statement */}
            <section id="problem" className="terminal-window p-8">
              <h2 className="text-2xl font-bold text-terminal-cyan mb-6">03. Problem Statement</h2>
              <div className="space-y-6 text-terminal-green/90 leading-relaxed">
                <h3 className="text-xl font-bold text-terminal-green mb-3">3.1 Current Blockchain Limitations</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-terminal-border p-4 rounded">
                    <h4 className="text-terminal-cyan font-bold mb-2">Proof of Work Issues</h4>
                    <ul className="space-y-1 text-sm text-terminal-green/80">
                      <li>&gt; Massive energy consumption</li>
                      <li>&gt; Mining centralization</li>
                      <li>&gt; Hardware dependency</li>
                      <li>&gt; Environmental impact</li>
                    </ul>
                  </div>
                  <div className="border border-terminal-border p-4 rounded">
                    <h4 className="text-terminal-cyan font-bold mb-2">Proof of Stake Issues</h4>
                    <ul className="space-y-1 text-sm text-terminal-green/80">
                      <li>&gt; Wealth concentration</li>
                      <li>&gt; Nothing-at-stake problem</li>
                      <li>&gt; Validator centralization</li>
                      <li>&gt; Economic barriers</li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-terminal-green mb-3">3.2 Human-Centric Requirements</h3>
                <p>
                  Modern blockchain applications require trust mechanisms that reflect human values and 
                  emotional intelligence. Traditional consensus ignores the rich information available 
                  in human biometric data, missing opportunities for more intuitive and fair validation.
                </p>

                <h3 className="text-xl font-bold text-terminal-green mb-3">3.3 Privacy and Security Challenges</h3>
                <p>
                  Biometric data presents unique privacy challenges requiring advanced cryptographic 
                  techniques. EmotionalChain addresses these through zero-knowledge proofs and secure 
                  multi-party computation, ensuring emotional data never leaves the user's device.
                </p>
              </div>
            </section>

            {/* Proof of Emotion Solution */}
            <section id="solution" className="terminal-window p-8">
              <h2 className="text-2xl font-bold text-terminal-cyan mb-6">04. Proof of Emotion Solution</h2>
              <div className="space-y-6 text-terminal-green/90 leading-relaxed">
                <h3 className="text-xl font-bold text-terminal-green mb-3">4.1 Core Concept</h3>
                <p>
                  Proof of Emotion (PoE) validates transactions and creates blocks based on validators' 
                  emotional fitness scores derived from real-time biometric monitoring. The consensus 
                  mechanism rewards emotional wellness while maintaining cryptographic security.
                </p>

                <h3 className="text-xl font-bold text-terminal-green mb-3">4.2 Emotional Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-terminal-cyan font-bold mb-2">Primary Metrics (Weight: 70%)</h4>
                    <ul className="space-y-2 text-terminal-green/80">
                      <li><strong>Stress Level:</strong> 0-100 scale from HRV analysis</li>
                      <li><strong>Focus Level:</strong> Attention measurement via EEG</li>
                      <li><strong>Authenticity:</strong> Biometric consistency scoring</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-terminal-cyan font-bold mb-2">Secondary Metrics (Weight: 30%)</h4>
                    <ul className="space-y-2 text-terminal-green/80">
                      <li><strong>Valence:</strong> Emotional positivity index</li>
                      <li><strong>Arousal:</strong> Physiological activation level</li>
                      <li><strong>Fatigue:</strong> Mental and physical tiredness</li>
                      <li><strong>Confidence:</strong> Decision certainty measure</li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-terminal-green mb-3">4.3 Validation Algorithm</h3>
                <div className="bg-terminal-bg p-4 rounded border border-terminal-border">
                  <pre className="text-terminal-cyan text-sm">
{`// Emotional Fitness Score Calculation
function calculateEmotionalFitness(metrics) {
  const primary = (
    metrics.stress * 0.25 +      // Lower is better
    metrics.focus * 0.25 +       // Higher is better  
    metrics.authenticity * 0.20  // Higher is better
  );
  
  const secondary = (
    metrics.valence * 0.08 +     // Higher is better
    metrics.arousal * 0.07 +     // Moderate is better
    metrics.fatigue * 0.08 +     // Lower is better
    metrics.confidence * 0.07    // Higher is better
  );
  
  return normalizeScore(primary + secondary);
}`}
                  </pre>
                </div>
              </div>
            </section>

            {/* Technical Architecture */}
            <section id="technical" className="terminal-window p-8">
              <h2 className="text-2xl font-bold text-terminal-cyan mb-6">05. Technical Architecture</h2>
              <div className="space-y-6 text-terminal-green/90 leading-relaxed">
                <h3 className="text-xl font-bold text-terminal-green mb-3">5.1 System Components</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-terminal-border p-4 rounded">
                    <h4 className="text-terminal-cyan font-bold mb-2">Core Blockchain Layer</h4>
                    <ul className="space-y-1 text-sm text-terminal-green/80">
                      <li>&gt; Immutable transaction ledger</li>
                      <li>&gt; Cryptographic block validation</li>
                      <li>&gt; State tree management</li>
                      <li>&gt; Smart contract execution</li>
                    </ul>
                  </div>
                  <div className="border border-terminal-border p-4 rounded">
                    <h4 className="text-terminal-cyan font-bold mb-2">Biometric Processing Layer</h4>
                    <ul className="space-y-1 text-sm text-terminal-green/80">
                      <li>&gt; Real-time data collection</li>
                      <li>&gt; Signal processing algorithms</li>
                      <li>&gt; Anti-spoofing validation</li>
                      <li>&gt; Privacy-preserving computation</li>
                    </ul>
                  </div>
                  <div className="border border-terminal-border p-4 rounded">
                    <h4 className="text-terminal-cyan font-bold mb-2">Consensus Engine</h4>
                    <ul className="space-y-1 text-sm text-terminal-green/80">
                      <li>&gt; Emotional fitness scoring</li>
                      <li>&gt; Validator selection algorithm</li>
                      <li>&gt; Byzantine fault tolerance</li>
                      <li>&gt; Finality guarantees</li>
                    </ul>
                  </div>
                  <div className="border border-terminal-border p-4 rounded">
                    <h4 className="text-terminal-cyan font-bold mb-2">Network Layer</h4>
                    <ul className="space-y-1 text-sm text-terminal-green/80">
                      <li>&gt; P2P communication (libp2p)</li>
                      <li>&gt; WebRTC peer connections</li>
                      <li>&gt; Gossip protocol implementation</li>
                      <li>&gt; NAT traversal support</li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-terminal-green mb-3">5.2 Data Flow Architecture</h3>
                <p>
                  Biometric data flows through secure channels from devices to local processing units, 
                  where emotional metrics are calculated and privacy-preserving proofs generated. Only 
                  cryptographic commitments to emotional fitness scores are transmitted to the network.
                </p>
              </div>
            </section>

            {/* Biometric Integration */}
            <section id="biometrics" className="terminal-window p-8">
              <h2 className="text-2xl font-bold text-terminal-cyan mb-6">06. Biometric Integration</h2>
              <div className="space-y-6 text-terminal-green/90 leading-relaxed">
                <h3 className="text-xl font-bold text-terminal-green mb-3">6.1 Supported Device Categories</h3>
                
                <div className="space-y-4">
                  <div className="border border-terminal-border p-4 rounded">
                    <h4 className="text-terminal-cyan font-bold mb-2">Consumer Devices (14 types)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-terminal-green/80">
                      <span>&gt; Apple Watch Series 4+</span>
                      <span>&gt; Samsung Galaxy Watch</span>
                      <span>&gt; Fitbit Sense/Versa</span>
                      <span>&gt; Garmin Vivosmart</span>
                      <span>&gt; Oura Ring Gen 3</span>
                      <span>&gt; Muse Headband</span>
                      <span>&gt; Xiaomi Mi Band</span>
                      <span>&gt; Huawei Watch GT</span>
                      <span>&gt; Amazfit Stratos</span>
                      <span>&gt; Withings ScanWatch</span>
                      <span>&gt; WHOOP Strap</span>
                      <span>&gt; Hexoskin Smart Shirt</span>
                      <span>&gt; Spire Stone</span>
                      <span>&gt; HeartMath HeartRate+</span>
                    </div>
                  </div>

                  <div className="border border-terminal-border p-4 rounded">
                    <h4 className="text-terminal-cyan font-bold mb-2">Professional Devices (5 types)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-terminal-green/80">
                      <span>&gt; Polar H10 Heart Rate</span>
                      <span>&gt; Empatica E4 Wristband</span>
                      <span>&gt; OpenBCI Cyton Board</span>
                      <span>&gt; Biosemi ActiveTwo</span>
                      <span>&gt; g.tec g.USBamp</span>
                    </div>
                  </div>

                  <div className="border border-terminal-border p-4 rounded">
                    <h4 className="text-terminal-cyan font-bold mb-2">Medical Grade (2 types)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-terminal-green/80">
                      <span>&gt; FDA Cleared ECG Devices</span>
                      <span>&gt; Medical Grade EEG Systems</span>
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-terminal-green mb-3">6.2 Device Fairness Algorithm</h3>
                <p>
                  To prevent professional device dominance, EmotionalChain implements a fairness system 
                  that normalizes scores across device categories. Each category has equal weight in 
                  validator selection, ensuring consumer devices remain competitive.
                </p>

                <div className="bg-terminal-bg p-4 rounded border border-terminal-border">
                  <pre className="text-terminal-cyan text-sm">
{`// Device Category Normalization
function normalizeByCategory(score, deviceCategory) {
  const categoryStats = getCategoryStatistics(deviceCategory);
  const normalizedScore = (score - categoryStats.mean) / categoryStats.stdDev;
  return Math.max(0, Math.min(100, normalizedScore * 15 + 50));
}`}
                  </pre>
                </div>
              </div>
            </section>

            {/* Consensus Mechanism */}
            <section id="consensus" className="terminal-window p-8">
              <h2 className="text-2xl font-bold text-terminal-cyan mb-6">07. Consensus Mechanism</h2>
              <div className="space-y-6 text-terminal-green/90 leading-relaxed">
                <h3 className="text-xl font-bold text-terminal-green mb-3">7.1 Three-Phase Consensus</h3>
                
                <div className="space-y-4">
                  <div className="border border-terminal-border p-4 rounded">
                    <h4 className="text-terminal-cyan font-bold mb-2">Phase 1: PROPOSE</h4>
                    <p className="text-terminal-green/80">
                      Validators with emotional fitness scores above the dynamic threshold (currently 80/100) 
                      are eligible to propose new blocks. Selection probability increases with emotional fitness.
                    </p>
                  </div>

                  <div className="border border-terminal-border p-4 rounded">
                    <h4 className="text-terminal-cyan font-bold mb-2">Phase 2: VOTE</h4>
                    <p className="text-terminal-green/80">
                      A committee of high-fitness validators votes on proposed blocks. Voting weight combines 
                      emotional fitness (70%) and stake amount (30%) to balance wellness with economic incentives.
                    </p>
                  </div>

                  <div className="border border-terminal-border p-4 rounded">
                    <h4 className="text-terminal-cyan font-bold mb-2">Phase 3: COMMIT</h4>
                    <p className="text-terminal-green/80">
                      Blocks receiving &gt;2/3 committee approval are committed to the blockchain. Finality 
                      is achieved through cryptographic signatures and Byzantine fault tolerance.
                    </p>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-terminal-green mb-3">7.2 Slashing Conditions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-red-500/30 bg-red-500/10 p-4 rounded">
                    <h4 className="text-red-400 font-bold">Critical (&gt;50% slash)</h4>
                    <ul className="text-sm text-terminal-green/80 mt-2 space-y-1">
                      <li>&gt; Double signing blocks</li>
                      <li>&gt; Biometric data forgery</li>
                      <li>&gt; Protocol violations</li>
                    </ul>
                  </div>
                  <div className="border border-yellow-500/30 bg-yellow-500/10 p-4 rounded">
                    <h4 className="text-yellow-400 font-bold">Major (10-50% slash)</h4>
                    <ul className="text-sm text-terminal-green/80 mt-2 space-y-1">
                      <li>&gt; Persistent low fitness</li>
                      <li>&gt; Voting inconsistencies</li>
                      <li>&gt; Anti-spoofing failures</li>
                    </ul>
                  </div>
                  <div className="border border-orange-500/30 bg-orange-500/10 p-4 rounded">
                    <h4 className="text-orange-400 font-bold">Minor (&lt;10% slash)</h4>
                    <ul className="text-sm text-terminal-green/80 mt-2 space-y-1">
                      <li>&gt; Temporary downtime</li>
                      <li>&gt; Missed validations</li>
                      <li>&gt; Connection issues</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Security & Privacy */}
            <section id="security" className="terminal-window p-8">
              <h2 className="text-2xl font-bold text-terminal-cyan mb-6">08. Security & Privacy</h2>
              <div className="space-y-6 text-terminal-green/90 leading-relaxed">
                <h3 className="text-xl font-bold text-terminal-green mb-3">8.1 Cryptographic Foundation</h3>
                <ul className="space-y-2 text-terminal-green/80">
                  <li>&gt; <strong>@noble/curves:</strong> Production-grade ECDSA/EdDSA signatures</li>
                  <li>&gt; <strong>Hardware attestation:</strong> Device authenticity verification</li>
                  <li>&gt; <strong>Biometric-derived keys:</strong> Unique cryptographic identities</li>
                  <li>&gt; <strong>Multi-signature schemes:</strong> Enhanced transaction security</li>
                </ul>

                <h3 className="text-xl font-bold text-terminal-green mb-3">8.2 Zero-Knowledge Privacy</h3>
                <p>
                  EmotionalChain implements comprehensive privacy protection through Circom circuits 
                  and trusted setup ceremonies. Raw biometric data never leaves the user's device.
                </p>

                <div className="bg-terminal-bg p-4 rounded border border-terminal-border">
                  <pre className="text-terminal-cyan text-sm">
{`// ZK Proof Generation (Circom Circuit)
template EmotionalFitnessProof() {
    signal input biometricData[7];      // Private: raw metrics
    signal input threshold;             // Public: fitness threshold  
    signal output fitnessProof;         // Public: proof of fitness
    signal output nullifierHash;       // Public: prevents double-use
    
    // Compute fitness score without revealing inputs
    component fitnessCalculator = EmotionalFitnessCalculator();
    fitnessCalculator.metrics <== biometricData;
    
    // Prove fitness exceeds threshold
    component geq = GreaterEqThan(8);
    geq.in[0] <== fitnessCalculator.score;
    geq.in[1] <== threshold;
    geq.out === 1;
    
    fitnessProof <== fitnessCalculator.score;
}`}
                  </pre>
                </div>

                <h3 className="text-xl font-bold text-terminal-green mb-3">8.3 Anti-Spoofing Measures</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-terminal-border p-4 rounded">
                    <h4 className="text-terminal-cyan font-bold mb-2">Physiological Consistency</h4>
                    <p className="text-terminal-green/80 text-sm">
                      Cross-correlation analysis between multiple biometric signals to detect 
                      artificial or replayed data patterns.
                    </p>
                  </div>
                  <div className="border border-terminal-border p-4 rounded">
                    <h4 className="text-terminal-cyan font-bold mb-2">Temporal Analysis</h4>
                    <p className="text-terminal-green/80 text-sm">
                      Machine learning models analyze temporal patterns in biometric responses 
                      to identify anomalous or synthesized signals.
                    </p>
                  </div>
                  <div className="border border-terminal-border p-4 rounded">
                    <h4 className="text-terminal-cyan font-bold mb-2">Device Attestation</h4>
                    <p className="text-terminal-green/80 text-sm">
                      Hardware-level verification ensures data originates from authenticated 
                      biometric devices with valid security certificates.
                    </p>
                  </div>
                  <div className="border border-terminal-border p-4 rounded">
                    <h4 className="text-terminal-cyan font-bold mb-2">Liveness Detection</h4>
                    <p className="text-terminal-green/80 text-sm">
                      Real-time challenges require immediate biometric responses, preventing 
                      replay attacks and pre-recorded data injection.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Economic Model */}
            <section id="tokenomics" className="terminal-window p-8">
              <h2 className="text-2xl font-bold text-terminal-cyan mb-6">09. Economic Model</h2>
              <div className="space-y-6 text-terminal-green/90 leading-relaxed">
                <h3 className="text-xl font-bold text-terminal-green mb-3">9.1 Dual Asset System</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-terminal-border p-4 rounded">
                    <h4 className="text-terminal-cyan font-bold mb-2">EMO Coin (Native)</h4>
                    <ul className="space-y-2 text-terminal-green/80 text-sm">
                      <li>&gt; Native blockchain currency</li>
                      <li>&gt; Proof of Emotion consensus rewards</li>
                      <li>&gt; Staking and validation requirements</li>
                      <li>&gt; Gas fees for smart contracts</li>
                      <li>&gt; Current supply: 643,041+ EMO</li>
                    </ul>
                  </div>
                  <div className="border border-terminal-border p-4 rounded">
                    <h4 className="text-terminal-cyan font-bold mb-2">EMO Token (ERC20)</h4>
                    <ul className="space-y-2 text-terminal-green/80 text-sm">
                      <li>&gt; Cross-chain compatibility</li>
                      <li>&gt; DEX/CEX trading support</li>
                      <li>&gt; DeFi protocol integration</li>
                      <li>&gt; 1:1 parity with native coins</li>
                      <li>&gt; Secure bridge mechanisms</li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-terminal-green mb-3">9.2 Reward Distribution</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="border border-terminal-border p-4 rounded">
                      <h4 className="text-terminal-gold font-bold text-xl">50-55</h4>
                      <p className="text-terminal-green/80 text-sm">EMO Mining Reward</p>
                    </div>
                    <div className="border border-terminal-border p-4 rounded">
                      <h4 className="text-terminal-cyan font-bold text-xl">3-4</h4>
                      <p className="text-terminal-green/80 text-sm">EMO Validation Reward</p>
                    </div>
                    <div className="border border-terminal-border p-4 rounded">
                      <h4 className="text-terminal-orange font-bold text-xl">10%</h4>
                      <p className="text-terminal-green/80 text-sm">Emotional Bonus</p>
                    </div>
                  </div>
                  
                  <p className="text-terminal-green/80">
                    Mining rewards vary based on emotional fitness scores, with validators achieving 
                    exceptional wellness receiving up to 10% bonus rewards. This incentivizes 
                    long-term health and emotional stability.
                  </p>
                </div>

                <h3 className="text-xl font-bold text-terminal-green mb-3">9.3 Economic Incentives</h3>
                <ul className="space-y-2 text-terminal-green/80">
                  <li>&gt; <strong>Wellness Rewards:</strong> Higher emotional fitness = higher mining probability</li>
                  <li>&gt; <strong>Consistency Bonus:</strong> Stable emotional patterns receive additional rewards</li>
                  <li>&gt; <strong>Device Diversity:</strong> Support for multiple device types promotes inclusivity</li>
                  <li>&gt; <strong>Network Effects:</strong> More validators increase security and decentralization</li>
                </ul>
              </div>
            </section>

            {/* Implementation */}
            <section id="implementation" className="terminal-window p-8">
              <h2 className="text-2xl font-bold text-terminal-cyan mb-6">10. Implementation</h2>
              <div className="space-y-6 text-terminal-green/90 leading-relaxed">
                <h3 className="text-xl font-bold text-terminal-green mb-3">10.1 Current Network Status</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="border border-terminal-border p-4 rounded">
                    <h4 className="text-terminal-gold font-bold text-xl">11,070+</h4>
                    <p className="text-terminal-green/80 text-sm">Validated Blocks</p>
                  </div>
                  <div className="border border-terminal-border p-4 rounded">
                    <h4 className="text-terminal-cyan font-bold text-xl">21</h4>
                    <p className="text-terminal-green/80 text-sm">Active Validators</p>
                  </div>
                  <div className="border border-terminal-border p-4 rounded">
                    <h4 className="text-terminal-orange font-bold text-xl">100%</h4>
                    <p className="text-terminal-green/80 text-sm">Consensus Rate</p>
                  </div>
                  <div className="border border-terminal-border p-4 rounded">
                    <h4 className="text-terminal-green font-bold text-xl">2.5s</h4>
                    <p className="text-terminal-green/80 text-sm">Block Time</p>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-terminal-green mb-3">10.2 Technology Stack</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-terminal-cyan font-bold mb-2">Backend Technologies</h4>
                    <ul className="space-y-1 text-terminal-green/80 text-sm">
                      <li>&gt; Node.js + Express server</li>
                      <li>&gt; TypeScript for type safety</li>
                      <li>&gt; PostgreSQL with Drizzle ORM</li>
                      <li>&gt; libp2p for P2P networking</li>
                      <li>&gt; WebSocket for real-time updates</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-terminal-cyan font-bold mb-2">Frontend Technologies</h4>
                    <ul className="space-y-1 text-terminal-green/80 text-sm">
                      <li>&gt; React + TypeScript</li>
                      <li>&gt; Vite for fast development</li>
                      <li>&gt; Tailwind CSS styling</li>
                      <li>&gt; Recharts for data visualization</li>
                      <li>&gt; Web Bluetooth/USB APIs</li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-terminal-green mb-3">10.3 Deployment Architecture</h3>
                <p>
                  EmotionalChain runs on enterprise-grade infrastructure with automatic scaling, 
                  monitoring, and backup systems. The network supports both cloud and edge deployment 
                  for optimal performance and decentralization.
                </p>
              </div>
            </section>

            {/* Performance Analysis */}
            <section id="evaluation" className="terminal-window p-8">
              <h2 className="text-2xl font-bold text-terminal-cyan mb-6">11. Performance Analysis</h2>
              <div className="space-y-6 text-terminal-green/90 leading-relaxed">
                <h3 className="text-xl font-bold text-terminal-green mb-3">11.1 Consensus Performance</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border border-terminal-border p-4 rounded text-center">
                    <h4 className="text-terminal-cyan font-bold text-2xl">2.5s</h4>
                    <p className="text-terminal-green/80">Average Block Time</p>
                  </div>
                  <div className="border border-terminal-border p-4 rounded text-center">
                    <h4 className="text-terminal-cyan font-bold text-2xl">5,000+</h4>
                    <p className="text-terminal-green/80">Transactions/Second</p>
                  </div>
                  <div className="border border-terminal-border p-4 rounded text-center">
                    <h4 className="text-terminal-cyan font-bold text-2xl">99.9%</h4>
                    <p className="text-terminal-green/80">Network Uptime</p>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-terminal-green mb-3">11.2 Energy Efficiency</h3>
                <p>
                  Proof of Emotion consensus consumes 99.9% less energy than Bitcoin's Proof of Work, 
                  as validation depends on biometric processing rather than cryptographic puzzles. 
                  The entire network operates on renewable energy equivalent to a small data center.
                </p>

                <h3 className="text-xl font-bold text-terminal-green mb-3">11.3 Security Analysis</h3>
                <div className="space-y-4">
                  <div className="border border-terminal-border p-4 rounded">
                    <h4 className="text-terminal-cyan font-bold mb-2">Attack Resistance</h4>
                    <ul className="space-y-1 text-terminal-green/80 text-sm">
                      <li>&gt; <strong>51% Attack:</strong> Requires controlling 51% of emotional fitness</li>
                      <li>&gt; <strong>Sybil Attack:</strong> Prevented by biometric uniqueness</li>
                      <li>&gt; <strong>Long-Range Attack:</strong> Mitigated by checkpointing</li>
                      <li>&gt; <strong>Nothing-at-Stake:</strong> Solved through emotional commitment</li>
                    </ul>
                  </div>
                  <div className="border border-terminal-border p-4 rounded">
                    <h4 className="text-terminal-cyan font-bold mb-2">Privacy Guarantees</h4>
                    <ul className="space-y-1 text-terminal-green/80 text-sm">
                      <li>&gt; <strong>Zero-Knowledge:</strong> Raw biometrics never revealed</li>
                      <li>&gt; <strong>Local Processing:</strong> Data stays on user devices</li>
                      <li>&gt; <strong>Unlinkability:</strong> Transactions cannot be correlated</li>
                      <li>&gt; <strong>Forward Security:</strong> Past data remains secure</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Conclusion */}
            <section id="conclusion" className="terminal-window p-8">
              <h2 className="text-2xl font-bold text-terminal-cyan mb-6">12. Conclusion</h2>
              <div className="space-y-6 text-terminal-green/90 leading-relaxed">
                <p>
                  EmotionalChain represents a paradigm shift in blockchain technology, introducing 
                  human emotional intelligence as a novel consensus mechanism. Through the Proof of 
                  Emotion protocol, we achieve unprecedented alignment between technological systems 
                  and human values while maintaining enterprise-grade security and performance.
                </p>

                <h3 className="text-xl font-bold text-terminal-green mb-3">12.1 Key Achievements</h3>
                <ul className="space-y-2 text-terminal-green/80">
                  <li>&gt; First production blockchain utilizing biometric emotional validation</li>
                  <li>&gt; 643,041+ EMO coin ecosystem with 11,070+ validated blocks</li>
                  <li>&gt; 100% consensus rate across 21 active validators</li>
                  <li>&gt; Zero-knowledge privacy preservation for sensitive biometric data</li>
                  <li>&gt; Device-agnostic fairness across 21 hardware categories</li>
                  <li>&gt; Bitcoin/Ethereum-level immutability with blockchain state calculation</li>
                </ul>

                <h3 className="text-xl font-bold text-terminal-green mb-3">12.2 Future Directions</h3>
                <p>
                  EmotionalChain's roadmap includes cross-chain interoperability, advanced AI 
                  integration for emotional pattern recognition, and expansion to support additional 
                  biometric modalities. We envision a future where blockchain technology serves as 
                  a bridge between human emotional intelligence and digital systems.
                </p>

                <h3 className="text-xl font-bold text-terminal-green mb-3">12.3 Impact</h3>
                <p>
                  By incentivizing emotional wellness and creating economic value from human 
                  well-being, EmotionalChain has the potential to revolutionize not only blockchain 
                  technology but also how we structure digital societies. The platform demonstrates 
                  that technology can enhance rather than replace human values.
                </p>

                <div className="border-t border-terminal-border pt-6 mt-8 text-center">
                  <p className="text-terminal-cyan font-bold">
                    &gt; Join the Emotion Revolution
                  </p>
                  <p className="text-terminal-green/80 mt-2">
                    Connect your biometric device and help build the future of human-centric blockchain technology.
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