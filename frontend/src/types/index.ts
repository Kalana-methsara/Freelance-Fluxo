// Updated to match your MongoDB schema and Express controller
export interface Customer {
  _id: string;      // MongoDB uses _id
  name: string;
  email: string;
  phone: string;
  address: string;
}

// Updated PaginatedResponse to match your controller's structure:
// { data: [], pagination: { totalData, totalPages, currentPage, limit } }
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    totalData: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export type { AuthUser, LoginCredentials, RegisterUserPayload, UserRole } from "./auth";
export { UserRole as UserRoles } from "./auth";

export interface Item {
  id: string;
  description: string;
  price: number;
  quantity: number;
  unit: string;
}

export interface OrderLineItem {
  itemId: string;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderLineItem[];
  total?: number;
  createdAt?: string;
}

export interface Blog {
  _id: string;
  title: string;
  content: string;
  imageURL?: string;
  author: { name: string; email: string };
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface BlogResponse {
  data: Blog[];
  pagination: {
    totalPages: number;
    totalCount: number;
  };
}