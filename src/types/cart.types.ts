import { ProductStatus } from './product.types';

export interface CartRow {
  id: string;
}

export interface CartItemRow {
  cart_id: string;
  item_id: string | null;
  product_id: string | null;
  product_name: string | null;
  image_url: string | null;
  quantity: number | null;
  product_price: string | null;
  product_status: ProductStatus | null;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  productStatus: ProductStatus;
}

export interface Cart {
  id: string;
  items: CartItem[];
  itemsCount: number;
  total: number;
}
