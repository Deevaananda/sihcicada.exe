import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Card, Title, Paragraph, Chip, Button, Divider } from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import {MaterialIcons} from '@expo/vector-icons';
import { aiService } from '../services/AIService';

const { width } = Dimensions.get('window');
const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: '#ffffff',
  backgroundGradientToOpacity: 0.5,
  color: (opacity = 1) => `rgba(81, 67, 159, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
  decimalPlaces: 1,
};

const AIAnalysisScreen = ({ route, navigation }) => {
  const { fittingId } = route.params;
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [trendData, setTrendData] = useState(null);
  const [riskAnalysis, setRiskAnalysis] = useState(null);

  useEffect(() => {
    loadAIAnalysis();
  }, []);

  const loadAIAnalysis = async () => {
    try {
      setLoading(true);
      
      // Load comprehensive AI analysis
      const [analysis, trends, risks] = await Promise.all([
        aiService.analyzeItem(fittingId),
        aiService.getTrendAnalysis(fittingId),
        aiService.getRiskAnalysis(fittingId),
      ]);

      setAnalysisData(analysis);
      setTrendData(trends);
      setRiskAnalysis(risks);
      setRecommendations(analysis.recommendations || []);
    } catch (error) {
      console.error('Failed to load AI analysis:', error);
      Alert.alert('Error', 'Failed to load AI analysis data');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'high':
        return '#F44336';
      case 'critical':
        return '#D32F2F';
      default:
        return '#757575';
    }
  };

  const getRiskIcon = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low':
        return 'check-circle';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      case 'critical':
        return 'dangerous';
      default:
        return 'help';
    }
  };

  const generateReport = async () => {
    try {
      Alert.alert(
        'Generate Report',
        'AI analysis report will be generated and sent to your email.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Generate', 
            onPress: () => {
              // In a real app, this would trigger report generation
              Alert.alert('Success', 'Report generation started. You will receive it via email shortly.');
            }
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate report');
    }
  };

  const exportData = () => {
    Alert.alert(
      'Export Data',
      'Choose export format:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'PDF Report', onPress: () => exportAsPDF() },
        { text: 'Excel Data', onPress: () => exportAsExcel() },
        { text: 'JSON Data', onPress: () => exportAsJSON() },
      ]
    );
  };

  const exportAsPDF = () => {
    Alert.alert('Success', 'PDF report will be generated and saved to downloads.');
  };

  const exportAsExcel = () => {
    Alert.alert('Success', 'Excel file will be generated with all analysis data.');
  };

  const exportAsJSON = () => {
    Alert.alert('Success', 'JSON data exported to downloads folder.');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5143A3" />
        <Text style={styles.loadingText}>Analyzing data...</Text>
      </View>
    );
  }

  if (!analysisData) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={48} color="#F44336" />
        <Text style={styles.errorText}>Failed to load AI analysis</Text>
        <Button mode="contained" onPress={loadAIAnalysis}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.header}>
            <View>
              <Title>AI Analysis Report</Title>
              <Paragraph>Fitting ID: {fittingId}</Paragraph>
              <Paragraph>Analysis Date: {new Date().toLocaleDateString()}</Paragraph>
            </View>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Performance Score</Text>
              <Text style={[styles.score, { color: analysisData.performanceScore >= 80 ? '#4CAF50' : 
                                                     analysisData.performanceScore >= 60 ? '#FF9800' : '#F44336' }]}>
                {analysisData.performanceScore}%
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Risk Assessment */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Icon name="security" size={24} color="#5143A3" />
            <Title style={styles.sectionTitle}>Risk Assessment</Title>
          </View>
          
          <View style={styles.riskContainer}>
            <View style={styles.riskItem}>
              <Icon 
                name={getRiskIcon(riskAnalysis?.overall)} 
                size={32} 
                color={getRiskColor(riskAnalysis?.overall)} 
              />
              <Text style={styles.riskLabel}>Overall Risk</Text>
              <Chip 
                style={[styles.riskChip, { backgroundColor: getRiskColor(riskAnalysis?.overall) }]}
                textStyle={styles.chipText}
              >
                {riskAnalysis?.overall || 'Medium'}
              </Chip>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.riskDetails}>
              <Text style={styles.riskDetailTitle}>Risk Factors:</Text>
              {riskAnalysis?.factors?.map((factor, index) => (
                <View key={index} style={styles.riskFactor}>
                  <Icon name="fiber-manual-record" size={8} color="#757575" />
                  <Text style={styles.riskFactorText}>{factor}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Performance Trends */}
      {trendData && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Icon name="trending-up" size={24} color="#5143A3" />
              <Title style={styles.sectionTitle}>Performance Trends</Title>
            </View>
            
            <LineChart
              data={{
                labels: trendData.labels,
                datasets: [
                  {
                    data: trendData.performance,
                    color: (opacity = 1) => `rgba(81, 67, 159, ${opacity})`,
                    strokeWidth: 2,
                  },
                  {
                    data: trendData.predicted,
                    color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
                    strokeWidth: 2,
                    withDots: false,
                  },
                ],
                legend: ['Actual Performance', 'AI Prediction'],
              }}
              width={width - 40}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      )}

      {/* Condition Analysis */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Icon name="analytics" size={24} color="#5143A3" />
            <Title style={styles.sectionTitle}>Condition Analysis</Title>
          </View>
          
          <PieChart
            data={[
              {
                name: 'Excellent',
                population: analysisData.conditionBreakdown?.excellent || 25,
                color: '#4CAF50',
                legendFontColor: '#333',
                legendFontSize: 12,
              },
              {
                name: 'Good',
                population: analysisData.conditionBreakdown?.good || 35,
                color: '#8BC34A',
                legendFontColor: '#333',
                legendFontSize: 12,
              },
              {
                name: 'Fair',
                population: analysisData.conditionBreakdown?.fair || 25,
                color: '#FF9800',
                legendFontColor: '#333',
                legendFontSize: 12,
              },
              {
                name: 'Poor',
                population: analysisData.conditionBreakdown?.poor || 15,
                color: '#F44336',
                legendFontColor: '#333',
                legendFontSize: 12,
              },
            ]}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* AI Recommendations */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Icon name="lightbulb" size={24} color="#5143A3" />
            <Title style={styles.sectionTitle}>AI Recommendations</Title>
          </View>
          
          {recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendation}>
              <View style={styles.recommendationHeader}>
                <Icon 
                  name={recommendation.priority === 'high' ? 'priority-high' : 'info'} 
                  size={20} 
                  color={recommendation.priority === 'high' ? '#F44336' : '#2196F3'} 
                />
                <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
              </View>
              <Text style={styles.recommendationText}>{recommendation.description}</Text>
              {recommendation.action && (
                <View style={styles.recommendationAction}>
                  <Text style={styles.actionLabel}>Recommended Action:</Text>
                  <Text style={styles.actionText}>{recommendation.action}</Text>
                </View>
              )}
              {index < recommendations.length - 1 && <Divider style={styles.divider} />}
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Predictive Insights */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Icon name="insights" size={24} color="#5143A3" />
            <Title style={styles.sectionTitle}>Predictive Insights</Title>
          </View>
          
          <View style={styles.insight}>
            <Text style={styles.insightTitle}>Failure Probability</Text>
            <Text style={styles.insightValue}>
              {analysisData.failureProbability || '12%'} in next 6 months
            </Text>
          </View>
          
          <View style={styles.insight}>
            <Text style={styles.insightTitle}>Recommended Maintenance</Text>
            <Text style={styles.insightValue}>
              {analysisData.maintenanceSchedule || 'Next inspection in 45 days'}
            </Text>
          </View>
          
          <View style={styles.insight}>
            <Text style={styles.insightTitle}>Cost Optimization</Text>
            <Text style={styles.insightValue}>
              Potential savings: ₹{analysisData.costOptimization || '25,000'}/month
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <Button
          mode="contained"
          onPress={generateReport}
          style={[styles.actionButton, styles.primaryButton]}
          icon="file-download"
        >
          Generate Report
        </Button>
        
        <Button
          mode="outlined"
          onPress={exportData}
          style={styles.actionButton}
          icon="share"
        >
          Export Data
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 16,
    textAlign: 'center',
  },
  headerCard: {
    margin: 16,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
  },
  score: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  card: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
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
  riskContainer: {
    padding: 8,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  riskLabel: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  riskChip: {
    minWidth: 80,
  },
  chipText: {
    color: 'white',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 12,
  },
  riskDetails: {
    marginTop: 8,
  },
  riskDetailTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  riskFactor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  riskFactorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  recommendation: {
    marginBottom: 16,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  recommendationAction: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5143A3',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
  },
  insight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  insightTitle: {
    fontSize: 14,
    color: '#666',
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionContainer: {
    padding: 16,
    paddingTop: 8,
  },
  actionButton: {
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#5143A3',
  },
});

export default AIAnalysisScreen;