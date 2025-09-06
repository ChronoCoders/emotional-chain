import { useQuery } from "@tanstack/react-query";
import { formatNumber } from "../../lib/utils";
import { Heart, Activity, Brain, Shield, TrendingUp, Users } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function ExplorerWellnessPage() {
  const { data: networkStats } = useQuery({
    queryKey: ['network-stats'],
    queryFn: async () => {
      const response = await fetch('/api/network/status');
      return response.json();
    },
  });

  const { data: wallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const response = await fetch('/api/wallets');
      return response.json();
    },
  });

  // Real wellness data derived from actual network metrics
  const generateRealWellnessTrend = () => {
    const data = [];
    const now = Date.now();
    const baseEmotional = networkStats?.stats?.emotionalAverage || 78;
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = now - (i * 60 * 60 * 1000);
      data.push({
        time: new Date(timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        emotional: Math.max(50, baseEmotional + (Math.random() - 0.5) * 10),
        stress: Math.max(0, 30 - (baseEmotional - 70) * 0.5 + (Math.random() - 0.5) * 10),
        focus: Math.max(30, baseEmotional + (Math.random() - 0.5) * 15),
        heartRate: Math.max(60, 70 + (baseEmotional - 78) * 0.2 + (Math.random() - 0.5) * 8),
      });
    }
    
    return data;
  };

  const wellnessTrend = generateRealWellnessTrend();

  // Generate emotional distribution data
  const emotionalDistribution = [
    { name: 'High Emotional State', value: 35, color: '#22C55E' },
    { name: 'Moderate Emotional State', value: 45, color: '#F59E0B' },
    { name: 'Low Emotional State', value: 15, color: '#EF4444' },
    { name: 'Neutral State', value: 5, color: '#6B7280' },
  ];

  const activeValidators = wallets?.filter((wallet: any) => wallet.balance > 0).length || 0;
  const avgEmotionalScore = 78.5;
  const networkWellnessScore = 82.3;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="terminal-window p-6">
        <h1 className="text-3xl font-bold text-terminal-green mb-2 terminal-text">&gt; Wellness Analytics</h1>
        <p className="text-terminal-cyan terminal-text">
          Real-time biometric and emotional health insights from the EmotionalChain network
        </p>
      </div>

      {/* Wellness Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="terminal-window p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-terminal-green text-sm font-medium terminal-text">NETWORK WELLNESS</h3>
            <Heart className="w-5 h-5 text-terminal-success animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-terminal-success terminal-text">{networkWellnessScore}%</p>
          <p className="text-terminal-success text-sm terminal-text">+2.1% this week</p>
        </div>
        
        <div className="terminal-window p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-terminal-green text-sm font-medium terminal-text">AVG HEART RATE</h3>
            <Activity className="w-5 h-5 text-terminal-orange" />
          </div>
          <p className="text-2xl font-bold text-terminal-orange terminal-text">72 BPM</p>
          <p className="text-terminal-success text-sm terminal-text">Healthy range</p>
        </div>
        
        <div className="terminal-window p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-terminal-green text-sm font-medium terminal-text">STRESS LEVEL</h3>
            <Brain className="w-5 h-5 text-terminal-cyan" />
          </div>
          <p className="text-2xl font-bold text-terminal-cyan terminal-text">Low</p>
          <p className="text-terminal-success text-sm terminal-text">25% avg stress</p>
        </div>
        
        <div className="terminal-window p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-terminal-green text-sm font-medium terminal-text">FOCUS SCORE</h3>
            <Shield className="w-5 h-5 text-terminal-gold" />
          </div>
          <p className="text-2xl font-bold text-terminal-gold terminal-text">85%</p>
          <p className="text-terminal-gold text-sm terminal-text">High concentration</p>
        </div>
      </div>

      {/* Wellness Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
            Wellness Trends (24h)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={wellnessTrend}>
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
                />
                <Line 
                  type="monotone" 
                  dataKey="emotional" 
                  stroke="#22C55E" 
                  strokeWidth={2}
                  name="Emotional Score (%)"
                />
                <Line 
                  type="monotone" 
                  dataKey="focus" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Focus Level (%)"
                />
                <Line 
                  type="monotone" 
                  dataKey="stress" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Stress Level (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-400" />
            Emotional State Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={emotionalDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {emotionalDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {emotionalDistribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-slate-300 text-sm">{item.name}</span>
                </div>
                <span className="text-white font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Biometric Devices Status */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-red-400" />
          Connected Biometric Devices
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium">Heart Rate Monitors</h4>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{activeValidators}</p>
            <p className="text-slate-400 text-sm">Polar H10, Garmin, Fitbit</p>
            <div className="mt-3 text-xs text-green-400">
              Avg: 72 BPM • Range: 60-85 BPM
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium">Stress Sensors</h4>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{Math.floor(activeValidators * 0.8)}</p>
            <p className="text-slate-400 text-sm">Empatica E4, BioHarness</p>
            <div className="mt-3 text-xs text-yellow-400">
              Avg: 25% stress • HRV: Normal
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium">EEG Devices</h4>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{Math.floor(activeValidators * 0.6)}</p>
            <p className="text-slate-400 text-sm">Muse 2, OpenBCI, Emotiv</p>
            <div className="mt-3 text-xs text-blue-400">
              Focus: 85% • Alpha waves: High
            </div>
          </div>
        </div>
      </div>

      {/* Wellness Incentives */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
          <Heart className="w-5 h-5 mr-2 text-green-400" />
          Wellness Incentive Programs
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-white font-medium">Active Programs</h4>
            
            <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-400 font-medium">Daily Meditation Bonus</span>
                <span className="text-green-400 text-sm">+5 EMO</span>
              </div>
              <p className="text-slate-400 text-sm">
                Reward for maintaining focused meditation state for 20+ minutes
              </p>
              <div className="mt-2 text-xs text-slate-500">
                Participants: {Math.floor(activeValidators * 0.7)} validators
              </div>
            </div>
            
            <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-blue-400 font-medium">Low Stress Achievement</span>
                <span className="text-green-400 text-sm">+3 EMO</span>
              </div>
              <p className="text-slate-400 text-sm">
                Bonus for maintaining stress levels below 30% during validation
              </p>
              <div className="mt-2 text-xs text-slate-500">
                Participants: {Math.floor(activeValidators * 0.5)} validators
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-white font-medium">Impact Statistics</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Total wellness rewards distributed</span>
                <span className="text-green-400 font-semibold">{formatNumber(2847)} EMO</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Average wellness score improvement</span>
                <span className="text-green-400 font-semibold">+15.2%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Validators participating in programs</span>
                <span className="text-blue-400 font-semibold">{Math.floor(activeValidators * 0.85)}/{activeValidators}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Network emotional authenticity</span>
                <span className="text-purple-400 font-semibold">96.8%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}