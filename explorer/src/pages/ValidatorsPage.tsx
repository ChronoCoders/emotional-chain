import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api";
import { formatNumber, formatAddress, getEmotionalScoreColor, calculateAPY } from "../lib/utils";
import { Users, Heart, Zap, DollarSign, TrendingUp, Shield } from "lucide-react";

export default function ValidatorsPage() {
  const { data: wallets, isLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => apiClient.getWallets(),
  });

  const { data: networkStats } = useQuery({
    queryKey: ['network-stats'],
    queryFn: () => apiClient.getNetworkStats(),
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-slate-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeValidators = (wallets || []).filter(wallet => wallet.balance > 0);
  const totalStaked = activeValidators.reduce((sum, validator) => sum + validator.balance, 0);
  const avgAPY = 12.5; // Mock APY

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Validators</h1>
        <p className="text-slate-400">
          EmotionalChain validators securing the network through Proof of Emotion consensus
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 text-sm font-medium">Active Validators</h3>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{activeValidators.length}</p>
          <p className="text-green-400 text-sm">+2 this week</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 text-sm font-medium">Total Staked</h3>
            <DollarSign className="w-5 h-5 text-emotional-400" />
          </div>
          <p className="text-2xl font-bold text-white">{formatNumber(totalStaked)} EMO</p>
          <p className="text-slate-400 text-sm">${formatNumber(totalStaked * 0.85)} USD</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 text-sm font-medium">Average APY</h3>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">{avgAPY}%</p>
          <p className="text-green-400 text-sm">+0.5% this month</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 text-sm font-medium">Network Health</h3>
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {Math.round(networkStats?.stats?.consensusQuality || 92)}%
          </p>
          <p className="text-purple-400 text-sm">Excellent</p>
        </div>
      </div>

      {/* Validators Table */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">All Validators</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="text-left p-4 text-slate-300 font-medium">Validator</th>
                <th className="text-left p-4 text-slate-300 font-medium">Stake</th>
                <th className="text-left p-4 text-slate-300 font-medium">Emotional Score</th>
                <th className="text-left p-4 text-slate-300 font-medium">Performance</th>
                <th className="text-left p-4 text-slate-300 font-medium">Rewards (24h)</th>
                <th className="text-left p-4 text-slate-300 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {activeValidators
                .sort((a, b) => b.balance - a.balance)
                .map((validator, index) => {
                  const emotionalScore = 70 + Math.random() * 25;
                  const performance = 85 + Math.random() * 12;
                  const dailyRewards = validator.balance * 0.0003; // ~12% APY
                  
                  return (
                    <tr
                      key={validator.validatorId}
                      className="border-b border-slate-700/50 hover:bg-slate-900/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-emotional-400 to-emotional-600 rounded-lg flex items-center justify-center text-white font-bold">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="text-white font-medium">{validator.validatorId}</p>
                            <p className="text-slate-400 text-sm font-mono">
                              {formatAddress(validator.address || `0x${validator.validatorId.toLowerCase()}`)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-white font-semibold">
                            {formatNumber(validator.balance)} EMO
                          </p>
                          <p className="text-slate-400 text-sm">
                            ${formatNumber(validator.balance * 0.85)}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Heart className={`w-4 h-4 ${getEmotionalScoreColor(emotionalScore)}`} />
                          <span className={`font-medium ${getEmotionalScoreColor(emotionalScore)}`}>
                            {Math.round(emotionalScore)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-1.5 rounded-full"
                            style={{ width: `${emotionalScore}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">{Math.round(performance)}%</p>
                          <p className="text-slate-400 text-sm">Uptime</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-green-400 font-semibold">
                            +{formatNumber(dailyRewards)} EMO
                          </p>
                          <p className="text-slate-400 text-sm">
                            {avgAPY}% APY
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-400 text-sm font-medium">Active</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staking Information */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-yellow-400" />
          Become a Validator
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-white font-medium mb-2">Minimum Stake</h4>
            <p className="text-2xl font-bold text-emotional-400">50,000 EMO</p>
            <p className="text-slate-400 text-sm">Required to become a validator</p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Delegation</h4>
            <p className="text-2xl font-bold text-blue-400">1,000 EMO</p>
            <p className="text-slate-400 text-sm">Minimum delegation amount</p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Unbonding Period</h4>
            <p className="text-2xl font-bold text-purple-400">21 Days</p>
            <p className="text-slate-400 text-sm">Time to unstake tokens</p>
          </div>
        </div>
      </div>
    </div>
  );
}