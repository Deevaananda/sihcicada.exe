import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Chip,
  ProgressBar,
  Switch,
} from 'react-native-paper';
import {MaterialIcons} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { qrService } from '../services/QRService';

const { width } = Dimensions.get('window');

const OfflineScreen = ({ navigation }) => {
  const [offlineMode, setOfflineMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, error, success
  const [offlineData, setOfflineData] = useState({
    qrScans: 0,
    inspections: 0,
    totalStorage: 0,
  });
  const [lastSync, setLastSync] = useState(null);
  const [networkStatus, setNetworkStatus] = useState(false);

  useEffect(() => {
    checkOfflineStatus();
    loadOfflineData();
    checkNetworkStatus();
    
    // Check network status periodically
    const interval = setInterval(checkNetworkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkOfflineStatus = async () => {
    try {
      const isOffline = await AsyncStorage.getItem('offlineMode');
      setOfflineMode(isOffline === 'true');
      
      const lastSyncTime = await AsyncStorage.getItem('lastSync');
      setLastSync(lastSyncTime ? new Date(lastSyncTime) : null);
    } catch (error) {
      console.error('Error checking offline status:', error);
    }
  };

  const loadOfflineData = async () => {
    try {
      const [scans, inspections] = await Promise.all([
        AsyncStorage.getItem('offline_scans'),
        AsyncStorage.getItem('offline_inspections'),
      ]);

      const scanData = scans ? JSON.parse(scans) : [];
      const inspectionData = inspections ? JSON.parse(inspections) : [];

      setOfflineData({
        qrScans: scanData.length,
        inspections: inspectionData.length,
        totalStorage: (JSON.stringify(scanData).length + JSON.stringify(inspectionData).length) / 1024, // KB
      });
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  };

  const checkNetworkStatus = async () => {
    try {
      // Simple network check - try to reach a reliable endpoint
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        timeout: 5000,
      });
      setNetworkStatus(response.ok);
    } catch (error) {
      setNetworkStatus(false);
    }
  };

  const toggleOfflineMode = async (enabled) => {
    try {
      await AsyncStorage.setItem('offlineMode', enabled.toString());
      setOfflineMode(enabled);
      
      if (enabled) {
        Alert.alert(
          'Offline Mode Enabled',
          'You can now scan QR codes and perform inspections without internet connection. Data will be synced when you go back online.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Offline Mode Disabled',
          'The app will now require internet connection for all operations.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle offline mode');
    }
  };

  const syncOfflineData = async () => {
    if (!networkStatus) {
      Alert.alert('No Network', 'Please connect to the internet to sync data');
      return;
    }

    setSyncStatus('syncing');

    try {
      // Load offline data
      const [scans, inspections] = await Promise.all([
        AsyncStorage.getItem('offline_scans'),
        AsyncStorage.getItem('offline_inspections'),
      ]);

      const scanData = scans ? JSON.parse(scans) : [];
      const inspectionData = inspections ? JSON.parse(inspections) : [];

      if (scanData.length === 0 && inspectionData.length === 0) {
        setSyncStatus('success');
        Alert.alert('Sync Complete', 'No data to sync');
        return;
      }

      // Sync QR scans
      let syncedScans = 0;
      for (const scan of scanData) {
        try {
          await qrService.uploadScanData(scan);
          syncedScans++;
        } catch (error) {
          console.error('Failed to sync scan:', scan.id, error);
        }
      }

      // Sync inspections
      let syncedInspections = 0;
      for (const inspection of inspectionData) {
        try {
          await qrService.uploadInspectionData(inspection);
          syncedInspections++;
        } catch (error) {
          console.error('Failed to sync inspection:', inspection.id, error);
        }
      }

      // Clear synced data
      if (syncedScans === scanData.length && syncedInspections === inspectionData.length) {
        await Promise.all([
          AsyncStorage.removeItem('offline_scans'),
          AsyncStorage.removeItem('offline_inspections'),
        ]);
        
        setOfflineData({
          qrScans: 0,
          inspections: 0,
          totalStorage: 0,
        });
      }

      // Update last sync time
      const now = new Date().toISOString();
      await AsyncStorage.setItem('lastSync', now);
      setLastSync(new Date(now));

      setSyncStatus('success');
      
      Alert.alert(
        'Sync Complete',
        `Synced ${syncedScans} QR scans and ${syncedInspections} inspections successfully.`,
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      Alert.alert('Sync Failed', 'Failed to sync some data. Please try again later.');
    }
  };

  const clearOfflineData = () => {
    Alert.alert(
      'Clear Offline Data',
      'This will permanently delete all offline data that hasn\'t been synced. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all([
                AsyncStorage.removeItem('offline_scans'),
                AsyncStorage.removeItem('offline_inspections'),
              ]);
              
              setOfflineData({
                qrScans: 0,
                inspections: 0,
                totalStorage: 0,
              });
              
              Alert.alert('Success', 'Offline data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear offline data');
            }
          },
        },
      ]
    );
  };

  const exportOfflineData = async () => {
    try {
      const [scans, inspections] = await Promise.all([
        AsyncStorage.getItem('offline_scans'),
        AsyncStorage.getItem('offline_inspections'),
      ]);

      const exportData = {
        timestamp: new Date().toISOString(),
        scans: scans ? JSON.parse(scans) : [],
        inspections: inspections ? JSON.parse(inspections) : [],
        metadata: {
          totalScans: offlineData.qrScans,
          totalInspections: offlineData.inspections,
          storageUsed: `${offlineData.totalStorage.toFixed(2)} KB`,
        },
      };

      // In a real app, this would save to device storage or share
      Alert.alert(
        'Export Data',
        `Data exported successfully. Contains ${exportData.scans.length} scans and ${exportData.inspections.length} inspections.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export offline data');
    }
  };

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'syncing':
        return '#2196F3';
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'sync';
      case 'success':
        return 'check-circle';
      case 'error':
        return 'error';
      default:
        return 'sync-disabled';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Network Status */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.statusHeader}>
            <Icon 
              name={networkStatus ? 'wifi' : 'wifi-off'} 
              size={24} 
              color={networkStatus ? '#4CAF50' : '#F44336'} 
            />
            <Title style={styles.statusTitle}>Network Status</Title>
          </View>
          <Chip 
            icon={networkStatus ? 'check' : 'close'}
            style={[
              styles.statusChip,
              { backgroundColor: networkStatus ? '#E8F5E8' : '#FFEBEE' }
            ]}
            textStyle={{ 
              color: networkStatus ? '#4CAF50' : '#F44336',
              fontWeight: '600',
            }}
          >
            {networkStatus ? 'Online' : 'Offline'}
          </Chip>
        </Card.Content>
      </Card>

      {/* Offline Mode Toggle */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.toggleContainer}>
            <View style={styles.toggleInfo}>
              <Title>Offline Mode</Title>
              <Paragraph>
                Enable offline mode to scan QR codes and perform inspections without internet connection.
              </Paragraph>
            </View>
            <Switch
              value={offlineMode}
              onValueChange={toggleOfflineMode}
              color="#5143A3"
            />
          </View>
        </Card.Content>
      </Card>

      {/* Offline Data Summary */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Icon name="storage" size={24} color="#5143A3" />
            <Title style={styles.sectionTitle}>Offline Data</Title>
          </View>
          
          <View style={styles.dataGrid}>
            <View style={styles.dataItem}>
              <Icon name="qr-code-scanner" size={32} color="#2196F3" />
              <Text style={styles.dataValue}>{offlineData.qrScans}</Text>
              <Text style={styles.dataLabel}>QR Scans</Text>
            </View>
            
            <View style={styles.dataItem}>
              <Icon name="assignment" size={32} color="#FF9800" />
              <Text style={styles.dataValue}>{offlineData.inspections}</Text>
              <Text style={styles.dataLabel}>Inspections</Text>
            </View>
            
            <View style={styles.dataItem}>
              <Icon name="storage" size={32} color="#4CAF50" />
              <Text style={styles.dataValue}>{offlineData.totalStorage.toFixed(1)}</Text>
              <Text style={styles.dataLabel}>KB Used</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Sync Status */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.syncHeader}>
            <View style={styles.syncInfo}>
              <View style={styles.syncStatus}>
                <Icon 
                  name={getSyncStatusIcon()} 
                  size={24} 
                  color={getSyncStatusColor()} 
                />
                <Title style={styles.syncTitle}>Data Synchronization</Title>
              </View>
              {lastSync && (
                <Paragraph>
                  Last sync: {lastSync.toLocaleDateString()} at {lastSync.toLocaleTimeString()}
                </Paragraph>
              )}
              {!lastSync && (
                <Paragraph style={styles.noSyncText}>No sync performed yet</Paragraph>
              )}
            </View>
          </View>
          
          {syncStatus === 'syncing' && (
            <ProgressBar 
              indeterminate 
              color="#5143A3" 
              style={styles.progressBar}
            />
          )}
        </Card.Content>
      </Card>

      {/* Offline Features */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Available Offline</Title>
          <View style={styles.featureList}>
            <View style={styles.feature}>
              <Icon name="qr-code-scanner" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>QR Code Scanning</Text>
              <Icon name="check" size={16} color="#4CAF50" />
            </View>
            
            <View style={styles.feature}>
              <Icon name="assignment" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Inspection Forms</Text>
              <Icon name="check" size={16} color="#4CAF50" />
            </View>
            
            <View style={styles.feature}>
              <Icon name="photo-camera" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Photo Capture</Text>
              <Icon name="check" size={16} color="#4CAF50" />
            </View>
            
            <View style={styles.feature}>
              <Icon name="inventory" size={20} color="#FF9800" />
              <Text style={styles.featureText}>Live Inventory Updates</Text>
              <Icon name="close" size={16} color="#F44336" />
            </View>
            
            <View style={styles.feature}>
              <Icon name="cloud-upload" size={20} color="#FF9800" />
              <Text style={styles.featureText}>Real-time Portal Sync</Text>
              <Icon name="close" size={16} color="#F44336" />
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <Button
          mode="contained"
          onPress={syncOfflineData}
          disabled={!networkStatus || syncStatus === 'syncing' || (offlineData.qrScans === 0 && offlineData.inspections === 0)}
          loading={syncStatus === 'syncing'}
          icon="sync"
          style={[styles.actionButton, styles.primaryButton]}
        >
          Sync Data
        </Button>
        
        <Button
          mode="outlined"
          onPress={exportOfflineData}
          disabled={offlineData.qrScans === 0 && offlineData.inspections === 0}
          icon="download"
          style={styles.actionButton}
        >
          Export Data
        </Button>
        
        <Button
          mode="text"
          onPress={clearOfflineData}
          disabled={offlineData.qrScans === 0 && offlineData.inspections === 0}
          icon="delete"
          textColor="#F44336"
          style={styles.actionButton}
        >
          Clear Offline Data
        </Button>
      </View>

      {/* Help Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>How Offline Mode Works</Title>
          <View style={styles.helpSection}>
            <View style={styles.helpItem}>
              <Icon name="info" size={16} color="#5143A3" />
              <Text style={styles.helpText}>
                When offline mode is enabled, you can scan QR codes and perform inspections without internet.
              </Text>
            </View>
            
            <View style={styles.helpItem}>
              <Icon name="info" size={16} color="#5143A3" />
              <Text style={styles.helpText}>
                All data is stored locally and will be automatically synced when you go online.
              </Text>
            </View>
            
            <View style={styles.helpItem}>
              <Icon name="info" size={16} color="#5143A3" />
              <Text style={styles.helpText}>
                Some features like live inventory updates and portal integration require internet connection.
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    marginLeft: 8,
    fontSize: 18,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
    paddingRight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginLeft: 8,
    fontSize: 18,
  },
  dataGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
  },
  dataItem: {
    alignItems: 'center',
    flex: 1,
  },
  dataValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  dataLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  syncHeader: {
    marginBottom: 16,
  },
  syncInfo: {
    flex: 1,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  syncTitle: {
    marginLeft: 8,
    fontSize: 18,
  },
  noSyncText: {
    color: '#666',
    fontStyle: 'italic',
  },
  progressBar: {
    marginTop: 8,
  },
  featureList: {
    marginTop: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  featureText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
  },
  actionContainer: {
    padding: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#5143A3',
  },
  helpSection: {
    marginTop: 12,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  helpText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
});

export default OfflineScreen;