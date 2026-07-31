export interface CreateProviderOrderResult {
  providerOrderId: string;
  amount: number;
  currency: string;
}

export interface IPaymentProvider {
  readonly providerName: string;
  createOrder(
    amount: number,
    currency: string,
    receipt: string,
  ): Promise<CreateProviderOrderResult>;
  verifySignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean;
  verifyWebhookSignature(
    rawBody: string,
    signature: string,
    secret: string,
  ): boolean;
}
