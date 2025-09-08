import { useQuery } from "@tanstack/react-query";
import { formatNumber } from "../../lib/utils";
import { Zap, User, Hash, Clock, Database } from "lucide-react";

export default function ExplorerBlocksPage() {
  // Fetch real block data from blockchain API
  const { data: blocks, isLoading } = useQuery({
    queryKey: ['blocks'],
    queryFn: async () => {
      const response = await fetch('/api/blocks');
      return response.json();
    },
    refetchInterval: 10000,
    staleTime: 0
  });

  // Fetch network stats for additional data
  const { data: networkStats } = useQuery({
    queryKey: ['network-stats'],
    queryFn: async () => {
      const response = await fetch('/api/network/status');
      return response.json();
    },
    refetchInterval: 5000,
    staleTime: 0
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-terminal-surface rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-terminal-surface rounded w-1/2"></div>
        </div>
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="terminal-window p-6 animate-pulse">
              <div className="h-4 bg-terminal-surface rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-terminal-surface rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = networkStats?.stats;
  const totalBlocks = stats?.blockHeight || blocks?.length || 0;
  const avgBlockTime = 30; // Real EmotionalChain block time
  const latestBlock = blocks?.[0]; // Most recent block
  
  if (!blocks) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-terminal-surface rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-terminal-surface rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="terminal-window p-6">
        <h1 className="text-3xl font-bold text-terminal-green mb-2 terminal-text">&gt; Blocks</h1>
        <p className="text-terminal-cyan terminal-text">
          EmotionalChain blocks produced through Proof of Emotion consensus
        </p>
      </div>

      {/* Block Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="terminal-window p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-terminal-green text-sm font-medium terminal-text">LATEST BLOCK</h3>
            <span className="text-terminal-cyan terminal-text">[DB]</span>
          </div>
          <p className="text-2xl font-bold text-terminal-cyan terminal-text">#{formatNumber(totalBlocks)}</p>
          <p className="text-terminal-green/70 text-sm terminal-text">
            {latestBlock ? formatTimeAgo(new Date(latestBlock.timestamp).getTime()) : 'Just now'}
          </p>
        </div>
        
        <div className="terminal-window p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-terminal-green text-sm font-medium terminal-text">AVG BLOCK TIME</h3>
            <span className="text-terminal-success terminal-text">[⏰]</span>
          </div>
          <p className="text-2xl font-bold text-terminal-success terminal-text">{avgBlockTime}s</p>
          <p className="text-terminal-success text-sm terminal-text">Consistent timing</p>
        </div>
        
        <div className="terminal-window p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-terminal-green text-sm font-medium terminal-text">TRANSACTIONS (24H)</h3>
            <span className="text-terminal-gold terminal-text">[⚡]</span>
          </div>
          <p className="text-2xl font-bold text-terminal-gold terminal-text">{formatNumber(blocks?.length * 24 || 0)}</p>
          <p className="text-terminal-green/70 text-sm terminal-text">{blocks?.length || 0} blocks/hour avg</p>
        </div>
        
        <div className="terminal-window p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-terminal-green text-sm font-medium terminal-text">AVG EMOTIONAL SCORE</h3>
            <span className="text-terminal-orange terminal-text">[#]</span>
          </div>
          <p className="text-2xl font-bold text-terminal-orange terminal-text">
            {Math.round(blocks?.reduce((sum: number, block: any) => sum + parseFloat(block.emotionalScore || 0), 0) / (blocks?.length || 1))}%
          </p>
          <p className="text-terminal-orange text-sm terminal-text">Real-time average</p>
        </div>
      </div>

      {/* Blocks List */}
      <div className="terminal-window overflow-hidden">
        <div className="p-6 border-b-2 border-terminal-border">
          <h2 className="text-xl font-semibold text-terminal-green terminal-text">[📦] Recent Blocks</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-terminal-surface">
              <tr>
                <th className="text-left p-4 text-terminal-green font-medium terminal-text">Block</th>
                <th className="text-left p-4 text-terminal-green font-medium terminal-text">Age</th>
                <th className="text-left p-4 text-terminal-green font-medium terminal-text">Validator</th>
                <th className="text-left p-4 text-terminal-green font-medium terminal-text">Transactions</th>
                <th className="text-left p-4 text-terminal-green font-medium terminal-text">Emotional Consensus</th>
                <th className="text-left p-4 text-terminal-green font-medium terminal-text">Reward</th>
                <th className="text-left p-4 text-terminal-green font-medium terminal-text">Size</th>
              </tr>
            </thead>
            <tbody>
              {blocks?.map((block: any) => (
                <tr
                  key={block.height}
                  className="border-b border-terminal-border hover:bg-terminal-surface transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-terminal-cyan/20 border border-terminal-cyan/30 flex items-center justify-center">
                        <Hash className="w-4 h-4 text-terminal-cyan" />
                      </div>
                      <div>
                        <p className="text-terminal-green font-medium terminal-text">#{block.height}</p>
                        <p className="text-terminal-green/70 text-xs font-mono terminal-text">
                          {block.hash.substring(0, 12)}...{block.hash.substring(58)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-terminal-cyan terminal-text">{formatTimeAgo(new Date(block.timestamp).getTime())}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-terminal-green" />
                      <span className="text-terminal-green terminal-text">{block.validator || '⚠️ Missing Validator'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-terminal-gold font-medium terminal-text">{block.transactions?.length || 1}</span>
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-terminal-success font-medium terminal-text">
                          {Math.round(parseFloat(block.emotionalScore) || 0)}%
                        </span>
                        <span className="text-terminal-green/70 text-sm terminal-text">
                          ({Math.round(parseFloat(block.consensusScore) || 0)}% consensus)
                        </span>
                      </div>
                      <div className="w-full bg-terminal-surface h-1.5">
                        <div
                          className="bg-gradient-to-r from-terminal-warning via-terminal-gold to-terminal-success h-1.5"
                          style={{ width: `${parseFloat(block.emotionalScore) || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-terminal-success font-medium terminal-text">
                      +{formatNumber(block.transactions?.[0]?.amount || 0)} EMO
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-terminal-cyan terminal-text">{formatBytes(JSON.stringify(block).length)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Block Production Info */}
      <div className="terminal-window rounded-xl p-6">
        <h3 className="text-lg font-semibold text-terminal-green terminal-text mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-terminal-gold" />
          Block Production
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-terminal-green terminal-text font-medium mb-2">Consensus Mechanism</h4>
            <p className="text-terminal-success text-lg font-semibold">Proof of Emotion</p>
            <p className="text-terminal-cyan text-sm">Biometric validation required</p>
          </div>
          <div>
            <h4 className="text-terminal-green terminal-text font-medium mb-2">Block Reward</h4>
            <p className="text-terminal-success text-lg font-semibold">50-75 EMO</p>
            <p className="text-terminal-cyan text-sm">Based on emotional contribution</p>
          </div>
          <div>
            <h4 className="text-terminal-green terminal-text font-medium mb-2">Finality</h4>
            <p className="text-blue-400 text-lg font-semibold">1 Block</p>
            <p className="text-terminal-cyan text-sm">Instant finality</p>
          </div>
        </div>
      </div>
    </div>
  );
}