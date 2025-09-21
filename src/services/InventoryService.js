import AsyncStorage from '@react-native-async-storage/async-storage';
import {qrService} from './QRService';

class InventoryService {
  constructor() {
    this.cacheKey = 'inventory_data';
    this.cacheExpiry = 10 * 60 * 1000; // 10 minutes
  }

  async getInventory(params = {}) {
    try {
      const { filter = 'All', sortBy = 'date', search = '' } = params;
      
      // Get mock inventory data
      let inventoryData = await this.getMockInventoryData();
      
      // Apply filters
      if (filter !== 'All') {
        inventoryData = inventoryData.filter(item => item.type === filter);
      }
      
      // Apply search
      if (search) {
        inventoryData = inventoryData.filter(item =>
          item.qrCode.toLowerCase().includes(search.toLowerCase()) ||
          item.lotNumber.toLowerCase().includes(search.toLowerCase()) ||
          item.vendorName.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      // Apply sorting
      inventoryData = this.sortInventory(inventoryData, sortBy);
      
      return inventoryData;
    } catch (error) {
      console.error('Inventory service error:', error);
      return [];
    }
  }

  async getMockInventoryData() {
    const fittingTypes = ['Elastic Rail Clip', 'Liner', 'Rail Pad', 'Sleeper'];
    const typeCodes = ['RC', 'LN', 'RP', 'SL'];
    const statuses = ['Good', 'Warning', 'Critical'];
    const vendors = [
      'Bharat Steel Industries',
      'Railway Track Components Ltd',
      'Indian Rail Fittings Corp',
      'Steel Authority of India',
      'Tata Steel Railway Division',
    ];
    const locations = [
      'Warehouse-A-Block-1',
      'Warehouse-A-Block-2',
      'Warehouse-B-Block-1',
      'Warehouse-C-Block-3',
      'Depot-North-Section-2',
      'Depot-South-Section-1',
    ];

    const inventory = [];
    
    for (let i = 0; i < 50; i++) {
      const typeIndex = Math.floor(Math.random() * fittingTypes.length);
      const type = fittingTypes[typeIndex];
      const typeCode = typeCodes[typeIndex];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const vendor = vendors[Math.floor(Math.random() * vendors.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      
      const lotNumber = `LOT${String(Math.floor(Math.random() * 900000) + 100000)}`;
      const vendorCode = `VND00${Math.floor(Math.random() * 5) + 1}`;
      const date = this.getRandomDate();
      const serial = String(Math.floor(Math.random() * 90000) + 10000);
      const qrCode = `${typeCode}-${lotNumber}-${date}-${vendorCode}-${serial}`;
      
      inventory.push({
        id: `inv_${i + 1}`,
        qrCode,
        type,
        typeCode,
        lotNumber,
        vendorName: vendor,
        vendorCode,
        status,
        location,
        quantity: Math.floor(Math.random() * 5000) + 500,
        unitPrice: this.getUnitPrice(typeCode),
        manufactureDate: this.formatDate(date),
        supplyDate: this.formatDate(date),
        lastInspected: this.getRandomInspectionDate(),
        qualityGrade: this.getRandomGrade(),
        warrantyPeriod: '24 months',
        specifications: qrService.getSpecifications(typeCode),
        inspectionHistory: this.getMockInspectionHistory(),
      });
    }
    
    return inventory;
  }

  getRandomDate() {
    const year = 2024;
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  formatDate(dateStr) {
    if (dateStr.length === 8) {
      const year = dateStr.substr(0, 4);
      const month = dateStr.substr(4, 2);
      const day = dateStr.substr(6, 2);
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  }

  getRandomInspectionDate() {
    const daysAgo = Math.floor(Math.random() * 90) + 1;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toLocaleDateString('en-IN');
  }

  getRandomGrade() {
    const grades = ['A', 'A', 'A', 'B', 'B', 'C']; // Weighted towards A
    return grades[Math.floor(Math.random() * grades.length)];
  }

  getUnitPrice(typeCode) {
    const prices = {
      RC: 45.50,
      LN: 32.25,
      RP: 28.75,
      SL: 1450.00,
    };
    return prices[typeCode] || 0;
  }

  getMockInspectionHistory() {
    const history = [];
    const inspectionTypes = [
      'Manufacturing Quality Check',
      'Pre-dispatch Inspection',
      'Routine Inspection',
      'Detailed Inspection',
    ];
    const inspectors = [
      'QC Team A',
      'QA Inspector',
      'Field Inspector',
      'Senior QC Officer',
    ];
    
    const numInspections = Math.floor(Math.random() * 4) + 1;
    
    for (let i = 0; i < numInspections; i++) {
      const daysAgo = Math.floor(Math.random() * 180) + 1;
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      
      history.push({
        date: date.toLocaleDateString('en-IN'),
        type: inspectionTypes[Math.floor(Math.random() * inspectionTypes.length)],
        inspector: inspectors[Math.floor(Math.random() * inspectors.length)],
        result: Math.random() > 0.1 ? 'Passed' : 'Failed',
        grade: this.getRandomGrade(),
        remarks: 'Standard inspection completed successfully',
      });
    }
    
    return history.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  sortInventory(inventory, sortBy) {
    switch (sortBy) {
      case 'date':
        return inventory.sort((a, b) => new Date(b.supplyDate) - new Date(a.supplyDate));
      case 'quantity':
        return inventory.sort((a, b) => b.quantity - a.quantity);
      case 'status':
        const statusOrder = { Critical: 3, Warning: 2, Good: 1 };
        return inventory.sort((a, b) => (statusOrder[b.status] || 0) - (statusOrder[a.status] || 0));
      case 'type':
        return inventory.sort((a, b) => a.type.localeCompare(b.type));
      case 'location':
        return inventory.sort((a, b) => a.location.localeCompare(b.location));
      default:
        return inventory;
    }
  }

  async getInventoryStats() {
    try {
      const inventory = await this.getMockInventoryData();
      
      const stats = {
        totalItems: inventory.length,
        byType: this.groupBy(inventory, 'type'),
        byStatus: this.groupBy(inventory, 'status'),
        byLocation: this.groupBy(inventory, 'location'),
        byVendor: this.groupBy(inventory, 'vendorName'),
        totalValue: inventory.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
        averageAge: this.calculateAverageAge(inventory),
        criticalItems: inventory.filter(item => item.status === 'Critical').length,
        lowStockItems: this.getLowStockItems(inventory),
      };
      
      return stats;
    } catch (error) {
      console.error('Inventory stats error:', error);
      return null;
    }
  }

  groupBy(array, key) {
    return array.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) {
        result[group] = 0;
      }
      result[group] += item.quantity;
      return result;
    }, {});
  }

  calculateAverageAge(inventory) {
    const totalAge = inventory.reduce((sum, item) => {
      const supplyDate = new Date(item.supplyDate.split('/').reverse().join('-'));
      const ageInDays = Math.floor((new Date() - supplyDate) / (1000 * 60 * 60 * 24));
      return sum + ageInDays;
    }, 0);
    
    return Math.round(totalAge / inventory.length);
  }

  getLowStockItems(inventory) {
    // Define minimum stock levels by type
    const minLevels = {
      'Elastic Rail Clip': 1000,
      'Liner': 500,
      'Rail Pad': 750,
      'Sleeper': 100,
    };
    
    return inventory.filter(item => {
      const minLevel = minLevels[item.type] || 500;
      return item.quantity < minLevel;
    });
  }

  async updateItemStatus(qrCode, newStatus, remarks) {
    try {
      // In a real app, this would update the backend
      console.log(`Updating ${qrCode} status to ${newStatus}:`, remarks);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true, message: 'Status updated successfully' };
    } catch (error) {
      console.error('Status update error:', error);
      return { success: false, error: 'Failed to update status' };
    }
  }

  async exportInventoryData(format = 'csv', filters = {}) {
    try {
      const inventory = await this.getInventory(filters);
      
      if (format === 'csv') {
        return this.convertToCSV(inventory);
      } else if (format === 'json') {
        return JSON.stringify(inventory, null, 2);
      }
      
      return null;
    } catch (error) {
      console.error('Export error:', error);
      return null;
    }
  }

  convertToCSV(inventory) {
    const headers = [
      'QR Code',
      'Type',
      'Lot Number',
      'Vendor',
      'Status',
      'Location',
      'Quantity',
      'Unit Price',
      'Supply Date',
      'Last Inspected',
      'Quality Grade',
    ];
    
    const rows = inventory.map(item => [
      item.qrCode,
      item.type,
      item.lotNumber,
      item.vendorName,
      item.status,
      item.location,
      item.quantity,
      item.unitPrice,
      item.supplyDate,
      item.lastInspected,
      item.qualityGrade,
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    return csvContent;
  }

  async searchInventory(query, filters = {}) {
    try {
      const inventory = await this.getMockInventoryData();
      
      let results = inventory.filter(item => {
        const searchFields = [
          item.qrCode,
          item.type,
          item.lotNumber,
          item.vendorName,
          item.location,
        ].join(' ').toLowerCase();
        
        return searchFields.includes(query.toLowerCase());
      });
      
      // Apply additional filters
      if (filters.type && filters.type !== 'All') {
        results = results.filter(item => item.type === filters.type);
      }
      
      if (filters.status) {
        results = results.filter(item => item.status === filters.status);
      }
      
      if (filters.location) {
        results = results.filter(item => item.location === filters.location);
      }
      
      return results;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  async getInventoryAlerts() {
    try {
      const inventory = await this.getMockInventoryData();
      const alerts = [];
      
      // Low stock alerts
      const lowStockItems = this.getLowStockItems(inventory);
      lowStockItems.forEach(item => {
        alerts.push({
          type: 'Low Stock',
          severity: item.quantity < 100 ? 'High' : 'Medium',
          item: item.qrCode,
          message: `${item.type} stock is low (${item.quantity} units)`,
          location: item.location,
          action: 'Reorder required',
        });
      });
      
      // Quality alerts
      const qualityIssues = inventory.filter(item => item.status === 'Critical');
      qualityIssues.forEach(item => {
        alerts.push({
          type: 'Quality Issue',
          severity: 'High',
          item: item.qrCode,
          message: `Critical quality issue detected`,
          location: item.location,
          action: 'Immediate inspection required',
        });
      });
      
      // Aging alerts
      const currentDate = new Date();
      const agingItems = inventory.filter(item => {
        const supplyDate = new Date(item.supplyDate.split('/').reverse().join('-'));
        const ageInMonths = (currentDate - supplyDate) / (1000 * 60 * 60 * 24 * 30);
        return ageInMonths > 18; // Items older than 18 months
      });
      
      agingItems.forEach(item => {
        alerts.push({
          type: 'Aging Inventory',
          severity: 'Medium',
          item: item.qrCode,
          message: `Item has been in stock for over 18 months`,
          location: item.location,
          action: 'Consider priority usage or inspection',
        });
      });
      
      return alerts.sort((a, b) => {
        const severityOrder = { High: 3, Medium: 2, Low: 1 };
        return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
      });
    } catch (error) {
      console.error('Alerts error:', error);
      return [];
    }
  }
}

export const inventoryService = new InventoryService();