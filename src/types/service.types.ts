export interface Service {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  imageUrl: string | null;
  startsFromPrice: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  image_url: string | null;
  starts_from_price: string | number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
