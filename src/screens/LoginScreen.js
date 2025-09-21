import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Card,
  Title,
  TextInput,
  Button,
  Checkbox,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {authService} from '../services/AuthService';

const LoginScreen = ({navigation}) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    password: '',
    rememberMe: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: ''}));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required';
    } else if (!/^IR\d{6}$/.test(formData.employeeId)) {
      newErrors.employeeId = 'Employee ID must be in format IR123456';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await authService.login({
        employeeId: formData.employeeId,
        password: formData.password,
      });

      if (result.success) {
        // Store auth token
        await AsyncStorage.setItem('authToken', result.token);
        await AsyncStorage.setItem('userProfile', JSON.stringify(result.user));
        
        if (formData.rememberMe) {
          await AsyncStorage.setItem('rememberedEmployeeId', formData.employeeId);
        }

        // Navigate to main app
        navigation.replace('MainTabs');
      } else {
        Alert.alert('Login Failed', result.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Please contact your system administrator to reset your password.',
      [
        {text: 'Contact IT Support', onPress: () => {}},
        {text: 'Cancel', style: 'cancel'},
      ]
    );
  };

  const loadRememberedCredentials = async () => {
    try {
      const rememberedId = await AsyncStorage.getItem('rememberedEmployeeId');
      if (rememberedId) {
        setFormData(prev => ({
          ...prev,
          employeeId: rememberedId,
          rememberMe: true,
        }));
      }
    } catch (error) {
      console.error('Error loading remembered credentials:', error);
    }
  };

  React.useEffect(() => {
    loadRememberedCredentials();
  }, []);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>IR</Text>
          </View>
          <Text style={styles.titleText}>Indian Railways</Text>
          <Text style={styles.subtitleText}>Track Fittings Management System</Text>
        </View>
      </View>

      {/* Login Form */}
      <Card style={styles.loginCard}>
        <Card.Content>
          <Title style={styles.loginTitle}>Sign In</Title>
          <Text style={styles.loginSubtitle}>
            Enter your credentials to access the system
          </Text>

          <TextInput
            label="Employee ID"
            value={formData.employeeId}
            onChangeText={(value) => handleInputChange('employeeId', value)}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., IR123456"
            error={!!errors.employeeId}
            disabled={loading}
            autoCapitalize="characters"
            left={<TextInput.Icon icon="badge" />}
          />
          <HelperText type="error" visible={!!errors.employeeId}>
            {errors.employeeId}
          </HelperText>

          <TextInput
            label="Password"
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            mode="outlined"
            style={styles.input}
            placeholder="Enter your password"
            secureTextEntry
            error={!!errors.password}
            disabled={loading}
            left={<TextInput.Icon icon="lock" />}
          />
          <HelperText type="error" visible={!!errors.password}>
            {errors.password}
          </HelperText>

          <View style={styles.checkboxContainer}>
            <Checkbox
              status={formData.rememberMe ? 'checked' : 'unchecked'}
              onPress={() => handleInputChange('rememberMe', !formData.rememberMe)}
              disabled={loading}
            />
            <Text style={styles.checkboxLabel}>Remember Employee ID</Text>
          </View>

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.loginButton}
            contentStyle={styles.loginButtonContent}
            icon="login">
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>

          <Button
            mode="text"
            onPress={handleForgotPassword}
            disabled={loading}
            style={styles.forgotButton}>
            Forgot Password?
          </Button>
        </Card.Content>
      </Card>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Smart India Hackathon 2025</Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>

      {/* Demo Credentials Helper */}
      <Card style={styles.demoCard}>
        <Card.Content>
          <Text style={styles.demoTitle}>Demo Credentials:</Text>
          <Text style={styles.demoText}>Employee ID: IR123456</Text>
          <Text style={styles.demoText}>Password: demo123</Text>
          <Button
            mode="outlined"
            onPress={() => {
              setFormData({
                employeeId: 'IR123456',
                password: 'demo123',
                rememberMe: false,
              });
            }}
            style={styles.demoButton}
            compact>
            Use Demo Credentials
          </Button>
        </Card.Content>
      </Card>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  loginCard: {
    elevation: 8,
    borderRadius: 12,
    marginVertical: 20,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976D2',
    textAlign: 'center',
    marginBottom: 10,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    marginBottom: 5,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  loginButton: {
    marginTop: 20,
    borderRadius: 8,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  forgotButton: {
    marginTop: 10,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  demoCard: {
    backgroundColor: '#E3F2FD',
    marginBottom: 20,
    borderRadius: 8,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 5,
  },
  demoText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
  demoButton: {
    marginTop: 10,
    borderColor: '#1976D2',
  },
});

export default LoginScreen;