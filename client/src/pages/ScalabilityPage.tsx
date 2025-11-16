import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, Zap, Users, TrendingUp, Server, Activity } from 'lucide-react';

export default function ScalabilityPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-gray-950 text-foreground dark:text-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Network className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            Phase 5: Scalability Solutions
          </h1>
          <p className="text-muted-foreground dark:text-gray-400 text-lg">
            Hierarchical validator network and optimized P2P protocols for massive scale
          </p>
        </div>

        <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              Hierarchical Validator Tiers
            </CardTitle>
            <CardDescription>Three-tier architecture solves bandwidth limitations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* PRIMARY TIER */}
              <div className="border border-purple-200 dark:border-purple-900 rounded-lg p-4 bg-purple-50 dark:bg-purple-950/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100">Tier 1: PRIMARY</h3>
                  <Badge className="bg-purple-600 dark:bg-purple-700 text-white">21 validators</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-purple-700 dark:text-purple-300">
                    <span>Min Bandwidth:</span>
                    <strong>1 Mbps</strong>
                  </div>
                  <div className="flex justify-between text-purple-700 dark:text-purple-300">
                    <span>Min Uptime:</span>
                    <strong>99.9%</strong>
                  </div>
                  <div className="flex justify-between text-purple-700 dark:text-purple-300">
                    <span>Min Stake:</span>
                    <strong>50,000 EMO</strong>
                  </div>
                  <div className="flex justify-between text-purple-700 dark:text-purple-300">
                    <span>Biometric:</span>
                    <strong>Required</strong>
                  </div>
                  <div className="flex justify-between text-purple-700 dark:text-purple-300">
                    <span>Reward Multiplier:</span>
                    <strong>1.0x (100%)</strong>
                  </div>
                </div>
                <p className="mt-3 text-xs text-purple-600 dark:text-purple-400">
                  Full consensus participation with continuous biometric validation
                </p>
              </div>

              {/* SECONDARY TIER */}
              <div className="border border-blue-200 dark:border-blue-900 rounded-lg p-4 bg-blue-50 dark:bg-blue-950/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Tier 2: SECONDARY</h3>
                  <Badge className="bg-blue-600 dark:bg-blue-700 text-white">100 validators</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-blue-700 dark:text-blue-300">
                    <span>Min Bandwidth:</span>
                    <strong>100 Kbps</strong>
                  </div>
                  <div className="flex justify-between text-blue-700 dark:text-blue-300">
                    <span>Min Uptime:</span>
                    <strong>95.0%</strong>
                  </div>
                  <div className="flex justify-between text-blue-700 dark:text-blue-300">
                    <span>Min Stake:</span>
                    <strong>20,000 EMO</strong>
                  </div>
                  <div className="flex justify-between text-blue-700 dark:text-blue-300">
                    <span>Biometric:</span>
                    <strong>Required</strong>
                  </div>
                  <div className="flex justify-between text-blue-700 dark:text-blue-300">
                    <span>Reward Multiplier:</span>
                    <strong>0.5x (50%)</strong>
                  </div>
                </div>
                <p className="mt-3 text-xs text-blue-600 dark:text-blue-400">
                  Checkpoint validation every 10 minutes with reduced bandwidth
                </p>
              </div>

              {/* LIGHT TIER */}
              <div className="border border-green-200 dark:border-green-900 rounded-lg p-4 bg-green-50 dark:bg-green-950/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-green-900 dark:text-green-100">Tier 3: LIGHT</h3>
                  <Badge className="bg-green-600 dark:bg-green-700 text-white">Unlimited</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-green-700 dark:text-green-300">
                    <span>Min Bandwidth:</span>
                    <strong>10 Kbps</strong>
                  </div>
                  <div className="flex justify-between text-green-700 dark:text-green-300">
                    <span>Min Uptime:</span>
                    <strong>80.0%</strong>
                  </div>
                  <div className="flex justify-between text-green-700 dark:text-green-300">
                    <span>Min Stake:</span>
                    <strong>10,000 EMO</strong>
                  </div>
                  <div className="flex justify-between text-green-700 dark:text-green-300">
                    <span>Biometric:</span>
                    <strong>Not Required</strong>
                  </div>
                  <div className="flex justify-between text-green-700 dark:text-green-300">
                    <span>Reward Multiplier:</span>
                    <strong>0.1x (10%)</strong>
                  </div>
                </div>
                <p className="mt-3 text-xs text-green-600 dark:text-green-400">
                  Transaction validation only with minimal bandwidth requirements
                </p>
              </div>
            </div>

            <div className="bg-muted dark:bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-foreground dark:text-white">Automatic Tier Management</h4>
              <ul className="space-y-1 text-sm text-muted-foreground dark:text-gray-400">
                <li>• Validators are automatically promoted or demoted based on performance</li>
                <li>• Performance is measured every 24 hours (bandwidth, uptime, stake amount)</li>
                <li>• Tier promotions increase rewards, demotions decrease rewards proportionally</li>
                <li>• This ensures network quality while allowing flexible participation</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              GossipSub Protocol Optimization
            </CardTitle>
            <CardDescription>Replaced FloodSub with GossipSub for better scalability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2 text-foreground dark:text-white">Configuration Parameters</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground dark:text-gray-400">Target Degree (D):</span>
                    <strong className="text-foreground dark:text-white">6 peers</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground dark:text-gray-400">Lower Bound (Dlo):</span>
                    <strong className="text-foreground dark:text-white">4 peers</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground dark:text-gray-400">Upper Bound (Dhi):</span>
                    <strong className="text-foreground dark:text-white">12 peers</strong>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground dark:text-gray-400">Lazy Push Factor:</span>
                    <strong className="text-foreground dark:text-white">6 peers</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground dark:text-gray-400">Heartbeat Interval:</span>
                    <strong className="text-foreground dark:text-white">1 second</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground dark:text-gray-400">Message Cache:</span>
                    <strong className="text-foreground dark:text-white">5 heartbeats</strong>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-foreground dark:text-white">Topic-Based Routing</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">/emotionalchain/blocks/1.0.0</Badge>
                  <span className="text-muted-foreground dark:text-gray-400">Block propagation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">/emotionalchain/txs/1.0.0</Badge>
                  <span className="text-muted-foreground dark:text-gray-400">Transaction propagation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">/emotionalchain/consensus/1.0.0</Badge>
                  <span className="text-muted-foreground dark:text-gray-400">Consensus messages</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">/emotionalchain/proofs/1.0.0</Badge>
                  <span className="text-muted-foreground dark:text-gray-400">Biometric proofs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">/emotionalchain/checkpoints/1.0.0</Badge>
                  <span className="text-muted-foreground dark:text-gray-400">Checkpoints (secondary validators)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              Bandwidth Optimization
            </CardTitle>
            <CardDescription>Differentiated message propagation based on validator tier</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2 text-foreground dark:text-white">Block Propagation Strategy</h4>
              <ul className="space-y-2 text-sm text-muted-foreground dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <Server className="w-4 h-4 mt-0.5 text-purple-600 dark:text-purple-400" />
                  <div>
                    <strong className="text-foreground dark:text-white">Primary Validators:</strong> Receive full blocks immediately for consensus participation
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Server className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <strong className="text-foreground dark:text-white">Secondary Validators:</strong> Receive block headers only, reducing bandwidth by ~90%
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Server className="w-4 h-4 mt-0.5 text-green-600 dark:text-green-400" />
                  <div>
                    <strong className="text-foreground dark:text-white">Light Validators:</strong> Receive transaction hashes only for minimal overhead
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-900">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h4 className="font-semibold text-green-900 dark:text-green-100">Bandwidth Savings</h4>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                With 21 primary, 100 secondary, and 1000 light validators, the network saves approximately
                <strong> 85% bandwidth</strong> compared to full block propagation to all validators.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground dark:text-gray-500 py-4">
          <p>Phase 5: Scalability Solutions • November 2025</p>
        </div>
      </div>
    </div>
  );
}
