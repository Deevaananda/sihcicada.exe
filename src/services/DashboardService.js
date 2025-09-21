import AsyncStorage from '@react-native-async-storage/async-storage';
import {qrService} from './QRService';

class DashboardService {
  constructor() {
    this.cacheKey = 'dashboard_data';
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  async getDashboardData() {
    try {
      // Try to get cached data first
      const cachedData = await this.getCachedData();
      if (cachedData) {
        return cachedData;
      }

      // Generate fresh data
      const dashboardData = await this.generateDashboardData();
      
      // Cache the data
      await this.cacheData(dashboardData);
      
      return dashboardData;
    } catch (error) {
      console.error('Dashboard data error:', error);
      // Return fallback data
      return this.getFallbackData();
    }
  }

  async getCachedData() {
    try {
      const cached = await AsyncStorage.getItem(this.cacheKey);
      if (cached) {
        const {data, timestamp} = JSON.parse(cached);
        if (Date.now() - timestamp < this.cacheExpiry) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return null;
    }
  }

  async cacheData(data) {
    try {
      const cacheObject = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Cache storage error:', error);
    }
  }

  async generateDashboardData() {
    const currentDate = new Date();
    const todayScans = await this.getTodayScans();
    const inventorySummary = await this.getInventorySummary();
    const qualityMetrics = await this.getQualityMetrics();
    const recentActivities = await this.getRecentActivities();
    const alerts = await this.getSystemAlerts();
    const integrationStatus = await this.getIntegrationStatus();

    return {
      lastUpdated: currentDate.toISOString(),
      scansToday: todayScans,
      inventory: inventorySummary,
      quality: qualityMetrics,
      activities: recentActivities,
      alerts: alerts,
      integration: integrationStatus,
      systemHealth: this.calculateSystemHealth(qualityMetrics, alerts),
    };
  }

  async getTodayScans() {
    // Simulate getting today's scan data
    const baseScans = 1200;
    const randomVariation = Math.floor(Math.random() * 100) - 50;
    return {
      total: baseScans + randomVariation,
      railClips: Math.floor((baseScans + randomVariation) * 0.45),
      liners: Math.floor((baseScans + randomVariation) * 0.18),
      railPads: Math.floor((baseScans + randomVariation) * 0.22),
      sleepers: Math.floor((baseScans + randomVariation) * 0.15),
      hourlyDistribution: this.generateHourlyDistribution(),
    };
  }

  generateHourlyDistribution() {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      const baseActivity = i >= 6 && i <= 18 ? Math.random() * 100 + 50 : Math.random() * 30;
      hours.push({
        hour: i,
        scans: Math.floor(baseActivity),
      });
    }
    return hours;
  }

  async getInventorySummary() {
    return {
      total: {
        railClips: 8500000 + Math.floor(Math.random() * 100000),
        liners: 3200000 + Math.floor(Math.random() * 50000),
        railPads: 4100000 + Math.floor(Math.random() * 60000),
        sleepers: 2800000 + Math.floor(Math.random() * 40000),
      },
      status: {
        good: 16800000,
        warning: 1200000,
        critical: 600000,
      },
      lowStockAlerts: [
        {
          item: 'Rail Clips - Grade A',
          location: 'Warehouse B-2',
          currentStock: 450,
          minimumRequired: 1000,
          urgency: 'High',
        },
        {
          item: 'Rail Pads - EPDM',
          location: 'Depot C-1',
          currentStock: 230,
          minimumRequired: 500,
          urgency: 'Medium',
        },
      ],
      topMovingItems: [
        {
          item: 'Elastic Rail Clips',
          movement: 12500,
          trend: 'up',
        },
        {
          item: 'Concrete Sleepers',
          movement: 8900,
          trend: 'stable',
        },
      ],
    };
  }

  async getQualityMetrics() {
    const currentMonth = new Date().getMonth();
    const qualityTrends = [];
    
    for (let i = 5; i >= 0; i--) {
      const month = (currentMonth - i + 12) % 12;
      qualityTrends.push({
        month: this.getMonthName(month),
        passRate: 85 + Math.random() * 10,
        issueRate: 8 + Math.random() * 8,
        rejectionRate: 1 + Math.random() * 4,
      });
    }

    return {
      current: {
        passRate: 88.7,
        firstPassRate: 82.4,
        rejectionRate: 2.1,
        averageGrade: 'A-',
      },
      trends: qualityTrends,
      topIssues: [
        {
          issue: 'Dimensional tolerance',
          frequency: 45,
          impact: 'Medium',
        },
        {
          issue: 'Surface finish quality',
          frequency: 32,
          impact: 'Low',
        },
        {
          issue: 'Material hardness',
          frequency: 23,
          impact: 'High',
        },
      ],
      vendorComparison: [
        {
          vendor: 'Bharat Steel Industries',
          qualityScore: 94,
          trend: 'improving',
        },
        {
          vendor: 'Railway Track Components',
          qualityScore: 92,
          trend: 'stable',
        },
        {
          vendor: 'Steel Authority of India',
          qualityScore: 88,
          trend: 'declining',
        },
      ],
    };
  }

  async getRecentActivities() {
    const activities = [];
    const activityTypes = [
      { type: 'scan', icon: 'qr-code', color: '#1976D2' },
      { type: 'inspection', icon: 'fact-check', color: '#4CAF50' },
      { type: 'alert', icon: 'warning', color: '#FF9800' },
      { type: 'maintenance', icon: 'build', color: '#9C27B0' },
    ];

    for (let i = 0; i < 10; i++) {
      const activity = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const hoursAgo = Math.floor(Math.random() * 48) + 1;
      
      activities.push({
        id: `activity_${i}`,
        type: activity.type,
        icon: activity.icon,
        color: activity.color,
        title: this.generateActivityTitle(activity.type),
        description: this.generateActivityDescription(activity.type),
        timestamp: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
        qrCode: `${this.getRandomType()}-${this.generateRandomCode()}-${this.getRandomDate()}-VND00${Math.floor(Math.random() * 5) + 1}-${this.generateRandomSerial()}`,
        priority: Math.random() > 0.7 ? 'High' : Math.random() > 0.4 ? 'Medium' : 'Low',
      });
    }

    return activities.sort((a, b) => b.timestamp - a.timestamp);
  }

  generateActivityTitle(type) {
    const titles = {
      scan: 'QR Code Scanned',
      inspection: 'Quality Inspection Completed',
      alert: 'Quality Alert Generated',
      maintenance: 'Maintenance Scheduled',
    };
    return titles[type] || 'System Activity';
  }

  generateActivityDescription(type) {
    const descriptions = {
      scan: 'Track fitting scanned and verified',
      inspection: 'Inspection passed with Grade A rating',
      alert: 'Quality issue detected requiring attention',
      maintenance: 'Preventive maintenance task created',
    };
    return descriptions[type] || 'System activity occurred';
  }

  getRandomType() {
    const types = ['RC', 'LN', 'RP', 'SL'];
    return types[Math.floor(Math.random() * types.length)];
  }

  generateRandomCode() {
    return String(Math.floor(Math.random() * 900000) + 100000);
  }

  getRandomDate() {
    const year = 2024;
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  generateRandomSerial() {
    return String(Math.floor(Math.random() * 90000) + 10000);
  }

  async getSystemAlerts() {
    return [
      {
        id: 'alert_1',
        type: 'Quality',
        severity: 'High',
        title: 'Vendor Quality Deviation',
        description: 'VND003 showing increased rejection rate',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        affectedItems: 450,
        status: 'Active',
        assignedTo: 'Quality Team',
      },
      {
        id: 'alert_2',
        type: 'Inventory',
        severity: 'Medium',
        title: 'Low Stock Warning',
        description: 'Rail Clips stock below minimum threshold',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        affectedItems: 1200,
        status: 'Acknowledged',
        assignedTo: 'Procurement Team',
      },
      {
        id: 'alert_3',
        type: 'System',
        severity: 'Low',
        title: 'Sync Performance',
        description: 'UDM Portal sync taking longer than usual',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        affectedItems: 0,
        status: 'Resolved',
        assignedTo: 'IT Team',
      },
    ];
  }

  async getIntegrationStatus() {
    return {
      udmPortal: {
        status: 'Connected',
        lastSync: new Date(Date.now() - 5 * 60 * 1000),
        syncSuccess: true,
        recordsSync: 15420,
        responseTime: 240, // ms
      },
      tmsPortal: {
        status: 'Connected',
        lastSync: new Date(Date.now() - 3 * 60 * 1000),
        syncSuccess: true,
        recordsSync: 8930,
        responseTime: 180, // ms
      },
      aiAnalytics: {
        status: 'Processing',
        lastAnalysis: new Date(Date.now() - 15 * 60 * 1000),
        modelsActive: 4,
        accuracyRate: 94.2,
      },
      backupStatus: {
        status: 'Healthy',
        lastBackup: new Date(Date.now() - 60 * 60 * 1000),
        backupSize: '2.4 GB',
        retentionDays: 30,
      },
    };
  }

  calculateSystemHealth(qualityMetrics, alerts) {
    let healthScore = 100;
    
    // Deduct points for quality issues
    if (qualityMetrics.current.passRate < 85) {
      healthScore -= 15;
    } else if (qualityMetrics.current.passRate < 90) {
      healthScore -= 5;
    }

    // Deduct points for active alerts
    const highAlerts = alerts.filter(a => a.severity === 'High' && a.status === 'Active').length;
    const mediumAlerts = alerts.filter(a => a.severity === 'Medium' && a.status === 'Active').length;
    
    healthScore -= (highAlerts * 10 + mediumAlerts * 5);

    return {
      score: Math.max(0, Math.min(100, healthScore)),
      status: healthScore >= 90 ? 'Excellent' : healthScore >= 75 ? 'Good' : healthScore >= 60 ? 'Fair' : 'Poor',
      recommendations: this.getHealthRecommendations(healthScore, qualityMetrics, alerts),
    };
  }

  getHealthRecommendations(healthScore, qualityMetrics, alerts) {
    const recommendations = [];

    if (healthScore < 75) {
      recommendations.push('Review and address active high-priority alerts');
    }

    if (qualityMetrics.current.passRate < 85) {
      recommendations.push('Investigate quality process improvements');
    }

    const activeHighAlerts = alerts.filter(a => a.severity === 'High' && a.status === 'Active').length;
    if (activeHighAlerts > 0) {
      recommendations.push(`Address ${activeHighAlerts} critical system alerts`);
    }

    if (recommendations.length === 0) {
      recommendations.push('System operating within normal parameters');
    }

    return recommendations;
  }

  getMonthName(monthIndex) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[monthIndex];
  }

  getFallbackData() {
    return {
      lastUpdated: new Date().toISOString(),
      scansToday: { total: 1247, railClips: 561, liners: 224, railPads: 274, sleepers: 188 },
      inventory: {
        total: { railClips: 8500000, liners: 3200000, railPads: 4100000, sleepers: 2800000 },
        status: { good: 16800000, warning: 1200000, critical: 600000 },
      },
      quality: {
        current: { passRate: 88.7, firstPassRate: 82.4, rejectionRate: 2.1, averageGrade: 'A-' },
      },
      activities: [],
      alerts: [],
      integration: {
        udmPortal: { status: 'Connected', lastSync: new Date() },
        tmsPortal: { status: 'Connected', lastSync: new Date() },
      },
      systemHealth: { score: 85, status: 'Good', recommendations: [] },
    };
  }

  async clearCache() {
    try {
      await AsyncStorage.removeItem(this.cacheKey);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  async refreshData() {
    await this.clearCache();
    return await this.getDashboardData();
  }
}

export const dashboardService = new DashboardService();