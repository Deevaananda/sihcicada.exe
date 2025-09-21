import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AIService {
  constructor() {
    this.aiEndpoint = 'https://api.railway-ai.gov.in/v1/analyze';
  }

  async analyzeFitting(fittingData) {
    try {
      // Simulate AI analysis with realistic data
      const analysis = await this.performAnalysis(fittingData);
      return analysis;
    } catch (error) {
      console.error('AI analysis error:', error);
      // Return mock analysis for demo
      return this.getMockAnalysis(fittingData);
    }
  }

  getMockAnalysis(fittingData) {
    const baseScore = this.calculateBaseScore(fittingData);
    const riskFactors = this.identifyRiskFactors(fittingData);
    const predictions = this.generatePredictions(fittingData);

    return {
      performanceScore: baseScore,
      riskLevel: this.determineRiskLevel(baseScore, riskFactors),
      expectedLife: predictions.expectedLife,
      maintenanceSchedule: predictions.maintenanceSchedule,
      qualityAssessment: {
        overall: fittingData.qualityGrade,
        dimensionalAccuracy: 'Within tolerance',
        materialCompliance: 'Meets standards',
        surfaceFinish: 'Good condition',
      },
      riskFactors,
      recommendations: this.generateRecommendations(fittingData, riskFactors),
      predictiveInsights: {
        failureProbability: predictions.failureProbability,
        optimalReplacementDate: predictions.optimalReplacementDate,
        costOptimization: predictions.costOptimization,
      },
      benchmarkComparison: this.getBenchmarkData(fittingData.type),
      trendAnalysis: this.generateTrendAnalysis(fittingData),
      anomalyDetection: this.detectAnomalies(fittingData),
    };
  }

  calculateBaseScore(fittingData) {
    let score = 85; // Base score

    // Age factor
    const ageInDays = this.calculateAge(fittingData.supplyDate);
    if (ageInDays > 365) score -= 5;
    if (ageInDays > 730) score -= 10;

    // Quality grade impact
    switch (fittingData.qualityGrade) {
      case 'A': score += 10; break;
      case 'B': score += 5; break;
      case 'C': score -= 5; break;
    }

    // Inspection history impact
    if (fittingData.inspectionHistory) {
      const passedInspections = fittingData.inspectionHistory.filter(
        i => i.result === 'Passed'
      ).length;
      const totalInspections = fittingData.inspectionHistory.length;
      
      if (totalInspections > 0) {
        const passRate = (passedInspections / totalInspections) * 100;
        score += (passRate - 80) * 0.2;
      }
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  identifyRiskFactors(fittingData) {
    const factors = [];

    // Age-based risks
    const ageInDays = this.calculateAge(fittingData.supplyDate);
    if (ageInDays > 365) {
      factors.push({
        factor: 'Aging Components',
        severity: ageInDays > 730 ? 'High' : 'Medium',
        description: `Item is ${Math.round(ageInDays/30)} months old`,
        impact: 'Increased wear and potential failure risk',
      });
    }

    // Quality grade risks
    if (fittingData.qualityGrade === 'C') {
      factors.push({
        factor: 'Quality Concerns',
        severity: 'High',
        description: 'Low quality grade requires frequent monitoring',
        impact: 'Higher failure probability and maintenance costs',
      });
    }

    // Vendor-based risks
    if (fittingData.vendorCode === 'VND003') {
      factors.push({
        factor: 'Vendor Performance',
        severity: 'Medium',
        description: 'Historical quality issues with this vendor',
        impact: 'May require additional quality checks',
      });
    }

    // Environmental risks based on type
    if (fittingData.typeCode === 'RP') {
      factors.push({
        factor: 'Environmental Degradation',
        severity: 'Medium',
        description: 'Rubber components susceptible to weather',
        impact: 'UV and temperature exposure may accelerate aging',
      });
    }

    // Usage intensity risks
    factors.push({
      factor: 'High Traffic Load',
      severity: 'Medium',
      description: 'Heavy freight traffic increases stress',
      impact: 'Accelerated wear patterns and fatigue',
    });

    return factors;
  }

  generatePredictions(fittingData) {
    const baseLifeExpectancy = this.getBaseLifeExpectancy(fittingData.typeCode);
    const ageInDays = this.calculateAge(fittingData.supplyDate);
    
    return {
      expectedLife: `${Math.round((baseLifeExpectancy - ageInDays) / 365 * 10) / 10} years remaining`,
      failureProbability: `${Math.min(95, Math.max(5, Math.round((ageInDays / baseLifeExpectancy) * 100)))}%`,
      optimalReplacementDate: this.calculateOptimalReplacementDate(fittingData),
      maintenanceSchedule: this.generateMaintenanceSchedule(fittingData),
      costOptimization: this.calculateCostOptimization(fittingData),
    };
  }

  getBaseLifeExpectancy(typeCode) {
    const lifespans = {
      RC: 2555, // 7 years in days
      LN: 3650, // 10 years in days
      RP: 1825, // 5 years in days
      SL: 10950, // 30 years in days
    };
    return lifespans[typeCode] || 2555;
  }

  calculateAge(supplyDate) {
    const supply = new Date(supplyDate.split('/').reverse().join('-'));
    const now = new Date();
    return Math.floor((now - supply) / (1000 * 60 * 60 * 24));
  }

  determineRiskLevel(score, riskFactors) {
    if (score < 60 || riskFactors.some(f => f.severity === 'High')) {
      return 'High';
    } else if (score < 80 || riskFactors.some(f => f.severity === 'Medium')) {
      return 'Medium';
    }
    return 'Low';
  }

  generateRecommendations(fittingData, riskFactors) {
    const recommendations = [];

    if (riskFactors.length > 0) {
      recommendations.push({
        priority: 'High',
        action: 'Increase inspection frequency to monthly',
        reason: 'Multiple risk factors identified',
        timeline: 'Immediate',
      });
    }

    if (fittingData.qualityGrade === 'C') {
      recommendations.push({
        priority: 'High',
        action: 'Consider early replacement within 6 months',
        reason: 'Low quality grade indicates potential issues',
        timeline: '6 months',
      });
    }

    recommendations.push({
      priority: 'Medium',
      action: 'Monitor for wear patterns during routine inspections',
      reason: 'Preventive maintenance best practice',
      timeline: 'Ongoing',
    });

    recommendations.push({
      priority: 'Medium',
      action: 'Ensure proper installation torque specifications',
      reason: 'Critical for component performance',
      timeline: 'Next maintenance',
    });

    if (fittingData.typeCode === 'RP') {
      recommendations.push({
        priority: 'Medium',
        action: 'Check for rubber degradation and cracking',
        reason: 'Rubber components are vulnerable to environmental factors',
        timeline: 'Quarterly',
      });
    }

    return recommendations;
  }

  calculateOptimalReplacementDate(fittingData) {
    const ageInDays = this.calculateAge(fittingData.supplyDate);
    const baseLife = this.getBaseLifeExpectancy(fittingData.typeCode);
    const replacementDate = new Date();
    replacementDate.setDate(replacementDate.getDate() + (baseLife - ageInDays - 30)); // 30 days before end of life
    
    return replacementDate.toLocaleDateString('en-IN');
  }

  generateMaintenanceSchedule(fittingData) {
    const schedules = {
      RC: 'Quarterly inspection and lubrication',
      LN: 'Semi-annual dimensional check',
      RP: 'Monthly visual inspection for cracks',
      SL: 'Annual comprehensive inspection',
    };
    return schedules[fittingData.typeCode] || 'Quarterly inspection';
  }

  calculateCostOptimization(fittingData) {
    const currentValue = fittingData.quantity * fittingData.unitPrice;
    return {
      currentValue: `₹${currentValue.toLocaleString('en-IN')}`,
      replacementCost: `₹${(currentValue * 1.1).toLocaleString('en-IN')}`,
      potentialSavings: `₹${(currentValue * 0.15).toLocaleString('en-IN')}`,
      maintenanceCost: `₹${(currentValue * 0.05).toLocaleString('en-IN')}`,
    };
  }

  getBenchmarkData(fittingType) {
    const benchmarks = {
      'Elastic Rail Clip': {
        industryAverage: 82,
        bestPractice: 92,
        worstCase: 65,
        yourScore: 88,
      },
      'Liner': {
        industryAverage: 85,
        bestPractice: 94,
        worstCase: 70,
        yourScore: 90,
      },
      'Rail Pad': {
        industryAverage: 78,
        bestPractice: 88,
        worstCase: 60,
        yourScore: 82,
      },
      'Sleeper': {
        industryAverage: 88,
        bestPractice: 96,
        worstCase: 75,
        yourScore: 91,
      },
    };
    
    return benchmarks[fittingType] || benchmarks['Elastic Rail Clip'];
  }

  generateTrendAnalysis(fittingData) {
    return {
      qualityTrend: 'Stable',
      performanceTrend: 'Improving',
      costTrend: 'Decreasing',
      reliabilityTrend: 'Stable',
      insights: [
        'Quality metrics have remained consistent over the past 6 months',
        'Performance improvements noted after vendor quality program',
        'Cost optimization through bulk procurement strategies',
      ],
    };
  }

  detectAnomalies(fittingData) {
    const anomalies = [];

    // Simulated anomaly detection
    if (fittingData.qualityGrade === 'C' && fittingData.vendorCode === 'VND001') {
      anomalies.push({
        type: 'Quality Anomaly',
        severity: 'High',
        description: 'Unexpected quality grade from typically high-performing vendor',
        recommendation: 'Investigate batch-specific issues',
      });
    }

    return anomalies;
  }

  async generateDetailedReport(fittingData) {
    try {
      const analysis = await this.analyzeFitting(fittingData);
      
      return {
        executiveSummary: this.generateExecutiveSummary(analysis),
        detailedAnalysis: analysis,
        actionItems: this.extractActionItems(analysis),
        riskMatrix: this.generateRiskMatrix(analysis),
        costBenefitAnalysis: this.generateCostBenefitAnalysis(fittingData, analysis),
      };
    } catch (error) {
      console.error('Detailed report generation error:', error);
      throw error;
    }
  }

  generateExecutiveSummary(analysis) {
    return {
      overallHealth: analysis.performanceScore >= 80 ? 'Good' : analysis.performanceScore >= 60 ? 'Fair' : 'Poor',
      keyFindings: [
        `Performance score: ${analysis.performanceScore}/100`,
        `Risk level: ${analysis.riskLevel}`,
        `${analysis.riskFactors.length} risk factors identified`,
        `${analysis.recommendations.length} recommendations provided`,
      ],
      immediateActions: analysis.recommendations.filter(r => r.priority === 'High').length,
      estimatedSavings: analysis.predictiveInsights.costOptimization.potentialSavings,
    };
  }

  extractActionItems(analysis) {
    return analysis.recommendations.map((rec, index) => ({
      id: index + 1,
      priority: rec.priority,
      action: rec.action,
      timeline: rec.timeline,
      owner: 'Maintenance Team',
      status: 'Pending',
    }));
  }

  generateRiskMatrix(analysis) {
    return {
      highRisk: analysis.riskFactors.filter(f => f.severity === 'High').length,
      mediumRisk: analysis.riskFactors.filter(f => f.severity === 'Medium').length,
      lowRisk: analysis.riskFactors.filter(f => f.severity === 'Low').length,
      totalRiskScore: analysis.riskFactors.reduce((total, factor) => {
        const scores = { High: 3, Medium: 2, Low: 1 };
        return total + scores[factor.severity];
      }, 0),
    };
  }

  generateCostBenefitAnalysis(fittingData, analysis) {
    const currentValue = fittingData.quantity * fittingData.unitPrice;
    const maintenanceCost = currentValue * 0.05;
    const replacementCost = currentValue * 1.1;
    
    return {
      currentInvestment: `₹${currentValue.toLocaleString('en-IN')}`,
      annualMaintenanceCost: `₹${maintenanceCost.toLocaleString('en-IN')}`,
      replacementCost: `₹${replacementCost.toLocaleString('en-IN')}`,
      potentialSavings: analysis.predictiveInsights.costOptimization.potentialSavings,
      roi: '15-25% through predictive maintenance',
      paybackPeriod: '2-3 years',
    };
  }
}

export const aiService = new AIService();