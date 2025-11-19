import { Resend } from 'resend';
import { getDictionary } from '../i18n/i18n';
import type { AppLocale } from '../i18n/i18n-config';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error('RESEND_API_KEY is not set');
  }
  return new Resend(key);
}

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
      : 'azizbek.dev.ac@gmail.com'; //Resend free plan only allows sending to verified email addresses. 
      // you can replace with actual customer email if you have a paid plan
    
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
    const { OrderConfirmationEmail } = await import('../../emails/OrderConfirmation');
    const { data: emailData, error } = await getResend().emails.send({
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
    // For development/production, send to verified email address
    const recipientEmail = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production'
      ? 'azizbek.dev.ac@gmail.com' 
      : 'azizbek.dev.ac@gmail.com'; //Resend free plan only allows sending to verified email addresses. 
      // you can replace with actual customer email if you have a paid plan
    
    const subject = await translateEmailString(`i18n.email.orderUpdate|${orderId}`, locale);
    const { OrderStatusUpdateEmail } = await import('../../emails/OrderStatusUpdate');
    const { data: emailData, error } = await getResend().emails.send({
      from: 'Trainium <onboarding@resend.dev>',
      to: [recipientEmail],
      subject,
      react: OrderStatusUpdateEmail({
        orderId,
        customerEmail,
        customerName,
        status,
        trackingNumber,
        locale,
      }),
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
