import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Globe, 
  Heart, 
  Server, 
  TrendingUp, 
  Users, 
  Zap,
  RefreshCw
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function MonitoringDashboard() {
  // Get comprehensive dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/monitoring/dashboard-data'],
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Get active alerts
  const { data: alertsData } = useQuery({
    queryKey: ['/api/monitoring/alerts'],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const consensusHealth = dashboardData?.consensusHealth || {};
  const validatorParticipation = dashboardData?.validatorParticipation || {};
  const systemPerformance = dashboardData?.systemPerformance || {};
  const summary = dashboardData?.summary || {};

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Monitoring Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Real-time consensus health, validator participation, and system performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(summary?.overallStatus)}
          <span className={`font-medium ${getStatusColor(summary?.overallStatus)}`}>
            {summary?.overallStatus?.toUpperCase() || 'UNKNOWN'}
          </span>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Validators</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.activeValidators || 0}</div>
            <p className="text-xs text-muted-foreground">
              {validatorParticipation?.totalValidators || 0} total validators
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consensus Success</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.consensusSuccessRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Clock className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.systemUptime || 0}h</div>
            <p className="text-xs text-muted-foreground">
              Current session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.criticalAlerts || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.warningAlerts || 0} warnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Block Height</CardTitle>
            <Database className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consensusHealth?.metrics?.blockHeight || 0}</div>
            <p className="text-xs text-muted-foreground">
              Latest block
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {(alertsData as any)?.alerts && (alertsData as any).alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Active Alerts ({(alertsData as any).summary?.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {((alertsData as any).alerts || []).slice(0, 5).map((alert: any, index: number) => (
                <div key={index} className={`flex items-center gap-3 p-3 rounded-lg border ${
                  alert.level === 'critical' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <AlertTriangle className={`w-4 h-4 ${
                    alert.level === 'critical' ? 'text-red-600' : 'text-yellow-600'
                  }`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      alert.level === 'critical' ? 'text-red-800' : 'text-yellow-800'
                    }`}>
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge variant={alert.level === 'critical' ? 'destructive' : 'secondary'}>
                    {alert.level}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="consensus" className="space-y-4">
        <TabsList>
          <TabsTrigger value="consensus">Consensus Health</TabsTrigger>
          <TabsTrigger value="validators">Validator Participation</TabsTrigger>
          <TabsTrigger value="performance">System Performance</TabsTrigger>
          <TabsTrigger value="blockchain">Blockchain Stats</TabsTrigger>
        </TabsList>

        {/* Consensus Health Tab */}
        <TabsContent value="consensus" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Consensus Metrics</CardTitle>
                <CardDescription>Real-time consensus round performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Success Rate</div>
                    <div className="text-2xl font-bold">
                      {((consensusHealth?.metrics?.consensusSuccessRate || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Participation</div>
                    <div className="text-2xl font-bold">
                      {((consensusHealth?.metrics?.participationRate || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Total Rounds</div>
                    <div className="text-2xl font-bold">{consensusHealth?.metrics?.consensusRounds || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Successful</div>
                    <div className="text-2xl font-bold">{consensusHealth?.metrics?.successfulRounds || 0}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Block Production</CardTitle>
                <CardDescription>Blockchain performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Average Block Time</div>
                    <div className="text-2xl font-bold">
                      {(consensusHealth?.metrics?.averageBlockTime || 0).toFixed(1)}s
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Current Height</div>
                    <div className="text-2xl font-bold">{consensusHealth?.metrics?.blockHeight || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Last Block</div>
                    <div className="text-sm">
                      {consensusHealth?.metrics?.lastBlockTimestamp 
                        ? new Date(consensusHealth.metrics.lastBlockTimestamp).toLocaleTimeString()
                        : 'N/A'
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Validator Participation Tab */}
        <TabsContent value="validators" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Validator Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {validatorParticipation?.validatorDetails && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Active Validators</span>
                        <Badge variant="secondary">
                          {(validatorParticipation as any).validatorDetails?.filter((v: any) => v.status === 'active').length || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Degraded Performance</span>
                        <Badge variant="outline">
                          {(validatorParticipation as any).validatorDetails?.filter((v: any) => v.status === 'degraded').length || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Inactive</span>
                        <Badge variant="destructive">
                          {(validatorParticipation as any).validatorDetails?.filter((v: any) => v.status === 'inactive').length || 0}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {validatorParticipation?.geographicDistribution?.map((region: any) => (
                    <div key={region.region}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{region.region}</span>
                        <span className="text-sm text-muted-foreground">{region.count}</span>
                      </div>
                      <Progress value={region.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Validator Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Validator Performance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {validatorParticipation?.validatorDetails?.slice(0, 10).map((validator: any) => (
                  <div key={validator.validatorId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        validator.status === 'active' ? 'secondary' : 
                        validator.status === 'degraded' ? 'outline' : 'destructive'
                      }>
                        {validator.status}
                      </Badge>
                      <span className="font-mono text-sm">{validator.validatorId}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <div>Participation: {(validator.participationRate * 100).toFixed(1)}%</div>
                        <div className="text-muted-foreground">Uptime: {(validator.uptime * 100).toFixed(1)}%</div>
                      </div>
                      <div className="text-right">
                        <div>Emotional: {validator.emotionalScore.toFixed(1)}</div>
                        <div className="text-muted-foreground">
                          Last: {new Date(validator.lastActivity).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  System Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">CPU Usage</span>
                    <span className="text-sm">{systemPerformance?.cpuUsage?.toFixed(1) || 0}%</span>
                  </div>
                  <Progress value={systemPerformance?.cpuUsage || 0} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Memory Usage</span>
                    <span className="text-sm">{systemPerformance?.memoryUsage?.toFixed(1) || 0}%</span>
                  </div>
                  <Progress value={systemPerformance?.memoryUsage || 0} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Disk Usage</span>
                    <span className="text-sm">{systemPerformance?.diskUsage?.toFixed(1) || 0}%</span>
                  </div>
                  <Progress value={systemPerformance?.diskUsage || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Network Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Latency</div>
                    <div className="text-2xl font-bold">
                      {systemPerformance?.networkLatency?.toFixed(0) || 0}ms
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">API Response</div>
                    <div className="text-2xl font-bold">
                      {systemPerformance?.apiResponseTime?.toFixed(0) || 0}ms
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Database Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Active Connections</div>
                    <div className="text-2xl font-bold">{systemPerformance?.databaseConnections || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Uptime</div>
                    <div className="text-2xl font-bold">
                      {Math.floor((systemPerformance?.uptime || 0) / 3600)}h
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Blockchain Stats Tab */}
        <TabsContent value="blockchain" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Throughput</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((dashboardData as any)?.blockchainStats?.transactionThroughput?.toFixed(1)) || 0} TPS
                </div>
                <p className="text-xs text-muted-foreground">Transactions per second</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Network Hashrate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(((dashboardData as any)?.blockchainStats?.networkHashrate || 0) / 1000).toFixed(1)}K H/s
                </div>
                <p className="text-xs text-muted-foreground">Emotional consensus power</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Block Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.1 MB</div>
                <p className="text-xs text-muted-foreground">Average block size</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}