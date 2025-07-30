import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { apiClient } from "../lib/api";

export default function NetworkChart() {
  const { data: networkStats } = useQuery({
    queryKey: ['network-stats'],
    queryFn: () => apiClient.getNetworkStats(),
  });

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

  return (
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
  );
}