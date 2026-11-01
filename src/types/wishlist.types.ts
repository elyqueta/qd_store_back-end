import { ProductStatus } from './product.types';

export interface WishlistRow {
  id: string;
  product_id: string;
  product_name: string;
  price: string;
  original_price: string | null;
  badge: string | null;
  status: ProductStatus;
  image_url: string | null;
  created_at: Date;
}

export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice: number | null;
  badge: string | null;
  status: ProductStatus;
  imageUrl: string | null;
  createdAt: Date;
}
