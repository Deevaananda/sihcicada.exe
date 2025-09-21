import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  DataTable,
  Divider,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {aiService} from '../services/AIService';
import {inspectionService} from '../services/InspectionService';

const FittingDetailsScreen = ({route, navigation}) => {
  const {fittingData, qrCode} = route.params;
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    performAIAnalysis();
  }, []);

  const performAIAnalysis = async () => {
    setLoading(true);
    try {
      const analysis = await aiService.analyzeFitting(fittingData);
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('AI analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInspection = () => {
    navigation.navigate('Inspection', {fittingData});
  };

  const handleAIReport = () => {
    navigation.navigate('AIAnalysis', {fittingData, aiAnalysis});
  };

  const openUDMPortal = () => {
    Linking.openURL(`https://www.ireps.gov.in/udm/fitting/${qrCode}`);
  };

  const openTMSPortal = () => {
    Linking.openURL(`https://www.irecept.gov.in/tms/track-fitting/${qrCode}`);
  };

  const getQualityColor = (grade) => {
    switch (grade) {
      case 'A': return '#4CAF50';
      case 'B': return '#FF9800';
      case 'C': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'Low': return '#4CAF50';
      case 'Medium': return '#FF9800';
      case 'High': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* QR Code Header */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.qrHeader}>
            <Icon name="qr-code" size={40} color="#1976D2" />
            <View style={styles.qrInfo}>
              <Title>{fittingData.type}</Title>
              <Paragraph>QR Code: {qrCode}</Paragraph>
              <View style={styles.chipRow}>
                <Chip 
                  icon="grade" 
                  mode="flat"
                  style={[styles.gradeChip, {backgroundColor: getQualityColor(fittingData.qualityGrade)}]}
                  textStyle={{color: '#FFFFFF'}}>
                  Grade {fittingData.qualityGrade}
                </Chip>
                {aiAnalysis && (
                  <Chip 
                    icon="psychology" 
                    mode="flat"
                    style={[styles.riskChip, {backgroundColor: getRiskColor(aiAnalysis.riskLevel)}]}
                    textStyle={{color: '#FFFFFF'}}>
                    {aiAnalysis.riskLevel} Risk
                  </Chip>
                )}
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Basic Information */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Basic Information</Title>
          <DataTable>
            <DataTable.Row>
              <DataTable.Cell>Lot Number</DataTable.Cell>
              <DataTable.Cell>{fittingData.lotNumber}</DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell>Vendor</DataTable.Cell>
              <DataTable.Cell>{fittingData.vendorName}</DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell>Manufacture Date</DataTable.Cell>
              <DataTable.Cell>{fittingData.supplyDate}</DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell>Warranty Period</DataTable.Cell>
              <DataTable.Cell>{fittingData.warrantyPeriod}</DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell>Location</DataTable.Cell>
              <DataTable.Cell>{fittingData.location}</DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell>Quantity</DataTable.Cell>
              <DataTable.Cell>{fittingData.quantity?.toLocaleString()} units</DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell>Unit Price</DataTable.Cell>
              <DataTable.Cell>₹{fittingData.unitPrice?.toLocaleString('en-IN')}</DataTable.Cell>
            </DataTable.Row>
          </DataTable>
        </Card.Content>
      </Card>

      {/* Technical Specifications */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Technical Specifications</Title>
          {Object.entries(fittingData.specifications || {}).map(([key, value]) => (
            <DataTable.Row key={key}>
              <DataTable.Cell>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</DataTable.Cell>
              <DataTable.Cell>{value}</DataTable.Cell>
            </DataTable.Row>
          ))}
        </Card.Content>
      </Card>

      {/* AI Analysis Preview */}
      {aiAnalysis && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>AI Analysis Summary</Title>
            <View style={styles.aiSummary}>
              <View style={styles.aiItem}>
                <Icon name="psychology" size={24} color="#1976D2" />
                <Text style={styles.aiText}>
                  Performance Score: {aiAnalysis.performanceScore}/100
                </Text>
              </View>
              <View style={styles.aiItem}>
                <Icon 
                  name="warning" 
                  size={24} 
                  color={getRiskColor(aiAnalysis.riskLevel)}
                />
                <Text style={styles.aiText}>
                  Risk Level: {aiAnalysis.riskLevel}
                </Text>
              </View>
              <View style={styles.aiItem}>
                <Icon name="schedule" size={24} color="#4CAF50" />
                <Text style={styles.aiText}>
                  Expected Life: {aiAnalysis.expectedLife}
                </Text>
              </View>
              {aiAnalysis.predictiveInsights && (
                <View style={styles.aiItem}>
                  <Icon name="trending-up" size={24} color="#FF9800" />
                  <Text style={styles.aiText}>
                    Failure Risk: {aiAnalysis.predictiveInsights.failureProbability}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Quick Recommendations */}
            {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
              <View style={styles.recommendationsPreview}>
                <Text style={styles.sectionTitle}>Top Recommendations:</Text>
                {aiAnalysis.recommendations.slice(0, 2).map((rec, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <Icon 
                      name="lightbulb" 
                      size={16} 
                      color={rec.priority === 'High' ? '#F44336' : '#FF9800'}
                    />
                    <Text style={styles.recommendationText}>
                      {rec.action || rec}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            
            <Button 
              mode="contained" 
              onPress={handleAIReport}
              style={styles.aiButton}
              icon="analytics">
              View Detailed AI Report
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Inspection History */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Inspection History</Title>
          {fittingData.inspectionHistory && fittingData.inspectionHistory.length > 0 ? (
            fittingData.inspectionHistory.map((inspection, index) => (
              <View key={index} style={styles.inspectionItem}>
                <View style={styles.inspectionHeader}>
                  <Text style={styles.inspectionDate}>{inspection.date}</Text>
                  <Chip 
                    mode="flat"
                    style={[
                      styles.resultChip,
                      {backgroundColor: inspection.result === 'Passed' ? '#E8F5E8' : '#FFEBEE'}
                    ]}
                    textStyle={{
                      color: inspection.result === 'Passed' ? '#2E7D32' : '#C62828'
                    }}>
                    {inspection.result}
                  </Chip>
                </View>
                <Text style={styles.inspectionType}>{inspection.type}</Text>
                <Text style={styles.inspector}>Inspector: {inspection.inspector}</Text>
                <Text style={styles.remarks}>{inspection.remarks}</Text>
                {index < fittingData.inspectionHistory.length - 1 && <Divider style={styles.divider} />}
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No inspection history available</Text>
          )}
        </Card.Content>
      </Card>

      {/* Performance Metrics */}
      {aiAnalysis && aiAnalysis.benchmarkComparison && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Performance Benchmark</Title>
            <View style={styles.benchmarkContainer}>
              <View style={styles.benchmarkItem}>
                <Text style={styles.benchmarkLabel}>Your Score</Text>
                <Text style={[styles.benchmarkValue, {color: '#1976D2'}]}>
                  {aiAnalysis.benchmarkComparison.yourScore || aiAnalysis.performanceScore}
                </Text>
              </View>
              <View style={styles.benchmarkItem}>
                <Text style={styles.benchmarkLabel}>Industry Average</Text>
                <Text style={styles.benchmarkValue}>
                  {aiAnalysis.benchmarkComparison.industryAverage}
                </Text>
              </View>
              <View style={styles.benchmarkItem}>
                <Text style={styles.benchmarkLabel}>Best Practice</Text>
                <Text style={[styles.benchmarkValue, {color: '#4CAF50'}]}>
                  {aiAnalysis.benchmarkComparison.bestPractice}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Action Buttons */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Actions</Title>
          <View style={styles.buttonRow}>
            <Button 
              mode="contained" 
              onPress={handleInspection}
              style={styles.actionButton}
              icon="fact-check">
              New Inspection
            </Button>
            <Button 
              mode="outlined" 
              onPress={openUDMPortal}
              style={styles.actionButton}
              icon="open-in-browser">
              UDM Portal
            </Button>
          </View>
          <View style={styles.buttonRow}>
            <Button 
              mode="outlined" 
              onPress={openTMSPortal}
              style={styles.actionButton}
              icon="open-in-browser">
              TMS Portal
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => {
                Alert.alert('Share', 'Sharing functionality would be implemented here');
              }}
              style={styles.actionButton}
              icon="share">
              Share Report
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Cost Information */}
      {aiAnalysis && aiAnalysis.predictiveInsights && aiAnalysis.predictiveInsights.costOptimization && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Cost Analysis</Title>
            <DataTable>
              <DataTable.Row>
                <DataTable.Cell>Current Value</DataTable.Cell>
                <DataTable.Cell>{aiAnalysis.predictiveInsights.costOptimization.currentValue}</DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row>
                <DataTable.Cell>Replacement Cost</DataTable.Cell>
                <DataTable.Cell>{aiAnalysis.predictiveInsights.costOptimization.replacementCost}</DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row>
                <DataTable.Cell>Potential Savings</DataTable.Cell>
                <DataTable.Cell>{aiAnalysis.predictiveInsights.costOptimization.potentialSavings}</DataTable.Cell>
              </DataTable.Row>
              {aiAnalysis.predictiveInsights.costOptimization.maintenanceCost && (
                <DataTable.Row>
                  <DataTable.Cell>Annual Maintenance</DataTable.Cell>
                  <DataTable.Cell>{aiAnalysis.predictiveInsights.costOptimization.maintenanceCost}</DataTable.Cell>
                </DataTable.Row>
              )}
            </DataTable>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  card: {
    margin: 15,
    elevation: 3,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrInfo: {
    flex: 1,
    marginLeft: 15,
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  gradeChip: {
    marginTop: 8,
    marginRight: 8,
  },
  riskChip: {
    marginTop: 8,
    marginRight: 8,
  },
  aiSummary: {
    marginTop: 10,
  },
  aiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  recommendationsPreview: {
    marginTop: 15,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    paddingLeft: 5,
  },
  recommendationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  aiButton: {
    marginTop: 15,
  },
  inspectionItem: {
    marginBottom: 15,
    paddingBottom: 10,
  },
  inspectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  inspectionDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  resultChip: {
    height: 25,
  },
  inspectionType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 3,
  },
  inspector: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  remarks: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  divider: {
    marginTop: 10,
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  benchmarkContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  benchmarkItem: {
    alignItems: 'center',
  },
  benchmarkLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  benchmarkValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default FittingDetailsScreen;