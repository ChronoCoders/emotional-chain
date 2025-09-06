# AI & Analytics API Documentation

## Overview

The AI & Analytics API provides access to machine learning models, anomaly detection, consensus optimization, and analytical insights for the EmotionalChain network. This API enables AI-driven improvements to consensus quality and validator performance monitoring.

## Base URL

```
/api/ai/
```

## Authentication

AI endpoints may require validator authentication for sensitive operations. Anomaly detection and learning endpoints are generally accessible for monitoring purposes.

## AI Learning System

### Learning Status

#### GET `/api/ai/learning/status`

Returns the current status of the AI learning system including model information and training metrics.

**Response:**
```json
{
  "status": "active",
  "model": {
    "version": "v2.3.1",
    "accuracy": 0.9247,
    "lastTraining": "2025-01-27T12:00:00Z",
    "trainingRounds": 1247,
    "modelSize": "15.2 MB"
  },
  "feedback": {
    "totalEvents": 45230,
    "processedEvents": 44890,
    "pendingEvents": 340,
    "averageFairness": 0.8956
  },
  "scheduler": {
    "active": true,
    "intervalHours": 6,
    "nextRun": "2025-01-27T18:00:00Z",
    "lastRun": "2025-01-27T12:00:00Z"
  },
  "latestMetrics": {
    "accuracy": 0.9247,
    "precision": 0.9156,
    "recall": 0.9334,
    "f1Score": 0.9244,
    "rewardFairnessScore": 0.8956,
    "biasScore": 0.0234,
    "trainingDataSize": 15420,
    "version": "v2.3.1",
    "createdAt": "2025-01-27T12:00:00Z"
  },
  "timestamp": "2025-01-27T15:30:00Z"
}
```

---

### Training Metrics

#### GET `/api/ai/learning/metrics`

Fetches historical training metrics for AI models with pagination and aggregation.

**Query Parameters:**
- `limit`: Number of metrics to return (default: 10, max: 100)
- `offset`: Pagination offset (default: 0)

**Example:**
```
GET /api/ai/learning/metrics?limit=5&offset=0
```

**Response:**
```json
{
  "metrics": [
    {
      "id": "metric_abc123",
      "modelName": "EmotionalConsensusOptimizer",
      "modelType": "consensus_optimizer",
      "accuracy": 0.9247,
      "precision": 0.9156,
      "recall": 0.9334,
      "f1Score": 0.9244,
      "rewardFairnessScore": 0.8956,
      "biasScore": 0.0234,
      "trainingDataSize": 15420,
      "version": "v2.3.1",
      "hyperparameters": {
        "learningRate": 0.001,
        "batchSize": 32,
        "epochs": 100,
        "optimizer": "adam"
      },
      "lastTraining": "2025-01-27T12:00:00Z",
      "isActive": true
    }
  ],
  "summary": {
    "totalModels": 15,
    "averageAccuracy": 0.9156,
    "averageFairness": 0.8892,
    "averageBias": 0.0267
  }
}
```

---

### Feedback Collection

#### GET `/api/ai/learning/feedback`

Retrieves feedback events collected from consensus rounds for model training.

**Query Parameters:**
- `limit`: Number of events to return (default: 50, max: 1000)
- `offset`: Pagination offset (default: 0)
- `processed`: Filter by processed status (`true`, `false`, or `all`)

**Example:**
```
GET /api/ai/learning/feedback?limit=20&processed=false
```

**Response:**
```json
{
  "events": [
    {
      "id": "event_def456",
      "eventType": "consensus_round",
      "validatorId": "GravityCore",
      "consensusRound": 12785,
      "emotionalScore": 89.45,
      "consensusWeight": 1.0,
      "actualPerformance": 0.97,
      "expectedPerformance": 0.94,
      "fairnessScore": 0.92,
      "driftScore": 0.03,
      "metadata": {
        "blockHeight": 12785,
        "timestamp": 1738072200000,
        "participantCount": 21
      },
      "processed": false,
      "createdAt": "2025-01-27T15:30:00Z"
    }
  ],
  "summary": {
    "totalEvents": 340,
    "processedEvents": 0,
    "unprocessedEvents": 340,
    "averageFairness": 0.8956,
    "averageDrift": 0.0245
  }
}
```

#### POST `/api/ai/learning/feedback/batch`

Submits batch feedback data from multiple validators for model training.

**Request Body:**
```json
{
  "feedbackBatch": [
    {
      "validatorId": "GravityCore",
      "consensusRound": 12785,
      "emotionalScore": 89.45,
      "consensusWeight": 1.0,
      "actualPerformance": 0.97,
      "fairnessScore": 0.92
    },
    {
      "validatorId": "StellarNode",
      "consensusRound": 12785,
      "emotionalScore": 87.23,
      "consensusWeight": 0.95,
      "actualPerformance": 0.94,
      "fairnessScore": 0.89
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Batch feedback collected for 2 validators",
  "processedCount": 2,
  "timestamp": "2025-01-27T15:30:00Z"
}
```

---

### Learning Scheduler

#### PUT `/api/ai/learning/scheduler`

Updates the AI learning scheduler configuration.

**Request Body:**
```json
{
  "intervalHours": 8,
  "active": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scheduler updated successfully",
  "status": {
    "active": true,
    "intervalHours": 8,
    "nextRun": "2025-01-27T23:30:00Z",
    "lastRun": "2025-01-27T12:00:00Z"
  }
}
```

---

## Anomaly Detection

### Anomaly Status

#### GET `/api/ai/anomaly/status`

Returns the current status of the AI anomaly detection system.

**Response:**
```json
{
  "status": "operational",
  "model": {
    "version": "v1.8.2",
    "accuracy": 0.9567,
    "lastTraining": "2025-01-27T10:00:00Z",
    "anomaliesDetected24h": 12,
    "falsePositiveRate": 0.0234
  },
  "metrics": {
    "totalValidatorsMonitored": 21,
    "anomaliesDetectedToday": 3,
    "averageConfidence": 0.94,
    "processingLatency": "45ms"
  },
  "timestamp": "2025-01-27T15:30:00Z"
}
```

---

### Consensus Analysis

#### GET `/api/ai/consensus/analysis`

Analyzes the latest consensus round and provides insights into validator adjustments and anomaly reports.

**Response:**
```json
{
  "analysis": {
    "roundId": "round_1738072200000",
    "totalValidators": 21,
    "anomaliesDetected": 1,
    "adjustmentsMade": 2,
    "overallConfidence": 0.94,
    "consensusQuality": "excellent",
    "recommendations": [
      {
        "validatorId": "WeakValidator",
        "issue": "emotional_score_volatility",
        "suggestion": "biometric_device_recalibration",
        "priority": "medium"
      }
    ],
    "validatorAdjustments": [
      {
        "validatorId": "GravityCore",
        "originalWeight": 1.0,
        "adjustedWeight": 1.0,
        "anomalyDetected": false,
        "confidence": 0.97,
        "reason": "normal_performance"
      },
      {
        "validatorId": "WeakValidator",
        "originalWeight": 0.85,
        "adjustedWeight": 0.70,
        "anomalyDetected": true,
        "confidence": 0.89,
        "reason": "emotional_score_volatility"
      }
    ]
  },
  "roundData": {
    "roundId": "round_1738072200000",
    "totalValidators": 21,
    "timestamp": "2025-01-27T15:30:00Z"
  }
}
```

---

### Validator Anomaly History

#### GET `/api/ai/anomaly/validator/:validatorId/history`

Fetches historical anomaly data for a specific validator.

**Example:**
```
GET /api/ai/anomaly/validator/GravityCore/history
```

**Response:**
```json
{
  "validatorId": "GravityCore",
  "anomalyHistory": [
    {
      "timestamp": "2025-01-27T14:15:00Z",
      "anomalyType": "emotional_score_spike",
      "severity": "low",
      "confidence": 0.78,
      "details": {
        "expectedScore": 85,
        "actualScore": 95,
        "deviation": 10
      },
      "resolved": true
    }
  ],
  "totalAnomalies": 1,
  "anomalyRate": 0.02,
  "lastAnomaly": "2025-01-27T14:15:00Z",
  "timestamp": "2025-01-27T15:30:00Z"
}
```

---

### Consensus Adjustments

#### GET `/api/ai/consensus/adjustments`

Retrieves the latest consensus weight adjustments made by the AI system.

**Response:**
```json
{
  "adjustments": [
    {
      "validatorId": "GravityCore",
      "originalWeight": 1.0,
      "adjustedWeight": 1.0,
      "anomalyDetected": false,
      "confidence": 0.97,
      "adjustmentReason": "normal_performance",
      "timestamp": "2025-01-27T15:30:00Z"
    },
    {
      "validatorId": "WeakValidator",
      "originalWeight": 0.85,
      "adjustedWeight": 0.70,
      "anomalyDetected": true,
      "confidence": 0.89,
      "adjustmentReason": "emotional_score_volatility",
      "timestamp": "2025-01-27T15:30:00Z"
    }
  ],
  "summary": {
    "total": 21,
    "anomaliesDetected": 1,
    "criticalAnomalies": 0,
    "averageConfidence": 0.94
  },
  "timestamp": "2025-01-27T15:30:00Z"
}
```

---

### Model Retraining

#### POST `/api/ai/model/retrain`

Triggers an immediate retraining of the AI anomaly detection models.

**Request Body:**
```json
{
  "modelType": "anomaly_detector",
  "trainingData": {
    "includeRecent": true,
    "timeRange": "7d",
    "minimumSamples": 1000
  },
  "hyperparameters": {
    "learningRate": 0.001,
    "epochs": 50
  }
}
```

**Response:**
```json
{
  "status": "retraining_completed",
  "metrics": {
    "accuracy": 0.9567,
    "precision": 0.9445,
    "recall": 0.9689,
    "f1Score": 0.9565,
    "trainingDuration": "4.2 minutes",
    "improvementFromPrevious": 0.0123
  },
  "modelInfo": {
    "version": "v1.8.3",
    "trainingDataSize": 8945,
    "validationDataSize": 2236,
    "testDataSize": 1118
  },
  "timestamp": "2025-01-27T15:30:00Z"
}
```

---

## Advanced Analytics

### Network Intelligence

#### GET `/api/ai/network/intelligence`

Provides advanced network intelligence and predictive analytics.

**Response:**
```json
{
  "networkHealth": {
    "overall": 94.5,
    "consensus": 96.8,
    "performance": 92.1,
    "security": 98.2
  },
  "predictions": {
    "nextHourThroughput": 12.8,
    "consensusQualityTrend": "improving",
    "potentialAnomalies": 1,
    "networkLoad": "optimal"
  },
  "insights": [
    {
      "type": "performance",
      "message": "Network consensus quality has improved by 3.2% over the last 24 hours",
      "impact": "positive",
      "confidence": 0.89
    },
    {
      "type": "security",
      "message": "Biometric authentication success rate is at an all-time high of 98.7%",
      "impact": "positive",
      "confidence": 0.95
    }
  ],
  "recommendations": [
    {
      "category": "optimization",
      "message": "Consider increasing validator emotional score thresholds during peak hours",
      "priority": "low",
      "estimatedImpact": "+1.5% consensus quality"
    }
  ],
  "timestamp": "2025-01-27T15:30:00Z"
}
```

---

### Validator Performance Analytics

#### GET `/api/ai/validator/:validatorId/analytics`

Provides detailed AI-driven analytics for a specific validator.

**Example:**
```
GET /api/ai/validator/GravityCore/analytics
```

**Response:**
```json
{
  "validatorId": "GravityCore",
  "performanceScore": 94.7,
  "analytics": {
    "emotionalStability": {
      "score": 96.2,
      "trend": "stable",
      "variance": 0.045
    },
    "consensusParticipation": {
      "rate": 99.1,
      "quality": 97.8,
      "reliability": 98.9
    },
    "biometricAuthenticity": {
      "averageScore": 95.8,
      "consistencyRating": "excellent",
      "spoofingAttempts": 0
    }
  },
  "predictions": {
    "nextWeekPerformance": 95.2,
    "emotionalScoreTrend": "slightly_improving",
    "recommendedActions": [
      "maintain_current_routine",
      "consider_stress_reduction_techniques"
    ]
  },
  "comparisons": {
    "networkAverage": 87.3,
    "topPercentile": 96.8,
    "ranking": 3
  },
  "timestamp": "2025-01-27T15:30:00Z"
}
```

---

## Model Management

### Available Models

#### GET `/api/ai/models`

Lists all available AI models and their current status.

**Response:**
```json
{
  "models": [
    {
      "id": "emotional_predictor_v2_3_1",
      "name": "Emotional Score Predictor",
      "type": "emotional_predictor",
      "version": "v2.3.1",
      "status": "active",
      "accuracy": 0.9247,
      "lastTraining": "2025-01-27T12:00:00Z",
      "inputFeatures": [
        "heart_rate",
        "stress_level",
        "focus_level",
        "biometric_quality"
      ],
      "outputType": "emotional_score"
    },
    {
      "id": "anomaly_detector_v1_8_2",
      "name": "Validator Anomaly Detector",
      "type": "anomaly_detector",
      "version": "v1.8.2",
      "status": "active",
      "accuracy": 0.9567,
      "lastTraining": "2025-01-27T10:00:00Z",
      "inputFeatures": [
        "validator_performance",
        "emotional_patterns",
        "consensus_participation"
      ],
      "outputType": "anomaly_probability"
    },
    {
      "id": "consensus_optimizer_v3_1_0",
      "name": "Consensus Quality Optimizer",
      "type": "consensus_optimizer",
      "version": "v3.1.0",
      "status": "active",
      "accuracy": 0.9156,
      "lastTraining": "2025-01-27T08:00:00Z",
      "inputFeatures": [
        "network_conditions",
        "validator_states",
        "historical_performance"
      ],
      "outputType": "optimization_weights"
    }
  ],
  "totalModels": 3,
  "activeModels": 3,
  "timestamp": "2025-01-27T15:30:00Z"
}
```

---

### Model Information

#### GET `/api/ai/models/:modelId`

Retrieves detailed information about a specific AI model.

**Example:**
```
GET /api/ai/models/emotional_predictor_v2_3_1
```

**Response:**
```json
{
  "id": "emotional_predictor_v2_3_1",
  "name": "Emotional Score Predictor",
  "type": "emotional_predictor",
  "version": "v2.3.1",
  "status": "active",
  "accuracy": 0.9247,
  "precision": 0.9156,
  "recall": 0.9334,
  "f1Score": 0.9244,
  "trainingMetrics": {
    "trainingDataSize": 15420,
    "validationDataSize": 3855,
    "testDataSize": 1928,
    "trainingDuration": "12.4 minutes",
    "convergenceEpoch": 87
  },
  "hyperparameters": {
    "learningRate": 0.001,
    "batchSize": 32,
    "epochs": 100,
    "optimizer": "adam",
    "regularization": 0.01
  },
  "inputFeatures": [
    {
      "name": "heart_rate",
      "type": "numeric",
      "range": [40, 200],
      "importance": 0.32
    },
    {
      "name": "stress_level", 
      "type": "numeric",
      "range": [0, 100],
      "importance": 0.28
    },
    {
      "name": "focus_level",
      "type": "numeric", 
      "range": [0, 100],
      "importance": 0.25
    },
    {
      "name": "biometric_quality",
      "type": "numeric",
      "range": [0, 100],
      "importance": 0.15
    }
  ],
  "outputType": "emotional_score",
  "outputRange": [0, 100],
  "deploymentInfo": {
    "deployedAt": "2025-01-27T12:05:00Z",
    "modelSize": "15.2 MB",
    "inferenceLatency": "3.2ms",
    "memoryUsage": "245 MB"
  },
  "lastTraining": "2025-01-27T12:00:00Z",
  "nextScheduledTraining": "2025-01-27T18:00:00Z",
  "timestamp": "2025-01-27T15:30:00Z"
}
```

---

## Error Handling

**Common Error Codes:**
- `MODEL_NOT_FOUND`: Specified AI model does not exist
- `TRAINING_IN_PROGRESS`: Model is currently being retrained
- `INSUFFICIENT_DATA`: Not enough training data for operation
- `INVALID_PARAMETERS`: Request parameters are invalid for model
- `ANOMALY_DETECTION_FAILED`: Anomaly detection service unavailable
- `FEEDBACK_VALIDATION_ERROR`: Feedback data validation failed

**Error Response Format:**
```json
{
  "error": "MODEL_NOT_FOUND",
  "message": "AI model 'emotional_predictor_v999' not found",
  "code": 404,
  "details": {
    "modelId": "emotional_predictor_v999",
    "availableModels": ["emotional_predictor_v2_3_1", "anomaly_detector_v1_8_2"]
  },
  "timestamp": "2025-01-27T15:30:00Z"
}
```