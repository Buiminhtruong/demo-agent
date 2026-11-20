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

export interface Province {
  code: string;
  name: string;
}

export interface District {
  code: string;
  name: string;
  provinceCode: string;
}

export interface RoomPhoto {
  id: number;
  url: string;
}

export interface Room {
  id: number;
  title: string;
  description: string;
  price: number;
  area: number;
  provinceCode: string;
  provinceName: string;
  districtCode: string;
  districtName: string;
  address: string;
  status: 'available' | 'rented';
  hiddenByOwner: boolean;
  hiddenByAdmin: boolean;
  photos: RoomPhoto[];
  createdAt: string;
  pendingAppointmentCount?: number;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: 'tenant' | 'landlord';
}
