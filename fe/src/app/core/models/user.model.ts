/** Bảng users */
export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: 'TEACHER' | 'ADMIN';
  tokenTele?: string;
  idChatTele?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}
