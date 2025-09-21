import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  Chip,
  DataTable,
  Searchbar,
} from 'react-native-paper';
import {LineChart, BarChart, PieChart} from 'react-native-chart-kit';
import {MaterialIcons} from '@expo/vector-icons';
import {reportsService} from '../services/ReportsService';

const screenWidth = Dimensions.get('window').width;

const ReportsScreen = ({navigation}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [reportType, setReportType] = useState('quality');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const periods = ['week', 'month', 'quarter', 'year'];
  const reportTypes = ['quality', 'inventory', 'vendor', 'maintenance'];

  useEffect(() => {
    loadReportsData();
  }, [selectedPeriod, reportType]);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      const data = await reportsService.getReports({
        period: selectedPeriod,
        type: reportType,
      });
      setReportsData(data);
    } catch (error) {
      console.error('Reports data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  const qualityTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [85.2, 87.1, 84.8, 89.3, 91.2, 88.7],
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 3,
      },
      {
        data: [12.1, 10.8, 13.2, 9.1, 7.5, 9.8],
        color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
        strokeWidth: 3,
      },
    ],
    legend: ['Pass Rate %', 'Issue Rate %'],
  };

  const inventoryDistributionData = [
    {
      name: 'Rail Clips',
      population: 45,
      color: '#1976D2',
      legendFontColor: '#333',
      legendFontSize: 14,
    },
    {
      name: 'Liners',
      population: 18,
      color: '#4CAF50',
      legendFontColor: '#333',
      legendFontSize: 14,
    },
    {
      name: 'Rail Pads',
      population: 22,
      color: '#FF9800',
      legendFontColor: '#333',
      legendFontSize: 14,
    },
    {
      name: 'Sleepers',
      population: 15,
      color: '#9C27B0',
      legendFontColor: '#333',
      legendFontSize: 14,
    },
  ];

  const vendorPerformanceData = {
    labels: ['Vendor A', 'Vendor B', 'Vendor C', 'Vendor D', 'Vendor E'],
    datasets: [
      {
        data: [92, 88, 85, 94, 78],
      },
    ],
  };

  const renderQualityReport = () => (
    <>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Quality Trend Analysis</Title>
          <LineChart
            data={qualityTrendData}
            width={screenWidth - 60}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Quality Metrics Summary</Title>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Metric</DataTable.Title>
              <DataTable.Title numeric>Current</DataTable.Title>
              <DataTable.Title numeric>Target</DataTable.Title>
              <DataTable.Title numeric>Variance</DataTable.Title>
            </DataTable.Header>
            <DataTable.Row>
              <DataTable.Cell>Pass Rate</DataTable.Cell>
              <DataTable.Cell numeric>88.7%</DataTable.Cell>
              <DataTable.Cell numeric>90.0%</DataTable.Cell>
              <DataTable.Cell numeric>-1.3%</DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell>First Pass Rate</DataTable.Cell>
              <DataTable.Cell numeric>82.4%</DataTable.Cell>
              <DataTable.Cell numeric>85.0%</DataTable.Cell>
              <DataTable.Cell numeric>-2.6%</DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell>Rejection Rate</DataTable.Cell>
              <DataTable.Cell numeric>2.1%</DataTable.Cell>
              <DataTable.Cell numeric>{'< 3.0%'}</DataTable.Cell>
              <DataTable.Cell numeric>+0.9%</DataTable.Cell>
            </DataTable.Row>
          </DataTable>
        </Card.Content>
      </Card>
    </>
  );

  const renderInventoryReport = () => (
    <>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Inventory Distribution</Title>
          <PieChart
            data={inventoryDistributionData}
            width={screenWidth - 60}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Stock Levels</Title>
          <View style={styles.stockLevels}>
            <View style={styles.stockItem}>
              <Icon name="trending-up" size={24} color="#4CAF50" />
              <Text style={styles.stockLabel}>Optimal Stock</Text>
              <Text style={styles.stockValue}>74%</Text>
            </View>
            <View style={styles.stockItem}>
              <Icon name="trending-down" size={24} color="#FF9800" />
              <Text style={styles.stockLabel}>Low Stock</Text>
              <Text style={styles.stockValue}>18%</Text>
            </View>
            <View style={styles.stockItem}>
              <Icon name="warning" size={24} color="#F44336" />
              <Text style={styles.stockLabel}>Critical</Text>
              <Text style={styles.stockValue}>8%</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </>
  );

  const renderVendorReport = () => (
    <>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Vendor Performance Scores</Title>
          <BarChart
            data={vendorPerformanceData}
            width={screenWidth - 60}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Top Performing Vendors</Title>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Vendor</DataTable.Title>
              <DataTable.Title numeric>Score</DataTable.Title>
              <DataTable.Title numeric>On-Time %</DataTable.Title>
              <DataTable.Title>Quality</DataTable.Title>
            </DataTable.Header>
            <DataTable.Row>
              <DataTable.Cell>Bharat Steel Industries</DataTable.Cell>
              <DataTable.Cell numeric>94</DataTable.Cell>
              <DataTable.Cell numeric>96%</DataTable.Cell>
              <DataTable.Cell>A+</DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell>Railway Track Components</DataTable.Cell>
              <DataTable.Cell numeric>92</DataTable.Cell>
              <DataTable.Cell numeric>94%</DataTable.Cell>
              <DataTable.Cell>A</DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell>Steel Authority of India</DataTable.Cell>
              <DataTable.Cell numeric>88</DataTable.Cell>
              <DataTable.Cell numeric>91%</DataTable.Cell>
              <DataTable.Cell>A-</DataTable.Cell>
            </DataTable.Row>
          </DataTable>
        </Card.Content>
      </Card>
    </>
  );

  const renderMaintenanceReport = () => (
    <>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Maintenance Schedule Compliance</Title>
          <View style={styles.maintenanceStats}>
            <View style={styles.maintenanceItem}>
              <Icon name="schedule" size={32} color="#4CAF50" />
              <Text style={styles.maintenanceNumber}>92%</Text>
              <Text style={styles.maintenanceLabel}>On Schedule</Text>
            </View>
            <View style={styles.maintenanceItem}>
              <Icon name="build" size={32} color="#FF9800" />
              <Text style={styles.maintenanceNumber}>234</Text>
              <Text style={styles.maintenanceLabel}>Pending</Text>
            </View>
            <View style={styles.maintenanceItem}>
              <Icon name="priority-high" size={32} color="#F44336" />
              <Text style={styles.maintenanceNumber}>12</Text>
              <Text style={styles.maintenanceLabel}>Overdue</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>Upcoming Maintenance</Title>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>QR Code</DataTable.Title>
              <DataTable.Title>Type</DataTable.Title>
              <DataTable.Title>Due Date</DataTable.Title>
              <DataTable.Title>Priority</DataTable.Title>
            </DataTable.Header>
            <DataTable.Row>
              <DataTable.Cell>RC-001234</DataTable.Cell>
              <DataTable.Cell>Rail Clip</DataTable.Cell>
              <DataTable.Cell>25/09/2025</DataTable.Cell>
              <DataTable.Cell>High</DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell>LN-005678</DataTable.Cell>
              <DataTable.Cell>Liner</DataTable.Cell>
              <DataTable.Cell>28/09/2025</DataTable.Cell>
              <DataTable.Cell>Medium</DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell>RP-009876</DataTable.Cell>
              <DataTable.Cell>Rail Pad</DataTable.Cell>
              <DataTable.Cell>02/10/2025</DataTable.Cell>
              <DataTable.Cell>Low</DataTable.Cell>
            </DataTable.Row>
          </DataTable>
        </Card.Content>
      </Card>
    </>
  );

  const renderReportContent = () => {
    switch (reportType) {
      case 'quality':
        return renderQualityReport();
      case 'inventory':
        return renderInventoryReport();
      case 'vendor':
        return renderVendorReport();
      case 'maintenance':
        return renderMaintenanceReport();
      default:
        return renderQualityReport();
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <Title>Analytics & Reports</Title>
          <Text style={styles.subtitle}>Track performance and generate insights</Text>
        </Card.Content>
      </Card>

      {/* Filters */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.filterTitle}>Report Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipContainer}>
              {reportTypes.map((type) => (
                <Chip
                  key={type}
                  selected={reportType === type}
                  onPress={() => setReportType(type)}
                  style={styles.chip}
                  mode={reportType === type ? 'flat' : 'outlined'}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Chip>
              ))}
            </View>
          </ScrollView>

          <Text style={styles.filterTitle}>Time Period</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipContainer}>
              {periods.map((period) => (
                <Chip
                  key={period}
                  selected={selectedPeriod === period}
                  onPress={() => setSelectedPeriod(period)}
                  style={styles.chip}
                  mode={selectedPeriod === period ? 'flat' : 'outlined'}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Chip>
              ))}
            </View>
          </ScrollView>
        </Card.Content>
      </Card>

      {/* Report Content */}
      {renderReportContent()}

      {/* Export Options */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Export Options</Title>
          <View style={styles.exportButtons}>
            <Button 
              mode="outlined" 
              onPress={() => {}}
              icon="download"
              style={styles.exportButton}>
              PDF Report
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => {}}
              icon="table-chart"
              style={styles.exportButton}>
              Excel Export
            </Button>
            <Button 
              mode="contained" 
              onPress={() => {}}
              icon="share"
              style={styles.exportButton}>
              Share Report
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerCard: {
    margin: 15,
    marginBottom: 5,
    elevation: 3,
    backgroundColor: '#1976D2',
  },
  subtitle: {
    color: '#FFFFFF',
    marginTop: 5,
  },
  card: {
    margin: 15,
    elevation: 3,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    marginBottom: 10,
  },
  chipContainer: {
    flexDirection: 'row',
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  stockLevels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  stockItem: {
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  stockValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  maintenanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  maintenanceItem: {
    alignItems: 'center',
  },
  maintenanceNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  maintenanceLabel: {
    fontSize: 12,
    color: '#666',
  },
  exportButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  exportButton: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default ReportsScreen;