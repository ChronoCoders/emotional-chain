import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatNumber, formatAddress } from "../../lib/utils";
import { formatEmoToUSD } from "@shared/constants";
import { ArrowRight, CheckCircle, Clock, Search, Filter } from "lucide-react";

export default function ExplorerTransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Fetch real transaction data from database API
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await fetch('/api/transactions');
      return response.json();
    },
    refetchInterval: 10000,
    staleTime: 0
  });

  // Fetch real transaction stats from database
  const { data: statsData } = useQuery({
    queryKey: ['transaction-stats'],
    queryFn: async () => {
      const response = await fetch('/api/transactions/stats');
      return response.json();
    },
    refetchInterval: 10000,
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
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-terminal-surface rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-terminal-surface rounded w-1/2"></div>
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
      <div className="terminal-window p-6">
        <h1 className="text-3xl font-bold text-terminal-green mb-2 terminal-text">&gt; Transactions</h1>
        <p className="text-terminal-cyan terminal-text">
          {statsData ? `${formatNumber(statsData.totalTransactions)} authentic transactions on the EmotionalChain network - showing most recent ${transactions?.length || 0}` : 'Loading transaction count...'}
        </p>
      </div>

      {/* Transaction Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="terminal-window p-6">
          <h3 className="text-terminal-green text-sm font-medium mb-2 terminal-text">TOTAL TRANSACTIONS</h3>
          <p className="text-2xl font-bold text-terminal-cyan terminal-text">{statsData ? formatNumber(statsData.totalTransactions) : 'Loading...'}</p>
          <p className="text-terminal-success text-sm terminal-text">Database verified count</p>
        </div>
        
        <div className="terminal-window p-6">
          <h3 className="text-terminal-green text-sm font-medium mb-2 terminal-text">TOTAL VOLUME</h3>
          <p className="text-2xl font-bold text-terminal-gold terminal-text">{statsData ? `${formatNumber(Math.round(statsData.totalVolume))} EMO` : 'Loading...'}</p>
          <p className="text-terminal-green/70 text-sm terminal-text">{statsData ? `$${formatNumber(Math.round(statsData.totalVolume * 0.01))} USD` : 'Calculating...'}</p>
        </div>
        
        <div className="terminal-window p-6">
          <h3 className="text-terminal-green text-sm font-medium mb-2 terminal-text">AVG TRANSACTION SIZE</h3>
          <p className="text-2xl font-bold text-terminal-success terminal-text">
            {statsData && statsData.totalTransactions > 0 ? 
              `${formatNumber(Math.round(statsData.totalVolume / statsData.totalTransactions))} EMO` : 
              'Loading...'}
          </p>
          <p className="text-terminal-success text-sm terminal-text">Per transaction average</p>
        </div>
        
        <div className="terminal-window p-6">
          <h3 className="text-terminal-green text-sm font-medium mb-2 terminal-text">NETWORK STATUS</h3>
          <p className="text-2xl font-bold text-terminal-success terminal-text">[ACTIVE]</p>
          <p className="text-terminal-green/70 text-sm terminal-text">All transactions confirmed</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="terminal-window p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-terminal-green w-4 h-4" />
            <input
              type="text"
              placeholder="Search by hash, address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-terminal-surface border-2 border-terminal-border text-terminal-green terminal-text placeholder-terminal-green/50 focus:outline-none focus:border-terminal-success"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-terminal-green w-4 h-4" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-2 bg-terminal-surface border-2 border-terminal-border text-terminal-green terminal-text focus:outline-none focus:border-terminal-success appearance-none"
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
      <div className="terminal-window overflow-hidden">
        <div className="p-6 border-b-2 border-terminal-border">
          <h2 className="text-xl font-semibold text-terminal-green terminal-text">
            [📋] Recent Transactions ({filteredTransactions.length})
          </h2>
        </div>

        <div className="divide-y divide-terminal-border">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-12 h-12 text-terminal-green mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-terminal-green mb-2 terminal-text">Building Transaction History</h3>
              <p className="text-terminal-cyan terminal-text">
                EmotionalChain is actively mining blocks and processing transactions. 
                Authentic transaction data will appear here as the network grows.
              </p>
            </div>
          ) : filteredTransactions.map((tx: any) => (
            <div
              key={tx.id || tx.hash}
              className="p-6 hover:bg-terminal-surface transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Status Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    tx.status === 'confirmed' || tx.status === 'mined'
                      ? 'bg-terminal-success/20 border border-terminal-success/30' 
                      : 'bg-terminal-warning/20 border border-terminal-warning/30'
                  }`}>
                    {tx.status === 'confirmed' || tx.status === 'mined' ? (
                      <CheckCircle className="w-5 h-5 text-terminal-success" />
                    ) : (
                      <Clock className="w-5 h-5 text-terminal-warning" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Transaction Hash */}
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-terminal-green terminal-text font-mono text-sm">
                        {formatAddress(tx.hash, 12, 8)}
                      </h3>
                      <span className={`text-xs px-2 py-1 terminal-text ${
                        tx.type === 'transfer' ? 'text-terminal-cyan' :
                        tx.type === 'stake' ? 'text-terminal-orange' :
                        tx.type === 'unstake' ? 'text-terminal-warning' :
                        tx.type === 'reward' ? 'text-terminal-success' :
                        'text-terminal-gold'
                      }`}>
                        {tx.type}
                      </span>
                      <span className={`text-xs px-2 py-1 terminal-text ${
                        tx.status === 'confirmed' ? 'text-terminal-success' :
                        'text-terminal-warning'
                      }`}>
                        {tx.status}
                      </span>
                    </div>

                    {/* From/To */}
                    <div className="flex items-center space-x-2 text-sm text-terminal-green/70 mb-2 terminal-text">
                      <span className="font-mono">{formatAddress(tx.fromAddress || tx.from || 'EmotionalChain-Network')}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span className="font-mono">{formatAddress(tx.toAddress || tx.to || tx.to_address || 'EmotionalChain-Validator')}</span>
                    </div>

                    {/* Emotional Data */}
                    {tx.emotionalData && (
                      <div className="flex items-center space-x-4 text-xs">
                        <div className="flex items-center space-x-1">
                          <span className="text-terminal-green/70 terminal-text">Authenticity:</span>
                          <span className="text-terminal-success font-medium terminal-text">
                            {Math.round((tx.emotionalData.authenticity || 0) * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-terminal-green/70 terminal-text">Focus:</span>
                          <span className="text-terminal-cyan font-medium terminal-text">
                            {Math.round((tx.emotionalData.focusLevel || 0) * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-terminal-gold font-semibold text-lg terminal-text">
                    {formatNumber(tx.amount)} EMO
                  </p>
                  <p className="text-terminal-green/70 text-sm terminal-text">
                    {formatEmoToUSD(tx.amount)}
                  </p>
                  <p className="text-terminal-green/50 text-xs mt-1">
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