import AsyncStorage from '@react-native-async-storage/async-storage';

class TrackingService {
  constructor() {
    this.trackingCache = new Map();
    this.syncQueue = [];
  }

  async trackScan(scanData) {
    try {
      const trackingEntry = {
        id: this.generateTrackingId(),
        scanId: scanData.id,
        fittingId: scanData.fittingId,
        timestamp: new Date().toISOString(),
        location: scanData.location || null,
        userId: scanData.userId,
        status: 'scanned',
        metadata: {
          scanType: scanData.type || 'qr_code',
          deviceInfo: await this.getDeviceInfo(),
          networkStatus: await this.getNetworkStatus(),
        },
      };

      // Store in cache
      this.trackingCache.set(trackingEntry.id, trackingEntry);

      // Store locally
      await this.storeTrackingEntry(trackingEntry);

      // Add to sync queue
      this.syncQueue.push(trackingEntry);

      return trackingEntry;
    } catch (error) {
      console.error('Tracking scan error:', error);
      return null;
    }
  }

  async trackInspection(inspectionData) {
    try {
      const trackingEntry = {
        id: this.generateTrackingId(),
        inspectionId: inspectionData.id,
        fittingId: inspectionData.fittingId,
        timestamp: new Date().toISOString(),
        location: inspectionData.location || null,
        userId: inspectionData.inspector,
        status: 'inspected',
        condition: inspectionData.condition,
        notes: inspectionData.notes,
        metadata: {
          inspectionType: inspectionData.type || 'visual',
          duration: inspectionData.duration || 0,
          photos: inspectionData.photos ? inspectionData.photos.length : 0,
        },
      };

      // Store in cache
      this.trackingCache.set(trackingEntry.id, trackingEntry);

      // Store locally
      await this.storeTrackingEntry(trackingEntry);

      // Add to sync queue
      this.syncQueue.push(trackingEntry);

      return trackingEntry;
    } catch (error) {
      console.error('Tracking inspection error:', error);
      return null;
    }
  }

  async trackMovement(movementData) {
    try {
      const trackingEntry = {
        id: this.generateTrackingId(),
        fittingId: movementData.fittingId,
        timestamp: new Date().toISOString(),
        fromLocation: movementData.from,
        toLocation: movementData.to,
        userId: movementData.userId,
        status: 'moved',
        reason: movementData.reason || 'relocation',
        metadata: {
          transportMethod: movementData.transportMethod || 'manual',
          approvalId: movementData.approvalId || null,
          estimatedDuration: movementData.estimatedDuration || 0,
        },
      };

      // Store in cache
      this.trackingCache.set(trackingEntry.id, trackingEntry);

      // Store locally
      await this.storeTrackingEntry(trackingEntry);

      // Add to sync queue
      this.syncQueue.push(trackingEntry);

      return trackingEntry;
    } catch (error) {
      console.error('Tracking movement error:', error);
      return null;
    }
  }

  async getTrackingHistory(fittingId, limit = 50) {
    try {
      const allEntries = await this.getAllTrackingEntries();
      return allEntries
        .filter(entry => entry.fittingId === fittingId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error('Get tracking history error:', error);
      return [];
    }
  }

  async getRecentActivity(limit = 20) {
    try {
      const allEntries = await this.getAllTrackingEntries();
      return allEntries
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error('Get recent activity error:', error);
      return [];
    }
  }

  async getActivityStats(timeframe = 'week') {
    try {
      const allEntries = await this.getAllTrackingEntries();
      const now = new Date();
      let startDate = new Date();

      switch (timeframe) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }

      const filteredEntries = allEntries.filter(
        entry => new Date(entry.timestamp) >= startDate
      );

      return {
        totalActivities: filteredEntries.length,
        scans: filteredEntries.filter(e => e.status === 'scanned').length,
        inspections: filteredEntries.filter(e => e.status === 'inspected').length,
        movements: filteredEntries.filter(e => e.status === 'moved').length,
        timeframe,
        period: {
          start: startDate.toISOString(),
          end: now.toISOString(),
        },
      };
    } catch (error) {
      console.error('Get activity stats error:', error);
      return {
        totalActivities: 0,
        scans: 0,
        inspections: 0,
        movements: 0,
        timeframe,
      };
    }
  }

  async storeTrackingEntry(entry) {
    try {
      const key = `tracking_${entry.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(entry));
      
      // Also add to master list
      const masterList = await this.getMasterTrackingList();
      masterList.push(entry.id);
      await AsyncStorage.setItem('tracking_master_list', JSON.stringify(masterList));
    } catch (error) {
      console.error('Store tracking entry error:', error);
    }
  }

  async getAllTrackingEntries() {
    try {
      const masterList = await this.getMasterTrackingList();
      const entries = [];

      for (const entryId of masterList) {
        try {
          const entryData = await AsyncStorage.getItem(`tracking_${entryId}`);
          if (entryData) {
            entries.push(JSON.parse(entryData));
          }
        } catch (error) {
          console.warn('Failed to load tracking entry:', entryId, error);
        }
      }

      return entries;
    } catch (error) {
      console.error('Get all tracking entries error:', error);
      return [];
    }
  }

  async getMasterTrackingList() {
    try {
      const listData = await AsyncStorage.getItem('tracking_master_list');
      return listData ? JSON.parse(listData) : [];
    } catch (error) {
      console.error('Get master tracking list error:', error);
      return [];
    }
  }

  async syncPendingEntries() {
    try {
      if (this.syncQueue.length === 0) {
        return { success: true, synced: 0 };
      }

      let syncedCount = 0;
      const failedEntries = [];

      for (const entry of this.syncQueue) {
        try {
          // In a real implementation, this would sync with the server
          await this.simulateServerSync(entry);
          syncedCount++;
        } catch (error) {
          console.warn('Failed to sync entry:', entry.id, error);
          failedEntries.push(entry);
        }
      }

      // Update sync queue to only contain failed entries
      this.syncQueue = failedEntries;

      return {
        success: true,
        synced: syncedCount,
        failed: failedEntries.length,
      };
    } catch (error) {
      console.error('Sync pending entries error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async simulateServerSync(entry) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate random success/failure for demo
    if (Math.random() > 0.9) {
      throw new Error('Network timeout');
    }

    console.log('Synced tracking entry:', entry.id);
    return true;
  }

  async clearTrackingData() {
    try {
      const masterList = await this.getMasterTrackingList();
      
      // Remove all tracking entries
      for (const entryId of masterList) {
        await AsyncStorage.removeItem(`tracking_${entryId}`);
      }

      // Clear master list
      await AsyncStorage.removeItem('tracking_master_list');

      // Clear cache and sync queue
      this.trackingCache.clear();
      this.syncQueue = [];

      return { success: true };
    } catch (error) {
      console.error('Clear tracking data error:', error);
      return { success: false, error: error.message };
    }
  }

  generateTrackingId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `track_${timestamp}_${random}`;
  }

  async getDeviceInfo() {
    return {
      platform: 'web', // This would be Platform.OS in real React Native
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    };
  }

  async getNetworkStatus() {
    try {
      // Simple network check
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      return {
        online,
        connectionType: 'unknown', // This would use NetInfo in real React Native
      };
    } catch (error) {
      return {
        online: false,
        connectionType: 'unknown',
      };
    }
  }

  async exportTrackingData() {
    try {
      const allEntries = await this.getAllTrackingEntries();
      const stats = await this.getActivityStats('month');
      
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          totalEntries: allEntries.length,
          stats,
        },
        entries: allEntries,
      };

      return {
        success: true,
        data: exportData,
        filename: `tracking_export_${Date.now()}.json`,
      };
    } catch (error) {
      console.error('Export tracking data error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async importTrackingData(importData) {
    try {
      if (!importData || !importData.entries) {
        throw new Error('Invalid import data format');
      }

      let importedCount = 0;
      for (const entry of importData.entries) {
        try {
          await this.storeTrackingEntry(entry);
          this.trackingCache.set(entry.id, entry);
          importedCount++;
        } catch (error) {
          console.warn('Failed to import entry:', entry.id, error);
        }
      }

      return {
        success: true,
        imported: importedCount,
        total: importData.entries.length,
      };
    } catch (error) {
      console.error('Import tracking data error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export const trackingService = new TrackingService();