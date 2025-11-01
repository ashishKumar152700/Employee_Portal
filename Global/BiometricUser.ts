// src/types/BiometricUser.ts
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
