import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  constructor() {
    this.baseURL = 'https://api.ireps.gov.in/auth';
  }

  async login(credentials) {
    try {
      const { employeeId, password } = credentials;
      
      // For demo purposes, we'll use mock authentication
      // In production, this would make an API call to the authentication service
      
      if (employeeId === 'IR123456' && password === 'demo123') {
        const mockToken = this.generateMockToken();
        const mockUser = this.generateMockUser(employeeId);
        
        return {
          success: true,
          token: mockToken,
          user: mockUser,
          message: 'Login successful',
        };
      } else {
        // Try production authentication if demo fails
        return await this.authenticateWithAPI(credentials);
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Authentication failed. Please check your credentials.',
      };
    }
  }

  async authenticateWithAPI(credentials) {
    try {
      const response = await axios.post(`${this.baseURL}/login`, {
        employeeId: credentials.employeeId,
        password: credentials.password,
        deviceId: await this.getDeviceId(),
        appVersion: '1.0.0',
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'IR-TrackManager-Mobile/1.0.0',
        },
      });

      if (response.data.success) {
        return {
          success: true,
          token: response.data.token,
          user: response.data.user,
          permissions: response.data.permissions,
          message: 'Login successful',
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Invalid credentials',
        };
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Connection timeout. Please check your internet connection.',
        };
      } else if (error.response && error.response.status === 401) {
        return {
          success: false,
          error: 'Invalid employee ID or password.',
        };
      } else if (error.response && error.response.status === 403) {
        return {
          success: false,
          error: 'Account is disabled. Please contact administrator.',
        };
      } else {
        return {
          success: false,
          error: 'Network error. Please try again.',
        };
      }
    }
  }

  generateMockToken() {
    const payload = {
      employeeId: 'IR123456',
      role: 'inspector',
      permissions: ['scan', 'inspect', 'report'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };
    
    return btoa(JSON.stringify(payload));
  }

  generateMockUser(employeeId) {
    return {
      employeeId: employeeId,
      name: 'Demo Inspector',
      designation: 'Assistant Engineer',
      department: 'Track Maintenance',
      division: 'Northern Railway',
      zone: 'Delhi Division',
      email: 'demo.inspector@indianrailways.gov.in',
      phone: '+91-98765-43210',
      permissions: {
        canScan: true,
        canInspect: true,
        canGenerateReports: true,
        canExportData: true,
        canManageInventory: false,
        canModifySettings: false,
      },
      lastLogin: new Date().toISOString(),
      profileImage: null,
    };
  }

  async getDeviceId() {
    try {
      let deviceId = await AsyncStorage.getItem('deviceId');
      if (!deviceId) {
        deviceId = this.generateDeviceId();
        await AsyncStorage.setItem('deviceId', deviceId);
      }
      return deviceId;
    } catch (error) {
      return this.generateDeviceId();
    }
  }

  generateDeviceId() {
    return 'device_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  async logout() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (token) {
        // Inform server about logout (optional)
        try {
          await axios.post(`${this.baseURL}/logout`, {}, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            timeout: 5000,
          });
        } catch (error) {
          // Logout from server failed, but we'll continue with local logout
          console.warn('Server logout failed:', error.message);
        }
      }

      // Clear local storage
      await AsyncStorage.multiRemove([
        'authToken',
        'userProfile',
        'dashboard_data',
        'inventory_data',
      ]);

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  }

  async refreshToken() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      const response = await axios.post(`${this.baseURL}/refresh`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        timeout: 10000,
      });

      if (response.data.success) {
        await AsyncStorage.setItem('authToken', response.data.token);
        return { success: true, token: response.data.token };
      } else {
        return { success: false, error: 'Token refresh failed' };
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false, error: 'Token refresh failed' };
    }
  }

  async validateToken() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        return { valid: false, error: 'No token found' };
      }

      // For demo token, just check if it's not expired
      if (token.startsWith('eyJ') || token.length > 100) {
        // Looks like a real JWT token
        const response = await axios.get(`${this.baseURL}/validate`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          timeout: 5000,
        });
        
        return { valid: response.data.valid };
      } else {
        // Mock token validation
        try {
          const payload = JSON.parse(atob(token));
          const now = Math.floor(Date.now() / 1000);
          return { valid: payload.exp > now };
        } catch (error) {
          return { valid: false, error: 'Invalid token format' };
        }
      }
    } catch (error) {
      console.error('Token validation error:', error);
      return { valid: false, error: 'Token validation failed' };
    }
  }

  async getCurrentUser() {
    try {
      const userProfile = await AsyncStorage.getItem('userProfile');
      return userProfile ? JSON.parse(userProfile) : null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  async updateProfile(updates) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const currentUser = await this.getCurrentUser();
      
      if (!token || !currentUser) {
        return { success: false, error: 'User not authenticated' };
      }

      // Update server
      const response = await axios.put(`${this.baseURL}/profile`, updates, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        timeout: 10000,
      });

      if (response.data.success) {
        // Update local profile
        const updatedUser = { ...currentUser, ...updates };
        await AsyncStorage.setItem('userProfile', JSON.stringify(updatedUser));
        
        return { success: true, user: updatedUser };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: 'Profile update failed' };
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        return { success: false, error: 'User not authenticated' };
      }

      const response = await axios.post(`${this.baseURL}/change-password`, {
        currentPassword,
        newPassword,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        timeout: 10000,
      });

      return {
        success: response.data.success,
        error: response.data.error,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, error: 'Password change failed' };
    }
  }

  async requestPasswordReset(employeeId) {
    try {
      const response = await axios.post(`${this.baseURL}/reset-password`, {
        employeeId,
      }, {
        timeout: 10000,
      });

      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return { 
        success: false, 
        error: 'Password reset request failed. Please contact IT support.' 
      };
    }
  }

  async checkPermission(permission) {
    try {
      const user = await this.getCurrentUser();
      if (!user || !user.permissions) {
        return false;
      }

      return user.permissions[permission] === true;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  async getAuthHeaders() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token ? { 'Authorization': `Bearer ${token}` } : {};
    } catch (error) {
      console.error('Get auth headers error:', error);
      return {};
    }
  }

  isTokenExpired(token) {
    try {
      if (!token) return true;
      
      // For demo token
      if (!token.includes('.')) {
        const payload = JSON.parse(atob(token));
        const now = Math.floor(Date.now() / 1000);
        return payload.exp <= now;
      }
      
      // For JWT token
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp <= now;
    } catch (error) {
      return true;
    }
  }

  async setupBiometricAuth() {
    try {
      // This would integrate with react-native-biometrics or similar
      // For now, just return a mock response
      return {
        success: true,
        available: false,
        message: 'Biometric authentication not available on this device',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Biometric setup failed',
      };
    }
  }
}

export const authService = new AuthService();