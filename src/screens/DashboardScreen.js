import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {Card, Title, Paragraph, Button, Chip} from 'react-native-paper';
import {BarChart, PieChart} from 'react-native-chart-kit';
import {MaterialIcons} from '@expo/vector-icons';
import {dashboardService} from '../services/DashboardService';

const screenWidth = Dimensions.get('window').width;

const DashboardScreen = ({navigation}) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await dashboardService.getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Dashboard data error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(25, 118, 210, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#1976D2',
    },
  };

  const inventoryData = {
    labels: ['Rail Clips', 'Liners', 'Rail Pads', 'Sleepers'],
    datasets: [
      {
        data: [8500000, 3200000, 4100000, 2800000],
      },
    ],
  };

  const qualityData = [
    {
      name: 'Passed',
      population: 85,
      color: '#4CAF50',
      legendFontColor: '#333',
      legendFontSize: 15,
    },
    {
      name: 'Issues Found',
      population: 12,
      color: '#FF9800',
      legendFontColor: '#333',
      legendFontSize: 15,
    },
    {
      name: 'Rejected',
      population: 3,
      color: '#F44336',
      legendFontColor: '#333',
      legendFontSize: 15,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.titleText}>Indian Railways</Text>
        <Text style={styles.subtitleText}>Track Fittings Management System</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
                    <MaterialIcons name="qr-code-scanner" size={30} color="#1976D2" />
          <Text style={styles.statNumber}>1,247</Text>
          <Text style={styles.statLabel}>Scanned Today</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="inventory" size={30} color="#4CAF50" />
          <Text style={styles.statNumber}>18.6M</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="warning" size={30} color="#FF9800" />
          <Text style={styles.statNumber}>23</Text>
          <Text style={styles.statLabel}>Alerts</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Quick Actions</Title>
          <View style={styles.buttonRow}>
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('Scanner')}
              style={styles.actionButton}
              icon="qr-code-scanner">
              Scan QR
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => navigation.navigate('Inspection')}
              style={styles.actionButton}
              icon="fact-check">
              Inspect
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Inventory Overview */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Inventory Overview</Title>
          <BarChart
            data={inventoryData}
            width={screenWidth - 60}
            height={220}
            chartConfig={chartConfig}
            verticalLabelRotation={30}
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Quality Analysis */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Quality Analysis (Last 30 Days)</Title>
          <PieChart
            data={qualityData}
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

      {/* Recent Activities */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Recent Activities</Title>
          <View style={styles.activityItem}>
            <Chip icon="qr-code" mode="outlined" style={styles.chip}>
              QR-RC-001234
            </Chip>
            <Text style={styles.activityText}>Rail Clip inspected - Grade A</Text>
            <Text style={styles.timeText}>2 hours ago</Text>
          </View>
          <View style={styles.activityItem}>
            <Chip icon="warning" mode="outlined" style={[styles.chip, {backgroundColor: '#FFF3E0'}]}>
              QR-LN-005678
            </Chip>
            <Text style={styles.activityText}>Liner quality issue detected</Text>
            <Text style={styles.timeText}>4 hours ago</Text>
          </View>
          <View style={styles.activityItem}>
            <Chip icon="check-circle" mode="outlined" style={[styles.chip, {backgroundColor: '#E8F5E8'}]}>
              QR-RP-009876
            </Chip>
            <Text style={styles.activityText}>Rail Pad batch approved</Text>
            <Text style={styles.timeText}>6 hours ago</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Integration Status */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>System Integration</Title>
          <View style={styles.integrationStatus}>
            <View style={styles.statusItem}>
              <MaterialIcons name="cloud" size={20} color="#4CAF50" />
              <Text style={styles.statusText}>UDM Portal: Connected</Text>
            </View>
            <View style={styles.statusItem}>
              <MaterialIcons name="cloud" size={20} color="#4CAF50" />
              <Text style={styles.statusText}>TMS Portal: Connected</Text>
            </View>
            <View style={styles.statusItem}>
              <MaterialIcons name="sync" size={20} color="#2196F3" />
              <Text style={styles.statusText}>Last Sync: 5 mins ago</Text>
            </View>
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
  header: {
    padding: 20,
    backgroundColor: '#1976D2',
    alignItems: 'center',
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitleText: {
    color: '#BBDEFB',
    fontSize: 14,
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    marginTop: -30,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    elevation: 3,
    minWidth: 100,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    margin: 15,
    elevation: 3,
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
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  activityItem: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  chip: {
    marginBottom: 5,
    alignSelf: 'flex-start',
  },
  activityText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  integrationStatus: {
    marginTop: 10,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
});

export default DashboardScreen;
