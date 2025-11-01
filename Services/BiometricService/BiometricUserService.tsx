// src/services/BiometricUserService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.0.179:8000'; 

export interface CreateUserRequest {
    userId: number;
    name: string;
    role: 'Normal User' | 'Super Admin';
    verificationMethods: {
        fingerprint: boolean;
        face: boolean;
        password: boolean;
        badge: boolean;
    };
    password?: string;
    badgeNumber?: string;
    faceImage?: string;
}

export interface BiometricUser {
    uid: number;
    userId: number;
    name: string;
    role: 'Normal User' | 'Super Admin';
    hasFingerprint: boolean;
    hasFace: boolean;
    hasPassword: boolean;
    badgeNumber?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    nextStep?: string;
}

export interface UserListResponse {
    success: boolean;
    users: BiometricUser[];
    error?: string;
}

export class BiometricUserService {
    private static async getAuthHeaders() {
        const token = await AsyncStorage.getItem('token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    }

    static async getAllUsers(): Promise<UserListResponse> {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${API_BASE_URL}/api/v1/biometric/users`, {
                method: 'GET',
                headers,
            });
            const data = await response.json();
            
            // Handle backend response format
            if (data.success !== undefined) {
                return data;
            } else {
                // Handle sendResponse format
                return {
                    success: response.ok,
                    users: data.data?.users || data.users || [],
                    error: response.ok ? undefined : data.message || 'Failed to load users'
                };
            }
        } catch (error) {
            console.error('getAllUsers error:', error);
            return {
                success: false,
                users: [],
                error: 'Network error occurred'
            };
        }
    }

    static async createUser(userData: CreateUserRequest): Promise<ApiResponse<BiometricUser>> {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${API_BASE_URL}/api/v1/biometric/users?empCode=${userData.userId}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(userData),
            });
            const data = await response.json();
            
            // Handle backend response format
            if (data.success !== undefined) {
                return data;
            } else {
                // Handle sendResponse format
                return {
                    success: response.ok,
                    data: data.data,
                    message: data.message,
                    nextStep: data.nextStep,
                    error: response.ok ? undefined : data.message || 'Failed to create user'
                };
            }
        } catch (error) {
            console.error('createUser error:', error);
            return {
                success: false,
                error: 'Network error occurred'
            };
        }
    }

    static async updateUser(user: BiometricUser): Promise<ApiResponse<BiometricUser>> {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${API_BASE_URL}/api/v1/biometric/users/${user.uid}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(user),
            });
            const data = await response.json();
            
            return {
                success: response.ok,
                data: data.data,
                message: data.message,
                error: response.ok ? undefined : data.message || 'Failed to update user'
            };
        } catch (error) {
            console.error('updateUser error:', error);
            return {
                success: false,
                error: 'Network error occurred'
            };
        }
    }

    static async deleteUser(uid: number): Promise<ApiResponse<void>> {
        try {
            const headers = await this.getAuthHeaders();
            const response = await fetch(`${API_BASE_URL}/api/v1/biometric/users/${uid}`, {
                method: 'DELETE',
                headers,
            });
            const data = await response.json();
            
            return {
                success: response.ok,
                message: data.message,
                error: response.ok ? undefined : data.message || 'Failed to delete user'
            };
        } catch (error) {
            console.error('deleteUser error:', error);
            return {
                success: false,
                error: 'Network error occurred'
            };
        }
    }
}


// // src/services/BiometricUserService.ts
// import { BiometricUser, CreateUserRequest, ApiResponse, UserListResponse } from '../../Global/BiometricUser';

// const API_BASE_URL = 'http://192.168.0.159:8000'; // Your backend URL

// export class BiometricUserService {
//   static async getAllUsers(): Promise<UserListResponse> {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/v1/biometric/users`);
//       const data = await response.json();
//       return data;
//     } catch (error) {
//       return {
//         success: false,
//         users: [],
//         error: 'Network error occurred'
//       };
//     }
//   }

//   static async createUser(userData: CreateUserRequest): Promise<ApiResponse<BiometricUser>> {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/v1/biometric/users`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(userData),
//       });
//       const data = await response.json();
//       return data;
//     } catch (error) {
//       return {
//         success: false,
//         error: 'Network error occurred'
//       };
//     }
//   }

//   static async updateUser(user: BiometricUser): Promise<ApiResponse<BiometricUser>> {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/v1/biometric/users/${user.uid}`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(user),
//       });
//       const data = await response.json();
//       return data;
//     } catch (error) {
//       return {
//         success: false,
//         error: 'Network error occurred'
//       };
//     }
//   }

//   static async deleteUser(uid: number): Promise<ApiResponse<void>> {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/v1/biometric/users/${uid}`, {
//         method: 'DELETE',
//       });
//       const data = await response.json();
//       return data;
//     } catch (error) {
//       return {
//         success: false,
//         error: 'Network error occurred'
//       };
//     }
//   }
// }
