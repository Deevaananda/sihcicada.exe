import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  TextInput,
  RadioButton,
  Checkbox,
  Chip,
  Divider,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {inspectionService} from '../services/InspectionService';

const InspectionScreen = ({route, navigation}) => {
  const {fittingData} = route.params || {};
  const [inspectionForm, setInspectionForm] = useState({
    qrCode: fittingData?.qrCode || '',
    inspectorName: '',
    inspectionType: 'routine',
    visualCheck: {
      cracks: false,
      corrosion: false,
      deformation: false,
      surfaceDamage: false,
    },
    dimensionalCheck: {
      length: '',
      width: '',
      height: '',
      tolerance: 'within',
    },
    materialCheck: {
      hardness: '',
      tensileStrength: 'pass',
      chemicalComposition: 'pass',
    },
    functionalCheck: {
      fitment: 'good',
      performance: 'satisfactory',
    },
    overallGrade: 'A',
    remarks: '',
    recommendations: [],
    photos: [],
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fittingData) {
      setInspectionForm(prev => ({
        ...prev,
        qrCode: fittingData.qrCode,
      }));
    }
  }, [fittingData]);

  const handleInputChange = (section, field, value) => {
    if (section) {
      setInspectionForm(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    } else {
      setInspectionForm(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleVisualCheckChange = (defect, checked) => {
    setInspectionForm(prev => ({
      ...prev,
      visualCheck: {
        ...prev.visualCheck,
        [defect]: checked,
      },
    }));
  };

  const addRecommendation = (recommendation) => {
    setInspectionForm(prev => ({
      ...prev,
      recommendations: [...prev.recommendations, recommendation],
    }));
  };

  const removeRecommendation = (index) => {
    setInspectionForm(prev => ({
      ...prev,
      recommendations: prev.recommendations.filter((_, i) => i !== index),
    }));
  };

  const takePhoto = () => {
    // Implement camera functionality
    Alert.alert('Camera', 'Camera feature would be implemented here');
  };

  const submitInspection = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!inspectionForm.inspectorName || !inspectionForm.qrCode) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const result = await inspectionService.submitInspection(inspectionForm);
      
      if (result.success) {
        Alert.alert(
          'Inspection Submitted',
          'Inspection report has been successfully submitted.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to submit inspection. Please try again.');
      }
    } catch (error) {
      console.error('Inspection submission error:', error);
      Alert.alert('Error', 'An error occurred while submitting the inspection.');
    } finally {
      setLoading(false);
    }
  };

  const calculateGrade = () => {
    const visualIssues = Object.values(inspectionForm.visualCheck).filter(v => v).length;
    const dimensionalPass = inspectionForm.dimensionalCheck.tolerance === 'within';
    const materialPass = inspectionForm.materialCheck.tensileStrength === 'pass' && 
                        inspectionForm.materialCheck.chemicalComposition === 'pass';
    
    if (visualIssues === 0 && dimensionalPass && materialPass) {
      return 'A';
    } else if (visualIssues <= 1 && (dimensionalPass || materialPass)) {
      return 'B';
    } else {
      return 'C';
    }
  };

  useEffect(() => {
    const grade = calculateGrade();
    setInspectionForm(prev => ({...prev, overallGrade: grade}));
  }, [inspectionForm.visualCheck, inspectionForm.dimensionalCheck, inspectionForm.materialCheck]);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Track Fitting Inspection</Title>
          {fittingData && (
            <View style={styles.fittingInfo}>
              <Text style={styles.fittingType}>{fittingData.type}</Text>
              <Text style={styles.qrCode}>QR: {fittingData.qrCode}</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Basic Information */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Basic Information</Title>
          <TextInput
            label="QR Code *"
            value={inspectionForm.qrCode}
            onChangeText={(value) => handleInputChange(null, 'qrCode', value)}
            style={styles.input}
            right={<TextInput.Icon icon="qr-code-scanner" onPress={() => navigation.navigate('Scanner')} />}
          />
          <TextInput
            label="Inspector Name *"
            value={inspectionForm.inspectorName}
            onChangeText={(value) => handleInputChange(null, 'inspectorName', value)}
            style={styles.input}
          />
          
          <Text style={styles.sectionTitle}>Inspection Type</Text>
          <RadioButton.Group
            onValueChange={(value) => handleInputChange(null, 'inspectionType', value)}
            value={inspectionForm.inspectionType}>
            <View style={styles.radioOption}>
              <RadioButton value="routine" />
              <Text>Routine Inspection</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="detailed" />
              <Text>Detailed Inspection</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="emergency" />
              <Text>Emergency Inspection</Text>
            </View>
          </RadioButton.Group>
        </Card.Content>
      </Card>

      {/* Visual Inspection */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Visual Inspection</Title>
          <Text style={styles.sectionDescription}>Check for visible defects:</Text>
          
          {Object.entries(inspectionForm.visualCheck).map(([defect, checked]) => (
            <View key={defect} style={styles.checkboxRow}>
              <Checkbox
                status={checked ? 'checked' : 'unchecked'}
                onPress={() => handleVisualCheckChange(defect, !checked)}
              />
              <Text style={styles.checkboxLabel}>
                {defect.charAt(0).toUpperCase() + defect.slice(1)}
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Dimensional Check */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Dimensional Check</Title>
          <View style={styles.dimensionalInputs}>
            <TextInput
              label="Length (mm)"
              value={inspectionForm.dimensionalCheck.length}
              onChangeText={(value) => handleInputChange('dimensionalCheck', 'length', value)}
              keyboardType="numeric"
              style={[styles.input, styles.dimensionalInput]}
            />
            <TextInput
              label="Width (mm)"
              value={inspectionForm.dimensionalCheck.width}
              onChangeText={(value) => handleInputChange('dimensionalCheck', 'width', value)}
              keyboardType="numeric"
              style={[styles.input, styles.dimensionalInput]}
            />
          </View>
          
          <Text style={styles.sectionTitle}>Tolerance Check</Text>
          <RadioButton.Group
            onValueChange={(value) => handleInputChange('dimensionalCheck', 'tolerance', value)}
            value={inspectionForm.dimensionalCheck.tolerance}>
            <View style={styles.radioOption}>
              <RadioButton value="within" />
              <Text>Within Tolerance</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="marginal" />
              <Text>Marginal</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="outside" />
              <Text>Outside Tolerance</Text>
            </View>
          </RadioButton.Group>
        </Card.Content>
      </Card>

      {/* Material Check */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Material Properties</Title>
          <TextInput
            label="Hardness (HRC)"
            value={inspectionForm.materialCheck.hardness}
            onChangeText={(value) => handleInputChange('materialCheck', 'hardness', value)}
            keyboardType="numeric"
            style={styles.input}
          />
          
          <Text style={styles.sectionTitle}>Tensile Strength</Text>
          <RadioButton.Group
            onValueChange={(value) => handleInputChange('materialCheck', 'tensileStrength', value)}
            value={inspectionForm.materialCheck.tensileStrength}>
            <View style={styles.radioOption}>
              <RadioButton value="pass" />
              <Text>Pass</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton value="fail" />
              <Text>Fail</Text>
            </View>
          </RadioButton.Group>
        </Card.Content>
      </Card>

      {/* Overall Assessment */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Overall Assessment</Title>
          <View style={styles.gradeContainer}>
            <Text style={styles.gradeLabel}>Calculated Grade:</Text>
            <Chip 
              style={[
                styles.gradeChip,
                {backgroundColor: inspectionForm.overallGrade === 'A' ? '#4CAF50' : 
                                  inspectionForm.overallGrade === 'B' ? '#FF9800' : '#F44336'}
              ]}
              textStyle={{color: '#FFFFFF'}}>
              Grade {inspectionForm.overallGrade}
            </Chip>
          </View>
          
          <TextInput
            label="Remarks"
            value={inspectionForm.remarks}
            onChangeText={(value) => handleInputChange(null, 'remarks', value)}
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          {/* Recommendations */}
          <Text style={styles.sectionTitle}>Recommendations</Text>
          <View style={styles.recommendationButtons}>
            <Button 
              mode="outlined" 
              onPress={() => addRecommendation('Increase monitoring frequency')}
              style={styles.recommendationButton}>
              Increase Monitoring
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => addRecommendation('Schedule replacement')}
              style={styles.recommendationButton}>
              Schedule Replacement
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => addRecommendation('No action required')}
              style={styles.recommendationButton}>
              No Action
            </Button>
          </View>

          {inspectionForm.recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationChip}>
              <Chip 
                onClose={() => removeRecommendation(index)}
                closeIcon="close">
                {recommendation}
              </Chip>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Photos */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Photos</Title>
          <Button 
            mode="outlined" 
            onPress={takePhoto}
            icon="camera"
            style={styles.photoButton}>
            Take Photo
          </Button>
          {inspectionForm.photos.length === 0 && (
            <Text style={styles.noPhotos}>No photos taken</Text>
          )}
        </Card.Content>
      </Card>

      {/* Submit Button */}
      <Button
        mode="contained"
        onPress={submitInspection}
        loading={loading}
        disabled={loading}
        style={styles.submitButton}
        icon="send">
        Submit Inspection Report
      </Button>
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
  fittingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  fittingType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  qrCode: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  checkboxLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  dimensionalInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dimensionalInput: {
    flex: 1,
    marginHorizontal: 5,
  },
  gradeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  gradeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 15,
  },
  gradeChip: {
    height: 32,
  },
  recommendationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10,
  },
  recommendationButton: {
    margin: 5,
  },
  recommendationChip: {
    marginVertical: 5,
  },
  photoButton: {
    marginVertical: 10,
  },
  noPhotos: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
  },
  submitButton: {
    margin: 20,
    padding: 10,
  },
});

export default InspectionScreen;