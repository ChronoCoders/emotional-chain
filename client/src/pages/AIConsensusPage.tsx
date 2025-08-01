import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Brain, CheckCircle, Clock, TrendingUp, Zap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface AIMetrics {
  status: string;
  model: {
    isInitialized: boolean;
    trainingDataSize: number;
    threshold: number;
  };
  metrics: {
    modelStatus: any;
    recentAdjustments: number;
    anomalyRate: number;
  };
  timestamp: string;
}

interface ConsensusAnalysis {
  analysis: {
    adjustedValidators: Array<{
      validatorId: string;
      originalWeight: number;
      adjustedWeight: number;
      anomalyDetected: boolean;
      anomalyType: string;
      confidence: number;
      recommendation: string;
    }>;
    roundMetrics: {
      totalValidators: number;
      anomaliesDetected: number;
      criticalAnomalies: number;
      averageConfidence: number;
      recommendedAction: string;
    };
  };
  roundData: {
    roundId: string;
    totalValidators: number;
    timestamp: string;
  };
}

export default function AIConsensusPage() {
  const queryClient = useQueryClient();

  // Fetch AI status
  const { data: aiMetrics, isLoading: metricsLoading } = useQuery<AIMetrics>({
    queryKey: ['/api/ai/status'],
    refetchInterval: 5000,
  });

  // Fetch consensus analysis
  const { data: analysisData, isLoading: analysisLoading } = useQuery<ConsensusAnalysis>({
    queryKey: ['/api/ai/consensus/analysis'],
    refetchInterval: 10000,
  });

  // Retrain model mutation
  const retrainMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/ai/model/retrain', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to retrain model');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/status'] });
    },
  });

  const getSeverityColor = (confidence: number) => {
    if (confidence >= 0.9) return 'destructive';
    if (confidence >= 0.8) return 'destructive';
    if (confidence >= 0.7) return 'default';
    return 'secondary';
  };

  const getAnomalyTypeIcon = (type: string) => {
    switch (type) {
      case 'emotional_spike':
        return <TrendingUp className="h-4 w-4" />;
      case 'consensus_drift':
        return <AlertTriangle className="h-4 w-4" />;
      case 'authenticity_drop':
        return <AlertTriangle className="h-4 w-4" />;
      case 'pattern_break':
        return <Zap className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">AI Consensus Anomaly Detection</h1>
          <p className="text-muted-foreground">
            Advanced TensorFlow.js model for detecting emotional pattern anomalies in consensus validation
          </p>
        </div>
        <Button
          onClick={() => retrainMutation.mutate()}
          disabled={retrainMutation.isPending}
          variant="outline"
        >
          <Brain className="h-4 w-4 mr-2" />
          {retrainMutation.isPending ? 'Retraining...' : 'Retrain Model'}
        </Button>
      </div>

      <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Model Status</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {aiMetrics?.model.isInitialized ? 'Active' : 'Initializing'}
                </div>
                <p className="text-xs text-muted-foreground">
                  TensorFlow.js anomaly detection
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Training Data</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {aiMetrics?.model.trainingDataSize || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Emotional patterns collected
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Anomaly Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((aiMetrics?.metrics.anomalyRate || 0) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Recent consensus rounds
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Detection Threshold</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((aiMetrics?.model.threshold || 0) * 100).toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Anomaly confidence threshold
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Live Analysis Section */}
          {analysisData && (
            <Card>
              <CardHeader>
                <CardTitle>Latest Consensus Round Analysis</CardTitle>
                <CardDescription>
                  Round {analysisData.roundData.roundId} - {analysisData.roundData.totalValidators} validators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Anomalies Detected</span>
                      <Badge variant={analysisData.analysis.roundMetrics.anomaliesDetected > 0 ? 'destructive' : 'secondary'}>
                        {analysisData.analysis.roundMetrics.anomaliesDetected}/{analysisData.analysis.roundMetrics.totalValidators}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{width: `${(analysisData.analysis.roundMetrics.anomaliesDetected / analysisData.analysis.roundMetrics.totalValidators) * 100}%`}}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Critical Anomalies</span>
                      <Badge variant={analysisData.analysis.roundMetrics.criticalAnomalies > 0 ? 'destructive' : 'secondary'}>
                        {analysisData.analysis.roundMetrics.criticalAnomalies}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{width: `${(analysisData.analysis.roundMetrics.criticalAnomalies / analysisData.analysis.roundMetrics.totalValidators) * 100}%`}}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Avg Confidence</span>
                      <Badge variant="outline">
                        {(analysisData.analysis.roundMetrics.averageConfidence * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{width: `${analysisData.analysis.roundMetrics.averageConfidence * 100}%`}}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Recommended Action:</span>
                  </div>
                  <p className="mt-1 text-sm">{analysisData.analysis.roundMetrics.recommendedAction}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Validator Adjustments Section */}
          {analysisData && (
            <Card>
              <CardHeader>
                <CardTitle>Validator Weight Adjustments</CardTitle>
                <CardDescription>
                  AI-based consensus weight modifications for anomaly mitigation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisData.analysis.adjustedValidators.map((validator) => (
                    <div
                      key={validator.validatorId}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        {getAnomalyTypeIcon(validator.anomalyType)}
                        <div>
                          <div className="font-medium">{validator.validatorId}</div>
                          <div className="text-sm text-muted-foreground">
                            {validator.anomalyType.replace('_', ' ')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {validator.anomalyDetected && (
                          <Badge variant={getSeverityColor(validator.confidence)}>
                            {(validator.confidence * 100).toFixed(1)}% confidence
                          </Badge>
                        )}
                        
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            Weight: {validator.originalWeight.toFixed(3)} → {validator.adjustedWeight.toFixed(3)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {validator.adjustedWeight < validator.originalWeight ? 
                              `${(((validator.originalWeight - validator.adjustedWeight) / validator.originalWeight) * 100).toFixed(0)}% reduction` : 
                              'No change'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Model Status Section */}
          <Card>
            <CardHeader>
              <CardTitle>TensorFlow.js Model Configuration</CardTitle>
              <CardDescription>
                Neural network architecture and training parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium">Model Architecture</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Input Features:</span>
                      <span>6 (emotional, consensus, authenticity, deviation, time, variance)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hidden Layers:</span>
                      <span>32 → 16 → 8 neurons</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Output:</span>
                      <span>1 (anomaly probability)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Activation:</span>
                      <span>ReLU → Sigmoid</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Training Parameters</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Learning Rate:</span>
                      <span>0.001</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Batch Size:</span>
                      <span>32</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Epochs:</span>
                      <span>10</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Validation Split:</span>
                      <span>20%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-muted">
                <h4 className="font-medium mb-2">Model Status</h4>
                <div className="flex items-center gap-2">
                  {aiMetrics?.model.isInitialized ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Model initialized and ready for inference</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Model initializing...</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}