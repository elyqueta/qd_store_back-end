/**
 * Dados centrais dos seeds — a ÚNICA fonte de verdade para os dados
 * de teste. Cada módulo de seed importa apenas os dados de que precisa,
 * mantendo a responsabilidade de "o quê criar" separada de "como criar".
 */

export const SEED_PASSWORD = 'Teste1234';

export interface SeedUser {
  fullName: string;
  email: string;
  phone: string;
  nif?: string;
  accountType: 'personal' | 'business';
  role?: 'customer' | 'admin';
}

export interface SeedCompany {
  name: string;
  nif: string;
  sector: string;
}

export interface SeedCategory {
  label: string;
  icon: string;
}

export interface SeedProductImage {
  url: string;
  displayOrder: number;
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
}

export interface SeedProductSpecification {
  specKey: string;
  specValue: string;
  displayOrder: number;
}

export interface SeedProduct {
  categoryLabel: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  images: SeedProductImage[];
  specifications: SeedProductSpecification[];
}

export interface SeedAddress {
  userEmail: string;
  label: string;
  province: string;
  municipality: string;
  neighborhood: string;
  address: string;
  reference?: string;
  latitude?: number;
  longitude?: number;
}

export interface SeedDeliveryType {
  name: string;
  description: string;
  price: number;
  type: 'standard' | 'express' | 'corporate' | 'pickup';
}

export interface SeedPaymentMethod {
  name: string;
  type: 'multicaixa_express' | 'multicaixa_reference' | 'bank_transfer';
}

export interface SeedUserCompany {
  userEmail: string;
  companyName: string;
  role: string;
}

export interface SeedCartItem {
  userEmail: string;
  productName: string;
  quantity: number;
}

export interface SeedOrderItem {
  productName: string;
  quantity: number;
}

export interface SeedOrder {
  userEmail: string;
  deliveryTypeName: string;
  paymentMethodName: string;
  items: SeedOrderItem[];
  status: 'processing' | 'in_transit' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'confirmed' | 'failed' | 'refunded';
}

export interface SeedWishlistItem {
  userEmail: string;
  productName: string;
}

export interface SeedNotification {
  userEmail: string;
  type: 'order' | 'promotion' | 'newsletter' | 'system';
  message: string;
}

export const SEED_USERS: SeedUser[] = [
  {
    fullName: 'Admin QD',
    email: 'admin@qd.co.ao',
    phone: '923000000',
    accountType: 'personal',
    role: 'admin',
  },
  {
    fullName: 'João Silva',
    email: 'joao.silva@example.com',
    phone: '923111111',
    nif: '500000111',
    accountType: 'personal',
  },
  {
    fullName: 'Maria Santos',
    email: 'maria.santos@example.com',
    phone: '923222222',
    nif: '500000222',
    accountType: 'personal',
  },
  {
    fullName: 'Empresa Tech Angola',
    email: 'empresa.tech@example.com',
    phone: '923333333',
    nif: '500000333',
    accountType: 'business',
  },
];

export const SEED_COMPANIES: SeedCompany[] = [
  { name: 'QD Solutions', nif: '500000001', sector: 'Tecnologia' },
  { name: 'TechAngola', nif: '500000002', sector: 'Informática' },
];

export const SEED_USER_COMPANIES: SeedUserCompany[] = [
  { userEmail: 'admin@qd.co.ao', companyName: 'QD Solutions', role: 'Administrador' },
  { userEmail: 'empresa.tech@example.com', companyName: 'QD Solutions', role: 'Gerente' },
  { userEmail: 'empresa.tech@example.com', companyName: 'TechAngola', role: 'Diretor' },
];

export const SEED_CATEGORIES: SeedCategory[] = [
  { label: 'Portáteis', icon: '💻' },
  { label: 'Smartphones', icon: '📱' },
  { label: 'Acessórios', icon: '🎧' },
  { label: 'Componentes', icon: '🔧' },
];

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    categoryLabel: 'Portáteis',
    name: 'MacBook Pro 14" M3',
    description:
      'Portátil Apple MacBook Pro de 14 polegadas com chip M3, 16GB de RAM unificada e 512GB SSD. Ideal para desenvolvimento e criação de conteúdo.',
    price: 1850000,
    originalPrice: 2100000,
    badge: 'Novo',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8',
        displayOrder: 0,
        width: 1200,
        height: 800,
        format: 'jpg',
        sizeBytes: 245000,
      },
      {
        url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef',
        displayOrder: 1,
        width: 1200,
        height: 800,
        format: 'jpg',
        sizeBytes: 198000,
      },
    ],
    specifications: [
      { specKey: 'Marca', specValue: 'Apple', displayOrder: 0 },
      { specKey: 'Modelo', specValue: 'MacBook Pro 14"', displayOrder: 1 },
      { specKey: 'Processador', specValue: 'Apple M3', displayOrder: 2 },
      { specKey: 'Memória RAM', specValue: '16GB', displayOrder: 3 },
      { specKey: 'Armazenamento', specValue: '512GB SSD', displayOrder: 4 },
      { specKey: 'Garantia', specValue: '12 meses', displayOrder: 5 },
    ],
  },
  {
    categoryLabel: 'Portáteis',
    name: 'Dell XPS 13 Plus',
    description:
      'Ultrabook Dell XPS 13 Plus com processador Intel Core i7-1360P, 16GB RAM e 512GB SSD. Design premium em alumínio.',
    price: 1450000,
    badge: 'Promoção',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45',
        displayOrder: 0,
        width: 1200,
        height: 800,
        format: 'jpg',
        sizeBytes: 210000,
      },
    ],
    specifications: [
      { specKey: 'Marca', specValue: 'Dell', displayOrder: 0 },
      { specKey: 'Modelo', specValue: 'XPS 13 Plus', displayOrder: 1 },
      { specKey: 'Processador', specValue: 'Intel Core i7-1360P', displayOrder: 2 },
      { specKey: 'Memória RAM', specValue: '16GB', displayOrder: 3 },
      { specKey: 'Armazenamento', specValue: '512GB SSD', displayOrder: 4 },
      { specKey: 'Garantia', specValue: '24 meses', displayOrder: 5 },
    ],
  },
  {
    categoryLabel: 'Portáteis',
    name: 'Lenovo ThinkPad X1 Carbon',
    description:
      'ThinkPad X1 Carbon Gen 11 com Intel Core i7-1355U, 16GB RAM e 1TB SSD. Leve, durável e com teclado excecional.',
    price: 1650000,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1544731612-de7f96afe55f',
        displayOrder: 0,
        width: 1200,
        height: 800,
        format: 'jpg',
        sizeBytes: 225000,
      },
    ],
    specifications: [
      { specKey: 'Marca', specValue: 'Lenovo', displayOrder: 0 },
      { specKey: 'Modelo', specValue: 'ThinkPad X1 Carbon', displayOrder: 1 },
      { specKey: 'Processador', specValue: 'Intel Core i7-1355U', displayOrder: 2 },
      { specKey: 'Memória RAM', specValue: '16GB', displayOrder: 3 },
      { specKey: 'Armazenamento', specValue: '1TB SSD', displayOrder: 4 },
      { specKey: 'Garantia', specValue: '36 meses', displayOrder: 5 },
    ],
  },
  {
    categoryLabel: 'Smartphones',
    name: 'iPhone 15 Pro',
    description:
      'Apple iPhone 15 Pro com ecrã Super Retina XDR de 6.1", chip A17 Pro, câmara tripla de 48MP e titânio.',
    price: 1250000,
    originalPrice: 1350000,
    badge: 'Novo',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569',
        displayOrder: 0,
        width: 1200,
        height: 800,
        format: 'jpg',
        sizeBytes: 185000,
      },
      {
        url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab',
        displayOrder: 1,
        width: 1200,
        height: 800,
        format: 'jpg',
        sizeBytes: 172000,
      },
    ],
    specifications: [
      { specKey: 'Marca', specValue: 'Apple', displayOrder: 0 },
      { specKey: 'Modelo', specValue: 'iPhone 15 Pro', displayOrder: 1 },
      { specKey: 'Ecrã', specValue: '6.1" Super Retina XDR', displayOrder: 2 },
      { specKey: 'Câmara', specValue: 'Tripla 48MP', displayOrder: 3 },
      { specKey: 'Armazenamento', specValue: '256GB', displayOrder: 4 },
      { specKey: 'Garantia', specValue: '12 meses', displayOrder: 5 },
    ],
  },
  {
    categoryLabel: 'Smartphones',
    name: 'Samsung Galaxy S24 Ultra',
    description:
      'Samsung Galaxy S24 Ultra com ecrã Dynamic AMOLED 2X de 6.8", Snapdragon 8 Gen 3, câmara de 200MP e S Pen.',
    price: 1150000,
    badge: 'Promoção',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf',
        displayOrder: 0,
        width: 1200,
        height: 800,
        format: 'jpg',
        sizeBytes: 195000,
      },
    ],
    specifications: [
      { specKey: 'Marca', specValue: 'Samsung', displayOrder: 0 },
      { specKey: 'Modelo', specValue: 'Galaxy S24 Ultra', displayOrder: 1 },
      { specKey: 'Ecrã', specValue: '6.8" Dynamic AMOLED 2X', displayOrder: 2 },
      { specKey: 'Câmara', specValue: '200MP', displayOrder: 3 },
      { specKey: 'Armazenamento', specValue: '512GB', displayOrder: 4 },
      { specKey: 'Garantia', specValue: '24 meses', displayOrder: 5 },
    ],
  },
  {
    categoryLabel: 'Acessórios',
    name: 'Auscultadores Bluetooth Sony WH-1000XM5',
    description:
      'Auscultadores over-ear com cancelamento de ruído ativo líder da indústria, 30h de bateria e som de alta resolução.',
    price: 350000,
    originalPrice: 400000,
    badge: 'Promoção',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb',
        displayOrder: 0,
        width: 1200,
        height: 800,
        format: 'jpg',
        sizeBytes: 145000,
      },
    ],
    specifications: [
      { specKey: 'Marca', specValue: 'Sony', displayOrder: 0 },
      { specKey: 'Modelo', specValue: 'WH-1000XM5', displayOrder: 1 },
      { specKey: 'Tipo', specValue: 'Over-ear Bluetooth', displayOrder: 2 },
      { specKey: 'Bateria', specValue: '30 horas', displayOrder: 3 },
      { specKey: 'Garantia', specValue: '12 meses', displayOrder: 4 },
    ],
  },
  {
    categoryLabel: 'Acessórios',
    name: 'Teclado Mecânico Keychron K8 Pro',
    description:
      'Teclado mecânico wireless com hot-swap, RGB retroiluminado e layout TKL. Compatível com Mac e Windows.',
    price: 85000,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3',
        displayOrder: 0,
        width: 1200,
        height: 800,
        format: 'jpg',
        sizeBytes: 132000,
      },
    ],
    specifications: [
      { specKey: 'Marca', specValue: 'Keychron', displayOrder: 0 },
      { specKey: 'Modelo', specValue: 'K8 Pro', displayOrder: 1 },
      { specKey: 'Tipo', specValue: 'Mecânico TKL', displayOrder: 2 },
      { specKey: 'Conectividade', specValue: 'Bluetooth + USB-C', displayOrder: 3 },
      { specKey: 'Garantia', specValue: '12 meses', displayOrder: 4 },
    ],
  },
  {
    categoryLabel: 'Componentes',
    name: 'SSD NVMe Samsung 990 Pro 1TB',
    description:
      'SSD NVMe PCIe 4.0 com velocidades de leitura até 7450MB/s. Perfeito para gaming e criação de conteúdo.',
    price: 95000,
    badge: 'Mais vendido',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1600267185393-e158a98703de',
        displayOrder: 0,
        width: 1200,
        height: 800,
        format: 'jpg',
        sizeBytes: 118000,
      },
    ],
    specifications: [
      { specKey: 'Marca', specValue: 'Samsung', displayOrder: 0 },
      { specKey: 'Modelo', specValue: '990 Pro', displayOrder: 1 },
      { specKey: 'Capacidade', specValue: '1TB', displayOrder: 2 },
      { specKey: 'Interface', specValue: 'NVMe PCIe 4.0', displayOrder: 3 },
      { specKey: 'Garantia', specValue: '60 meses', displayOrder: 4 },
    ],
  },
  {
    categoryLabel: 'Componentes',
    name: 'Memória RAM Corsair Vengeance 16GB DDR5',
    description:
      'Kit de memória RAM DDR5 de 16GB (2x8GB) com 5600MHz e dissipador de calor em alumínio.',
    price: 65000,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1562976540-1502c2145186',
        displayOrder: 0,
        width: 1200,
        height: 800,
        format: 'jpg',
        sizeBytes: 125000,
      },
    ],
    specifications: [
      { specKey: 'Marca', specValue: 'Corsair', displayOrder: 0 },
      { specKey: 'Modelo', specValue: 'Vengeance', displayOrder: 1 },
      { specKey: 'Capacidade', specValue: '16GB (2x8GB)', displayOrder: 2 },
      { specKey: 'Velocidade', specValue: '5600MHz DDR5', displayOrder: 3 },
      { specKey: 'Garantia', specValue: '24 meses', displayOrder: 4 },
    ],
  },
];

export const SEED_ADDRESSES: SeedAddress[] = [
  {
    userEmail: 'joao.silva@example.com',
    label: 'Casa',
    province: 'Luanda',
    municipality: 'Talatona',
    neighborhood: 'Benfica',
    address: 'Rua da Samba, Edifício QD, Apartamento 12B',
    reference: 'Perto do supermercado Kero',
    latitude: -8.9167,
    longitude: 13.1833,
  },
  {
    userEmail: 'joao.silva@example.com',
    label: 'Trabalho',
    province: 'Luanda',
    municipality: 'Viana',
    neighborhood: 'Zango',
    address: 'Avenida Fidel Castro, Zona Industrial',
    reference: 'Ao lado da fábrica de bebidas',
    latitude: -8.9033,
    longitude: 13.3644,
  },
  {
    userEmail: 'maria.santos@example.com',
    label: 'Casa',
    province: 'Luanda',
    municipality: 'Kilamba Kiaxi',
    neighborhood: 'Vila Alice',
    address: 'Rua da Missão, Nº 45',
    reference: 'Perto da igreja',
    latitude: -8.8369,
    longitude: 13.2344,
  },
  {
    userEmail: 'empresa.tech@example.com',
    label: 'Escritório',
    province: 'Luanda',
    municipality: 'Ingombota',
    neighborhood: 'Maculusso',
    address: 'Rua Rainha Ginga, Edifício Atlântico, 5º Andar',
    reference: 'Em frente ao Hotel Presidente',
    latitude: -8.8137,
    longitude: 13.2302,
  },
];

export const SEED_DELIVERY_TYPES: SeedDeliveryType[] = [
  { name: 'Entrega Standard', description: 'Entrega em 3-5 dias úteis', price: 2500, type: 'standard' },
  { name: 'Entrega Express', description: 'Entrega em 24-48 horas', price: 5000, type: 'express' },
  { name: 'Levantamento na Loja', description: 'Levantamento gratuito na loja', price: 0, type: 'pickup' },
];

export const SEED_PAYMENT_METHODS: SeedPaymentMethod[] = [
  { name: 'Multicaixa Express', type: 'multicaixa_express' },
  { name: 'Multicaixa Referência', type: 'multicaixa_reference' },
  { name: 'Transferência Bancária', type: 'bank_transfer' },
];

export const SEED_CART_ITEMS: SeedCartItem[] = [
  { userEmail: 'joao.silva@example.com', productName: 'MacBook Pro 14" M3', quantity: 1 },
  { userEmail: 'joao.silva@example.com', productName: 'Auscultadores Bluetooth Sony WH-1000XM5', quantity: 2 },
  { userEmail: 'maria.santos@example.com', productName: 'iPhone 15 Pro', quantity: 1 },
  { userEmail: 'maria.santos@example.com', productName: 'Teclado Mecânico Keychron K8 Pro', quantity: 1 },
];

export const SEED_ORDERS: SeedOrder[] = [
  {
    userEmail: 'joao.silva@example.com',
    deliveryTypeName: 'Entrega Express',
    paymentMethodName: 'Multicaixa Express',
    items: [
      { productName: 'MacBook Pro 14" M3', quantity: 1 },
      { productName: 'Auscultadores Bluetooth Sony WH-1000XM5', quantity: 1 },
    ],
    status: 'delivered',
    paymentStatus: 'confirmed',
  },
  {
    userEmail: 'maria.santos@example.com',
    deliveryTypeName: 'Entrega Standard',
    paymentMethodName: 'Multicaixa Referência',
    items: [{ productName: 'iPhone 15 Pro', quantity: 1 }],
    status: 'processing',
    paymentStatus: 'pending',
  },
  {
    userEmail: 'empresa.tech@example.com',
    deliveryTypeName: 'Levantamento na Loja',
    paymentMethodName: 'Transferência Bancária',
    items: [
      { productName: 'Dell XPS 13 Plus', quantity: 2 },
      { productName: 'SSD NVMe Samsung 990 Pro 1TB', quantity: 5 },
    ],
    status: 'in_transit',
    paymentStatus: 'confirmed',
  },
];

export const SEED_WISHLIST_ITEMS: SeedWishlistItem[] = [
  { userEmail: 'joao.silva@example.com', productName: 'iPhone 15 Pro' },
  { userEmail: 'maria.santos@example.com', productName: 'MacBook Pro 14" M3' },
];

export const SEED_NOTIFICATIONS: SeedNotification[] = [
  {
    userEmail: 'joao.silva@example.com',
    type: 'order',
    message: 'O seu pedido QD-... foi entregue com sucesso.',
  },
  {
    userEmail: 'maria.santos@example.com',
    type: 'promotion',
    message: 'Promoção especial: até 20% de desconto em acessórios!',
  },
  {
    userEmail: 'empresa.tech@example.com',
    type: 'system',
    message: 'Bem-vindo à QD Solutions! A sua conta empresarial está ativa.',
  },
];