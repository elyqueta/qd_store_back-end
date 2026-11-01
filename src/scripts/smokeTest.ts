interface ApiEnvelope<T> {
  status: string;
  data: T;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiResult<T> {
  response: Response;
  body: T | undefined;
}

interface RequestOptions {
  method?: string;
  token?: string;
  body?: unknown;
}

interface AuthData {
  accessToken: string;
  refreshToken: string;
}

interface Product {
  id: string;
  price: number;
  status: 'active' | 'inactive' | 'out_of_stock';
}

interface CartItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface Cart {
  id: string;
  items: CartItem[];
  itemsCount: number;
  total: number;
}

interface DeliveryType {
  id: string;
}

interface PaymentMethod {
  id: string;
  type: 'multicaixa_express' | 'multicaixa_reference' | 'bank_transfer';
}

interface Address {
  id: string;
  isDefault: boolean;
}

interface Order {
  id: string;
  status: string;
  total: number;
  payment: { id: string; status: string } | null;
}

interface Payment {
  id: string;
  status: string;
  details: {
    reference?: string;
  };
}

const apiUrl = (process.env.API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const versionPrefix = '/api/v1';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function requireValue<T>(value: T | null | undefined, name: string): T {
  if (value === undefined || value === null) {
    throw new Error(`${name} não foi devolvido pela API.`);
  }
  return value;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const headers = new Headers();
  if (options.body !== undefined) {
    headers.set('content-type', 'application/json');
  }
  if (options.token) {
    headers.set('authorization', `Bearer ${options.token}`);
  }
  const response = await fetch(`${apiUrl}${path}`, {
    method: options.method ?? 'GET',
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });
  let body: T | undefined;
  if (response.status !== 204) {
    body = (await response.json()) as T;
  }
  return { response, body };
}

function expectStatus<T>(
  result: ApiResult<T>,
  expected: number,
  description: string
): T | undefined {
  assert(
    result.response.status === expected,
    `${description}: esperado HTTP ${expected}, recebido ${result.response.status}.`
  );
  return result.body;
}

async function step(name: string, action: () => Promise<void>): Promise<void> {
  try {
    await action();
    console.warn(`✔ ${name}`);
  } catch (error) {
    console.warn(`✘ ${name}: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async function login(email: string): Promise<string> {
  const result = await request<ApiEnvelope<AuthData>>(`${versionPrefix}/auth/login`, {
    method: 'POST',
    body: { email, password: 'Teste1234' },
  });
  const body = requireValue(expectStatus(result, 200, `Login ${email}`), 'Resposta do login');
  return requireValue(body.data.accessToken, 'accessToken');
}

async function run(): Promise<void> {
  let accessToken = '';
  let adminToken = '';
  let productId = '';
  let productPrice = 0;
  let deliveryTypeId = '';
  let expressMethodId = '';
  let referenceMethodId = '';
  let addressId = '';
  let firstOrderId = '';
  let referencePaymentId = '';

  await step('Health check e ligação à base de dados', async () => {
    const result = await request<{ database: string }>('/health');
    const body = requireValue(expectStatus(result, 200, 'Health check'), 'Health check');
    assert(
      body.database === 'connected',
      'O health check não confirmou a ligação à base de dados.'
    );
  });

  await step('Login do utilizador de teste', async () => {
    accessToken = await login('joao.silva@example.com');
  });

  await step('Obter produto activo do catálogo', async () => {
    const result = await request<ApiEnvelope<Product[]> & { pagination?: { total: number } }>(
      `${versionPrefix}/products?limit=5`
    );
    const body = requireValue(expectStatus(result, 200, 'Listagem de produtos'), 'Produtos');
    const product = body.data.find((entry) => entry.status === 'active');
    assert(body.data.length > 0, 'O catálogo não devolveu produtos.');
    assert(product, 'Nenhum dos primeiros cinco produtos está activo.');
    productId = product.id;
    productPrice = product.price;
  });

  await step('Adicionar 2 unidades ao carrinho e validar o total', async () => {
    const clearResult = await request<undefined>(`${versionPrefix}/cart`, {
      method: 'DELETE',
      token: accessToken,
    });
    expectStatus(clearResult, 204, 'Limpar carrinho');
    const addResult = await request<ApiEnvelope<Cart>>(`${versionPrefix}/cart/items`, {
      method: 'POST',
      token: accessToken,
      body: { productId, quantity: 2 },
    });
    expectStatus(addResult, 201, 'Adicionar produto ao carrinho');
    const cartResult = await request<ApiEnvelope<Cart>>(`${versionPrefix}/cart`, {
      token: accessToken,
    });
    const cart = requireValue(expectStatus(cartResult, 200, 'Consultar carrinho'), 'Carrinho').data;
    assert(cart.itemsCount === 2, `itemsCount esperado 2, recebido ${cart.itemsCount}.`);
    const expectedTotalCents = Math.round(productPrice * 100) * 2;
    assert(
      Math.round(cart.total * 100) === expectedTotalCents,
      `Total do carrinho inesperado: ${cart.total}.`
    );
  });

  await step('Obter entrega, Multicaixa Express e endereço padrão', async () => {
    const [deliveryResult, methodsResult, addressesResult] = await Promise.all([
      request<ApiEnvelope<DeliveryType[]>>(`${versionPrefix}/delivery-types`),
      request<ApiEnvelope<PaymentMethod[]>>(`${versionPrefix}/payment-methods`),
      request<ApiEnvelope<Address[]>>(`${versionPrefix}/addresses`, { token: accessToken }),
    ]);
    const delivery = requireValue(
      expectStatus(deliveryResult, 200, 'Tipos de entrega'),
      'Tipos de entrega'
    ).data[0];
    const methods = requireValue(
      expectStatus(methodsResult, 200, 'Métodos de pagamento'),
      'Métodos de pagamento'
    ).data;
    const addressList = requireValue(
      expectStatus(addressesResult, 200, 'Endereços'),
      'Endereços'
    ).data;
    deliveryTypeId = requireValue(delivery, 'Tipo de entrega').id;
    expressMethodId = requireValue(
      methods.find((method) => method.type === 'multicaixa_express'),
      'Método Multicaixa Express'
    ).id;
    referenceMethodId = requireValue(
      methods.find((method) => method.type === 'multicaixa_reference'),
      'Método Multicaixa Referência'
    ).id;
    addressId = requireValue(
      addressList.find((address) => address.isDefault),
      'Endereço padrão'
    ).id;
  });

  await step('Criar encomenda e confirmar que o carrinho ficou vazio', async () => {
    const result = await request<ApiEnvelope<Order>>(`${versionPrefix}/orders`, {
      method: 'POST',
      token: accessToken,
      body: { deliveryTypeId, paymentMethodId: expressMethodId, addressId },
    });
    const order = requireValue(expectStatus(result, 201, 'Criar encomenda'), 'Encomenda').data;
    assert(order.status === 'processing', 'A encomenda não ficou em processamento.');
    firstOrderId = order.id;
    const cartResult = await request<ApiEnvelope<Cart>>(`${versionPrefix}/cart`, {
      token: accessToken,
    });
    const cart = requireValue(
      expectStatus(cartResult, 200, 'Carrinho após encomenda'),
      'Carrinho'
    ).data;
    assert(cart.itemsCount === 0, 'O carrinho não foi esvaziado após criar a encomenda.');
  });

  await step('Pagar encomenda por Multicaixa Express simulado', async () => {
    const result = await request<ApiEnvelope<Payment>>(
      `${versionPrefix}/orders/${firstOrderId}/payments`,
      {
        method: 'POST',
        token: accessToken,
        body: { methodType: 'multicaixa_express', customerPhone: '923111111' },
      }
    );
    const payment = requireValue(expectStatus(result, 201, 'Pagamento Express'), 'Pagamento').data;
    assert(payment.status === 'confirmed', `Pagamento Express ficou ${payment.status}.`);
  });

  await step('Consultar encomenda com pagamento confirmado', async () => {
    const result = await request<ApiEnvelope<Order>>(`${versionPrefix}/orders/${firstOrderId}`, {
      token: accessToken,
    });
    const order = requireValue(expectStatus(result, 200, 'Consultar encomenda'), 'Encomenda').data;
    assert(order.payment?.status === 'confirmed', 'A encomenda não mostra pagamento confirmado.');
  });

  await step('Criar segunda encomenda com pagamento por Referência', async () => {
    const addResult = await request<ApiEnvelope<Cart>>(`${versionPrefix}/cart/items`, {
      method: 'POST',
      token: accessToken,
      body: { productId, quantity: 1 },
    });
    expectStatus(addResult, 201, 'Adicionar produto para segunda encomenda');
    const orderResult = await request<ApiEnvelope<Order>>(`${versionPrefix}/orders`, {
      method: 'POST',
      token: accessToken,
      body: { deliveryTypeId, paymentMethodId: referenceMethodId, addressId },
    });
    const order = requireValue(
      expectStatus(orderResult, 201, 'Criar segunda encomenda'),
      'Encomenda'
    ).data;
    const paymentResult = await request<ApiEnvelope<Payment>>(
      `${versionPrefix}/orders/${order.id}/payments`,
      {
        method: 'POST',
        token: accessToken,
        body: { methodType: 'multicaixa_reference' },
      }
    );
    const payment = requireValue(
      expectStatus(paymentResult, 201, 'Pagamento por Referência'),
      'Pagamento'
    ).data;
    assert(payment.status === 'pending', 'Pagamento por Referência não ficou pendente.');
    assert(/^\d{9}$/.test(payment.details.reference ?? ''), 'Referência não tem nove dígitos.');
    referencePaymentId = payment.id;
    const cartResult = await request<ApiEnvelope<Cart>>(`${versionPrefix}/cart`, {
      token: accessToken,
    });
    assert(
      requireValue(expectStatus(cartResult, 200, 'Carrinho após segunda encomenda'), 'Carrinho')
        .data.itemsCount === 0,
      'O carrinho não ficou vazio após a segunda encomenda.'
    );
  });

  await step('Admin confirma pagamento por Referência', async () => {
    adminToken = await login('admin@qd.co.ao');
    const result = await request<ApiEnvelope<Payment>>(
      `${versionPrefix}/admin/payments/${referencePaymentId}/confirm`,
      { method: 'POST', token: adminToken }
    );
    const payment = requireValue(
      expectStatus(result, 200, 'Confirmar Referência'),
      'Pagamento'
    ).data;
    assert(payment.status === 'confirmed', 'O administrador não confirmou o pagamento.');
  });

  await step('Verificações de autenticação, autorização e posse', async () => {
    const anonymous = await request<unknown>(`${versionPrefix}/orders`);
    expectStatus(anonymous, 401, 'Pedidos sem token');
    const customerAdmin = await request<unknown>(`${versionPrefix}/admin/orders`, {
      token: accessToken,
    });
    expectStatus(customerAdmin, 403, 'Área administrativa com conta de cliente');
    const mariaToken = await login('maria.santos@example.com');
    const otherOrder = await request<unknown>(`${versionPrefix}/orders/${firstOrderId}`, {
      token: mariaToken,
    });
    expectStatus(otherOrder, 404, 'Encomenda de outro utilizador');
  });
}

run().catch((error: unknown) => {
  console.warn(
    `✘ Smoke test interrompido: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exitCode = 1;
});
