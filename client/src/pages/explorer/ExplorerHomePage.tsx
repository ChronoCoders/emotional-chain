import { useQuery } from "@tanstack/react-query";
import { formatNumber, formatLargeNumber } from "../../lib/utils";
import { Activity, Users, Zap, TrendingUp, Shield, Timer, DollarSign, Heart } from "lucide-react";
import EmotionalChainLogo from '@/components/ui/emotional-chain-logo';
import { formatEmoToUSD, calculateUSDValue, EMO_PRICE_USD } from "@shared/constants";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ExplorerHomePage() {
  const { data: networkStats, isLoading: networkLoading } = useQuery({
    queryKey: ['network-stats'],
    queryFn: async () => {
      const response = await fetch('/api/network/status');
      return response.json();
    },
  });

  const { data: wallets, isLoading: walletsLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const response = await fetch('/api/wallets');
      return response.json();
    },
  });

  const isLoading = networkLoading || walletsLoading;

  // Calculate total EMO from all wallets
  const totalEMO = wallets?.reduce((sum: number, wallet: any) => sum + (wallet.balance || 0), 0) || 0;
  const activeValidators = wallets?.filter((wallet: any) => wallet.balance > 0).length || 0;

  // Generate mock time series data for the chart
  const generateChartData = () => {
    const data = [];
    const now = Date.now();
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = now - (i * 60 * 60 * 1000); // Hour intervals
      data.push({
        time: new Date(timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        emotional: 75 + Math.random() * 20, // 75-95%
        validators: 15 + Math.floor(Math.random() * 5), // 15-20 validators
        transactions: Math.floor(Math.random() * 100) + 50, // 50-150 tx/h
      });
    }
    
    return data;
  };

  const chartData = generateChartData();

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
          <div className="mr-4">
            <EmotionalChainLogo size={48} className="text-green-400 animate-pulse" />
          </div>
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
          change={`${formatNumber(totalEMO)} EMO • ${formatEmoToUSD(totalEMO)}`}
          icon={Users}
          trend="up"
          color="blue"
        />
        <MetricCard
          title="Block Height"
          value={formatLargeNumber(stats?.blockHeight || 1163)}
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
            <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
            Network Activity
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tick={{ fill: '#9CA3AF' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  labelStyle={{ color: '#D1D5DB' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="emotional" 
                  stroke="#22C55E" 
                  strokeWidth={2}
                  dot={{ fill: '#22C55E', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: '#22C55E' }}
                  name="Emotional Score (%)"
                />
                <Line 
                  type="monotone" 
                  dataKey="validators" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: '#3B82F6' }}
                  name="Active Validators"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-green-400" />
            Security Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">P2P Connections</span>
              <span className="text-white font-medium">{stats?.p2pConnections || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Network Hashrate</span>
              <span className="text-white font-medium">12.5 MH/s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Consensus Quality</span>
              <span className={`font-medium ${
                (stats?.consensusQuality || 92) >= 95 ? 'text-green-400' : 
                (stats?.consensusQuality || 92) >= 85 ? 'text-yellow-400' : 'text-red-400'
              }`}>
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
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-yellow-400" />
            Top Validators
          </h3>
          
          <div className="space-y-3">
            {wallets?.filter((wallet: any) => wallet.balance > 0)
              .sort((a: any, b: any) => b.balance - a.balance)
              .slice(0, 5)
              .map((validator: any, index: number) => {
                const emotionalScore = 70 + Math.random() * 25;
                const rank = index + 1;
                
                return (
                  <div
                    key={validator.validatorId}
                    className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-600/50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                        rank === 2 ? 'bg-slate-400/20 text-slate-300' :
                        rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-slate-700 text-slate-400'
                      }`}>
                        {rank}
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{validator.validatorId}</h4>
                        <p className="text-slate-400 text-sm">{Math.round(emotionalScore)}% emotional</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">
                        {formatNumber(validator.balance)} EMO
                      </p>
                      <p className="text-slate-400 text-sm">
                        {formatEmoToUSD(validator.balance)}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-400" />
            Network Statistics
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-slate-400 text-sm">Total Network Value</p>
              <p className="text-white font-semibold text-lg">
                {formatNumber(totalEMO)} EMO
              </p>
              <p className="text-slate-400 text-sm">
                {formatEmoToUSD(totalEMO)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-sm">Staking APY</p>
              <p className="text-green-400 font-semibold text-lg">12.5%</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-sm">Total Blocks</p>
              <p className="text-blue-400 font-semibold text-lg">
                {formatLargeNumber(stats?.blockHeight || 1163)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-sm">Total Transactions</p>
              <p className="text-purple-400 font-semibold text-lg">
                {formatLargeNumber(12478)}
              </p>
            </div>
          </div>
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
    emotional: "text-green-400 bg-green-400/10 border-green-400/20",
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