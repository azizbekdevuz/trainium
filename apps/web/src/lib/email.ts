import { Resend } from 'resend';
import { getDictionary } from './i18n';
import type { AppLocale } from './i18n-config';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface OrderEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  items: Array<{
    name: string;
    sku?: string;
    qty: number;
    priceCents: number;
  }>;
  subtotalCents: number;
  totalCents: number;
  currency: string;
  shippingAddress?: {
    fullName: string;
    phone: string;
    address1: string;
    address2?: string | null;
    city: string;
    state?: string | null;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
  trackingNumber?: string;
  carrier?: string;
  locale?: AppLocale;
}

async function translateEmailString(raw: string, locale: AppLocale = 'en'): Promise<string> {
  if (!raw || typeof raw !== 'string') return raw as any;
  const dict = await getDictionary(locale);
  const getByPath = (obj: any, p: string): unknown => p.split('.').reduce((a, k) => (a && typeof a === 'object' ? a[k] : undefined), obj);
  const renderToken = (token: string): string => {
    if (!token.startsWith('i18n.')) return token;
    const [keyPath, ...params] = token.split('|');
    const tpl = getByPath(dict, keyPath.replace(/^i18n\./, ''));
    if (typeof tpl !== 'string') return token;
    let template: string = tpl;
    // Optional segments: {{i, optional, prefix= X , suffix= Y}}
    template = template.replace(/\{\{(\d+),\s*optional(?:,\s*prefix=\s*([^}|]+))?(?:\s*,\s*suffix=\s*([^}]+))?\s*\}\}/g, (_m: string, idxStr: string, pre?: string, suf?: string) => {
      const idx: number = Number(idxStr);
      const val = params[idx] ?? '';
      if (!val) return '';
      return `${pre ?? ''}${val}${suf ?? ''}`;
    });
    // Positional params: {{i}}
    template = template.replace(/\{\{(\d+)\}\}/g, (_m: string, idxStr: string) => {
      const idx: number = Number(idxStr);
      return params[idx] ?? '';
    });
    return template;
  };
  // Support multi-line strings built from multiple tokens
  return raw
    .split('\n')
    .map((line) => (line.startsWith('i18n.') ? renderToken(line) : line))
    .join('\n');
}

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  try {
    // For development, send to verified email address
    const recipientEmail = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production'
      ? 'azizbek.dev.ac@gmail.com' 
      : data.customerEmail;
    
    console.log('📧 Sending order confirmation email:', {
      originalRecipient: data.customerEmail,
      actualRecipient: recipientEmail,
      orderId: data.orderId,
      environment: process.env.NODE_ENV,
      currency: data.currency,
      totalCents: data.totalCents,
      subtotalCents: data.subtotalCents
    });
    
    const subjectRaw = `i18n.email.orderConfirmation|${data.orderId}`;
    const subject = await translateEmailString(subjectRaw, data.locale ?? 'en');
    const { OrderConfirmationEmail } = await import('../emails/OrderConfirmation');
    const { data: emailData, error } = await resend.emails.send({
      from: 'Trainium <onboarding@resend.dev>',
      to: [recipientEmail],
      subject,
      react: OrderConfirmationEmail(data as any),
    });

    if (error) {
      console.error('Failed to send order confirmation email:', error);
      return { success: false, error };
    }

    console.log('Order confirmation email sent successfully:', emailData);
    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, error };
  }
}

export async function sendOrderStatusUpdateEmail(
  orderId: string,
  customerEmail: string,
  customerName: string,
  status: string,
  trackingNumber?: string,
  locale: AppLocale = 'en'
) {
  try {
    // For development, send to verified email address
    const recipientEmail = process.env.NODE_ENV === 'development' 
      ? 'azizbek.dev.ac@gmail.com' 
      : customerEmail;
    
    const subject = await translateEmailString(`i18n.email.orderUpdate|${orderId}`, locale);
    let messageRaw = `i18n.email.hello|${customerName}\n\n`;
    
    switch (status) {
      case 'SHIPPED':
        messageRaw += `i18n.email.automated\n\ni18n.email.shipped|${orderId}`;
        if (trackingNumber) {
          messageRaw += `\n\ni18n.email.trackingNumber|${trackingNumber}`;
        }
        messageRaw += `\n\ni18n.email.trackAt|https://trainium.shop/account/orders/${orderId}`;
        break;
      case 'DELIVERED':
        messageRaw += `i18n.email.automated\n\ni18n.email.delivered|${orderId}`;
        messageRaw += `\n\ni18n.email.thanks`;
        break;
      case 'CANCELLED':
        messageRaw += `i18n.email.automated\n\ni18n.email.cancelled|${orderId}`;
        messageRaw += `\n\ni18n.email.contactSupport`;
        break;
      default:
        messageRaw += `i18n.email.automated\n\ni18n.email.statusUpdated|${orderId}|${status}`;
    }
    const message = await translateEmailString(messageRaw, locale);

    const { data: emailData, error } = await resend.emails.send({
      from: 'Trainium <onboarding@resend.dev>',
      to: [recipientEmail],
      subject,
      text: message,
    });

    if (error) {
      console.error('Failed to send order status update email:', error);
      return { success: false, error };
    }

    console.log('Order status update email sent successfully:', emailData);
    return { success: true, data: emailData };
  } catch (error) {
    console.error('Error sending order status update email:', error);
    return { success: false, error };
  }
}
