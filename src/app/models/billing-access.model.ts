export interface BillingAccessResponse {
  allowed: boolean;
  warning?: boolean;
  type?: 'NONE' | 'PRE_DUE' | 'POST_DUE' | 'BLOCKED' | string;
  diasVencimento?: number;
  diasVencidos?: number;
  days?: number;
  message?: string;
  expiresAt?: string | null;
  checkoutUrl?: string | null;
  statusAssinatura?: string | null;
  empresaId?: number | null;
  planoId?: number | null;
  proprietario?: boolean | null;
  modulos?: unknown;
  modulosHabilitados?: unknown;
  modules?: unknown;
  enabledModules?: unknown;
  features?: unknown;
  returnUrl?: string;
}

export interface ErrorResponseWithBilling {
  status: number;
  error: string;
  message: string;
  path: string;
  billing?: BillingAccessResponse;
}

export interface CheckoutResponse {
  provider: 'ASAAS' | 'MERCADOPAGO' | string;
  paymentId?: string;
  initPoint?: string;
  invoiceUrl?: string;
  paymentReference?: string;
}
