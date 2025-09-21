import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Vibration,
  Platform,
} from 'react-native';
import {Camera} from 'expo-camera';
import {Button, Card, ActivityIndicator} from 'react-native-paper';
import {MaterialIcons} from '@expo/vector-icons';
import {qrService} from '../services/QRService';
import {trackingService} from '../services/TrackingService';

const QRScannerScreen = ({navigation}) => {
  const [scanning, setScanning] = useState(true);
  const [flashOn, setFlashOn] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);

  const onBarCodeRead = async (scanResult) => {
    if (!scanning || processing) return;
    
    setScanning(false);
    setProcessing(true);
    
    try {
      Vibration.vibrate(100);
      
      const qrData = scanResult.data;
      console.log('QR Code scanned:', qrData);
      
      // Parse QR code data
      const fittingData = await qrService.parseQRCode(qrData);
      
      if (fittingData.success) {
        // Log scan activity
        await trackingService.logScanActivity(fittingData.data);
        
        // Navigate to fitting details
        navigation.navigate('FittingDetails', {
          fittingData: fittingData.data,
          qrCode: qrData,
        });
      } else {
        Alert.alert(
          'Invalid QR Code',
          'This QR code is not recognized as a valid track fitting code.',
          [
            {text: 'Try Again', onPress: () => setScanning(true)},
            {text: 'Cancel', style: 'cancel'},
          ]
        );
      }
    } catch (error) {
      console.error('QR scan error:', error);
      Alert.alert(
        'Scan Error',
        'Unable to process QR code. Please try again.',
        [
          {text: 'Retry', onPress: () => setScanning(true)},
          {text: 'Cancel', style: 'cancel'},
        ]
      );
    } finally {
      setProcessing(false);
    }
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  const resumeScanning = () => {
    setScanning(true);
    setProcessing(false);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Icon name="camera-alt" size={64} color="#ccc" />
        <Text style={styles.permissionText}>Camera permission is required to scan QR codes</Text>
        <Button mode="contained" onPress={requestCameraPermission}>
          Grant Permission
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        onBarCodeScanned={scanning ? onBarCodeScanned : undefined}
        flashMode={flashOn ? Camera.Constants.FlashMode.torch : Camera.Constants.FlashMode.off}
        barCodeScannerSettings={{
          barCodeTypes: ['qr', 'pdf417'],
        }}>
        
        {/* Scanning overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Card style={styles.instructionsCard}>
            <Card.Content>
              <Text style={styles.instructionsText}>
                {processing 
                  ? 'Processing QR Code...' 
                  : 'Position the QR code within the frame to scan'
                }
              </Text>
              {processing && <ActivityIndicator animating={true} />}
            </Card.Content>
          </Card>
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
            <Icon 
              name={flashOn ? 'flash-off' : 'flash-on'} 
              size={30} 
              color="#FFFFFF" 
            />
            <Text style={styles.controlText}>Flash</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={() => navigation.navigate('Offline')}>
            <Icon name="cloud-off" size={30} color="#FFFFFF" />
            <Text style={styles.controlText}>Offline</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={() => navigation.navigate('Inventory')}>
            <Icon name="inventory" size={30} color="#FFFFFF" />
            <Text style={styles.controlText}>Inventory</Text>
          </TouchableOpacity>
        </View>
      </Camera>

      {/* Sample QR Formats Info */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text style={styles.infoTitle}>Supported QR Code Formats:</Text>
          <Text style={styles.infoText}>• Rail Clips: RC-[LOT]-[DATE]-[VENDOR]</Text>
          <Text style={styles.infoText}>• Liners: LN-[LOT]-[DATE]-[VENDOR]</Text>
          <Text style={styles.infoText}>• Rail Pads: RP-[LOT]-[DATE]-[VENDOR]</Text>
          <Text style={styles.infoText}>• Sleepers: SL-[LOT]-[DATE]-[VENDOR]</Text>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 50,
    height: 50,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#FFFFFF',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 50,
    height: 50,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#FFFFFF',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 50,
    height: 50,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#FFFFFF',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 50,
    height: 50,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#FFFFFF',
  },
  instructionsContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
  },
  instructionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  instructionsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  controlButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 50,
    padding: 15,
  },
  controlText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 5,
  },
  infoCard: {
    margin: 15,
    backgroundColor: '#E3F2FD',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    color: '#666',
  },
});

export default QRScannerScreen;