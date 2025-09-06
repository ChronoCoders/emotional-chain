# Biometric API Documentation

## Overview

The Biometric API manages biometric device connections, data collection, and emotional authentication for the EmotionalChain network. This API enables real-time monitoring of heart rate, stress levels, focus metrics, and authenticity verification for Proof of Emotion consensus.

## Base URL

```
/api/biometric/
```

## Authentication

Biometric operations require validator authentication. Some endpoints are restricted to device owners.

## Device Management

### Device Scanning

#### GET `/api/biometric/devices/scan`

Scans for available biometric devices across multiple connection types (Bluetooth LE, USB, WebRTC).

**Response:**
```json
{
  "success": true,
  "devices": [
    {
      "deviceId": "bt_polar_h10_abc123",
      "name": "Polar H10 Heart Rate Monitor",
      "type": "heartRate",
      "connectionType": "bluetooth",
      "manufacturer": "Polar",
      "model": "H10",
      "rssi": -45,
      "batteryLevel": 78,
      "status": "available",
      "capabilities": ["heartRate", "rrInterval"],
      "firmwareVersion": "3.0.35"
    },
    {
      "deviceId": "usb_empatica_e4",
      "name": "Empatica E4 Wristband",
      "type": "multi_sensor",
      "connectionType": "usb",
      "manufacturer": "Empatica",
      "model": "E4",
      "status": "available",
      "capabilities": ["heartRate", "stress", "temperature", "motion"],
      "firmwareVersion": "2.1.4"
    }
  ],
  "scanDuration": 5000,
  "timestamp": "2025-01-27T15:30:00Z"
}
```

**Device Types:**
- `heartRate`: Heart rate monitors
- `stress`: Stress/HRV sensors
- `focus`: EEG/brain activity monitors
- `multi_sensor`: Combined biometric devices

**Connection Types:**
- `bluetooth`: Bluetooth LE devices
- `usb`: USB-connected devices
- `webrtc`: Browser-based biometric streaming

---

### Device Connection

#### POST `/api/biometric/devices/connect`

Connects to a specific biometric device for data collection.

**Request Body:**
```json
{
  "deviceId": "bt_polar_h10_abc123",
  "validatorId": "GravityCore",
  "connectionSettings": {
    "sampleRate": 1000,
    "dataFormat": "raw",
    "enableEncryption": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "deviceId": "bt_polar_h10_abc123",
  "connectionId": "conn_xyz789",
  "status": "connected",
  "validatorId": "GravityCore",
  "capabilities": ["heartRate", "rrInterval"],
  "streamingActive": true,
  "dataQuality": {
    "signalStrength": 95,
    "signalQuality": "excellent",
    "noiseLevel": 2
  },
  "timestamp": "2025-01-27T15:30:00Z"
}
```

---

#### POST `/api/biometric/devices/disconnect`

Disconnects a biometric device.

**Request Body:**
```json
{
  "deviceId": "bt_polar_h10_abc123",
  "validatorId": "GravityCore"
}
```

**Response:**
```json
{
  "success": true,
  "deviceId": "bt_polar_h10_abc123",
  "status": "disconnected",
  "totalDataCollected": 150420,
  "sessionDuration": 3600,
  "timestamp": "2025-01-27T15:30:00Z"
}
```

---

### Device Status

#### GET `/api/biometric/devices/status`

Returns the connection status for all connected biometric devices.

**Response:**
```json
{
  "connectedDevices": [
    {
      "deviceId": "bt_polar_h10_abc123",
      "validatorId": "GravityCore",
      "type": "heartRate",
      "status": "connected",
      "signalQuality": 95,
      "batteryLevel": 76,
      "lastReading": "2025-01-27T15:29:45Z",
      "dataRate": "1 Hz",
      "uptime": 3540
    }
  ],
  "totalDevices": 1,
  "activeStreams": 1,
  "timestamp": "2025-01-27T15:30:00Z"
}
```

---

## Data Collection

### Real-Time Readings

#### GET `/api/biometric/devices/:deviceId/reading`

Fetches the latest biometric reading from a specific device.

**Example:**
```
GET /api/biometric/devices/bt_polar_h10_abc123/reading
```

**Response:**
```json
{
  "deviceId": "bt_polar_h10_abc123",
  "validatorId": "GravityCore",
  "reading": {
    "heartRate": 72,
    "rrInterval": [856, 842, 868, 851],
    "timestamp": "2025-01-27T15:29:58Z",
    "quality": 98,
    "confidence": 97
  },
  "processed": {
    "stressLevel": 15,
    "focusLevel": 88,
    "emotionalScore": 89.2,
    "authenticity": 96
  },
  "metadata": {
    "sensorPosition": "chest",
    "motionLevel": "low",
    "environmentalNoise": 12
  }
}
```

---

### Historical Data

#### GET `/api/biometric/:validatorId`

Returns historical biometric data for a validator.

**Query Parameters:**
- `startTime`: Start timestamp (ISO 8601)
- `endTime`: End timestamp (ISO 8601)  
- `limit`: Maximum records to return (default: 100)
- `aggregation`: Data aggregation level (`raw`, `minute`, `hour`)

**Example:**
```
GET /api/biometric/GravityCore?startTime=2025-01-27T14:00:00Z&endTime=2025-01-27T15:00:00Z&aggregation=minute
```

**Response:**
```json
{
  "validatorId": "GravityCore",
  "timeRange": {
    "start": "2025-01-27T14:00:00Z",
    "end": "2025-01-27T15:00:00Z"
  },
  "aggregation": "minute",
  "data": [
    {
      "timestamp": "2025-01-27T14:00:00Z",
      "heartRate": {
        "avg": 74,
        "min": 70,
        "max": 78,
        "samples": 60
      },
      "stressLevel": {
        "avg": 18,
        "min": 12,
        "max": 25
      },
      "focusLevel": {
        "avg": 85,
        "min": 80,
        "max": 92
      },
      "emotionalScore": 87.5,
      "dataQuality": 96
    }
  ],
  "summary": {
    "totalSamples": 3600,
    "avgEmotionalScore": 87.8,
    "dataCompleteness": 99.2,
    "qualityScore": 96.5
  }
}
```

---

## Authentication & Verification

### Biometric Proof Submission

#### POST `/api/biometric/submit-proof`

Submits biometric proof for emotional authentication (used in smart contracts).

**Request Body:**
```json
{
  "validatorId": "GravityCore",
  "biometricData": {
    "heartRate": 72,
    "stressLevel": 15,
    "focusLevel": 88,
    "authenticity": 96
  },
  "deviceProofs": [
    {
      "deviceId": "bt_polar_h10_abc123",
      "signature": "0x1234567890abcdef...",
      "timestamp": "2025-01-27T15:29:58Z"
    }
  ],
  "zkProof": {
    "commitment": "0xaabbccddeeff...",
    "nullifier": "0x1122334455...",
    "proof": "0x9988776655..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "validatorId": "GravityCore",
  "emotionalScore": 89.2,
  "proofHash": "0xdef456789abc...",
  "validUntil": "2025-01-27T16:29:58Z",
  "consensus": {
    "eligible": true,
    "weight": 1.0,
    "threshold": 75
  },
  "timestamp": "2025-01-27T15:30:00Z"
}
```

---

### Anti-Spoofing Verification

#### POST `/api/biometric/anti-spoofing`

Submits biometric data for anti-spoofing analysis using machine learning models.

**Request Body:**
```json
{
  "validatorId": "GravityCore",
  "deviceId": "bt_polar_h10_abc123",
  "rawData": {
    "heartRate": [72, 73, 71, 74, 72],
    "rrInterval": [856, 842, 868, 851, 863],
    "timestamp": "2025-01-27T15:29:58Z"
  },
  "environmentalContext": {
    "temperature": 22.5,
    "humidity": 45,
    "lightLevel": 320,
    "motionDetected": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "validatorId": "GravityCore",
  "authenticity": {
    "score": 96,
    "confidence": 98,
    "riskLevel": "low"
  },
  "analysis": {
    "biometricVariability": "normal",
    "temporalConsistency": "high",
    "deviceFingerprint": "verified",
    "environmentalMatch": "consistent"
  },
  "flags": [],
  "recommendation": "accept",
  "timestamp": "2025-01-27T15:30:00Z"
}
```

---

### Liveness Detection

#### POST `/api/biometric/liveness`

Performs liveness detection to ensure biometric data comes from a live human.

**Request Body:**
```json
{
  "validatorId": "GravityCore",
  "deviceId": "bt_polar_h10_abc123",
  "challenge": {
    "type": "breathingPattern",
    "sequence": [3, 5, 3, 5, 3],
    "duration": 30
  },
  "response": {
    "heartRateVariation": [72, 75, 73, 76, 74],
    "breathingDetected": true,
    "synchronization": 0.92
  }
}
```

**Response:**
```json
{
  "success": true,
  "validatorId": "GravityCore",
  "liveness": {
    "verified": true,
    "confidence": 94,
    "challengeResponse": "valid"
  },
  "metrics": {
    "responseTime": 28.5,
    "synchronization": 0.92,
    "naturalVariability": "present"
  },
  "timestamp": "2025-01-27T15:30:00Z"
}
```

---

## Device Registry

### Register New Device

#### POST `/api/biometric/devices/register`

Registers a new biometric device with the network.

**Request Body:**
```json
{
  "deviceId": "bt_polar_h10_abc123",
  "validatorId": "GravityCore",
  "deviceInfo": {
    "type": "heartRate",
    "manufacturer": "Polar",
    "model": "H10",
    "firmwareVersion": "3.0.35",
    "serialNumber": "ABC123XYZ789"
  },
  "calibrationData": {
    "baselineHeartRate": 65,
    "maxHeartRate": 185,
    "restingVariability": 45
  },
  "certificates": {
    "deviceCertificate": "0x1234567890abcdef...",
    "manufacturerSignature": "0xfedcba0987654321..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "deviceId": "bt_polar_h10_abc123",
  "registrationId": "reg_abc123def456",
  "validatorId": "GravityCore",
  "status": "registered",
  "verificationLevel": "certified",
  "expiresAt": "2026-01-27T15:30:00Z",
  "timestamp": "2025-01-27T15:30:00Z"
}
```

---

### Device Calibration

#### POST `/api/biometric/devices/:deviceId/calibrate`

Calibrates a biometric device for accurate readings.

**Request Body:**
```json
{
  "validatorId": "GravityCore",
  "calibrationType": "baseline",
  "calibrationData": {
    "restingHeartRate": 65,
    "maxHeartRate": 185,
    "stressBaseline": 10,
    "focusBaseline": 75
  },
  "environmentalConditions": {
    "temperature": 22.0,
    "humidity": 40,
    "position": "sitting"
  }
}
```

**Response:**
```json
{
  "success": true,
  "deviceId": "bt_polar_h10_abc123",
  "calibrationId": "cal_xyz789",
  "calibrationData": {
    "restingHeartRate": 65,
    "maxHeartRate": 185,
    "stressBaseline": 10,
    "focusBaseline": 75
  },
  "qualityMetrics": {
    "calibrationAccuracy": 97,
    "signalStability": 95,
    "noiseLevel": 3
  },
  "validUntil": "2025-04-27T15:30:00Z",
  "timestamp": "2025-01-27T15:30:00Z"
}
```

---

## WebSocket Streaming

Real-time biometric data streaming via WebSocket:

```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

// Subscribe to biometric data stream
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'biometric',
  validatorId: 'GravityCore'
}));

ws.on('message', (data) => {
  const message = JSON.parse(data);
  if (message.type === 'biometric_data') {
    console.log('Real-time biometric data:', message.data);
  }
});
```

**Stream Message Format:**
```json
{
  "type": "biometric_data",
  "validatorId": "GravityCore",
  "deviceId": "bt_polar_h10_abc123",
  "data": {
    "heartRate": 72,
    "timestamp": "2025-01-27T15:30:00Z",
    "quality": 98
  },
  "processed": {
    "emotionalScore": 89.2,
    "stressLevel": 15,
    "focusLevel": 88
  }
}
```

---

## Error Handling

**Common Error Codes:**
- `DEVICE_NOT_FOUND`: Specified device is not available
- `CONNECTION_FAILED`: Unable to connect to device
- `INVALID_BIOMETRIC_DATA`: Biometric data validation failed
- `AUTHENTICATION_REQUIRED`: Validator authentication needed
- `DEVICE_BUSY`: Device is already in use by another validator
- `LOW_SIGNAL_QUALITY`: Biometric signal quality too low
- `CALIBRATION_REQUIRED`: Device needs calibration before use

**Error Response Format:**
```json
{
  "error": "DEVICE_NOT_FOUND",
  "message": "Biometric device bt_polar_h10_abc123 not found",
  "code": 404,
  "details": {
    "deviceId": "bt_polar_h10_abc123",
    "availableDevices": ["usb_empatica_e4"]
  },
  "timestamp": "2025-01-27T15:30:00Z"
}
```