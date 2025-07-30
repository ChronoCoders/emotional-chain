import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/api";
import { formatNumber, formatLargeNumber, formatTimeAgo, getNetworkHealthColor, formatHashrate } from "../lib/utils";
import { Activity, Users, Zap, Heart, TrendingUp, Shield, Timer, DollarSign } from "lucide-react";
import NetworkChart from "../components/NetworkChart";
import ValidatorLeaderboard from "../components/ValidatorLeaderboard";
import RecentBlocks from "../components/RecentBlocks";
import RecentTransactions from "../components/RecentTransactions";

export default function HomePage() {
  const { data: networkStats, isLoading: networkLoading } = useQuery({
    queryKey: ['network-stats'],
    queryFn: () => apiClient.getNetworkStats(),
  });

  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => apiClient.getWallets(),
  });

  const isLoading = networkLoading || walletsLoading;

  // Calculate total EMO from all wallets
  const totalEMO = wallets?.reduce((sum, wallet) => sum + (wallet.balance || 0), 0) || 0;
  const activeValidators = wallets?.filter(wallet => wallet.balance > 0).length || 0;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-slate-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = networkStats?.stats;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700">
        <div className="flex items-center justify-center mb-4">
          <Heart className="w-12 h-12 text-emotional-400 heartbeat mr-4" />
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">EmotionalChain Explorer</h1>
            <p className="text-slate-300 text-lg">World's First Emotion-Powered Blockchain</p>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-2 mt-6">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-green-400 font-medium">Network Active • Proof of Emotion Consensus</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Network Status"
          value={networkStats?.isRunning ? "Active" : "Inactive"}
          change={`${stats?.uptime || 0}s uptime`}
          icon={Activity}
          trend="up"
          color={networkStats?.isRunning ? "green" : "red"}
        />
        <MetricCard
          title="Active Validators"
          value={activeValidators.toString()}
          change={`${formatNumber(totalEMO)} EMO staked`}
          icon={Users}
          trend="up"
          color="blue"
        />
        <MetricCard
          title="Block Height"
          value={formatLargeNumber(stats?.blockHeight || 1000)}
          change={`${stats?.avgBlockTime || 30}s avg time`}
          icon={Zap}
          trend="neutral"
          color="purple"
        />
        <MetricCard
          title="Emotional Health"
          value={`${Math.round(stats?.emotionalAverage || 78)}%`}
          change={`${Math.round(stats?.consensusQuality || 92)}% consensus quality`}
          icon={Heart}
          trend="up"
          color="emotional"
        />
      </div>

      {/* Network Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-emotional-400" />
            Network Activity
          </h3>
          <NetworkChart />
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-emotional-400" />
            Security Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">P2P Connections</span>
              <span className="text-white font-medium">{stats?.p2pConnections || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Network Hashrate</span>
              <span className="text-white font-medium">{formatHashrate(12500000)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Consensus Quality</span>
              <span className={`font-medium ${getNetworkHealthColor(stats?.consensusQuality || 92)}`}>
                {Math.round(stats?.consensusQuality || 92)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Byzantine Tolerance</span>
              <span className="text-green-400 font-medium">33% fault tolerance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Validator Leaderboard & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ValidatorLeaderboard />
        <div className="space-y-6">
          <RecentBlocks />
          <RecentTransactions />
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: "up" | "down" | "neutral";
  color: "green" | "red" | "blue" | "purple" | "emotional";
}

function MetricCard({ title, value, change, icon: Icon, trend, color }: MetricCardProps) {
  const colorClasses = {
    green: "text-green-400 bg-green-400/10 border-green-400/20",
    red: "text-red-400 bg-red-400/10 border-red-400/20",
    blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    purple: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    emotional: "text-emotional-400 bg-emotional-400/10 border-emotional-400/20",
  };

  const trendColors = {
    up: "text-green-400",
    down: "text-red-400",
    neutral: "text-slate-400",
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:bg-slate-800/70 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-300 text-sm font-medium">{title}</h3>
        <div className={`p-2 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className={`text-sm ${trendColors[trend]}`}>{change}</p>
      </div>
    </div>
  );
}