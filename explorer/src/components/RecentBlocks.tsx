import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api";
import { formatTimeAgo, formatNumber } from "../lib/utils";
import { Zap, User, Hash } from "lucide-react";

export default function RecentBlocks() {
  const { data: blocks, isLoading } = useQuery({
    queryKey: ['recent-blocks'],
    queryFn: () => apiClient.getBlocks(5),
  });

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Blocks</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-slate-700 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Zap className="w-5 h-5 mr-2 text-blue-400" />
          Recent Blocks
        </h3>
        <a href="/blocks" className="text-emotional-400 hover:text-emotional-300 text-sm font-medium">
          View all
        </a>
      </div>

      <div className="space-y-3">
        {blocks?.slice(0, 3).map((block) => (
          <div
            key={block.height}
            className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-600/50 hover:border-slate-500 transition-colors"
          >
            <div className="flex items-center space-x-4">
              {/* Block Height */}
              <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center">
                <Hash className="w-5 h-5 text-blue-400" />
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-white font-medium">Block #{block.height}</h4>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                    Confirmed
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-slate-400">
                  <span>{formatTimeAgo(block.timestamp)}</span>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{block.validator}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-white font-medium">
                {block.transactionCount} txs
              </p>
              <p className="text-emotional-400 text-sm">
                +{formatNumber(block.reward)} EMO
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}