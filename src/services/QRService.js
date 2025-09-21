import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

class QRService {
  constructor() {
    this.baseURL = 'https://api.ireps.gov.in/v1'; // UDM Portal API
    this.tmsBaseURL = 'https://api.irecept.gov.in/v1'; // TMS Portal API
  }

  async parseQRCode(qrData) {
    try {
      // Parse QR code format: TYPE-LOT-DATE-VENDOR-SERIAL
      const parts = qrData.split('-');
      
      if (parts.length < 5) {
        return {success: false, error: 'Invalid QR code format'};
      }

      const [type, lot, date, vendor, serial] = parts;
      
      // Validate fitting type
      const validTypes = ['RC', 'LN', 'RP', 'SL']; // Rail Clip, Liner, Rail Pad, Sleeper
      if (!validTypes.includes(type)) {
        return {success: false, error: 'Invalid fitting type'};
      }

      // Fetch detailed information from UDM portal
      const fittingDetails = await this.getFittingDetails(qrData);

      return {
        success: true,
        data: {
          qrCode: qrData,
          type: this.getFittingTypeName(type),
          typeCode: type,
          lotNumber: lot,
          manufactureDate: date,
          vendorCode: vendor,
          serialNumber: serial,
          ...fittingDetails,
        },
      };
    } catch (error) {
      console.error('QR parsing error:', error);
      return {success: false, error: 'QR code parsing failed'};
    }
  }

  getFittingTypeName(code) {
    const types = {
      RC: 'Elastic Rail Clip',
      LN: 'Liner',
      RP: 'Rail Pad',
      SL: 'Sleeper',
    };
    return types[code] || 'Unknown';
  }

  async getFittingDetails(qrCode) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await axios.get(`${this.baseURL}/fittings/${qrCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.warn('UDM API error:', error);
      // Return mock data for offline/demo mode
      return this.getMockFittingDetails(qrCode);
    }
  }

  getMockFittingDetails(qrCode) {
    const [type, lot, date, vendor] = qrCode.split('-');
    
    return {
      vendorName: this.getVendorName(vendor),
      specifications: this.getSpecifications(type),
      warrantyPeriod: '24 months',
      supplyDate: this.formatDate(date),
      inspectionHistory: this.getMockInspectionHistory(),
      qualityGrade: 'A',
      location: 'Warehouse-A-Block-3',
      quantity: Math.floor(Math.random() * 1000) + 100,
      unitPrice: this.getUnitPrice(type),
      totalValue: 0, // Will be calculated
      status: 'Good',
      lastInspected: '20/09/2025',
      id: Date.now().toString(),
    };
  }

  getVendorName(code) {
    const vendors = {
      'VND001': 'Bharat Steel Industries',
      'VND002': 'Railway Track Components Ltd',
      'VND003': 'Indian Rail Fittings Corp',
      'VND004': 'Steel Authority of India',
      'VND005': 'Tata Steel Railway Division',
    };
    return vendors[code] || `Vendor ${code}`;
  }

  getSpecifications(type) {
    const specs = {
      RC: {
        material: 'Spring Steel',
        grade: 'Grade 60',
        tensileStrength: '1800-2000 MPa',
        hardness: '52-58 HRC',
        coating: 'Zinc Plated',
      },
      LN: {
        material: 'Cast Iron',
        grade: 'Grade 250',
        dimensions: '165x135x13 mm',
        weight: '0.8 kg',
        finish: 'Shot Blasted',
      },
      RP: {
        material: 'EPDM Rubber',
        hardness: '70±5 Shore A',
        dimensions: '165x135x6 mm',
        density: '1.4 g/cm³',
        temperature: '-40°C to +70°C',
      },
      SL: {
        material: 'Concrete',
        grade: 'M40',
        dimensions: '2600x240x200 mm',
        weight: '280 kg',
        reinforcement: 'PSC',
      },
    };
    return specs[type] || {};
  }

  getUnitPrice(type) {
    const prices = {
      RC: 45.50,
      LN: 32.25,
      RP: 28.75,
      SL: 1450.00,
    };
    return prices[type] || 0;
  }

  getMockInspectionHistory() {
    return [
      {
        date: '2024-09-20',
        type: 'Manufacturing Quality Check',
        inspector: 'QC Team A',
        result: 'Passed',
        grade: 'A',
        remarks: 'All parameters within specification',
      },
      {
        date: '2024-09-21',
        type: 'Pre-dispatch Inspection',
        inspector: 'QA Inspector',
        result: 'Passed',
        grade: 'A',
        remarks: 'Ready for dispatch',
      },
    ];
  }

  formatDate(dateStr) {
    // Convert YYYYMMDD to readable format
    if (dateStr.length === 8) {
      const year = dateStr.substr(0, 4);
      const month = dateStr.substr(4, 2);
      const day = dateStr.substr(6, 2);
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  }

  async syncWithTMS(fittingData) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await axios.post(`${this.tmsBaseURL}/track-fittings/sync`, {
        qrCode: fittingData.qrCode,
        scanLocation: fittingData.location,
        scanTime: new Date().toISOString(),
        inspectionData: fittingData.inspectionData,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('TMS sync error:', error);
      return {success: false, error: 'TMS sync failed'};
    }
  }
}

export const qrService = new QRService();