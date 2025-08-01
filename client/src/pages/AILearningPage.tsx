import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, Target, RefreshCw, Database, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function AILearningPage() {
  const queryClient = useQueryClient();

  // Get AI learning system status
  const { data: learningStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/ai/learning/status'],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Get training metrics
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/ai/learning/metrics'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Get feedback data
  const { data: feedbackData, isLoading: feedbackLoading } = useQuery({
    queryKey: ['/api/ai/learning/feedback'],
    refetchInterval: 15000 // Refresh every 15 seconds
  });

  // Trigger retraining mutation
  const retrainMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai/learning/retrain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true })
      });
      if (!response.ok) throw new Error('Retraining failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/learning/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/learning/metrics'] });
    }
  });

  if (statusLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Learning & Feedback Loop</h1>
          <p className="text-muted-foreground mt-2">
            Self-improving anomaly detection with adaptive learning capabilities
          </p>
        </div>
        <Button 
          onClick={() => retrainMutation.mutate()}
          disabled={retrainMutation.isPending}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${retrainMutation.isPending ? 'animate-spin' : ''}`} />
          {retrainMutation.isPending ? 'Retraining...' : 'Trigger Retraining'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* System Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Status</CardTitle>
            <Brain className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {learningStatus?.status === 'active' ? 'Active' : 'Inactive'}
            </div>
            <p className="text-xs text-muted-foreground">
              Model v{learningStatus?.model?.version || '1.0.0'}
            </p>
          </CardContent>
        </Card>

        {/* Training Round */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Round</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {learningStatus?.model?.trainingRound || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Current iteration
            </p>
          </CardContent>
        </Card>

        {/* Model Accuracy */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model Accuracy</CardTitle>
            <Target className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {learningStatus?.latestMetrics ? 
                `${(learningStatus.latestMetrics.accuracy * 100).toFixed(1)}%` : 
                'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Latest training result
            </p>
          </CardContent>
        </Card>

        {/* Feedback Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedback Events</CardTitle>
            <Database className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {learningStatus?.feedback?.unprocessedEvents || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Unprocessed training data
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Learning Metrics Overview */}
      {metricsData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Learning Performance Metrics
            </CardTitle>
            <CardDescription>
              Historical performance and improvement tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Accuracy</span>
                  <Badge variant="outline">
                    {(metricsData.summary.averageAccuracy * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Reward Fairness</span>
                  <Badge variant="outline">
                    {(metricsData.summary.averageFairness * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Bias Score</span>
                  <Badge variant={metricsData.summary.averageBias > 0.3 ? 'destructive' : 'secondary'}>
                    {metricsData.summary.averageBias.toFixed(3)}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Models</span>
                  <Badge variant="outline">
                    {metricsData.summary.totalModels}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback Data Overview */}
      {feedbackData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Feedback Collection Status
            </CardTitle>
            <CardDescription>
              Continuous learning from consensus round outcomes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Events</span>
                  <Badge variant="outline">
                    {feedbackData.summary.totalEvents}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Processed</span>
                  <Badge variant="secondary">
                    {feedbackData.summary.processedEvents}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pending</span>
                  <Badge variant={feedbackData.summary.unprocessedEvents > 100 ? 'destructive' : 'outline'}>
                    {feedbackData.summary.unprocessedEvents}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Avg Fairness</span>
                  <Badge variant="outline">
                    {(feedbackData.summary.averageFairness * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>

            {feedbackData.summary.unprocessedEvents >= 100 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <AlertTriangle className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Ready for retraining: {feedbackData.summary.unprocessedEvents} feedback events collected
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Training Metrics */}
      {metricsData?.metrics && metricsData.metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Training History</CardTitle>
            <CardDescription>
              Latest model training sessions and performance improvements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metricsData.metrics.slice(0, 5).map((metric: any, index: number) => (
                <div key={metric.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">v{metric.modelVersion}</Badge>
                    <span className="text-sm font-medium">Round {metric.trainingRound}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        Accuracy: {(metric.accuracy * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {metric.epochs} epochs, {metric.trainingDataSize} samples
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        Fairness: {(metric.rewardFairnessScore * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Bias: {metric.biasScore.toFixed(3)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}