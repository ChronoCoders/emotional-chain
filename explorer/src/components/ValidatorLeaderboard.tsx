import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api";
import { formatNumber, formatAddress, getEmotionalScoreColor } from "../lib/utils";
import { Trophy, Heart, Zap, Users } from "lucide-react";

export default function ValidatorLeaderboard() {
  const { data: wallets, isLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => apiClient.getWallets(),
  });

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top Validators</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-slate-700 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Filter and sort validators by balance
  const topValidators = (wallets || [])
    .filter(wallet => wallet.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 8);

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
          Top Validators
        </h3>
        <div className="text-slate-400 text-sm">
          {topValidators.length} active validators
        </div>
      </div>

      <div className="space-y-3">
        {topValidators.map((validator, index) => {
          const emotionalScore = 70 + Math.random() * 25; // Mock emotional score
          const rank = index + 1;
          
          return (
            <div
              key={validator.validatorId}
              className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-600/50 hover:border-slate-500 transition-colors"
            >
              <div className="flex items-center space-x-4">
                {/* Rank */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                  rank === 2 ? 'bg-slate-400/20 text-slate-300' :
                  rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                  'bg-slate-700 text-slate-400'
                }`}>
                  {rank}
                </div>

                {/* Validator Info */}
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-white font-medium">{validator.validatorId}</h4>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <p className="text-slate-400 text-sm">
                    {formatAddress(validator.address || `0x${validator.validatorId.toLowerCase()}`)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center space-x-4">
                  {/* EMO Balance */}
                  <div>
                    <p className="text-white font-semibold">
                      {formatNumber(validator.balance)} EMO
                    </p>
                    <p className="text-slate-400 text-sm">
                      ${formatNumber(validator.balance * 0.85)} USD
                    </p>
                  </div>

                  {/* Emotional Score */}
                  <div className="text-center">
                    <div className={`flex items-center space-x-1 ${getEmotionalScoreColor(emotionalScore)}`}>
                      <Heart className="w-4 h-4" />
                      <span className="text-sm font-medium">{Math.round(emotionalScore)}</span>
                    </div>
                    <p className="text-slate-400 text-xs">emotional</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-slate-400 text-sm">Total EMO Earned</p>
            <p className="text-white font-semibold">
              {formatNumber(topValidators.reduce((sum, v) => sum + v.balance, 0))} EMO
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Avg. Score</p>
            <p className="text-emotional-400 font-semibold">
              {Math.round(77 + Math.random() * 15)}%
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Rewards 24h</p>
            <p className="text-green-400 font-semibold">
              +{formatNumber(Math.random() * 500 + 200)} EMO
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}