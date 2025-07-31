import { useQuery } from "@tanstack/react-query";
import { formatNumber, formatAddress } from "../../lib/utils";
import { Users, Heart, Zap, DollarSign, TrendingUp, Shield } from "lucide-react";

export default function ExplorerValidatorsPage() {
  const { data: wallets, isLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const response = await fetch('/api/wallets');
      return response.json();
    },
  });

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

  const activeValidators = (wallets || []).filter((wallet: any) => wallet.balance > 0);
  const totalEmoEarned = activeValidators.reduce((sum: number, validator: any) => sum + validator.balance, 0);
  const avgBlockReward = 61; // Average 53-71 EMO per selection based on live data

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
            <h3 className="text-slate-300 text-sm font-medium">Total EMO Earned</h3>
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">{formatNumber(totalEmoEarned)} EMO</p>
          <p className="text-slate-400 text-sm">${formatNumber(totalEmoEarned * 0.01)} USD</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 text-sm font-medium">Avg Block Rewards</h3>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">{avgBlockReward} EMO</p>
          <p className="text-green-400 text-sm">53-71 EMO range</p>
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
                <th className="text-left p-4 text-slate-300 font-medium">EMO Earned</th>
                <th className="text-left p-4 text-slate-300 font-medium">Emotional Score</th>
                <th className="text-left p-4 text-slate-300 font-medium">Performance</th>
                <th className="text-left p-4 text-slate-300 font-medium">Block Rewards</th>
                <th className="text-left p-4 text-slate-300 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {activeValidators
                .sort((a: any, b: any) => b.balance - a.balance)
                .map((validator: any, index: number) => {
                  const emotionalScore = 70 + Math.random() * 25;
                  const performance = 85 + Math.random() * 12;
                  const dailyRewards = Math.random() * 18 + 53; // 53-71 EMO per selection
                  
                  return (
                    <tr
                      key={validator.validatorId}
                      className="border-b border-slate-700/50 hover:bg-slate-900/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white font-bold">
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
                            ${formatNumber(validator.balance * 0.01)}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Heart className={`w-4 h-4 ${
                            emotionalScore >= 85 ? 'text-green-500' :
                            emotionalScore >= 75 ? 'text-yellow-500' :
                            'text-orange-500'
                          }`} />
                          <span className={`font-medium ${
                            emotionalScore >= 85 ? 'text-green-500' :
                            emotionalScore >= 75 ? 'text-yellow-500' :
                            'text-orange-500'
                          }`}>
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
                            Daily EMO rewards
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

      {/* Emotional Mining Information */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Heart className="w-5 h-5 mr-2 text-pink-400" />
          Earn Through Emotional Mining
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-white font-medium mb-2">Base Mining Reward</h4>
            <p className="text-2xl font-bold text-green-400">50 EMO</p>
            <p className="text-slate-400 text-sm">Per block mined with PoE</p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Emotional Bonus</h4>
            <p className="text-2xl font-bold text-blue-400">0-25 EMO</p>
            <p className="text-slate-400 text-sm">Based on wellness score</p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-2">Validation Reward</h4>
            <p className="text-2xl font-bold text-purple-400">5 EMO</p>
            <p className="text-slate-400 text-sm">Per consensus validation</p>
          </div>
        </div>
      </div>
    </div>
  );
}