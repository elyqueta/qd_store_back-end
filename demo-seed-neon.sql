-- QD Store: dados de demonstração para PostgreSQL/Neon.
--
-- Executar depois de aplicar todas as migrations do projecto.
-- Executar o ficheiro completo numa única execução/conexão: as primeiras
-- secções usam uma tabela temporária para preparar produtos, imagens e specs.
-- O script é transaccional e pode ser executado novamente sem duplicar
-- os registos de demonstração. Não apaga dados existentes.
--
-- Contas de demonstração (não reutilizar em produção):
--   Admin:    demo.admin@example.com
--   Cliente:  demo.cliente1@example.com
--   Cliente:  demo.cliente2@example.com
--   Cliente:  demo.cliente3@example.com
--   Empresa:  demo.empresa@example.com
--   Palavra-passe comum: DemoQD2026!
--
-- São criados 50 produtos, imagens e especificações, categorias,
-- utilizadores, empresas, moradas, serviços, destaques, opções de
-- entrega/pagamento, carrinhos, favoritos, notificações e 2 encomendas
-- de exemplo. Sessões e registos de auditoria não são falsificados.

BEGIN;

CREATE TEMP TABLE qd_demo_product_seed (
  sku text PRIMARY KEY,
  category_slug text NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  price numeric(15,2) NOT NULL,
  original_price numeric(15,2),
  badge varchar(50),
  image_url text NOT NULL
) ON COMMIT DROP;

INSERT INTO qd_demo_product_seed
  (sku, category_slug, name, description, price, original_price, badge, image_url)
VALUES
  ('LAP-001', 'portateis', 'QD Atlas 14 Pro', 'Portátil de 14 polegadas para produtividade, programação e trabalho híbrido.', 895000, 980000, 'Promoção', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80'),
  ('LAP-002', 'portateis', 'QD Atlas 15', 'Portátil versátil com ecrã amplo, SSD rápido e autonomia para o dia de trabalho.', 720000, NULL, 'Mais vendido', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1000&q=80'),
  ('LAP-003', 'portateis', 'QD NovaBook Air', 'Computador leve para aulas, reuniões e tarefas do quotidiano.', 560000, NULL, NULL, 'https://images.unsplash.com/photo-1511385348-a52b4a160dc2?auto=format&fit=crop&w=1000&q=80'),
  ('LAP-004', 'portateis', 'QD Studio 16', 'Estação portátil com ecrã de alta resolução para criação e edição multimédia.', 1350000, 1490000, 'Novo', 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=1000&q=80'),
  ('LAP-005', 'portateis', 'QD EduBook 14', 'Portátil de estudo com teclado confortável e armazenamento sólido.', 430000, NULL, NULL, 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=80'),

  ('TEL-001', 'smartphones', 'QD Nova X5', 'Smartphone com ecrã AMOLED, câmara principal de alta resolução e carregamento rápido.', 485000, 525000, 'Promoção', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=80'),
  ('TEL-002', 'smartphones', 'QD Nova X5 Lite', 'Telemóvel equilibrado para comunicação, fotografia e entretenimento.', 315000, NULL, 'Mais vendido', 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1000&q=80'),
  ('TEL-003', 'smartphones', 'QD Pulse 256', 'Smartphone com 256 GB de armazenamento e bateria de longa duração.', 390000, NULL, NULL, 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1000&q=80'),
  ('TEL-004', 'smartphones', 'QD Mini 128', 'Formato compacto com câmara dupla e desbloqueio seguro.', 275000, 299000, 'Novo', 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1000&q=80'),
  ('TEL-005', 'smartphones', 'QD Max 512', 'Modelo premium com amplo armazenamento e ecrã de alto brilho.', 690000, NULL, NULL, 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=1000&q=80'),

  ('ACC-001', 'acessorios', 'Auscultadores QD Wave ANC', 'Auscultadores sem fios com cancelamento de ruído e ligação multiponto.', 125000, 145000, 'Promoção', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80'),
  ('ACC-002', 'acessorios', 'Auriculares QD Buds 2', 'Auriculares Bluetooth compactos com caixa de carregamento USB-C.', 48000, NULL, 'Mais vendido', 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=1000&q=80'),
  ('ACC-003', 'acessorios', 'Carregador QD Fast 65W', 'Carregador USB-C de 65 W para telemóveis, tablets e portáteis compatíveis.', 26500, NULL, NULL, 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1000&q=80'),
  ('ACC-004', 'acessorios', 'Power Bank QD 20000', 'Bateria externa de 20 000 mAh com duas saídas e indicador de carga.', 39000, 45000, 'Promoção', 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=1000&q=80'),
  ('ACC-005', 'acessorios', 'Coluna Bluetooth QD Boom', 'Coluna portátil resistente a salpicos para música em casa ou ao ar livre.', 58000, NULL, NULL, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1000&q=80'),

  ('CMP-001', 'componentes', 'Memória QD DDR5 16 GB', 'Módulo de memória DDR5 de 16 GB para computadores compatíveis.', 52000, NULL, NULL, 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=1000&q=80'),
  ('CMP-002', 'componentes', 'SSD QD NVMe 1 TB', 'Unidade SSD NVMe de 1 TB para arranque rápido e armazenamento.', 89000, 99000, 'Promoção', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1000&q=80'),
  ('CMP-003', 'componentes', 'Fonte QD Power 650W', 'Fonte de alimentação de 650 W para sistemas de trabalho e gaming.', 76000, NULL, NULL, 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1000&q=80'),
  ('CMP-004', 'componentes', 'Placa gráfica QD Vision 8G', 'Placa gráfica de 8 GB para jogos e aplicações de criação.', 485000, 520000, 'Novo', 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=1000&q=80'),
  ('CMP-005', 'componentes', 'Motherboard QD Core B760', 'Motherboard ATX com conectividade moderna para computadores de secretária.', 195000, NULL, NULL, 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80'),

  ('GAM-001', 'gaming', 'Comando QD Play Wireless', 'Comando sem fios compatível com PC e dispositivos suportados.', 54000, 62000, 'Promoção', 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&w=1000&q=80'),
  ('GAM-002', 'gaming', 'Headset QD Arena 7.1', 'Auscultadores gaming com microfone ajustável e som envolvente.', 68000, NULL, 'Mais vendido', 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=1000&q=80'),
  ('GAM-003', 'gaming', 'Teclado QD Mech RGB', 'Teclado mecânico com iluminação RGB e teclas de resposta rápida.', 72000, NULL, NULL, 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?auto=format&fit=crop&w=1000&q=80'),
  ('GAM-004', 'gaming', 'Rato QD Strike 12000', 'Rato gaming ajustável com sensor de alta precisão e seis botões.', 34500, 39000, 'Promoção', 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=1000&q=80'),
  ('GAM-005', 'gaming', 'Cadeira QD Gamer Comfort', 'Cadeira ergonómica com altura ajustável e apoio lombar.', 245000, NULL, 'Novo', 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=1000&q=80'),

  ('NET-001', 'redes', 'Router QD Wi-Fi 6 AX3000', 'Router dual-band Wi-Fi 6 para uma rede doméstica rápida e estável.', 98000, 112000, 'Promoção', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80'),
  ('NET-002', 'redes', 'Extensor QD Mesh AC1200', 'Extensor de cobertura sem fios para zonas com sinal reduzido.', 42000, NULL, NULL, 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80'),
  ('NET-003', 'redes', 'Switch QD Gigabit 8 Portas', 'Switch não gerido de oito portas para rede doméstica ou pequeno escritório.', 37500, NULL, NULL, 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80'),
  ('NET-004', 'redes', 'Adaptador QD USB Wi-Fi', 'Adaptador USB para adicionar conectividade Wi-Fi a computadores compatíveis.', 18500, 22000, 'Promoção', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80'),
  ('NET-005', 'redes', 'Access Point QD Pro', 'Ponto de acesso para ampliar a rede sem fios em espaços de trabalho.', 115000, NULL, 'Novo', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80'),

  ('CAM-001', 'camaras', 'Câmara QD Capture 4K', 'Câmara digital compacta com gravação 4K e ecrã articulado.', 365000, 399000, 'Promoção', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80'),
  ('CAM-002', 'camaras', 'Câmara Web QD Meet 2K', 'Câmara Web de alta definição para reuniões e aulas online.', 46500, NULL, 'Mais vendido', 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=1000&q=80'),
  ('CAM-003', 'camaras', 'Tripé QD Flex 160', 'Tripé ajustável para câmaras e telemóveis com suporte incluído.', 29500, NULL, NULL, 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1000&q=80'),
  ('CAM-004', 'camaras', 'Lente QD Prime 50', 'Lente de distância focal fixa para retratos e fotografia quotidiana.', 215000, 235000, 'Novo', 'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=1000&q=80'),
  ('CAM-005', 'camaras', 'Iluminador QD Ring 12', 'Iluminador circular com intensidade ajustável para vídeo e fotografia.', 27500, NULL, NULL, 'https://images.unsplash.com/photo-1598300056393-4aac492f4344?auto=format&fit=crop&w=1000&q=80'),

  ('STO-001', 'armazenamento', 'Pen Drive QD USB-C 128 GB', 'Memória USB-C de 128 GB para transportar ficheiros entre dispositivos.', 14500, NULL, NULL, 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1000&q=80'),
  ('STO-002', 'armazenamento', 'Disco Externo QD 2 TB', 'Disco externo portátil de 2 TB com ligação USB 3.0.', 69500, 78000, 'Promoção', 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?auto=format&fit=crop&w=1000&q=80'),
  ('STO-003', 'armazenamento', 'SSD Externo QD 1 TB', 'SSD externo compacto de 1 TB para cópias de segurança e mobilidade.', 98000, NULL, 'Mais vendido', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1000&q=80'),
  ('STO-004', 'armazenamento', 'Cartão QD microSD 256 GB', 'Cartão microSD de 256 GB para câmaras, telemóveis e tablets compatíveis.', 26500, NULL, NULL, 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80'),
  ('STO-005', 'armazenamento', 'NAS QD Home 2 Baías', 'Servidor NAS doméstico de duas baías para armazenamento em rede.', 285000, 310000, 'Novo', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80'),

  ('PER-001', 'perifericos', 'Teclado QD Office Slim', 'Teclado fino USB com layout confortável para escritório.', 19500, NULL, NULL, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1000&q=80'),
  ('PER-002', 'perifericos', 'Rato QD Office Silent', 'Rato sem fios silencioso com receptor USB e formato ambidestro.', 12500, 15000, 'Promoção', 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=1000&q=80'),
  ('PER-003', 'perifericos', 'Monitor QD View 27 QHD', 'Monitor de 27 polegadas com resolução QHD para trabalho e entretenimento.', 265000, NULL, 'Mais vendido', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1000&q=80'),
  ('PER-004', 'perifericos', 'Dock QD USB-C 8 em 1', 'Dock USB-C com HDMI, USB, leitor de cartões e carregamento pass-through.', 58500, NULL, NULL, 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=1000&q=80'),
  ('PER-005', 'perifericos', 'Tapete QD Desk XL', 'Tapete de secretária de grande formato com base antiderrapante.', 14500, NULL, NULL, 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?auto=format&fit=crop&w=1000&q=80'),

  ('PRI-001', 'impressao', 'Impressora QD Ink Home', 'Impressora multifunções a cores para casa e pequenos escritórios.', 145000, 159000, 'Promoção', 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=1000&q=80'),
  ('PRI-002', 'impressao', 'Impressora QD Laser Mono', 'Impressora laser monocromática rápida para documentos de escritório.', 198000, NULL, 'Mais vendido', 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?auto=format&fit=crop&w=1000&q=80'),
  ('PRI-003', 'impressao', 'Tinteiro QD Preto XL', 'Consumível de tinta preta de alta capacidade para modelos compatíveis.', 18500, NULL, NULL, 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=1000&q=80'),
  ('PRI-004', 'impressao', 'Toner QD Laser 2K', 'Toner de substituição para impressoras laser compatíveis.', 26500, 30000, 'Promoção', 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?auto=format&fit=crop&w=1000&q=80'),
  ('PRI-005', 'impressao', 'Papel QD A4 500 folhas', 'Resma de papel A4 para impressão e utilização diária.', 6500, NULL, NULL, 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=1000&q=80');

INSERT INTO category (id, slug, label, icon)
VALUES
  (md5('qd-demo-category:portateis')::uuid, 'portateis', 'Portáteis', 'laptop'),
  (md5('qd-demo-category:smartphones')::uuid, 'smartphones', 'Smartphones', 'mobile-screen'),
  (md5('qd-demo-category:acessorios')::uuid, 'acessorios', 'Acessórios', 'headphones'),
  (md5('qd-demo-category:componentes')::uuid, 'componentes', 'Componentes', 'microchip'),
  (md5('qd-demo-category:gaming')::uuid, 'gaming', 'Gaming', 'gamepad'),
  (md5('qd-demo-category:redes')::uuid, 'redes', 'Redes', 'wifi'),
  (md5('qd-demo-category:camaras')::uuid, 'camaras', 'Câmaras', 'camera'),
  (md5('qd-demo-category:armazenamento')::uuid, 'armazenamento', 'Armazenamento', 'memory'),
  (md5('qd-demo-category:perifericos')::uuid, 'perifericos', 'Periféricos', 'keyboard'),
  (md5('qd-demo-category:impressao')::uuid, 'impressao', 'Impressão', 'print')
ON CONFLICT (slug) DO UPDATE
SET label = EXCLUDED.label, icon = EXCLUDED.icon;

-- A mesma palavra-passe de demonstração é usada em todas as contas.
-- O hash foi gerado com bcrypt (12 rounds), como na aplicação.
INSERT INTO users (id, full_name, email, password_hash, phone, nif, account_type, role, status)
VALUES
  (md5('qd-demo-user:demo.admin@example.com')::uuid, 'Admin Demonstração QD', 'demo.admin@example.com', '$2b$12$uC2wu9PDPWFg2QdgI9Mjn.9/Oopm/x4NwdC412d0uKpPs02yqZnL.', '923900001', NULL, 'personal', 'admin', 'active'),
  (md5('qd-demo-user:demo.cliente1@example.com')::uuid, 'Ana Domingos', 'demo.cliente1@example.com', '$2b$12$uC2wu9PDPWFg2QdgI9Mjn.9/Oopm/x4NwdC412d0uKpPs02yqZnL.', '923900002', NULL, 'personal', 'customer', 'active'),
  (md5('qd-demo-user:demo.cliente2@example.com')::uuid, 'Bruno Manuel', 'demo.cliente2@example.com', '$2b$12$uC2wu9PDPWFg2QdgI9Mjn.9/Oopm/x4NwdC412d0uKpPs02yqZnL.', '923900003', NULL, 'personal', 'customer', 'active'),
  (md5('qd-demo-user:demo.cliente3@example.com')::uuid, 'Carla Joaquim', 'demo.cliente3@example.com', '$2b$12$uC2wu9PDPWFg2QdgI9Mjn.9/Oopm/x4NwdC412d0uKpPs02yqZnL.', '923900004', NULL, 'personal', 'customer', 'active'),
  (md5('qd-demo-user:demo.empresa@example.com')::uuid, 'Dário Comercial', 'demo.empresa@example.com', '$2b$12$uC2wu9PDPWFg2QdgI9Mjn.9/Oopm/x4NwdC412d0uKpPs02yqZnL.', '923900005', NULL, 'business', 'customer', 'active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO company (id, id_owner, name, nif, sector, status)
SELECT md5('qd-demo-company:qd-demo-tecnologia')::uuid, u.id,
       'QD Demo Tecnologia', '900000001', 'Tecnologia', 'active'
FROM users u WHERE u.email = 'demo.empresa@example.com'
ON CONFLICT (nif) DO NOTHING;

INSERT INTO user_company (id_user, id_company, role)
SELECT u.id, c.id, 'Proprietário'
FROM users u CROSS JOIN company c
WHERE u.email = 'demo.empresa@example.com' AND c.nif = '900000001'
ON CONFLICT (id_user, id_company) DO NOTHING;

INSERT INTO product (id, id_category, name, description, price, original_price, badge, status)
SELECT md5('qd-demo-product:' || seed.sku)::uuid,
       c.id, seed.name, seed.description, seed.price, seed.original_price,
       seed.badge, 'active'
FROM qd_demo_product_seed seed
JOIN category c ON c.slug = seed.category_slug
ON CONFLICT (id) DO UPDATE
SET id_category = EXCLUDED.id_category,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    badge = EXCLUDED.badge,
    status = EXCLUDED.status;

INSERT INTO product_image (id, id_product, url, display_order, width, height, format, size_bytes)
SELECT md5('qd-demo-product-image:' || seed.sku)::uuid,
       md5('qd-demo-product:' || seed.sku)::uuid,
       seed.image_url, 0, 1000, 750, 'jpg', 180000
FROM qd_demo_product_seed seed
ON CONFLICT (id) DO UPDATE
SET url = EXCLUDED.url, display_order = EXCLUDED.display_order,
    width = EXCLUDED.width, height = EXCLUDED.height,
    format = EXCLUDED.format, size_bytes = EXCLUDED.size_bytes;

INSERT INTO product_specification (id, product_id, spec_key, spec_value, display_order)
SELECT md5('qd-demo-product-spec:' || seed.sku)::uuid,
       md5('qd-demo-product:' || seed.sku)::uuid,
       'Referência', seed.sku, 0
FROM qd_demo_product_seed seed
ON CONFLICT (id) DO UPDATE
SET spec_key = EXCLUDED.spec_key, spec_value = EXCLUDED.spec_value,
    display_order = EXCLUDED.display_order;

INSERT INTO address
  (id, id_user, label, province, municipality, neighborhood, address, reference, is_default)
SELECT md5('qd-demo-address:' || u.email)::uuid,
       u.id,
       'Morada de demonstração',
       'Luanda',
       CASE u.email
         WHEN 'demo.cliente1@example.com' THEN 'Talatona'
         WHEN 'demo.cliente2@example.com' THEN 'Kilamba Kiaxi'
         WHEN 'demo.cliente3@example.com' THEN 'Viana'
         ELSE 'Ingombota'
       END,
       CASE u.email
         WHEN 'demo.cliente1@example.com' THEN 'Benfica'
         WHEN 'demo.cliente2@example.com' THEN 'Nova Vida'
         WHEN 'demo.cliente3@example.com' THEN 'Zango'
         ELSE 'Maculusso'
       END,
       'Endereço fictício usado apenas para demonstração.',
       'Dados de demonstração — não utilizar para entregas reais.',
       true
FROM users u
WHERE u.email IN (
  'demo.cliente1@example.com', 'demo.cliente2@example.com',
  'demo.cliente3@example.com', 'demo.empresa@example.com'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO delivery_type (id, name, description, price, type, is_active)
VALUES
  (md5('qd-demo-delivery:standard')::uuid, 'Entrega Demo Standard', 'Entrega de demonstração em 3 a 5 dias úteis.', 2500, 'standard', true),
  (md5('qd-demo-delivery:express')::uuid, 'Entrega Demo Express', 'Entrega de demonstração prioritária.', 5000, 'express', true),
  (md5('qd-demo-delivery:pickup')::uuid, 'Levantamento Demo', 'Levantamento de demonstração no ponto de recolha.', 0, 'pickup', true)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description,
    price = EXCLUDED.price, type = EXCLUDED.type, is_active = EXCLUDED.is_active;

INSERT INTO payment_method (id, name, type, is_active)
VALUES
  (md5('qd-demo-payment:express')::uuid, 'Demo Multicaixa Express', 'multicaixa_express', true),
  (md5('qd-demo-payment:reference')::uuid, 'Demo Multicaixa Referência', 'multicaixa_reference', true),
  (md5('qd-demo-payment:transfer')::uuid, 'Demo Transferência Bancária', 'bank_transfer', true)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, type = EXCLUDED.type, is_active = EXCLUDED.is_active;

INSERT INTO service (id, name, description, icon, starts_from_price, is_active)
VALUES
  (md5('qd-demo-service:assistencia')::uuid, 'Assistência técnica', 'Diagnóstico e reparação de computadores e dispositivos electrónicos.', 'screwdriver-wrench', 15000, true),
  (md5('qd-demo-service:instalacao')::uuid, 'Instalação de redes', 'Planeamento e instalação de redes Wi-Fi para casas e empresas.', 'wifi', 25000, true),
  (md5('qd-demo-service:consultoria')::uuid, 'Consultoria informática', 'Apoio na escolha de equipamentos e soluções tecnológicas.', 'laptop', NULL, true),
  (md5('qd-demo-service:configuracao')::uuid, 'Configuração de computadores', 'Montagem, configuração e optimização de computadores.', 'microchip', 20000, true)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, description = EXCLUDED.description,
    icon = EXCLUDED.icon, starts_from_price = EXCLUDED.starts_from_price,
    is_active = EXCLUDED.is_active;

-- Quatro destaques públicos ligados a produtos; a API deriva a imagem
-- e o destino do CTA do produto associado.
INSERT INTO highlight
  (id, placement, title, subtitle, label, cta_label, id_product, display_order, is_active, theme)
SELECT md5('qd-demo-highlight:' || seed.sku)::uuid,
       seed.placement,
       p.name,
       left(p.description, 255),
       seed.label,
       'Ver produto',
       p.id,
       seed.display_order,
       true,
       seed.theme
FROM (VALUES
  ('LAP-001', 'hero'::highlight_placement, 'Escolha da semana', 1, 'dark'),
  ('TEL-001', 'hero'::highlight_placement, 'Novidade', 2, 'light'),
  ('GAM-001', 'showcase'::highlight_placement, 'Gaming', 1, 'dark'),
  ('ACC-001', 'showcase'::highlight_placement, 'Áudio', 2, 'light')
) AS seed(sku, placement, label, display_order, theme)
JOIN product p ON p.id = md5('qd-demo-product:' || seed.sku)::uuid
ON CONFLICT (id) DO UPDATE
SET placement = EXCLUDED.placement, title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle, label = EXCLUDED.label,
    cta_label = EXCLUDED.cta_label, id_product = EXCLUDED.id_product,
    display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active,
    theme = EXCLUDED.theme;

INSERT INTO cart (id, id_user)
SELECT md5('qd-demo-cart:' || u.email)::uuid, u.id
FROM users u
WHERE u.email IN (
  'demo.cliente1@example.com', 'demo.cliente2@example.com',
  'demo.cliente3@example.com', 'demo.empresa@example.com'
)
ON CONFLICT (id_user) DO NOTHING;

INSERT INTO cart_item (id, id_cart, id_product, quantity, unit_price)
SELECT md5('qd-demo-cart-item:' || u.email || ':' || seed.sku)::uuid,
       c.id,
       md5('qd-demo-product:' || seed.sku)::uuid,
       seed.quantity,
       p.price
FROM (VALUES
  ('demo.cliente1@example.com', 'LAP-001', 1),
  ('demo.cliente1@example.com', 'ACC-001', 1),
  ('demo.cliente2@example.com', 'TEL-001', 1),
  ('demo.cliente2@example.com', 'PER-003', 1),
  ('demo.cliente3@example.com', 'GAM-002', 1),
  ('demo.empresa@example.com', 'CMP-002', 5)
) AS seed(email, sku, quantity)
JOIN users u ON u.email = seed.email
JOIN cart c ON c.id_user = u.id
JOIN product p ON p.id = md5('qd-demo-product:' || seed.sku)::uuid
WHERE NOT EXISTS (
  SELECT 1 FROM cart_item existing
  WHERE existing.id_cart = c.id AND existing.id_product = p.id
);

INSERT INTO wishlist (id, id_user, id_product)
SELECT md5('qd-demo-wishlist:' || seed.email || ':' || seed.sku)::uuid,
       u.id, md5('qd-demo-product:' || seed.sku)::uuid
FROM (VALUES
  ('demo.cliente1@example.com', 'TEL-001'),
  ('demo.cliente1@example.com', 'CAM-001'),
  ('demo.cliente2@example.com', 'LAP-004'),
  ('demo.cliente2@example.com', 'ACC-005'),
  ('demo.cliente3@example.com', 'GAM-003')
) AS seed(email, sku)
JOIN users u ON u.email = seed.email
ON CONFLICT (id_user, id_product) DO NOTHING;

INSERT INTO notification (id, id_user, type, message)
SELECT md5('qd-demo-notification:' || seed.email || ':' || seed.kind)::uuid,
       u.id, seed.kind::notification_type, seed.message
FROM (VALUES
  ('demo.cliente1@example.com', 'promotion', 'Aproveita as novidades de tecnologia da loja.'),
  ('demo.cliente1@example.com', 'system', 'Bem-vinda à demonstração da QD Store.'),
  ('demo.cliente2@example.com', 'order', 'A tua encomenda de demonstração está a ser preparada.'),
  ('demo.cliente3@example.com', 'newsletter', 'Consulta os produtos adicionados recentemente.'),
  ('demo.empresa@example.com', 'system', 'A conta empresarial de demonstração está activa.')
) AS seed(email, kind, message)
JOIN users u ON u.email = seed.email
ON CONFLICT (id) DO NOTHING;

-- Duas encomendas completas: uma entregue/paga e outra em preparação.
CREATE TEMP TABLE qd_demo_order_seed (
  reference text PRIMARY KEY,
  email text NOT NULL,
  company_nif text,
  order_type order_type NOT NULL,
  order_status order_status NOT NULL,
  payment_status order_payment_status NOT NULL,
  payment_type payment_method_type NOT NULL,
  delivery_name text NOT NULL,
  address_label text NOT NULL
) ON COMMIT DROP;

INSERT INTO qd_demo_order_seed
  (reference, email, company_nif, order_type, order_status, payment_status, payment_type, delivery_name, address_label)
VALUES
  ('QD-DEMO-2026-0001', 'demo.cliente1@example.com', NULL, 'personal', 'delivered', 'confirmed', 'multicaixa_express', 'Entrega Demo Express', 'Morada de demonstração'),
  ('QD-DEMO-2026-0002', 'demo.empresa@example.com', '900000001', 'business', 'processing', 'pending', 'bank_transfer', 'Levantamento Demo', 'Morada de demonstração');

CREATE TEMP TABLE qd_demo_order_item_seed (
  reference text NOT NULL,
  sku text NOT NULL,
  quantity integer NOT NULL,
  PRIMARY KEY (reference, sku)
) ON COMMIT DROP;

INSERT INTO qd_demo_order_item_seed (reference, sku, quantity)
VALUES
  ('QD-DEMO-2026-0001', 'LAP-001', 1),
  ('QD-DEMO-2026-0001', 'ACC-002', 1),
  ('QD-DEMO-2026-0002', 'CMP-002', 5),
  ('QD-DEMO-2026-0002', 'PER-003', 2);

INSERT INTO orders
  (id, reference, id_user, id_company, type, status, id_payment_method, id_delivery_type, total, company_snapshot)
SELECT md5('qd-demo-order:' || seed.reference)::uuid,
       seed.reference, u.id, c.id, seed.order_type, seed.order_status,
       pm.id, dt.id,
       SUM(p.price * item.quantity) + dt.price,
       CASE WHEN c.id IS NULL THEN NULL
            ELSE jsonb_build_object('name', c.name, 'nif', c.nif, 'sector', c.sector)
       END
FROM qd_demo_order_seed seed
JOIN users u ON u.email = seed.email
LEFT JOIN company c ON c.nif = seed.company_nif
JOIN payment_method pm ON pm.type = seed.payment_type AND pm.name LIKE 'Demo %'
JOIN delivery_type dt ON dt.name = seed.delivery_name
JOIN qd_demo_order_item_seed item ON item.reference = seed.reference
JOIN product p ON p.id = md5('qd-demo-product:' || item.sku)::uuid
GROUP BY seed.reference, u.id, c.id, seed.order_type, seed.order_status,
         pm.id, dt.id, dt.price, c.name, c.nif, c.sector
ON CONFLICT (reference) DO NOTHING;

INSERT INTO order_address
  (id, id_order, id_address_origin, province, municipality, neighborhood, address, reference, snapshot_at)
SELECT md5('qd-demo-order-address:' || seed.reference)::uuid,
       o.id, a.id, a.province, a.municipality, a.neighborhood, a.address, a.reference, NOW()
FROM qd_demo_order_seed seed
JOIN orders o ON o.reference = seed.reference
JOIN users u ON u.email = seed.email
JOIN address a ON a.id_user = u.id AND a.label = seed.address_label
ON CONFLICT (id_order) DO NOTHING;

INSERT INTO order_item (id, id_order, id_product, quantity, unit_price, subtotal)
SELECT md5('qd-demo-order-item:' || seed.reference || ':' || item.sku)::uuid,
       o.id, p.id, item.quantity, p.price, p.price * item.quantity
FROM qd_demo_order_item_seed item
JOIN qd_demo_order_seed seed ON seed.reference = item.reference
JOIN orders o ON o.reference = seed.reference
JOIN product p ON p.id = md5('qd-demo-product:' || item.sku)::uuid
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_payment
  (id, id_order, id_payment_method, status, amount, amount_paid, paid_at)
SELECT md5('qd-demo-order-payment:' || seed.reference)::uuid,
       o.id, pm.id, seed.payment_status, o.total,
       CASE WHEN seed.payment_status = 'confirmed' THEN o.total ELSE NULL END,
       CASE WHEN seed.payment_status = 'confirmed' THEN NOW() - INTERVAL '2 days' ELSE NULL END
FROM qd_demo_order_seed seed
JOIN orders o ON o.reference = seed.reference
JOIN payment_method pm ON pm.type = seed.payment_type AND pm.name LIKE 'Demo %'
ON CONFLICT (id) DO NOTHING;

INSERT INTO payment_detail (id, id_order_payment, method_type, customer_phone)
SELECT md5('qd-demo-payment-detail:' || seed.reference)::uuid,
       op.id, seed.payment_type, u.phone
FROM qd_demo_order_seed seed
JOIN orders o ON o.reference = seed.reference
JOIN users u ON u.email = seed.email
JOIN order_payment op ON op.id_order = o.id
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_history (id, id_order, previous_status, new_status, note)
SELECT md5('qd-demo-order-history:' || seed.reference)::uuid,
       o.id, NULL, seed.order_status, 'Registo de demonstração.'
FROM qd_demo_order_seed seed
JOIN orders o ON o.reference = seed.reference
ON CONFLICT (id) DO NOTHING;

-- Verificação rápida do catálogo criado.
SELECT
  (SELECT COUNT(*) FROM product WHERE id IN (
    SELECT md5('qd-demo-product:' || sku)::uuid
    FROM (VALUES
      ('LAP-001'), ('TEL-001'), ('GAM-001'), ('ACC-001')
    ) AS demo_products(sku)
  )) AS produtos_demo,
  (SELECT COUNT(*) FROM category WHERE slug IN (
    'portateis', 'smartphones', 'acessorios', 'componentes', 'gaming',
    'redes', 'camaras', 'armazenamento', 'perifericos', 'impressao'
  )) AS categorias_demo,
  (SELECT COUNT(*) FROM highlight WHERE id IN (
    SELECT md5('qd-demo-highlight:' || sku)::uuid
    FROM (VALUES
      ('LAP-001'), ('TEL-001'), ('GAM-001'), ('ACC-001')
    ) AS demo_highlights(sku)
  )) AS destaques_demo;

COMMIT;
