import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/use-websocket';
import { useEffect, useState } from 'react';

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
}

export default function TokenEconomics() {
  const [realtimeEconomics, setRealtimeEconomics] = useState<TokenEconomics | null>(null);
  const { lastMessage } = useWebSocket();

  const { data: economics } = useQuery<TokenEconomics>({
    queryKey: ['/api/token/economics'],
    staleTime: 30000, // Refresh every 30 seconds to match wallet data
    refetchInterval: 30000
  });

  // Update with real-time data from WebSocket
  useEffect(() => {
    if (lastMessage?.type === 'update' && lastMessage.data?.tokenEconomics) {
      setRealtimeEconomics(lastMessage.data.tokenEconomics);
    }
  }, [lastMessage]);

  const currentEconomics = realtimeEconomics || economics;

  // Return loading state if no economics data or if there's an error
  if (!currentEconomics || !currentEconomics.pools || !currentEconomics.pools.staking) {
    return (
      <div className="p-4 bg-terminal-bg border border-terminal-border">
        <div className="text-terminal-warning text-sm">
          {currentEconomics?.error ? `Error: ${currentEconomics.error}` : 'Loading token economics...'}
        </div>
      </div>
    );
  }

  const formatEMO = (amount: number | undefined) => {
    if (!amount && amount !== 0) return '0 EMO';
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M EMO`;
    }
    return `${amount.toLocaleString()} EMO`;
  };

  const formatPercentage = (value: number | undefined) => {
    if (!value && value !== 0) return '0.0%';
    if (value < 0.001) {
      return `${value.toFixed(6)}%`; // Show more precision for very small percentages
    }
    return `${value.toFixed(3)}%`;
  };

  const calculateUtilization = (allocated: number | undefined, remaining: number | undefined) => {
    if (!allocated || !remaining) return 0;
    return ((allocated - remaining) / allocated) * 100;
  };



  return (
    <div className="terminal-window rounded-lg p-6">
      <h2 className="text-terminal-cyan text-lg font-bold mb-4">
        ┌── EMO_TOKEN_ECONOMICS ──┐
      </h2>
      
      {/* Supply Metrics */}
      <div className="mb-6">
        <h3 className="text-terminal-success text-sm font-bold mb-3">
          [SUPPLY_METRICS]
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="bg-terminal-surface p-3 rounded border border-terminal-border">
            <div className="text-terminal-warning">TOTAL ISSUED</div>
            <div className="text-terminal-cyan text-lg">{formatEMO(currentEconomics?.totalSupply)}</div>
            <div className="text-terminal-dim text-xs">{formatPercentage(currentEconomics?.percentageIssued)} of max supply</div>
          </div>
          <div className="bg-terminal-surface p-3 rounded border border-terminal-border">
            <div className="text-terminal-warning">MAX SUPPLY</div>
            <div className="text-terminal-cyan text-lg">{formatEMO(currentEconomics?.maxSupply)}</div>
            <div className="text-terminal-dim text-xs">Hard cap enforced</div>
          </div>
          <div className="bg-terminal-surface p-3 rounded border border-terminal-border">
            <div className="text-terminal-warning">CIRCULATING SUPPLY</div>
            <div className="text-terminal-cyan text-lg">{formatEMO(currentEconomics?.circulatingSupply)}</div>
            <div className="text-terminal-dim text-xs">Available to validators</div>
          </div>
          <div className="bg-terminal-surface p-3 rounded border border-terminal-border">
            <div className="text-terminal-warning">STATUS</div>
            <div className="text-terminal-success text-sm">AUTHENTIC</div>
            <div className="text-terminal-dim text-xs">Zero pre-mint</div>
          </div>
        </div>
      </div>

      {/* Token Pools */}
      <div className="mb-6">
        <h3 className="text-terminal-success text-sm font-bold mb-3">
          [TOKEN_POOLS]
        </h3>
        <div className="space-y-3">
          {/* Emotional Pool */}
          <div className="bg-terminal-surface p-3 rounded border border-terminal-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-terminal-warning">EMOTIONAL POOL (40%)</span>
              <span className="text-terminal-cyan">{formatEMO(currentEconomics.pools.staking.remaining)}</span>
            </div>
            <div className="bg-terminal-bg rounded-full h-2 mb-1">
              <div 
                className="bg-terminal-success h-2 rounded-full"
                style={{ width: `${calculateUtilization(currentEconomics.pools.staking.allocated, currentEconomics.pools.staking.remaining)}%` }}
              ></div>
            </div>
            <div className="text-terminal-dim text-xs">
              Distributed: {formatEMO(currentEconomics.pools.staking.utilized)} / {formatEMO(currentEconomics.pools.staking.allocated)}
            </div>
          </div>

          {/* Ecosystem Pool */}
          <div className="bg-terminal-surface p-3 rounded border border-terminal-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-terminal-warning">ECOSYSTEM POOL (25%)</span>
              <span className="text-terminal-cyan">{formatEMO(currentEconomics.pools.ecosystem.remaining)}</span>
            </div>
            <div className="bg-terminal-bg rounded-full h-2 mb-1">
              <div 
                className="bg-terminal-warning h-2 rounded-full"
                style={{ width: `${calculateUtilization(currentEconomics.pools.ecosystem.allocated, currentEconomics.pools.ecosystem.remaining)}%` }}
              ></div>
            </div>
            <div className="text-terminal-dim text-xs">
              Reserved: {formatEMO(currentEconomics.pools.ecosystem.allocated)} EMO
            </div>
          </div>

          {/* Wellness Pool */}
          <div className="bg-terminal-surface p-3 rounded border border-terminal-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-terminal-warning">WELLNESS POOL (20%)</span>
              <span className="text-terminal-cyan">{formatEMO(currentEconomics.pools.wellness.remaining)}</span>
            </div>
            <div className="bg-terminal-bg rounded-full h-2 mb-1">
              <div 
                className="bg-terminal-cyan h-2 rounded-full"
                style={{ width: `${calculateUtilization(currentEconomics.pools.wellness.allocated, currentEconomics.pools.wellness.remaining)}%` }}
              ></div>
            </div>
            <div className="text-terminal-dim text-xs">
              Reserved: {formatEMO(currentEconomics.pools.wellness.allocated)} EMO
            </div>
          </div>
        </div>
      </div>

      {/* Reward Structure */}
      <div className="mb-4">
        <h3 className="text-terminal-success text-sm font-bold mb-3">
          [REWARD_STRUCTURE]
        </h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-terminal-surface p-2 rounded border border-terminal-border">
            <div className="text-terminal-warning">EMOTIONAL BASE</div>
            <div className="text-terminal-cyan">{currentEconomics.rewards.baseBlockReward} EMO</div>
          </div>
          <div className="bg-terminal-surface p-2 rounded border border-terminal-border">
            <div className="text-terminal-warning">VALIDATION</div>
            <div className="text-terminal-cyan">{currentEconomics.rewards.baseValidationReward} EMO</div>
          </div>
          <div className="bg-terminal-surface p-2 rounded border border-terminal-border">
            <div className="text-terminal-warning">CONSENSUS BONUS</div>
            <div className="text-terminal-cyan">Up to {currentEconomics.rewards.emotionalConsensusBonus} EMO</div>
          </div>
          <div className="bg-terminal-surface p-2 rounded border border-terminal-border">
            <div className="text-terminal-warning">TOTAL POOL</div>
            <div className="text-terminal-cyan">{formatEMO(currentEconomics.pools.staking.allocated)}</div>
          </div>
        </div>
      </div>

      {/* Live Validation Stats */}
      <div className="border-t border-terminal-border pt-3">
        <div className="text-terminal-dim text-xs">
          <div className="flex justify-between">
            <span>Contract Status:</span>
            <span className="text-terminal-success">{currentEconomics.contractStatus}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Distribution Policy:</span>
            <span className="text-terminal-cyan">Emotion-based earning only</span>
          </div>
        </div>
      </div>
    </div>
  );
}