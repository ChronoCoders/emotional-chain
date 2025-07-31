import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api";
import { formatTimeAgo, formatNumber, formatAddress } from "../lib/utils";
import { ArrowRight, CheckCircle, Clock } from "lucide-react";

export default function RecentTransactions() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: () => apiClient.getTransactions(5),
  });

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Transactions</h3>
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

  // Use only real transaction data from blockchain - no fake data
  const realTransactions = transactions || [];

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <ArrowRight className="w-5 h-5 mr-2 text-green-400" />
          Recent Transactions
        </h3>
        <a href="/transactions" className="text-emotional-400 hover:text-emotional-300 text-sm font-medium">
          View all
        </a>
      </div>

      <div className="space-y-3">
        {realTransactions.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">
              Building authentic transaction history as EmotionalChain processes blocks
            </p>
          </div>
        ) : realTransactions.map((tx: any) => (
          <div
            key={tx.hash}
            className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-600/50 hover:border-slate-500 transition-colors"
          >
            <div className="flex items-center space-x-4">
              {/* Status Icon */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                tx.status === 'confirmed' 
                  ? 'bg-green-500/20 border border-green-500/30' 
                  : 'bg-yellow-500/20 border border-yellow-500/30'
              }`}>
                {tx.status === 'confirmed' ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-400" />
                )}
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-white font-mono text-sm">
                    {formatAddress(tx.hash, 8, 6)}
                  </h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    tx.type === 'transfer' ? 'bg-blue-500/20 text-blue-400' :
                    tx.type === 'stake' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {tx.type}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <span>{formatAddress(tx.from)}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span>{formatAddress(tx.to)}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-white font-medium">
                {formatNumber(tx.amount)} EMO
              </p>
              <p className="text-slate-400 text-sm">
                {formatTimeAgo(tx.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}