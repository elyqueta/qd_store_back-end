import { PaginatedResult } from './pagination.types';
import { PaymentSummary } from './payment.types';

export type OrderStatus = 'processing' | 'in_transit' | 'delivered' | 'cancelled';
export type OrderType = 'personal' | 'business';

export interface OrderRow {
  id: string;
  reference: string;
  id_user: string;
  id_company: string | null;
  type: OrderType;
  status: OrderStatus;
  id_payment_method: string;
  id_delivery_type: string;
  notes: string | null;
  total: string;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItemRow {
  id: string;
  id_product: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface OrderAddressRow {
  province: string;
  municipality: string;
  neighborhood: string;
  address: string;
  reference: string | null;
  latitude: string | null;
  longitude: string | null;
}

export interface OrderHistoryRow {
  id: string;
  previous_status: OrderStatus | null;
  new_status: OrderStatus;
  changed_by: string | null;
  note: string | null;
  created_at: Date;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderAddress {
  province: string;
  municipality: string;
  neighborhood: string;
  address: string;
  reference: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface OrderHistoryEntry {
  id: string;
  previousStatus: OrderStatus | null;
  newStatus: OrderStatus;
  changedBy: string | null;
  note: string | null;
  createdAt: Date;
}

export interface OrderSummary {
  id: string;
  reference: string;
  type: OrderType;
  status: OrderStatus;
  total: number;
  itemsCount: number;
  createdAt: Date;
}

export interface Order extends Omit<OrderSummary, 'itemsCount'> {
  userId: string;
  companyId: string | null;
  paymentMethodId: string;
  deliveryTypeId: string;
  deliveryPrice: number;
  notes: string | null;
  address: OrderAddress;
  items: OrderItem[];
  history: OrderHistoryEntry[];
  payment: PaymentSummary | null;
  updatedAt: Date;
}

export interface OrderFilters {
  status?: OrderStatus;
  userId?: string;
}

export interface CreateOrderData {
  userId: string;
  companyId: string | null;
  type: OrderType;
  paymentMethodId: string;
  deliveryTypeId: string;
  deliveryPrice: number;
  notes: string | null;
  addressId: string;
  address: OrderAddress;
}

export type OrderListResult = PaginatedResult<OrderSummary>;
