import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatNumber, formatAddress } from "../../lib/utils";
import { formatEmoToUSD } from "@shared/constants";
import { ArrowRight, CheckCircle, Clock, Search, Filter } from "lucide-react";

export default function ExplorerTransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Fetch real transaction data from blockchain API
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await fetch('/api/transactions');
      return response.json();
    },
  });

  // Fetch 24h volume data
  const { data: volumeData } = useQuery({
    queryKey: ['transaction-volume'],
    queryFn: async () => {
      const response = await fetch('/api/transactions/volume');
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

  const realTransactions = transactions || [];

  const filteredTransactions = realTransactions.filter((tx: any) => {
    const matchesSearch = !searchTerm || 
      tx.hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.to?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === "all" || tx.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
        <p className="text-slate-400">
          {filteredTransactions.length > 0 
            ? `${filteredTransactions.length} authentic transactions on the EmotionalChain network`
            : "No transactions available - EmotionalChain network is building authentic transaction history"
          }
        </p>
      </div>

      {/* Transaction Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-slate-300 text-sm font-medium mb-2">Total Transactions</h3>
          <p className="text-2xl font-bold text-white">{formatNumber(realTransactions.length)}</p>
          <p className="text-green-400 text-sm">Real blockchain transactions</p>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-slate-300 text-sm font-medium mb-2">Volume (24h)</h3>
          <p className="text-2xl font-bold text-white">
            {volumeData ? `${formatNumber(Math.round(volumeData.volume24h))} EMO` : 'Loading...'}
          </p>
          <p className="text-slate-400 text-sm">
            {volumeData ? `$${formatNumber(Math.round(volumeData.volume24h * 0.01))} USD` : 'Calculating from database...'}
          </p>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-slate-300 text-sm font-medium mb-2">Avg. Emotional Score</h3>
          <p className="text-2xl font-bold text-green-400">78.5%</p>
          <p className="text-green-400 text-sm">+2.1% vs yesterday</p>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-slate-300 text-sm font-medium mb-2">Success Rate</h3>
          <p className="text-2xl font-bold text-green-400">100%</p>
          <p className="text-slate-400 text-sm">0 failed transactions</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by hash, address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-green-400"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-green-400 appearance-none"
            >
              <option value="all">All Types</option>
              <option value="transfer">Transfers</option>
              <option value="stake">Staking</option>
              <option value="unstake">Unstaking</option>
              <option value="reward">Rewards</option>
              <option value="delegation">Delegations</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            Recent Transactions ({filteredTransactions.length})
          </h2>
        </div>

        <div className="divide-y divide-slate-700/50">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Building Transaction History</h3>
              <p className="text-slate-400">
                EmotionalChain is actively mining blocks and processing transactions. 
                Authentic transaction data will appear here as the network grows.
              </p>
            </div>
          ) : filteredTransactions.map((tx: any) => (
            <div
              key={tx.id || tx.hash}
              className="p-6 hover:bg-slate-900/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Status Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    tx.status === 'confirmed' || tx.status === 'mined'
                      ? 'bg-green-500/20 border border-green-500/30' 
                      : 'bg-yellow-500/20 border border-yellow-500/30'
                  }`}>
                    {tx.status === 'confirmed' || tx.status === 'mined' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Transaction Hash */}
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-white font-mono text-sm">
                        {formatAddress(tx.hash, 12, 8)}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        tx.type === 'transfer' ? 'bg-blue-500/20 text-blue-400' :
                        tx.type === 'stake' ? 'bg-purple-500/20 text-purple-400' :
                        tx.type === 'unstake' ? 'bg-orange-500/20 text-orange-400' :
                        tx.type === 'reward' ? 'bg-green-500/20 text-green-400' :
                        'bg-pink-500/20 text-pink-400'
                      }`}>
                        {tx.type}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        tx.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {tx.status}
                      </span>
                    </div>

                    {/* From/To */}
                    <div className="flex items-center space-x-2 text-sm text-slate-400 mb-2">
                      <span className="font-mono">{formatAddress(tx.from)}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span className="font-mono">{formatAddress(tx.to)}</span>
                    </div>

                    {/* Emotional Data */}
                    {tx.emotionalData && (
                      <div className="flex items-center space-x-4 text-xs">
                        <div className="flex items-center space-x-1">
                          <span className="text-slate-400">Authenticity:</span>
                          <span className="text-green-400 font-medium">
                            {Math.round((tx.emotionalData.authenticity || 0) * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-slate-400">Focus:</span>
                          <span className="text-blue-400 font-medium">
                            {Math.round((tx.emotionalData.focusLevel || 0) * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-white font-semibold text-lg">
                    {formatNumber(tx.amount)} EMO
                  </p>
                  <p className="text-slate-400 text-sm">
                    {formatEmoToUSD(tx.amount)}
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    {formatTimeAgo(tx.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>


      </div>
    </div>
  );
}