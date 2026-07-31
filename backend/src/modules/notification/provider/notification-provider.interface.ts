export interface SendNotificationResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface INotificationProvider {
  readonly providerName: string;
  send(
    recipient: string,
    subject: string,
    body: string,
    metadata?: Record<string, unknown>,
  ): Promise<SendNotificationResult>;
}
