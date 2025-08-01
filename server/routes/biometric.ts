// Biometric Device Management API Routes
import { Router } from 'express';
import { biometricDeviceManager } from '../biometric/BiometricDeviceManager';

const router = Router();

// Get connected biometric devices
router.get('/devices', (req, res) => {
  try {
    const devices = biometricDeviceManager.getConnectedDevices();
    res.json({
      success: true,
      devices: devices,
      count: devices.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get biometric devices',
      message: (error as Error).message
    });
  }
});

// Connect a biometric device
router.post('/devices/connect', async (req, res) => {
  try {
    const { deviceId, validatorId, deviceType } = req.body;
    
    if (!deviceId || !validatorId) {
      return res.status(400).json({
        success: false,
        error: 'Device ID and Validator ID are required'
      });
    }
    
    const success = await biometricDeviceManager.connectDevice(deviceId, validatorId);
    
    if (success) {
      res.json({
        success: true,
        message: `Biometric device ${deviceId} connected for validator ${validatorId}`,
        deviceId,
        validatorId
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to connect biometric device'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Device connection failed',
      message: (error as Error).message
    });
  }
});

// Disconnect a biometric device
router.post('/devices/disconnect', (req, res) => {
  try {
    const { deviceId } = req.body;
    
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        error: 'Device ID is required'
      });
    }
    
    biometricDeviceManager.disconnectDevice(deviceId);
    
    res.json({
      success: true,
      message: `Biometric device ${deviceId} disconnected`,
      deviceId
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Device disconnection failed',
      message: (error as Error).message
    });
  }
});

// Get authenticated validators
router.get('/validators/authenticated', (req, res) => {
  try {
    const authenticatedValidators = biometricDeviceManager.getAuthenticatedValidators();
    
    res.json({
      success: true,
      validators: authenticatedValidators,
      count: authenticatedValidators.length,
      canMine: authenticatedValidators.length > 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get authenticated validators',
      message: (error as Error).message
    });
  }
});

// Get device reading for a specific device
router.get('/devices/:deviceId/reading', (req, res) => {
  try {
    const { deviceId } = req.params;
    const reading = biometricDeviceManager.getDeviceReading(deviceId);
    
    if (!reading) {
      return res.status(404).json({
        success: false,
        error: 'No reading available for this device'
      });
    }
    
    res.json({
      success: true,
      deviceId,
      reading
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get device reading',
      message: (error as Error).message
    });
  }
});

export default router;