export type Role = 'tenant' | 'landlord' | 'admin';

export interface PublicUser {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  user: PublicUser;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: 'tenant' | 'landlord';
}
