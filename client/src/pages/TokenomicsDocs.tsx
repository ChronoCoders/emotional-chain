import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Coins, TrendingUp, Lock, Users, Shield, Zap } from 'lucide-react';
import { TOKENOMICS } from '@shared/tokenomics/emissionSchedule';

export default function TokenomicsDocs() {
  return (
    <div className="min-h-screen bg-background dark:bg-gray-950 text-foreground dark:text-gray-100 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/tokenomics">
            <button className="flex items-center gap-2 text-muted-foreground dark:text-gray-400 hover:text-foreground dark:hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Back to Calculator
            </button>
          </Link>
        </div>

        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <BookOpen className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            Tokenomics Documentation
          </h1>
          <p className="text-muted-foreground dark:text-gray-400 text-lg">
            Complete guide to EmotionalChain's economic model
          </p>
        </div>

        <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              Token Supply & Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">Total Supply</h3>
              <p className="text-muted-foreground dark:text-gray-400">
                Fixed supply of <strong className="text-foreground dark:text-white">100,000,000 EMO</strong> tokens. No inflation beyond this cap.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">Distribution Breakdown</h3>
              <ul className="space-y-2 text-muted-foreground dark:text-gray-400">
                <li className="flex justify-between">
                  <span>• Validator Rewards (50%)</span>
                  <strong className="text-foreground dark:text-white">50,000,000 EMO</strong>
                </li>
                <li className="text-sm ml-4 text-muted-foreground dark:text-gray-500">
                  Distributed over 10 years to validators securing the network
                </li>
                
                <li className="flex justify-between mt-2">
                  <span>• Ecosystem Fund (30%)</span>
                  <strong className="text-foreground dark:text-white">30,000,000 EMO</strong>
                </li>
                <li className="text-sm ml-4 text-muted-foreground dark:text-gray-500">
                  Grants, partnerships, and development funding
                </li>
                
                <li className="flex justify-between mt-2">
                  <span>• Team Allocation (15%)</span>
                  <strong className="text-foreground dark:text-white">15,000,000 EMO</strong>
                </li>
                <li className="text-sm ml-4 text-muted-foreground dark:text-gray-500">
                  4-year vesting with 1-year cliff
                </li>
                
                <li className="flex justify-between mt-2">
                  <span>• Early Investors (5%)</span>
                  <strong className="text-foreground dark:text-white">5,000,000 EMO</strong>
                </li>
                <li className="text-sm ml-4 text-muted-foreground dark:text-gray-500">
                  4-year vesting with 1-year cliff
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              Emission Schedule & Halving
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">Initial Block Reward</h3>
              <p className="text-muted-foreground dark:text-gray-400">
                <strong className="text-foreground dark:text-white">50 EMO per block</strong> at genesis
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">Halving Mechanism</h3>
              <p className="text-muted-foreground dark:text-gray-400 mb-2">
                Block rewards halve every <strong className="text-foreground dark:text-white">2,100,000 blocks</strong> (~2 years at 30-second block time)
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground dark:text-gray-400">
                <li>• Blocks 0 - 2.1M: 50 EMO/block</li>
                <li>• Blocks 2.1M - 4.2M: 25 EMO/block</li>
                <li>• Blocks 4.2M - 6.3M: 12.5 EMO/block</li>
                <li>• Blocks 6.3M - 8.4M: 6.25 EMO/block</li>
                <li>• And so on, until minimum reward of 1 EMO/block</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">Emission Timeline</h3>
              <p className="text-muted-foreground dark:text-gray-400">
                Approximately <strong className="text-foreground dark:text-white">10 years</strong> to distribute all validator rewards,
                with diminishing emissions ensuring long-term sustainability.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Staking Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">Minimum Stake</h3>
              <p className="text-muted-foreground dark:text-gray-400">
                <strong className="text-foreground dark:text-white">{TOKENOMICS.stakingRequirements.minimumStake.toLocaleString()} EMO</strong> required
                to participate as a validator
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">Lock Period</h3>
              <p className="text-muted-foreground dark:text-gray-400">
                Staked tokens are locked for <strong className="text-foreground dark:text-white">30 days</strong> minimum. This prevents
                validators from frequently entering and exiting, ensuring network stability.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">Unstaking Process</h3>
              <ol className="space-y-1 text-sm text-muted-foreground dark:text-gray-400 list-decimal list-inside">
                <li>Request unstaking after lock period expires</li>
                <li>Tokens remain locked during unstaking process</li>
                <li>Withdrawal available after transaction confirmation</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              Vesting Schedules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">Team & Investor Vesting</h3>
              <p className="text-muted-foreground dark:text-gray-400 mb-2">
                Both team and investor allocations follow a 4-year vesting schedule with 1-year cliff:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground dark:text-gray-400">
                <li><strong className="text-foreground dark:text-white">Year 1 (Cliff):</strong> No tokens released</li>
                <li><strong className="text-foreground dark:text-white">Year 2-4:</strong> Linear monthly vesting over remaining 3 years</li>
                <li><strong className="text-foreground dark:text-white">Total Duration:</strong> 4 years until fully vested</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">Rationale</h3>
              <p className="text-muted-foreground dark:text-gray-400">
                Long vesting periods align team and investor incentives with long-term project success,
                preventing early dumps and ensuring sustained commitment to network growth.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
              Anti-Gaming Mechanisms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">Multi-Signal Validation</h3>
              <p className="text-muted-foreground dark:text-gray-400 mb-2">
                Validators cannot game the system by manipulating a single metric. The scoring algorithm uses:
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground dark:text-gray-400">
                <li>• Heart rate (normalized to optimal range)</li>
                <li>• Heart rate variability (HRV)</li>
                <li>• Stress levels (inversely weighted)</li>
                <li>• Coherence (heart-brain synchronization)</li>
                <li>• Cross-correlation detection (identifies fake patterns)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">Device Normalization</h3>
              <p className="text-muted-foreground dark:text-gray-400">
                Different biometric devices have varying accuracy. Scores are normalized based on device type
                to prevent hardware advantages. Medical-grade devices (e.g., Polar H10) serve as the baseline.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">Anomaly Detection</h3>
              <p className="text-muted-foreground dark:text-gray-400">
                The system detects suspiciously perfect correlations between metrics, which indicate artificial
                manipulation rather than genuine biometric data.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              Validator Economics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">Expected Returns</h3>
              <p className="text-muted-foreground dark:text-gray-400 mb-2">
                Assuming 21 active validators, average block participation yields approximately:
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground dark:text-gray-400">
                <li>• <strong className="text-foreground dark:text-white">~137 blocks/day</strong> per validator</li>
                <li>• <strong className="text-foreground dark:text-white">~6,850 EMO/day</strong> at current reward rate</li>
                <li>• <strong className="text-foreground dark:text-white">~205,500 EMO/month</strong> gross rewards</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">Break-Even Analysis</h3>
              <p className="text-muted-foreground dark:text-gray-400">
                Use the ROI calculator to estimate your break-even point based on:
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground dark:text-gray-400">
                <li>• Initial stake amount (10,000 EMO minimum)</li>
                <li>• Biometric device cost ($100-$500)</li>
                <li>• Monthly operating costs (electricity, internet)</li>
                <li>• Current EMO token price</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">Long-Term Sustainability</h3>
              <p className="text-muted-foreground dark:text-gray-400">
                As block rewards decrease through halving, transaction fees will become an increasingly
                important component of validator revenue, ensuring long-term network security.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground dark:text-gray-500 py-8">
          <p>Last updated: November 2025 • Phase 4: Realistic Token Economics</p>
        </div>
      </div>
    </div>
  );
}
