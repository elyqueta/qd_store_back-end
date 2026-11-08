export type HighlightPlacement = 'hero' | 'showcase' | 'category_block';
export type HighlightTheme = 'dark' | 'light';

export interface HighlightRelatedProduct {
  id: string;
  name: string;
  price: number;
  mainImageUrl: string | null;
}

export interface HighlightRelatedCategory {
  id: string;
  label: string;
  icon: string | null;
}

export interface Highlight {
  id: string;
  placement: HighlightPlacement;
  title: string;
  subtitle: string | null;
  label: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  imageUrl: string | null;
  theme: HighlightTheme;
  product: HighlightRelatedProduct | null;
  category: HighlightRelatedCategory | null;
  displayOrder: number;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HighlightRow {
  id: string;
  placement: HighlightPlacement;
  title: string;
  subtitle: string | null;
  label: string | null;
  cta_label: string | null;
  cta_url: string | null;
  image_url: string | null;
  theme: HighlightTheme;
  product: HighlightRelatedProduct | null;
  category: HighlightRelatedCategory | null;
  display_order: number;
  is_active: boolean;
  starts_at: Date | null;
  ends_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
