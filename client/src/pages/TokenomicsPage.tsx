import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ArrowLeft, Database, TrendingUp, Users, Coins, Lock, Zap, Award, Target } from 'lucide-react';

interface TokenEconomics {
  totalSupply: number;
  maxSupply: number;
  circulatingSupply: number;
  percentageIssued: number;
  pools: {
    staking: {
      allocated: number;
      remaining: number;
      utilized: number;
    };
    wellness: {
      allocated: number;
      remaining: number;
      utilized: number;
    };
    ecosystem: {
      allocated: number;
      remaining: number;
      utilized: number;
    };
  };
  rewards: {
    baseBlockReward: number;
    baseValidationReward: number;
    emotionalConsensusBonus: number;
    minimumValidatorStake: number;
  };
  contractStatus: string;
  lastBlockHeight?: number;
  miningHistory?: {
    genesisBlockHeight: number;
    currentBlockHeight: number;
    totalBlocksMined: number;
    totalMiningRewards: number;
    circulatingSupply: number;
    averageBlockReward: number;
    miningStartTimestamp: string;
    miningDurationSeconds: number;
    miningStatus: string;
    validatorsEarningRewards: number;
  };
}

export default function TokenomicsPage() {
  const { data: economics, isLoading } = useQuery<TokenEconomics>({
    queryKey: ['/api/token/economics'],
    refetchInterval: 10000
  });

  const formatEMO = (amount: number | undefined) => {
    if (!amount && amount !== 0) return '0 EMO';
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M EMO`;
    }
    return `${amount.toLocaleString()} EMO`;
  };

  const formatUSD = (emoAmount: number | undefined) => {
    if (!emoAmount && emoAmount !== 0) return '$0';
    const usdValue = emoAmount * 0.01; // $0.01 per EMO
    return `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value: number | undefined) => {
    if (!value && value !== 0) return '0.0%';
    return `${value.toFixed(2)}%`;
  };

  const calculateUtilization = (allocated: number | undefined, remaining: number | undefined) => {
    if (!allocated || allocated === 0) return 0;
    const utilized = allocated - (remaining || 0);
    return (utilized / allocated) * 100;
  };

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return '0 days';
    const days = Math.floor(seconds / 86400);
    return `${days} days`;
  };

  if (isLoading || !economics) {
    return (
      <div className="min-h-screen bg-terminal-bg text-terminal-green font-mono flex items-center justify-center">
        <div className="text-terminal-cyan">Loading tokenomics...</div>
      </div>
    );
  }

  const stakedSupply = economics.totalSupply - economics.circulatingSupply;
  const circulationRate = (economics.circulatingSupply / economics.totalSupply) * 100;
  const stakingRate = (stakedSupply / economics.totalSupply) * 100;

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-green font-mono">
      {/* Header */}
      <header className="border-b border-terminal-border bg-terminal-surface/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <button 
                  className="flex items-center space-x-2 text-terminal-green hover:text-terminal-cyan transition-colors"
                  data-testid="button-back-home"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Home</span>
                </button>
              </Link>
              <div className="flex items-center space-x-2">
                <Database className="w-6 h-6 text-terminal-cyan" />
                <span className="text-xl font-bold">EMO Tokenomics</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Hero Stats */}
          <div className="terminal-window p-8">
            <h1 className="text-3xl font-bold text-terminal-cyan mb-6">
              EmotionalChain Token Economics
            </h1>
            <p className="text-terminal-green/80 mb-8">
              Fair distribution through Proof of Emotion consensus. All EMO tokens are earned by validators 
              maintaining emotional fitness - no pre-mine, no ICO, just pure biometric validation rewards.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-terminal-surface p-6 rounded border border-terminal-border" data-testid="card-total-supply">
                <div className="flex items-center space-x-2 mb-2">
                  <Coins className="w-5 h-5 text-terminal-cyan" />
                  <div className="text-terminal-warning text-sm">TOTAL SUPPLY</div>
                </div>
                <div className="text-terminal-cyan text-2xl font-bold">{formatEMO(economics.totalSupply)}</div>
                <div className="text-terminal-dim text-xs mt-1">{formatUSD(economics.totalSupply)} USD</div>
                <div className="text-terminal-dim text-xs">{formatPercentage(economics.percentageIssued)} of max supply</div>
              </div>

              <div className="bg-terminal-surface p-6 rounded border border-terminal-border" data-testid="card-circulating">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-terminal-success" />
                  <div className="text-terminal-warning text-sm">CIRCULATING</div>
                </div>
                <div className="text-terminal-success text-2xl font-bold">{formatEMO(economics.circulatingSupply)}</div>
                <div className="text-terminal-dim text-xs mt-1">{formatUSD(economics.circulatingSupply)} USD</div>
                <div className="text-terminal-dim text-xs">{formatPercentage(circulationRate)} circulation rate</div>
              </div>

              <div className="bg-terminal-surface p-6 rounded border border-terminal-border" data-testid="card-staked">
                <div className="flex items-center space-x-2 mb-2">
                  <Lock className="w-5 h-5 text-terminal-gold" />
                  <div className="text-terminal-warning text-sm">STAKED</div>
                </div>
                <div className="text-terminal-gold text-2xl font-bold">{formatEMO(stakedSupply)}</div>
                <div className="text-terminal-dim text-xs mt-1">{formatUSD(stakedSupply)} USD</div>
                <div className="text-terminal-dim text-xs">{formatPercentage(stakingRate)} staking rate</div>
              </div>

              <div className="bg-terminal-surface p-6 rounded border border-terminal-border" data-testid="card-max-supply">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-5 h-5 text-terminal-orange" />
                  <div className="text-terminal-warning text-sm">MAX SUPPLY</div>
                </div>
                <div className="text-terminal-orange text-2xl font-bold">{formatEMO(economics.maxSupply)}</div>
                <div className="text-terminal-dim text-xs mt-1">Hard cap enforced</div>
                <div className="text-terminal-dim text-xs">1 billion EMO max</div>
              </div>
            </div>
          </div>

          {/* How Validators Earn */}
          <div className="terminal-window p-8">
            <h2 className="text-2xl font-bold text-terminal-cyan mb-6 flex items-center">
              <Award className="w-6 h-6 mr-3" />
              How Validators Earn EMO
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-terminal-surface p-6 rounded border border-terminal-border">
                <h3 className="text-terminal-success font-bold mb-4">Mining Rewards</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-terminal-green/80">Base Block Reward:</span>
                    <span className="text-terminal-cyan font-bold">{economics.rewards.baseBlockReward} EMO</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-terminal-green/80">Consensus Bonus:</span>
                    <span className="text-terminal-cyan font-bold">Up to {economics.rewards.emotionalConsensusBonus} EMO</span>
                  </div>
                  <div className="flex justify-between border-t border-terminal-border pt-3">
                    <span className="text-terminal-warning">Total per Block:</span>
                    <span className="text-terminal-gold font-bold">
                      {economics.rewards.baseBlockReward}-{economics.rewards.baseBlockReward + economics.rewards.emotionalConsensusBonus} EMO
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-terminal-surface p-6 rounded border border-terminal-border">
                <h3 className="text-terminal-success font-bold mb-4">Validation Rewards</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-terminal-green/80">Base Validation:</span>
                    <span className="text-terminal-cyan font-bold">{economics.rewards.baseValidationReward} EMO</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-terminal-green/80">Emotional Multiplier:</span>
                    <span className="text-terminal-cyan font-bold">0.6x - 1.0x</span>
                  </div>
                  <div className="flex justify-between border-t border-terminal-border pt-3">
                    <span className="text-terminal-warning">Total per Block:</span>
                    <span className="text-terminal-gold font-bold">
                      ~{Math.round(economics.rewards.baseValidationReward * 0.7)}-{economics.rewards.baseValidationReward} EMO
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-terminal-bg p-6 rounded border border-terminal-cyan/30">
              <h4 className="text-terminal-cyan font-bold mb-3">Earning Formula</h4>
              <div className="space-y-2 text-sm">
                <p className="text-terminal-green/80">
                  <span className="text-terminal-warning">Total Reward</span> = 
                  <span className="text-terminal-cyan"> Mining Reward</span> + 
                  <span className="text-terminal-success"> Validation Reward</span>
                </p>
                <p className="text-terminal-green/80">
                  Average: <span className="text-terminal-gold font-bold">~{economics.miningHistory?.averageBlockReward.toFixed(2) || '70'} EMO</span> per block
                </p>
                <p className="text-terminal-green/80">
                  Requirements: Emotional score ≥ 60%, Authenticity ≥ 70%, Active biometric device
                </p>
              </div>
            </div>
          </div>

          {/* Mining Statistics */}
          {economics.miningHistory && (
            <div className="terminal-window p-8">
              <h2 className="text-2xl font-bold text-terminal-cyan mb-6 flex items-center">
                <Zap className="w-6 h-6 mr-3" />
                Mining Statistics
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-terminal-surface p-6 rounded border border-terminal-border" data-testid="card-blocks-mined">
                  <div className="text-terminal-warning text-sm mb-2">BLOCKS MINED</div>
                  <div className="text-terminal-cyan text-3xl font-bold">
                    {economics.miningHistory.totalBlocksMined.toLocaleString()}
                  </div>
                  <div className="text-terminal-dim text-xs mt-2">
                    Since genesis block #{economics.miningHistory.genesisBlockHeight}
                  </div>
                </div>

                <div className="bg-terminal-surface p-6 rounded border border-terminal-border" data-testid="card-total-earned">
                  <div className="text-terminal-warning text-sm mb-2">TOTAL EMO EARNED</div>
                  <div className="text-terminal-success text-3xl font-bold">
                    {formatEMO(economics.miningHistory.totalMiningRewards)}
                  </div>
                  <div className="text-terminal-dim text-xs mt-2">
                    {formatUSD(economics.miningHistory.totalMiningRewards)} USD value
                  </div>
                </div>

                <div className="bg-terminal-surface p-6 rounded border border-terminal-border" data-testid="card-active-validators">
                  <div className="text-terminal-warning text-sm mb-2">ACTIVE VALIDATORS</div>
                  <div className="text-terminal-gold text-3xl font-bold">
                    {economics.miningHistory.validatorsEarningRewards}
                  </div>
                  <div className="text-terminal-dim text-xs mt-2">
                    Mining for {formatDuration(economics.miningHistory.miningDurationSeconds)}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-terminal-bg p-4 rounded border border-terminal-border">
                  <div className="flex justify-between mb-2">
                    <span className="text-terminal-green/80">Average Reward per Block:</span>
                    <span className="text-terminal-cyan font-bold">
                      {economics.miningHistory.averageBlockReward.toFixed(2)} EMO
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-terminal-green/80">Mining Status:</span>
                    <span className="text-terminal-success font-bold">{economics.miningHistory.miningStatus}</span>
                  </div>
                </div>

                <div className="bg-terminal-bg p-4 rounded border border-terminal-border">
                  <div className="flex justify-between mb-2">
                    <span className="text-terminal-green/80">Block Production Rate:</span>
                    <span className="text-terminal-cyan font-bold">10 seconds/block</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-terminal-green/80">Daily Block Production:</span>
                    <span className="text-terminal-success font-bold">8,640 blocks/day</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Token Distribution */}
          <div className="terminal-window p-8">
            <h2 className="text-2xl font-bold text-terminal-cyan mb-6 flex items-center">
              <Users className="w-6 h-6 mr-3" />
              Token Distribution & Pools
            </h2>

            <div className="space-y-6">
              {/* Staking Pool */}
              <div className="bg-terminal-surface p-6 rounded border border-terminal-border">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-terminal-success font-bold text-lg">Staking Pool (40%)</h3>
                    <p className="text-terminal-green/60 text-sm">Distributed to validators through PoE consensus</p>
                  </div>
                  <div className="text-right">
                    <div className="text-terminal-cyan text-2xl font-bold">{formatEMO(economics.pools.staking.utilized)}</div>
                    <div className="text-terminal-dim text-xs">distributed</div>
                  </div>
                </div>
                <div className="bg-terminal-bg rounded-full h-3 mb-2">
                  <div 
                    className="bg-terminal-success h-3 rounded-full transition-all duration-500"
                    style={{ width: `${calculateUtilization(economics.pools.staking.allocated, economics.pools.staking.remaining)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-terminal-green/70">
                  <span>Allocated: {formatEMO(economics.pools.staking.allocated)}</span>
                  <span>Remaining: {formatEMO(economics.pools.staking.remaining)}</span>
                </div>
              </div>

              {/* Ecosystem Pool */}
              <div className="bg-terminal-surface p-6 rounded border border-terminal-border">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-terminal-warning font-bold text-lg">Ecosystem Pool (25%)</h3>
                    <p className="text-terminal-green/60 text-sm">Reserved for ecosystem development and partnerships</p>
                  </div>
                  <div className="text-right">
                    <div className="text-terminal-warning text-2xl font-bold">{formatEMO(economics.pools.ecosystem.remaining)}</div>
                    <div className="text-terminal-dim text-xs">available</div>
                  </div>
                </div>
                <div className="bg-terminal-bg rounded-full h-3 mb-2">
                  <div 
                    className="bg-terminal-warning h-3 rounded-full transition-all duration-500"
                    style={{ width: `${calculateUtilization(economics.pools.ecosystem.allocated, economics.pools.ecosystem.remaining)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-terminal-green/70">
                  <span>Allocated: {formatEMO(economics.pools.ecosystem.allocated)}</span>
                  <span>Utilization: {formatPercentage(calculateUtilization(economics.pools.ecosystem.allocated, economics.pools.ecosystem.remaining))}</span>
                </div>
              </div>

              {/* Wellness Pool */}
              <div className="bg-terminal-surface p-6 rounded border border-terminal-border">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-terminal-cyan font-bold text-lg">Wellness Pool (20%)</h3>
                    <p className="text-terminal-green/60 text-sm">Incentivizes wellness goals and biometric achievements</p>
                  </div>
                  <div className="text-right">
                    <div className="text-terminal-cyan text-2xl font-bold">{formatEMO(economics.pools.wellness.remaining)}</div>
                    <div className="text-terminal-dim text-xs">available</div>
                  </div>
                </div>
                <div className="bg-terminal-bg rounded-full h-3 mb-2">
                  <div 
                    className="bg-terminal-cyan h-3 rounded-full transition-all duration-500"
                    style={{ width: `${calculateUtilization(economics.pools.wellness.allocated, economics.pools.wellness.remaining)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-terminal-green/70">
                  <span>Allocated: {formatEMO(economics.pools.wellness.allocated)}</span>
                  <span>Utilization: {formatPercentage(calculateUtilization(economics.pools.wellness.allocated, economics.pools.wellness.remaining))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div className="terminal-window p-8">
            <h2 className="text-2xl font-bold text-terminal-cyan mb-6">Key Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-terminal-border p-6 rounded">
                <h3 className="text-terminal-success font-bold text-lg mb-3">Fair Distribution</h3>
                <ul className="space-y-2 text-terminal-green/80 text-sm">
                  <li>&gt; No pre-mine or ICO - all EMO earned through validation</li>
                  <li>&gt; Proof of Emotion ensures fair participation</li>
                  <li>&gt; {economics.miningHistory?.validatorsEarningRewards || 21} validators sharing rewards equally</li>
                  <li>&gt; Emotional fitness determines earning potential</li>
                </ul>
              </div>

              <div className="border border-terminal-border p-6 rounded">
                <h3 className="text-terminal-cyan font-bold text-lg mb-3">Dual Asset System</h3>
                <ul className="space-y-2 text-terminal-green/80 text-sm">
                  <li>&gt; Native EMO coin for network operations</li>
                  <li>&gt; ERC20 EMO token for cross-chain compatibility</li>
                  <li>&gt; 1:1 parity maintained through secure bridges</li>
                  <li>&gt; Tradeable on DEX/CEX platforms</li>
                </ul>
              </div>

              <div className="border border-terminal-border p-6 rounded">
                <h3 className="text-terminal-gold font-bold text-lg mb-3">Staking Benefits</h3>
                <ul className="space-y-2 text-terminal-green/80 text-sm">
                  <li>&gt; Minimum stake: {formatEMO(economics.rewards.minimumValidatorStake)}</li>
                  <li>&gt; Base APY: 5% annual yield</li>
                  <li>&gt; Wellness multiplier: up to 1.5x for high wellness</li>
                  <li>&gt; Maximum APY: 15% for optimal performance</li>
                </ul>
              </div>

              <div className="border border-terminal-border p-6 rounded">
                <h3 className="text-terminal-orange font-bold text-lg mb-3">Supply Integrity</h3>
                <ul className="space-y-2 text-terminal-green/80 text-sm">
                  <li>&gt; Hard cap: {formatEMO(economics.maxSupply)} maximum supply</li>
                  <li>&gt; Current issuance: {formatPercentage(economics.percentageIssued)}</li>
                  <li>&gt; Immutable blockchain state calculation</li>
                  <li>&gt; Contract status: {economics.contractStatus}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="terminal-window p-6">
            <div className="text-terminal-dim text-sm text-center">
              <p className="mb-2">
                All token economics data is calculated from real blockchain state and updated in real-time.
              </p>
              <p>
                EmotionalChain uses Proof of Emotion consensus - validators earn rewards by maintaining emotional fitness 
                through connected biometric devices.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
