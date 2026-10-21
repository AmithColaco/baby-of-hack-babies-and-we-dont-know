import apiClient from './client';

export interface CartCheckoutItem {
  listing_id: string;
  qty: number;
}

export interface CheckoutAddress {
  full_name?: string;
  phone?: string;
  address_line?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface CheckoutInput {
  items: CartCheckoutItem[];
  address: CheckoutAddress;
  payment_method?: 'mock_upi' | 'mock_card' | 'mock_cod';
  idempotency_key: string;
}

export interface OrderItemDetail {
  id: string;
  listing_id: string;
  qty: number;
  unit_price_inr: number;
  listing_title: string;
}

export interface PaymentDetail {
  id: string;
  provider: string;
  status: string;
  ref: string;
  created_at: string;
}

export interface OrderRecord {
  id: string;
  buyer_id: string;
  status: 'PLACED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total_inr: number;
  address_json: string;
  payment_status: 'PENDING' | 'SUCCESS' | 'FAILED';
  idempotency_key: string;
  created_at: string;
  items: OrderItemDetail[];
  payment?: PaymentDetail | null;
}

export async function checkoutOrder(input: CheckoutInput): Promise<OrderRecord> {
  const { data } = await apiClient.post<OrderRecord>('/orders', input);
  return data;
}

export async function getOrderById(orderId: string): Promise<OrderRecord> {
  const { data } = await apiClient.get<OrderRecord>(`/orders/${orderId}`);
  return data;
}

export async function getBuyerOrders(): Promise<OrderRecord[]> {
  const { data } = await apiClient.get<OrderRecord[]>('/orders');
  return data;
}

export async function getArtisanOrders(status?: string): Promise<OrderRecord[]> {
  const { data } = await apiClient.get<OrderRecord[]>('/artisan/orders', {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function updateOrderStatus(
  orderId: string,
  status: 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
): Promise<OrderRecord> {
  const { data } = await apiClient.patch<OrderRecord>(`/orders/${orderId}/status`, { status });
  return data;
}
