import AsyncStorage from '@react-native-async-storage/async-storage';
import { dashboardService } from './DashboardService';
import { inventoryService } from './InventoryService';
import { trackingService } from './TrackingService';
import { aiService } from './AIService';

class ReportsService {
  constructor() {
    this.reportCache = new Map();
    this.reportTemplates = this.initializeReportTemplates();
  }

  initializeReportTemplates() {
    return {
      inventory: {
        name: 'Inventory Report',
        description: 'Complete inventory status and stock levels',
        fields: ['itemCode', 'description', 'quantity', 'condition', 'location', 'lastInspection'],
        charts: ['stockLevels', 'conditionDistribution', 'locationBreakdown'],
      },
      inspection: {
        name: 'Inspection Report',
        description: 'Quality control and inspection results',
        fields: ['fittingId', 'inspector', 'date', 'condition', 'issues', 'recommendations'],
        charts: ['conditionTrends', 'issueFrequency', 'inspectorPerformance'],
      },
      performance: {
        name: 'Performance Report',
        description: 'Overall system performance and KPIs',
        fields: ['metric', 'value', 'target', 'variance', 'trend'],
        charts: ['performanceTrends', 'kpiDashboard', 'benchmarkComparison'],
      },
      maintenance: {
        name: 'Maintenance Report',
        description: 'Maintenance schedules and activities',
        fields: ['fittingId', 'maintenanceType', 'scheduledDate', 'completedDate', 'cost'],
        charts: ['maintenanceSchedule', 'costAnalysis', 'delayAnalysis'],
      },
    };
  }

  async generateInventoryReport(filters = {}) {
    try {
      const inventoryData = await inventoryService.getAllItems();
      
      let filteredData = inventoryData;
      
      // Apply filters
      if (filters.location) {
        filteredData = filteredData.filter(item => 
          item.location?.toLowerCase().includes(filters.location.toLowerCase())
        );
      }
      
      if (filters.condition) {
        filteredData = filteredData.filter(item => 
          item.condition?.toLowerCase() === filters.condition.toLowerCase()
        );
      }
      
      if (filters.dateRange) {
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        filteredData = filteredData.filter(item => {
          const itemDate = new Date(item.lastUpdated || item.createdAt);
          return itemDate >= startDate && itemDate <= endDate;
        });
      }

      const summary = this.calculateInventorySummary(filteredData);
      const charts = this.generateInventoryCharts(filteredData);
      
      const report = {
        id: this.generateReportId(),
        type: 'inventory',
        title: 'Inventory Status Report',
        generatedAt: new Date().toISOString(),
        filters,
        summary,
        data: filteredData,
        charts,
        totalItems: filteredData.length,
      };

      await this.cacheReport(report);
      return report;
    } catch (error) {
      console.error('Generate inventory report error:', error);
      throw error;
    }
  }

  async generateInspectionReport(filters = {}) {
    try {
      // Get inspection data from tracking service
      const trackingData = await trackingService.getAllTrackingEntries();
      const inspections = trackingData.filter(entry => entry.status === 'inspected');
      
      let filteredData = inspections;
      
      // Apply filters
      if (filters.inspector) {
        filteredData = filteredData.filter(item => 
          item.userId?.toLowerCase().includes(filters.inspector.toLowerCase())
        );
      }
      
      if (filters.condition) {
        filteredData = filteredData.filter(item => 
          item.condition?.toLowerCase() === filters.condition.toLowerCase()
        );
      }
      
      if (filters.dateRange) {
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        filteredData = filteredData.filter(item => {
          const itemDate = new Date(item.timestamp);
          return itemDate >= startDate && itemDate <= endDate;
        });
      }

      const summary = this.calculateInspectionSummary(filteredData);
      const charts = this.generateInspectionCharts(filteredData);
      
      const report = {
        id: this.generateReportId(),
        type: 'inspection',
        title: 'Inspection Quality Report',
        generatedAt: new Date().toISOString(),
        filters,
        summary,
        data: filteredData,
        charts,
        totalInspections: filteredData.length,
      };

      await this.cacheReport(report);
      return report;
    } catch (error) {
      console.error('Generate inspection report error:', error);
      throw error;
    }
  }

  async generatePerformanceReport(filters = {}) {
    try {
      const [dashboardData, activityStats, aiInsights] = await Promise.all([
        dashboardService.getDashboardData(),
        trackingService.getActivityStats('month'),
        aiService.getSystemPerformance(),
      ]);

      const performanceMetrics = {
        scanEfficiency: {
          value: dashboardData.scanCount / (dashboardData.scanCount + dashboardData.failedScans || 1) * 100,
          target: 95,
          unit: '%',
        },
        inspectionRate: {
          value: activityStats.inspections / activityStats.totalActivities * 100,
          target: 30,
          unit: '%',
        },
        systemUptime: {
          value: aiInsights?.uptime || 99.5,
          target: 99,
          unit: '%',
        },
        responseTime: {
          value: aiInsights?.avgResponseTime || 250,
          target: 200,
          unit: 'ms',
        },
      };

      const summary = this.calculatePerformanceSummary(performanceMetrics);
      const charts = this.generatePerformanceCharts(performanceMetrics, dashboardData);
      
      const report = {
        id: this.generateReportId(),
        type: 'performance',
        title: 'System Performance Report',
        generatedAt: new Date().toISOString(),
        filters,
        summary,
        metrics: performanceMetrics,
        charts,
        period: filters.dateRange || {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
      };

      await this.cacheReport(report);
      return report;
    } catch (error) {
      console.error('Generate performance report error:', error);
      throw error;
    }
  }

  async generateCustomReport(config) {
    try {
      const { title, dataSource, fields, filters, charts } = config;
      
      let data = [];
      switch (dataSource) {
        case 'inventory':
          data = await inventoryService.getAllItems();
          break;
        case 'tracking':
          data = await trackingService.getAllTrackingEntries();
          break;
        case 'dashboard':
          data = [await dashboardService.getDashboardData()];
          break;
        default:
          throw new Error(`Unknown data source: ${dataSource}`);
      }

      // Apply filters
      if (filters) {
        data = this.applyFilters(data, filters);
      }

      // Select only required fields
      if (fields && fields.length > 0) {
        data = data.map(item => {
          const filtered = {};
          fields.forEach(field => {
            if (item.hasOwnProperty(field)) {
              filtered[field] = item[field];
            }
          });
          return filtered;
        });
      }

      const report = {
        id: this.generateReportId(),
        type: 'custom',
        title: title || 'Custom Report',
        generatedAt: new Date().toISOString(),
        config,
        data,
        totalRecords: data.length,
      };

      await this.cacheReport(report);
      return report;
    } catch (error) {
      console.error('Generate custom report error:', error);
      throw error;
    }
  }

  calculateInventorySummary(data) {
    const summary = {
      totalItems: data.length,
      byCondition: {},
      byLocation: {},
      lowStock: 0,
      totalValue: 0,
    };

    data.forEach(item => {
      // Condition breakdown
      const condition = item.condition || 'unknown';
      summary.byCondition[condition] = (summary.byCondition[condition] || 0) + 1;

      // Location breakdown
      const location = item.location || 'unknown';
      summary.byLocation[location] = (summary.byLocation[location] || 0) + 1;

      // Low stock check
      if (item.quantity < item.reorderLevel) {
        summary.lowStock++;
      }

      // Total value
      summary.totalValue += (item.quantity || 0) * (item.unitCost || 0);
    });

    return summary;
  }

  calculateInspectionSummary(data) {
    const summary = {
      totalInspections: data.length,
      byCondition: {},
      byInspector: {},
      avgInspectionTime: 0,
      issuesFound: 0,
    };

    let totalDuration = 0;
    data.forEach(item => {
      // Condition breakdown
      const condition = item.condition || 'unknown';
      summary.byCondition[condition] = (summary.byCondition[condition] || 0) + 1;

      // Inspector breakdown
      const inspector = item.userId || 'unknown';
      summary.byInspector[inspector] = (summary.byInspector[inspector] || 0) + 1;

      // Duration calculation
      totalDuration += item.metadata?.duration || 0;

      // Issues count
      if (item.condition && ['poor', 'damaged', 'faulty'].includes(item.condition.toLowerCase())) {
        summary.issuesFound++;
      }
    });

    summary.avgInspectionTime = data.length > 0 ? totalDuration / data.length : 0;
    return summary;
  }

  calculatePerformanceSummary(metrics) {
    const summary = {
      totalMetrics: Object.keys(metrics).length,
      metricsOnTarget: 0,
      metricsAtRisk: 0,
      overallScore: 0,
    };

    let totalScore = 0;
    Object.values(metrics).forEach(metric => {
      const performance = (metric.value / metric.target) * 100;
      totalScore += Math.min(performance, 120); // Cap at 120%

      if (performance >= 95) {
        summary.metricsOnTarget++;
      } else if (performance < 80) {
        summary.metricsAtRisk++;
      }
    });

    summary.overallScore = totalScore / summary.totalMetrics;
    return summary;
  }

  generateInventoryCharts(data) {
    return {
      conditionDistribution: this.createPieChartData(data, 'condition'),
      locationBreakdown: this.createBarChartData(data, 'location'),
      stockLevels: this.createStockLevelChart(data),
    };
  }

  generateInspectionCharts(data) {
    return {
      conditionTrends: this.createTimeSeriesChart(data, 'condition'),
      issueFrequency: this.createBarChartData(data, 'condition'),
      inspectorPerformance: this.createBarChartData(data, 'userId'),
    };
  }

  generatePerformanceCharts(metrics, dashboardData) {
    return {
      kpiDashboard: Object.entries(metrics).map(([key, metric]) => ({
        name: key,
        value: metric.value,
        target: metric.target,
        unit: metric.unit,
      })),
      performanceTrends: this.createPerformanceTrendChart(dashboardData),
    };
  }

  createPieChartData(data, field) {
    const counts = {};
    data.forEach(item => {
      const value = item[field] || 'unknown';
      counts[value] = (counts[value] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: (count / data.length) * 100,
    }));
  }

  createBarChartData(data, field) {
    const counts = {};
    data.forEach(item => {
      const value = item[field] || 'unknown';
      counts[value] = (counts[value] || 0) + 1;
    });

    return {
      labels: Object.keys(counts),
      data: Object.values(counts),
    };
  }

  createStockLevelChart(data) {
    return data.map(item => ({
      name: item.itemCode || item.id,
      current: item.quantity || 0,
      minimum: item.reorderLevel || 0,
      maximum: item.maxStock || item.quantity * 2,
    }));
  }

  createTimeSeriesChart(data, field) {
    // Group by date and field value
    const grouped = {};
    data.forEach(item => {
      const date = new Date(item.timestamp).toDateString();
      const value = item[field] || 'unknown';
      
      if (!grouped[date]) grouped[date] = {};
      grouped[date][value] = (grouped[date][value] || 0) + 1;
    });

    return {
      labels: Object.keys(grouped).sort(),
      datasets: this.createDatasets(grouped),
    };
  }

  createDatasets(groupedData) {
    const allValues = new Set();
    Object.values(groupedData).forEach(dateData => {
      Object.keys(dateData).forEach(value => allValues.add(value));
    });

    return Array.from(allValues).map(value => ({
      label: value,
      data: Object.keys(groupedData).sort().map(date => 
        groupedData[date][value] || 0
      ),
    }));
  }

  createPerformanceTrendChart(dashboardData) {
    // Mock performance trend data
    const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    return {
      labels,
      datasets: [
        {
          label: 'Scan Success Rate',
          data: [92, 94, 96, 95],
        },
        {
          label: 'Inspection Rate',
          data: [28, 31, 35, 33],
        },
        {
          label: 'System Uptime',
          data: [99.2, 99.8, 99.5, 99.7],
        },
      ],
    };
  }

  applyFilters(data, filters) {
    let filtered = [...data];

    Object.entries(filters).forEach(([key, value]) => {
      if (value === null || value === undefined) return;

      if (key === 'dateRange' && value.start && value.end) {
        const startDate = new Date(value.start);
        const endDate = new Date(value.end);
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.timestamp || item.createdAt || item.lastUpdated);
          return itemDate >= startDate && itemDate <= endDate;
        });
      } else if (typeof value === 'string') {
        filtered = filtered.filter(item => 
          item[key]?.toString().toLowerCase().includes(value.toLowerCase())
        );
      } else {
        filtered = filtered.filter(item => item[key] === value);
      }
    });

    return filtered;
  }

  async exportReport(reportId, format = 'json') {
    try {
      const report = await this.getCachedReport(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      let exportData;
      let filename;
      
      switch (format.toLowerCase()) {
        case 'json':
          exportData = JSON.stringify(report, null, 2);
          filename = `${report.type}_report_${Date.now()}.json`;
          break;
        case 'csv':
          exportData = this.convertToCSV(report.data);
          filename = `${report.type}_report_${Date.now()}.csv`;
          break;
        case 'pdf':
          // In a real app, this would generate PDF
          exportData = this.generatePDFReport(report);
          filename = `${report.type}_report_${Date.now()}.pdf`;
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      return {
        success: true,
        data: exportData,
        filename,
        format,
      };
    } catch (error) {
      console.error('Export report error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  convertToCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  generatePDFReport(report) {
    // Mock PDF generation - in real app would use PDF library
    return `PDF Report: ${report.title}\nGenerated: ${report.generatedAt}\nData: ${report.data.length} records`;
  }

  async cacheReport(report) {
    try {
      this.reportCache.set(report.id, report);
      const key = `report_${report.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(report));
    } catch (error) {
      console.error('Cache report error:', error);
    }
  }

  async getCachedReport(reportId) {
    try {
      // Check memory cache first
      if (this.reportCache.has(reportId)) {
        return this.reportCache.get(reportId);
      }

      // Check AsyncStorage
      const key = `report_${reportId}`;
      const reportData = await AsyncStorage.getItem(key);
      if (reportData) {
        const report = JSON.parse(reportData);
        this.reportCache.set(reportId, report);
        return report;
      }

      return null;
    } catch (error) {
      console.error('Get cached report error:', error);
      return null;
    }
  }

  async getReportHistory() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const reportKeys = keys.filter(key => key.startsWith('report_'));
      
      const reports = [];
      for (const key of reportKeys) {
        try {
          const reportData = await AsyncStorage.getItem(key);
          if (reportData) {
            const report = JSON.parse(reportData);
            reports.push({
              id: report.id,
              type: report.type,
              title: report.title,
              generatedAt: report.generatedAt,
              totalRecords: report.totalRecords || report.data?.length || 0,
            });
          }
        } catch (error) {
          console.warn('Failed to load report:', key, error);
        }
      }

      return reports.sort((a, b) => 
        new Date(b.generatedAt) - new Date(a.generatedAt)
      );
    } catch (error) {
      console.error('Get report history error:', error);
      return [];
    }
  }

  async deleteReport(reportId) {
    try {
      this.reportCache.delete(reportId);
      const key = `report_${reportId}`;
      await AsyncStorage.removeItem(key);
      return { success: true };
    } catch (error) {
      console.error('Delete report error:', error);
      return { success: false, error: error.message };
    }
  }

  generateReportId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `report_${timestamp}_${random}`;
  }

  getReportTemplates() {
    return this.reportTemplates;
  }
}

export const reportsService = new ReportsService();