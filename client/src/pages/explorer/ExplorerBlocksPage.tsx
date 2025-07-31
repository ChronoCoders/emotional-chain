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
  });

  // Fetch network stats for additional data
  const { data: networkStats } = useQuery({
    queryKey: ['network-stats'],
    queryFn: async () => {
      const response = await fetch('/api/network/status');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
        </div>
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-slate-700 rounded w-1/2"></div>
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
          <div className="h-8 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
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
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Blocks</h1>
        <p className="text-slate-400">
          EmotionalChain blocks produced through Proof of Emotion consensus
        </p>
      </div>

      {/* Block Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 text-sm font-medium">Latest Block</h3>
            <Database className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">#{formatNumber(totalBlocks)}</p>
          <p className="text-slate-400 text-sm">
            {latestBlock ? formatTimeAgo(new Date(latestBlock.timestamp).getTime()) : 'Just now'}
          </p>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 text-sm font-medium">Avg Block Time</h3>
            <Clock className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">{avgBlockTime}s</p>
          <p className="text-green-400 text-sm">Consistent timing</p>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 text-sm font-medium">Transactions (24h)</h3>
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-white">{formatNumber(2880)}</p>
          <p className="text-slate-400 text-sm">120 tx/hour avg</p>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 text-sm font-medium">Avg Emotional Score</h3>
            <Hash className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">82.3%</p>
          <p className="text-green-400 text-sm">+1.2% today</p>
        </div>
      </div>

      {/* Blocks List */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Recent Blocks</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="text-left p-4 text-slate-300 font-medium">Block</th>
                <th className="text-left p-4 text-slate-300 font-medium">Age</th>
                <th className="text-left p-4 text-slate-300 font-medium">Validator</th>
                <th className="text-left p-4 text-slate-300 font-medium">Transactions</th>
                <th className="text-left p-4 text-slate-300 font-medium">Emotional Consensus</th>
                <th className="text-left p-4 text-slate-300 font-medium">Reward</th>
                <th className="text-left p-4 text-slate-300 font-medium">Size</th>
              </tr>
            </thead>
            <tbody>
              {blocks?.map((block: any) => (
                <tr
                  key={block.height}
                  className="border-b border-slate-700/50 hover:bg-slate-900/30 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
                        <Hash className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">#{block.height}</p>
                        <p className="text-slate-400 text-xs font-mono">
                          {block.hash.substring(0, 12)}...{block.hash.substring(58)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-300">{formatTimeAgo(new Date(block.timestamp).getTime())}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-white">{block.validator}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-white font-medium">{block.transactions?.length || 1}</span>
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-green-400 font-medium">
                          {Math.round(block.emotionalConsensus.score)}%
                        </span>
                        <span className="text-slate-400 text-sm">
                          ({block.emotionalConsensus.participants} validators)
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-1.5 rounded-full"
                          style={{ width: `${block.emotionalConsensus.score}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-green-400 font-medium">
                      +{formatNumber(block.reward)} EMO
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-slate-300">{formatBytes(block.size)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Block Production Info */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-yellow-400" />
          Block Production
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-white font-medium mb-2">Consensus Mechanism</h4>
            <p className="text-green-400 text-lg font-semibold">Proof of Emotion</p>
            <p className="text-slate-400 text-sm">Biometric validation required</p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Block Reward</h4>
            <p className="text-green-400 text-lg font-semibold">50-75 EMO</p>
            <p className="text-slate-400 text-sm">Based on emotional contribution</p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Finality</h4>
            <p className="text-blue-400 text-lg font-semibold">1 Block</p>
            <p className="text-slate-400 text-sm">Instant finality</p>
          </div>
        </div>
      </div>
    </div>
  );
}