import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Coins, TrendingUp, Clock, Calculator, DollarSign } from 'lucide-react';
import { TOKENOMICS, emissionSchedule } from '@shared/tokenomics/emissionSchedule';

export default function TokenomicsPage() {
  const [stakedAmount, setStakedAmount] = useState(10000);
  const [deviceCost, setDeviceCost] = useState(200);
  const [monthlyCost, setMonthlyCost] = useState(50);
  const [tokenPrice, setTokenPrice] = useState(0.10);
  const [blockHeight, setBlockHeight] = useState(0);

  const roi = emissionSchedule.calculateValidatorROI(
    blockHeight,
    stakedAmount,
    deviceCost,
    monthlyCost,
    tokenPrice,
    21 // Number of validators
  );

  const currentBlockReward = emissionSchedule.calculateBlockReward(blockHeight);
  const totalSupplyAtBlock = emissionSchedule.calculateTotalSupply(blockHeight);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
  };

  const formatEMO = (value: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value) + ' EMO';
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950 text-foreground dark:text-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Coins className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            EmotionalChain Tokenomics
          </h1>
          <p className="text-muted-foreground dark:text-gray-400">
            Realistic token economics with halving mechanism and validator ROI calculator
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                Total Supply
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground dark:text-white">
                {formatEMO(TOKENOMICS.totalSupply)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                Validator Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatEMO(TOKENOMICS.distribution.validatorRewards)}
              </p>
              <p className="text-xs text-muted-foreground dark:text-gray-500">50% over 10 years</p>
            </CardContent>
          </Card>

          <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                Minimum Stake
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatEMO(TOKENOMICS.stakingRequirements.minimumStake)}
              </p>
              <p className="text-xs text-muted-foreground dark:text-gray-500">30-day lock period</p>
            </CardContent>
          </Card>

          <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                Block Reward
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatEMO(currentBlockReward)}
              </p>
              <p className="text-xs text-muted-foreground dark:text-gray-500">Halves every ~2 years</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Validator ROI Calculator
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Calculate your potential returns as a validator
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="stakedAmount" className="text-foreground dark:text-gray-300">
                  Staked Amount (EMO)
                </Label>
                <Input
                  id="stakedAmount"
                  type="number"
                  value={stakedAmount}
                  onChange={(e) => setStakedAmount(Number(e.target.value))}
                  min={TOKENOMICS.stakingRequirements.minimumStake}
                  className="mt-1 bg-background dark:bg-gray-800 border-border dark:border-gray-700 text-foreground dark:text-white"
                  data-testid="input-staked-amount"
                />
              </div>

              <div>
                <Label htmlFor="deviceCost" className="text-foreground dark:text-gray-300">
                  Device Cost (USD)
                </Label>
                <Input
                  id="deviceCost"
                  type="number"
                  value={deviceCost}
                  onChange={(e) => setDeviceCost(Number(e.target.value))}
                  min={0}
                  className="mt-1 bg-background dark:bg-gray-800 border-border dark:border-gray-700 text-foreground dark:text-white"
                  data-testid="input-device-cost"
                />
              </div>

              <div>
                <Label htmlFor="monthlyCost" className="text-foreground dark:text-gray-300">
                  Monthly Operating Cost (USD)
                </Label>
                <Input
                  id="monthlyCost"
                  type="number"
                  value={monthlyCost}
                  onChange={(e) => setMonthlyCost(Number(e.target.value))}
                  min={0}
                  className="mt-1 bg-background dark:bg-gray-800 border-border dark:border-gray-700 text-foreground dark:text-white"
                  data-testid="input-monthly-cost"
                />
              </div>

              <div>
                <Label htmlFor="tokenPrice" className="text-foreground dark:text-gray-300">
                  Token Price (USD)
                </Label>
                <Input
                  id="tokenPrice"
                  type="number"
                  value={tokenPrice}
                  onChange={(e) => setTokenPrice(Number(e.target.value))}
                  step={0.01}
                  min={0}
                  className="mt-1 bg-background dark:bg-gray-800 border-border dark:border-gray-700 text-foreground dark:text-white"
                  data-testid="input-token-price"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                ROI Projections
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Based on 21 active validators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                    Daily Reward
                  </span>
                  <span className="text-lg font-bold text-foreground dark:text-white" data-testid="text-daily-reward">
                    {formatEMO(roi.dailyReward)}
                  </span>
                </div>
                <div className="text-right text-sm text-muted-foreground dark:text-gray-500">
                  {formatCurrency(roi.dailyReward * tokenPrice)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                    Monthly Reward
                  </span>
                  <span className="text-lg font-bold text-foreground dark:text-white" data-testid="text-monthly-reward">
                    {formatEMO(roi.monthlyReward)}
                  </span>
                </div>
                <div className="text-right text-sm text-muted-foreground dark:text-gray-500">
                  {formatCurrency(roi.monthlyReward * tokenPrice)}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground dark:text-gray-400 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Break-Even
                  </span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400" data-testid="text-breakeven-months">
                    {isFinite(roi.breakEvenMonths) ? `${formatNumber(roi.breakEvenMonths)} months` : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground dark:text-gray-400 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Annual ROI
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      roi.annualROI >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}
                    data-testid="text-annual-roi"
                  >
                    {isFinite(roi.annualROI) ? `${formatNumber(roi.annualROI)}%` : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
          <CardHeader>
            <CardTitle>Emission Schedule & Halving</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Block rewards halve every 2.1M blocks (~2 years at 30s blocks)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="blockHeight" className="text-foreground dark:text-gray-300">
                Block Height
              </Label>
              <Input
                id="blockHeight"
                type="number"
                value={blockHeight}
                onChange={(e) => setBlockHeight(Number(e.target.value))}
                min={0}
                className="mt-1 max-w-xs bg-background dark:bg-gray-800 border-border dark:border-gray-700 text-foreground dark:text-white"
                data-testid="input-block-height"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground dark:text-gray-400 mb-1">Current Block Reward</p>
                <p className="text-2xl font-bold text-foreground dark:text-white" data-testid="text-current-block-reward">
                  {formatEMO(currentBlockReward)}
                </p>
              </div>

              <div className="bg-muted dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground dark:text-gray-400 mb-1">Total Minted</p>
                <p className="text-2xl font-bold text-foreground dark:text-white" data-testid="text-total-minted">
                  {formatEMO(totalSupplyAtBlock)}
                </p>
              </div>

              <div className="bg-muted dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground dark:text-gray-400 mb-1">Halving Progress</p>
                <p className="text-2xl font-bold text-foreground dark:text-white">
                  {formatNumber((blockHeight % TOKENOMICS.blockReward.halvingInterval) / TOKENOMICS.blockReward.halvingInterval * 100)}%
                </p>
                <p className="text-xs text-muted-foreground dark:text-gray-500 mt-1">
                  {formatNumber(TOKENOMICS.blockReward.halvingInterval - (blockHeight % TOKENOMICS.blockReward.halvingInterval))} blocks until halving
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
          <CardHeader>
            <CardTitle>Token Distribution</CardTitle>
            <CardDescription className="dark:text-gray-400">
              100M EMO total supply allocation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-foreground dark:text-gray-300">Validator Rewards (10 years)</span>
                <span className="font-bold text-foreground dark:text-white">
                  {formatEMO(TOKENOMICS.distribution.validatorRewards)} <span className="text-muted-foreground dark:text-gray-500">(50%)</span>
                </span>
              </div>
              <div className="w-full bg-muted dark:bg-gray-800 rounded-full h-2">
                <div className="bg-green-600 dark:bg-green-500 h-2 rounded-full" style={{ width: '50%' }} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-foreground dark:text-gray-300">Ecosystem Fund</span>
                <span className="font-bold text-foreground dark:text-white">
                  {formatEMO(TOKENOMICS.distribution.ecosystem)} <span className="text-muted-foreground dark:text-gray-500">(30%)</span>
                </span>
              </div>
              <div className="w-full bg-muted dark:bg-gray-800 rounded-full h-2">
                <div className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full" style={{ width: '30%' }} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-foreground dark:text-gray-300">Team (4-year vesting)</span>
                <span className="font-bold text-foreground dark:text-white">
                  {formatEMO(TOKENOMICS.distribution.team)} <span className="text-muted-foreground dark:text-gray-500">(15%)</span>
                </span>
              </div>
              <div className="w-full bg-muted dark:bg-gray-800 rounded-full h-2">
                <div className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full" style={{ width: '15%' }} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-foreground dark:text-gray-300">Investors (4-year vesting)</span>
                <span className="font-bold text-foreground dark:text-white">
                  {formatEMO(TOKENOMICS.distribution.investors)} <span className="text-muted-foreground dark:text-gray-500">(5%)</span>
                </span>
              </div>
              <div className="w-full bg-muted dark:bg-gray-800 rounded-full h-2">
                <div className="bg-orange-600 dark:bg-orange-500 h-2 rounded-full" style={{ width: '5%' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
