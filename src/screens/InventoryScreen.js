import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {
  Card,
  Title,
  Searchbar,
  Button,
  Chip,
  DataTable,
  FAB,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {inventoryService} from '../services/InventoryService';

const InventoryScreen = ({navigation}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date');

  const filters = ['All', 'Rail Clips', 'Liners', 'Rail Pads', 'Sleepers'];

  useEffect(() => {
    loadInventoryData();
  }, [selectedFilter, sortBy]);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getInventory({
        filter: selectedFilter,
        sortBy: sortBy,
        search: searchQuery,
      });
      setInventoryData(data);
    } catch (error) {
      console.error('Inventory load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Debounce search in real implementation
    loadInventoryData();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Good': return '#4CAF50';
      case 'Warning': return '#FF9800';
      case 'Critical': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const renderInventoryItem = ({item}) => (
    <Card style={styles.inventoryCard}>
      <Card.Content>
        <View style={styles.itemHeader}>
          <View>
            <Title style={styles.itemTitle}>{item.type}</Title>
            <Text style={styles.itemCode}>QR: {item.qrCode}</Text>
          </View>
          <Chip 
            style={[styles.statusChip, {backgroundColor: getStatusColor(item.status)}]}
            textStyle={{color: '#FFFFFF'}}>
            {item.status}
          </Chip>
        </View>
        
        <DataTable>
          <DataTable.Row>
            <DataTable.Cell>Lot Number</DataTable.Cell>
            <DataTable.Cell>{item.lotNumber}</DataTable.Cell>
          </DataTable.Row>
          <DataTable.Row>
            <DataTable.Cell>Quantity</DataTable.Cell>
            <DataTable.Cell>{item.quantity.toLocaleString()}</DataTable.Cell>
          </DataTable.Row>
          <DataTable.Row>
            <DataTable.Cell>Location</DataTable.Cell>
            <DataTable.Cell>{item.location}</DataTable.Cell>
          </DataTable.Row>
          <DataTable.Row>
            <DataTable.Cell>Last Inspected</DataTable.Cell>
            <DataTable.Cell>{item.lastInspected}</DataTable.Cell>
          </DataTable.Row>
        </DataTable>

        <View style={styles.itemActions}>
          <Button 
            mode="outlined" 
            onPress={() => navigation.navigate('FittingDetails', {
              fittingData: item,
              qrCode: item.qrCode,
            })}
            icon="visibility">
            View Details
          </Button>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('Scanner')}
            icon="qr-code-scanner">
            Scan
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search by QR code, lot number..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}>
          {filters.map((filter) => (
            <Chip
              key={filter}
              selected={selectedFilter === filter}
              onPress={() => setSelectedFilter(filter)}
              style={styles.filterChip}
              mode={selectedFilter === filter ? 'flat' : 'outlined'}>
              {filter}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Summary Stats */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Title>Inventory Summary</Title>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Icon name="inventory-2" size={24} color="#1976D2" />
              <Text style={styles.summaryNumber}>18.6M</Text>
              <Text style={styles.summaryLabel}>Total Items</Text>
            </View>
            <View style={styles.summaryItem}>
              <Icon name="check-circle" size={24} color="#4CAF50" />
              <Text style={styles.summaryNumber}>16.8M</Text>
              <Text style={styles.summaryLabel}>Good Condition</Text>
            </View>
            <View style={styles.summaryItem}>
              <Icon name="warning" size={24} color="#FF9800" />
              <Text style={styles.summaryNumber}>1.2M</Text>
              <Text style={styles.summaryLabel}>Need Attention</Text>
            </View>
            <View style={styles.summaryItem}>
              <Icon name="error" size={24} color="#F44336" />
              <Text style={styles.summaryNumber}>0.6M</Text>
              <Text style={styles.summaryLabel}>Critical</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <TouchableOpacity 
          style={[styles.sortButton, sortBy === 'date' && styles.sortButtonActive]}
          onPress={() => setSortBy('date')}>
          <Text style={[styles.sortText, sortBy === 'date' && styles.sortTextActive]}>Date</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.sortButton, sortBy === 'quantity' && styles.sortButtonActive]}
          onPress={() => setSortBy('quantity')}>
          <Text style={[styles.sortText, sortBy === 'quantity' && styles.sortTextActive]}>Quantity</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.sortButton, sortBy === 'status' && styles.sortButtonActive]}
          onPress={() => setSortBy('status')}>
          <Text style={[styles.sortText, sortBy === 'status' && styles.sortTextActive]}>Status</Text>
        </TouchableOpacity>
      </View>

      {/* Inventory List */}
      <FlatList
        data={inventoryData}
        renderItem={renderInventoryItem}
        keyExtractor={(item) => item.id}
        style={styles.inventoryList}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadInventoryData}
      />

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="qr-code-scanner"
        onPress={() => navigation.navigate('Scanner')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  searchBar: {
    marginBottom: 10,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    marginRight: 8,
  },
  summaryCard: {
    margin: 15,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 15,
  },
  sortButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sortButtonActive: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  sortText: {
    fontSize: 14,
    color: '#666',
  },
  sortTextActive: {
    color: '#FFFFFF',
  },
  inventoryList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  inventoryCard: {
    marginVertical: 8,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  itemCode: {
    fontSize: 14,
    color: '#666',
  },
  statusChip: {
    height: 28,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1976D2',
  },
});

export default InventoryScreen;