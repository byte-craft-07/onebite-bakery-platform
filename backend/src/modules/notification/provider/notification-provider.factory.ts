import type { NotificationProviderType } from "../constants/index.js";
import { EmailProvider } from "./email.provider.js";
import { InAppProvider } from "./in-app.provider.js";
import type { INotificationProvider } from "./notification-provider.interface.js";
import { WhatsAppProvider } from "./whatsapp.provider.js";

export class NotificationProviderFactory {
  private readonly inAppProvider = new InAppProvider();
  private readonly emailProvider = new EmailProvider();
  private readonly whatsappProvider = new WhatsAppProvider();

  public getProvider(provider: NotificationProviderType): INotificationProvider {
    if (provider === "IN_APP") {
      return this.inAppProvider;
    }

    if (provider === "WHATSAPP") {
      return this.whatsappProvider;
    }

    return this.emailProvider;
  }
}
