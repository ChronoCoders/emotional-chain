import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Coins } from 'lucide-react';

interface ProjectionDataPoint {
  blockHeight: number;
  year: number;
  totalSupply: number;
  blockReward: number;
  annualInflation: number;
  epoch: number;
}

interface HalvingEvent {
  epoch: number;
  blockHeight: number;
  reward: number;
}

interface EmissionProjection {
  projection: ProjectionDataPoint[];
  halvingSchedule: HalvingEvent[];
  metrics: {
    currentReward: number;
    currentEpoch: number;
    nextHalvingBlock: number;
    blocksUntilHalving: number;
    projectedYearsToCompletion: number;
    annualInflationRate: number;
    currentSupplyPercentage: number;
  };
  currentSupply: number;
  maxSupply: number;
  currentBlock: number;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-terminal-surface border border-terminal-cyan p-4 rounded shadow-lg">
        <p className="text-terminal-cyan font-bold mb-2">Year {label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-terminal-green text-sm">
            <span className="text-terminal-warning">{entry.name}:</span>{' '}
            {entry.name === 'Total Supply' 
              ? `${(entry.value / 1000000).toFixed(2)}M EMO`
              : entry.name === 'Block Reward'
              ? `${entry.value.toFixed(2)} EMO`
              : `${entry.value.toFixed(1)}%`
            }
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function EmissionChart() {
  const { data, isLoading } = useQuery<EmissionProjection>({
    queryKey: ['/api/token/emission-projection'],
    refetchInterval: 30000
  });

  if (isLoading || !data) {
    return (
      <div className="terminal-window p-8">
        <div className="text-terminal-cyan text-center">Loading emission projection...</div>
      </div>
    );
  }

  const { projection, halvingSchedule, metrics } = data;

  // Format chart data
  const chartData = projection.map(point => ({
    year: point.year.toFixed(1),
    'Total Supply': point.totalSupply,
    'Block Reward': point.blockReward,
    'Annual Inflation': point.annualInflation,
    epoch: point.epoch
  }));

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(2);
  };

  const yearsToMaxSupply = projection.find(p => p.totalSupply >= data.maxSupply)?.year || 20;

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="terminal-window p-8">
        <h2 className="text-2xl font-bold text-terminal-cyan mb-6 flex items-center">
          <TrendingUp className="w-6 h-6 mr-3" />
          Emission Schedule & Halving
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-terminal-surface p-6 rounded border border-terminal-border" data-testid="metric-current-reward">
            <div className="text-terminal-warning text-sm mb-2">CURRENT BLOCK REWARD</div>
            <div className="text-terminal-cyan text-3xl font-bold">{metrics.currentReward.toFixed(2)} EMO</div>
            <div className="text-terminal-dim text-xs mt-2">Epoch {metrics.currentEpoch}</div>
          </div>

          <div className="bg-terminal-surface p-6 rounded border border-terminal-border" data-testid="metric-next-halving">
            <div className="text-terminal-warning text-sm mb-2">NEXT HALVING</div>
            <div className="text-terminal-cyan text-3xl font-bold">
              {formatNumber(metrics.blocksUntilHalving)}
            </div>
            <div className="text-terminal-dim text-xs mt-2">blocks remaining</div>
          </div>

          <div className="bg-terminal-surface p-6 rounded border border-terminal-border" data-testid="metric-years-to-cap">
            <div className="text-terminal-warning text-sm mb-2">YEARS TO MAX SUPPLY</div>
            <div className="text-terminal-success text-3xl font-bold">{yearsToMaxSupply.toFixed(1)}</div>
            <div className="text-terminal-dim text-xs mt-2">years at current rate</div>
          </div>

          <div className="bg-terminal-surface p-6 rounded border border-terminal-border" data-testid="metric-inflation">
            <div className="text-terminal-warning text-sm mb-2">ANNUAL INFLATION</div>
            <div className="text-terminal-gold text-3xl font-bold">{metrics.annualInflationRate.toFixed(1)}%</div>
            <div className="text-terminal-dim text-xs mt-2">decreasing over time</div>
          </div>
        </div>

        {/* Supply Projection Chart */}
        <div className="mb-8">
          <h3 className="text-terminal-success font-bold text-lg mb-4">Total Supply Projection</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorSupply" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ffff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00ffff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#003d3d" />
              <XAxis 
                dataKey="year" 
                stroke="#00ff00" 
                tick={{ fill: '#00ff00' }}
                label={{ value: 'Years from Now', position: 'insideBottom', offset: -5, fill: '#00ff00' }}
              />
              <YAxis 
                stroke="#00ff00" 
                tick={{ fill: '#00ff00' }}
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                label={{ value: 'Total Supply (EMO)', angle: -90, position: 'insideLeft', fill: '#00ff00' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#00ff00' }} />
              <Area 
                type="monotone" 
                dataKey="Total Supply" 
                stroke="#00ffff" 
                fill="url(#colorSupply)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Block Reward Decay Chart */}
        <div className="mb-8">
          <h3 className="text-terminal-warning font-bold text-lg mb-4">Block Reward Decay (Halving Effect)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#003d3d" />
              <XAxis 
                dataKey="year" 
                stroke="#00ff00" 
                tick={{ fill: '#00ff00' }}
                label={{ value: 'Years from Now', position: 'insideBottom', offset: -5, fill: '#00ff00' }}
              />
              <YAxis 
                stroke="#00ff00" 
                tick={{ fill: '#00ff00' }}
                label={{ value: 'Block Reward (EMO)', angle: -90, position: 'insideLeft', fill: '#00ff00' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#00ff00' }} />
              <Line 
                type="monotone" 
                dataKey="Block Reward" 
                stroke="#ffd700" 
                strokeWidth={2}
                dot={{ fill: '#ffd700', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Inflation Rate Chart */}
        <div>
          <h3 className="text-terminal-cyan font-bold text-lg mb-4">Annual Inflation Rate</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#003d3d" />
              <XAxis 
                dataKey="year" 
                stroke="#00ff00" 
                tick={{ fill: '#00ff00' }}
                label={{ value: 'Years from Now', position: 'insideBottom', offset: -5, fill: '#00ff00' }}
              />
              <YAxis 
                stroke="#00ff00" 
                tick={{ fill: '#00ff00' }}
                tickFormatter={(value) => `${value}%`}
                label={{ value: 'Inflation Rate (%)', angle: -90, position: 'insideLeft', fill: '#00ff00' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#00ff00' }} />
              <Line 
                type="monotone" 
                dataKey="Annual Inflation" 
                stroke="#ff9500" 
                strokeWidth={2}
                dot={{ fill: '#ff9500', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Halving Schedule Table */}
      <div className="terminal-window p-8">
        <h2 className="text-2xl font-bold text-terminal-cyan mb-6 flex items-center">
          <Calendar className="w-6 h-6 mr-3" />
          Halving Schedule
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border border-terminal-border">
            <thead className="bg-terminal-surface">
              <tr>
                <th className="px-6 py-3 text-left text-terminal-warning font-bold">Epoch</th>
                <th className="px-6 py-3 text-left text-terminal-warning font-bold">Block Height</th>
                <th className="px-6 py-3 text-left text-terminal-warning font-bold">Block Reward</th>
                <th className="px-6 py-3 text-left text-terminal-warning font-bold">Approximate Date</th>
              </tr>
            </thead>
            <tbody>
              {halvingSchedule.map((halving, index) => {
                const blocksFromNow = halving.blockHeight - data.currentBlock;
                const daysFromNow = blocksFromNow / 8640; // 8640 blocks per day
                const approximateDate = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
                
                return (
                  <tr 
                    key={halving.epoch} 
                    className={`border-t border-terminal-border ${
                      halving.epoch === metrics.currentEpoch ? 'bg-terminal-cyan/10' : ''
                    }`}
                    data-testid={`halving-epoch-${halving.epoch}`}
                  >
                    <td className="px-6 py-4 text-terminal-cyan font-bold">
                      {halving.epoch === metrics.currentEpoch && '→ '}Epoch {halving.epoch}
                    </td>
                    <td className="px-6 py-4 text-terminal-green">
                      {halving.blockHeight.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-terminal-gold font-bold">
                      {halving.reward.toFixed(2)} EMO
                    </td>
                    <td className="px-6 py-4 text-terminal-dim">
                      {blocksFromNow <= 0 
                        ? 'Current' 
                        : approximateDate.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short' 
                          })
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-terminal-bg rounded border border-terminal-cyan/30">
          <h4 className="text-terminal-cyan font-bold mb-2">How Halving Works</h4>
          <ul className="space-y-2 text-terminal-green/80 text-sm">
            <li>&gt; Every <span className="text-terminal-warning">3,153,600 blocks</span> (~1 year), rewards are cut in half</li>
            <li>&gt; Started at <span className="text-terminal-cyan">70 EMO</span> per block, reduces to <span className="text-terminal-cyan">35 EMO</span>, then <span className="text-terminal-cyan">17.5 EMO</span>, etc.</li>
            <li>&gt; Combined with supply-based reduction as we approach <span className="text-terminal-gold">1 billion EMO cap</span></li>
            <li>&gt; Minimum tail emission of <span className="text-terminal-success">0.01 EMO</span> ensures long-term network security</li>
            <li>&gt; Current epoch: <span className="text-terminal-warning">{metrics.currentEpoch}</span>, blocks until next halving: <span className="text-terminal-warning">{formatNumber(metrics.blocksUntilHalving)}</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
