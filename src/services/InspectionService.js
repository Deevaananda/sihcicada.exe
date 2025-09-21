import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

class InspectionService {
  constructor() {
    this.baseURL = 'https://api.ireps.gov.in/v1/inspections';
    this.tmsBaseURL = 'https://api.irecept.gov.in/v1/inspections';
  }

  async submitInspection(inspectionData) {
    try {
      // Validate inspection data
      const validation = this.validateInspectionData(inspectionData);
      if (!validation.valid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      // Prepare inspection payload
      const payload = this.prepareInspectionPayload(inspectionData);

      // Submit to UDM portal
      const udmResult = await this.submitToUDM(payload);
      
      // Submit to TMS portal
      const tmsResult = await this.submitToTMS(payload);

      // Store locally for offline access
      await this.storeInspectionLocally(payload);

      // Generate inspection report
      const reportId = await this.generateInspectionReport(inspectionData);

      return {
        success: true,
        inspectionId: payload.inspectionId,
        reportId: reportId,
        udmStatus: udmResult.success,
        tmsStatus: tmsResult.success,
        message: 'Inspection submitted successfully',
      };
    } catch (error) {
      console.error('Inspection submission error:', error);
      return { success: false, error: 'Failed to submit inspection' };
    }
  }

  validateInspectionData(data) {
    const errors = [];

    if (!data.qrCode) {
      errors.push('QR Code is required');
    }

    if (!data.inspectorName) {
      errors.push('Inspector name is required');
    }

    if (!data.inspectionType) {
      errors.push('Inspection type is required');
    }

    // Validate QR code format
    if (data.qrCode && !this.isValidQRCode(data.qrCode)) {
      errors.push('Invalid QR code format');
    }

    // Validate dimensional data if provided
    if (data.dimensionalCheck) {
      if (data.dimensionalCheck.length && isNaN(data.dimensionalCheck.length)) {
        errors.push('Invalid length measurement');
      }
      if (data.dimensionalCheck.width && isNaN(data.dimensionalCheck.width)) {
        errors.push('Invalid width measurement');
      }
    }

    // Validate material data
    if (data.materialCheck && data.materialCheck.hardness && isNaN(data.materialCheck.hardness)) {
      errors.push('Invalid hardness value');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  isValidQRCode(qrCode) {
    const pattern = /^(RC|LN|RP|SL)-\w+-\d{8}-VND\d{3}-\d{5}$/;
    return pattern.test(qrCode);
  }

  prepareInspectionPayload(data) {
    return {
      inspectionId: this.generateInspectionId(),
      qrCode: data.qrCode,
      inspectorName: data.inspectorName,
      inspectionType: data.inspectionType,
      timestamp: new Date().toISOString(),
      location: data.location || 'Unknown',
      visualInspection: {
        cracks: data.visualCheck.cracks || false,
        corrosion: data.visualCheck.corrosion || false,
        deformation: data.visualCheck.deformation || false,
        surfaceDamage: data.visualCheck.surfaceDamage || false,
        overallCondition: this.calculateVisualCondition(data.visualCheck),
      },
      dimensionalMeasurements: {
        length: parseFloat(data.dimensionalCheck.length) || null,
        width: parseFloat(data.dimensionalCheck.width) || null,
        height: parseFloat(data.dimensionalCheck.height) || null,
        toleranceStatus: data.dimensionalCheck.tolerance,
        accuracy: this.calculateDimensionalAccuracy(data.dimensionalCheck),
      },
      materialProperties: {
        hardness: parseFloat(data.materialCheck.hardness) || null,
        tensileStrength: data.materialCheck.tensileStrength,
        chemicalComposition: data.materialCheck.chemicalComposition,
        materialGrade: this.determineMaterialGrade(data.materialCheck),
      },
      functionalAssessment: {
        fitment: data.functionalCheck.fitment,
        performance: data.functionalCheck.performance,
        operationalStatus: this.assessOperationalStatus(data.functionalCheck),
      },
      overallAssessment: {
        grade: data.overallGrade,
        passStatus: this.determinePassStatus(data),
        riskLevel: this.assessRiskLevel(data),
        nextInspectionDate: this.calculateNextInspectionDate(data),
      },
      remarks: data.remarks || '',
      recommendations: data.recommendations || [],
      photos: data.photos || [],
      inspectorSignature: this.generateInspectorSignature(data.inspectorName),
      qualityScore: this.calculateQualityScore(data),
    };
  }

  generateInspectionId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `INS-${timestamp}-${random}`;
  }

  calculateVisualCondition(visualCheck) {
    const defects = Object.values(visualCheck).filter(v => v).length;
    if (defects === 0) return 'Excellent';
    if (defects <= 1) return 'Good';
    if (defects <= 2) return 'Fair';
    return 'Poor';
  }

  calculateDimensionalAccuracy(dimensionalCheck) {
    if (dimensionalCheck.tolerance === 'within') return 'High';
    if (dimensionalCheck.tolerance === 'marginal') return 'Medium';
    return 'Low';
  }

  determineMaterialGrade(materialCheck) {
    if (materialCheck.tensileStrength === 'pass' && materialCheck.chemicalComposition === 'pass') {
      return 'A';
    } else if (materialCheck.tensileStrength === 'pass' || materialCheck.chemicalComposition === 'pass') {
      return 'B';
    }
    return 'C';
  }

  assessOperationalStatus(functionalCheck) {
    if (functionalCheck.fitment === 'good' && functionalCheck.performance === 'satisfactory') {
      return 'Operational';
    } else if (functionalCheck.fitment === 'fair' || functionalCheck.performance === 'acceptable') {
      return 'Conditional';
    }
    return 'Non-Operational';
  }

  determinePassStatus(data) {
    const visualDefects = Object.values(data.visualCheck).filter(v => v).length;
    const dimensionalPass = data.dimensionalCheck.tolerance === 'within';
    const materialPass = data.materialCheck.tensileStrength === 'pass';
    
    return visualDefects === 0 && dimensionalPass && materialPass;
  }

  assessRiskLevel(data) {
    const visualDefects = Object.values(data.visualCheck).filter(v => v).length;
    const dimensionalPass = data.dimensionalCheck.tolerance === 'within';
    const materialPass = data.materialCheck.tensileStrength === 'pass';
    
    if (visualDefects > 2 || !dimensionalPass || !materialPass) {
      return 'High';
    } else if (visualDefects > 0 || data.dimensionalCheck.tolerance === 'marginal') {
      return 'Medium';
    }
    return 'Low';
  }

  calculateNextInspectionDate(data) {
    const now = new Date();
    let monthsToAdd = 6; // Default 6 months

    // Adjust based on grade and risk
    if (data.overallGrade === 'C') {
      monthsToAdd = 3;
    } else if (data.overallGrade === 'A') {
      monthsToAdd = 12;
    }

    // Adjust based on inspection type
    if (data.inspectionType === 'emergency') {
      monthsToAdd = 1;
    }

    const nextDate = new Date(now);
    nextDate.setMonth(nextDate.getMonth() + monthsToAdd);
    
    return nextDate.toISOString().split('T')[0];
  }

  generateInspectorSignature(inspectorName) {
    // Generate a simple signature hash
    const timestamp = Date.now();
    return btoa(`${inspectorName}-${timestamp}`);
  }

  calculateQualityScore(data) {
    let score = 100;

    // Visual inspection impact
    const visualDefects = Object.values(data.visualCheck).filter(v => v).length;
    score -= visualDefects * 10;

    // Dimensional check impact
    if (data.dimensionalCheck.tolerance === 'marginal') {
      score -= 5;
    } else if (data.dimensionalCheck.tolerance === 'outside') {
      score -= 15;
    }

    // Material check impact
    if (data.materialCheck.tensileStrength === 'fail') {
      score -= 20;
    }
    if (data.materialCheck.chemicalComposition === 'fail') {
      score -= 15;
    }

    // Functional check impact
    if (data.functionalCheck.performance === 'poor') {
      score -= 25;
    } else if (data.functionalCheck.performance === 'acceptable') {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  async submitToUDM(payload) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await axios.post(`${this.baseURL}/submit`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.warn('UDM submission error:', error);
      return { success: false, error: error.message };
    }
  }

  async submitToTMS(payload) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await axios.post(`${this.tmsBaseURL}/submit`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.warn('TMS submission error:', error);
      return { success: false, error: error.message };
    }
  }

  async storeInspectionLocally(payload) {
    try {
      const existingInspections = await AsyncStorage.getItem('localInspections');
      const inspections = existingInspections ? JSON.parse(existingInspections) : [];
      
      inspections.push(payload);
      
      // Keep only last 100 inspections
      if (inspections.length > 100) {
        inspections.splice(0, inspections.length - 100);
      }
      
      await AsyncStorage.setItem('localInspections', JSON.stringify(inspections));
    } catch (error) {
      console.error('Local storage error:', error);
    }
  }

  async getLocalInspections() {
    try {
      const data = await AsyncStorage.getItem('localInspections');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Local retrieval error:', error);
      return [];
    }
  }

  async generateInspectionReport(inspectionData) {
    try {
      const reportId = `RPT-${Date.now()}`;
      
      const report = {
        reportId,
        generatedAt: new Date().toISOString(),
        qrCode: inspectionData.qrCode,
        inspector: inspectionData.inspectorName,
        type: inspectionData.inspectionType,
        summary: this.generateReportSummary(inspectionData),
        recommendations: inspectionData.recommendations,
        nextActions: this.generateNextActions(inspectionData),
        complianceStatus: this.checkCompliance(inspectionData),
      };

      // Store report locally
      await this.storeReportLocally(report);

      return reportId;
    } catch (error) {
      console.error('Report generation error:', error);
      return null;
    }
  }

  generateReportSummary(data) {
    const passStatus = this.determinePassStatus(data) ? 'PASSED' : 'FAILED';
    const riskLevel = this.assessRiskLevel(data);
    const qualityScore = this.calculateQualityScore(data);
    
    return {
      result: passStatus,
      grade: data.overallGrade,
      riskLevel,
      qualityScore,
      keyFindings: this.extractKeyFindings(data),
    };
  }

  extractKeyFindings(data) {
    const findings = [];
    
    const visualDefects = Object.entries(data.visualCheck)
      .filter(([key, value]) => value)
      .map(([key, value]) => key);
    
    if (visualDefects.length > 0) {
      findings.push(`Visual defects found: ${visualDefects.join(', ')}`);
    }
    
    if (data.dimensionalCheck.tolerance !== 'within') {
      findings.push(`Dimensional tolerance: ${data.dimensionalCheck.tolerance}`);
    }
    
    if (data.materialCheck.tensileStrength === 'fail') {
      findings.push('Tensile strength test failed');
    }
    
    if (findings.length === 0) {
      findings.push('All inspection parameters within acceptable limits');
    }
    
    return findings;
  }

  generateNextActions(data) {
    const actions = [];
    
    if (!this.determinePassStatus(data)) {
      actions.push({
        action: 'Immediate remedial measures required',
        priority: 'High',
        timeline: 'Within 24 hours',
        responsible: 'Maintenance Team',
      });
    }
    
    if (this.assessRiskLevel(data) === 'High') {
      actions.push({
        action: 'Increase monitoring frequency',
        priority: 'High',
        timeline: 'Immediate',
        responsible: 'Quality Team',
      });
    }
    
    actions.push({
      action: `Next inspection due: ${this.calculateNextInspectionDate(data)}`,
      priority: 'Medium',
      timeline: 'As scheduled',
      responsible: 'Inspection Team',
    });
    
    return actions;
  }

  checkCompliance(data) {
    const requirements = {
      visualInspection: 'Required',
      dimensionalCheck: 'Required',
      materialTest: 'Required',
      documentation: 'Complete',
    };
    
    const compliance = {
      visualInspection: Object.values(data.visualCheck).some(v => v !== undefined),
      dimensionalCheck: data.dimensionalCheck.tolerance !== undefined,
      materialTest: data.materialCheck.tensileStrength !== undefined,
      documentation: data.inspectorName && data.qrCode,
    };
    
    const overallCompliance = Object.values(compliance).every(c => c);
    
    return {
      overall: overallCompliance ? 'Compliant' : 'Non-Compliant',
      details: compliance,
      requirements,
    };
  }

  async storeReportLocally(report) {
    try {
      const existingReports = await AsyncStorage.getItem('inspectionReports');
      const reports = existingReports ? JSON.parse(existingReports) : [];
      
      reports.push(report);
      
      // Keep only last 50 reports
      if (reports.length > 50) {
        reports.splice(0, reports.length - 50);
      }
      
      await AsyncStorage.setItem('inspectionReports', JSON.stringify(reports));
    } catch (error) {
      console.error('Report storage error:', error);
    }
  }

  async getInspectionHistory(qrCode) {
    try {
      const localInspections = await this.getLocalInspections();
      const history = localInspections.filter(inspection => inspection.qrCode === qrCode);
      
      return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('History retrieval error:', error);
      return [];
    }
  }

  async getInspectionTemplates() {
    return {
      routine: {
        name: 'Routine Inspection',
        description: 'Standard periodic inspection',
        requiredChecks: ['visual', 'dimensional'],
        frequency: 'Quarterly',
      },
      detailed: {
        name: 'Detailed Inspection',
        description: 'Comprehensive inspection with material testing',
        requiredChecks: ['visual', 'dimensional', 'material', 'functional'],
        frequency: 'Annually',
      },
      emergency: {
        name: 'Emergency Inspection',
        description: 'Immediate inspection due to safety concerns',
        requiredChecks: ['visual', 'functional'],
        frequency: 'As needed',
      },
    };
  }

  async syncPendingInspections() {
    try {
      const localInspections = await this.getLocalInspections();
      const pendingSync = localInspections.filter(inspection => !inspection.synced);
      
      let successCount = 0;
      let failCount = 0;
      
      for (const inspection of pendingSync) {
        const udmResult = await this.submitToUDM(inspection);
        const tmsResult = await this.submitToTMS(inspection);
        
        if (udmResult.success || tmsResult.success) {
          inspection.synced = true;
          successCount++;
        } else {
          failCount++;
        }
      }
      
      // Update local storage
      await AsyncStorage.setItem('localInspections', JSON.stringify(localInspections));
      
      return {
        success: true,
        synced: successCount,
        failed: failCount,
        total: pendingSync.length,
      };
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false, error: error.message };
    }
  }
}

export const inspectionService = new InspectionService();